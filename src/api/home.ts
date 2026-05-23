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

export const homeHtml = (params: { ouvrage: string; manifest: Manifest | null; error?: string }): string => {
  const indexed = params.manifest !== null;
  const pageCount = params.manifest?.pages.length ?? 0;
  const exerciseCount = params.manifest?.exercises.length ?? 0;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sesamath Manuel API</title>
  <style>
    :root {
      color-scheme: light;
      --text: #202124;
      --muted: #5f6368;
      --line: #dadce0;
      --soft: #f8fafd;
      --blue: #4285f4;
      --red: #ea4335;
      --yellow: #fbbc04;
      --green: #34a853;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      background:
        linear-gradient(90deg, rgba(60, 64, 67, .045) 1px, transparent 1px),
        linear-gradient(rgba(60, 64, 67, .045) 1px, transparent 1px),
        #fff;
      background-size: 56px 56px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 52px 28px 72px; }
    .dots { display: flex; gap: 10px; margin-bottom: 56px; }
    .dots span { width: 14px; height: 14px; border-radius: 999px; }
    .blue { background: var(--blue); } .red { background: var(--red); } .yellow { background: var(--yellow); } .green { background: var(--green); }
    .hero { display: grid; grid-template-columns: 1fr 360px; gap: 42px; align-items: end; }
    h1 { max-width: 760px; margin: 0; font-size: clamp(48px, 7vw, 88px); line-height: .98; letter-spacing: -1.8px; }
    .lead { max-width: 720px; margin: 24px 0 0; color: var(--muted); font-size: 22px; line-height: 1.42; }
    .status, .panel, .result {
      border: 1px solid var(--line);
      border-radius: 28px;
      background: rgba(255, 255, 255, .92);
      box-shadow: 0 22px 70px rgba(60, 64, 67, .12);
    }
    .status { padding: 24px; }
    .status strong { display: block; font-size: 18px; }
    .status span { display: block; margin-top: 6px; color: var(--muted); }
    .metric-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 18px; }
    .metric { padding: 16px; border-radius: 18px; background: var(--soft); }
    .metric b { display: block; font-size: 30px; color: var(--blue); }
    .metric small { color: var(--muted); }
    .panel { margin-top: 34px; padding: 28px; }
    .panel h2 { margin: 0 0 18px; font-size: 28px; }
    form { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 14px; align-items: end; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    input, select {
      width: 100%;
      height: 48px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      color: var(--text);
      font: inherit;
    }
    button, .button {
      height: 48px;
      padding: 0 20px;
      border: 0;
      border-radius: 999px;
      background: var(--blue);
      color: #fff;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
    .card { border: 1px solid var(--line); border-radius: 22px; padding: 20px; background: #fff; }
    .card:nth-child(1) { border-top: 6px solid var(--blue); }
    .card:nth-child(2) { border-top: 6px solid var(--green); }
    .card:nth-child(3) { border-top: 6px solid var(--yellow); }
    .card h3 { margin: 0 0 12px; font-size: 18px; }
    code {
      display: block;
      padding: 13px 14px;
      border-radius: 14px;
      background: #f1f3f4;
      color: #174ea6;
      font: 14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
      overflow-wrap: anywhere;
      white-space: normal;
    }
    .error { margin-top: 18px; padding: 14px 16px; border-radius: 16px; background: #fce8e6; color: #a50e0e; }
    @media (max-width: 900px) {
      .hero, form, .grid { grid-template-columns: 1fr; }
      main { padding: 32px 18px 54px; }
    }
  </style>
</head>
<body>
  <main>
    <div class="dots"><span class="blue"></span><span class="red"></span><span class="yellow"></span><span class="green"></span></div>
    <section class="hero">
      <div>
        <h1>Un manuel Sesamath. Une API locale.</h1>
        <p class="lead">Cherche un exercice, ouvre son crop, ou construis seulement les pages dont tu as besoin. Pas besoin de taper une requete HTTP dans le terminal.</p>
      </div>
      <aside class="status">
        <strong>${indexed ? "Index local pret" : "Index local absent"}</strong>
        <span>${indexed ? escapeHtml(params.ouvrage) : "Commence par une commande rapide ci-dessous."}</span>
        <div class="metric-row">
          <div class="metric"><b>${pageCount}</b><small>pages</small></div>
          <div class="metric"><b>${exerciseCount}</b><small>exercices</small></div>
        </div>
      </aside>
    </section>

    ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ""}

    <section class="panel">
      <h2>Afficher directement un exercice</h2>
      <form action="/view/exercise" method="get">
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
        <button type="submit">Ouvrir</button>
      </form>
    </section>

    <section class="panel">
      <h2>Commandes sans friction</h2>
      <div class="grid">
        <div class="card">
          <h3>Un exercice, maintenant</h3>
          ${shellCommand("npm run sesa -- ex 60 p256 --open")}
        </div>
        <div class="card">
          <h3>Une page precise</h3>
          ${shellCommand("npm run build:index -- --page 256")}
        </div>
        <div class="card">
          <h3>Un autre manuel</h3>
          ${shellCommand("npm run build:index -- --ouvrage ms1spe_2019 --from 250 --to 260")}
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Si tu veux vraiment appeler l'API depuis Windows</h2>
      ${shellCommand('curl.exe "http://localhost:4310/api/exercises/60/crop?page=256&scale=5" --output ex60.png')}
      ${shellCommand('Invoke-WebRequest "http://localhost:4310/api/exercises/60/crop?page=256&scale=5" -OutFile ex60.png')}
    </section>
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
  <style>
    body { margin: 0; background: #f8fafd; color: #202124; font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif; }
    main { max-width: 1100px; margin: 0 auto; padding: 36px 22px 64px; }
    a { color: #1a73e8; text-decoration: none; font-weight: 700; }
    .bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; gap: 18px; }
    h1 { margin: 0; font-size: clamp(32px, 5vw, 58px); letter-spacing: -1px; }
    .meta { color: #5f6368; margin-top: 8px; }
    .frame { margin-top: 26px; border: 1px solid #dadce0; border-radius: 28px; background: #fff; box-shadow: 0 22px 70px rgba(60, 64, 67, .14); overflow: hidden; }
    .frame img { display: block; width: 100%; height: auto; }
    code { display: block; margin-top: 18px; padding: 14px; border-radius: 14px; background: #eef3fe; color: #174ea6; overflow-x: auto; white-space: nowrap; }
  </style>
</head>
<body>
  <main>
    <div class="bar"><a href="/">Retour</a><a href="${escapeHtml(params.imageUrl)}" download>Telecharger le PNG</a></div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(params.ouvrage)} · scale ${params.scale}</div>
    <div class="frame"><img src="${escapeHtml(params.imageUrl)}" alt="${escapeHtml(title)}"></div>
    <code>npm run sesa -- ex ${params.exercise} p${params.page} --ouvrage ${escapeHtml(params.ouvrage)} --open</code>
  </main>
</body>
</html>`;
};
