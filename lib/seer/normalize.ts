import type { ChainId, Market, MarketKind, MarketStatus, Outcome, SeerMarketRaw } from "./types";

export const ZERO = "0x0000000000000000000000000000000000000000";
export const NO_DATE = 33260976000;

export const CHAINS: Record<ChainId, { name: string; short: string; explorer: string; collateral: string }> = {
  100: { name: "Gnosis", short: "GNO", explorer: "https://gnosisscan.io", collateral: "sDAI" },
  10: { name: "Optimism", short: "OP", explorer: "https://optimistic.etherscan.io", collateral: "sUSDS" },
  8453: { name: "Base", short: "BASE", explorer: "https://basescan.org", collateral: "sUSDS" },
  1: { name: "Ethereum", short: "ETH", explorer: "https://etherscan.io", collateral: "sUSDS" },
};

export const explorerAddr = (chainId: ChainId, a: string) => `${CHAINS[chainId]?.explorer ?? "https://gnosisscan.io"}/address/${a}`;
export const explorerTx = (chainId: ChainId, h: string) => `${CHAINS[chainId]?.explorer ?? "https://gnosisscan.io"}/tx/${h}`;
export const seerUrl = (chainId: number, id: string) => `https://app.seer.pm/markets/${chainId}/${id}`;
// Reality.eth v3 deployments (same link format as seer-pm-sdk getRealityLink). Others fall back to Seer.
const REALITY: Partial<Record<number, string>> = {
  100: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  1: "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c",
};
export const realityUrl = (chainId: number, questionId: string) =>
  REALITY[chainId] ? `https://reality.eth.limo/app/#!/network/${chainId}/question/${REALITY[chainId]}-${questionId}` : null;

export function isInvalidName(n: string) {
  return /^invalid( result)?$/i.test(n.trim());
}

/** Mirrors Seer's own status derivation (demo/web getMarketStatus). */
export function marketStatus(m: SeerMarketRaw, now = Date.now() / 1000): MarketStatus {
  if (m.openingTs > now) return "not_open";
  if (!m.hasAnswers) return "open";
  if (Number(m.questionsInArbitration || 0) > 0) return "in_dispute";
  if (m.finalizeTs > now) return "answer_not_final";
  if (!m.payoutReported) return "pending_execution";
  return "closed";
}

export function uiStatus(s: MarketStatus): "open" | "pending" | "disputed" | "resolved" | "closed" {
  switch (s) {
    case "not_open":
    case "open":
      return "open";
    case "answer_not_final":
    case "pending_execution":
      return "pending";
    case "in_dispute":
      return "disputed";
    case "closed":
      return "resolved";
  }
}

export const STATUS_LABEL: Record<MarketStatus, string> = {
  not_open: "Open",
  open: "Open",
  answer_not_final: "Answer pending",
  in_dispute: "In dispute",
  pending_execution: "Pending payout",
  closed: "Resolved",
};

function kindOf(m: SeerMarketRaw): MarketKind {
  if (m.type === "Futarchy") return "futarchy";
  const real = m.outcomes.filter((o) => !isInvalidName(o));
  if (m.templateId === "1") return "scalar";
  if (m.templateId === "3") return "multi-categorical";
  if (real.length === 2) return "binary";
  return "categorical";
}

export const KIND_LABEL: Record<MarketKind, string> = {
  binary: "Binary",
  categorical: "Categorical",
  "multi-categorical": "Multi-categorical",
  scalar: "Scalar",
  futarchy: "Futarchy",
};

const num = (s: string | undefined) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/** Bounds arrive as 18-decimal integers for most scalar templates; scale down when obviously wei. */
function bound(s: string) {
  const n = num(s);
  return n > 1e15 ? n / 1e18 : n;
}

