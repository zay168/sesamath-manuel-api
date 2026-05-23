# Sesamath Manuel API

API locale Node.js/TypeScript qui transforme les manuels numeriques Sesamath en service interrogeable.
Indexation des pages et exercices, crops PNG, images haute qualite via PDF vectoriel + poppler 300 DPI,
interface localhost et demo video Remotion.

## Fonctionnalites

- Indexation des pages et exercices depuis le manifest HTML Sesamath
- Images haute qualite : telechargement du PDF vectoriel + render poppler a 300 DPI
- Crops PNG a la demande par exercice (`/api/exercises/60/crop?page=256&scale=5`)
- Upscaler GIF → PNG (Lanczos3, multi-pass, gamma-correct) pour les pages non-PDF
- OpenAPI minimal accessible via `/api/openapi.json`
- Interface localhost complete (`/view/page`, `/view/exercise`, `/view/compare`)
- Composition video Remotion (style Anthropic)

## Demarrage rapide

```powershell
npm install
npm run build:index
npm run api
```

Ouvrir ensuite `http://localhost:4310`.

## Images haute qualite (PDF vectoriel)

Depuis l'interface localhost, un bouton **Telecharger le PDF** lance le telechargement du PDF
officiel Sesamath (~100 MB). Une fois le PDF cache localement, toutes les routes image
utilisent automatiquement le render poppler a 300 DPI au lieu du GIF source.

Le resultat : textes mathematiques, fractions et tableaux sont parfaitement nets, sans
artefact de compression, sans upscaling artificiel.

## API

| Route | Description |
| --- | --- |
| `GET /health` | Etat du serveur, nombre de pages et exercices indexes |
| `GET /api/pages` | Liste des pages (filtrables par `chapter`, `from`, `to`) |
| `GET /api/pages/:num/image` | Image GIF source de la page |
| `GET /api/pages/:num/upscaled-image` | Page upscalee (`?scale=2`) |
| `GET /api/exercises?page=256` | Exercices d'une page |
| `GET /api/exercises/60/crop` | Crop PNG d'un exercice (`?page=256&scale=5`) |
| `GET /api/search?q=fonction` | Recherche plein texte |
| `GET /api/openapi.json` | Schema OpenAPI |
| `GET /view/page` | Vue page complete (`?page=256&scale=2`) |
| `GET /view/exercise` | Vue crop exercice (`?page=256&exercise=60&scale=5`) |
| `GET /view/compare` | Comparaison before/after upscaler |

## Scripts

| Script | Description |
| --- | --- |
| `npm run api` | Demarre le serveur sur le port 4310 |
| `npm run build:index` | Telecharge les pages et construit le manifest local |
| `npm run build:index:functions` | Indexe seulement les pages fonctions (189-268) |
| `npm run sesa -- ex 60 p256 --open` | CLI : ouvrir le crop d'un exercice |
| `npm run sesa -- page p256 --open` | CLI : ouvrir une page complete |
| `npm run smoke` | Test rapide manifest + crop |
| `npm run video:studio` | Studio Remotion |
| `npm run video:render` | Rendu video MP4 |

## Licence

MIT — voir `LICENSE`.

Les extraits, crops et assets derives du manuel Sesamath restent soumis aux licences
Sesamath (CC-BY-SA / GNU FDL) et doivent conserver l'attribution requise.
Ce projet n'est pas affilie a Sesamath.
