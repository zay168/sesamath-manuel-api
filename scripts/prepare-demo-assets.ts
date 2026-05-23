import fs from "node:fs/promises";
import path from "node:path";
import { cropExercise, upscalePageImage } from "../src/sesamath/crop";
import { publicPath } from "../src/sesamath/paths";
import { ManifestRepository } from "../src/sesamath/repository";

const repository = new ManifestRepository();
const outputDir = publicPath("demo");

const copyCrop = async (exerciseNumber: number, pageNumber: number): Promise<string> => {
  const exercise = repository.exerciseOrThrow(exerciseNumber, pageNumber);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `p${pageNumber}_ex${exerciseNumber}.png`);
  await fs.writeFile(outputPath, await cropExercise(exercise, 5));
  return outputPath;
};

const copyPageImage = async (pageNumber: number): Promise<string> => {
  const page = repository.page(pageNumber);
  if (!page) {
    throw new Error(`Page ${pageNumber} introuvable.`);
  }

  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `p${pageNumber}_page_x2.png`);
  await fs.writeFile(outputPath, await upscalePageImage(page, 2));
  return outputPath;
};

const main = async () => {
  const outputs = [await copyCrop(60, 256), await copyCrop(88, 259), await copyPageImage(256), await copyPageImage(259)];
  console.log("Assets video prets:");
  for (const output of outputs) {
    console.log(`  ${output}`);
  }
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
