import { explore, parseQuery, PER_PAGE } from "@/lib/seer/explore";
import { agentJSON, agentMarket } from "@/lib/agent";

/** Same query parameters as /app: q, status (trading|answering|dispute|resolved|all), chain, cat, kind, sort, verified, page. */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const Q = parseQuery(sp);
  const { res, markets, total, pages } = await explore(Q);
  return agentJSON("markets", "Find any Seer market. Same filters as the explorer page.", res, markets.map(agentMarket), {
    query: { q: Q.q, status: Q.status, chain: Q.chain, cat: Q.cat, kind: Q.kind, sort: Q.sort, verified: Q.verified },
    page: { page: Q.page, perPage: PER_PAGE, pages, total },
  });
}
