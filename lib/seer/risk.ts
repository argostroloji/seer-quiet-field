import "server-only";
import { sourced } from "./api";
import type { Sourced } from "./types";

const RISK = "https://risk.seer.pm/api/v1/risk-pricing";
const FORCE = process.env.SEER_FORCE_SNAPSHOT === "1";

export type AssetClass = "ETH staking" | "BTC wrappers" | "Fiat-backed stables" | "Synthetic & yield stables" | "Tokenised credit & RWA";

/** Our grouping (risk.seer.pm lists assets flat). Documented on /about. */
export const ASSET_CLASS: Record<string, AssetClass> = {
  weETH: "ETH staking", stETH: "ETH staking", "ETH+": "ETH staking", bsdETH: "ETH staking", rETH: "ETH staking", pufETH: "ETH staking", avETH: "ETH staking",
  BTCB: "BTC wrappers", solvBTC: "BTC wrappers", tBTC: "BTC wrappers", cbBTC: "BTC wrappers", LBTC: "BTC wrappers", UBTC: "BTC wrappers",
  PYUSD: "Fiat-backed stables", RLUSD: "Fiat-backed stables", USDC: "Fiat-backed stables", USD1: "Fiat-backed stables", USDT: "Fiat-backed stables",
  USDS: "Synthetic & yield stables", RUSD: "Synthetic & yield stables", USDF: "Synthetic & yield stables", avUSD: "Synthetic & yield stables", NUSD: "Synthetic & yield stables",
  iUSD: "Synthetic & yield stables", "satUSD+": "Synthetic & yield stables", U: "Synthetic & yield stables", USDO: "Synthetic & yield stables",
  "GACLO-1": "Tokenised credit & RWA", "BUIDL-I": "Tokenised credit & RWA", JAAA: "Tokenised credit & RWA", JTRSY: "Tokenised credit & RWA", "mF-ONE": "Tokenised credit & RWA", STAC: "Tokenised credit & RWA",
};
export const CLASS_ORDER: AssetClass[] = ["Fiat-backed stables", "ETH staking", "BTC wrappers", "Tokenised credit & RWA", "Synthetic & yield stables"];

export interface RiskAsset {
  index: number;
  name: string;
  outcomeToken: string;
  price: number;
  pdQuarterly: number;
  pdYearly: number;
  cls: AssetClass;
  history: { t: number; q: number; y: number }[];
}

export interface RiskData {
  marketId: string;
  quarter: string;
  startTime: number;
  endTime: number;
  updatedAt: number;
  noToAll: number; // probability no listed asset defaults within the year
  assets: RiskAsset[];
}

async function get<T>(url: string): Promise<T> {
  if (FORCE) throw new Error("forced snapshot mode");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, next: { revalidate: 300 } });
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

type PricingRaw = { marketId: string; updatedAt: number; assets: { index: number; name: string; outcomeToken: string; price: number; pdQuarterly: number; pdYearly: number }[]; noToAll: { probability: number } };
type MarketsRaw = { markets: { id: string; quarter: string; startTime: number; endTime: number; current: boolean }[] };
type HistoryRaw = { times: number[]; assets: { index: number; pdQuarterly: number[]; pdYearly: number[] }[] };

function build(p: PricingRaw, m: MarketsRaw, h: HistoryRaw | null): RiskData {
  const mk = m.markets.find((x) => x.id.toLowerCase() === p.marketId.toLowerCase()) ?? m.markets[0];
  const step = h ? Math.max(1, Math.floor(h.times.length / 60)) : 1;
  return {
    marketId: p.marketId,
    quarter: mk?.quarter ?? "",
    startTime: mk?.startTime ?? 0,
    endTime: mk?.endTime ?? 0,
    updatedAt: p.updatedAt,
    noToAll: p.noToAll?.probability ?? 0,
    assets: p.assets.map((a) => {
      const ha = h?.assets.find((x) => x.index === a.index);
      const history = ha
        ? h!.times
            .map((t, i) => ({ t, q: ha.pdQuarterly[i], y: ha.pdYearly[i] }))
            .filter((x, i) => i % step === 0 && x.y != null && Number.isFinite(x.y) && x.t <= p.updatedAt + 86400)
        : [];
      return { ...a, cls: ASSET_CLASS[a.name] ?? "Synthetic & yield stables", history };
    }),
  };
}

export async function getRisk(): Promise<Sourced<RiskData>> {
  return sourced(
    "risk.seer.pm · risk-pricing API",
    "https://risk.seer.pm",
    async () => {
      const [p, m] = await Promise.all([get<PricingRaw>(RISK), get<MarketsRaw>(`${RISK}/markets`)]);
      const h = await get<HistoryRaw>(`${RISK}/history?market=${p.marketId}`).catch(() => null);
      return build(p, m, h);
    },
    async () =>
      build(
        (await import("@/public/snapshots/risk-pricing.json")).default as unknown as PricingRaw,
        (await import("@/public/snapshots/risk-pricing-markets.json")).default as unknown as MarketsRaw,
        (await import("@/public/snapshots/risk-pricing-history.json")).default as unknown as HistoryRaw,
      ),
  );
}
