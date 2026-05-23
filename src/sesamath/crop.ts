import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ExerciseRecord, PageRecord } from "./types";
import { outPath, projectRoot } from "./paths";
import { DEFAULT_CROP_SCALE, DEFAULT_PAGE_SCALE, upscaleStaticImageFile, upscaleToReadablePng } from "./upscale";

export const cropExercise = async (exercise: ExerciseRecord, scale = DEFAULT_CROP_SCALE): Promise<Buffer> => {
  const imagePath = path.join(projectRoot, exercise.pageImage);

  return upscaleToReadablePng(
    sharp(imagePath, { animated: false }).extract({
      left: exercise.x,
      top: exercise.y,
      width: exercise.width,
      height: exercise.height,
    }),
    { width: exercise.width, height: exercise.height },
    scale,
  );
};

export const upscalePageImage = async (page: PageRecord, scale = DEFAULT_PAGE_SCALE): Promise<Buffer> => {
  const imagePath = path.join(projectRoot, page.imagePath);
  return upscaleStaticImageFile(imagePath, scale);
};

export const writeExerciseCrop = async (exercise: ExerciseRecord, scale = DEFAULT_CROP_SCALE): Promise<string> => {
  const outputDir = outPath("crops");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `p${exercise.pageNumber}_ex${exercise.exerciseNumber}.png`);
  await fs.writeFile(outputPath, await cropExercise(exercise, scale));
  return outputPath;
};

export const writeUpscaledPageImage = async (page: PageRecord, scale = DEFAULT_PAGE_SCALE): Promise<string> => {
  const outputDir = outPath("pages");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `p${page.pageNumber}_x${scale}.png`);
  await fs.writeFile(outputPath, await upscalePageImage(page, scale));
  return outputPath;
};
