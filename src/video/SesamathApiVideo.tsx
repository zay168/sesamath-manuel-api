import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

const ease = Easing.bezier(0.2, 0, 0, 1);

const reveal = (frame: number, start: number, duration: number) => {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};

const Lift: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, delay, 24);
  const y = interpolate(progress, [0, 1], [28, 0]);

  return (
    <div className={className} style={{ opacity: progress, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
};

const BrandMark: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, delay, 20);

  return (
    <div
      style={{
        position: "absolute",
        top: 58,
        left: 72,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: progress,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: "#c96438",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: "#1c1916",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        Sesamath
      </span>
    </div>
  );
};

const CommandLine: React.FC<{ label: string; text: string; delay: number }> = ({ label, text, delay }) => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, delay, 18);

  return (
    <div className="command-line" style={{ opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [-18, 0])}px)` }}>
      <span>{label}</span>
      <code>{text}</code>
    </div>
  );
};

const ApiDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = reveal(frame, 10, 44);
  const line = interpolate(progress, [0, 1], [0, 1]);

  return (
    <svg viewBox="0 0 1180 500" className="diagram">
      <rect x="56" y="96" width="290" height="164" rx="28" className="diagram-card card-orange" />
      <rect x="445" y="96" width="290" height="164" rx="28" className="diagram-card card-sand" />
      <rect x="834" y="96" width="290" height="164" rx="28" className="diagram-card card-warm" />

      <text x="201" y="160" textAnchor="middle" className="diagram-title">PDF Sesamath</text>
      <text x="201" y="204" textAnchor="middle" className="diagram-sub">source vectorielle</text>
      <text x="590" y="160" textAnchor="middle" className="diagram-title">poppler 300 DPI</text>
      <text x="590" y="204" textAnchor="middle" className="diagram-sub">render page</text>
      <text x="979" y="160" textAnchor="middle" className="diagram-title">PNG net</text>
      <text x="979" y="204" textAnchor="middle" className="diagram-sub">crop + API</text>

      <path d="M370 178 H421" className="diagram-flow orange-flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
      <path d="M759 178 H810" className="diagram-flow warm-flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />

      <rect x="126" y="336" width="928" height="82" rx="24" className="endpoint-box" />
      <text x="590" y="388" textAnchor="middle" className="endpoint-text">GET /api/exercises/60/crop?page=256&amp;scale=5</text>
    </svg>
  );
};

export const SesamathApiVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const slowMove = interpolate(frame, [0, 540], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill className="video-root">
      <div className="material-grid" style={{ transform: `translateX(${-80 * slowMove}px)` }} />
      <BrandMark delay={4} />

      <Sequence durationInFrames={150}>
        <AbsoluteFill className="scene hero-scene">
          <Lift delay={8} className="hero-copy">
            <div className="product-label">Sesamath Manuel API</div>
            <h1>Le manuel devient une surface interrogeable.</h1>
            <p>Pages, exercices, crops PNG. Images vectorielles via PDF Sesamath + poppler 300 DPI.</p>
          </Lift>
          <Lift delay={34} className="hero-chip-row">
            <span className="chip orange-chip">PDF vectoriel</span>
            <span className="chip sand-chip">390 pages</span>
            <span className="chip warm-chip">1 933 exercices</span>
            <span className="chip neutral-chip">OpenAPI</span>
          </Lift>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={150} durationInFrames={135}>
        <AbsoluteFill className="scene">
          <Lift delay={0} className="section-title">
            <span>Pipeline</span>
            <h2>Une image devient une donnée fiable.</h2>
          </Lift>
          <Lift delay={12} className="material-panel wide-panel">
            <ApiDiagram />
          </Lift>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={285} durationInFrames={135}>
        <AbsoluteFill className="scene crop-scene">
          <Lift delay={0} className="section-title compact-title">
            <span>Qualité image</span>
            <h2>Du PDF vectoriel au PNG. Aucun upscaling.</h2>
          </Lift>
          <Lift delay={12} className="command-stack">
            <CommandLine delay={18} label="build" text="npm run build:index" />
            <CommandLine delay={42} label="pdf" text="npm run api  → Télécharger PDF (100 MB)" />
            <CommandLine delay={66} label="crop" text="/api/exercises/60/crop?page=256&scale=5" />
          </Lift>
          <Lift delay={28} className="browser-frame">
            <div className="browser-bar">
              <span />
              <span />
              <span />
              <code>localhost:4310</code>
            </div>
            <div className="preview-grid">
              <Img src={staticFile("demo/p256_page_x2.png")} className="page-preview" />
              <Img src={staticFile("demo/p256_ex60.png")} className="crop-preview" />
            </div>
          </Lift>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={420} durationInFrames={120}>
        <AbsoluteFill className="scene final-scene">
          <Lift delay={0} className="section-title">
            <span>Repo</span>
            <h2>Un outil local, pas une capture figée.</h2>
          </Lift>
          <Lift delay={18} className="repo-grid">
            <div className="repo-card border-1"><strong>src/api</strong><span>Express, routes, OpenAPI</span></div>
            <div className="repo-card border-2"><strong>src/sesamath</strong><span>manifest, parser, crops, PDF</span></div>
            <div className="repo-card border-3"><strong>src/sesamath/pdf.ts</strong><span>download PDF, render poppler, cache</span></div>
            <div className="repo-card border-4"><strong>src/video</strong><span>composition Remotion</span></div>
          </Lift>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