export function normalizeMarket(m: SeerMarketRaw): Market {
  const status = marketStatus(m);
  const kind = kindOf(m);
  const payouts = (m.payoutNumerators || []).map(num);
  const resolved = !!m.payoutReported;
  const totalPayout = payouts.reduce((a, b) => a + b, 0);
  const raw = m.outcomes.map((name, i) => {
    const o = m.odds?.[i];
    return { name: name.trim(), i, price: o == null ? null : o / 100, inv: isInvalidName(name) };
  });
  const sumValid = raw.filter((r) => !r.inv && r.price != null).reduce((a, r) => a + (r.price as number), 0);
  // Independent pools drift, so raw prices rarely sum to exactly 1. For categorical markets we
  // show normalised probabilities (documented departure); scalars keep raw UP/DOWN prices.
  const normalise = kind !== "scalar" && sumValid > 0;
  const outcomes: Outcome[] = raw.map((r) => ({
    index: r.i,
    name: r.name,
    token: m.wrappedTokens?.[r.i] ?? "",
    price: r.price,
    prob: r.price == null ? null : normalise && !r.inv ? r.price / sumValid : r.price,
    image: m.images?.outcomes?.[r.i],
    isInvalid: r.inv,
    won: resolved && totalPayout > 0 ? payouts[r.i] > 0 && payouts[r.i] === Math.max(...payouts) : undefined,
  }));

  let implied: number | undefined;
  const lo = bound(m.lowerBound);
  const hi = bound(m.upperBound);
  if (kind === "scalar") {
    const down = outcomes[0]?.price;
    const up = outcomes[1]?.price;
    if (down != null && up != null && up + down > 0) implied = lo + (up / (up + down)) * (hi - lo);
  }

  const parent = m.parentMarket?.id && m.parentMarket.id !== ZERO ? m.parentMarket.id : null;
  const collateralSymbol =
    m.poolBalance?.find(Boolean)?.token1?.symbol && /^s?(DAI|USDS|USDC)/i.test(m.poolBalance.find(Boolean)!.token1.symbol)
      ? m.poolBalance.find(Boolean)!.token1.symbol
      : parent
        ? "parent outcome"
        : CHAINS[m.chainId]?.collateral ?? "sDAI";

  return {
    id: m.id.toLowerCase(),
    chainId: m.chainId,
    slug: m.url,
    kind,
    type: m.type,
    title: m.marketName.trim(),
    outcomes,
    status,
    collateral: m.collateralToken,
    collateralSymbol,
    liquidityUSD: m.liquidityUSD || 0,
    volumeUSD: m.volumeUSD || 0,
    openInterestUSD: m.openInterestUSD || 0,
    conditionId: m.conditionId,
    questionId: m.questionId,
    parentMarketId: parent,
    parentOutcome: parent ? num(m.parentOutcome) : null,
    creator: m.creator,
    factory: m.factory,
    txHash: m.transactionHash,
    createdAt: m.blockTimestamp,
    openingTs: m.openingTs,
    finalizeTs: !m.finalizeTs || m.finalizeTs >= NO_DATE ? null : m.finalizeTs,
    questions: m.questions || [],
    verified: m.verification?.status === "verified",
    verification: m.verification?.status ?? "not_verified",
    categories: m.categories ?? [],
    image: m.images?.market,
    lowerBound: kind === "scalar" ? lo : undefined,
    upperBound: kind === "scalar" ? hi : undefined,
    implied,
    resolved,
    appUrl: seerUrl(m.chainId, m.id),
  };
}

/** Outcomes a human cares about: hide "Invalid", sort by probability. */
export function visibleOutcomes(m: Market, sort = true) {
  const v = m.outcomes.filter((o) => !o.isInvalid);
  return sort ? [...v].sort((a, b) => Number(!!b.won) - Number(!!a.won) || (b.prob ?? -1) - (a.prob ?? -1)) : v;
}

export function fmtUSD(n: number, compact = true) {
  if (!Number.isFinite(n)) return "—";
  if (compact) {
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K`;
  }
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 2 : 0 })}`;
}
export const fmtPct = (p: number | null | undefined, d = 1) => (p == null ? "—" : `${(p * 100).toFixed(p * 100 >= 10 || d === 0 ? (d === 0 ? 0 : 1) : d)}%`);
export const fmtCents = (p: number | null | undefined) => (p == null ? "—" : `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}¢`);
export function fmtNum(n: number, d = 2) {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: d });
}
export function fmtDate(ts: number | null | undefined, withTime = false) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" } : {}) }) + (withTime ? " UTC" : "");
}
export function fmtRelative(ts: number | null | undefined) {
  if (!ts) return "—";
  const s = ts - Date.now() / 1000;
  const a = Math.abs(s);
  const u = a < 3600 ? `${Math.round(a / 60)}m` : a < 86400 ? `${Math.round(a / 3600)}h` : `${Math.round(a / 86400)}d`;
  return s > 0 ? `in ${u}` : `${u} ago`;
}
