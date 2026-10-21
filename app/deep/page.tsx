import type { Metadata } from "next";
import { getDeepLeaderboard, getDeepRound, getDeepWeights, concentration } from "@/lib/seer/deep";
import { DeepField } from "@/components/deep/field";
import { ViewTabs, CodeBlock } from "@/components/view-tabs";
import { Kicker, Panel, ProvenanceChip, shortAddr } from "@/components/ui";
import { fmtUSD } from "@/lib/seer/normalize";

export const metadata: Metadata = { title: "Deep — many-outcome markets", description: "Where does the market's attention concentrate across a large field of outcomes?" };
export const revalidate = 300;

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

export default async function DeepPage() {
  const [round, weights, lb] = await Promise.all([getDeepRound(), getDeepWeights(), getDeepLeaderboard()]);
  const repos = round.data.repos;
  const scored = repos.filter((r) => r.score != null);
  const leader = scored[0];
  const c = concentration(weights.data.rows.map((r) => r.forecast));
  const withActual = weights.data.rows.filter((r) => r.actual != null) as { repo: string; forecast: number; actual: number }[];
  // how well did the market's ranking anticipate the jury? share of the jury's top-10 inside the market's top-10
  const mTop = new Set([...withActual].sort((a, b) => b.forecast - a.forecast).slice(0, 10).map((r) => r.repo));
  const jTop = [...withActual].sort((a, b) => b.actual - a.actual).slice(0, 10);
  const overlap = jTop.filter((r) => mTop.has(r.repo)).length;

  const agentJson = JSON.stringify(
    {
      schema: "seer-six.deep/v1",
      round: { name: round.data.name, chainId: 10, parentMarketId: round.data.parentMarketId, unit: "originality 0..1" },
      repos: repos.slice(0, 5).map((r) => ({ repo: r.repo, marketId: r.marketId, forecast: r.score && +r.score.toFixed(4) })),
      "…": `${repos.length - 5} more`,
    },
    null,
    2,
  );

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <Kicker>03 · Deep</Kicker>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[48px]">Across a big field, where does the market point?</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-2">
            <span className="text-text">{round.data.name}:</span> a human jury will score {repos.length} open-source repositories on originality.
            Traders and AI agents forecast those scores now, so the funding team knows which repos to read first.
          </p>
        </div>
        <div className="rounded-[10px] border border-primary/40 bg-secondary/40 p-4 text-[13.5px] leading-relaxed">
          <p className="font-medium text-text">The signal guides review. People evaluate.</p>
          <p className="mt-1 text-text-2">Prices rank where to look first; the jury still reads every repo and its scores, not the market&apos;s, settle the round.</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-line md:grid-cols-4">
        <Stat k="Repos in the field" v={String(repos.length)} s="one UP/DOWN market each · Optimism" />
        <Stat k="Highest forecast" v={leader ? pct(leader.score!) : "—"} s={leader?.repo} />
        <Stat k="Forecasts ≥ 75%" v={String(scored.filter((r) => r.score! >= 0.75).length)} s="likely ‘highly original’" />
        <Stat k="Status" v={round.data.status === "open" ? "Trading" : round.data.status} s="jury scores pending" />
      </dl>

      <div className="mt-8">
        <ViewTabs
          id="deep"
          human={
            <div className="space-y-4">
              <Panel title="The whole field" kicker="Every repo is a dot · forecast originality" provenance={round}>
                <DeepField repos={repos} />
              </Panel>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Panel title="Did the market see it coming?" kicker="Resolved round · Level 1 juror weights" provenance={weights}>
                  <p className="mb-4 max-w-[62ch] text-[13px] leading-relaxed text-text-2">
                    In the closed Level 1 round traders forecast how the jury would split funding weight across {c.n} repos. The jury has since voted, so we can check the signal.
                  </p>
                  <Scatter rows={withActual} />
                  <p className="mt-3 text-[12.5px] text-text-2">
                    <span className="num text-text">{overlap} of 10</span> repos in the jury&apos;s final top 10 were already in the market&apos;s top 10.
                  </p>
                </Panel>
                <Panel title="How concentrated is attention?" kicker="Level 1 forecast weights">
                  <Concentration c={c} />
                </Panel>
              </div>

              <Panel title="Most profitable forecasters" kicker="All Deep markets · by P&L" provenance={lb}>
                <p className="mb-3 text-[12.5px] text-text-2">Wallets aren&apos;t labelled human or agent on-chain, so we don&apos;t guess. Many Deep traders run agents that upload forecasts in bulk.</p>
                <div className="-mx-4 overflow-x-auto sm:-mx-5">
                  <table className="w-full min-w-[520px] text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                        <th scope="col" className="px-4 py-2 font-normal sm:px-5">#</th>
                        <th scope="col" className="py-2 font-normal">Wallet</th>
                        <th scope="col" className="py-2 text-right font-normal">P&amp;L</th>
                        <th scope="col" className="py-2 text-right font-normal">ROI</th>
                        <th scope="col" className="py-2 text-right font-normal">Volume</th>
                        <th scope="col" className="px-4 py-2 text-right font-normal sm:px-5">Markets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lb.data.slice(0, 8).map((r) => (
                        <tr key={r.address} className="border-t border-line/70">
                          <td className="num px-4 py-2 text-muted sm:px-5">{r.rank}</td>
                          <td className="py-2"><a className="num hover:text-signal hover:underline" href={`https://optimistic.etherscan.io/address/${r.address}`} target="_blank" rel="noreferrer">{shortAddr(r.address)}</a></td>
                          <td className={`num py-2 text-right ${r.pnl >= 0 ? "text-up" : "text-down"}`}>{r.pnl >= 0 ? "+" : ""}{fmtUSD(r.pnl)}</td>
                          <td className="num py-2 text-right">{pct(r.roi)}</td>
                          <td className="num py-2 text-right text-text-2">{fmtUSD(r.volume)}</td>
                          <td className="num px-4 py-2 text-right text-text-2 sm:px-5">{r.marketCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          }
          agent={
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4 text-[14px] leading-relaxed text-text-2">
                <h2 className="text-[22px] font-medium tracking-[-0.02em] text-text">Built for agents to trade</h2>
                <ol className="space-y-3">
                  <li><span className="num mr-2 text-signal">01</span>Pull the field as JSON from the endpoint below — the same numbers the human view draws.</li>
                  <li><span className="num mr-2 text-signal">02</span>Forecast each repo&apos;s originality (0–1) with your own model.</li>
                  <li><span className="num mr-2 text-signal">03</span>Diff your forecast against <code className="num text-text">forecast</code>: where you disagree most is your edge.</li>
                  <li><span className="num mr-2 text-signal">04</span>Upload a <code className="num text-text">repo,originality</code> CSV on deep.seer.pm and trade the UP/DOWN tokens in one batch.</li>
                </ol>
                <p className="rounded-md bg-nested p-3 text-[12.5px]">Agents move prices; the jury still scores. Your forecast is rewarded only if it anticipates human judgement.</p>
                <ProvenanceChip p={round} />
              </div>
              <div className="space-y-3">
                <CodeBlock label="Request" lang="bash" code={`curl https://seer-quiet-field.vercel.app/api/deep\n\n# upstream (no CORS, 5–11 s):\ncurl https://deep.seer.pm/.netlify/functions/get-originality-r3-v3-markets-data`} />
                <CodeBlock label="Response (excerpt)" code={agentJson} />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}

function Stat({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-[11.5px] text-text-2">{k}</dt>
      <dd className="num mt-1 truncate text-[24px] tracking-tight">{v}</dd>
      {s && <dd className="mt-0.5 truncate text-[11.5px] text-muted">{s}</dd>}
    </div>
  );
}

function Scatter({ rows }: { rows: { repo: string; forecast: number; actual: number }[] }) {
  const max = Math.max(0.01, ...rows.flatMap((r) => [r.forecast, r.actual])) * 1.05;
  const W = 520;
  const H = 300;
  const p = 34;
  const x = (v: number) => p + (v / max) * (W - p - 10);
  const y = (v: number) => H - p - (v / max) * (H - p - 10);
  const top = [...rows].sort((a, b) => b.actual - a.actual).slice(0, 3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Scatter of market forecast weight versus the jury's final weight per repository">
      <line x1={x(0)} y1={y(0)} x2={x(max)} y2={y(max)} stroke="var(--muted-line)" strokeDasharray="4 4" />
      <text x={x(max) - 4} y={y(max) + 14} textAnchor="end" fontSize="10.5" fill="var(--muted)">perfect forecast</text>
      <line x1={p} x2={W - 10} y1={H - p} y2={H - p} stroke="var(--line)" />
      <line x1={p} x2={p} y1={10} y2={H - p} stroke="var(--line)" />
      <text x={W - 10} y={H - 10} textAnchor="end" fontSize="11" fill="var(--text-2)">market forecast →</text>
      <text x={8} y={18} fontSize="11" fill="var(--text-2)">jury ↑</text>
      {rows.map((r) => (
        <circle key={r.repo} cx={x(r.forecast)} cy={y(r.actual)} r={3.6} fill="var(--primary)" fillOpacity=".75">
          <title>{`${r.repo} — market ${(r.forecast * 100).toFixed(1)}%, jury ${(r.actual * 100).toFixed(1)}%`}</title>
        </circle>
      ))}
      {top.map((r, i) => {
        const right = x(r.forecast) > W * 0.62;
        return (
          <text key={r.repo} x={x(r.forecast) + (right ? -8 : 8)} y={y(r.actual) + 4 + (i - 1) * 13} textAnchor={right ? "end" : "start"} fontSize="10.5" fill="var(--text)" className="num">
            {r.repo.split("/")[1]}
          </text>
        );
      })}
    </svg>
  );
}

function Concentration({ c }: { c: ReturnType<typeof concentration> }) {
  const W = 360;
  const H = 180;
  const pts = c.curve.map((v, i) => `${(i / Math.max(1, c.curve.length - 1)) * W},${H - v * H}`).join(" ");
  return (
    <div>
      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-nested p-3"><dt className="text-[11px] text-text-2">Leader</dt><dd className="num text-[20px]">{pct(c.leader, 1)}</dd></div>
        <div className="rounded-md bg-nested p-3"><dt className="text-[11px] text-text-2">Top 10</dt><dd className="num text-[20px]">{pct(c.top10)}</dd></div>
        <div className="rounded-md bg-nested p-3"><dt className="text-[11px] text-text-2">Effective N</dt><dd className="num text-[20px]">{c.effectiveN.toFixed(0)}</dd></div>
      </dl>
      <svg viewBox={`-2 -4 ${W + 4} ${H + 24}`} className="mt-4 h-auto w-full" role="img" aria-label={`Cumulative share curve: half of all forecast weight sits in the top ${c.halfAt} repos`}>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--line)" strokeDasharray="3 4" />
        <polyline points={`0,${H} ${W},0`} fill="none" stroke="var(--muted-line)" strokeDasharray="2 4" />
        <polyline points={`0,${H} ${pts}`} fill="none" stroke="var(--primary)" strokeWidth="2" />
        <text x="4" y={H / 2 - 6} fontSize="11" fill="var(--text-2)">50% of weight</text>
        <text x={W} y={H + 18} fontSize="11" fill="var(--muted)" textAnchor="end">{c.n} repos, ranked</text>
      </svg>
      <p className="mt-2 text-[12.5px] text-text-2">
        Half of all forecast weight sits in the top <span className="num text-text">{c.halfAt}</span> repos. An effective N of {c.effectiveN.toFixed(0)} means the field behaves like {c.effectiveN.toFixed(0)} equally-weighted contenders.
      </p>
    </div>
  );
}
