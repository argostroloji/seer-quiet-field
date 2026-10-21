import Link from "next/link";
import { searchMarkets } from "@/lib/seer/api";
import { visibleOutcomes } from "@/lib/seer/normalize";
import { LiveLines, type LineMarket } from "@/components/home/live-lines";
import { LiveStrip } from "@/components/home/live-strip";
import { APPS } from "@/lib/apps";

export const revalidate = 120;

const PRIMITIVES = [
  { n: "Outcome tokens", d: "Every answer is an ERC-20 on Gnosis Conditional Tokens. Its price is the market's probability." },
  { n: "Market types", d: "Categorical, multi-categorical, scalar and multi-scalar — and conditional markets nested on any outcome." },
  { n: "Liquidity", d: "Outcome tokens trade in concentrated-liquidity pools against sDAI, sUSDS or a parent outcome." },
  { n: "Resolution", d: "Reality.eth answers with escalating bonds; Kleros jurors settle disputes. No single resolver." },
];

const AUDIENCES = [
  { who: "Traders", what: "Price any question and get paid for being right.", href: "/app" },
  { who: "DAOs", what: "See what a proposal does to your metric before you vote.", href: "/futarchy" },
  { who: "Juries & grant programs", what: "A second signal on a long list of submissions.", href: "/opportunity" },
  { who: "AI agents", what: "Forecast large fields through a machine-readable API.", href: "/deep" },
];

