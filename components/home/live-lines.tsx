"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type LineMarket = {
  id: string;
  chainId: number;
  title: string;
  lead: string;
  prob: number | null;
  liquidityUSD: number;
};

const W = 1440;
const H = 820;
const FX = W * 0.6;
const FY = H * 0.56;

/** The EF converging-lines poster, made of data: every line is a live Seer market (weight = liquidity),
 *  all meeting in the Seer mark and leaving as one violet signal. */
export function LiveLines({ markets, total }: { markets: LineMarket[]; total: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (paused || reduce.current || markets.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % Math.min(markets.length, 10)), 3200);
    return () => clearInterval(t);
  }, [paused, markets.length]);

  const lines = useMemo(() => {
    const maxL = Math.log10(Math.max(10, ...markets.map((m) => m.liquidityUSD)));
    const n = markets.length;
    return markets.map((m, i) => {
      // origins fan along the left edge and spill over the top and bottom, like the Brandbook poster
      const t = n === 1 ? 0.5 : i / (n - 1);
      const order = i % 2 === 0 ? t / 2 : 1 - t / 2; // interleave so big markets spread out
      const y0 = -H * 0.55 + order * H * 2.1;
      const w = +(0.6 + (Math.log10(Math.max(10, m.liquidityUSD)) / maxL) ** 3 * 3.4).toFixed(2);
      return { m, i, x0: -10, y0: Math.round(y0), w };
    });
  }, [markets]);

  const cur = markets[active];
  const pct = cur?.prob == null ? "—" : `${Math.round(cur.prob * 100)}%`;

  return (
    <div
      className="relative"
      onPointerLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setPaused(true); setActive((a) => (a + 1) % markets.length); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setPaused(true); setActive((a) => (a - 1 + markets.length) % markets.length); }
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="block h-[62vh] max-h-[860px] min-h-[480px] w-full sm:h-[82vh] sm:min-h-[600px]" aria-hidden="true">
        {/* 12-column hairline grid */}
        {Array.from({ length: 13 }, (_, k) => (
          <line key={k} x1={(W / 12) * k} x2={(W / 12) * k} y1={0} y2={H} stroke="var(--text)" strokeOpacity="0.05" />
        ))}
        {lines.map(({ m, i, x0, y0, w }) => {
          const on = i === active;
          return (
            <g key={m.id} onPointerEnter={() => { setPaused(true); setActive(i); }} style={{ cursor: "pointer" }}>
              <line x1={x0} y1={y0} x2={FX} y2={FY} stroke="transparent" strokeWidth={14} />
              <line
                x1={x0}
                y1={y0}
                x2={FX}
                y2={FY}
                stroke={on ? "var(--primary)" : "var(--text)"}
                strokeOpacity={on ? 1 : +(0.16 + (w / 4) * 0.22).toFixed(3)}
                strokeWidth={on ? +(w + 1.2).toFixed(2) : w}
                style={{ transition: "stroke .35s, stroke-opacity .35s, stroke-width .35s" }}
              />
              {on && <line x1={x0} y1={y0} x2={FX} y2={FY} stroke="var(--page)" strokeWidth={+(w + 1.4).toFixed(2)} strokeDasharray="2 22" className="ll-flow" />}
            </g>
          );
        })}
        {/* the single outgoing signal */}
        <line x1={FX} y1={FY} x2={W + 10} y2={FY} stroke="var(--primary)" strokeWidth="3" />
        <circle cx={FX} cy={FY} r="34" fill="var(--page)" stroke="var(--primary)" strokeWidth="2" />
        <g transform={`translate(${FX - 17} ${FY - 17}) scale(1.06)`}>
          <path d="M11 3h17.5l-5.2 8H13.6l-3.9 6H1.5z" fill="var(--text)" />
          <path d="M21 29H3.5l5.2-8h9.7l3.9-6h8.2z" fill="var(--text)" />
        </g>
        <style>{`.ll-flow{animation:llf 1.6s linear infinite}@keyframes llf{to{stroke-dashoffset:-48}}@media (prefers-reduced-motion:reduce){.ll-flow{animation:none}}`}</style>
      </svg>

      {/* the signal readout, sitting on the violet line */}
      <div className="pointer-events-none px-4 pt-2 sm:absolute sm:right-8 sm:top-[56%] sm:w-[min(380px,38%)] sm:-translate-y-[calc(100%+18px)] sm:px-0 sm:pt-0 sm:text-right">
        <p className="num text-[11px] uppercase tracking-[0.14em] text-muted">
          Live signal · {active + 1}/{markets.length}
        </p>
        <p className="num mt-2 text-[64px] leading-[0.9] tracking-[-0.04em] text-signal sm:text-[96px]" aria-hidden="true">{pct}</p>
        <p className="mt-2 text-[13px] text-text">“{cur?.lead}”</p>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-text-2">{cur?.title}</p>
      </div>
      <div className="px-4 pb-6 pt-2 sm:absolute sm:right-8 sm:top-[56%] sm:mt-4 sm:px-0 sm:pb-0 sm:pt-0 sm:text-right">
        {cur && (
          <Link href={`/app/market/${cur.chainId}/${cur.id}`} className="num text-[12px] text-signal underline-offset-4 hover:underline">
            Open this market →
          </Link>
        )}
        <p className="num mt-1 text-[11px] text-muted">{markets.length} of {total.toLocaleString("en-US")} open markets · line weight = liquidity</p>
      </div>

      {/* accessible list of what the lines are */}
      <ul className="sr-only" aria-label="Markets drawn as lines">
        {markets.map((m, i) => (
          <li key={m.id}>
            <button type="button" onFocus={() => { setPaused(true); setActive(i); }}>
              {m.title}: {m.lead} {m.prob == null ? "" : `${Math.round(m.prob * 100)}%`}
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">{cur ? `${cur.title}: ${cur.lead} ${pct}` : ""}</p>
    </div>
  );
}
