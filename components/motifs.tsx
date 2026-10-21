/** EF poster motif: many lines converging on one point — many opinions resolving into one price.
 *  `focus` is where they meet (0..1 of width). Lines are deterministic so SSR and client match. */
export function ConvergingLines({
  count = 46,
  focusX = 0.72,
  focusY = 0.5,
  className = "",
  highlight = [7, 19, 31],
}: {
  count?: number;
  focusX?: number;
  focusY?: number;
  className?: string;
  highlight?: number[];
}) {
  const W = 1200;
  const H = 560;
  const fx = W * focusX;
  const fy = H * focusY;
  const lines = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    // origins fan along the left edge and top/bottom edges
    const y0 = -H * 0.35 + t * H * 1.7;
    return { x0: -20, y0, i };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cl-fade" x1="0" x2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="cl-glow" cx={focusX} cy={focusY} r="0.35">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#cl-glow)" />
      {lines.map(({ x0, y0, i }) => {
        const hl = highlight.includes(i);
        return (
          <line
            key={i}
            x1={x0}
            y1={y0}
            x2={fx}
            y2={fy}
            stroke={hl ? "var(--primary)" : "url(#cl-fade)"}
            strokeWidth={hl ? 1.6 : 0.8}
            className={hl ? "cl-pulse" : undefined}
            style={hl ? { animationDelay: `${(i % 5) * 0.6}s` } : undefined}
          />
        );
      })}
      {/* the single outgoing signal */}
      <line x1={fx} y1={fy} x2={W + 20} y2={fy} stroke="var(--primary)" strokeWidth="2.2" />
      <circle cx={fx} cy={fy} r="5" fill="var(--primary)" />
      <circle cx={fx} cy={fy} r="14" fill="none" stroke="var(--primary)" strokeOpacity="0.5" className="cl-ring" />
      <style>{`
        .cl-pulse { stroke-dasharray: 6 10; animation: cl-flow 2.4s linear infinite; }
        @keyframes cl-flow { to { stroke-dashoffset: -64; } }
        .cl-ring { transform-origin: ${fx}px ${fy}px; animation: cl-ring 2.8s ease-out infinite; }
        @keyframes cl-ring { from { transform: scale(.6); opacity: .9 } to { transform: scale(2.4); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .cl-pulse, .cl-ring { animation: none } }
      `}</style>
    </svg>
  );
}

/** Two-branch fork (Futarchy): one trunk splitting into "if pass" and "if fail". */
export function ForkLines({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={className} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`a${i}`} x1="0" y1={20 + i * 10} x2="170" y2="60" stroke="currentColor" strokeOpacity={0.12 + i * 0.03} />
      ))}
      <path d="M170 60 L400 18" stroke="var(--primary)" strokeWidth="2" fill="none" />
      <path d="M170 60 L400 102" stroke="currentColor" strokeOpacity=".55" strokeWidth="2" strokeDasharray="5 5" fill="none" />
      <circle cx="170" cy="60" r="4" fill="var(--primary)" />
    </svg>
  );
}
