import { SITE } from "@/lib/agent";

export const dynamic = "force-static";

export const ENDPOINTS = [
  { path: "/api/home", page: "/", question: "What is Seer and how do the apps fit together?", params: {} },
  { path: "/api/markets", page: "/app", question: "Find any market.", params: { q: "text or 0x address (market or creator)", status: "trading|answering|dispute|resolved|all", chain: "1|10|100|8453", cat: "elections|politics|crypto|…", kind: "binary|categorical|multi-categorical|scalar|futarchy", sort: "liquidityUSD|volumeUSD|ending|newest", verified: "1", page: "n" } },
  { path: "/api/market/{chainId}/{marketId}", page: "/app/market/{chainId}/{marketId}", question: "Everything about one market.", params: {} },
  { path: "/api/deep", page: "/deep", question: "Across a big field of outcomes, where does the market point?", params: {} },
  { path: "/api/futarchy", page: "/futarchy", question: "If it passes vs. if it doesn't: what does the market expect?", params: { p: "proposal address" } },
  { path: "/api/opportunity", page: "/opportunity", question: "Which submissions does the market expect to be selected?", params: { m: "jobboard|rebrand|devcon" } },
  { path: "/api/risk", page: "/risk", question: "How risky is each asset relative to the others?", params: {} },
];

/** Index of the agent API: every page of this site has a JSON twin with the same data. */
export function GET() {
  return Response.json(
    {
      name: "Quiet Field — Seer, read by agents",
      about: `${SITE}/about`,
      llms: `${SITE}/llms.txt`,
      principle: "Markets inform; people decide. Read-only — this site never signs or sends transactions.",
      endpoints: ENDPOINTS.map((e) => ({ ...e, url: SITE + e.path })),
    },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, s-maxage=3600" } },
  );
}
