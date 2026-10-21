import "server-only";
import { searchMarkets, type SearchParams } from "./api";

/** Explorer query model, shared by /app (HTML) and /api/markets (JSON) so both answer identically. */
export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const STATUS_GROUPS: Record<string, { label: string; api: string[] }> = {
  trading: { label: "Open", api: ["not_open", "open"] },
  answering: { label: "Answer pending", api: ["answer_not_final"] },
  dispute: { label: "In dispute", api: ["in_dispute"] },
  resolved: { label: "Resolved", api: ["pending_execution", "closed"] },
};
export const SORTS: Record<string, { label: string; orderBy: SearchParams["orderBy"]; dir: "asc" | "desc" }> = {
  liquidityUSD: { label: "Liquidity", orderBy: "liquidityUSD", dir: "desc" },
  volumeUSD: { label: "Volume", orderBy: "volumeUSD", dir: "desc" },
  ending: { label: "Ending soon", orderBy: "openingTs", dir: "asc" },
  newest: { label: "Recently created", orderBy: "creationDate", dir: "desc" },
};
export const CATEGORIES = ["elections", "politics", "crypto", "sports", "science", "economy", "weather", "misc"];
export const KINDS = ["binary", "categorical", "multi-categorical", "scalar", "futarchy"] as const;
export const PER_PAGE = 24;
const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s.trim());

export function parseQuery(sp: SP) {
  const sort = SORTS[one(sp.sort)] ? one(sp.sort) : "liquidityUSD";
  return {
    q: one(sp.q).trim(),
    status: one(sp.status) || "trading",
    chain: one(sp.chain),
    cat: one(sp.cat),
    kind: one(sp.kind),
    sort,
    view: one(sp.view) === "table" ? "table" : "cards",
    verified: one(sp.verified) === "1",
    page: Math.max(1, Number(one(sp.page)) || 1),
  };
}
export type ExploreQuery = ReturnType<typeof parseQuery>;

export async function explore(Q: ExploreQuery) {
  const { q, status, chain, cat, kind, sort, verified, page } = Q;
  const local = !!kind && kind !== "futarchy"; // kinds other than futarchy are filtered here, not upstream
  const base: SearchParams = {
    chainsList: chain ? [chain] : [],
    marketStatusList: status === "all" ? [] : STATUS_GROUPS[status]?.api ?? [],
    categoryList: cat ? [cat] : [],
    verificationStatusList: verified ? ["verified"] : [],
    type: kind === "futarchy" ? "Futarchy" : kind ? "Generic" : "",
    orderBy: SORTS[sort].orderBy,
    orderDirection: SORTS[sort].dir,
    limit: local ? 200 : PER_PAGE,
    page: local ? 1 : page,
    // hide empty test markets unless the user is looking at resolved/all or searching
    minLiquidity: status === "trading" && !q && !verified ? 1 : undefined,
  };

  // Etherscan-style: a 0x string may be a market, or a creator — ask for both.
  const res = isAddr(q)
    ? await Promise.all([
        searchMarkets({ ...base, marketStatusList: [], minLiquidity: undefined, marketIds: [q] }),
        searchMarkets({ ...base, marketStatusList: [], minLiquidity: undefined, creator: q.toLowerCase() }),
      ]).then(([a, b]) => ({
        ...a,
        data: { markets: [...a.data.markets, ...b.data.markets.filter((m) => m.id !== q.toLowerCase())], count: a.data.count + b.data.count, pages: 1 },
      }))
    : await searchMarkets({ ...base, marketName: q || undefined });

  let markets = res.data.markets;
  if (local) markets = markets.filter((m) => m.kind === kind);
  const total = local ? markets.length : res.data.count;
  if (local) markets = markets.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return { res, markets, total, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}
