import { PAGE_HEIGHT, PAGE_WIDTH, chapterForPage, sourcePageUrl } from "./constants";
import type { ExerciseRecord, PageRecord } from "./types";

type AtomMeta = {
  atome: string;
  label: string;
  exerciseNumber: number | null;
  sommairePage: number;
};

type MutableRect = {
  ouvrage: string;
  chapter: ReturnType<typeof chapterForPage>;
  pageNumber: number;
  exerciseNumber: number;
  label: string;
  atome: string;
  sommairePage: number;
  x: number;
  y: number;
  right: number;
  bottom: number;
  zoneCount: number;
  pageImage: string;
  sourceUrl: string;
};

const decodeHtml = (value: string): string => {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const extractPageNumbersFromHtml = (html: string, ouvrage: string): [number, number] | null => {
  const pagePattern = new RegExp(`${escapeRegExp(ouvrage)}_page(\\d+)\\.gif`, "g");
  const pageMatches = [...html.matchAll(pagePattern)].map((match) => Number(match[1]));
  if (pageMatches.length < 2) {
    return null;
  }
  return [pageMatches[0], pageMatches[1]];
};

export const extractAtomIndex = (html: string): Map<string, AtomMeta> => {
  const index = new Map<string, AtomMeta>();
  const rows = html.matchAll(/<tr>([\s\S]*?)<\/tr>/g);

  for (const rowMatch of rows) {
    const row = rowMatch[1];
    const pageMatch = row.match(/page_gauche=(\d+)/);
    if (!pageMatch) {
      continue;
    }

    const sommairePage = Number(pageMatch[1]);
    const links = row.matchAll(/diapo\.php\?atome=(\d+)"[^>]*>([\s\S]*?)<\/a>/g);

    for (const link of links) {
      const atome = link[1];
      const label = decodeHtml(link[2]);
      const exerciseNumber = /^\d+$/.test(label) ? Number(label) : null;

      if (!index.has(atome)) {
        index.set(atome, {
          atome,
          label,
          exerciseNumber,
          sommairePage,
        });
      }
    }
  }

  return index;
};

export const extractPages = (ouvrage: string, pageNumber: number, html: string): PageRecord[] => {
  const pages = extractPageNumbersFromHtml(html, ouvrage);
  if (!pages) {
    return [];
  }

  return pages.map((actualPage) => ({
    ouvrage,
    pageNumber: actualPage,
    chapter: chapterForPage(ouvrage, actualPage),
    title: `Page ${actualPage}`,
    imagePath: `data/${ouvrage}/pages/p${actualPage}.gif`,
    htmlPath: `data/${ouvrage}/html/p${pageNumber}.html`,
    sourceUrl: sourcePageUrl(ouvrage, actualPage),
  }));
};

export const extractExerciseRects = (
  ouvrage: string,
  html: string,
  atomIndex: Map<string, AtomMeta>,
): ExerciseRecord[] => {
  const pageNumbers = extractPageNumbersFromHtml(html, ouvrage);
  if (!pageNumbers) {
    return [];
  }

  const [leftPageNumber, rightPageNumber] = pageNumbers;
  const rects = new Map<string, MutableRect>();
  const zonePattern =
    /<div id="zone_(\d+)_(\d+)" class="sg_zone" style="top:(\d+)px;height:(\d+)px;left:(\d+)px;width:(\d+)px;">/g;

  for (const match of html.matchAll(zonePattern)) {
    const atome = match[1];
    const atom = atomIndex.get(atome);
    if (!atom || atom.exerciseNumber === null) {
      continue;
    }

    const top = Number(match[3]);
    const height = Number(match[4]);
    const left = Number(match[5]);
    const width = Number(match[6]);
    const pageNumber = left >= 436 ? rightPageNumber : leftPageNumber;
    const x = left >= 436 ? left - 436 : left;
    const key = `${atome}|${pageNumber}`;

    if (!rects.has(key)) {
      rects.set(key, {
        ouvrage,
        chapter: chapterForPage(ouvrage, pageNumber),
        pageNumber,
        exerciseNumber: atom.exerciseNumber,
        label: atom.label,
        atome,
        sommairePage: atom.sommairePage,
        x,
        y: top,
        right: x + width,
        bottom: top + height,
        zoneCount: 1,
        pageImage: `data/${ouvrage}/pages/p${pageNumber}.gif`,
        sourceUrl: sourcePageUrl(ouvrage, pageNumber),
      });
    } else {
      const rect = rects.get(key)!;
      rect.x = Math.min(rect.x, x);
      rect.y = Math.min(rect.y, top);
      rect.right = Math.max(rect.right, x + width);
      rect.bottom = Math.max(rect.bottom, top + height);
      rect.zoneCount += 1;
    }
  }

  const padding = 8;
  return [...rects.values()].map((rect) => {
    const x = Math.max(0, rect.x - padding);
    const y = Math.max(0, rect.y - padding);
    const right = Math.min(PAGE_WIDTH, rect.right + padding);
    const bottom = Math.min(PAGE_HEIGHT, rect.bottom + padding);

    return {
      ouvrage: rect.ouvrage,
      chapter: rect.chapter,
      pageNumber: rect.pageNumber,
      exerciseNumber: rect.exerciseNumber,
      label: rect.label,
      atome: rect.atome,
      sommairePage: rect.sommairePage,
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y),
      zoneCount: rect.zoneCount,
      pageImage: rect.pageImage,
      sourceUrl: rect.sourceUrl,
    };
  });
};
