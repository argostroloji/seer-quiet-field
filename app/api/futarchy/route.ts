import { getProposals, getProposalPrices } from "@/lib/seer/futarchy";
import { IDS } from "@/lib/seer/config";
import { agentJSON } from "@/lib/agent";

const gapOf = (p?: { pass: number | null; fail: number | null } | null) => {
  if (!p?.pass || !p?.fail) return null;
  const g = (p.pass - p.fail) / p.fail;
  return Math.abs(g) > 0.5 ? null : +g.toFixed(6);
};

/** ?p=<proposal address> picks the featured proposal (default: the live EIP-8363 market). */
export async function GET(req: Request) {
  const want = (new URL(req.url).searchParams.get("p") || "").toLowerCase();
  const reg = await getProposals();
  const list = reg.data;
  const f = list.find((x) => x.id === want) ?? list.find((x) => x.id === IDS.futarchyLive.id) ?? list[0];
  const [main, ...rest] = await Promise.all([getProposalPrices(f.id, f.chainId, 48), ...list.slice(0, 14).map((x) => getProposalPrices(x.id, x.chainId, 2))]);
  const band = /\b(\d+(?:\.\d+)?)%/.exec(f.twapDescription ?? "")?.[1];
  const g = gapOf(main.data);
  const b = band ? Number(band) / 100 : null;
  return agentJSON("futarchy", "If a proposal passes vs. if it fails, what does the market expect for the success metric? The market informs; the DAO decides.", main, {
    featured: {
      id: f.id,
      chainId: f.chainId,
      org: f.org,
      question: `${f.question} ${f.event}`.trim(),
      metric: main.data ? `${main.data.company} price in ${main.data.currency}` : null,
      pass: main.data?.pass == null ? null : +main.data.pass.toFixed(4),
      fail: main.data?.fail == null ? null : +main.data.fail.toFixed(4),
      gap: g,
      passProbability: main.data?.passProb == null ? null : +main.data.passProb.toFixed(4),
      decisionRule: f.twapDescription ?? null,
      band: b,
      recommendationNow: b != null && g != null ? (Math.abs(g) <= b ? "neutral" : g > 0 ? "lean pass" : "lean fail") : null,
      closesAt: f.closeTimestamp ?? null,
      hourly: main.data ? { pass: main.data.passSeries.map((p) => [p.t, +p.p.toFixed(4)]), fail: main.data.failSeries.map((p) => [p.t, +p.p.toFixed(4)]) } : null,
    },
    proposals: list.slice(0, 14).map((x, i) => ({ id: x.id, chainId: x.chainId, org: x.org, question: `${x.question} ${x.event}`.trim(), createdAt: x.createdAt, gap: gapOf(rest[i].data), page: `/futarchy?p=${x.id}` })),
  });
}
