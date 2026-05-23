import type { Chapter, ChapterId, OuvragePreset } from "./types";

export const DEFAULT_OUVRAGE = "ms2_2019";
export const BASE_URL = "https://manuel.sesamath.net";
export const DEFAULT_FIRST_PAGE = 2;
export const DEFAULT_LAST_PAGE = 391;
export const PAGE_WIDTH = 435;
export const PAGE_HEIGHT = 619;

export const MS2_2019_CHAPTERS: Chapter[] = [
  { id: "sommaire", title: "Sommaire", firstPage: 2, lastPage: 12 },
  { id: "AP1", title: "Algorithmique et programmation", firstPage: 13, lastPage: 42 },
  { id: "NC2", title: "Nombres et calculs numeriques", firstPage: 43, lastPage: 68 },
  { id: "NC3", title: "Intervalles et inegalites", firstPage: 69, lastPage: 90 },
  { id: "NC4", title: "Identites remarquables", firstPage: 91, lastPage: 114 },
  { id: "G5", title: "Reperage et problemes de geometrie", firstPage: 115, lastPage: 134 },
  { id: "G6", title: "Vecteurs du plan", firstPage: 135, lastPage: 162 },
  { id: "G7", title: "Droites du plan et systemes d'equations", firstPage: 163, lastPage: 188 },
  { id: "F8", title: "Generalites sur les fonctions", firstPage: 189, lastPage: 216 },
  { id: "F9", title: "Variations et extremums", firstPage: 217, lastPage: 240 },
  { id: "F10", title: "Signe d'une fonction et inequations", firstPage: 241, lastPage: 268 },
  { id: "SP11", title: "Proportions et evolutions en pourcentage", firstPage: 269, lastPage: 286 },
  { id: "SP12", title: "Statistiques descriptives", firstPage: 287, lastPage: 310 },
  { id: "SP13", title: "Probabilites et echantillonnage", firstPage: 311, lastPage: 346 },
  { id: "lexique", title: "Lexique", firstPage: 347, lastPage: 353 },
  { id: "proprietes", title: "Proprietes", firstPage: 354, lastPage: 358 },
  { id: "formulaire", title: "Formulaire", firstPage: 359, lastPage: 359 },
  { id: "logique", title: "Logique et raisonnement", firstPage: 360, lastPage: 365 },
  { id: "fiche", title: "Fiches logiciels", firstPage: 366, lastPage: 371 },
  { id: "solutions", title: "Corriges", firstPage: 372, lastPage: 383 },
  { id: "calculatrice", title: "Calculatrice", firstPage: 384, lastPage: 391 },
];

export const OUVRAGE_PRESETS: OuvragePreset[] = [
  {
    id: "ms2_2019",
    title: "Manuel Sesamath 2de 2019",
    level: "Lycee",
    firstPage: DEFAULT_FIRST_PAGE,
    lastPage: DEFAULT_LAST_PAGE,
    chapters: MS2_2019_CHAPTERS,
  },
  {
    id: "ms1spe_2019",
    title: "Manuel Sesamath 1re specialite 2019",
    level: "Lycee",
    firstPage: 2,
    lastPage: 417,
    chapters: [],
  },
];

export const ouvragePreset = (ouvrage: string): OuvragePreset | undefined => {
  return OUVRAGE_PRESETS.find((preset) => preset.id === ouvrage);
};

export const chaptersForOuvrage = (ouvrage: string): Chapter[] => {
  return ouvragePreset(ouvrage)?.chapters ?? [];
};

export const defaultRangeForOuvrage = (ouvrage: string): { firstPage: number; lastPage: number } => {
  const preset = ouvragePreset(ouvrage);
  if (!preset) {
    throw new Error(`Ouvrage non preregle: ${ouvrage}. Precise --from et --to pour l'indexer.`);
  }
  return { firstPage: preset.firstPage, lastPage: preset.lastPage };
};

export const chapterForPage = (ouvrage: string, pageNumber: number): ChapterId => {
  return chaptersForOuvrage(ouvrage).find((chapter) => pageNumber >= chapter.firstPage && pageNumber <= chapter.lastPage)?.id ?? "unknown";
};

export const chapterTitle = (ouvrage: string, id: ChapterId): string => {
  return chaptersForOuvrage(ouvrage).find((chapter) => chapter.id === id)?.title ?? "Inconnu";
};

export const sourcePageUrl = (ouvrage: string, pageNumber: number): string => {
  return `${BASE_URL}/numerique/index.php?ouvrage=${ouvrage}&page_gauche=${pageNumber}`;
};

export const pageImageUrl = (ouvrage: string, pageNumber: number): string => {
  return `${BASE_URL}/imgs_produites/pages/${ouvrage}/${ouvrage}_page${pageNumber}.gif`;
};
