/** "Two futures" poster: the trunk is the proposal's real hourly conditional price history;
 *  at "now" it forks into the pass branch (violet, solid) and the fail branch (ink, dashed). */
export function FutarchyPoster({
  history,
  pass,
  fail,
  unit,
  company,
  closesLabel,
}: {
  history: { t: number; p: number }[];
  pass: number;
  fail: number;
  unit: string;
  company: string;
  closesLabel: string;
}) {
  const W = 1440;
  const H = 560;
  const FX = W * 0.56;
  const CY = H / 2;
  const pts = history.slice(-120);
  const lo = Math.min(...pts.map((p) => p.p));
  const hi = Math.max(...pts.map((p) => p.p));
  const amp = 70;
  const y = (v: number) => +(CY - ((v - (lo + hi) / 2) / Math.max(1e-9, hi - lo)) * 2 * amp).toFixed(1);
  const trunk = pts.map((p, i) => `${i ? "L" : "M"}${+((i / Math.max(1, pts.length - 1)) * FX).toFixed(1)} ${y(p.p)}`).join(" ");
  const endY = pts.length ? y(pts[pts.length - 1].p) : CY;
  const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <figure className="relative -mx-4 border-y border-text/85 sm:-mx-8" aria-label={`If it passes ${fmt(pass)} ${unit}; if it fails ${fmt(fail)} ${unit}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[340px] w-full sm:h-[520px]" aria-hidden="true">
        {Array.from({ length: 13 }, (_, k) => (
          <line key={k} x1={(W / 12) * k} x2={(W / 12) * k} y1={0} y2={H} stroke="var(--text)" strokeOpacity="0.05" />
        ))}
        {/* echo lines: the history fanning into the fork (EF converging motif) */}
        {Array.from({ length: 9 }, (_, k) => (
          <line key={k} x1={0} y1={CY - 220 + k * 55} x2={FX} y2={endY} stroke="var(--text)" strokeOpacity="0.07" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={trunk} fill="none" stroke="var(--text)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        <path d={`M${FX} ${endY} C ${FX + 180} ${endY}, ${W - 340} ${H * 0.4}, ${W} ${H * 0.4}`} fill="none" stroke="var(--primary)" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        <path d={`M${FX} ${endY} C ${FX + 180} ${endY}, ${W - 340} ${H * 0.6}, ${W} ${H * 0.6}`} fill="none" stroke="var(--text)" strokeWidth="3" strokeDasharray="10 9" vectorEffect="non-scaling-stroke" />
        <line x1={FX} x2={FX} y1={0} y2={H} stroke="var(--text)" strokeOpacity=".35" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="pointer-events-none absolute left-4 top-4 sm:left-8 sm:top-6">
        <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">Conditional {company} price · hourly history</p>
      </div>
      <div className="pointer-events-none absolute top-4 sm:top-6" style={{ left: "56%" }}>
        <p className="num -translate-x-1/2 whitespace-nowrap rounded bg-page px-2 text-[11px] uppercase tracking-[0.14em]">Now · {closesLabel}</p>
      </div>
      <div className="pointer-events-none absolute right-4 top-[4%] text-right sm:right-8 sm:top-[6%]">
        <p className="num text-[11px] uppercase tracking-[0.14em] text-signal">If it passes</p>
        <p className="num text-[40px] leading-none tracking-[-0.04em] text-signal sm:text-[88px]">{fmt(pass)}</p>
        <p className="num text-[12px] text-text-2">{unit} per {company}</p>
      </div>
      <div className="pointer-events-none absolute bottom-[4%] right-4 text-right sm:bottom-[6%] sm:right-8">
        <p className="num text-[40px] leading-none tracking-[-0.04em] sm:text-[88px]">{fmt(fail)}</p>
        <p className="num text-[11px] uppercase tracking-[0.14em]">If it fails <span className="normal-case tracking-normal text-text-2">· {unit} per {company}</span></p>
      </div>
    </figure>
  );
}
