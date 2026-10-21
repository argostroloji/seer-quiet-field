import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMarket, getMarketChart, searchMarkets } from "@/lib/seer/api";
import {
  CHAINS, KIND_LABEL, STATUS_LABEL, explorerAddr, explorerTx, fmtDate, fmtPct, fmtCents, fmtUSD, fmtNum, realityUrl, visibleOutcomes,
} from "@/lib/seer/normalize";
import type { ChainId, Market } from "@/lib/seer/types";
import { ChainBadge, StatusDot, Thumb, marketHref } from "@/components/market-card";
import { CopyAddr, Kicker, Panel, ProvenanceChip, shortAddr } from "@/components/ui";
import { TradeTicket } from "@/components/trade-ticket";
import { MarketChart } from "@/components/market-chart";

type P = { params: Promise<{ chain: string; id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { chain, id } = await params;
  const r = await getMarket(Number(chain), id);
  return { title: r.data?.title ?? "Market" };
}

export default async function MarketPage({ params }: P) {
  const { chain, id } = await params;
  const chainId = Number(chain) as ChainId;
  if (!CHAINS[chainId] || !/^0x[0-9a-fA-F]{40}$/.test(id)) notFound();
  const res = await getMarket(chainId, id);
  const m = res.data;
  if (!m) notFound();
  const outs = visibleOutcomes(m);

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="num flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        <Link href="/app" className="hover:text-text">Markets</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/app?chain=${m.chainId}`} className="hover:text-text">{CHAINS[m.chainId].name}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-2">{shortAddr(m.id, 6)}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Thumb src={m.image} alt={m.title} size={56} />
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusDot m={m} />
              <span className="num rounded bg-nested px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-2">{KIND_LABEL[m.kind]}</span>
              <ChainBadge chainId={m.chainId} />
              {m.verified && <span className="num rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-secondary-text">Kleros-verified</span>}
              {m.parentMarketId && <span className="num rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-secondary-text">Conditional</span>}
            </div>
            <h1 className="max-w-[40ch] text-[24px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[32px]">{m.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ProvenanceChip p={res} />
          <a href={m.appUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md bg-secondary px-3 text-[13px] text-secondary-text hover:brightness-110">View on Seer ↗</a>
        </div>
      </header>

      {m.parentMarketId && (
        <p className="mt-4 rounded-md bg-nested px-3 py-2 text-[13px] text-text-2">
          Conditional market — only pays out if outcome <span className="num text-text">#{m.parentOutcome}</span> of its{" "}
          <Link className="text-signal hover:underline" href={marketHref({ chainId: m.chainId, id: m.parentMarketId })}>parent market</Link> wins. Its collateral is that outcome&apos;s token.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Stats m={m} />

          <Panel title="Price history" kicker="Outcome token prices" provenance={undefined} pad>
            <Suspense fallback={<div className="skeleton h-[260px] w-full" />}>
              <ChartSection m={m} />
            </Suspense>
          </Panel>

          <Panel title={`Outcomes (${outs.length})`} kicker={m.kind === "scalar" ? "UP / DOWN tokens" : "Ranked by implied probability"}>
            <OutcomeTable m={m} />
          </Panel>

          <Resolution m={m} />
          <Identifiers m={m} />
          <Suspense fallback={null}>
            <Children m={m} />
          </Suspense>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <TradeTicket outcomes={outs.map((o) => ({ name: o.name, price: o.price }))} collateral={m.collateralSymbol === "parent outcome" ? "tokens" : m.collateralSymbol} marketUrl={m.appUrl} />
          <p className="px-1 text-[11.5px] leading-relaxed text-muted">
            Prices are what one outcome token costs in {m.collateralSymbol}. A winning token redeems for 1. Probabilities are normalised across outcomes, so they sum to 100%.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stats({ m }: { m: Market }) {
  const items: [string, string][] = [
    ["Liquidity", fmtUSD(m.liquidityUSD)],
    ["Volume", fmtUSD(m.volumeUSD)],
    ["Open interest", fmtUSD(m.openInterestUSD)],
    [m.openingTs * 1000 > Date.now() ? "Trading ends" : "Question opened", fmtDate(m.openingTs)],
  ];
  if (m.kind === "scalar") items.unshift(["Implied value", m.implied == null ? "—" : fmtNum(m.implied)]);
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-line sm:grid-cols-4">
      {items.slice(0, 4).map(([k, v]) => (
        <div key={k} className="bg-card p-4">
          <dt className="text-[11.5px] text-text-2">{k}</dt>
          <dd className="num mt-1 text-[20px] tracking-tight">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const PALETTE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)", "var(--cat-6)"];

async function ChartSection({ m }: { m: Market }) {
  const res = await getMarketChart(m.chainId, m.id, m.outcomes.map((o) => o.token));
  // rank by latest traded price, so resolved markets (no live odds) still chart their leaders
  const last = (i: number) => res.data[i]?.[res.data[i].length - 1]?.p ?? -1;
  const top = [...visibleOutcomes(m)].sort((a, b) => Number(!!b.won) - Number(!!a.won) || last(b.index) - last(a.index)).slice(0, 6);
  const series = top
    .map((o, i) => ({ name: o.name, color: PALETTE[i], points: res.data[o.index] ?? [] }))
    .filter((s) => s.points.length > 1);
  return (
    <div>
      <div className="mb-3 flex justify-end"><ProvenanceChip p={res} /></div>
      {series.length ? (
        <MarketChart series={series} label={`Price history for ${m.title}`} />
      ) : (
        <p className="dots rounded-md px-4 py-12 text-center text-[13px] text-text-2">No pool history yet for this market.</p>
      )}
      {visibleOutcomes(m).length > 6 && <p className="mt-2 text-[11.5px] text-muted">Showing the six leading outcomes.</p>}
    </div>
  );
}

function OutcomeTable({ m }: { m: Market }) {
  const outs = m.kind === "scalar" ? visibleOutcomes(m, false) : visibleOutcomes(m);
  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-muted">
            <th scope="col" className="w-10 px-4 py-2 font-normal sm:px-5">#</th>
            <th scope="col" className="py-2 font-normal">Outcome</th>
            <th scope="col" className="w-[30%] py-2 font-normal">Probability</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Price</th>
            <th scope="col" className="px-4 py-2 font-normal sm:px-5">Token</th>
          </tr>
        </thead>
        <tbody>
          {outs.map((o, i) => (
            <tr key={o.index} className="border-t border-line/70">
              <td className="num px-4 py-2 text-muted sm:px-5">{i + 1}</td>
              <td className="max-w-[260px] py-2 pr-3">
                <span className="flex items-center gap-2">
                  {o.image && <Thumb src={o.image} alt={o.name} size={20} />}
                  <span className="truncate">{o.name}</span>
                  {o.won && <span className="num rounded bg-up/15 px-1.5 text-[10px] uppercase text-up">Won</span>}
                </span>
              </td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-nested" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${+((o.prob ?? 0) * 100).toFixed(3)}%` }} />
                  </div>
                  <span className="num w-12 text-right">{fmtPct(o.prob)}</span>
                </div>
              </td>
              <td className="num py-2 pr-3 text-right text-text-2">{fmtCents(o.price)}</td>
              <td className="px-4 py-2 sm:px-5">{o.token ? <CopyAddr value={o.token} href={explorerAddr(m.chainId, o.token)} /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Resolution({ m }: { m: Market }) {
  const q = m.questions[0];
  const now = Date.now() / 1000;
  const answered = m.status !== "not_open" && m.status !== "open";
  const steps = [
    { k: "Trading", d: `Created ${fmtDate(m.createdAt)}`, done: true, active: m.status === "not_open" },
    { k: "Question opens", d: fmtDate(m.openingTs, true), done: m.openingTs < now, active: m.status === "open" },
    { k: "Answer & bond window", d: m.finalizeTs ? `Final ${fmtDate(m.finalizeTs, true)}` : q?.timeout ? `${Math.round(q.timeout / 3600)} h after each answer` : "—", done: answered && m.status !== "answer_not_final", active: m.status === "answer_not_final" },
    { k: "Kleros dispute", d: m.status === "in_dispute" ? "In arbitration now" : "Only if someone pays to escalate", done: false, active: m.status === "in_dispute", optional: true },
    { k: "Resolved & redeemable", d: m.resolved ? "Payouts reported" : "Pending", done: m.resolved, active: m.status === "pending_execution" },
  ];
  const r = q ? realityUrl(m.chainId, q.id) : null;
  return (
    <Panel title="Resolution" kicker="Reality.eth → Kleros" actions={r ? <a href={r} target="_blank" rel="noreferrer" className="text-[12.5px] text-signal hover:underline">Reality.eth question ↗</a> : undefined}>
      <ol className="grid gap-3 sm:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.k} className="relative">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] num ${
                  s.active ? "bg-primary text-on-primary" : s.done ? "bg-secondary text-secondary-text" : "bg-nested text-muted"
                } ${s.optional ? "ring-1 ring-dashed ring-muted-line" : ""}`}
                aria-hidden="true"
              >
                {s.done && !s.active ? "✓" : i + 1}
              </span>
              <span className={`h-px flex-1 ${i === steps.length - 1 ? "hidden" : ""} ${s.done ? "bg-primary/60" : "bg-line"} hidden sm:block`} />
            </div>
            <p className={`mt-2 text-[13px] ${s.active ? "text-text" : "text-text-2"}`}>
              {s.k}
              {s.active && <span className="sr-only"> (current step)</span>}
            </p>
            <p className="num mt-0.5 text-[11px] text-muted">{s.d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] leading-relaxed text-text-2">
        Anyone can answer on Reality.eth by posting a bond; anyone can overturn it by doubling the bond. If the answer is still contested, Kleros jurors arbitrate. Current status: <span className="text-text">{STATUS_LABEL[m.status]}</span>.
        {q?.min_bond && Number(q.min_bond) > 0 && <> Minimum bond <span className="num text-text">{(Number(q.min_bond) / 1e18).toLocaleString("en-US")}</span>.</>}
      </p>
    </Panel>
  );
}

function Identifiers({ m }: { m: Market }) {
  const rows: [string, React.ReactNode][] = [
    ["Market", <CopyAddr key="m" value={m.id} href={explorerAddr(m.chainId, m.id)} n={6} />],
    ["Collateral", <span key="c" className="flex items-center gap-2"><span className="text-[12.5px]">{m.collateralSymbol}</span><CopyAddr value={m.collateral} href={explorerAddr(m.chainId, m.collateral)} /></span>],
    ["Condition ID", <CopyAddr key="ci" value={m.conditionId} n={8} />],
    ["Question ID", <CopyAddr key="qi" value={m.questionId} n={8} />],
    ["Creator", <span key="cr" className="flex items-center gap-2"><CopyAddr value={m.creator} href={explorerAddr(m.chainId, m.creator)} /><Link className="text-[12px] text-signal hover:underline" href={`/app?q=${m.creator}&status=all`}>other markets</Link></span>],
    ["Factory", <CopyAddr key="f" value={m.factory} href={explorerAddr(m.chainId, m.factory)} />],
    ["Created in tx", <CopyAddr key="tx" value={m.txHash} href={explorerTx(m.chainId, m.txHash)} n={6} />],
  ];
  if (m.parentMarketId) rows.splice(2, 0, ["Parent market", <Link key="p" className="num text-[12.5px] text-signal hover:underline" href={marketHref({ chainId: m.chainId, id: m.parentMarketId })}>{shortAddr(m.parentMarketId, 6)} · outcome #{m.parentOutcome}</Link>]);
  return (
    <Panel title="On-chain identifiers" kicker="Copy, verify, build on it">
      <dl className="divide-y divide-line/70">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <dt className="text-[12.5px] text-text-2">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

async function Children({ m }: { m: Market }) {
  const res = await searchMarkets({ parentMarket: m.id, chainsList: [String(m.chainId)], limit: 12, orderBy: "liquidityUSD", orderDirection: "desc" }, 300);
  const kids = res.data.markets;
  if (!kids.length) return null;
  return (
    <Panel title={`Conditional markets built on this one (${res.data.count})`} kicker="Nested markets" provenance={res}>
      <ul className="divide-y divide-line/70">
        {kids.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-3 py-2">
            <Link href={marketHref(k)} className="line-clamp-1 text-[13px] hover:text-signal hover:underline">{k.title}</Link>
            <span className="num shrink-0 text-[12px] text-text-2">if “{m.outcomes[k.parentOutcome ?? 0]?.name}” · {fmtUSD(k.liquidityUSD)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
