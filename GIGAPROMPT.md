# Sesamath Manuel API — Prompt de génération complet

Ce document spécifie l'intégralité du projet de façon à pouvoir le régénérer from scratch
en une seule passe par un agent de code. Tout est ici : architecture, types, routes,
design system, vidéo, CLIs, conventions.

---

## 0. Brief

Construis une **API locale Node.js + TypeScript** qui transforme les manuels numériques
Sesamath (https://manuel.sesamath.net) en service interrogeable. La sortie de bout en bout :

- Manifest JSON de l'ouvrage (pages, exercices, coordonnées rectangles)
- Endpoints REST + OpenAPI
- Crops PNG d'exercices à la demande, avec deux pipelines image :
  1. **Pipeline PDF vectoriel** (qualité maximale) : téléchargement du PDF officiel
     Sesamath + rendu poppler 300 DPI
  2. **Pipeline GIF upscaler** (fallback) : sharp avec resize Lanczos3 multi-pass en
     lumière linéaire + unsharp mask agressif
- Interface localhost (design Anthropic minimal) pour explorer pages et exercices
- Vue comparaison before/after de l'upscaler avec slider CSS
- CLIs (`sesa`, `build-index`) pour usage hors-serveur
- Vidéo Remotion 18s (1920×1080) qui démontre le système

**Contrainte structurante** : le code doit fonctionner sur Windows avec PowerShell, le
fallback GIF doit toujours marcher si le PDF n'est pas téléchargé, et l'index doit se
construire **à la demande** quand une page manquante est demandée.

---

## 1. Stack technique (versions exactes)

```json
{
  "dependencies": {
    "@remotion/cli": "4.0.465",
    "@remotion/tailwind-v4": "4.0.465",
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "node-poppler": "^9.1.2",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "remotion": "4.0.465",
    "sharp": "^0.34.5",
    "tailwindcss": "4.0.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@remotion/eslint-config-flat": "4.0.465",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^25.9.1",
    "@types/react": "19.2.7",
    "@types/web": "0.0.166",
    "eslint": "^9.39.4",
    "prettier": "3.8.1",
    "tsx": "^4.22.3",
    "typescript": "5.9.3"
  }
}
```

Node ≥ 20. TypeScript strict. Exécution via `tsx` (pas de build TS séparé pour les
serveurs / scripts). `sideEffects: ["*.css"]` pour le bundling Remotion.

---

## 2. Arborescence

```
sesamath-manuel-api/
├── data/                              # créé par buildIndex, gitignored (sauf manifest)
│   └── {ouvrage}/
│       ├── html/p{N}.html             # HTML Sesamath cache
│       ├── pages/p{N}.gif             # GIF source 435×619
│       ├── manifest.json              # manifest indexé
│       ├── {ouvrage}.pdf              # PDF vectoriel (download on demand)
│       └── pdf_renders/p{N}.png       # cache renders poppler 300 DPI
├── out/                               # rendus vidéo, gitignored
├── public/demo/                       # assets statiques pour Remotion
│   ├── p256_ex60.png
│   ├── p256_page_x2.png
│   ├── p259_ex88.png
│   └── p259_page_x2.png
├── scripts/
│   ├── build-index.ts                 # CLI indexation longue forme
│   ├── sesa.ts                        # CLI courte (ex / page / books / index)
│   ├── prepare-demo-assets.ts         # régénère public/demo/*
│   └── smoke-test.ts                  # check rapide
├── src/
│   ├── index.ts                       # ré-export public du package
│   ├── api/
│   │   ├── server.ts                  # bootstrap + listen 4310
│   │   ├── app.ts                     # createApp() : Express + routes
│   │   ├── home.ts                    # homeHtml / pageViewHtml / exerciseViewHtml / compareHtml
│   │   └── openapi.ts                 # schema OpenAPI minimal
│   ├── sesamath/
│   │   ├── paths.ts                   # projectRoot, dataPath, publicPath, outPath
│   │   ├── types.ts                   # tous les TS types
│   │   ├── constants.ts               # presets, URLs Sesamath, dimensions GIF
│   │   ├── parser.ts                  # parsing HTML → zones rectangulaires
│   │   ├── build.ts                   # buildIndex() download + parse + write manifest
│   │   ├── repository.ts              # ManifestRepository + localOuvrages()
│   │   ├── upscale.ts                 # pipeline sharp GIF→PNG (current + legacy)
│   │   ├── pdf.ts                     # download PDF + render poppler
│   │   └── crop.ts                    # cropExercise / upscalePageImage (PDF si dispo, GIF sinon)
│   └── video/
│       ├── index.ts                   # registerRoot
│       ├── Root.tsx                   # <Composition>
│       ├── SesamathApiVideo.tsx       # 4 scènes
│       └── style.css                  # palette Anthropic
├── package.json
├── tsconfig.json                      # strict, target es2022, jsx react-jsx
├── README.md
└── .gitignore                         # node_modules, data/, out/, *.log
```

---

## 3. Modèle de données

### Types (`src/sesamath/types.ts`)

```ts
export type ChapterId = string;

export type Chapter = { id: ChapterId; title: string; firstPage: number; lastPage: number };
export type OuvragePreset = { id: string; title: string; level: string; firstPage: number; lastPage: number; chapters: Chapter[] };

export type BuildOptions = { ouvrage: string; firstPage: number; lastPage: number; force: boolean; quiet?: boolean };

export type PageRecord = {
  ouvrage: string; pageNumber: number; chapter: ChapterId; title: string;
  imagePath: string; htmlPath: string; sourceUrl: string;
};

export type ExerciseRecord = {
  ouvrage: string; chapter: ChapterId; pageNumber: number; exerciseNumber: number;
  label: string; atome: string; sommairePage: number;
  x: number; y: number; width: number; height: number;
  zoneCount: number; pageImage: string; sourceUrl: string;
};

export type Manifest = {
  ouvrage: string; builtAt: string;
  source: { baseUrl: string; firstPage: number; lastPage: number };
  chapters: Chapter[]; pages: PageRecord[]; exercises: ExerciseRecord[];
};

export type CropRequest = { pageNumber: number; exerciseNumber: number; scale: number };
```

### Constants (`src/sesamath/constants.ts`)

- `DEFAULT_OUVRAGE = "ms2_2019"`
- `BASE_URL = "https://manuel.sesamath.net"`
- `PAGE_WIDTH = 435`, `PAGE_HEIGHT = 619` (taille en pixels des GIF source)
- 2 presets : `ms2_2019` (Manuel Sésamath 2de 2019, pages 2-391, ~21 chapitres) et
  `ms1spe_2019` (1re spé, pages 2-417, chapitres vides)
- Le preset `ms2_2019` doit contenir la liste complète des chapitres avec leurs plages
  (sommaire 2-12, AP1 13-42, NC2 43-68, ..., calculatrice 384-391)
- Helpers :
  - `ouvragePreset(id)` / `chaptersForOuvrage(id)` / `defaultRangeForOuvrage(id)`
  - `chapterForPage(ouvrage, n)` → ChapterId (ou `"unknown"`)
  - `chapterTitle(ouvrage, id)`
  - `sourcePageUrl(ouvrage, n)` → `{BASE_URL}/numerique/index.php?ouvrage={o}&page_gauche={n}`
  - `pageImageUrl(ouvrage, n)` → `{BASE_URL}/imgs_produites/pages/{o}/{o}_page{n}.gif`

### Paths (`src/sesamath/paths.ts`)

- `projectRoot = path.resolve(__dirname, "..", "..")`
- `dataRoot`, `publicRoot`, `outRoot`
- Helpers : `dataPath(...parts)`, `publicPath(...parts)`, `outPath(...parts)`

---

## 4. Source des données Sesamath

Pour chaque page numérique du manuel, deux ressources à télécharger :

1. **HTML** : `https://manuel.sesamath.net/numerique/index.php?ouvrage={ouvrage}&page_gauche={N}`
   → contient le DOM des zones cliquables d'une **double page** (gauche+droite)
2. **GIF image** : `https://manuel.sesamath.net/imgs_produites/pages/{ouvrage}/{ouvrage}_page{N}.gif`
   → image 435×619, palette 256 couleurs

Le HTML contient :
- Une table `<tr>` ... `<a href="diapo.php?atome={ID}">{label}</a>` qui mappe les
  **atomes** vers exercice/label/sommaire
- Des `<div id="zone_{ATOME}_{INDEX}" class="sg_zone" style="top:{y}px;height:{h}px;left:{x}px;width:{w}px;">`
  qui marquent les rectangles cliquables sur la double page
- Le HTML mentionne les 2 GIF des deux pages (gauche+droite, `{ouvrage}_page{N}.gif` × 2)

**Logique d'extraction** (`src/sesamath/parser.ts`) :

- `extractPageNumbersFromHtml(html, ouvrage)` : trouve les 2 premiers numéros de page
  référencés dans le HTML via la regex `{ouvrage}_page(\d+)\.gif` → `[leftPage, rightPage]`
- `extractAtomIndex(html)` : pour chaque ligne `<tr>` qui contient `page_gauche=N`,
  liste les `<a href="diapo.php?atome=X">label</a>` → mappe `atome → {label,
  exerciseNumber, sommairePage}`. `exerciseNumber = label si label est purement numérique`
- `extractExerciseRects(ouvrage, html, atomIndex)` :
  - Pour chaque `zone_{ATOME}_{INDEX}`, agrège les rectangles d'un même atome dans la
    même page en prenant `min(x,y)` et `max(right,bottom)`
  - Une zone avec `left ≥ 436` appartient à la page droite (la double page fait 872px de
    large, divisée en 2×436px) ; soustrais 436 pour retrouver les coordonnées dans la
    page droite
  - Garde uniquement les atomes qui ont un `exerciseNumber` (label numérique)
  - Ajoute un **padding de 8px** clamped sur `[0, PAGE_WIDTH]` × `[0, PAGE_HEIGHT]`
- `extractPages(ouvrage, requestedPage, html)` : retourne les 2 PageRecord de la double
  page, avec `imagePath = data/{ouvrage}/pages/p{N}.gif` et
  `htmlPath = data/{ouvrage}/html/p{requestedPage}.html`

---

## 5. Pipeline d'indexation (`src/sesamath/build.ts`)

`buildIndex({ ouvrage, firstPage, lastPage, force, quiet? })` :

1. `mkdir -p data/{ouvrage}/html data/{ouvrage}/pages`
2. Pour chaque page `firstPage..lastPage` :
   - télécharge le HTML (`fetch` natif, écrit dans `html/p{N}.html`) — skip si fichier
     existe et `!force`
   - télécharge le GIF (`pages/p{N}.gif`) — skip si existe et `!force`
3. Relit tous les `html/p{N}.html` du dossier
4. Construit l'atomIndex global (union des atomes de toutes les pages chargées)
5. Pour chaque HTML, extrait pages + exercices (filtre les `pageNumber` hors plage
   `[firstPage, lastPage]`)
6. **Merge avec le manifest existant** s'il existe (dedupe par `pageNumber` pour les
   pages, par `atome|pageNumber` pour les exercices)
