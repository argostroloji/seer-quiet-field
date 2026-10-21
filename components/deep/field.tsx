"use client";

import { useMemo, useState } from "react";
import { useWidth } from "@/components/charts/use-width";
import type { DeepRepo } from "@/lib/seer/deep";

const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);

/** The whole field on one axis (EF dot-matrix motif carrying data), plus a reviewer threshold. */
export function DeepField({ repos }: { repos: DeepRepo[] }) {
  const scored = repos.filter((r) => r.score != null) as (DeepRepo & { score: number })[];
  const [th, setTh] = useState(0.75);
  const [box, W] = useWidth<HTMLDivElement>(1000);
  const [hover, setHover] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const above = scored.filter((r) => r.score >= th);
  const median = useMemo(() => {
    const s = scored.map((r) => r.score).sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }, [scored]);

  // axis spans the field, not 0–100%, so the cluster gets the width; dots stack in 40 bins
  const lo = useMemo(() => Math.max(0, Math.floor((Math.min(...scored.map((r) => r.score), 1) - 0.05) * 10) / 10), [scored]);
  const X = (v: number) => ((v - lo) / (1 - lo)) * W;
  const NB = 40;
  const bins = useMemo(() => {
    const m = new Map<number, (DeepRepo & { score: number })[]>();
    for (const r of scored) {
      const b = Math.min(NB - 1, Math.max(0, Math.floor(((r.score - lo) / (1 - lo)) * NB)));
      m.set(b, [...(m.get(b) ?? []), r]);
    }
    return m;
  }, [scored, lo]);
  const maxStack = Math.max(1, ...Array.from(bins.values()).map((v) => v.length));
  const R = Math.max(2.4, Math.min(8, W / NB / 2 - 1.2));
  const STEP = R * 2 + 2.4;
  const H = Math.max(140, maxStack * STEP + 34);
  const hovered = scored.find((r) => r.repo === hover);

  return (
    <div>
      <div className="relative" ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Distribution of ${scored.length} originality forecasts; median ${pct(median)}`}>
          {/* review zone */}
          <rect x={X(th)} y={0} width={W - X(th)} height={H - 22} fill="var(--primary)" opacity="0.08" />
          <line x1={X(th)} x2={X(th)} y1={0} y2={H - 22} stroke="var(--primary)" strokeDasharray="3 4" />
          <line x1={X(median)} x2={X(median)} y1={0} y2={H - 22} stroke="var(--text-2)" strokeOpacity=".5" />
          <text x={X(median) - 6} y={12} fontSize="11" fill="var(--text-2)" textAnchor="end" className="num">median {pct(median)}</text>
          {Array.from(bins.entries()).map(([b, rs]) =>
            rs.map((r, i) => {
              const cx = (b + 0.5) * (W / NB);
              const cy = H - 32 - i * STEP;
              const on = r.score >= th;
              const isH = hover === r.repo;
              return (
                <circle
                  key={r.repo}
                  cx={cx}
                  cy={cy}
                  r={isH ? R + 2 : R}
                  fill={on ? "var(--primary)" : "var(--muted-line)"}
                  stroke={isH ? "var(--text)" : "none"}
                  onPointerEnter={() => setHover(r.repo)}
                  onPointerLeave={() => setHover(null)}
                >
                  <title>{`${r.repo}: ${pct(r.score)}`}</title>
                </circle>
              );
            }),
          )}
          {Array.from({ length: Math.round((1 - lo) * 10) + 1 }, (_, i) => lo + i * 0.1).map((t, i, a) => (
            <text key={t} x={X(t)} y={H - 4} fontSize="11" fill="var(--muted)" textAnchor={i === 0 ? "start" : i === a.length - 1 ? "end" : "middle"} className="num">
              {Math.round(t * 100)}%
            </text>
          ))}
        </svg>
        <p className="num pointer-events-none absolute left-0 top-0 min-h-5 text-[12px] text-text" aria-live="polite">
          {hovered ? `${hovered.repo} · ${pct(hovered.score)}` : ""}
        </p>
      </div>

      <div className="mt-4 grid gap-4 rounded-md bg-nested p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <label htmlFor="deep-th" className="text-[13px] font-medium">Review threshold: forecast originality ≥ <span className="num text-signal">{pct(th)}</span></label>
          <input
            id="deep-th"
            type="range"
            min={Math.max(0.3, lo)}
            max={0.95}
            step={0.01}
            value={th}
            onChange={(e) => setTh(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-[var(--primary)]"
          />
        </div>
        <p className="text-[13px] text-text-2 sm:text-right">
          <span className="num block text-[28px] leading-none text-text">{above.length}</span>
          of {scored.length} repos to read first
        </p>
      </div>

      <ol className="mt-4 grid gap-x-6 sm:grid-cols-2">
        {(showAll ? scored : scored.slice(0, 20)).map((r, i) => {
          const on = r.score >= th;
          return (
            <li key={r.repo} className="flex items-center gap-3 border-b border-line/70 py-1.5" onPointerEnter={() => setHover(r.repo)} onPointerLeave={() => setHover(null)}>
              <span className="num w-6 text-right text-[11px] text-muted">{i + 1}</span>
              <a href={`https://github.com/${r.repo}`} target="_blank" rel="noreferrer" className={`min-w-0 flex-1 truncate text-[13px] hover:underline ${on ? "text-text" : "text-text-2"}`}>{r.repo}</a>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-nested" aria-hidden="true">
                <span className={`block h-full rounded-full ${on ? "bg-primary" : "bg-muted-line"}`} style={{ width: `${+(r.score * 100).toFixed(3)}%` }} />
              </span>
              <span className="num w-10 text-right text-[12.5px]">{pct(r.score)}</span>
            </li>
          );
        })}
      </ol>
      {scored.length > 20 && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-3 h-9 rounded-md bg-secondary px-3 text-[13px] text-secondary-text hover:brightness-110">
          {showAll ? "Show top 20" : `Show all ${scored.length}`}
        </button>
      )}
    </div>
  );
}
