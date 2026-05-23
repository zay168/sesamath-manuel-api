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
    <p class="card-label">${escapeHtml(title)}</p>
    ${shellCommand(command)}
  </article>`;

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:     #0f0f0f;
    --text:    #3a3a3a;
    --muted:   #888;
    --subtle:  #bbb;
    --line:    #e8e8e8;
    --bg:      #fff;
    --surface: #fafafa;
    --orange:  #c96438;
    --orange-dim: #f0e6dc;
  }

  body {
    font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--ink);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--orange); text-decoration: none; }
  a:hover { text-decoration: underline; }
  button, input, select { font: inherit; }

  /* ── Topbar ── */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 52px;
    padding: 0 clamp(20px, 4vw, 56px);
    border-bottom: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
  }

  .brand {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand:hover { text-decoration: none; }
  .brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--orange);
    flex-shrink: 0;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4caf72;
    flex-shrink: 0;
  }
  .status-dot.empty { background: #e0a832; }

  /* ── Shell ── */
  .shell {
    max-width: 1160px;
    margin: 0 auto;
    padding: 56px clamp(20px, 4vw, 56px) 96px;
  }

  /* ── Hero ── */
  .hero { margin-bottom: 56px; }
  .hero h1 {
    font-size: clamp(32px, 4.5vw, 56px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--ink);
  }
  .hero h1 .accent { color: var(--orange); }
  .hero p {
    margin-top: 16px;
    max-width: 560px;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.6;
  }

  /* ── Workspace ── */
  .workspace {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 24px;
    align-items: start;
    margin-bottom: 24px;
  }

  /* ── Cards ── */
  .card {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--bg);
  }
  .card-inner { padding: 24px; }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--line);
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .launcher-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); }
  .launcher { background: var(--bg); padding: 24px; }
  .launcher:first-child { border-radius: 12px 0 0 12px; }
  .launcher:last-child { border-radius: 0 12px 12px 0; }
  .launcher h2 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }
  .launcher p { color: var(--muted); font-size: 13px; margin-bottom: 20px; }

  .form-row { display: flex; flex-direction: column; gap: 12px; }
  .form-fields { display: grid; grid-template-columns: 1fr 80px 80px; gap: 8px; }
  .exercise-fields { grid-template-columns: 1fr 80px; }

  label {
    display: grid;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  input, select {
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--bg);
    color: var(--ink);
    font-size: 13px;
    outline: none;
    width: 100%;
    min-width: 0;
    transition: border-color 0.12s;
  }
  input:focus, select:focus { border-color: var(--orange); }

  .btn {
    height: 36px;
    padding: 0 16px;
    border: none;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.12s;
    white-space: nowrap;
  }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: var(--ink); color: #fff; }
  .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--line); }

  /* ── Sidebar ── */
  .metric-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--line);
  }
  .metric {
    background: var(--bg);
    padding: 20px;
  }
  .metric:first-child { border-radius: 0; }
  .metric b {
    display: block;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--ink);
  }
  .metric span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--muted);
  }

  .quick-list { padding: 8px 0; }
  .quick-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    font-size: 13px;
    color: var(--text);
    border-bottom: 1px solid var(--line);
    transition: background 0.1s;
  }
  .quick-link:last-child { border-bottom: none; }
  .quick-link:hover { background: var(--surface); text-decoration: none; }
  .quick-link span { color: var(--muted); }

  /* ── Panels ── */
  .panel { margin-bottom: 16px; }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .command-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .command-card { background: var(--bg); padding: 20px; }
  .card-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 10px;
  }

  code {
    display: block;
    font: 12px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px 12px;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .api-panel code { margin-bottom: 8px; }
  .api-panel code:last-child { margin-bottom: 0; }

  .error {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    background: #fff5f5;
    color: #c0392b;
    font-size: 13px;
    border: 1px solid #fad7d7;
  }

  /* ── Viewer ── */
  .viewer-shell {
    max-width: 1160px;
    margin: 0 auto;
    padding: 40px clamp(20px, 4vw, 56px) 80px;
  }
  .viewer-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 24px;
  }
  .viewer-head h1 {
    font-size: clamp(28px, 5vw, 52px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .viewer-meta {
    margin-top: 8px;
    font-size: 13px;
    color: var(--muted);
  }
  .viewer-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; padding-top: 4px; }
  .chip {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    transition: border-color 0.12s, background 0.12s;
  }
  .chip:hover { border-color: var(--ink); background: var(--surface); text-decoration: none; color: var(--ink); }

  .viewer-img { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .viewer-img img { display: block; width: 100%; height: auto; }
  .footer-cmd { margin-top: 16px; }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .workspace { grid-template-columns: 1fr; }
    .command-grid { grid-template-columns: 1fr; }
    .launcher-grid { grid-template-columns: 1fr; }
    .launcher:first-child { border-radius: 12px 12px 0 0; }
    .launcher:last-child { border-radius: 0 0 12px 12px; }
  }
  @media (max-width: 560px) {
    .hero h1 { font-size: 32px; }
    .form-fields, .exercise-fields { grid-template-columns: 1fr; }
    .viewer-head { flex-direction: column; }
    .viewer-actions { justify-content: flex-start; }
  }
`;

