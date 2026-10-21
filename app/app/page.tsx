import type { Metadata } from "next";
import Link from "next/link";
import { searchMarkets, type SearchParams } from "@/lib/seer/api";
import { CHAINS, KIND_LABEL, fmtPct, fmtUSD, visibleOutcomes } from "@/lib/seer/normalize";
import type { Market } from "@/lib/seer/types";
import { MarketCard, marketHref, ChainBadge, StatusDot, Thumb, MarketRowMeta } from "@/components/market-card";
import { Empty, ErrorNote, Kicker, ProvenanceChip } from "@/components/ui";

export const metadata: Metadata = { title: "Seer app — every market", description: "Search, filter and inspect every Seer market across chains." };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const STATUS_GROUPS: Record<string, { label: string; api: string[] }> = {
  trading: { label: "Open", api: ["not_open", "open"] },
  answering: { label: "Answer pending", api: ["answer_not_final"] },
  dispute: { label: "In dispute", api: ["in_dispute"] },
  resolved: { label: "Resolved", api: ["pending_execution", "closed"] },
};
const SORTS: Record<string, { label: string; orderBy: SearchParams["orderBy"]; dir: "asc" | "desc" }> = {
  liquidityUSD: { label: "Liquidity", orderBy: "liquidityUSD", dir: "desc" },
  volumeUSD: { label: "Volume", orderBy: "volumeUSD", dir: "desc" },
  ending: { label: "Ending soon", orderBy: "openingTs", dir: "asc" },
  newest: { label: "Recently created", orderBy: "creationDate", dir: "desc" },
};
const CATEGORIES = ["elections", "politics", "crypto", "sports", "science", "economy", "weather", "misc"];
const KINDS = ["binary", "categorical", "multi-categorical", "scalar", "futarchy"] as const;
const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s.trim());

