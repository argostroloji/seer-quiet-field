"use client";

import { line as d3line, curveMonotoneX } from "d3-shape";
import { useId, useMemo, useState } from "react";

export type Series = { name: string; color: string; points: { t: number; p: number }[]; dashed?: boolean };

const fmtT = (t: number) => new Date(t * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Lightweight multi-series line chart. Hover or arrow keys move the crosshair; values announced via aria-live. */
export function LineChart({
  series,
  height = 240,
  yFormat = (v: number) => `${(v * 100).toFixed(0)}¢`,
  yDomain,
  label,
}: {
  series: Series[];
  height?: number;
  yFormat?: (v: number) => string;
  yDomain?: [number, number];
  label: string;
}) {
  const W = 720;
  const H = height;
  const pad = { l: 8, r: 48, t: 10, b: 22 };
  const uid = useId();
  const all = series.flatMap((s) => s.points);
  const [hover, setHover] = useState<number | null>(null);

  const { x, y, ticks, times, yTicks } = useMemo(() => {
    const t0 = Math.min(...all.map((p) => p.t));
    const t1 = Math.max(...all.map((p) => p.t));
    let lo = yDomain?.[0] ?? Math.min(...all.map((p) => p.p));
    let hi = yDomain?.[1] ?? Math.max(...all.map((p) => p.p));
    if (!yDomain) {
      const span = hi - lo || Math.max(0.01, hi * 0.1);
      lo = Math.max(0, lo - span * 0.12);
      hi = hi + span * 0.12;
    }
    const x = (t: number) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (H - pad.t - pad.b);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => t0 + k * (t1 - t0));
    const yTicks = [0, 0.5, 1].map((k) => lo + k * (hi - lo));
    const times = Array.from(new Set(all.map((p) => p.t))).sort((a, b) => a - b);
    return { x, y, ticks, times, yTicks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, H, yDomain]);

  if (!all.length) return null;

  const at = hover == null ? null : times[hover];
  const valueAt = (s: Series, t: number) => {
    let best = s.points[0];
    for (const p of s.points) if (p.t <= t) best = p;
    return best?.p;
  };

  const path = (pts: { t: number; p: number }[]) =>
    d3line<{ t: number; p: number }>()
      .x((d) => x(d.t))
      .y((d) => y(d.p))
      .curve(curveMonotoneX)(pts) ?? "";

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-labelledby={`${uid}-t`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? times.length) - 1));
          if (e.key === "ArrowRight") setHover((h) => Math.min(times.length - 1, (h ?? -1) + 1));
          if (e.key === "Escape") setHover(null);
        }}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          let bi = 0;
          let bd = Infinity;
          times.forEach((t, i) => {
            const d = Math.abs(x(t) - px);
            if (d < bd) { bd = d; bi = i; }
          });
          setHover(bi);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <title id={`${uid}-t`}>{label}</title>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={i === 0 ? undefined : "2 4"} />
            <text x={W - pad.r + 6} y={y(v) + 3.5} fontSize="10.5" fill="var(--muted)" className="num">{yFormat(v)}</text>
          </g>
        ))}
        {ticks.map((t, i) => (
          <text key={i} x={x(t)} y={H - 5} fontSize="10.5" fill="var(--muted)" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} className="num">
            {fmtT(t)}
          </text>
        ))}
        {series.map((s) => (
          <path key={s.name} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={1.8} strokeDasharray={s.dashed ? "5 4" : undefined} vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s) => {
          const last = s.points[s.points.length - 1];
          return last ? <circle key={s.name} cx={x(last.t)} cy={y(last.p)} r={3} fill={s.color} /> : null;
        })}
        {at != null && (
          <g>
            <line x1={x(at)} x2={x(at)} y1={pad.t} y2={H - pad.b} stroke="var(--text-2)" strokeOpacity=".5" />
            {series.map((s) => {
              const v = valueAt(s, at);
              return v == null ? null : <circle key={s.name} cx={x(at)} cy={y(v)} r={3.5} fill="var(--card)" stroke={s.color} strokeWidth={2} />;
            })}
          </g>
        )}
      </svg>
      <figcaption aria-live="polite" className="num mt-2 flex min-h-5 flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-text-2">
        {(at != null ? series : series.slice(0, 6)).map((s) => {
          const v = at != null ? valueAt(s, at) : s.points[s.points.length - 1]?.p;
          return (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              <span className="max-w-[16ch] truncate">{s.name}</span>
              <span className="text-text">{v == null ? "—" : yFormat(v)}</span>
            </span>
          );
        })}
        {at != null && <span className="text-muted">{new Date(at * 1000).toUTCString().slice(5, 22)} UTC</span>}
      </figcaption>
    </figure>
  );
}

export function Sparkline({ points, color = "var(--primary)", w = 96, h = 28 }: { points: { t: number; p: number }[]; color?: string; w?: number; h?: number }) {
  if (points.length < 2) return <span className="inline-block" style={{ width: w, height: h }} />;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const lo = Math.min(...points.map((p) => p.p));
  const hi = Math.max(...points.map((p) => p.p));
  const d =
    d3line<{ t: number; p: number }>()
      .x((p) => ((p.t - t0) / Math.max(1, t1 - t0)) * w)
      .y((p) => 2 + (1 - (p.p - lo) / Math.max(1e-9, hi - lo)) * (h - 4))(points) ?? "";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
