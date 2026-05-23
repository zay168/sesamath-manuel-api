import { DEFAULT_OUVRAGE, defaultRangeForOuvrage } from "../src/sesamath/constants";
import { buildIndex } from "../src/sesamath/build";
import type { BuildOptions } from "../src/sesamath/types";

const args = process.argv.slice(2);

const readStringArg = (names: string[], fallback?: string): string | undefined => {
  const index = args.findIndex((arg) => names.includes(arg));
  if (index === -1) {
    return fallback;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Argument manquant pour ${args[index]}`);
  }
  return value;
};

const readNumberArg = (names: string[], fallback?: number): number | undefined => {
  const value = readStringArg(names);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Argument invalide pour ${names.join("/")}`);
  }
  return parsed;
};

const ouvrage = readStringArg(["--ouvrage", "--book"], DEFAULT_OUVRAGE)!;
const page = readNumberArg(["--page", "-p"]);
const fromArg = readNumberArg(["--from"]);
const toArg = readNumberArg(["--to"]);
const defaultRange =
  page !== undefined
    ? { firstPage: page, lastPage: page }
    : fromArg !== undefined && toArg !== undefined
      ? { firstPage: fromArg, lastPage: toArg }
      : defaultRangeForOuvrage(ouvrage);

const options: BuildOptions = {
  ouvrage,
  firstPage: fromArg ?? defaultRange.firstPage,
  lastPage: toArg ?? defaultRange.lastPage,
  force: args.includes("--force"),
};

void buildIndex(options).catch((error) => {
  console.error(error);
  process.exit(1);
});
