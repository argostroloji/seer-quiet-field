import { SITE } from "@/lib/agent";
import { ENDPOINTS } from "../api/route";

export const dynamic = "force-static";

/** llms.txt — a plain-text map of this site for language-model agents. */
export function GET() {
  const body = `# Quiet Field — Seer's six interfaces

> A design prototype of Seer (seer.pm), the open base layer for prediction markets, futarchy and selection markets.
> Every page reads live data from Seer's public endpoints and has a JSON twin for agents. Read-only: no trading, no signatures.

Principle: markets inform; people decide. In Deep, Futarchy and Opportunity Markets prices are forecasts — juries, DAOs and reviewers make the call.

## Agent API (JSON, CORS *, cached ~2 min)
${ENDPOINTS.map((e) => `- [${e.path}](${SITE}${e.path.replace(/\{chainId\}\/\{marketId\}/, "100/0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a")}): ${e.question}${Object.keys(e.params).length ? ` Params: ${Object.entries(e.params).map(([k, v]) => `${k}=${v}`).join("; ")}.` : ""}`).join("\n")}

## Envelope
Every response: { schema, purpose, provenance: { mode: "live"|"snapshot", fetchedAt, source }, data, notes }.
Prices are collateral per outcome token (0..1). "prob" is normalised across outcomes so it sums to 1.

## Pages (human view)
${ENDPOINTS.filter((e) => !e.page.includes("{")).map((e) => `- [${e.page}](${SITE}${e.page}): ${e.question}`).join("\n")}
- [/about](${SITE}/about): design rationale, departures from the Electric Foundation kit, data sources

## Upstream (Seer)
- https://app.seer.pm/.netlify/functions/markets-search (POST)
- https://deep.seer.pm/.netlify/functions/get-originality-r3-v3-markets-data
- https://api.futarchy.seer.pm/registry/graphql · /candles/graphql
- https://risk.seer.pm/api/v1/risk-pricing
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, s-maxage=3600" } });
}