export const homeHtml = (params: { ouvrage: string; manifest: Manifest | null; pdfCached?: boolean; error?: string }): string => {
  const indexed = params.manifest !== null;
  const pageCount = params.manifest?.pages.length ?? 0;
  const exerciseCount = params.manifest?.exercises.length ?? 0;
  const pdfCached = params.pdfCached ?? false;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sesamath</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <span class="brand-dot"></span>
      Sesamath
    </div>
    <div class="status">
      <span class="status-dot ${indexed ? "" : "empty"}"></span>
      ${indexed ? escapeHtml(params.ouvrage) : "non index&eacute;"}
    </div>
  </header>

  <main class="shell">
    <div class="hero">
      <h1>Ouvre une <span class="accent">page</span>,<br>zoome si besoin.</h1>
      <p>Page entiere, exercice cropp&eacute;, ouvrage, scale. Les pages manquantes sont index&eacute;es &agrave; la demande.</p>
      ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ""}
    </div>

    <div class="workspace">
      <div class="card">
        <div class="launcher-grid">
          <div class="launcher">
            <h2>Page</h2>
            <p>Consulter une page compl&egrave;te du manuel.</p>
            <form class="form-row" action="/view/page" method="get">
              <label>Ouvrage
                <select name="ouvrage">${ouvrageOptions(params.ouvrage)}</select>
              </label>
              <div class="form-fields">
                <label>Page <input name="page" value="256" inputmode="numeric"></label>
                <label>Scale <input name="scale" value="2" inputmode="numeric"></label>
                <button class="btn btn-primary" type="submit">Ouvrir</button>
              </div>
            </form>
          </div>

          <div class="launcher">
            <h2>Exercice</h2>
            <p>Isoler un &eacute;nonc&eacute; en PNG propre.</p>
            <form class="form-row" action="/view/exercise" method="get">
              <label>Ouvrage
                <select name="ouvrage">${ouvrageOptions(params.ouvrage)}</select>
              </label>
              <div class="form-fields exercise-fields">
                <label>Page <input name="page" value="256" inputmode="numeric"></label>
                <label>Ex. <input name="exercise" value="60" inputmode="numeric"></label>
              </div>
              <div class="form-fields">
                <label>Scale <input name="scale" value="5" inputmode="numeric"></label>
                <span></span>
                <button class="btn btn-secondary" type="submit">Crop</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="metric-row">
          <div class="metric"><b>${pageCount}</b><span>pages</span></div>
          <div class="metric"><b>${exerciseCount}</b><span>exercices</span></div>
        </div>
        <nav class="quick-list" aria-label="Raccourcis">
          <a class="quick-link" href="/view/page?page=256&scale=2&ouvrage=${encodeURIComponent(params.ouvrage)}">Page 256 <span>ouvrir &rarr;</span></a>
          <a class="quick-link" href="/view/exercise?page=256&exercise=60&scale=5&ouvrage=${encodeURIComponent(params.ouvrage)}">Exercice 60 <span>crop &rarr;</span></a>
          <a class="quick-link" href="/api/ouvrages">Ouvrages <span>JSON &rarr;</span></a>
          <a class="quick-link" href="/api/openapi.json">OpenAPI <span>JSON &rarr;</span></a>
        </nav>

        <div style="border-top:1px solid var(--line);padding:16px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:${pdfCached ? "0" : "10px"}">
            <span style="font-size:13px;font-weight:600;color:var(--text)">PDF vectoriel</span>
            <span style="font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;background:${pdfCached ? "#e6f4ec" : "var(--surface)"};color:${pdfCached ? "#2d7a4f" : "var(--muted)"}">
              ${pdfCached ? "prêt" : "non téléchargé"}
            </span>
          </div>
          ${pdfCached ? "" : `<p style="font-size:12px;color:var(--muted);line-height:1.4;margin:0 0 10px">
            Le PDF Sesamath donne des images vectorielles parfaitement nettes — lettres lisses, aucun upscaling.
          </p>
          <button
            onclick="downloadPdf('${escapeHtml(params.ouvrage)}')"
            id="pdf-btn"
            class="btn btn-primary"
            style="width:100%;font-size:13px">
            Télécharger (~100 MB)
          </button>`}
        </div>
      </div>
    </div>

    <script>
    async function downloadPdf(ouvrage) {
      const btn = document.getElementById('pdf-btn');
      btn.disabled = true;
      btn.textContent = 'Téléchargement en cours…';
      try {
        const res = await fetch('/api/pdf/fetch?ouvrage=' + encodeURIComponent(ouvrage), { method: 'POST' });
        const data = await res.json();
        if (data.ok) { btn.textContent = 'Prêt ✓'; setTimeout(() => location.reload(), 800); }
        else { btn.disabled = false; btn.textContent = 'Erreur: ' + (data.error || '?'); }
      } catch(e) { btn.disabled = false; btn.textContent = 'Erreur réseau'; }
    }
    </script>

    <div class="panel">
      <p class="section-label">Commandes</p>
      <div class="command-grid">
        ${shellCard("Page sans interface", "npm run sesa -- page p256 --open")}
        ${shellCard("Exercice croppé", "npm run sesa -- ex 60 p256 --open")}
        ${shellCard("Autre manuel", "npm run build:index -- --ouvrage ms1spe_2019 --from 250 --to 260")}
      </div>
    </div>

    <div class="panel api-panel">
      <p class="section-label">API</p>
      ${shellCommand('curl.exe "http://localhost:4310/api/pages/256/upscaled-image?scale=2" --output page256.png')}
      ${shellCommand('curl.exe "http://localhost:4310/api/exercises/60/crop?page=256&scale=5" --output ex60.png')}
    </div>
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
    <a class="brand" href="/"><span class="brand-dot"></span>Sesamath</a>
    <div class="status"><span class="status-dot"></span>${escapeHtml(params.ouvrage)}</div>
  </header>
  <main class="viewer-shell">
    <div class="viewer-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="viewer-meta">${escapeHtml(params.ouvrage)} &middot; scale ${params.scale}</p>
      </div>
      <nav class="viewer-actions">
        <a class="chip" href="/view/page?page=${prev}&scale=${params.scale}&ouvrage=${encodeURIComponent(params.ouvrage)}">← Pr&eacute;c.</a>
        <a class="chip" href="/view/page?page=${next}&scale=${params.scale}&ouvrage=${encodeURIComponent(params.ouvrage)}">Suiv. →</a>
        <a class="chip" href="${escapeHtml(params.imageUrl)}" download>T&eacute;l&eacute;charger</a>
      </nav>
    </div>
    <div class="viewer-img"><img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(title)}"></div>
    <div class="footer-cmd">${shellCommand(`npm run sesa -- page p${params.page} --ouvrage ${params.ouvrage} --open`)}</div>
  </main>
