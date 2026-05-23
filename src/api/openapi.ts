export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Sésamath Manuel API",
    version: "1.0.0",
    description: "API locale pour explorer les pages, exercices, images et crops du manuel Sésamath.",
  },
  paths: {
    "/health": { get: { summary: "Vérifie l'état du serveur" } },
    "/api/chapters": { get: { summary: "Liste les chapitres indexés" } },
    "/api/pages": { get: { summary: "Liste les pages, filtrables par chapitre ou plage" } },
    "/api/pages/{pageNumber}": { get: { summary: "Retourne les métadonnées d'une page" } },
    "/api/pages/{pageNumber}/image": { get: { summary: "Retourne l'image GIF locale d'une page" } },
    "/api/pages/{pageNumber}/upscaled-image": { get: { summary: "Retourne la page GIF convertie en PNG upscale" } },
    "/api/exercises": { get: { summary: "Liste ou recherche les exercices" } },
    "/api/exercises/{exerciseNumber}": { get: { summary: "Retourne les occurrences d'un numéro d'exercice" } },
    "/api/exercises/{exerciseNumber}/crop": { get: { summary: "Retourne le crop PNG upscale d'un exercice, avec query page=..." } },
    "/api/search": { get: { summary: "Recherche simple dans pages et exercices" } },
    "/api/openapi.json": { get: { summary: "Description OpenAPI minimale" } },
  },
};
