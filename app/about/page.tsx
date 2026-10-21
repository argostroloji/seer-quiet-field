import type { Metadata } from "next";
import Link from "next/link";
import { SUBMISSION } from "@/lib/apps";
import { Kicker } from "@/components/ui";

export const metadata: Metadata = { title: "About this design", description: "Design rationale, departures from the Electric Foundation kit, and data sources." };

const MAPPING = [
  { app: "Homepage", motif: "Converging lines", how: "Many lines meet at one point and leave as a single violet signal: opinions becoming a price. The protocol stack is drawn as the Brandbook describes Seer, a base layer with systems on top." },
  { app: "Seer app", motif: "Kit market card", how: "The kit card, made type-aware: binary shows Yes/No with the chance, categorical shows ranked rows, scalar shows a range with the implied value. A dense table view and an Etherscan-style detail page sit on the same grammar." },
  { app: "Deep", motif: "Dot matrix", how: "The Brandbook's dot field is the data. Every dot is one of the round's repos, stacked by forecast originality, and the review threshold shades the field." },
  { app: "Futarchy", motif: "45° fork", how: "One trunk splits into two futures. Pass is solid violet and fail is dashed, both on one shared scale with the proposal's own ±1% decision band." },
  { app: "Opportunity", motif: "One signal, quiet field", how: "A single 100% band. The top entries get colour, the long tail stays neutral, and unassigned probability is striped." },
  { app: "Risk Pricing", motif: "45° stripes", how: "The stripe density encodes the risk band (under 0.1%, 0.1–1%, 1–5%, over 5%) behind every asset on one log scale." },
];

const DEPARTURES = [
  ["Type stand-ins", "PP Neue Montreal and Suisse Intl Mono are commercial and weren't licensed to us, so we use Instrument Sans and Geist Mono (both OFL), which are closest in proportion. Swapping in the real fonts means changing two font files."],
  ["Contrast lifts", "The kit's muted label (#67676F on #1A1A1E) is 3.1:1. For text we use #8A8A94 (5.1:1). In light mode #8E8E99 becomes #6B6B76. The kit values stay for strokes and dividers."],
  ["Semantic colours", "The kit has one accent. We add up and down, warning and live colours, plus a six-step categorical chart palette that stays distinct for colour-blind readers. Violet still means the signal."],
  ["Two extra surface steps", "A hover surface (#26262C) and a hairline divider (#2A2A31) between the kit's nested surface and its text colours. Dense tables need them."],
  ["Kit typo fixed", "The Figma palette labels Button Primary as 67676F in both modes, but the swatch is violet. We use #7C33FF, the value the Brandbook gives and the pixels confirm."],
  ["Prices vs. probabilities", "Seer pools are independent, so raw prices don't sum to 1 (a binary can read 35¢ / 75¢). We show the raw price in ¢ and a normalised probability that sums to 100%, and we label which is which."],
  ["New components", "The kit doesn't cover these, so we designed them in its grammar: the ecosystem bar, the data-provenance chip, the shared-scale futarchy fork, the blind-review table, the Deep field plot, the risk scale, the agent view and the resolution timeline."],
  ["Density", "Explorer and comparison views use the kit's card and row radii (10 and 6 px) at tighter spacing, with optional tables, because comparison needs aligned columns."],
  ["Mark", "The hexagonal S is redrawn from the Brandbook's 45° construction for this prototype. It's not the production vector."],
  ["Navigation", "The kit's single-site top bar becomes one ecosystem bar. It looks the same on all six surfaces and shows which app you're in."],
];