7. Tri : pages par `pageNumber`, exercices par `pageNumber` puis `exerciseNumber`
8. Écrit `data/{ouvrage}/manifest.json` (pretty 2 espaces)

Le merge incrémental permet de construire l'index page par page (indispensable pour
l'indexation à la demande depuis l'API).

---

## 6. Repository (`src/sesamath/repository.ts`)

Classe `ManifestRepository(ouvrage = DEFAULT_OUVRAGE)` :

- `ouvrageId()`, `manifestPath()`, `hasManifest()`, `clearCache()`
- `load(): Manifest` — lazy, throw si absent avec message qui suggère
  `npm run build:index`
- `chapters()`, `pages({chapter?, from?, to?})`, `page(N)`
- `exercises({chapter?, page?, number?, query?})` — query : matche
  `chapter pageNumber exerciseNumber label atome` en lowercase
- `exerciseOrThrow(number, page)`
- `absoluteDataPath(relPath)`

Helper module-level `localOuvrages(): string[]` — liste les sous-dossiers de `data/` qui
ont un `manifest.json`.

---

## 7. Pipeline GIF upscaler (`src/sesamath/upscale.ts`)

Toutes les images GIF sont upscalées vers PNG via **sharp**. Le pipeline est calibré
spécifiquement pour du **texte imprimé de manuel scolaire** (formules math, fractions,
tableaux, schémas géométriques).

