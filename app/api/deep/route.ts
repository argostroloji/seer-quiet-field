import { getDeepRound, getDeepWeights, concentration } from "@/lib/seer/deep";

export const revalidate = 300;

/** Machine-readable Deep page: the same data the human view renders. Schema: seer-six.deep/v1 */
export async function GET() {
  const [round, weights] = await Promise.all([getDeepRound(), getDeepWeights()]);
  const c = concentration(weights.data.rows.map((r) => r.forecast));
  return Response.json(
    {
      schema: "seer-six.deep/v1",
      provenance: { mode: round.mode, fetchedAt: round.fetchedAt, source: "https://deep.seer.pm/.netlify/functions/get-originality-r3-v3-markets-data" },
      round: {
        name: round.data.name,
        chainId: 10,
        parentMarketId: round.data.parentMarketId,
        question: "What originality score will the human jury assign to each repository?",
        unit: "originality 0..1 (UP-token price)",
        repos: round.data.repos.map((r) => ({ repo: r.repo, marketId: r.marketId, forecast: r.score, upPrice: r.up, downPrice: r.down })),
      },
      calibration: {
        market: weights.data.marketId,
        note: "Resolved L1 juror-weight market: market forecast vs. the jury's final weights.",
        concentration: { n: c.n, leaderShare: c.leader, top10Share: c.top10, effectiveN: c.effectiveN },
        rows: weights.data.rows.slice(0, 101),
      },
      howToTrade: "Upload a CSV of repo,originality on https://deep.seer.pm to see your edge vs. the market, then trade the UP/DOWN tokens.",
      caveat: "Forecasts guide which repos to read first. The jury evaluates; the market does not decide.",
    },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
