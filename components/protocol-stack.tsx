import Link from "next/link";

const APPS_ON_TOP = [
  { href: "/app", name: "Seer app", q: "What is every market saying?", tag: "All types" },
  { href: "/deep", name: "Deep", q: "Where does a big field concentrate?", tag: "Many outcomes · agents" },
  { href: "/futarchy", name: "Futarchy", q: "Pass vs. fail: what happens to the metric?", tag: "Conditional" },
  { href: "/opportunity", name: "Opportunity", q: "Which entries will be selected?", tag: "Selection" },
  { href: "/risk", name: "Risk Pricing", q: "How risky is each protocol vs. the others?", tag: "Comparable risk" },
];

const PRIMITIVES = [
  { name: "Outcome tokens", d: "Every answer is an ERC-20 (Gnosis Conditional Tokens, wrapped). Price = probability." },
  { name: "Market types", d: "Categorical · multi-categorical · scalar · multi-scalar — and conditional (nested) markets on top of any outcome." },
  { name: "Liquidity", d: "Outcome tokens trade on concentrated-liquidity pools (Swapr / Uniswap v3-style) against sDAI and other collateral." },
  { name: "Resolution", d: "Reality.eth answers with escalating bonds; disputes go to Kleros. No single resolver." },
];

/** The ecosystem as Seer's own brandbook describes it: "a base layer with systems stacked on top". */
export function ProtocolStack() {
  return (
    <div className="relative">
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Applications built on Seer">
        {APPS_ON_TOP.map((a, i) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex h-full flex-col justify-between gap-6 rounded-[10px] bg-card p-4 transition-colors hover:bg-nested"
            >
              <div className="flex items-center justify-between">
                <span className="num text-[11px] text-muted">0{i + 2}</span>
                <span className="num rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-secondary-text">{a.tag}</span>
              </div>
              <div>
                <p className="text-[17px] font-medium tracking-[-0.01em]">{a.name}</p>
                <p className="mt-1 text-[13px] leading-snug text-text-2">{a.q}</p>
                <p className="mt-3 text-[12.5px] text-signal opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Open →</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {/* connectors: every app reads and writes the same primitives */}
      <div aria-hidden="true" className="relative my-1 hidden h-10 lg:block">
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 10">
          {[10, 30, 50, 70, 90].map((x) => (
            <line key={x} x1={x} y1="0" x2="50" y2="10" stroke="var(--primary)" strokeOpacity=".55" strokeWidth=".18" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div aria-hidden="true" className="my-2 flex justify-center lg:hidden">
        <span className="h-6 w-px bg-primary/60" />
      </div>

      <div className="relative overflow-hidden rounded-[10px] border border-primary/40 bg-ink p-4 text-[#EDEDF2] sm:p-5">
        <div className="stripes-violet pointer-events-none absolute inset-0 opacity-[0.18]" />
        <div className="relative flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[17px] font-medium">Seer protocol <span className="text-[#A8A8B3]">— the base layer</span></p>
          <p className="num text-[11px] uppercase tracking-[0.14em] text-[#A8A8B3]">Gnosis · Ethereum · Base · Optimism</p>
        </div>
        <ul className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRIMITIVES.map((p) => (
            <li key={p.name} className="rounded-md bg-white/[0.04] p-3 ring-1 ring-white/[0.06]">
              <p className="text-[13.5px] font-medium">{p.name}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-[#A8A8B3]">{p.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
