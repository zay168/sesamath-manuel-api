import assert from "node:assert/strict";
import { cropExercise } from "../src/sesamath/crop";
import { ManifestRepository } from "../src/sesamath/repository";

const main = async () => {
  const repository = new ManifestRepository();
  const manifest = repository.load();

  assert.ok(manifest.pages.length > 0, "manifest pages");
  assert.ok(manifest.exercises.length > 0, "manifest exercises");
  assert.ok(repository.page(256), "page 256 exists");

  const ex60 = repository.exerciseOrThrow(60, 256);
  assert.equal(ex60.exerciseNumber, 60);
  assert.equal(ex60.pageNumber, 256);

  const crop = await cropExercise(ex60, 2);
  assert.ok(crop.byteLength > 1000, "crop bytes");

  console.log(`Smoke OK: ${manifest.pages.length} pages, ${manifest.exercises.length} exercises, crop=${crop.byteLength} bytes.`);
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
