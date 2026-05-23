import type { Chapter, ChapterId } from "./types";

export const DEFAULT_OUVRAGE = "ms2_2019";
export const BASE_URL = "https://manuel.sesamath.net";
export const DEFAULT_FIRST_PAGE = 2;
export const DEFAULT_LAST_PAGE = 391;
export const PAGE_WIDTH = 435;
export const PAGE_HEIGHT = 619;

export const CHAPTERS: Chapter[] = [
  { id: "sommaire", title: "Sommaire", firstPage: 2, lastPage: 12 },
  { id: "AP1", title: "Algorithmique et programmation", firstPage: 13, lastPage: 42 },
  { id: "NC2", title: "Nombres et calculs numériques", firstPage: 43, lastPage: 68 },
  { id: "NC3", title: "Intervalles et inégalités", firstPage: 69, lastPage: 90 },
  { id: "NC4", title: "Identités remarquables", firstPage: 91, lastPage: 114 },
  { id: "G5", title: "Repérage et problèmes de géométrie", firstPage: 115, lastPage: 134 },
  { id: "G6", title: "Vecteurs du plan", firstPage: 135, lastPage: 162 },
  { id: "G7", title: "Droites du plan et systèmes d'équations", firstPage: 163, lastPage: 188 },
  { id: "F8", title: "Généralités sur les fonctions", firstPage: 189, lastPage: 216 },
  { id: "F9", title: "Variations et extremums", firstPage: 217, lastPage: 240 },
  { id: "F10", title: "Signe d'une fonction et inéquations", firstPage: 241, lastPage: 268 },
  { id: "SP11", title: "Proportions et évolutions en pourcentage", firstPage: 269, lastPage: 286 },
  { id: "SP12", title: "Statistiques descriptives", firstPage: 287, lastPage: 310 },
  { id: "SP13", title: "Probabilités et échantillonnage", firstPage: 311, lastPage: 346 },
  { id: "lexique", title: "Lexique", firstPage: 347, lastPage: 353 },
  { id: "proprietes", title: "Propriétés", firstPage: 354, lastPage: 358 },
  { id: "formulaire", title: "Formulaire", firstPage: 359, lastPage: 359 },
  { id: "logique", title: "Logique et raisonnement", firstPage: 360, lastPage: 365 },
  { id: "fiche", title: "Fiches logiciels", firstPage: 366, lastPage: 371 },
  { id: "solutions", title: "Corrigés", firstPage: 372, lastPage: 383 },
  { id: "calculatrice", title: "Calculatrice", firstPage: 384, lastPage: 391 },
];

export const chapterForPage = (pageNumber: number): ChapterId => {
  return CHAPTERS.find((chapter) => pageNumber >= chapter.firstPage && pageNumber <= chapter.lastPage)?.id ?? "unknown";
};

export const chapterTitle = (id: ChapterId): string => {
  return CHAPTERS.find((chapter) => chapter.id === id)?.title ?? "Inconnu";
};

export const sourcePageUrl = (ouvrage: string, pageNumber: number): string => {
  return `${BASE_URL}/numerique/index.php?ouvrage=${ouvrage}&page_gauche=${pageNumber}`;
};

export const pageImageUrl = (ouvrage: string, pageNumber: number): string => {
  return `${BASE_URL}/imgs_produites/pages/${ouvrage}/${ouvrage}_page${pageNumber}.gif`;
};
