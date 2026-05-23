import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ExerciseRecord, PageRecord } from "./types";
import { outPath, projectRoot } from "./paths";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./constants";
import { DEFAULT_CROP_SCALE, DEFAULT_PAGE_SCALE, upscaleStaticImageFile, upscaleToReadablePng, upscaleToReadablePngLegacy } from "./upscale";
import { gifToPdfScaleFactors, isPdfCached, renderPdfPage, scaleCrop } from "./pdf";

// ── Helpers ──────────────────────────────────────────────────────────────────

const pngOut: sharp.PngOptions = { compressionLevel: 9, adaptiveFiltering: true };

/** From a PDF render, resize a region to the requested output dimensions. No upscaling needed — PDF is already high-res. */
function cropAndResize(
  renderPath: string,
  crop: { left: number; top: number; width: number; height: number },
  targetWidth: number,
  targetHeight: number,
): Promise<Buffer> {
  return sharp(renderPath)
    .extract(crop)
    .resize({ width: targetWidth, height: targetHeight, fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png(pngOut)
    .toBuffer();
}

// ── Public API ───────────────────────────────────────────────────────────────

export const cropExercise = async (exercise: ExerciseRecord, scale = DEFAULT_CROP_SCALE): Promise<Buffer> => {
  if (isPdfCached(exercise.ouvrage)) {
    try {
      const { renderPath, width: pw, height: ph } = await renderPdfPage(exercise.ouvrage, exercise.pageNumber);
      const factors = gifToPdfScaleFactors(pw, ph);
      const crop = scaleCrop(exercise, factors, { width: pw, height: ph });
      return cropAndResize(renderPath, crop, exercise.width * scale, exercise.height * scale);
    } catch (err) {
      console.warn("[pdf] crop fallback to GIF:", (err as Error).message);
    }
  }

  const imagePath = path.join(projectRoot, exercise.pageImage);
  return upscaleToReadablePng(
    sharp(imagePath, { animated: false }).extract({
      left: exercise.x, top: exercise.y, width: exercise.width, height: exercise.height,
    }),
    { width: exercise.width, height: exercise.height },
    scale,
  );
};

export const upscalePageImage = async (page: PageRecord, scale = DEFAULT_PAGE_SCALE): Promise<Buffer> => {
  if (isPdfCached(page.ouvrage)) {
    try {
      const { renderPath } = await renderPdfPage(page.ouvrage, page.pageNumber);
      return sharp(renderPath)
        .resize({ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale, fit: "fill", kernel: sharp.kernel.lanczos3 })
        .png(pngOut)
        .toBuffer();
    } catch (err) {
      console.warn("[pdf] page fallback to GIF:", (err as Error).message);
    }
  }

  const imagePath = path.join(projectRoot, page.imagePath);
  return upscaleStaticImageFile(imagePath, scale);
};

// ── Legacy (before/after compare) ───────────────────────────────────────────

export const cropExerciseLegacy = async (exercise: ExerciseRecord, scale = DEFAULT_CROP_SCALE): Promise<Buffer> => {
  const imagePath = path.join(projectRoot, exercise.pageImage);
  return upscaleToReadablePngLegacy(
    sharp(imagePath, { animated: false }).extract({
      left: exercise.x, top: exercise.y, width: exercise.width, height: exercise.height,
    }),
    { width: exercise.width, height: exercise.height },
    scale,
  );
};

export const upscalePageImageLegacy = async (page: PageRecord, scale = DEFAULT_PAGE_SCALE): Promise<Buffer> => {
  const imagePath = path.join(projectRoot, page.imagePath);
  const metadata = await sharp(imagePath, { animated: false }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Dimensions impossibles: ${imagePath}`);
  return upscaleToReadablePngLegacy(
    sharp(imagePath, { animated: false }),
    { width: metadata.width, height: metadata.height },
    scale,
  );
};

// ── Write helpers ────────────────────────────────────────────────────────────

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
