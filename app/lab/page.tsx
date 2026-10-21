import type { Metadata } from "next";
import Link from "next/link";
import { searchMarkets } from "@/lib/seer/api";
import { visibleOutcomes } from "@/lib/seer/normalize";
import { LiveLines, type LineMarket } from "@/components/home/live-lines";

export const metadata: Metadata = { title: "Lab — homepage direction", robots: { index: false } };
export const revalidate = 120;

export default async function Lab() {
  const res = await searchMarkets({ marketStatusList: ["not_open", "open"], minLiquidity: 1, type: "Generic", orderBy: "liquidityUSD", orderDirection: "desc", limit: 40 });
  const all = await searchMarkets({ marketStatusList: ["not_open", "open"], limit: 1 });
  const markets: LineMarket[] = res.data.markets.map((m) => {
    const top = visibleOutcomes(m)[0];
    return { id: m.id, chainId: m.chainId, title: m.title, lead: m.kind === "scalar" ? `≈ ${m.implied?.toFixed(2) ?? "—"}` : top?.name ?? "", prob: m.kind === "scalar" ? null : top?.prob ?? null, liquidityUSD: m.liquidityUSD };
  });
  const today = new Date().toISOString().slice(0, 10).split("-").reverse().join(".");

  return (
    <section data-theme="light" className="relative isolate overflow-hidden bg-page text-text">
      {/* meta rule — Swiss poster header */}
      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-2 gap-4 border-b border-text/80 px-4 py-3 sm:grid-cols-4 sm:px-8">
        <p className="num text-[11px] uppercase tracking-[0.14em]">Seer</p>
        <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">Decision infrastructure</p>
        <p className="num hidden text-[11px] uppercase tracking-[0.14em] text-text-2 sm:block">{all.data.count.toLocaleString("en-US")} open markets</p>
        <p className="num text-right text-[11px] uppercase tracking-[0.14em] text-text-2">{today} · <span className="text-up">● live</span></p>
      </div>

      <div className="relative">
        <LiveLines markets={markets} total={all.data.count} />
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
          <h1 className="pointer-events-auto max-w-[9ch] text-[64px] font-medium leading-[0.86] tracking-[-0.055em] sm:text-[128px] lg:text-[164px]">
            Every question has a price.
          </h1>
        </div>
        <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-[1440px] px-4 sm:bottom-10 sm:px-8">
          <div className="grid max-w-[620px] gap-5 border-t border-text/80 pt-4 sm:grid-cols-[1.4fr_1fr]">
            <p className="text-[15px] leading-relaxed text-text-2">
              Seer is the open base layer for prediction markets, futarchy and selection markets. Each line above is a live market; together they resolve into one signal.
            </p>
            <div className="flex flex-col items-start gap-2">
              <Link href="/app" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-[14px] font-medium text-on-primary hover:bg-primary-hover">Explore live markets</Link>
              <Link href="#stack" className="text-[13px] text-text underline underline-offset-4">How the five apps fit</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
