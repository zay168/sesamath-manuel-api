import sharp from "sharp";

export const DEFAULT_CROP_SCALE = 4;
export const DEFAULT_PAGE_SCALE = 2;
export const MAX_UPSCALE_SCALE = 8;

export const normalizeUpscaleScale = (scale: number, fallback: number): number => {
  if (!Number.isFinite(scale)) {
    return fallback;
  }

  return Math.min(MAX_UPSCALE_SCALE, Math.max(1, Math.round(scale)));
};

export const upscaleToReadablePng = (
  image: sharp.Sharp,
  dimensions: { width: number; height: number },
  scale: number,
): Promise<Buffer> => {
  const normalizedScale = normalizeUpscaleScale(scale, DEFAULT_CROP_SCALE);

  return image
    .resize({
      width: dimensions.width * normalizedScale,
      height: dimensions.height * normalizedScale,
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
      fastShrinkOnLoad: false,
    })
    .linear(1.04, -3)
    .sharpen({
      sigma: 0.55,
      m1: 0.35,
      m2: 0.14,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer();
};

export const upscaleStaticImageFile = async (imagePath: string, scale = DEFAULT_PAGE_SCALE): Promise<Buffer> => {
  const metadata = await sharp(imagePath, { animated: false }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Dimensions impossibles a lire: ${imagePath}`);
  }

  return upscaleToReadablePng(sharp(imagePath, { animated: false }), { width: metadata.width, height: metadata.height }, scale);
};
