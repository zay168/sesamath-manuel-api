import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import sharp from "sharp";
import { Poppler } from "node-poppler";
import { dataPath } from "./paths";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./constants";

export const PDF_RENDER_DPI = 300;

// All Sesamath manuals follow this URL pattern
export const pdfRemoteUrl = (ouvrage: string): string =>
  `https://manuel.sesamath.net/send_file.php?file=/files/${ouvrage}_v2.pdf`;

export const pdfLocalPath = (ouvrage: string): string =>
  dataPath(ouvrage, `${ouvrage}.pdf`);

export const pageRenderPath = (ouvrage: string, page: number): string =>
  dataPath(ouvrage, "pdf_renders", `p${page}.png`);

export const isPdfCached = (ouvrage: string): boolean =>
  fs.existsSync(pdfLocalPath(ouvrage));

export const isPageCached = (ouvrage: string, page: number): boolean =>
  fs.existsSync(pageRenderPath(ouvrage, page));

// ── Download ────────────────────────────────────────────────────────────────

async function downloadFile(url: string, dest: string): Promise<void> {
  const tmp = `${dest}.tmp`;
  await new Promise<void>((resolve, reject) => {
    const sink = fs.createWriteStream(tmp);

    const get = (u: string) =>
      https
        .get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            sink.destroy();
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
            return get(res.headers.location!);
          }
          if (!res.statusCode || res.statusCode >= 400) {
            sink.destroy();
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
            return reject(new Error(`HTTP ${res.statusCode} — ${u}`));
          }
          res.pipe(sink);
          sink.once("finish", () => { sink.close(); resolve(); });
          sink.once("error", reject);
        })
        .on("error", reject);

    get(url);
  });
  await fsp.rename(tmp, dest);
}

export async function ensurePdf(ouvrage: string): Promise<string> {
  const dest = pdfLocalPath(ouvrage);
  if (fs.existsSync(dest)) return dest;
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  console.log(`[pdf] Downloading ${ouvrage}.pdf from Sesamath…`);
  await downloadFile(pdfRemoteUrl(ouvrage), dest);
  const { size } = await fsp.stat(dest);
  console.log(`[pdf] Saved ${(size / 1024 / 1024).toFixed(1)} MB → ${dest}`);
  return dest;
}

// ── Render ──────────────────────────────────────────────────────────────────

export type PageRender = { renderPath: string; width: number; height: number };

export async function renderPdfPage(ouvrage: string, pageNumber: number): Promise<PageRender> {
  const renderPath = pageRenderPath(ouvrage, pageNumber);

  if (!fs.existsSync(renderPath)) {
    const pdf = await ensurePdf(ouvrage);
    await fsp.mkdir(path.dirname(renderPath), { recursive: true });

    const poppler = new Poppler();
    // pdfToCairo with singleFile outputs exactly {base}.png
    const base = renderPath.replace(/\.png$/, "");

    await poppler.pdfToCairo(pdf, base, {
      firstPageToConvert: pageNumber,
      lastPageToConvert: pageNumber,
      pngFile: true,
      singleFile: true,
      resolutionXAxis: PDF_RENDER_DPI,
      resolutionYAxis: PDF_RENDER_DPI,
    });

    if (!fs.existsSync(renderPath)) {
      throw new Error(`pdfToCairo n'a pas produit ${renderPath}`);
    }
  }

  const meta = await sharp(renderPath).metadata();
  if (!meta.width || !meta.height) throw new Error(`Métadonnées absentes: ${renderPath}`);
  return { renderPath, width: meta.width, height: meta.height };
}

// ── Coordinate scaling ───────────────────────────────────────────────────────
// Manifest coordinates are in GIF pixel space (PAGE_WIDTH × PAGE_HEIGHT).
// The PDF renders at a much higher resolution — scale factors bridge the two.

export type ScaleFactors = { sx: number; sy: number };

export function gifToPdfScaleFactors(pdfWidth: number, pdfHeight: number): ScaleFactors {
  return { sx: pdfWidth / PAGE_WIDTH, sy: pdfHeight / PAGE_HEIGHT };
}

// ── Crop from PDF render ──────────────────────────────────────────────────────

export interface GifCropRect { x: number; y: number; width: number; height: number }

export function scaleCrop(
  rect: GifCropRect,
  { sx, sy }: ScaleFactors,
  bounds: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const left = Math.floor(rect.x * sx);
  const top = Math.floor(rect.y * sy);
  const width = Math.min(Math.ceil(rect.width * sx), bounds.width - left);
  const height = Math.min(Math.ceil(rect.height * sy), bounds.height - top);
  return { left, top, width, height };
}