export default async function AppPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status) || "trading";
  const chain = one(sp.chain);
  const cat = one(sp.cat);
  const kind = one(sp.kind);
  const sort = SORTS[one(sp.sort)] ? one(sp.sort) : "liquidityUSD";
  const view = one(sp.view) === "table" ? "table" : "cards";
  const verified = one(sp.verified) === "1";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const PER = 24;

  const base: SearchParams = {
    chainsList: chain ? [chain] : [],
    marketStatusList: status === "all" ? [] : STATUS_GROUPS[status]?.api ?? [],
    categoryList: cat ? [cat] : [],
    verificationStatusList: verified ? ["verified"] : [],
    type: kind === "futarchy" ? "Futarchy" : kind ? "Generic" : "",
    orderBy: SORTS[sort].orderBy,
    orderDirection: SORTS[sort].dir,
    limit: kind && kind !== "futarchy" ? 200 : PER,
    page: kind && kind !== "futarchy" ? 1 : page,
    // hide empty test markets unless the user is looking at resolved/all or searching
    minLiquidity: status === "trading" && !q && !verified ? 1 : undefined,
  };

  // Etherscan-style: a 0x string may be a market, or a creator — ask for both.
  const res = isAddr(q)
    ? await Promise.all([searchMarkets({ ...base, marketStatusList: [], minLiquidity: undefined, marketIds: [q] }), searchMarkets({ ...base, marketStatusList: [], minLiquidity: undefined, creator: q.toLowerCase() })]).then(([a, b]) => ({
        ...a,
        data: { markets: [...a.data.markets, ...b.data.markets.filter((m) => m.id !== q.toLowerCase())], count: a.data.count + b.data.count, pages: 1 },
      }))
    : await searchMarkets({ ...base, marketName: q || undefined });

  let markets = res.data.markets;
  if (kind && kind !== "futarchy") markets = markets.filter((m) => m.kind === kind);
  const total = kind && kind !== "futarchy" ? markets.length : res.data.count;
  if (kind && kind !== "futarchy") markets = markets.slice((page - 1) * PER, page * PER);
  const pages = Math.max(1, Math.ceil(total / PER));

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string> = { q, status, chain, cat, kind, sort, view, verified: verified ? "1" : "", page: "" };
    for (const [k, v] of Object.entries({ ...cur, ...patch })) if (v) p.set(k, v);
    if (p.get("status") === "trading") p.delete("status");
    if (p.get("sort") === "liquidityUSD") p.delete("sort");
    if (p.get("view") === "cards") p.delete("view");
    const s = p.toString();
    return s ? `/app?${s}` : "/app";
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>02 · Seer app</Kicker>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[44px]">Find any market. See everything about it.</h1>
        </div>
        <ProvenanceChip p={res} />
      </div>

      {/* Search — kit pill search, accepts question text, market address or creator address */}
      <form action="/app" method="get" role="search" className="mt-6">
        {status !== "trading" && <input type="hidden" name="status" value={status} />}
        {chain && <input type="hidden" name="chain" value={chain} />}
        {cat && <input type="hidden" name="cat" value={cat} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        {sort !== "liquidityUSD" && <input type="hidden" name="sort" value={sort} />}
        {view === "table" && <input type="hidden" name="view" value="table" />}
        <label htmlFor="q" className="sr-only">Search markets</label>
        <div className="flex h-12 items-center gap-2 rounded-full bg-card pl-4 pr-1.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-[var(--focus)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="q" name="q" defaultValue={q} placeholder="Search by question, market address or creator 0x…" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted" autoComplete="off" />
          <button className="h-9 rounded-full bg-primary px-4 text-[13px] font-medium text-on-primary hover:bg-primary-hover">Search</button>
        </div>
      </form>

      {/* Filters */}
      <div className="mt-4 space-y-2">
        <FilterRow label="Status">
          {[["trading", "Open"], ["answering", "Answer pending"], ["dispute", "In dispute"], ["resolved", "Resolved"], ["all", "All"]].map(([k, l]) => (
            <FLink key={k} href={href({ status: k, page: null })} active={status === k}>{l}</FLink>
          ))}
        </FilterRow>
        <FilterRow label="Type">
          <FLink href={href({ kind: null, page: null })} active={!kind}>All types</FLink>
          {KINDS.map((k) => <FLink key={k} href={href({ kind: k, page: null })} active={kind === k}>{KIND_LABEL[k]}</FLink>)}
        </FilterRow>
        <FilterRow label="Chain">
          <FLink href={href({ chain: null, page: null })} active={!chain}>All chains</FLink>
          {Object.entries(CHAINS).map(([id, c]) => <FLink key={id} href={href({ chain: id, page: null })} active={chain === id}>{c.name}</FLink>)}
        </FilterRow>
        <FilterRow label="Category">
          <FLink href={href({ cat: null, page: null })} active={!cat}>All</FLink>
          {CATEGORIES.map((c) => <FLink key={c} href={href({ cat: c, page: null })} active={cat === c}><span className="capitalize">{c}</span></FLink>)}
        </FilterRow>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[13px] text-text-2" aria-live="polite">
          <span className="num text-text">{total.toLocaleString("en-US")}</span> {total === 1 ? "market" : "markets"}
          {q && <> matching “<span className="text-text">{q}</span>”</>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href({ verified: verified ? null : "1", page: null })} aria-pressed={verified} className={`h-8 rounded-md px-3 text-[12.5px] leading-8 ${verified ? "bg-secondary text-secondary-text" : "text-text-2 hover:bg-nested"}`}>
            {verified ? "✓ " : ""}Kleros-verified only
          </Link>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <span className="text-[12px] text-muted">Sort</span>
          {Object.entries(SORTS).map(([k, s]) => <FLink key={k} href={href({ sort: k, page: null })} active={sort === k} small>{s.label}</FLink>)}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <div className="flex rounded-md bg-nested p-0.5" role="group" aria-label="View">
            <Link href={href({ view: "cards" })} aria-current={view === "cards" ? "true" : undefined} className={`h-7 rounded px-2.5 text-[12px] leading-7 ${view === "cards" ? "bg-card text-text" : "text-text-2"}`}>Cards</Link>
            <Link href={href({ view: "table" })} aria-current={view === "table" ? "true" : undefined} className={`h-7 rounded px-2.5 text-[12px] leading-7 ${view === "table" ? "bg-card text-text" : "text-text-2"}`}>Table</Link>
          </div>
        </div>
      </div>

      {res.mode === "snapshot" && <div className="mt-4"><ErrorNote>Seer&apos;s API didn&apos;t answer, so you&apos;re seeing the dated snapshot (21 Oct 2026). Filters apply to that snapshot only.</ErrorNote></div>}

      <div className="mt-4">
        {markets.length === 0 ? (
          <Empty>No markets match. Try another status, or search for a market or creator address.</Empty>
        ) : view === "cards" ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {markets.map((m) => <li key={`${m.chainId}:${m.id}`} className="flex"><div className="w-full"><MarketCard m={m} /></div></li>)}
          </ul>
        ) : (
          <MarketTable markets={markets} />
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && <Link className="h-9 rounded-md bg-card px-3 text-[13px] leading-9 hover:bg-nested" href={href({ page: String(page - 1) })}>← Previous</Link>}
          <span className="num px-2 text-[12.5px] text-text-2">Page {page} / {pages.toLocaleString("en-US")}</span>
          {page < pages && <Link className="h-9 rounded-md bg-card px-3 text-[13px] leading-9 hover:bg-nested" href={href({ page: String(page + 1) })}>Next →</Link>}
        </nav>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="num w-16 shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="scrollbar-none -mr-4 flex gap-0.5 overflow-x-auto pr-4 sm:mr-0 sm:flex-wrap sm:pr-0">{children}</div>
    </div>
  );
}

