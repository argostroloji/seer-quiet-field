import { ProvenanceChip, type Provenance } from "./ui";

/** Swiss poster header shared by all six apps: a mono meta rule over a very large title.
 *  The meta rule always answers: which app, which question, where the data comes from. */
export function MetaRule({ index, app, items = [], p }: { index: string; app: string; items?: React.ReactNode[]; p?: Provenance }) {
  return (
    <div className="border-b border-text/85">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-1 px-4 py-2.5 sm:px-8">
        <p className="num text-[11px] uppercase tracking-[0.14em]">
          <span className="text-signal">{index}</span> — {app}
        </p>
        {items.map((it, i) => (
          <p key={i} className="num hidden text-[11px] uppercase tracking-[0.14em] text-text-2 md:block">{it}</p>
        ))}
        {p && <ProvenanceChip p={p} className="ml-auto" />}
      </div>
    </div>
  );
}

export function PosterTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={`text-[52px] font-medium leading-[0.88] tracking-[-0.05em] sm:text-[96px] lg:text-[128px] ${className}`}>{children}</h1>
  );
}

/** Two-column lede under the title: one sentence + the principle, separated by a rule. */
export function Lede({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mt-8 grid gap-6 border-t border-text/85 pt-4 md:grid-cols-[1.4fr_1fr] md:gap-12">
      <p className="max-w-[60ch] text-[16px] leading-relaxed text-text-2">{children}</p>
      {aside && <div className="text-[14px] leading-relaxed text-text">{aside}</div>}
    </div>
  );
}

const COLS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" };

/** Index-style stat row: hairline columns, very large mono numerals. */
export function StatRow({ items }: { items: { k: string; v: React.ReactNode; s?: React.ReactNode; accent?: boolean }[] }) {
  return (
    <dl className={`grid grid-cols-2 border-y border-text/85 ${COLS[items.length] ?? "md:grid-cols-4"}`}>
      {items.map((it, i) => (
        <div key={it.k} className={`min-w-0 py-4 pr-4 ${i % 2 ? "pl-4 md:pl-6" : "md:pl-6"} ${i ? "border-l border-text/15" : "md:pl-0"} ${i === 2 ? "max-md:border-l-0 max-md:pl-0" : ""} ${i >= 2 ? "max-md:border-t max-md:border-text/15" : ""}`}>
          <dt className="num text-[10.5px] uppercase tracking-[0.12em] text-text-2">{it.k}</dt>
          <dd className={`num mt-2 truncate text-[30px] leading-none tracking-[-0.03em] sm:text-[40px] ${it.accent ? "text-signal" : ""}`}>{it.v}</dd>
          {it.s && <dd className="mt-1.5 truncate text-[12px] text-text-2">{it.s}</dd>}
        </div>
      ))}
    </dl>
  );
}