### Constantes

```ts
export const DEFAULT_CROP_SCALE = 4;
export const DEFAULT_PAGE_SCALE = 2;
export const MAX_UPSCALE_SCALE = 8;
export const normalizeUpscaleScale = (scale, fallback) => {
  if (!Number.isFinite(scale)) return fallback;
  return Math.min(MAX_UPSCALE_SCALE, Math.max(1, Math.round(scale)));
};
```

### Pipeline courant `upscaleToReadablePng(image, dimensions, scale)`

1. **Resize en lumière linéaire** (`gamma(2.2)` avant resize — sharp applique
   automatiquement `1/2.2` pré-resize et `2.2` post-resize). Donne des transitions de
   bord propres, sans halos gris muddy.
2. **Multi-pass si scale ≥ 3** :
   - Pass 1 : 2× avec sharpening intermédiaire `{ sigma:0.55, m1:1.0, m2:0.3 }`,
     PNG compression rapide (level 1)
   - Pass 2 : reload via `sharp(buffer)`, resize jusqu'à la taille finale + enhance
   - Évite les artefacts d'interpolation des sauts directs en très haute échelle
3. **Single-pass si scale ≤ 2** : resize direct + enhance
4. **Enhance** (après resize) :
   - `.linear(1.16, -18)` — boost contraste, pousse les blancs vers 255 et les noirs
     vers 0 avec clipping
   - `.sharpen({ sigma:0.85, m1:2.5, m2:1.2, x1:2.0, y2:10.0, y3:20.0 })` — unsharp
     mask fort, calibré pour texte sans ringing
