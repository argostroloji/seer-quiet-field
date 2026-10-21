import Link from "next/link";
import { getStats } from "@/lib/seer/api";
import { getJobBoard } from "@/lib/seer/opportunity";
import { getDeepRound } from "@/lib/seer/deep";
import { getProposalPrices } from "@/lib/seer/futarchy";
import { getRisk } from "@/lib/seer/risk";
import { IDS } from "@/lib/seer/config";
import { fmtPct, fmtUSD } from "@/lib/seer/normalize";
import { ProvenanceChip, type Provenance } from "@/components/ui";
import type { Sourced } from "@/lib/seer/types";

const prov = <T,>(s: Sourced<T>): Provenance => ({ source: s.source, href: s.href, fetchedAt: s.fetchedAt, mode: s.mode });

function Tile({ app, href, value, label, sub, p }: { app: string; href: string; value: string; label: string; sub?: string; p: Provenance }) {
  return (
    <li className="flex min-w-0 flex-col justify-between gap-4 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={href} className="num text-[10.5px] uppercase tracking-[0.14em] text-muted hover:text-text">{app} →</Link>
      </div>
      <div className="min-w-0">
        <p className="num truncate text-[26px] leading-none tracking-[-0.02em]" title={value}>{value}</p>
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-text-2">{label}</p>
        {sub && <p className="mt-1 truncate text-[11.5px] text-muted">{sub}</p>}
      </div>
      <ProvenanceChip p={p} compact className="self-start" />
    </li>
  );
}

export async function LiveStrip() {
  const [stats, deep, fut, risk, opp] = await Promise.all([
    getStats(),
    getDeepRound(),
    getProposalPrices(IDS.futarchyLive.id, IDS.futarchyLive.chainId, 4),
    getRisk(),
    getJobBoard(),
  ]);
  const leader = deep.data.repos[0];
  const f = fut.data;
  const gap = f?.pass != null && f?.fail != null ? ((f.pass - f.fail) / f.fail) * 100 : null;
  const riskTop = [...risk.data.assets].sort((a, b) => b.pdYearly - a.pdYearly)[0];
  const oTop = opp.data.entries[0];

  return (
    <ul className="grid gap-px overflow-hidden rounded-[10px] bg-line grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Tile app="Seer app" href="/app" value={stats.data.markets.toLocaleString("en-US")} label="markets created on Seer" sub={`${stats.data.openMarkets.toLocaleString("en-US")} still open`} p={prov(stats)} />
      <Tile app="Volume" href="/app?sort=volumeUSD" value={fmtUSD(stats.data.volumeUSD)} label="traded across the 1,000 largest markets" sub={`${fmtUSD(stats.data.liquidityUSD)} liquidity`} p={prov(stats)} />
      <Tile app="Deep" href="/deep" value={leader ? fmtPct(leader.score, 0) : "—"} label={leader ? `top originality forecast: ${leader.repo}` : "Deep Funding round"} sub={`${deep.data.repos.length} repos in the field`} p={prov(deep)} />
      <Tile app="Futarchy" href="/futarchy" value={gap == null ? "—" : `${gap >= 0 ? "+" : ""}${gap.toFixed(3)}%`} label="ETH price if EIP-8363 passes vs. if it fails" sub={f?.pass ? `${f.pass.toFixed(2)} vs ${f.fail?.toFixed(2)} ${f.currency}` : undefined} p={prov(fut)} />
      <Tile app="Opportunity" href="/opportunity" value={oTop ? fmtPct(oTop.prob, 0) : "—"} label={oTop ? `“${oTop.name}” leads the AI job-board name market` : "Opportunity markets"} sub={`${opp.data.entries.length} names in play`} p={prov(opp)} />
      <Tile app="Risk Pricing" href="/risk" value={riskTop ? fmtPct(riskTop.pdYearly) : "—"} label={riskTop ? `highest 1-yr default odds: ${riskTop.name}` : "Risk Pricing"} sub={`${risk.data.assets.length} assets · ${risk.data.quarter}`} p={prov(risk)} />
    </ul>
  );
}
