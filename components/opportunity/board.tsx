"use client";

import { useEffect, useMemo, useState } from "react";
import type { OppMarket } from "@/lib/seer/opportunity";

const pct = (v: number) => (v >= 0.1 ? `${(v * 100).toFixed(0)}%` : v >= 0.01 ? `${(v * 100).toFixed(1)}%` : v > 0 ? "<1%" : "0%");
const COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)", "var(--cat-6)"];

export function OpportunityBoard({ m }: { m: OppMarket }) {
  const [blind, setBlind] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [short, setShort] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);
  const storeKey = `seer-shortlist-${m.key}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setShort(new Set(JSON.parse(raw)));
    } catch {}
  }, [storeKey]);
  const toggleShort = (n: string) =>
    setShort((s) => {
      const x = new Set(s);
      if (x.has(n)) x.delete(n); else x.add(n);
      try { localStorage.setItem(storeKey, JSON.stringify([...x])); } catch {}
      return x;
    });

  const ranked = m.entries;
  const rankOf = useMemo(() => new Map(ranked.map((e, i) => [e.name, i + 1])), [ranked]);
  const filtered = q ? ranked.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())) : ranked;
  const N = Math.max(3, short.size || 5);
  const marketTop = ranked.slice(0, N).map((e) => e.name);
  const agree = [...short].filter((n) => marketTop.includes(n));
  const longShots = ranked.filter((e) => e.prob >= 0.02 && e.prob < 0.1 && !short.has(e.name)).slice(0, 6);

  // stacked band: top 12, the rest, and the market's unassigned remainder — always sums to 100%
  const band = useMemo(() => {
    const top = ranked.slice(0, 12);
    const restP = ranked.slice(12).reduce((a, e) => a + e.prob, 0);
    const total = top.reduce((a, e) => a + e.prob, 0) + restP + m.remainder;
    return { top, restP, total: total || 1 };
  }, [ranked, m.remainder]);

  return (
    <div className="space-y-4">
      {/* Probabilities visibly sum to 100% */}
      <div className="rounded-[10px] bg-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] font-medium">Where the market puts 100% of the selection probability</p>
          <p className="num text-[11.5px] text-muted">hover a segment</p>
        </div>
        <div className={`flex h-10 overflow-hidden rounded-md ${blind ? "blur-sm" : ""}`} role="img" aria-label={`Top entry ${band.top[0]?.name} at ${pct(band.top[0]?.prob ?? 0)}; ${ranked.length} entries in total`}>
          {band.top.map((e, i) => (
            <div
              key={e.name}
              title={`${e.name} · ${pct(e.prob)}`}
              className="h-full border-r border-page/60 transition-[filter] hover:brightness-125"
              style={{ width: `${+((e.prob / band.total) * 100).toFixed(3)}%`, background: i < 6 ? COLORS[i] : `color-mix(in srgb, var(--primary) ${70 - i * 4}%, var(--nested))` }}
            />
          ))}
          <div title={`${ranked.length - 12} other entries · ${pct(band.restP)}`} className="h-full bg-raised" style={{ width: `${+((band.restP / band.total) * 100).toFixed(3)}%` }} />
          {m.remainder > 0.001 && <div title={`Unassigned · ${pct(m.remainder)}`} className="stripes h-full bg-nested" style={{ width: `${+((m.remainder / band.total) * 100).toFixed(3)}%` }} />}
        </div>
        <ul className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-2 ${blind ? "invisible" : ""}`}>
          {band.top.slice(0, 6).map((e, i) => (
            <li key={e.name} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i] }} aria-hidden="true" />
              <span className="max-w-[18ch] truncate">{e.name}</span>
              <span className="num text-text">{pct(e.prob)}</span>
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-raised" aria-hidden="true" />{ranked.length - 12} others <span className="num text-text">{pct(band.restP)}</span></li>
          {m.remainder > 0.001 && <li className="inline-flex items-center gap-1.5"><span className="stripes h-2 w-2 rounded-sm bg-nested" aria-hidden="true" />unassigned <span className="num text-text">{pct(m.remainder)}</span></li>}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[10px] bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div role="group" aria-label="Mode" className="inline-flex rounded-full bg-nested p-1">
              <button type="button" aria-pressed={!blind} onClick={() => setBlind(false)} className={`h-8 rounded-full px-3.5 text-[12.5px] ${!blind ? "bg-card text-text shadow-sm" : "text-text-2"}`}>Market view</button>
              <button type="button" aria-pressed={blind} onClick={() => setBlind(true)} className={`h-8 rounded-full px-3.5 text-[12.5px] ${blind ? "bg-primary text-on-primary" : "text-text-2"}`}>Blind review</button>
            </div>
            <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-nested px-3 sm:max-w-xs">
              <span className="sr-only">Filter entries</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${ranked.length} entries`} className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted" />
            </label>
          </div>
          {blind && (
            <p className="border-b border-line bg-secondary/50 px-4 py-2.5 text-[12.5px] text-text-2">
              Blind review hides prices so the market can&apos;t anchor you. Judge each entry first, star your picks, then reveal its odds.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="w-12 px-4 py-2.5 font-normal">#</th>
                  <th scope="col" className="py-2.5 font-normal">Entry</th>
                  <th scope="col" className="w-[34%] py-2.5 font-normal">Market prediction</th>
                  <th scope="col" className="py-2.5 font-normal">Team selection</th>
                  <th scope="col" className="w-12 px-4 py-2.5 font-normal"><span className="sr-only">Shortlist</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, limit).map((e) => {
                  const hide = blind && !revealed.has(e.name);
                  const starred = short.has(e.name);
                  return (
                    <tr key={e.marketId + e.name} className="border-t border-line/70">
                      <td className="num px-4 py-2 text-muted">{hide ? "·" : rankOf.get(e.name)}</td>
                      <td className="max-w-[260px] py-2 pr-3">
                        <span className="flex items-center gap-2">
                          {e.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.image} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 shrink-0 rounded bg-nested object-cover" />
                          )}
                          <span className="truncate">{e.name}</span>
                          {m.entries.some((x) => x.level > 1) && <span className="num shrink-0 rounded bg-nested px-1 text-[10px] text-muted" title={`Listed in level ${e.level} market`}>L{e.level}</span>}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {hide ? (
                          <button type="button" onClick={() => setRevealed((s) => new Set(s).add(e.name))} className="h-7 rounded bg-nested px-2.5 text-[12px] text-text-2 hover:text-text">
                            Reveal odds
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-nested" aria-hidden="true">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${+(Math.min(100, (e.prob / (ranked[0]?.prob || 1)) * 100)).toFixed(3)}%` }} />
                            </div>
                            <span className="num w-12 text-right">{pct(e.prob)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {m.status === "live" ? (
                          <span className="num text-[11.5px] text-muted">pending</span>
                        ) : e.won ? (
                          <span className="num rounded bg-up/15 px-1.5 py-0.5 text-[10.5px] uppercase text-up">Selected</span>
                        ) : (
                          <span className="num text-[11.5px] text-muted">not selected</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => toggleShort(e.name)}
                          aria-pressed={starred}
                          aria-label={`${starred ? "Remove" : "Add"} ${e.name} ${starred ? "from" : "to"} your shortlist`}
                          className={`grid h-8 w-8 place-items-center rounded ${starred ? "text-signal" : "text-muted hover:text-text"}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > limit && (
            <div className="border-t border-line p-3">
              <button type="button" onClick={() => setLimit((l) => l + 50)} className="h-9 rounded-md bg-secondary px-3 text-[13px] text-secondary-text hover:brightness-110">
                Show more ({filtered.length - limit} left)
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[10px] bg-card p-4">
            <p className="text-[13px] font-medium">Your shortlist vs. the market</p>
            {short.size === 0 ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">Star the entries you&apos;d pick. We&apos;ll compare them with the market&apos;s top {N} — agreement is reassuring, disagreement is where to look again.</p>
            ) : (
              <>
                <p className="num mt-3 text-[28px] leading-none">{agree.length}<span className="text-[15px] text-text-2"> / {short.size}</span></p>
                <p className="mt-1 text-[12.5px] text-text-2">of your picks are in the market&apos;s top {N}.</p>
                <ul className="mt-3 space-y-1 text-[12.5px]">
                  {[...short].map((n) => (
                    <li key={n} className="flex justify-between gap-2">
                      <span className="truncate">{n}</span>
                      <span className={`num shrink-0 ${marketTop.includes(n) ? "text-up" : "text-warn"}`}>#{rankOf.get(n)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11.5px] text-muted">Saved in this browser only.</p>
              </>
            )}
          </div>
          {longShots.length > 0 && (
            <div className="rounded-[10px] bg-card p-4">
              <p className="text-[13px] font-medium">Worth a second look</p>
              <p className="mt-1 text-[12px] text-text-2">Live contenders the market prices at 2–10% — not favourites, not dismissed.</p>
              <ul className="mt-3 space-y-1.5 text-[12.5px]">
                {longShots.map((e) => (
                  <li key={e.name} className="flex items-center justify-between gap-2">
                    <span className="truncate">{e.name}</span>
                    <span className={`num shrink-0 ${blind && !revealed.has(e.name) ? "blur-sm" : ""}`}>{pct(e.prob)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-1 text-[11.5px] leading-relaxed text-muted">The market predicts the team&apos;s choice. It doesn&apos;t make it: the final selection stays with the reviewers.</p>
        </aside>
      </div>
    </div>
  );
}
