import Link from "next/link";
import { ConvergingLines } from "@/components/motifs";
import { ProtocolStack } from "@/components/protocol-stack";
import { LiveStrip } from "@/components/home/live-strip";
import { Kicker } from "@/components/ui";

export const revalidate = 300;

const AUDIENCES = [
  {
    who: "Traders",
    what: "Price any question — elections, crypto, grants, governance — and get paid for being right.",
    href: "/app",
    cta: "Browse every market",
  },
  {
    who: "DAOs",
    what: "Ask the market what a proposal does to the metric you care about, before you vote.",
    href: "/futarchy",
    cta: "See futarchy",
  },
  {
    who: "Grant programs & juries",
    what: "Let traders forecast which submissions you'll pick — a second signal for a long shortlist.",
    href: "/opportunity",
    cta: "See opportunity markets",
  },
  {
    who: "AI agents",
    what: "Forecast large fields of outcomes through a machine-readable API. Humans still make the call.",
    href: "/deep",
    cta: "See Deep",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero — EF converging-lines poster: many opinions, one price */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <ConvergingLines className="absolute inset-0 -z-10 h-full w-full text-text opacity-90" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--page)_18%,transparent_70%)]" />
        <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <Kicker className="rise">Seer · Decision infrastructure</Kicker>
          <h1 className="rise mt-4 max-w-[13ch] text-[44px] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[72px] lg:text-[84px]">
            Turn any question into a price.
          </h1>
          <p className="rise mt-6 max-w-[46ch] text-[16px] leading-relaxed text-text-2 sm:text-[18px]" style={{ animationDelay: "80ms" }}>
            Seer is the open protocol underneath prediction markets, futarchy and selection markets. Five apps, one
            base layer: outcome tokens, shared liquidity and decentralised resolution.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: "140ms" }}>
            <Link href="/app" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-[14px] font-medium text-on-primary hover:bg-primary-hover">
              Explore live markets
            </Link>
            <a href="#stack" className="inline-flex h-11 items-center rounded-md bg-secondary px-5 text-[14px] font-medium text-secondary-text hover:brightness-110">
              How it fits together
            </a>
          </div>
        </div>
      </section>

      {/* Live strip — one real number per app */}
      <section aria-labelledby="live-h" className="mx-auto max-w-[1320px] px-4 pt-10 sm:px-6">
        <h2 id="live-h" className="sr-only">Live across the ecosystem</h2>
        <LiveStrip />
      </section>

      {/* Stack */}
      <section id="stack" aria-labelledby="stack-h" className="mx-auto max-w-[1320px] scroll-mt-20 px-4 pt-24 sm:px-6">
        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <Kicker>One base layer</Kicker>
            <h2 id="stack-h" className="mt-3 text-[32px] font-medium leading-[1.05] tracking-[-0.025em] sm:text-[44px]">
              Five apps. Each answers one question.
            </h2>
          </div>
          <p className="max-w-[52ch] text-[15px] leading-relaxed text-text-2">
            Every app on top reads and writes the same primitives below, so a market created in one place is
            tradable, inspectable and resolvable everywhere. The apps differ only in the question they help you
            ask — and in how they show you the answer.
          </p>
        </div>
        <ProtocolStack />
      </section>

      {/* Principle */}
      <section className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6">
        <div className="grid gap-6 rounded-[10px] bg-card p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
          <p className="text-[28px] font-medium leading-[1.05] tracking-[-0.025em] sm:text-[40px]">
            Markets inform.<br />
            <span className="text-signal">People decide.</span>
          </p>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-text-2">
            Across Deep, Futarchy and Opportunity Markets the price is a forecast, not a verdict. A grant jury
            still reads the proposals; a DAO still votes; a design team still picks the winner. Seer makes the
            crowd&apos;s expectation legible and accountable — the decision stays with the people responsible for it.
          </p>
        </div>
      </section>

      {/* Audiences */}
      <section aria-labelledby="who-h" className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6">
        <Kicker>Who it&apos;s for</Kicker>
        <h2 id="who-h" className="mt-3 text-[32px] font-medium tracking-[-0.025em] sm:text-[44px]">Start where your question is.</h2>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <li key={a.who} className="flex flex-col justify-between gap-6 rounded-[10px] bg-card p-5">
              <div>
                <p className="text-[17px] font-medium">{a.who}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-2">{a.what}</p>
              </div>
              <Link href={a.href} className="text-[13px] text-signal hover:underline">{a.cta} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
