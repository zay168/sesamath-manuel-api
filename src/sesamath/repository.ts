import fs from "node:fs";
import path from "node:path";
import type { ChapterId, ExerciseRecord, Manifest, PageRecord } from "./types";
import { DEFAULT_OUVRAGE } from "./constants";
import { dataPath } from "./paths";

export class ManifestRepository {
  private manifestCache: Manifest | null = null;

  constructor(private readonly ouvrage = DEFAULT_OUVRAGE) {}

  manifestPath(): string {
    return dataPath(this.ouvrage, "manifest.json");
  }

  load(): Manifest {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    const filePath = this.manifestPath();
    if (!fs.existsSync(filePath)) {
      throw new Error(`Manifest introuvable: ${filePath}. Lancez npm run build:index.`);
    }

    this.manifestCache = JSON.parse(fs.readFileSync(filePath, "utf8")) as Manifest;
    return this.manifestCache;
  }

  chapters() {
    return this.load().chapters;
  }

  pages(filter: { chapter?: ChapterId; from?: number; to?: number } = {}): PageRecord[] {
    return this.load().pages.filter((page) => {
      if (filter.chapter && page.chapter !== filter.chapter) {
        return false;
      }
      if (filter.from !== undefined && page.pageNumber < filter.from) {
        return false;
      }
      if (filter.to !== undefined && page.pageNumber > filter.to) {
        return false;
      }
      return true;
    });
  }

  page(pageNumber: number): PageRecord | undefined {
    return this.load().pages.find((page) => page.pageNumber === pageNumber);
  }

  exercises(filter: { chapter?: ChapterId; page?: number; number?: number; query?: string } = {}): ExerciseRecord[] {
    const query = filter.query?.trim().toLowerCase();

    return this.load().exercises.filter((exercise) => {
      if (filter.chapter && exercise.chapter !== filter.chapter) {
        return false;
      }
      if (filter.page !== undefined && exercise.pageNumber !== filter.page) {
        return false;
      }
      if (filter.number !== undefined && exercise.exerciseNumber !== filter.number) {
        return false;
      }
      if (query) {
        const haystack = `${exercise.chapter} ${exercise.pageNumber} ${exercise.exerciseNumber} ${exercise.label} ${exercise.atome}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }

  exerciseOrThrow(number: number, page: number): ExerciseRecord {
    const exercise = this.exercises({ number, page })[0];
    if (!exercise) {
      throw new Error(`Exercice ${number} introuvable page ${page}.`);
    }
    return exercise;
  }

  absoluteDataPath(relativePath: string): string {
    return path.join(path.resolve(__dirname, "..", ".."), relativePath);
  }
}