5. Output PNG `{ compressionLevel: 9, adaptiveFiltering: true }`

### Pipeline legacy `upscaleToReadablePngLegacy(...)` — conservé pour la vue comparaison

Version originale beaucoup plus conservatrice : resize Lanczos3 direct, `linear(1.04,
-3)`, `sharpen({ sigma:0.55, m1:0.35, m2:0.14 })`. Garde-la inchangée.

### `upscaleStaticImageFile(path, scale)`

Wrapper qui lit la metadata sharp, appelle `upscaleToReadablePng`.

---

## 8. Pipeline PDF vectoriel (`src/sesamath/pdf.ts`)

Tous les manuels Sesamath sont disponibles en PDF vectoriel via un pattern d'URL stable :

```ts
export const pdfRemoteUrl = (ouvrage) =>
  `https://manuel.sesamath.net/send_file.php?file=/files/${ouvrage}_v2.pdf`;
```

### Localisation

```ts
export const pdfLocalPath = (ouvrage) => dataPath(ouvrage, `${ouvrage}.pdf`);
export const pageRenderPath = (ouvrage, page) =>
  dataPath(ouvrage, "pdf_renders", `p${page}.png`);
```

### Téléchargement `ensurePdf(ouvrage)`

- Si le fichier existe : return early
- Sinon : `https.get` avec gestion 301/302 (redirects vers le CDN), écrit dans
  `{dest}.tmp` puis `rename` atomique
- Log `[pdf] Downloading ...` + `[pdf] Saved X MB → ...`

### Rendu `renderPdfPage(ouvrage, pageNumber) → { renderPath, width, height }`

- Si `pageRenderPath` existe déjà : juste lire la metadata sharp et return
- Sinon : `ensurePdf` + appel `Poppler.pdfToCairo(pdfPath, base, opts)` avec :

```ts
{
  firstPageToConvert: pageNumber,
  lastPageToConvert: pageNumber,
  pngFile: true,
  singleFile: true,           // sortie en {base}.png (pas de suffixe page)
  resolutionXAxis: 300,       // PDF_RENDER_DPI
  resolutionYAxis: 300,
}
```

- Vérifie que le fichier existe après appel
- Lit la metadata sharp pour récupérer width/height (le PDF rendu fait ~2480×3508 px
  pour une A4 à 300 DPI)

### Coordinate scaling

Les coordonnées du manifest sont dans l'espace GIF (435×619). Pour cropper depuis le
render PDF il faut les transformer :

```ts
export const gifToPdfScaleFactors = (pdfW, pdfH) => ({
  sx: pdfW / PAGE_WIDTH, sy: pdfH / PAGE_HEIGHT,
});

