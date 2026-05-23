import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { exerciseViewHtml, homeHtml } from "./home";
import { openApiDocument } from "./openapi";
import { cropExercise, upscalePageImage } from "../sesamath/crop";
import { DEFAULT_OUVRAGE, OUVRAGE_PRESETS } from "../sesamath/constants";
import { localOuvrages, ManifestRepository } from "../sesamath/repository";
import { DEFAULT_CROP_SCALE, DEFAULT_PAGE_SCALE } from "../sesamath/upscale";

const numberParam = z.coerce.number().int().positive();
const optionalNumber = z.coerce.number().int().optional();

export const createApp = (repository = new ManifestRepository(DEFAULT_OUVRAGE)) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const ouvrageFrom = (req: express.Request): string => {
    return typeof req.query.ouvrage === "string" && req.query.ouvrage.trim() ? req.query.ouvrage.trim() : repository.ouvrageId();
  };

  const repositoryFor = (req: express.Request): ManifestRepository => {
    const ouvrage = ouvrageFrom(req);
    return ouvrage === repository.ouvrageId() ? repository : new ManifestRepository(ouvrage);
  };

  app.get("/", (req, res) => {
    const currentRepository = repositoryFor(req);
    let manifest = null;
    let error: string | undefined;
    try {
      manifest = currentRepository.hasManifest() ? currentRepository.load() : null;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Erreur inconnue";
    }
    res.type("html").send(homeHtml({ ouvrage: currentRepository.ouvrageId(), manifest, error }));
  });

  app.get("/view/exercise", (req, res) => {
    const ouvrage = ouvrageFrom(req);
    const page = numberParam.parse(req.query.page);
    const exercise = numberParam.parse(req.query.exercise);
    const scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_CROP_SCALE).parse(req.query.scale);
    const imageUrl = `/api/exercises/${exercise}/crop?page=${page}&scale=${scale}&ouvrage=${encodeURIComponent(ouvrage)}`;
    res.type("html").send(exerciseViewHtml({ ouvrage, page, exercise, scale, imageUrl }));
  });

  app.get("/health", (req, res) => {
    const currentRepository = repositoryFor(req);
    if (!currentRepository.hasManifest()) {
      res.json({
        ok: false,
        indexed: false,
        ouvrage: currentRepository.ouvrageId(),
        message: "Manifest local absent. Lance npm run build:index ou npm run sesa -- ex 60 p256.",
      });
      return;
    }

    const manifest = currentRepository.load();
    res.json({
      ok: true,
      indexed: true,
      ouvrage: manifest.ouvrage,
      builtAt: manifest.builtAt,
      pages: manifest.pages.length,
      exercises: manifest.exercises.length,
    });
  });

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.get("/api/ouvrages", (_req, res) => {
    res.json({ presets: OUVRAGE_PRESETS, local: localOuvrages() });
  });

  app.get("/api/chapters", (req, res) => {
    res.json({ chapters: repositoryFor(req).chapters() });
  });

  app.get("/api/pages", (req, res) => {
    const currentRepository = repositoryFor(req);
    const from = optionalNumber.parse(req.query.from);
    const to = optionalNumber.parse(req.query.to);
    const chapter = typeof req.query.chapter === "string" ? req.query.chapter : undefined;
    res.json({ pages: currentRepository.pages({ chapter: chapter as never, from, to }) });
  });

  app.get("/api/pages/:pageNumber", (req, res) => {
    const currentRepository = repositoryFor(req);
    const pageNumber = numberParam.parse(req.params.pageNumber);
    const page = currentRepository.page(pageNumber);
    if (!page) {
      res.status(404).json({ error: `Page ${pageNumber} introuvable` });
      return;
    }
    res.json({ page });
  });

  app.get("/api/pages/:pageNumber/image", (req, res) => {
    const currentRepository = repositoryFor(req);
    const pageNumber = numberParam.parse(req.params.pageNumber);
    const page = currentRepository.page(pageNumber);
    if (!page) {
      res.status(404).json({ error: `Page ${pageNumber} introuvable` });
      return;
    }
    const imagePath = currentRepository.absoluteDataPath(page.imagePath);
    if (!fs.existsSync(imagePath)) {
      res.status(404).json({ error: `Image locale absente pour la page ${pageNumber}` });
      return;
    }
    res.type("image/gif").sendFile(path.resolve(imagePath));
  });

  app.get("/api/pages/:pageNumber/upscaled-image", async (req, res, next) => {
    try {
      const currentRepository = repositoryFor(req);
      const pageNumber = numberParam.parse(req.params.pageNumber);
      const scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_PAGE_SCALE).parse(req.query.scale);
      const page = currentRepository.page(pageNumber);
      if (!page) {
        res.status(404).json({ error: `Page ${pageNumber} introuvable` });
        return;
      }
      res.type("png").send(await upscalePageImage(page, scale));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/exercises", (req, res) => {
    const currentRepository = repositoryFor(req);
    const page = optionalNumber.parse(req.query.page);
    const number = optionalNumber.parse(req.query.number);
    const chapter = typeof req.query.chapter === "string" ? req.query.chapter : undefined;
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json({ exercises: currentRepository.exercises({ page, number, chapter: chapter as never, query }) });
  });

  app.get("/api/exercises/:exerciseNumber", (req, res) => {
    const currentRepository = repositoryFor(req);
    const number = numberParam.parse(req.params.exerciseNumber);
    const page = optionalNumber.parse(req.query.page);
    res.json({ exercises: currentRepository.exercises({ number, page }) });
  });

  app.get("/api/exercises/:exerciseNumber/crop", async (req, res, next) => {
    try {
      const currentRepository = repositoryFor(req);
      const number = numberParam.parse(req.params.exerciseNumber);
      const page = numberParam.parse(req.query.page);
      const scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_CROP_SCALE).parse(req.query.scale);
      const exercise = currentRepository.exerciseOrThrow(number, page);
      res.type("png").send(await cropExercise(exercise, scale));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/search", (req, res) => {
    const currentRepository = repositoryFor(req);
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const exercises = currentRepository.exercises({ query });
    const pages = currentRepository.pages().filter((page) => {
      return `${page.chapter} ${page.pageNumber} ${page.title}`.toLowerCase().includes(query.toLowerCase());
    });
    res.json({ query, pages, exercises });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    res.status(400).json({ error: message });
  });

  return app;
};
