export type ChapterId =
  | "sommaire"
  | "AP1"
  | "NC2"
  | "NC3"
  | "NC4"
  | "G5"
  | "G6"
  | "G7"
  | "F8"
  | "F9"
  | "F10"
  | "SP11"
  | "SP12"
  | "SP13"
  | "lexique"
  | "proprietes"
  | "formulaire"
  | "logique"
  | "fiche"
  | "solutions"
  | "calculatrice"
  | "unknown";

export type Chapter = {
  id: ChapterId;
  title: string;
  firstPage: number;
  lastPage: number;
};

export type BuildOptions = {
  ouvrage: string;
  firstPage: number;
  lastPage: number;
  force: boolean;
};

export type PageRecord = {
  ouvrage: string;
  pageNumber: number;
  chapter: ChapterId;
  title: string;
  imagePath: string;
  htmlPath: string;
  sourceUrl: string;
};

export type ExerciseRecord = {
  ouvrage: string;
  chapter: ChapterId;
  pageNumber: number;
  exerciseNumber: number;
  label: string;
  atome: string;
  sommairePage: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zoneCount: number;
  pageImage: string;
  sourceUrl: string;
};

export type Manifest = {
  ouvrage: string;
  builtAt: string;
  source: {
    baseUrl: string;
    firstPage: number;
    lastPage: number;
  };
  chapters: Chapter[];
  pages: PageRecord[];
  exercises: ExerciseRecord[];
};

export type CropRequest = {
  pageNumber: number;
  exerciseNumber: number;
  scale: number;
};
