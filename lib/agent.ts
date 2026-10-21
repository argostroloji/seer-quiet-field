import type { Market, Sourced } from "./seer/types";

export const SITE = "https://seer-quiet-field.vercel.app";

/** Every agent endpoint answers in the same envelope: schema id, what the page is for, provenance, data. */
export function agentJSON<T>(schema: string, purpose: string, src: Pick<Sourced<unknown>, "mode" | "fetchedAt" | "source" | "href"> | null, data: T, extra: Record<string, unknown> = {}) {
  return Response.json(
    {
      schema: `seer-six.${schema}/v1`,
      purpose,
      provenance: src ? { mode: src.mode, fetchedAt: src.fetchedAt, source: src.source, href: src.href } : null,
      ...extra,
      data,
      notes: [
        "Prices are collateral per outcome token (0..1); prob is normalised across outcomes.",
        "Read-only mirror of Seer's public endpoints. Trade on https://app.seer.pm — this site never signs anything.",
      ],
    },
    {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    },
  );
}

/** Compact, stable market shape for agents. */
export function agentMarket(m: Market) {
  return {
    id: m.id,
    chainId: m.chainId,
    title: m.title,
    kind: m.kind,
    status: m.status,
    verified: m.verified,
    collateral: m.collateralSymbol,
    liquidityUSD: Math.round(m.liquidityUSD),
    volumeUSD: Math.round(m.volumeUSD),
    endsAt: m.openingTs,
    finalizesAt: m.finalizeTs,
    implied: m.implied ?? null,
    bounds: m.kind === "scalar" ? [m.lowerBound, m.upperBound] : null,
    outcomes: m.outcomes
      .filter((o) => !o.isInvalid)
      .map((o) => ({ name: o.name, price: o.price == null ? null : +o.price.toFixed(4), prob: o.prob == null ? null : +o.prob.toFixed(4), token: o.token, won: o.won ?? null })),
    parentMarket: m.parentMarketId,
    conditionId: m.conditionId,
    questionId: m.questionId,
    seer: m.appUrl,
    page: `${SITE}/app/market/${m.chainId}/${m.id}`,
  };
}
