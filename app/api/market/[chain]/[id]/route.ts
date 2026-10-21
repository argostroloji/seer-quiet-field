import { getMarket, getMarketChart } from "@/lib/seer/api";
import { agentJSON, agentMarket } from "@/lib/agent";

export async function GET(_: Request, { params }: { params: Promise<{ chain: string; id: string }> }) {
  const { chain, id } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(id)) return Response.json({ error: "bad market id" }, { status: 400, headers: { "access-control-allow-origin": "*" } });
  const res = await getMarket(Number(chain), id);
  if (!res.data) return Response.json({ error: "market not found" }, { status: 404, headers: { "access-control-allow-origin": "*" } });
  const m = res.data;
  const chart = await getMarketChart(m.chainId, m.id, m.outcomes.map((o) => o.token));
  const thin = <T,>(a: T[], n = 40) => a.filter((_, i) => i % Math.max(1, Math.ceil(a.length / n)) === 0 || i === a.length - 1);
  const history = Object.fromEntries(
    m.outcomes.filter((o) => !o.isInvalid).map((o) => [o.name, thin(chart.data[o.index] ?? []).map((p) => [p.t, +p.p.toFixed(4)])]),
  );
  return agentJSON("market", "Everything about one market: outcomes, prices, identifiers, resolution and price history.", res, {
    ...agentMarket(m),
    resolution: { realityQuestions: m.questions.map((q) => ({ id: q.id, openingTs: q.opening_ts, finalizeTs: q.finalize_ts, arbitrator: q.arbitrator, minBond: q.min_bond })) },
    creator: m.creator,
    factory: m.factory,
    createdTx: m.txHash,
    history: { unit: "[unix, price]", series: history, source: chart.source, mode: chart.mode },
  });
}
