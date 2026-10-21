import "server-only";
import { getMarketChart, searchMarkets } from "./api";
import { IDS } from "./config";
import type { Market, Sourced } from "./types";

export interface Entry {
  name: string;
  /** probability this entry is selected, across the whole (possibly chained) market */
  prob: number;
  price: number | null;
  level: number;
  marketId: string;
  image?: string;
  won?: boolean;
  token: string;
}

export interface OppMarket {
  key: string;
  title: string;
  question: string;
  status: "live" | "settled";
  chainId: number;
  marketIds: string[];
  entries: Entry[];
  /** probability mass the market leaves unassigned (deepest "Other", invalid, unpriced) */
  remainder: number;
  liquidityUSD: number;
  volumeUSD: number;
  closes: number;
  winner?: string;
  note?: string;
  appUrl: string;
}

const isOther = (n: string) => /^other\b/i.test(n.trim());

/** Chained markets: each level's "Other" outcome is the collateral of the next level, so a name in
 *  level k is selected with probability p_k(name) × Π P(Other at levels < k). P(Other) has no pool;
 *  it's the mass the level's priced names leave over. */
function chain(levels: Market[]): { entries: Entry[]; remainder: number } {
  let carry = 1;
  const entries: Entry[] = [];
  levels.forEach((m, li) => {
    const named = m.outcomes.filter((o) => !o.isInvalid && !isOther(o.name));
    const sum = named.reduce((a, o) => a + (o.price ?? 0), 0);
    for (const o of named) {
      entries.push({ name: o.name, prob: (o.price ?? 0) * carry, price: o.price, level: li + 1, marketId: m.id, image: o.image, token: o.token });
    }
    carry *= Math.max(0, 1 - Math.min(1, sum));
  });
  entries.sort((a, b) => b.prob - a.prob);
  return { entries, remainder: carry };
}

export async function getJobBoard(): Promise<Sourced<OppMarket>> {
  const ids = IDS.jobBoard.map((x) => x.id);
  const res = await searchMarkets({ marketIds: ids, chainsList: ["100"], limit: 3 }, 120);
  const byId = new Map(res.data.markets.map((m) => [m.id, m]));
  const levels = ids.map((id) => byId.get(id)).filter(Boolean) as Market[];
  const { entries, remainder } = chain(levels);
  const first = levels[0];
  return {
    ...res,
    data: {
      key: "jobboard",
      title: "AI job board name",
      question: first?.title ?? "What name will be adopted for the futarchy-run AI job board organization?",
      status: "live",
      chainId: 100,
      marketIds: ids,
      entries,
      remainder,
      liquidityUSD: levels.reduce((a, m) => a + m.liquidityUSD, 0),
      volumeUSD: levels.reduce((a, m) => a + m.volumeUSD, 0),
      closes: first?.openingTs ?? 0,
      note: `${entries.length} names across ${levels.length} linked markets — each level's “Other” buys into the next.`,
      appUrl: `https://opportunity.seer.pm`,
    },
  };
}

/** Settled markets have no live odds; use each outcome's last traded price before trading closed. */
export async function getSettled(which: "rebrand" | "devcon"): Promise<Sourced<OppMarket | null>> {
  const ref = IDS[which];
  const res = await searchMarkets({ marketIds: [ref.id], chainsList: [String(ref.chainId)], limit: 1 }, 3600);
  const m = res.data.markets[0];
  if (!m) return { ...res, data: null };
  const chart = await getMarketChart(m.chainId, m.id, m.outcomes.map((o) => o.token));
  // trading continued after the question opened; cut just before the resolution spike
  // (the first moment any outcome trades at ≥ 0.9), so we show what traders expected beforehand
  const all = chart.data.flat();
  const spike = all.filter((p) => p.p >= 0.9).reduce((a, p) => Math.min(a, p.t), Infinity);
  const cutoff = Number.isFinite(spike) ? spike - 1 : Math.max(0, ...all.map((p) => p.t));
  const lastBefore = (i: number) => {
    const pts = (chart.data[i] ?? []).filter((p) => p.t <= cutoff);
    return pts.length ? pts[pts.length - 1].p : null;
  };
  const named = m.outcomes.filter((o) => !o.isInvalid);
  const prices = named.map((o) => lastBefore(o.index));
  const sum = prices.reduce<number>((a, p) => a + (p ?? 0), 0) || 1;
  const entries: Entry[] = named
    .map((o, i) => ({ name: o.name, prob: (prices[i] ?? 0) / sum, price: prices[i], level: 1, marketId: m.id, image: o.image, won: o.won, token: o.token }))
    .sort((a, b) => b.prob - a.prob);
  return {
    ...chart,
    mode: chart.mode === "live" && res.mode === "live" ? "live" : "snapshot",
    data: {
      key: which,
      title: which === "rebrand" ? "Seer rebrand contest" : "Devcon merch design",
      question: m.title,
      status: "settled",
      chainId: m.chainId,
      marketIds: [m.id],
      entries,
      remainder: 0,
      liquidityUSD: m.liquidityUSD,
      volumeUSD: m.volumeUSD,
      closes: m.openingTs,
      winner: named.find((o) => o.won)?.name,
      note: "Prices shown are the last trades before the market closed — what traders expected before the team chose.",
      appUrl: m.appUrl,
    },
  };
}
