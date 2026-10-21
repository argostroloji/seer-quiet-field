import { getRisk } from "@/lib/seer/risk";
import { agentJSON } from "@/lib/agent";

export const revalidate = 300;

export async function GET() {
  const res = await getRisk();
  const d = res.data;
  return agentJSON("risk", "Market-implied default probabilities for DeFi assets on one comparable scale. An estimate, not a rating or insurance.", res, {
    market: { id: d.marketId, quarter: d.quarter, endsAt: d.endTime, pricedAt: d.updatedAt, noneDefault12m: +d.noToAll.toFixed(4) },
    assets: [...d.assets]
      .sort((a, b) => b.pdYearly - a.pdYearly)
      .map((a) => ({ name: a.name, class: a.cls, pdQuarter: +a.pdQuarterly.toFixed(6), pd12m: +a.pdYearly.toFixed(6), outcomeToken: a.outcomeToken })),
  });
}
