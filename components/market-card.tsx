import Link from "next/link";
import { CHAINS, KIND_LABEL, fmtCents, fmtPct, fmtUSD, fmtNum, uiStatus, visibleOutcomes, STATUS_LABEL, fmtRelative } from "@/lib/seer/normalize";
import type { Market } from "@/lib/seer/types";

export const marketHref = (m: Pick<Market, "chainId" | "id">) => `/app/market/${m.chainId}/${m.id}`;

export function ChainBadge({ chainId }: { chainId: number }) {
  const c = CHAINS[chainId as keyof typeof CHAINS];
  return (
    <span className="num inline-flex h-5 items-center rounded bg-nested px-1.5 text-[10px] uppercase tracking-wider text-text-2" title={c?.name}>
      {c?.name ?? chainId}
    </span>
  );
}

export function StatusDot({ m }: { m: Market }) {
  const s = uiStatus(m.status);
  const cls = s === "open" ? "bg-up" : s === "pending" ? "bg-warn" : s === "disputed" ? "bg-down" : "bg-muted-line";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-2">
      <span className={`h-1.5 w-1.5 rounded-full ${cls}`} aria-hidden="true" />
      {STATUS_LABEL[m.status]}
    </span>
  );
}

export function Thumb({ src, alt, size = 32 }: { src?: string; alt: string; size?: number }) {
  if (!src)
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="stripes grid shrink-0 place-items-center rounded-md bg-nested text-[11px] font-medium text-text-2"
      >
        {alt.trim().slice(0, 1).toUpperCase()}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" className="shrink-0 rounded-md bg-nested object-cover" style={{ width: size, height: size }} />;
}

/** Kit market card: header (thumb + question), outcome rows on nested surface, footer meta.
 *  Type-aware body: binary → Yes/No pair, categorical → top rows, scalar → range with implied value. */
export function MarketCard({ m }: { m: Market }) {
  const outs = visibleOutcomes(m);
  return (
    <article className="group relative flex flex-col rounded-[10px] bg-card p-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--card)_80%,var(--nested))]">
      <header className="flex items-start gap-2.5">
        <Thumb src={m.image} alt={m.title} />
        <h3 className="line-clamp-2 min-h-[2.5em] text-[13.5px] font-medium leading-[1.25]">
          <Link href={marketHref(m)} className="after:absolute after:inset-0 after:rounded-[10px] focus-visible:outline-none">
            {m.title}
          </Link>
        </h3>
      </header>

      <div className="mt-3 flex-1 space-y-1.5">
        {m.kind === "scalar" ? <ScalarRow m={m} /> : m.kind === "binary" ? <BinaryRow m={m} /> : (
          <>
            {outs.slice(0, 2).map((o) => (
              <div key={o.index} className="flex h-9 items-center gap-2 rounded-md bg-nested pl-2.5 pr-1.5">
                <span className="min-w-0 flex-1 truncate text-[12.5px]">{o.name}</span>
                <span className="num text-[12.5px] text-text-2">{fmtPct(o.prob)}</span>
                <span className="num inline-flex h-6 items-center rounded bg-primary px-2 text-[11px] text-on-primary">Yes</span>
                <span className="num inline-flex h-6 items-center rounded bg-secondary px-2 text-[11px] text-secondary-text">No</span>
              </div>
            ))}
            {outs.length > 2 && <p className="num px-1 text-[11px] text-muted">+{outs.length - 2} more outcomes</p>}
          </>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
        <span className="num">{fmtUSD(m.volumeUSD)} Vol.</span>
        <span aria-hidden="true">·</span>
        <StatusDot m={m} />
        <span className="ml-auto flex items-center gap-1">
          <span className="num rounded bg-nested px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-2">{KIND_LABEL[m.kind]}</span>
          <ChainBadge chainId={m.chainId} />
        </span>
      </footer>
    </article>
  );
}

function BinaryRow({ m }: { m: Market }) {
  const [a, b] = m.outcomes.filter((o) => !o.isInvalid);
  const pa = a?.prob ?? null;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="num text-[22px] leading-none tracking-tight">{fmtPct(pa, 0)}</span>
        <span className="text-[11.5px] text-text-2">chance of “{a?.name}”</span>
      </div>
      <div className="mb-2 h-1 overflow-hidden rounded-full bg-nested" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${+((pa ?? 0) * 100).toFixed(3)}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <span className="flex h-9 items-center justify-center gap-1.5 truncate rounded-md bg-primary px-2 text-[12.5px] text-on-primary">
          <span className="truncate">{a?.name}</span> <span className="num opacity-80">{fmtCents(a?.price)}</span>
        </span>
        <span className="flex h-9 items-center justify-center gap-1.5 truncate rounded-md bg-secondary px-2 text-[12.5px] text-secondary-text">
          <span className="truncate">{b?.name}</span> <span className="num opacity-80">{fmtCents(b?.price)}</span>
        </span>
      </div>
    </div>
  );
}

function ScalarRow({ m }: { m: Market }) {
  const lo = m.lowerBound ?? 0;
  const hi = m.upperBound ?? 1;
  const v = m.implied;
  const pos = v == null || hi === lo ? null : (v - lo) / (hi - lo);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="num text-[22px] leading-none tracking-tight">{v == null ? "—" : fmtNum(v)}</span>
        <span className="text-[11.5px] text-text-2">market-implied value</span>
      </div>
      <div className="relative h-6" aria-hidden="true">
        <div className="stripes absolute inset-x-0 top-2.5 h-1 rounded-full bg-nested" />
        {pos != null && (
          <div className="absolute top-0 h-6 w-[3px] -translate-x-1/2 rounded-full bg-primary" style={{ left: `${+(Math.min(100, Math.max(0, pos * 100))).toFixed(3)}%` }} />
        )}
      </div>
      <div className="num flex justify-between text-[10.5px] text-muted">
        <span>{fmtNum(lo)}</span>
        <span>{fmtNum(hi)}</span>
      </div>
    </div>
  );
}

export function MarketRowMeta({ m }: { m: Market }) {
  return (
    <span className="num text-[11px] text-muted">
      {m.openingTs * 1000 > Date.now() ? `ends ${fmtRelative(m.openingTs)}` : m.finalizeTs ? `answer final ${fmtRelative(m.finalizeTs)}` : `ended ${fmtRelative(m.openingTs)}`}
    </span>
  );
}