const SOURCES = [
  ["app.seer.pm/.netlify/functions/markets-search", "Home, Seer app, Opportunity", "60–120 s"],
  ["app.seer.pm/.netlify/functions/get-market", "Market detail", "60 s"],
  ["app.seer.pm/.netlify/functions/market-chart", "Market detail, Opportunity (settled)", "15 min, downsampled server-side"],
  ["indexer.hyperindex.xyz (Seer Envio indexer)", "Home stats", "10 min"],
  ["deep.seer.pm/.netlify/functions/get-originality-r3-v3-markets-data", "Deep, /api/deep", "5 min"],
  ["deep.seer.pm/.netlify/functions/get-l1-markets-data", "Deep calibration", "30 min"],
  ["deep.seer.pm/.netlify/functions/get-leaderboard", "Deep", "30 min"],
  ["api.futarchy.seer.pm/registry/graphql", "Futarchy list", "5 min"],
  ["api.futarchy.seer.pm/candles/graphql (?chainId=1 for Ethereum)", "Futarchy prices and charts", "2 min"],
  ["risk.seer.pm/api/v1/risk-pricing (+ /markets, /history)", "Risk Pricing", "5 min"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[980px] px-4 pt-10 sm:px-6 sm:pt-16">
      <Kicker>About this design</Kicker>
      <h1 className="mt-3 text-[40px] font-medium leading-[1] tracking-[-0.035em] sm:text-[64px]">{SUBMISSION.name}</h1>
      <p className="mt-6 max-w-[64ch] text-[17px] leading-relaxed text-text-2">
        The Electric Foundation brandbook asks for <span className="text-text">&ldquo;one clear signal against a quiet, neutral field.&rdquo;</span> We took that literally. Every page is a neutral field of real Seer data, and in each one violet marks the single thing that page exists to answer. It's the same base layer six times over, each time with a different question. Nothing is mocked where Seer has real data, every panel says where its numbers came from and how fresh they are, and where markets inform human decisions the page says so.
      </p>

      <section className="mt-16" aria-labelledby="map-h">
        <h2 id="map-h" className="text-[24px] font-medium tracking-[-0.02em]">How the EF kit maps to each app</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {MAPPING.map((m) => (
            <div key={m.app} className="grid gap-2 py-4 sm:grid-cols-[160px_160px_1fr]">
              <dt className="text-[14px] font-medium">{m.app}</dt>
              <dd className="num text-[12px] uppercase tracking-[0.1em] text-signal">{m.motif}</dd>
              <dd className="text-[14px] leading-relaxed text-text-2">{m.how}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16" aria-labelledby="dep-h">
        <h2 id="dep-h" className="text-[24px] font-medium tracking-[-0.02em]">Departures from the kit</h2>
        <p className="mt-2 text-[14px] text-text-2">The tokens were read from the Seer Branding Figma (page, card and nested surfaces, three text levels, primary and secondary buttons, in dark and light). These are the places we changed them on purpose.</p>
        <ol className="mt-6 space-y-3">
          {DEPARTURES.map(([t, d], i) => (
            <li key={t} className="grid gap-1 rounded-[10px] bg-card p-4 sm:grid-cols-[40px_200px_1fr] sm:gap-4">
              <span className="num text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[14px] font-medium">{t}</span>
              <span className="text-[13.5px] leading-relaxed text-text-2">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="src-h">
        <h2 id="src-h" className="text-[24px] font-medium tracking-[-0.02em]">Data sources</h2>
        <p className="mt-2 text-[14px] text-text-2">Everything is fetched server-side from Seer&apos;s public endpoints and cached. If an endpoint fails, the panel switches to a dated snapshot from 21 Oct 2026, and its chip changes from <span className="num text-up">● live</span> to <span className="num text-warn">snapshot</span>.</p>
        <div className="mt-6 overflow-x-auto rounded-[10px] bg-card">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="px-4 py-3 font-normal">Endpoint</th>
                <th scope="col" className="py-3 font-normal">Used on</th>
                <th scope="col" className="px-4 py-3 font-normal">Refresh</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map(([e, p, r]) => (
                <tr key={e} className="border-t border-line/70">
                  <td className="num px-4 py-2.5 text-[12px] text-text">{e}</td>
                  <td className="py-2.5 text-text-2">{p}</td>
                  <td className="num px-4 py-2.5 text-[12px] text-text-2">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2" aria-labelledby="scope-h">
        <h2 id="scope-h" className="sr-only">Scope and choices</h2>
        <div className="rounded-[10px] bg-card p-5">
          <p className="text-[14px] font-medium">Honest scope</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-text-2">Trading and wallets are simulated. Trade tickets estimate at the current price, and nothing requests a signature. Every real market links to Seer. Risk Pricing shows the latest listed quarter (2026-Q3) with its as-of date, because no newer risk market exists yet.</p>
        </div>
        <div className="rounded-[10px] bg-card p-5">
          <p className="text-[14px] font-medium">Choices we made where Seer is silent</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13.5px] leading-relaxed text-text-2">
            <li>Chained opportunity markets (each level&apos;s &ldquo;Other&rdquo; funds the next) are merged into one ranking. Probability = level price × the &ldquo;Other&rdquo; mass above it.</li>
            <li>For settled contests we show the last trades before the resolution spike, which is what traders expected before the team chose.</li>
            <li>Risk asset classes are our grouping. risk.seer.pm lists the assets flat.</li>
            <li>Deep originality = UP-token price, the same value Deep exports in its weights CSV.</li>
          </ul>
        </div>
      </section>

      <p className="mt-12 text-[13px] text-text-2">
        Agents can read the Deep page as JSON at <Link href="/api/deep" className="num text-signal hover:underline">/api/deep</Link>. Built with Next.js, Tailwind and hand-made SVG charts, and no chart library.
      </p>
    </div>
  );
}
