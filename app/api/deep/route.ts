import { getDeepRound, getDeepWeights, concentration } from "@/lib/seer/deep";
import { agentJSON } from "@/lib/agent";

export const revalidate = 300;

/** Machine-readable Deep page: the same data the human view renders. */
export async function GET() {
  const [round, weights] = await Promise.all([getDeepRound(), getDeepWeights()]);
  const c = concentration(weights.data.rows.map((r) => r.forecast));
  return agentJSON(
    "deep",
    "Across a big field of outcomes, where does the market point? Forecasts guide which repos to read first; the jury evaluates.",
    round,
    {
      round: {
        name: round.data.name,
        chainId: 10,
        parentMarketId: round.data.parentMarketId,
        question: "What originality score will the human jury assign to each repository?",
        unit: "originality 0..1 (UP-token price)",
        repos: round.data.repos.map((r, i) => ({ rank: i + 1, repo: r.repo, marketId: r.marketId, forecast: r.score, upPrice: r.up, downPrice: r.down })),
      },
      calibration: {
        market: weights.data.marketId,
        note: "Resolved Level 1 juror-weight market: market forecast vs. the jury's final weights.",
        concentration: { n: c.n, leaderShare: c.leader, top10Share: c.top10, effectiveN: c.effectiveN },
        rows: weights.data.rows,
      },
    },
    { howToTrade: "Upload a CSV of repo,originality on https://deep.seer.pm to see your edge vs. the market, then trade the UP/DOWN tokens." },
  );
}
