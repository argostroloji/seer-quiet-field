import "server-only";
import { unstable_cache } from "next/cache";
import { sourced } from "./api";
import type { Sourced } from "./types";

const DEEP = "https://deep.seer.pm/.netlify/functions";
const FORCE = process.env.SEER_FORCE_SNAPSHOT === "1";

export const R3_PARENT = "0x37ab5cbeee3a32289430e5d38b914ec7f580fd87";
export const L1_PARENT = "0x3220a208aaf4d2ceecde5a2e21ec0c9145f40ba6";

export interface DeepRepo {
  repo: string;
  marketId: string;
  /** market-implied originality score 0..1 (= UP token price, as Deep itself exports it) */
  score: number | null;
  up: number | null;
  down: number | null;
}

export interface DeepRound {
  name: string;
  parentMarketId: string;
  chainId: 10;
  status: string;
  repos: DeepRepo[];
}

async function getJSON<T>(url: string, timeoutMs = 20000): Promise<T> {
  if (FORCE) throw new Error("forced snapshot mode");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store", headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

type R3Raw = {
  marketsData: Record<string, { id: string; upPrice: number | null; downPrice: number | null }>;
  parentMarketStatus?: string;
};

function parseR3(raw: R3Raw): DeepRound {
  const repos = Object.entries(raw.marketsData)
    .filter(([repo]) => !/invalid/i.test(repo))
    .map(([repo, d]) => ({ repo, marketId: d.id, score: d.upPrice ?? null, up: d.upPrice ?? null, down: d.downPrice ?? null }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return { name: "Deep Funding · Round 3 Originality", parentMarketId: R3_PARENT, chainId: 10, status: raw.parentMarketStatus ?? "open", repos };
}

// Deep's functions take 5–11 s and send no cache headers: keep a parsed copy for 5 minutes.
const liveR3 = unstable_cache(async () => parseR3(await getJSON<R3Raw>(`${DEEP}/get-originality-r3-v3-markets-data`)), ["deep-r3-v1"], { revalidate: 300 });

export async function getDeepRound(): Promise<Sourced<DeepRound>> {
  return sourced("deep.seer.pm · originality R3", "https://deep.seer.pm", liveR3, async () =>
    parseR3((await import("@/public/snapshots/deep-originality-r3.json")).default as unknown as R3Raw),
  );
}

/* L1 juror-weight market: 101 repos, resolved — lets us show forecast vs. the jury's actual weights. */
export interface DeepWeights {
  name: string;
  marketId: string;
  rows: { repo: string; forecast: number; actual: number | null }[];
}

type L1Raw = {
  marketsData: Record<string, { price: number; marketId: string; id?: string }>;
  payoutNumerators?: string[];
  wrappedTokens?: string[];
  otherMarket?: { payoutNumerators?: string[] };
};

function parseL1(raw: L1Raw): DeepWeights {
  // wrappedTokens = parent market's outcomes followed by the "other repositories" child market's outcomes.
  // Parent payoutNumerators are the jury's weights; the child's are re-split inside the "Other" bucket.
  const tokens = (raw.wrappedTokens || []).map((t) => t.toLowerCase());
  const pay = (raw.payoutNumerators || []).map(Number);
  const psum = pay.reduce((a, b) => a + b, 0);
  const oPay = (raw.otherMarket?.payoutNumerators || []).map(Number);
  const osum = oPay.reduce((a, b) => a + b, 0);
  const all = Object.entries(raw.marketsData) as [string, { price: number; marketId: string; id?: string }][];
  const otherIdx = all.findIndex(([r]) => /^other repositories/i.test(r));
  const otherTok = otherIdx >= 0 ? all[otherIdx][1].id?.toLowerCase() : undefined;
  const otherWeight = otherTok && psum ? pay[tokens.indexOf(otherTok)] / psum : 0;
  const actualOf = (tok?: string) => {
    if (!tok || !psum) return null;
    const i = tokens.indexOf(tok.toLowerCase());
    if (i < 0) return null;
    if (i < pay.length) return pay[i] / psum;
    const j = i - pay.length;
    return osum ? (otherWeight * oPay[j]) / osum : null;
  };
  const entries = all.filter(([r]) => !/invalid|^other repositories/i.test(r));
  const fsum = entries.reduce((a, [, d]) => a + (d.price || 0), 0) || 1;
  const rows = entries
    .map(([repo, d]) => ({ repo, forecast: (d.price || 0) / fsum, actual: actualOf(d.id) }))
    .sort((a, b) => b.forecast - a.forecast);
  return { name: "Deep Funding · Level 1 juror weights", marketId: L1_PARENT, rows };
}

const liveL1 = unstable_cache(async () => parseL1(await getJSON<L1Raw>(`${DEEP}/get-l1-markets-data`)), ["deep-l1-v1"], { revalidate: 1800 });

export async function getDeepWeights(): Promise<Sourced<DeepWeights>> {
  return sourced("deep.seer.pm · L1 markets", "https://deep.seer.pm", liveL1, async () =>
    parseL1((await import("@/public/snapshots/deep-l1-markets.json")).default as unknown as L1Raw),
  );
}

export interface LeaderRow { rank: number; address: string; pnl: number; volume: number; roi: number; marketCount: number }
const liveLB = unstable_cache(
  async () => (await getJSON<{ rows: LeaderRow[] }>(`${DEEP}/get-leaderboard`, 12000)).rows.slice(0, 10),
  ["deep-lb-v1"],
  { revalidate: 1800 },
);
export async function getDeepLeaderboard(): Promise<Sourced<LeaderRow[]>> {
  return sourced("deep.seer.pm · leaderboard", "https://deep.seer.pm", liveLB, async () =>
    ((await import("@/public/snapshots/deep-leaderboard.json")).default as unknown as { rows: LeaderRow[] }).rows.slice(0, 10),
  );
}

/** Concentration statistics for a probability vector. */
export function concentration(weights: number[]) {
  const w = [...weights].filter((x) => x > 0).sort((a, b) => b - a);
  const s = w.reduce((a, b) => a + b, 0) || 1;
  const p = w.map((x) => x / s);
  const hhi = p.reduce((a, x) => a + x * x, 0);
  let cum = 0;
  const curve = p.map((x) => (cum += x));
  const top10 = curve[Math.min(9, curve.length - 1)] ?? 0;
  const halfAt = curve.findIndex((c) => c >= 0.5) + 1;
  return { n: p.length, leader: p[0] ?? 0, top10, effectiveN: hhi ? 1 / hhi : 0, halfAt, curve };
}
