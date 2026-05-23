import type { Manifest } from "../sesamath/types";
import { DEFAULT_OUVRAGE, OUVRAGE_PRESETS } from "../sesamath/constants";

const escapeHtml = (value: string): string => {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

const shellCommand = (command: string): string => `<code>${escapeHtml(command)}</code>`;

const ouvrageOptions = (selected: string): string => {
  const ids = new Set([selected, DEFAULT_OUVRAGE, ...OUVRAGE_PRESETS.map((preset) => preset.id)]);
  return [...ids]
    .map((id) => {
      const preset = OUVRAGE_PRESETS.find((item) => item.id === id);
      const label = preset ? `${preset.id} - ${preset.title}` : id;
      return `<option value="${escapeHtml(id)}" ${id === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
};

const shellCard = (title: string, command: string): string => `
  <article class="command-card">
    <span>${escapeHtml(title)}</span>
    ${shellCommand(command)}
  </article>`;

const sharedStyles = `
  :root {
    color-scheme: light;
    --ink: #1f1f1f;
    --text: #3c4043;
    --muted: #6b7280;
    --line: #dfe3ea;
    --line-strong: #c7d0dd;
    --surface: rgba(255, 255, 255, .86);
    --surface-solid: #fff;
    --page: #f8fafd;
    --blue: #4285f4;
    --red: #ea4335;
    --yellow: #fbbc04;
    --green: #34a853;
    --gemini-a: #4f7cff;
    --gemini-b: #9b72f2;
    --gemini-c: #24c6dc;
    --shadow: 0 22px 70px rgba(60, 64, 67, .14);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    color: var(--ink);
    background:
      linear-gradient(135deg, rgba(66, 133, 244, .12), transparent 28%),
      linear-gradient(315deg, rgba(155, 114, 242, .10), transparent 30%),
      linear-gradient(90deg, rgba(60, 64, 67, .045) 1px, transparent 1px),
      linear-gradient(rgba(60, 64, 67, .045) 1px, transparent 1px),
      #fff;
    background-size: auto, auto, 56px 56px, 56px 56px, auto;
    font-family: "Google Sans Text", "Google Sans", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
  }
  a { color: #1a73e8; text-decoration: none; font-weight: 750; }
  button, input, select { font: inherit; }
  code {
    display: block;
    padding: 13px 14px;
    border-radius: 14px;
    background: #f1f3f4;
    color: #174ea6;
    font: 14px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    padding: 16px clamp(18px, 4vw, 54px);
    border-bottom: 1px solid rgba(223, 227, 234, .74);
    background: rgba(255, 255, 255, .72);
    backdrop-filter: blur(18px);
  }
  .brand { display: flex; align-items: center; gap: 12px; font-weight: 850; }
  .spark {
    width: 34px;
    height: 34px;
    border-radius: 13px;
    background: conic-gradient(from 210deg, var(--blue), var(--gemini-b), var(--gemini-c), var(--green), var(--blue));
    box-shadow: 0 10px 24px rgba(66, 133, 244, .28);
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: var(--text);
    font-size: 14px;
    font-weight: 700;
  }
  .status-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--green); }
  .status-dot.empty { background: var(--yellow); }
  .shell { max-width: 1240px; margin: 0 auto; padding: 42px 24px 74px; }
  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1.52fr) 360px;
    gap: 24px;
    align-items: start;
  }
  .local-card, .side-card, .panel, .viewer-card {
    border: 1px solid rgba(223, 227, 234, .92);
    background: var(--surface);
    box-shadow: var(--shadow);
    backdrop-filter: blur(20px);
  }
  .local-card {
    position: relative;
    overflow: hidden;
    border-radius: 34px;
    padding: clamp(24px, 3vw, 36px);
  }
  .local-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 6px;
    background: linear-gradient(90deg, var(--blue), var(--gemini-b), var(--gemini-c), var(--green));
  }
  .eyebrow {
    display: inline-flex;
    width: max-content;
    align-items: center;
    gap: 9px;
    min-height: 34px;
    padding: 0 13px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: #174ea6;
    font-weight: 800;
    font-size: 14px;
  }
  h1 {
    max-width: 780px;
    margin: 22px 0 0;
    font-size: clamp(38px, 5.4vw, 68px);
    line-height: .98;
    letter-spacing: -2px;
  }
  .gemini-word {
    background: linear-gradient(90deg, #174ea6, #7b61ff, #0b8793);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .lead { max-width: 760px; margin: 16px 0 0; color: var(--text); font-size: 20px; line-height: 1.42; }
  .launcher-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 24px; }
  .launcher {
    border: 1px solid var(--line);
    border-radius: 26px;
    background: #fff;
    padding: 20px;
  }
  .launcher.primary {
    border-color: rgba(66, 133, 244, .38);
    background: linear-gradient(180deg, #fff, #f7fbff);
  }
  .launcher h2 { margin: 0; font-size: 25px; letter-spacing: -.2px; }
  .launcher p { margin: 8px 0 18px; color: var(--muted); line-height: 1.35; }
  .form-grid { display: grid; grid-template-columns: 1fr 120px 100px; gap: 12px; align-items: end; }
  .exercise-form { grid-template-columns: 1fr 1fr; }
  .form-grid label:first-child { grid-column: 1 / -1; }
  label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; font-weight: 850; letter-spacing: .05em; text-transform: uppercase; }
  input, select {
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 15px;
    background: #fff;
    color: var(--ink);
    outline: none;
  }
  input:focus, select:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(66, 133, 244, .16); }
  .action {
    height: 48px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: #0b57d0;
    color: #fff;
    font-weight: 850;
    cursor: pointer;
    white-space: nowrap;
  }
  .action.secondary { background: #eef3fe; color: #174ea6; }
  .side-card { border-radius: 30px; padding: 24px; }
  .side-card h2 { margin: 0 0 16px; font-size: 20px; }
  .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .metric { border-radius: 20px; background: #f6f8fc; padding: 18px; }
  .metric b { display: block; color: #0b57d0; font-size: 31px; line-height: 1; }
  .metric span { display: block; margin-top: 8px; color: var(--muted); font-size: 13px; }
  .quick-list { display: grid; gap: 10px; margin-top: 18px; }
  .quick-list a { display: flex; justify-content: space-between; gap: 12px; padding: 13px 14px; border-radius: 16px; background: #fff; border: 1px solid var(--line); color: var(--ink); }
  .panel { margin-top: 24px; border-radius: 30px; padding: 26px; }
  .panel h2 { margin: 0 0 16px; font-size: 24px; }
  .command-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .command-card { border: 1px solid var(--line); border-radius: 22px; background: #fff; padding: 18px; }
  .command-card span { display: block; margin-bottom: 12px; font-weight: 850; }
  .error { margin-top: 18px; padding: 14px 16px; border-radius: 16px; background: #fce8e6; color: #a50e0e; }
  .viewer-shell { max-width: 1180px; margin: 0 auto; padding: 34px 22px 70px; }
  .viewer-head { display: flex; justify-content: space-between; gap: 18px; align-items: start; margin-bottom: 24px; }
  .viewer-head h1 { margin: 0; max-width: none; font-size: clamp(34px, 6vw, 62px); }
  .viewer-meta { margin-top: 8px; color: var(--muted); }
  .viewer-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .chip-link { display: inline-flex; align-items: center; min-height: 42px; padding: 0 15px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: #174ea6; }
  .viewer-card { border-radius: 30px; overflow: hidden; background: #fff; }
  .viewer-card img { display: block; width: 100%; height: auto; }
  .page-frame { max-width: 920px; margin: 0 auto; padding: 18px; background: #fff; }
  .page-frame img { border: 1px solid var(--line); border-radius: 20px; }
  .crop-frame img { width: 100%; }
  .footer-command { margin-top: 16px; }
  @media (max-width: 980px) {
    .workspace, .launcher-grid, .command-grid { grid-template-columns: 1fr; }
    .form-grid, .exercise-form { grid-template-columns: 1fr 1fr; }
    .action { grid-column: 1 / -1; }
  }
  @media (max-width: 560px) {
    .topbar { align-items: start; flex-direction: column; }
    .shell { padding: 24px 14px 52px; }
    h1 { font-size: 43px; letter-spacing: -1.2px; }
    .local-card, .side-card, .panel { border-radius: 24px; padding: 20px; }
    .form-grid, .exercise-form, .metric-grid { grid-template-columns: 1fr; }
    .viewer-head { flex-direction: column; }
    .viewer-actions { justify-content: flex-start; }
  }
`;

export const homeHtml = (params: { ouvrage: string; manifest: Manifest | null; error?: string }): string => {
  const indexed = params.manifest !== null;
  const pageCount = params.manifest?.pages.length ?? 0;
  const exerciseCount = params.manifest?.exercises.length ?? 0;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sesamath Localhost</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <header class="topbar">
    <div class="brand"><span class="spark"></span><span>Sesamath Localhost</span></div>
    <div class="status-pill"><span class="status-dot ${indexed ? "" : "empty"}"></span>${indexed ? `Index pret &middot; ${escapeHtml(params.ouvrage)}` : "Index a la demande"}</div>
  </header>

  <main class="shell">
    <section class="workspace">
      <div class="local-card">
        <span class="eyebrow">Mode localhost d'abord</span>
        <h1>Ouvre une <span class="gemini-word">page</span>, puis zoome si besoin.</h1>
        <p class="lead">L'API reste disponible, mais l'usage normal se fait ici : page entiere, exercice croppe, ouvrage, scale. Les pages manquantes sont indexees a la demande.</p>

        ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ""}

        <div class="launcher-grid">
          <article class="launcher primary">
            <h2>Ouvrir une page</h2>
            <p>Le mode principal : consulter la page du manuel sans choisir d'exercice.</p>
            <form class="form-grid" action="/view/page" method="get">
              <label>Ouvrage
                <select name="ouvrage">${ouvrageOptions(params.ouvrage)}</select>
              </label>
              <label>Page
                <input name="page" value="256" inputmode="numeric">
              </label>
              <label>Scale
                <input name="scale" value="2" inputmode="numeric">
              </label>
              <button class="action" type="submit">Ouvrir</button>
            </form>
          </article>

          <article class="launcher">
            <h2>Ouvrir un exercice</h2>
            <p>Pour isoler un enonce et l'obtenir en PNG propre.</p>
            <form class="form-grid exercise-form" action="/view/exercise" method="get">
              <label>Ouvrage
                <select name="ouvrage">${ouvrageOptions(params.ouvrage)}</select>
              </label>
              <label>Page
                <input name="page" value="256" inputmode="numeric">
              </label>
              <label>Exercice
                <input name="exercise" value="60" inputmode="numeric">
              </label>
              <label>Scale
                <input name="scale" value="5" inputmode="numeric">
              </label>
              <button class="action secondary" type="submit">Crop</button>
            </form>
          </article>
        </div>
      </div>

      <aside class="side-card">
        <h2>Index local</h2>
        <div class="metric-grid">
          <div class="metric"><b>${pageCount}</b><span>pages</span></div>
          <div class="metric"><b>${exerciseCount}</b><span>exercices</span></div>
        </div>
        <nav class="quick-list" aria-label="Raccourcis">
          <a href="/view/page?page=256&scale=2&ouvrage=${encodeURIComponent(params.ouvrage)}"><span>Page 256</span><b>ouvrir</b></a>
          <a href="/view/exercise?page=256&exercise=60&scale=5&ouvrage=${encodeURIComponent(params.ouvrage)}"><span>Exercice 60</span><b>crop</b></a>
          <a href="/api/ouvrages"><span>Ouvrages</span><b>JSON</b></a>
          <a href="/api/openapi.json"><span>OpenAPI</span><b>JSON</b></a>
        </nav>
      </aside>
    </section>

    <section class="panel">
      <h2>Commandes utiles</h2>
      <div class="command-grid">
        ${shellCard("Une page sans interface", "npm run sesa -- page p256 --open")}
        ${shellCard("Un exercice croppe", "npm run sesa -- ex 60 p256 --open")}
        ${shellCard("Un autre manuel", "npm run build:index -- --ouvrage ms1spe_2019 --from 250 --to 260")}
      </div>
    </section>

    <section class="panel">
      <h2>API seulement si tu en as besoin</h2>
      ${shellCommand('curl.exe "http://localhost:4310/api/pages/256/upscaled-image?scale=2" --output page256.png')}
      ${shellCommand('curl.exe "http://localhost:4310/api/exercises/60/crop?page=256&scale=5" --output ex60.png')}
    </section>
  </main>
</body>
</html>`;
};

export const pageViewHtml = (params: { ouvrage: string; page: number; scale: number; imageUrl: string }): string => {
  const title = `Page ${params.page}`;
  const prev = Math.max(1, params.page - 1);
  const next = params.page + 1;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/"><span class="spark"></span><span>Sesamath Localhost</span></a>
    <div class="status-pill"><span class="status-dot"></span>${escapeHtml(params.ouvrage)}</div>
  </header>
  <main class="viewer-shell">
    <section class="viewer-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <div class="viewer-meta">${escapeHtml(params.ouvrage)} &middot; page entiere &middot; scale ${params.scale}</div>
      </div>
      <nav class="viewer-actions" aria-label="Navigation page">
        <a class="chip-link" href="/view/page?page=${prev}&scale=${params.scale}&ouvrage=${encodeURIComponent(params.ouvrage)}">Page precedente</a>
        <a class="chip-link" href="/view/page?page=${next}&scale=${params.scale}&ouvrage=${encodeURIComponent(params.ouvrage)}">Page suivante</a>
        <a class="chip-link" href="${escapeHtml(params.imageUrl)}" download>Telecharger PNG</a>
      </nav>
    </section>
    <section class="viewer-card page-frame">
      <img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(title)}">
    </section>
    <div class="footer-command">${shellCommand(`npm run sesa -- page p${params.page} --ouvrage ${params.ouvrage} --open`)}</div>
  </main>
</body>
</html>`;
};

export const exerciseViewHtml = (params: { ouvrage: string; page: number; exercise: number; scale: number; imageUrl: string }): string => {
  const title = `Exercice ${params.exercise} page ${params.page}`;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/"><span class="spark"></span><span>Sesamath Localhost</span></a>
    <div class="status-pill"><span class="status-dot"></span>${escapeHtml(params.ouvrage)}</div>
  </header>
  <main class="viewer-shell">
    <section class="viewer-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <div class="viewer-meta">${escapeHtml(params.ouvrage)} &middot; crop PNG &middot; scale ${params.scale}</div>
      </div>
      <nav class="viewer-actions" aria-label="Navigation exercice">
        <a class="chip-link" href="/view/page?page=${params.page}&scale=2&ouvrage=${encodeURIComponent(params.ouvrage)}">Voir la page</a>
        <a class="chip-link" href="${escapeHtml(params.imageUrl)}" download>Telecharger PNG</a>
      </nav>
    </section>
    <section class="viewer-card crop-frame">
      <img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(title)}">
    </section>
    <div class="footer-command">${shellCommand(`npm run sesa -- ex ${params.exercise} p${params.page} --ouvrage ${params.ouvrage} --open`)}</div>
  </main>
</body>
</html>`;
};