function FLink({ href, active, children, small }: { href: string; active?: boolean; children: React.ReactNode; small?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`${small ? "h-7 px-2 text-[12px] leading-7" : "h-8 px-3 text-[13px] leading-8"} shrink-0 whitespace-nowrap rounded-md transition-colors ${active ? "bg-primary text-on-primary" : "text-text-2 hover:bg-nested hover:text-text"}`}
    >
      {children}
    </Link>
  );
}

function MarketTable({ markets }: { markets: Market[] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] bg-card">
      <table className="w-full min-w-[860px] text-left text-[13px]">
        <caption className="sr-only">Markets</caption>
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
            <th scope="col" className="px-4 py-3 font-normal">Market</th>
            <th scope="col" className="px-3 py-3 font-normal">Leading outcome</th>
            <th scope="col" className="px-3 py-3 font-normal">Type</th>
            <th scope="col" className="px-3 py-3 text-right font-normal">Liquidity</th>
            <th scope="col" className="px-3 py-3 text-right font-normal">Volume</th>
            <th scope="col" className="px-3 py-3 font-normal">Status</th>
            <th scope="col" className="px-4 py-3 font-normal">Chain</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => {
            const top = visibleOutcomes(m)[0];
            return (
              <tr key={`${m.chainId}:${m.id}`} className="border-b border-line/70 last:border-0 hover:bg-nested/50">
                <td className="max-w-[420px] px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Thumb src={m.image} alt={m.title} size={26} />
                    <div className="min-w-0">
                      <Link href={marketHref(m)} className="line-clamp-1 hover:text-signal hover:underline">{m.title}</Link>
                      <MarketRowMeta m={m} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {m.kind === "scalar" ? (
                    <span className="num">{m.implied != null ? m.implied.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"} <span className="text-muted">implied</span></span>
                  ) : top ? (
                    <span className="flex items-center gap-2"><span className="max-w-[18ch] truncate">{top.name}</span><span className="num text-text-2">{fmtPct(top.prob)}</span></span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5 text-text-2">{KIND_LABEL[m.kind]}</td>
                <td className="num px-3 py-2.5 text-right">{fmtUSD(m.liquidityUSD)}</td>
                <td className="num px-3 py-2.5 text-right">{fmtUSD(m.volumeUSD)}</td>
                <td className="px-3 py-2.5"><StatusDot m={m} /></td>
                <td className="px-4 py-2.5"><ChainBadge chainId={m.chainId} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

