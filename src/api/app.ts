import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { openApiDocument } from "./openapi";
import { cropExercise, upscalePageImage } from "../sesamath/crop";
import { DEFAULT_OUVRAGE } from "../sesamath/constants";
import { ManifestRepository } from "../sesamath/repository";
import { DEFAULT_CROP_SCALE, DEFAULT_PAGE_SCALE } from "../sesamath/upscale";

const numberParam = z.coerce.number().int().positive();
const optionalNumber = z.coerce.number().int().optional();

export const createApp = (repository = new ManifestRepository(DEFAULT_OUVRAGE)) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.type("html").send(`
      <!doctype html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Sésamath Manuel API</title></head>
      <body style="font-family:system-ui;margin:40px;line-height:1.5">
        <h1>Sésamath Manuel API</h1>
        <p>Endpoints principaux :</p>
        <ul>
          <li><a href="/health">/health</a></li>
          <li><a href="/api/chapters">/api/chapters</a></li>
          <li><a href="/api/pages?chapter=F10">/api/pages?chapter=F10</a></li>
          <li><a href="/api/exercises?page=256">/api/exercises?page=256</a></li>
          <li><a href="/api/exercises/60/crop?page=256&scale=4">/api/exercises/60/crop?page=256&scale=4</a></li>
          <li><a href="/api/pages/256/upscaled-image?scale=2">/api/pages/256/upscaled-image?scale=2</a></li>
          <li><a href="/api/openapi.json">/api/openapi.json</a></li>
        </ul>
      </body>
      </html>
    `);
  });

  app.get("/health", (_req, res) => {
    const manifest = repository.load();
    res.json({
      ok: true,
      ouvrage: manifest.ouvrage,
      builtAt: manifest.builtAt,
      pages: manifest.pages.length,
      exercises: manifest.exercises.length,
    });
  });

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.get("/api/chapters", (_req, res) => {
    res.json({ chapters: repository.chapters() });
  });

  app.get("/api/pages", (req, res) => {
    const from = optionalNumber.parse(req.query.from);
    const to = optionalNumber.parse(req.query.to);
    const chapter = typeof req.query.chapter === "string" ? req.query.chapter : undefined;
    res.json({ pages: repository.pages({ chapter: chapter as never, from, to }) });
  });

  app.get("/api/pages/:pageNumber", (req, res) => {
    const pageNumber = numberParam.parse(req.params.pageNumber);
    const page = repository.page(pageNumber);
    if (!page) {
      res.status(404).json({ error: `Page ${pageNumber} introuvable` });
      return;
    }
    res.json({ page });
  });

  app.get("/api/pages/:pageNumber/image", (req, res) => {
    const pageNumber = numberParam.parse(req.params.pageNumber);
    const page = repository.page(pageNumber);
    if (!page) {
      res.status(404).json({ error: `Page ${pageNumber} introuvable` });
      return;
    }
    const imagePath = repository.absoluteDataPath(page.imagePath);
    if (!fs.existsSync(imagePath)) {
      res.status(404).json({ error: `Image locale absente pour la page ${pageNumber}` });
      return;
    }
    res.type("image/gif").sendFile(path.resolve(imagePath));
  });

  app.get("/api/pages/:pageNumber/upscaled-image", async (req, res, next) => {
    try {
      const pageNumber = numberParam.parse(req.params.pageNumber);
      const scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_PAGE_SCALE).parse(req.query.scale);
      const page = repository.page(pageNumber);
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
    const page = optionalNumber.parse(req.query.page);
    const number = optionalNumber.parse(req.query.number);
    const chapter = typeof req.query.chapter === "string" ? req.query.chapter : undefined;
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json({ exercises: repository.exercises({ page, number, chapter: chapter as never, query }) });
  });

  app.get("/api/exercises/:exerciseNumber", (req, res) => {
    const number = numberParam.parse(req.params.exerciseNumber);
    const page = optionalNumber.parse(req.query.page);
    res.json({ exercises: repository.exercises({ number, page }) });
  });

  app.get("/api/exercises/:exerciseNumber/crop", async (req, res, next) => {
    try {
      const number = numberParam.parse(req.params.exerciseNumber);
      const page = numberParam.parse(req.query.page);
      const scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_CROP_SCALE).parse(req.query.scale);
      const exercise = repository.exerciseOrThrow(number, page);
      res.type("png").send(await cropExercise(exercise, scale));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/search", (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const exercises = repository.exercises({ query });
    const pages = repository.pages().filter((page) => {
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
