import type { Metadata } from "next";
import { getRisk, CLASS_ORDER } from "@/lib/seer/risk";
import { RiskExplorer } from "@/components/risk/explorer";
import { Kicker, ProvenanceChip } from "@/components/ui";
import { fmtDate } from "@/lib/seer/normalize";

export const metadata: Metadata = { title: "Risk Pricing", description: "Market estimates of default risk across DeFi protocols, on one comparable scale." };
export const revalidate = 300;

export default async function RiskPage() {
  const res = await getRisk();
  const d = res.data;
  const sorted = [...d.assets].sort((a, b) => b.pdYearly - a.pdYearly);
  const median = [...d.assets].map((a) => a.pdYearly).sort((a, b) => a - b)[Math.floor(d.assets.length / 2)];
  const stale = Date.now() / 1000 - d.updatedAt > 7 * 86400;

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <Kicker>06 · Risk Pricing</Kicker>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[48px]">How risky is each asset, relative to the others?</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-2">
            One Seer market prices the chance that each of {d.assets.length} DeFi assets defaults. Because they share a market and a horizon, the numbers compare directly — no single yes/no price read in isolation.
          </p>
        </div>
        <div className="space-y-2">
          <ProvenanceChip p={res} />
          <div className={`rounded-[10px] p-4 text-[13px] leading-relaxed ${stale ? "bg-warn/10 text-text-2 ring-1 ring-warn/40" : "bg-card text-text-2"}`}>
            <p className="font-medium text-text">Market {d.quarter} · priced as of {fmtDate(d.updatedAt)}</p>
            <p className="mt-1">
              {stale
                ? `The ${d.quarter} market (ended ${fmtDate(d.endTime)}) is the latest Seer has listed; its pools last moved on ${fmtDate(d.updatedAt)}. Treat these as dated estimates until the next quarter opens.`
                : `Live pool prices, refreshed every five minutes.`}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-line md:grid-cols-4">
        <S k="Assets priced" v={String(d.assets.length)} s={`${CLASS_ORDER.length} classes`} />
        <S k="Highest 12-month risk" v={`${(sorted[0].pdYearly * 100).toFixed(1)}%`} s={sorted[0].name} />
        <S k="Median asset" v={`${(median * 100).toFixed(2)}%`} s="12-month default probability" />
        <S k="None of them default" v={`${(d.noToAll * 100).toFixed(0)}%`} s="market's own joint estimate, 12 months" />
      </dl>

      <div className="mt-6">
        <RiskExplorer data={d} classes={CLASS_ORDER} />
      </div>

      <section className="mt-6 grid gap-4 rounded-[10px] bg-card p-5 text-[13px] leading-relaxed text-text-2 md:grid-cols-3">
        <div>
          <p className="font-medium text-text">What “default” means</p>
          <p className="mt-1">Each outcome pays if that asset suffers a qualifying default event during the market&apos;s window, as resolved through Reality.eth and Kleros.</p>
        </div>
        <div>
          <p className="font-medium text-text">From price to probability</p>
          <p className="mt-1">Outcome prices are converted by risk.seer.pm into quarterly and 12-month default probabilities. We show those numbers unchanged.</p>
        </div>
        <div>
          <p className="font-medium text-text">What it isn&apos;t</p>
          <p className="mt-1">Not a rating, insurance or advice. Thinly traded outcomes move on small trades — read the ranking, not the third decimal.</p>
        </div>
      </section>
    </div>
  );
}

function S({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-[11.5px] text-text-2">{k}</dt>
      <dd className="num mt-1 truncate text-[24px] tracking-tight">{v}</dd>
      {s && <p className="mt-0.5 truncate text-[11.5px] text-muted">{s}</p>}
    </div>
  );
}
