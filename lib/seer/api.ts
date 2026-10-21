import "server-only";
import { unstable_cache } from "next/cache";
import { normalizeMarket } from "./normalize";
import type { ChainId, Market, PricePoint, SeerMarketRaw, Sourced } from "./types";

const SEER = "https://app.seer.pm/.netlify/functions";
export const SNAPSHOT_DATE = "2026-10-21T08:14:00Z";
/** QA switch: SEER_FORCE_SNAPSHOT=1 makes every live call fail so fallbacks can be checked. */
const FORCE_SNAPSHOT = process.env.SEER_FORCE_SNAPSHOT === "1";

async function fetchJSON<T>(url: string, init: RequestInit & { revalidate?: number; timeoutMs?: number } = {}): Promise<T> {
  if (FORCE_SNAPSHOT) throw new Error("forced snapshot mode");
  const { revalidate = 120, timeoutMs = 9000, ...rest } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", accept: "application/json", ...(rest.headers || {}) },
      ...(rest.cache === "no-store" ? {} : { next: { revalidate } }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/** Run a live loader; on any failure return the dated snapshot instead, and say so. */
export async function sourced<T>(
  source: string,
  href: string | undefined,
  live: () => Promise<T>,
  snapshot: () => Promise<T> | T,
): Promise<Sourced<T>> {
  try {
    const data = await live();
    return { data, mode: "live", fetchedAt: new Date().toISOString(), source, href };
  } catch (e) {
    const data = await snapshot();
    return { data, mode: "snapshot", fetchedAt: SNAPSHOT_DATE, source, href, error: String((e as Error)?.message || e) };
  }
}

/* ---------------------------------- markets ---------------------------------- */

export interface SearchParams {
  marketName?: string;
  chainsList?: string[];
  type?: "Generic" | "Futarchy" | "";
  marketStatusList?: string[];
  verificationStatusList?: string[];
  categoryList?: string[];
  minLiquidity?: number;
  parentMarket?: string;
  marketIds?: string[];
  creator?: string;
  orderBy?: "liquidityUSD" | "volumeUSD" | "openingTs" | "creationDate" | "outcomesSupply";
  orderDirection?: "asc" | "desc";
  limit?: number;
  page?: number;
}

async function snapshotMarkets(): Promise<SeerMarketRaw[]> {
  const a = (await import("@/public/snapshots/seer-markets-search-open-by-liquidity.json")).default as unknown as { markets: SeerMarketRaw[] };
  const b = (await import("@/public/snapshots/opportunity-markets.json")).default as unknown as { markets?: SeerMarketRaw[] };
  const c = (await import("@/public/snapshots/deep-markets-search-r3-children.json")).default as unknown as { markets?: SeerMarketRaw[] };
  const seen = new Set<string>();
  return [...a.markets, ...(b.markets || []), ...(c.markets || [])].filter((m) => {
    const k = m.id.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function filterSnapshot(all: SeerMarketRaw[], p: SearchParams) {
  let r = all;
  if (p.marketIds?.length) {
    const ids = new Set(p.marketIds.map((x) => x.toLowerCase()));
    r = r.filter((m) => ids.has(m.id.toLowerCase()));
  }
  if (p.marketName) r = r.filter((m) => m.marketName.toLowerCase().includes(p.marketName!.toLowerCase()));
  if (p.parentMarket) r = r.filter((m) => m.parentMarket?.id?.toLowerCase() === p.parentMarket!.toLowerCase());
  if (p.chainsList?.length) r = r.filter((m) => p.chainsList!.includes(String(m.chainId)));
  if (p.type) r = r.filter((m) => m.type === p.type);
  const key = p.orderBy === "volumeUSD" ? "volumeUSD" : "liquidityUSD";
  r = [...r].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  return r.slice(0, p.limit ?? 40);
}

export async function searchMarkets(p: SearchParams, revalidate = 120): Promise<Sourced<{ markets: Market[]; count: number; pages: number }>> {
  const body = { orderBy: "liquidityUSD", orderDirection: "desc", limit: 40, page: 1, ...p };
  return sourced(
    "app.seer.pm · markets-search",
    "https://app.seer.pm/markets",
    async () => {
      const r = await fetchJSON<{ markets: SeerMarketRaw[]; count: number; pages: number }>(`${SEER}/markets-search`, {
        method: "POST",
        body: JSON.stringify(body),
        revalidate,
      });
      return { markets: r.markets.map(normalizeMarket), count: r.count, pages: r.pages };
    },
    async () => {
      const m = filterSnapshot(await snapshotMarkets(), p);
      return { markets: m.map(normalizeMarket), count: m.length, pages: 1 };
    },
  );
}

export async function getMarket(chainId: number, id: string): Promise<Sourced<Market | null>> {
  return sourced(
    "app.seer.pm · get-market",
    `https://app.seer.pm/markets/${chainId}/${id}`,
    async () => {
      // markets-search returns images too, so prefer it; get-market is the fallback for edge cases.
      const s = await fetchJSON<{ markets: SeerMarketRaw[] }>(`${SEER}/markets-search`, {
        method: "POST",
        body: JSON.stringify({ marketIds: [id], chainsList: [String(chainId)], limit: 1, orderBy: "liquidityUSD", orderDirection: "desc" }),
        revalidate: 60,
      });
      if (s.markets?.[0]) return normalizeMarket(s.markets[0]);
      const r = await fetchJSON<SeerMarketRaw>(`${SEER}/get-market`, { method: "POST", body: JSON.stringify({ chainId, id }), revalidate: 60 });
      return r?.id ? normalizeMarket(r) : null;
    },
    async () => {
      const m = (await snapshotMarkets()).find((x) => x.id.toLowerCase() === id.toLowerCase());
      if (m) return normalizeMarket(m);
      if (id.toLowerCase() === "0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a") {
        const r = (await import("@/public/snapshots/seer-market-detail-rebrand.json")).default as unknown as SeerMarketRaw;
        return normalizeMarket(r);
      }
      return null;
    },
  );
}

/* ---------------------------------- charts ---------------------------------- */

type ChartPoint = {
  pool: { token0: { id: string }; token1: { id: string } };
  token0Price: string;
  token1Price: string;
  periodStartUnix: number;
};

/** Downsample one outcome's pool snapshots to at most `max` points, price in collateral (0..1+). */
export function chartFromRaw(raw: ChartPoint[][], tokens: string[], max = 120): PricePoint[][] {
  return raw.map((series, i) => {
    const tok = (tokens[i] || "").toLowerCase();
    const pts = (series || [])
      .map((pt) => {
        const isT0 = pt.pool?.token0?.id?.toLowerCase() === tok;
        const p = Number(isT0 ? pt.token1Price : pt.token0Price);
        return { t: pt.periodStartUnix, p };
      })
      .filter((x) => Number.isFinite(x.p) && x.p >= 0 && x.p < 50)
      .sort((a, b) => a.t - b.t);
    if (pts.length <= max) return pts;
    const step = pts.length / max;
    const out: PricePoint[] = [];
    for (let k = 0; k < max; k++) out.push(pts[Math.floor(k * step)]);
    out.push(pts[pts.length - 1]);
    return out;
  });
}

const liveChart = unstable_cache(
  async (chainId: number, id: string, tokensKey: string) => {
    const raw = await fetchJSON<ChartPoint[][]>(`${SEER}/market-chart?marketId=${id.toLowerCase()}&chainId=${chainId}`, {
      cache: "no-store",
      timeoutMs: 14000,
    });
    return chartFromRaw(raw, tokensKey.split(","));
  },
  ["seer-market-chart-v1"],
  { revalidate: 900 },
);

export async function getMarketChart(chainId: number, id: string, tokens: string[]): Promise<Sourced<PricePoint[][]>> {
  return sourced(
    "app.seer.pm · market-chart",
    `https://app.seer.pm/markets/${chainId}/${id}`,
    () => liveChart(chainId, id, tokens.join(",")),
    async () => {
      if (id.toLowerCase() === "0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a") {
        const raw = (await import("@/public/snapshots/seer-market-chart-rebrand.json")).default as unknown as ChartPoint[][];
        return chartFromRaw(raw, tokens);
      }
      return [];
    },
  );
}

/* ---------------------------------- stats ---------------------------------- */

export interface SeerStats {
  markets: number;
  byChain: Partial<Record<ChainId, number>>;
  openMarkets: number;
  liquidityUSD: number;
  volumeUSD: number;
}

const ENVIO = "https://indexer.hyperindex.xyz/798eb82/v1/graphql";

export async function getStats(): Promise<Sourced<SeerStats>> {
  return sourced(
    "Seer indexer (Envio) + markets-search",
    "https://app.seer.pm/markets",
    async () => {
      const [counts, top, open] = await Promise.all([
        fetchJSON<{ data: { MarketsCount: { id: string; count: string }[] } }>(ENVIO, {
          method: "POST",
          body: JSON.stringify({ query: "{ MarketsCount { id count } }" }),
          revalidate: 600,
        }),
        // the 1,000 largest markets by volume carry essentially all volume and liquidity
        fetchJSON<{ markets: SeerMarketRaw[] }>(`${SEER}/markets-search`, {
          method: "POST",
          body: JSON.stringify({ orderBy: "volumeUSD", orderDirection: "desc", limit: 1000, page: 1 }),
          revalidate: 600,
          timeoutMs: 15000,
          cache: "no-store",
        }),
        fetchJSON<{ count: number }>(`${SEER}/markets-search`, {
          method: "POST",
          body: JSON.stringify({ marketStatusList: ["open"], orderBy: "liquidityUSD", orderDirection: "desc", limit: 1, page: 1 }),
          revalidate: 600,
        }),
      ]);
      const byChain: Partial<Record<ChainId, number>> = {};
      let total = 0;
      for (const c of counts.data.MarketsCount) {
        const chain = Number(String(c.id).split("-").pop()) as ChainId;
        if ([1, 10, 100, 8453].includes(chain)) {
          byChain[chain] = (byChain[chain] || 0) + Number(c.count);
          total += Number(c.count);
        }
      }
      return {
        markets: total,
        byChain,
        openMarkets: open.count,
        liquidityUSD: top.markets.reduce((a, m) => a + (m.liquidityUSD || 0), 0),
        volumeUSD: top.markets.reduce((a, m) => a + (m.volumeUSD || 0), 0),
      };
    },
    async () => {
      const s = (await import("@/public/snapshots/seer-aggregate-stats.json")).default as unknown as Record<string, unknown>;
      return {
        markets: 3495,
        byChain: { 100: 2593, 10: 731, 8453: 157, 1: 14 },
        openMarkets: 2137,
        liquidityUSD: Number(s.liquidityUSD ?? 249257),
        volumeUSD: Number(s.volumeUSD ?? 4322651),
      };
    },
  );
}
