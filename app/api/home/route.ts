import { getStats, searchMarkets } from "@/lib/seer/api";
import { getDeepRound } from "@/lib/seer/deep";
import { getJobBoard } from "@/lib/seer/opportunity";
import { getRisk } from "@/lib/seer/risk";
import { agentJSON, agentMarket, SITE } from "@/lib/agent";
import { AGENT_API, APPS } from "@/lib/apps";

export const revalidate = 120;

export async function GET() {
  const [stats, lines, deep, opp, risk] = await Promise.all([
    getStats(),
    searchMarkets({ marketStatusList: ["not_open", "open"], minLiquidity: 1, type: "Generic", orderBy: "liquidityUSD", orderDirection: "desc", limit: 10 }),
    getDeepRound(),
    getJobBoard(),
    getRisk(),
  ]);
  return agentJSON("home", "Seer is the base layer for prediction markets, futarchy and selection markets. This is the ecosystem at a glance.", stats, {
    stats: stats.data,
    apps: APPS.map((a) => ({ name: a.name, question: a.question, page: `${SITE}${a.href}`, api: `${SITE}${AGENT_API[a.key]}` })),
    headlines: {
      deepLeader: deep.data.repos[0] ? { repo: deep.data.repos[0].repo, forecast: deep.data.repos[0].score } : null,
      opportunityLeader: opp.data.entries[0] ? { name: opp.data.entries[0].name, prob: +opp.data.entries[0].prob.toFixed(4) } : null,
      riskiest: [...risk.data.assets].sort((a, b) => b.pdYearly - a.pdYearly).slice(0, 3).map((a) => ({ name: a.name, pd12m: +a.pdYearly.toFixed(4) })),
    },
    topMarkets: lines.data.markets.map(agentMarket),
  });
}
