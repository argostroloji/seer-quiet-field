"use client";

import { useMemo, useState } from "react";
import type { RiskData, RiskAsset, AssetClass } from "@/lib/seer/risk";
import { Sparkline } from "@/components/charts/line-chart";

const fmt = (p: number) => (p >= 0.1 ? `${(p * 100).toFixed(0)}%` : p >= 0.01 ? `${(p * 100).toFixed(1)}%` : `${(p * 100).toFixed(2)}%`);
const LMIN = Math.log10(0.0002); // 0.02 %
const LMAX = Math.log10(0.3); // 30 %
const X = (p: number) => +(((Math.log10(Math.max(p, 0.0002)) - LMIN) / (LMAX - LMIN)) * 100).toFixed(3);
const BANDS = [
  { lo: 0.0002, hi: 0.001, label: "< 0.1%", cls: "" },
  { lo: 0.001, hi: 0.01, label: "0.1–1%", cls: "stripes opacity-40" },
  { lo: 0.01, hi: 0.05, label: "1–5%", cls: "stripes opacity-70" },
  { lo: 0.05, hi: 0.3, label: "> 5%", cls: "stripes-violet opacity-40" },
];
const TICKS = [0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.2];

export function RiskExplorer({ data, classes }: { data: RiskData; classes: AssetClass[] }) {
  const [horizon, setHorizon] = useState<"y" | "q">("y");
  const [sel, setSel] = useState<string[]>(["USDC", "USDT", "USDS"]);
  const [pos, setPos] = useState<Record<string, string>>({ USDC: "10000", USDT: "10000", USDS: "10000" });
  const [lgd, setLgd] = useState(1);
  const pd = (a: RiskAsset) => (horizon === "y" ? a.pdYearly : a.pdQuarterly);
  const toggle = (n: string) =>
    setSel((s) => {
      if (s.includes(n)) return s.filter((x) => x !== n);
      const next = [...s, n];
      if (!pos[n]) setPos((p) => ({ ...p, [n]: "10000" }));
      return next.length > 4 ? next.slice(1) : next;
    });

  const byName = useMemo(() => new Map(data.assets.map((a) => [a.name, a])), [data.assets]);
  const grouped = classes.map((c) => ({ c, rows: data.assets.filter((a) => a.cls === c).sort((a, b) => pd(a) - pd(b)) }));
  const picked = sel.map((n) => byName.get(n)).filter(Boolean) as RiskAsset[];
  const safest = [...picked].sort((a, b) => pd(a) - pd(b))[0];

  const exposure = picked.map((a) => {
    const v = Math.max(0, Number((pos[a.name] || "0").replace(/,/g, "")) || 0);
    return { a, v, el: v * a.pdYearly * lgd };
  });
  const total = exposure.reduce((s, e) => s + e.v, 0);
  const el = exposure.reduce((s, e) => s + e.el, 0);
  const anyDefault = 1 - exposure.reduce((s, e) => s * (1 - e.a.pdYearly), 1);

  return (
    <div className="space-y-4">
      {/* Ranked, one comparable scale */}
      <section className="rounded-[10px] bg-card p-4 sm:p-5" aria-labelledby="scale-h">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="scale-h" className="text-[15px] font-medium">Default probability, every asset on one scale</h2>
            <p className="mt-0.5 text-[12.5px] text-text-2">Log scale. Click an asset to compare it. Same market, same horizon for all {data.assets.length}.</p>
          </div>
          <div role="group" aria-label="Horizon" className="inline-flex rounded-full bg-nested p-1">
            {(["q", "y"] as const).map((h) => (
              <button key={h} type="button" aria-pressed={horizon === h} onClick={() => setHorizon(h)} className={`h-8 rounded-full px-3.5 text-[12.5px] ${horizon === h ? "bg-primary text-on-primary" : "text-text-2"}`}>
                {h === "q" ? "This quarter" : "Next 12 months"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div>
            {/* axis + bands */}
            <div className="flex">
              <span className="w-[76px] shrink-0 sm:w-[118px]" />
              <div className="relative h-6 flex-1">
                {TICKS.map((t) => (
                  <span key={t} className={`num absolute -translate-x-1/2 text-[10.5px] text-muted ${[0.0005, 0.005, 0.05].includes(t) ? "hidden sm:inline" : ""}`} style={{ left: `${X(t)}%` }}>{fmt(t)}</span>
                ))}
              </div>
              <span className="w-12 shrink-0" />
            </div>
            {grouped.map(({ c, rows }) => (
              <div key={c} className="mt-3">
                <p className="num mb-1 text-[10.5px] uppercase tracking-[0.12em] text-muted">{c}</p>
                <ul>
                  {rows.map((a) => {
                    const on = sel.includes(a.name);
                    return (
                      <li key={a.name} className="flex h-8 items-center">
                        <button
                          type="button"
                          onClick={() => toggle(a.name)}
                          aria-pressed={on}
                          className={`num w-[76px] shrink-0 truncate rounded px-2 py-1 text-left text-[12px] sm:w-[110px] sm:text-[12.5px] ${on ? "bg-secondary text-secondary-text" : "text-text-2 hover:bg-nested hover:text-text"}`}
                        >
                          {a.name}
                        </button>
                        <div className="relative ml-2 h-full flex-1">
                          {BANDS.map((b) => (
                            <span key={b.label} className={`absolute inset-y-1 ${b.cls}`} style={{ left: `${X(b.lo)}%`, width: `${X(b.hi) - X(b.lo)}%` }} aria-hidden="true" />
                          ))}
                          <span className="absolute inset-x-0 top-1/2 h-px bg-line" aria-hidden="true" />
                          <span className="absolute top-1/2 h-px bg-primary/50" style={{ left: "0px", width: `${X(pd(a))}%` }} aria-hidden="true" />
                          <span
                            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${on ? "bg-primary ring-2 ring-[var(--focus)]" : pd(a) >= 0.05 ? "bg-primary" : "bg-text-2"}`}
                            style={{ left: `${X(pd(a))}%` }}
                            title={`${a.name}: ${fmt(pd(a))}`}
                          />
                        </div>
                        <span className="num w-12 shrink-0 text-right text-[11.5px] text-text">{fmt(pd(a))}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-text-2 sm:ml-[118px]">
              {BANDS.map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5"><span className={`h-3 w-5 rounded-sm bg-nested ${b.cls}`} aria-hidden="true" />{b.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Compare */}
        <section className="rounded-[10px] bg-card p-4 sm:p-5" aria-labelledby="cmp-h">
          <h2 id="cmp-h" className="text-[15px] font-medium">Compare side by side</h2>
          <p className="mt-0.5 text-[12.5px] text-text-2">{picked.length ? "Up to four. Click names in the scale above to swap." : "Pick up to four assets in the scale above."}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {picked.map((a) => (
              <li key={a.name} className="rounded-md bg-nested p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium">{a.name}</p>
                    <p className="text-[11px] text-muted">{a.cls}</p>
                  </div>
                  <button type="button" onClick={() => toggle(a.name)} className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-card hover:text-text" aria-label={`Remove ${a.name}`}>×</button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <div><dt className="text-[11px] text-text-2">Quarter</dt><dd className="num text-[18px]">{fmt(a.pdQuarterly)}</dd></div>
                  <div><dt className="text-[11px] text-text-2">12 months</dt><dd className="num text-[18px]">{fmt(a.pdYearly)}</dd></div>
                </dl>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <Sparkline points={a.history.map((h) => ({ t: h.t, p: h.y }))} w={110} h={28} />
                  <p className="text-right text-[11px] text-text-2">
                    {safest && safest.name !== a.name ? <><span className="num text-text">{(pd(a) / Math.max(1e-9, pd(safest))).toFixed(1)}×</span> {safest.name}</> : "lowest of these"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Exposure */}
        <section className="rounded-[10px] bg-card p-4 sm:p-5" aria-labelledby="exp-h">
          <h2 id="exp-h" className="text-[15px] font-medium">Your exposure</h2>
          <p className="mt-0.5 text-[12.5px] text-text-2">Enter what you hold in each compared asset.</p>
          <div className="mt-4 space-y-2">
            {exposure.map(({ a, el: e }) => (
              <label key={a.name} className="flex items-center gap-2">
                <span className="num w-20 shrink-0 truncate text-[12.5px] text-text-2">{a.name}</span>
                <span className="flex h-10 flex-1 items-center rounded-md bg-nested px-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]">
                  <span className="num text-[12px] text-muted">$</span>
                  <input
                    inputMode="decimal"
                    value={pos[a.name] ?? ""}
                    onChange={(ev) => setPos((p) => ({ ...p, [a.name]: ev.target.value.replace(/[^\d.,]/g, "") }))}
                    className="num w-full bg-transparent px-1.5 text-right text-[14px] outline-none"
                    aria-label={`Position in ${a.name}, US dollars`}
                  />
                </span>
                <span className="num w-20 shrink-0 text-right text-[12px] text-text-2">−${e.toFixed(0)}</span>
              </label>
            ))}
          </div>
          <label className="mt-4 block text-[12px] text-text-2" htmlFor="lgd">Loss if a default happens: <span className="num text-text">{Math.round(lgd * 100)}%</span></label>
          <input id="lgd" type="range" min={0.1} max={1} step={0.05} value={lgd} onChange={(e) => setLgd(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" />
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-nested p-3"><dt className="text-[11px] text-text-2">Expected loss / yr</dt><dd className="num text-[22px]">${el.toFixed(0)}</dd><dd className="num text-[11px] text-muted">{total ? ((el / total) * 100).toFixed(2) : "0"}% of ${total.toLocaleString("en-US")}</dd></div>
            <div className="rounded-md bg-nested p-3"><dt className="text-[11px] text-text-2">≥ 1 of these defaults</dt><dd className="num text-[22px]">{fmt(anyDefault)}</dd><dd className="text-[11px] text-muted">if independent</dd></div>
          </dl>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">An estimate from market prices, not insurance or advice. Defaults are correlated in a crisis, so treat the combined figure as a floor.</p>
        </section>
      </div>
    </div>
  );
}
