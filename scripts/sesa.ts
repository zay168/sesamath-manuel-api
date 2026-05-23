import { spawn } from "node:child_process";
import { buildIndex } from "../src/sesamath/build";
import { DEFAULT_OUVRAGE, OUVRAGE_PRESETS, defaultRangeForOuvrage } from "../src/sesamath/constants";
import { writeExerciseCrop, writeUpscaledPageImage } from "../src/sesamath/crop";
import { ManifestRepository } from "../src/sesamath/repository";

const args = process.argv.slice(2);

const readOption = (names: string[], fallback?: string): string | undefined => {
  const index = args.findIndex((arg) => names.includes(arg));
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
};

const readNumberOption = (names: string[], fallback: number): number => {
  const raw = readOption(names);
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Argument numerique invalide: ${names.join("/")}`);
  }
  return value;
};

const parsePage = (raw?: string): number => {
  const match = raw?.match(/^p?(\d+)$/i);
  if (!match) {
    throw new Error("Page attendue sous la forme p256 ou 256.");
  }
  return Number(match[1]);
};

const parseExercise = (raw?: string): number => {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error("Numero d'exercice attendu, par exemple 60.");
  }
  return value;
};

const openFile = (target: string): void => {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", target], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [target], { detached: true, stdio: "ignore" }).unref();
};

const ensurePageIndexed = async (ouvrage: string, page: number): Promise<ManifestRepository> => {
  const repository = new ManifestRepository(ouvrage);
  const exerciseCount = repository.hasManifest() ? repository.exercises({ page }).length : 0;
  if (exerciseCount > 0) {
    return repository;
  }

  console.log(`Index local incomplet: construction de ${ouvrage} page ${page}...`);
  await buildIndex({ ouvrage, firstPage: page, lastPage: page, force: false, quiet: true });
  repository.clearCache();
  return repository;
};

const command = args[0] ?? "help";
const ouvrage = readOption(["--ouvrage", "--book"], DEFAULT_OUVRAGE)!;
const scale = readNumberOption(["--scale"], 5);
const shouldOpen = args.includes("--open");

const run = async () => {
  if (command === "books") {
    for (const preset of OUVRAGE_PRESETS) {
      console.log(`${preset.id.padEnd(14)} ${preset.title} (${preset.firstPage}-${preset.lastPage})`);
    }
    console.log("\nOuvrage non liste ? Utilise --ouvrage <id> avec --from et --to.");
    return;
  }

  if (command === "index") {
    const fromRaw = readOption(["--from"]);
    const toRaw = readOption(["--to"]);
    const defaultRange = fromRaw && toRaw ? { firstPage: Number(fromRaw), lastPage: Number(toRaw) } : defaultRangeForOuvrage(ouvrage);
    const from = readNumberOption(["--from"], defaultRange.firstPage);
    const to = readNumberOption(["--to"], defaultRange.lastPage);
    await buildIndex({ ouvrage, firstPage: from, lastPage: to, force: args.includes("--force") });
    return;
  }

  if (command === "ex") {
    const exercise = parseExercise(args[1]);
    const page = parsePage(args[2]);
    const repository = await ensurePageIndexed(ouvrage, page);
    const record = repository.exerciseOrThrow(exercise, page);
    const output = await writeExerciseCrop(record, scale);
    console.log(output);
    if (shouldOpen) {
      openFile(output);
    }
    return;
  }

  if (command === "page") {
    const page = parsePage(args[1]);
    const repository = await ensurePageIndexed(ouvrage, page);
    const record = repository.page(page);
    if (!record) {
      throw new Error(`Page ${page} introuvable dans ${ouvrage}.`);
    }
    const output = await writeUpscaledPageImage(record, Math.min(scale, 3));
    console.log(output);
    if (shouldOpen) {
      openFile(output);
    }
    return;
  }

  console.log(`Sesamath local CLI

Commandes:
  npm run sesa -- ex 60 p256 --open
  npm run sesa -- page p256 --open
  npm run sesa -- index --ouvrage ms2_2019 --from 189 --to 268
  npm run sesa -- books

Options:
  --ouvrage <id>   Ouvrage Sesamath, defaut ${DEFAULT_OUVRAGE}
  --scale <n>      Upscale PNG, defaut 5
  --open           Ouvre le fichier genere`);
};

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
