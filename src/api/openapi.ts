export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Sesamath Manuel API",
    version: "1.1.0",
    description: "API locale pour explorer les ouvrages, pages, exercices, images et crops du manuel Sesamath.",
  },
  paths: {
    "/health": { get: { summary: "Verifie l'etat du serveur et de l'index local" } },
    "/api/ouvrages": { get: { summary: "Liste les ouvrages preregles et les manifests locaux" } },
    "/api/chapters": { get: { summary: "Liste les chapitres indexes" } },
    "/api/pages": { get: { summary: "Liste les pages, filtrables par chapitre ou plage" } },
    "/api/pages/{pageNumber}": { get: { summary: "Retourne les metadonnees d'une page" } },
    "/api/pages/{pageNumber}/image": { get: { summary: "Retourne l'image GIF locale d'une page" } },
    "/api/pages/{pageNumber}/upscaled-image": { get: { summary: "Retourne la page GIF convertie en PNG upscale" } },
    "/api/exercises": { get: { summary: "Liste ou recherche les exercices" } },
    "/api/exercises/{exerciseNumber}": { get: { summary: "Retourne les occurrences d'un numero d'exercice" } },
    "/api/exercises/{exerciseNumber}/crop": { get: { summary: "Retourne le crop PNG upscale d'un exercice, avec query page=..." } },
    "/api/search": { get: { summary: "Recherche simple dans pages et exercices" } },
    "/api/openapi.json": { get: { summary: "Description OpenAPI minimale" } },
  },
};
