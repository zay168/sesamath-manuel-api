export type ChapterId = string;

export type Chapter = {
  id: ChapterId;
  title: string;
  firstPage: number;
  lastPage: number;
};

export type OuvragePreset = {
  id: string;
  title: string;
  level: string;
  firstPage: number;
  lastPage: number;
  chapters: Chapter[];
};

export type BuildOptions = {
  ouvrage: string;
  firstPage: number;
  lastPage: number;
  force: boolean;
  quiet?: boolean;
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
