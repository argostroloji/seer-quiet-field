import type { Metadata } from "next";
import { getRisk, CLASS_ORDER } from "@/lib/seer/risk";
import { RiskExplorer } from "@/components/risk/explorer";
import { Lede, MetaRule, PosterTitle, StatRow } from "@/components/poster";
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
    <>
    <MetaRule index="06" app="Risk Pricing" items={["Default risk across DeFi", `Market ${d.quarter}`]} p={res} />
    <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
      <PosterTitle className="max-w-[12ch]">Risk, side by side.</PosterTitle>
      <Lede
        aside={
          <div className={stale ? "border-l-[3px] border-warn pl-4" : ""}>
            <p className="font-medium">Market {d.quarter} · priced as of {fmtDate(d.updatedAt)}</p>
            <p className="mt-1 text-text-2">
              {stale
                ? `The ${d.quarter} market (ended ${fmtDate(d.endTime)}) is the latest Seer has listed; its pools last moved on ${fmtDate(d.updatedAt)}. Read these as dated estimates until the next quarter opens.`
                : "Live pool prices, refreshed every five minutes."}
            </p>
          </div>
        }
      >
        One Seer market prices the chance that each of {d.assets.length} DeFi assets defaults. Because they share a market and a horizon, the numbers compare directly instead of one yes/no price read in isolation.
      </Lede>
      <div className="mt-10">
        <StatRow
          items={[
            { k: "Assets priced", v: String(d.assets.length), s: `${CLASS_ORDER.length} classes` },
            { k: "Highest 12-month risk", v: `${(sorted[0].pdYearly * 100).toFixed(1)}%`, s: sorted[0].name, accent: true },
            { k: "Median asset", v: `${(median * 100).toFixed(2)}%`, s: "12-month default probability" },
            { k: "None of them default", v: `${(d.noToAll * 100).toFixed(0)}%`, s: "the market's own joint estimate" },
          ]}
        />
      </div>

      <div className="mt-6">
        <RiskExplorer data={d} classes={CLASS_ORDER} />
      </div>

      <section className="mt-14 grid gap-6 border-t border-text/85 pt-4 text-[13px] leading-relaxed text-text-2 md:grid-cols-3">
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
    </>
  );
}

function S({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-[11.5px] text-text-2">{k}</dt>
      <dd className="num mt-1 truncate text-[24px] tracking-tight">{v}</dd>
      {s && <dd className="mt-0.5 truncate text-[11.5px] text-muted">{s}</dd>}
    </div>
  );
}
