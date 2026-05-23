import fs from "node:fs/promises";
import path from "node:path";
import { CHAPTERS, DEFAULT_FIRST_PAGE, DEFAULT_LAST_PAGE, DEFAULT_OUVRAGE, pageImageUrl, sourcePageUrl } from "../src/sesamath/constants";
import { dataPath } from "../src/sesamath/paths";
import { extractAtomIndex, extractExerciseRects, extractPages } from "../src/sesamath/parser";
import type { BuildOptions, ExerciseRecord, Manifest, PageRecord } from "../src/sesamath/types";

const args = process.argv.slice(2);

const readNumberArg = (name: string, fallback: number): number => {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = Number(args[index + 1]);
  if (!Number.isFinite(value)) {
    throw new Error(`Argument invalide pour ${name}`);
  }
  return value;
};

const options: BuildOptions = {
  ouvrage: DEFAULT_OUVRAGE,
  firstPage: readNumberArg("--from", DEFAULT_FIRST_PAGE),
  lastPage: readNumberArg("--to", DEFAULT_LAST_PAGE),
  force: args.includes("--force"),
};

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const exists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const download = async (url: string, filePath: string, force: boolean): Promise<void> => {
  if (!force && (await exists(filePath))) {
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Téléchargement impossible ${url}: ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, bytes);
};

const uniqueBy = <T>(items: T[], keyOf: (item: T) => string): T[] => {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(keyOf(item), item);
  }
  return [...map.values()];
};

const main = async () => {
  const htmlDir = dataPath(options.ouvrage, "html");
  const pagesDir = dataPath(options.ouvrage, "pages");
  await ensureDir(htmlDir);
  await ensureDir(pagesDir);

  console.log(`Indexation ${options.ouvrage}, pages ${options.firstPage}-${options.lastPage}`);

  for (let page = options.firstPage; page <= options.lastPage; page += 1) {
    await download(sourcePageUrl(options.ouvrage, page), path.join(htmlDir, `p${page}.html`), options.force);
    await download(pageImageUrl(options.ouvrage, page), path.join(pagesDir, `p${page}.gif`), options.force);
    if (page % 25 === 0 || page === options.lastPage) {
      console.log(`  pages traitées jusqu'à ${page}`);
    }
  }

  const htmlFiles = await fs.readdir(htmlDir);
  const htmlByPage = await Promise.all(
    htmlFiles
      .filter((file) => /^p\d+\.html$/.test(file))
      .map(async (file) => ({
        requestedPage: Number(file.match(/\d+/)?.[0]),
        html: await fs.readFile(path.join(htmlDir, file), "utf8"),
      })),
  );

  const atomIndex = new Map<string, ReturnType<typeof extractAtomIndex> extends Map<string, infer T> ? T : never>();
  for (const { html } of htmlByPage) {
    for (const [atome, meta] of extractAtomIndex(html)) {
      if (!atomIndex.has(atome)) {
        atomIndex.set(atome, meta);
      }
    }
  }

  const pages: PageRecord[] = [];
  const exercises: ExerciseRecord[] = [];

  for (const { requestedPage, html } of htmlByPage) {
    pages.push(
      ...extractPages(options.ouvrage, requestedPage, html).filter((page) => {
        return page.pageNumber >= options.firstPage && page.pageNumber <= options.lastPage;
      }),
    );
    exercises.push(
      ...extractExerciseRects(options.ouvrage, html, atomIndex).filter((exercise) => {
        return exercise.pageNumber >= options.firstPage && exercise.pageNumber <= options.lastPage;
      }),
    );
  }

  const manifest: Manifest = {
    ouvrage: options.ouvrage,
    builtAt: new Date().toISOString(),
    source: {
      baseUrl: "https://manuel.sesamath.net",
      firstPage: options.firstPage,
      lastPage: options.lastPage,
    },
    chapters: CHAPTERS,
    pages: uniqueBy(pages, (page) => String(page.pageNumber)).sort((a, b) => a.pageNumber - b.pageNumber),
    exercises: uniqueBy(exercises, (exercise) => `${exercise.atome}|${exercise.pageNumber}`).sort((a, b) => {
      return a.pageNumber - b.pageNumber || a.exerciseNumber - b.exerciseNumber;
    }),
  };

  await fs.writeFile(dataPath(options.ouvrage, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Manifest écrit: ${manifest.pages.length} pages, ${manifest.exercises.length} exercices.`);
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