export default async function Home() {
  const [lines, open] = await Promise.all([
    searchMarkets({ marketStatusList: ["not_open", "open"], minLiquidity: 1, type: "Generic", orderBy: "liquidityUSD", orderDirection: "desc", limit: 40 }),
    searchMarkets({ marketStatusList: ["not_open", "open"], limit: 1 }),
  ]);
  const markets: LineMarket[] = lines.data.markets.map((m) => {
    const top = visibleOutcomes(m)[0];
    return {
      id: m.id,
      chainId: m.chainId,
      title: m.title,
      lead: m.kind === "scalar" ? `≈ ${m.implied?.toFixed(2) ?? "—"}` : top?.name ?? "",
      prob: m.kind === "scalar" ? null : top?.prob ?? null,
      liquidityUSD: m.liquidityUSD,
    };
  });
  const today = new Date().toISOString().slice(0, 10).split("-").reverse().join(".");

  return (
    <>
      {/* Poster: the EF converging lines, drawn from live markets */}
      <section aria-labelledby="hero-h" className="relative isolate overflow-hidden">
        <div className="border-b border-text/85">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-4 py-2.5 sm:grid-cols-4 sm:px-8">
            <p className="num text-[11px] uppercase tracking-[0.14em]"><span className="text-signal">01</span> — Seer</p>
            <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">Decision infrastructure</p>
            <p className="num hidden text-[11px] uppercase tracking-[0.14em] text-text-2 sm:block">{open.data.count.toLocaleString("en-US")} open markets</p>
            <p className="num text-right text-[11px] uppercase tracking-[0.14em] text-text-2">
              {today} · <span className={lines.mode === "live" ? "text-up" : "text-warn"}>{lines.mode === "live" ? "● live" : "snapshot"}</span>
            </p>
          </div>
        </div>
        <div className="relative">
          <LiveLines markets={markets} total={open.data.count} />
          <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
            <h1 id="hero-h" className="max-w-[9ch] text-[60px] font-medium leading-[0.86] tracking-[-0.055em] sm:text-[124px] lg:text-[164px]">
              Every question has a price.
            </h1>
          </div>
          <div className="mx-auto max-w-[1440px] px-4 pb-8 sm:absolute sm:inset-x-0 sm:bottom-10 sm:px-8 sm:pb-0">
            <div className="grid max-w-[660px] gap-5 border-t border-text/85 bg-page/92 pt-4 sm:grid-cols-[1.5fr_1fr] sm:pb-4 sm:pr-4">
              <p className="text-[15px] leading-relaxed text-text-2">
                Seer is the open base layer beneath prediction markets, futarchy and selection markets. Each line above is a live market; together they resolve into one signal.
              </p>
              <div className="flex flex-col items-start gap-2.5">
                <Link href="/app" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-[14px] font-medium text-on-primary hover:bg-primary-hover">
                  Explore live markets
                </Link>
                <a href="#index" className="text-[13px] text-text underline underline-offset-4">How the five apps fit</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Front page: one live number per app */}
      <section aria-labelledby="live-h" className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-8">
        <div className="flex items-baseline justify-between border-b border-text/85 pb-2">
          <h2 id="live-h" className="num text-[11px] uppercase tracking-[0.14em]">Today across the ecosystem</h2>
          <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">read live from Seer</p>
        </div>
        <LiveStrip />
      </section>

      {/* Index of the five apps */}
      <section id="index" aria-labelledby="index-h" className="mx-auto max-w-[1440px] scroll-mt-16 px-4 pt-24 sm:px-8">
        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-end">
          <h2 id="index-h" className="text-[44px] font-medium leading-[0.92] tracking-[-0.045em] sm:text-[72px]">
            One base layer.<br />Five questions.
          </h2>
          <p className="max-w-[54ch] text-[15px] leading-relaxed text-text-2">
            Every app reads and writes the same outcome tokens, pools and resolution. A market made in one is tradable and inspectable in all of them; the apps only differ in the question they help you ask.
          </p>
        </div>
        <ol className="mt-10 border-t border-text/85">
          {APPS.slice(1).map((a, i) => (
            <li key={a.key} className="border-b border-text/15">
              <Link href={a.href} className="group relative grid grid-cols-[36px_minmax(0,1fr)_24px] items-baseline gap-x-3 gap-y-2 py-5 sm:grid-cols-[72px_minmax(0,1fr)_minmax(0,1.2fr)_24px] sm:gap-x-4 sm:py-6">
                <span className="num col-start-1 row-start-1 text-[12px] text-muted">0{i + 2}</span>
                <span className="col-start-2 row-start-1 text-[30px] font-medium leading-none tracking-[-0.035em] transition-colors group-hover:text-signal sm:text-[52px]">{a.name}</span>
                <span className="col-start-2 row-start-2 text-[14px] leading-snug text-text-2 sm:col-start-3 sm:row-start-1 sm:text-[16px]">{a.question}</span>
                <span className="num col-start-3 row-start-1 text-right text-[18px] text-text-2 transition-transform group-hover:translate-x-1 group-hover:text-signal sm:col-start-4" aria-hidden="true">→</span>
                <span aria-hidden="true" className="absolute -bottom-px left-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ol>

        {/* the base layer itself: ink block */}
        <div data-theme="dark" className="mt-0 bg-ink px-5 py-8 text-text sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/15 pb-3">
            <p className="text-[22px] font-medium tracking-[-0.02em] sm:text-[28px]">Seer protocol <span className="text-text-2">— beneath all five</span></p>
            <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">Gnosis · Ethereum · Base · Optimism</p>
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRIMITIVES.map((p, i) => (
              <li key={p.n} className="border-t border-primary/60 pt-3">
                <p className="num text-[11px] text-signal">P{i + 1}</p>
                <p className="mt-1 text-[16px] font-medium">{p.n}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-2">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Principle */}
      <section aria-label="Principle" className="mx-auto max-w-[1440px] px-4 pt-28 sm:px-8">
        <p className="text-[56px] font-medium leading-[0.88] tracking-[-0.055em] sm:text-[120px] lg:text-[148px]">
          Markets inform.<br /><span className="text-signal">People decide.</span>
        </p>
        <p className="mt-8 max-w-[62ch] border-t border-text/85 pt-4 text-[15px] leading-relaxed text-text-2">
          In Deep, Futarchy and Opportunity Markets the price is a forecast, not a verdict. A jury still reads the repositories, a DAO still votes, a design team still picks the winner. Seer makes the crowd&apos;s expectation legible and accountable.
        </p>
      </section>

      {/* Audiences */}
      <section aria-labelledby="who-h" className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-8">
        <h2 id="who-h" className="num border-b border-text/85 pb-2 text-[11px] uppercase tracking-[0.14em]">Start where your question is</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <li key={a.who} className={`border-b border-text/15 lg:border-b-0 ${i ? "lg:border-l lg:border-text/15 lg:pl-6" : ""} ${i % 2 ? "sm:border-l sm:border-text/15 sm:pl-6 lg:pl-6" : ""} py-6 pr-4`}>
              <Link href={a.href} className="group block">
                <p className="text-[24px] font-medium tracking-[-0.03em] group-hover:text-signal">{a.who}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-text-2">{a.what}</p>
                <p className="num mt-4 text-[12px] text-signal">Open {APPS.find((x) => x.href === a.href)?.short} →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