export const scaleCrop = (rect, {sx, sy}, bounds) => ({
  left: Math.floor(rect.x * sx),
  top: Math.floor(rect.y * sy),
  width: Math.min(Math.ceil(rect.width * sx), bounds.width - left),
  height: Math.min(Math.ceil(rect.height * sy), bounds.height - top),
});
```

---

## 9. Crops & pages (`src/sesamath/crop.ts`)

Quatre fonctions publiques avec **logique de fallback transparent** :

```ts
cropExercise(exercise, scale = DEFAULT_CROP_SCALE) : Promise<Buffer>
upscalePageImage(page, scale = DEFAULT_PAGE_SCALE) : Promise<Buffer>
```

Chaque fonction essaie d'abord le pipeline PDF si `isPdfCached(ouvrage)`, et fall back
sur le GIF upscaler si la tentative PDF échoue (log un warning, ne throw pas).

```ts
cropExerciseLegacy(exercise, scale)    // GIF + legacy upscale (pour /view/compare)
upscalePageImageLegacy(page, scale)    // idem pour page entière
```

Plus deux helpers d'écriture sur disque :

```ts
writeExerciseCrop(exercise, scale)   → out/crops/p{N}_ex{M}.png
writeUpscaledPageImage(page, scale)  → out/pages/p{N}_x{scale}.png
```

### Logique de crop PDF

```ts
const { renderPath, width: pw, height: ph } = await renderPdfPage(...);
const factors = gifToPdfScaleFactors(pw, ph);
const crop = scaleCrop(exercise, factors, { width: pw, height: ph });
return sharp(renderPath)
  .extract(crop)
  .resize({ width: exercise.width * scale, height: exercise.height * scale,
            fit: "fill", kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();
```

Le PDF étant ~5.7× plus grand que le GIF, on **downscale** au target — qualité optimale.

---

## 10. API Express (`src/api/app.ts`)

`export const createApp = (repository = new ManifestRepository(DEFAULT_OUVRAGE))` :

Middlewares : `cors()` + `express.json()`.

Helpers internes :

- `ouvrageFrom(req)` — lit `req.query.ouvrage`, défaut = repository.ouvrageId()
- `repositoryFor(req)` — réutilise le repo si même ouvrage, sinon `new ManifestRepository(o)`
- `ensurePageIndexed(repo, page)` — si page absente du manifest, appelle `buildIndex`
  pour cette page uniquement, puis `repo.clearCache()`. Permet l'**indexation à la demande**.

Validation Zod :

```ts
const numberParam = z.coerce.number().int().positive();
const optionalNumber = z.coerce.number().int().optional();
// + scale = z.coerce.number().int().min(1).max(8).default(DEFAULT_*).parse(...)
```

### Routes

| Méthode | Chemin | Handler |
|---|---|---|
| GET | `/` | `homeHtml({ouvrage, manifest, pdfCached, error})` |
| GET | `/health` | `{ ok, indexed, ouvrage, builtAt, pages, exercises }` |
| GET | `/view/page` | `pageViewHtml`, query `page`/`scale`/`ouvrage`, ensurePageIndexed |
| GET | `/view/exercise` | `exerciseViewHtml`, query `page`/`exercise`/`scale`/`ouvrage` |
| GET | `/view/compare` | `compareHtml`, query `mode=page|exercise`/`page`/`exercise`/`scale`/`ouvrage` |
| GET | `/api/openapi.json` | `openApiDocument` |
| GET | `/api/ouvrages` | `{ presets: OUVRAGE_PRESETS, local: localOuvrages() }` |
| GET | `/api/chapters` | `{ chapters }` |
| GET | `/api/pages` | `{ pages }` avec filtres `chapter`/`from`/`to` |
| GET | `/api/pages/:pageNumber` | `{ page }` ou 404 |
| GET | `/api/pages/:pageNumber/image` | image GIF native via `sendFile` |
| GET | `/api/pages/:pageNumber/upscaled-image` | PNG via `upscalePageImage`, query `scale` |
| GET | `/api/pages/:pageNumber/upscaled-image-legacy` | idem mais via `upscalePageImageLegacy` |
| GET | `/api/exercises` | filtres `page`/`number`/`chapter`/`q` |
| GET | `/api/exercises/:exerciseNumber` | toutes occurrences, filtre `page` |
| GET | `/api/exercises/:exerciseNumber/crop` | PNG via `cropExercise`, query `page`/`scale` |
| GET | `/api/exercises/:exerciseNumber/crop-legacy` | idem mais via `cropExerciseLegacy` |
| GET | `/api/search` | `{ query, pages, exercises }`, query `q` |
| GET | `/api/pdf/status` | `{ ouvrage, cached, url }` |
| POST | `/api/pdf/fetch` | `ensurePdf()`, return `{ ok, cached }` |

Error middleware terminal : retourne `{ error: message }` en 400.

### Server (`src/api/server.ts`)

```ts
import { createApp } from "./app";
const app = createApp();
app.listen(4310, () => {
  console.log("Sesamath Manuel API: http://localhost:4310");
  console.log("CLI rapide: npm run sesa -- ex 60 p256 --open");
});
```

---

## 11. Interface localhost (`src/api/home.ts`)

Design : **minimal type Anthropic/Linear**. Aucune icône. Une seule couleur d'accent.

### Tokens CSS (variables)

```css
:root {
  --ink:     #0f0f0f;       /* texte principal */
  --text:    #3a3a3a;       /* texte secondaire */
  --muted:   #888;          /* labels */
  --subtle:  #bbb;
  --line:    #e8e8e8;       /* bordures */
  --bg:      #fff;          /* fond */
  --surface: #fafafa;       /* surfaces secondaires */
  --orange:  #c96438;       /* unique accent */
  --orange-dim: #f0e6dc;
}
```

Font : `Inter` via Google Fonts (`@import url('...Inter:opsz,wght@...')`), fallback
`ui-sans-serif, system-ui, -apple-system, sans-serif`. Tailles 13-14px de base,
titres jusqu'à 56px en font-weight 800, `letter-spacing: -0.03em`.

### Composants visuels (par classe CSS)

- `.topbar` : sticky 52px, `border-bottom: 1px solid var(--line)`, fond
  `rgba(255,255,255,0.92)` + `backdrop-filter: blur(12px)`. Contient `.brand` (point
  orange 8px + texte "Sesamath" 700) et `.status` (point vert + nom ouvrage)
- `.shell` : `max-width: 1160px`, padding fluide
- `.hero` : h1 jusqu'à 56px avec `<span class="accent">page</span>` orange, paragraphe
  muted 15px
- `.card` : `border: 1px solid var(--line); border-radius: 12px; background: white`
- `.launcher-grid` : 2 colonnes séparées par 1px de fond `var(--line)` (technique :
  `gap:1px; background:var(--line)` sur le parent, fond `var(--bg)` sur les enfants)
- `.btn-primary` : fond `var(--ink)` blanc texte ; `.btn-secondary` : surface +
  bordure
- `.metric` : grand chiffre 26px font-800, label muted 12px
- `.quick-link` : liste verticale avec divider 1px et hover `var(--surface)`
- `.command-grid` : 3 colonnes même technique de séparateurs 1px
- `code` : monospace 12px, fond `var(--surface)`, bordure, padding 10×12
- `.chip` : pill 999px radius pour la nav viewer

### Pages générées

1. **`homeHtml({ouvrage, manifest, pdfCached, error})`** :
   - Hero avec titre "Ouvre une page, zoome si besoin."
   - Workspace 2 colonnes : à gauche carte avec 2 formulaires (Page, Exercice — selects
     ouvrage + inputs page/exercise/scale + btn-primary "Ouvrir" / btn-secondary "Crop")
   - À droite carte sidebar : metrics (pages, exercices) + quick-list (Page 256,
     Exercice 60, Ouvrages, OpenAPI) + **bloc PDF** avec badge "prêt"/"non téléchargé"
     et bouton "Télécharger (~100 MB)" qui POST `/api/pdf/fetch` puis reload
   - Sections "Commandes" (3 commandes CLI) et "API" (2 commandes curl)
   - Bandeau d'erreur si `params.error`

2. **`pageViewHtml({ouvrage, page, scale, imageUrl})`** : topbar + viewer-head (titre
   "Page N" + meta) + viewer-actions (chips "← Préc.", "Suiv. →", "Télécharger") +
   `.viewer-img` qui affiche le PNG + commande CLI en footer

3. **`exerciseViewHtml(...)`** : pareil mais sans navigation entre pages, chip "Voir la
   page" qui pointe vers la page entière

4. **`compareHtml({ouvrage, mode, page, exercise, scale, beforeUrl, afterUrl})`** :
   slider before/after en CSS pur :
   - Wrap avec `--split: 50%`
   - Image "before" en fond (vieux pipeline GIF)
   - Image "after" dans un `<div class="layer-after">` avec `width: var(--split);
     overflow: hidden`, position absolute, image dedans en `width:100%`
   - Divider 2px blanc + handle rond 36px
   - `<input type="range" class="slider-input">` opacité 0 sur toute la zone
   - JS : `slider.addEventListener('input', () => wrap.style.setProperty('--split',
     slider.value + '%'))`
   - Tabs en haut pour switcher entre mode page/exercice
   - Overlay "Chargement…" jusqu'à ce que les 2 images load
   - Form en bas pour changer les paramètres

### Conventions HTML

- Échapper le texte utilisateur via `escapeHtml(value)` (& < > " → entités)
- Encoder les URL via `encodeURIComponent` pour le param `ouvrage`
- Pas d'emoji nulle part
- Tout le CSS inline dans un seul `<style>` (sharedStyles) injecté dans chaque template

---

## 12. OpenAPI (`src/api/openapi.ts`)

Document OpenAPI 3.1.0 minimal qui liste chaque route avec un `summary` court (pas de
schemas request/response, juste l'overview). Version "1.1.0".

---

## 13. CLIs

### `scripts/build-index.ts`

CLI longue forme pour indexation. Args :

- `--ouvrage <id>` / `--book <id>` (défaut `DEFAULT_OUVRAGE`)
- `--page <N>` / `-p <N>` — indexe une seule page
- `--from <N>` / `--to <N>` — plage explicite
- `--force` — re-télécharge même si fichiers existants

Si ni `--page` ni `--from/--to` : utilise `defaultRangeForOuvrage` du preset.

### `scripts/sesa.ts`

CLI courte multi-commande :

```bash
npm run sesa -- ex 60 p256 --open          # crop exercice 60 page 256 + open
npm run sesa -- page p256 --open           # page entière p256 + open
npm run sesa -- index --ouvrage X --from N --to M
npm run sesa -- books                      # liste des presets
```

Options communes : `--ouvrage`, `--scale` (défaut 5), `--open` (ouvre le PNG généré
avec l'application système : `cmd /c start` sur Windows, `open` sur Mac, `xdg-open`
sur Linux).

Logique : `parsePage("p256")` accepte `p256` ou `256`. Indexation auto si la page n'est
pas dans le manifest.

Sans commande : print help.

### `scripts/prepare-demo-assets.ts`

Génère les 4 PNG dans `public/demo/` :

- `p256_ex60.png` (scale 5)
- `p259_ex88.png` (scale 5)
- `p256_page_x2.png` (scale 2)
- `p259_page_x2.png` (scale 2)

### `scripts/smoke-test.ts`

Test rapide : charge le manifest `ms2_2019`, vérifie qu'il y a des pages et des
exercices, génère un crop, log le résultat. Exit 1 si échec.

---

## 14. Vidéo Remotion (`src/video/`)

Composition `SesamathApiVideo`, 1920×1080, 30fps, **540 frames (18 secondes)**, codec h264.

### Structure 4 scènes

1. **Hero** (frames 0-150, 5s) : product-label "Sesamath Manuel API", h1 "Le manuel
   devient une surface interrogeable.", paragraphe pipeline, 4 chips (PDF vectoriel,
   390 pages, 1 933 exercices, OpenAPI)
2. **Pipeline** (frames 150-285, 4.5s) : section-title "Pipeline" + h2 "Une image devient
   une donnée fiable." + SVG diagramme `ApiDiagram` : 3 cartes (PDF Sesamath →
   poppler 300 DPI → PNG net) reliées par 2 flèches qui se dessinent au cours du temps
   (`pathLength="1"` + `strokeDashoffset` animé), endpoint sample en bas
3. **Qualité image** (285-420, 4.5s) : section-title "Qualité image" + h2 "Du PDF
   vectoriel au PNG. Aucun upscaling." + 3 `CommandLine` qui slident depuis la gauche
   (build / pdf / crop) + `.browser-frame` en bas-droite avec la page p256 en fond
   + le crop ex60 en overlay
4. **Repo** (420-540, 4s) : section-title "Repo" + h2 "Un outil local, pas une capture
   figée." + 4 cartes avec border-top colorée (src/api, src/sesamath, src/sesamath/pdf.ts,
   src/video)

### Composants

- `Lift({delay, className})` : wrapper qui anime opacity 0→1 + translateY 28→0px sur
  24 frames avec Easing.bezier(0.2, 0, 0, 1)
- `BrandMark({delay})` : top-left absolute, point orange 14px + texte "Sesamath" 28px,
  fade-in
- `CommandLine({label, text, delay})` : label coloré accent + code monospace, slide
  depuis -18px
- `ApiDiagram` : `<svg viewBox="0 0 1180 500">` avec 3 rect cards, 3 paires de text
  (title 34px / sub 24px), 2 path animés, 1 endpoint-box rectangulaire avec text

### Style (`src/video/style.css`) — palette Anthropic

```css
.video-root {
  background: #f7f3ed;       /* crème chaud */
  color: #1c1916;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}
.material-grid {              /* fond grille subtile */
  background-image:
    linear-gradient(90deg, rgba(50,30,10,0.038) 1px, transparent 1px),
    linear-gradient(rgba(50,30,10,0.038) 1px, transparent 1px);
  background-size: 72px 72px;
}
.section-title span { color: #c96438; }   /* eyebrow accent */
```

Variantes de chips : `.orange-chip` (#f0e6dc/#a34e2a), `.sand-chip`, `.warm-chip`,
`.neutral-chip`. Variantes de cartes diagram : `.card-orange`, `.card-sand`, `.card-warm`.
Borders cartes repo : `.border-1` à `.border-4` (gradient orange→sand). Pas de classes
Google (`.blue`, `.red`, etc.) — strictement interdit.

### Lancement

```bash
npm run video:studio          # studio interactif
npm run video:still           # still frame (frame 90, scale 0.5)
npm run video:render          # MP4 final dans out/sesamath-api-demo.mp4
```

---

## 15. Conventions de code

- **TypeScript strict** : `noImplicitAny`, `strictNullChecks`, etc.
- **Pas de commentaires inutiles** : seulement quand le pourquoi est non-évident
  (workaround, contrainte cachée, invariant subtil)
- **Pas d'emojis** dans le code, les UI, les commits
- **Pas d'over-engineering** : pas de feature flags, pas de fallback pour des cas
  impossibles, pas de validation pour du code interne
- **Style fonctionnel** : préférer les `const` arrow functions au lieu de `function`
  pour les helpers ; classes seulement quand on a un état (ex: `ManifestRepository`)
- **Naming** : camelCase pour variables/fonctions, PascalCase pour types/composants
- **Imports** : tri par bloc (node builtins, deps externes, deps internes)
- **Pas de re-exports inutiles** dans `src/index.ts` — juste les types et fonctions du
  cœur API
- Les helpers internes d'un module ne sont pas exportés
- Erreurs : `throw new Error("...")` avec un message en français qui suggère la
  prochaine action (ex: "Lance npm run build:index")

---

## 16. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "allowImportingTsExtensions": false,
    "isolatedModules": true
  },
  "include": ["src", "scripts", "remotion.config.ts"]
}
```

---

## 17. Scripts npm

```json
{
  "dev": "tsx src/api/server.ts",
  "start": "tsx src/api/server.ts",
  "api": "tsx src/api/server.ts",
  "sesa": "tsx scripts/sesa.ts",
  "build:index": "tsx scripts/build-index.ts",
  "build:index:functions": "tsx scripts/build-index.ts --from 189 --to 268",
  "prepare:video": "tsx scripts/prepare-demo-assets.ts",
  "video:studio": "remotion studio src/video/index.ts",
  "video:still": "remotion still src/video/index.ts SesamathApiVideo out/sesamath-api-still.png --frame=90 --scale=0.5",
  "video:render": "remotion render src/video/index.ts SesamathApiVideo out/sesamath-api-demo.mp4",
  "smoke": "tsx scripts/smoke-test.ts",
  "build": "npm run build:index:functions && npm run prepare:video && npm run video:still",
  "upgrade": "remotion upgrade",
  "lint": "eslint src scripts && tsc"
}
```

---

## 18. README minimal

```markdown
# Sesamath Manuel API

API locale Node.js/TypeScript qui transforme les manuels Sesamath en service
interrogeable. Indexation pages/exercices, crops PNG, images haute qualité via PDF
vectoriel + poppler 300 DPI, interface localhost et démo vidéo Remotion.

## Démarrage rapide
npm install && npm run build:index && npm run api  → http://localhost:4310

## Images haute qualité
Bouton "Télécharger PDF" dans l'UI → toutes les routes image passent automatiquement
en pipeline PDF poppler 300 DPI (textes vectoriels parfaits).

## API
Table des routes principales (cf section 10).

## Scripts
Table des scripts npm.

## Licence
MIT — extraits/crops restent sous licence Sesamath (CC-BY-SA / GNU FDL). Pas affilié.
```

---

## 19. Spec de comportement (acceptance criteria)

Le projet est correct quand :

1. `npm install && npm run build:index -- --from 250 --to 260` → crée
   `data/ms2_2019/manifest.json` avec ~11 pages indexées et plusieurs exercices
2. `npm run api` → serveur démarre sur 4310, log "Sesamath Manuel API: ..."
3. `curl localhost:4310/api/pages/256` → retourne le PageRecord JSON
4. `curl localhost:4310/api/exercises/60/crop?page=256&scale=5 -o ex.png` → PNG ~80KB
   d'un exercice math lisible
5. Ouvrir `http://localhost:4310` → UI minimal Anthropic, badge "PDF non téléchargé"
6. Cliquer "Télécharger PDF" → ensurePdf, ~100MB, badge passe à "prêt"
7. Refresh + `/view/exercise?page=256&exercise=60&scale=5` → texte vectoriel net
8. `/view/compare?mode=exercise&...` → slider qui révèle avant/après
9. `rtk tsc --noEmit` → 0 erreur
10. `npm run video:render` → MP4 4MB de 18s dans `out/`
11. Page 257 non indexée + GET `/view/page?page=257` → indexation automatique puis
    affichage

---

Fin du gigaprompt. Tout est ici.