</body>
</html>`;
};

export const compareHtml = (params: {
  ouvrage: string;
  mode: string;
  page: number;
  exercise: number;
  scale: number;
  beforeUrl: string;
  afterUrl: string;
}): string => {
  const isExercise = params.mode === "exercise";
  const title = isExercise ? `Exercice ${params.exercise} — p.${params.page}` : `Page ${params.page}`;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Comparer — ${escapeHtml(title)}</title>
  <style>
    ${sharedStyles}

    /* ── Compare-specific ── */
    .cmp-shell {
      max-width: 1160px;
      margin: 0 auto;
      padding: 40px clamp(20px, 4vw, 56px) 80px;
    }
    .cmp-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .cmp-head h1 {
      font-size: clamp(24px, 4vw, 44px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .cmp-meta { margin-top: 6px; font-size: 13px; color: var(--muted); }
    .cmp-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    /* Mode switcher tabs */
    .tab-group { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    .tab-group a {
      display: inline-flex;
      align-items: center;
      height: 34px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      background: var(--bg);
      text-decoration: none;
      border-right: 1px solid var(--line);
    }
    .tab-group a:last-child { border-right: none; }
    .tab-group a.active { background: var(--ink); color: #fff; }
    .tab-group a:hover:not(.active) { background: var(--surface); color: var(--ink); }

    /* Slider wrap */
    .slider-wrap {
      position: relative;
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      cursor: ew-resize;
      user-select: none;
      --split: 50%;
    }
    .slider-wrap img {
      display: block;
      width: 100%;
      height: auto;
    }
    /* After image sits on top, clipped to left portion */
    .layer-after {
      position: absolute;
      inset: 0;
      overflow: hidden;
      width: var(--split);
    }
    .layer-after img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      max-width: none;
    }
    /* Divider line */
    .divider {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--split);
      transform: translateX(-50%);
      width: 2px;
      background: #fff;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
      pointer-events: none;
    }
    /* Handle circle */
    .handle {
      position: absolute;
      top: 50%;
      left: var(--split);
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: var(--muted);
      pointer-events: none;
      letter-spacing: -1px;
    }
    /* Invisible range input covers the whole area */
    .slider-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: ew-resize;
      margin: 0;
    }
    /* Labels */
    .layer-label {
      position: absolute;
      top: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      pointer-events: none;
    }
    .label-before {
      right: 12px;
      background: rgba(0,0,0,0.55);
      color: #fff;
    }
    .label-after {
      left: 12px;
      background: var(--orange);
      color: #fff;
    }

    /* Loading state */
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: var(--muted);
    }
    .loading-overlay.hidden { display: none; }

    /* Config form */
    .cmp-form {
      margin-top: 20px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .cmp-form label { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; display: grid; gap: 5px; }
    .cmp-form input, .cmp-form select { height: 36px; padding: 0 10px; border: 1px solid var(--line); border-radius: 7px; font: inherit; font-size: 13px; color: var(--ink); background: var(--bg); outline: none; }
    .cmp-form input { width: 72px; }
    .cmp-form input:focus, .cmp-form select:focus { border-color: var(--orange); }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/"><span class="brand-dot"></span>Sesamath</a>
    <div class="status"><span class="status-dot"></span>${escapeHtml(params.ouvrage)}</div>
  </header>

  <main class="cmp-shell">
    <div class="cmp-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="cmp-meta">scale ${params.scale} &middot; ${escapeHtml(params.ouvrage)} &middot; glisse le curseur pour comparer</p>
      </div>
      <div class="cmp-controls">
        <div class="tab-group">
          <a href="/view/compare?mode=page&page=${params.page}&scale=2&ouvrage=${encodeURIComponent(params.ouvrage)}"
             class="${!isExercise ? "active" : ""}">Page</a>
          <a href="/view/compare?mode=exercise&page=${params.page}&exercise=${params.exercise}&scale=5&ouvrage=${encodeURIComponent(params.ouvrage)}"
             class="${isExercise ? "active" : ""}">Exercice</a>
        </div>
        <a class="chip" href="/">← Accueil</a>
      </div>
    </div>

    <div class="slider-wrap" id="wrap">
      <div class="loading-overlay" id="loading">Chargement&hellip;</div>

      <!-- Before: original pipeline (underneath) -->
      <img id="img-before" alt="Avant" src="${escapeHtml(params.beforeUrl)}">

      <!-- After: new pipeline (clipped on top) -->
      <div class="layer-after" id="layer-after">
        <img id="img-after" alt="Apres" src="${escapeHtml(params.afterUrl)}">
      </div>

      <div class="divider" id="divider"></div>
      <div class="handle" id="handle">&#8644;</div>

      <span class="layer-label label-after">Nouveau</span>
      <span class="layer-label label-before">Avant</span>

      <input type="range" class="slider-input" id="slider" min="0" max="100" value="50" step="0.1">
    </div>

    <form class="cmp-form" method="get" action="/view/compare">
      <input type="hidden" name="mode" value="${escapeHtml(params.mode)}">
      <input type="hidden" name="ouvrage" value="${escapeHtml(params.ouvrage)}">
      <label>Page <input name="page" value="${params.page}" inputmode="numeric"></label>
      ${isExercise ? `<label>Exercice <input name="exercise" value="${params.exercise}" inputmode="numeric"></label>` : ""}
      <label>Scale <input name="scale" value="${params.scale}" inputmode="numeric"></label>
      <button class="btn btn-primary" type="submit" style="align-self:end">Recharger</button>
    </form>
  </main>

  <script>
    const wrap = document.getElementById('wrap');
    const slider = document.getElementById('slider');
    const loading = document.getElementById('loading');
    const imgBefore = document.getElementById('img-before');
    const imgAfter = document.getElementById('img-after');

    let loaded = 0;
    const onLoad = () => { if (++loaded >= 2) loading.classList.add('hidden'); };
    imgBefore.addEventListener('load', onLoad);
    imgAfter.addEventListener('load', onLoad);
    if (imgBefore.complete) onLoad();
    if (imgAfter.complete) onLoad();

    slider.addEventListener('input', () => {
      wrap.style.setProperty('--split', slider.value + '%');
    });
  </script>
</body>
</html>`;
};

export const exerciseViewHtml = (params: { ouvrage: string; page: number; exercise: number; scale: number; imageUrl: string }): string => {
  const title = `Exercice ${params.exercise} — p.${params.page}`;
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
    <a class="brand" href="/"><span class="brand-dot"></span>Sesamath</a>
    <div class="status"><span class="status-dot"></span>${escapeHtml(params.ouvrage)}</div>
  </header>
  <main class="viewer-shell">
    <div class="viewer-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="viewer-meta">${escapeHtml(params.ouvrage)} &middot; scale ${params.scale}</p>
      </div>
      <nav class="viewer-actions">
        <a class="chip" href="/view/page?page=${params.page}&scale=2&ouvrage=${encodeURIComponent(params.ouvrage)}">Voir la page</a>
        <a class="chip" href="${escapeHtml(params.imageUrl)}" download>T&eacute;l&eacute;charger</a>
      </nav>
    </div>
    <div class="viewer-img"><img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(title)}"></div>
    <div class="footer-cmd">${shellCommand(`npm run sesa -- ex ${params.exercise} p${params.page} --ouvrage ${params.ouvrage} --open`)}</div>
  </main>
</body>
</html>`;
};
