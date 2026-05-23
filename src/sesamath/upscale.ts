import sharp from "sharp";

export const DEFAULT_CROP_SCALE = 4;
export const DEFAULT_PAGE_SCALE = 2;
export const MAX_UPSCALE_SCALE = 8;

export const normalizeUpscaleScale = (scale: number, fallback: number): number => {
  if (!Number.isFinite(scale)) return fallback;
  return Math.min(MAX_UPSCALE_SCALE, Math.max(1, Math.round(scale)));
};

/**
 * Resize in linear light rather than perceptual (sRGB) space.
 * Interpolation in linear space produces sharper, more accurate edge transitions —
 * avoids the "muddy halo" that appears when blending dark and light pixels in gamma-encoded space.
 */
// sharp's .gamma(v) applies 1/v pre-resize and v post-resize automatically —
// a single call is all that's needed to resize in linear light.
const linearResize = (p: sharp.Sharp, w: number, h: number): sharp.Sharp =>
  p
    .gamma(2.2)
    .resize({ width: w, height: h, fit: "fill", kernel: sharp.kernel.lanczos3, fastShrinkOnLoad: false });

/**
 * Post-upscale enhancement tuned for printed textbook content:
 *  - linear contrast: push near-whites to white, near-blacks to black
 *  - unsharp mask: strong enough to recover text crispness without ringing
 */
const enhance = (p: sharp.Sharp): sharp.Sharp =>
  p
    .linear(1.16, -18)
    .sharpen({ sigma: 0.85, m1: 2.5, m2: 1.2, x1: 2.0, y2: 10.0, y3: 20.0 });

const pngOut = (compressionLevel: number) =>
  ({ compressionLevel, adaptiveFiltering: true }) as sharp.PngOptions;

export const upscaleToReadablePng = (
  image: sharp.Sharp,
  dimensions: { width: number; height: number },
  scale: number,
): Promise<Buffer> => {
  const s = normalizeUpscaleScale(scale, DEFAULT_CROP_SCALE);
  const tw = dimensions.width * s;
  const th = dimensions.height * s;

  // Single pass for scale ≤ 2: direct high-quality resize + enhance
  if (s <= 2) {
    return enhance(linearResize(image, tw, th))
      .png(pngOut(9))
      .toBuffer();
  }

  // Two-pass for scale ≥ 3:
  //   Pass 1 — 2× with intermediate sharpening keeps edges intact
  //   Pass 2 — remaining factor + final enhance
  // Avoids the interpolation artifacts of jumping straight to a large target.
  return (async () => {
    const mid = await linearResize(image, dimensions.width * 2, dimensions.height * 2)
      .sharpen({ sigma: 0.55, m1: 1.0, m2: 0.3 })
      .png(pngOut(1))   // fast intermediate — quality, not compression
      .toBuffer();

    return enhance(linearResize(sharp(mid), tw, th))
      .png(pngOut(9))
      .toBuffer();
  })();
};

export const upscaleToReadablePngLegacy = (
  image: sharp.Sharp,
  dimensions: { width: number; height: number },
  scale: number,
): Promise<Buffer> => {
  const s = normalizeUpscaleScale(scale, DEFAULT_CROP_SCALE);
  return image
    .resize({ width: dimensions.width * s, height: dimensions.height * s, fit: "fill", kernel: sharp.kernel.lanczos3, fastShrinkOnLoad: false })
    .linear(1.04, -3)
    .sharpen({ sigma: 0.55, m1: 0.35, m2: 0.14 })
    .png(pngOut(9))
    .toBuffer();
};

export const upscaleStaticImageFile = async (imagePath: string, scale = DEFAULT_PAGE_SCALE): Promise<Buffer> => {
  const metadata = await sharp(imagePath, { animated: false }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Dimensions impossibles a lire: ${imagePath}`);
  }
  return upscaleToReadablePng(
    sharp(imagePath, { animated: false }),
    { width: metadata.width, height: metadata.height },
    scale,
  );
};
