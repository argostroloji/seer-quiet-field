import { getJobBoard, getSettled } from "@/lib/seer/opportunity";
import { agentJSON } from "@/lib/agent";

/** ?m=jobboard (live, default) | rebrand | devcon */
export async function GET(req: Request) {
  const m = new URL(req.url).searchParams.get("m");
  const res = m === "rebrand" || m === "devcon" ? await getSettled(m) : await getJobBoard();
  const d = res.data;
  return agentJSON(
    "opportunity",
    "Which submissions does the market expect to be selected? Reviewers decide; the market is a second signal.",
    res,
    d
      ? {
          market: { key: d.key, question: d.question, status: d.status, marketIds: d.marketIds, chainId: d.chainId, teamSelection: d.status === "live" ? "pending" : d.winner ?? null, note: d.note },
          unassigned: +d.remainder.toFixed(4),
          entries: d.entries.map((e, i) => ({ rank: i + 1, name: e.name, prob: +e.prob.toFixed(5), level: e.level, marketId: e.marketId, selected: e.won ?? null })),
        }
      : null,
    { markets: ["jobboard", "rebrand", "devcon"] },
  );
}
