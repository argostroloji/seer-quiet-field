import type { Metadata } from "next";
import Link from "next/link";
import { getJobBoard, getSettled, type OppMarket } from "@/lib/seer/opportunity";
import { OpportunityBoard } from "@/components/opportunity/board";
import { ErrorNote, Kicker, ProvenanceChip } from "@/components/ui";
import { fmtDate, fmtRelative, fmtUSD } from "@/lib/seer/normalize";
import type { Sourced } from "@/lib/seer/types";

export const metadata: Metadata = { title: "Opportunity Markets", description: "Which submissions does the market expect to be selected?" };

type SP = Record<string, string | string[] | undefined>;
const TABS = [
  { k: "jobboard", label: "AI job board name", tag: "Live" },
  { k: "rebrand", label: "Seer rebrand contest", tag: "Settled" },
  { k: "devcon", label: "Devcon merch design", tag: "Settled" },
] as const;

export default async function OpportunityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const k = TABS.some((t) => t.k === sp.m) ? (sp.m as (typeof TABS)[number]["k"]) : "jobboard";
  const [res, rebrand] = await Promise.all([
    k === "jobboard" ? getJobBoard() : getSettled(k),
    k === "rebrand" ? Promise.resolve(null) : getSettled("rebrand"),
  ]);
  const m = res.data as OppMarket | null;
  const rb = (k === "rebrand" ? (res as Sourced<OppMarket | null>) : rebrand)?.data ?? null;
  const ef = rb?.entries.find((e) => e.won);
  const efRank = ef ? rb!.entries.indexOf(ef) + 1 : null;

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <Kicker>05 · Opportunity Markets</Kicker>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[48px]">Which entries will the team pick?</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-2">
            Traders forecast which submissions will be selected. Reviewers get a second signal on a long list; the final choice stays with them.
          </p>
        </div>
        {/* Meta: this very contest */}
        <aside className="relative overflow-hidden rounded-[10px] border border-primary/40 bg-ink p-4 text-[#EDEDF2]">
          <div className="stripes-violet pointer-events-none absolute inset-0 opacity-[0.14]" />
          <p className="num relative text-[10.5px] uppercase tracking-[0.14em] text-[#A8A8B3]">Next on this page</p>
          <p className="relative mt-1.5 text-[14px] leading-snug">
            The design you&apos;re looking at is an entry in Seer&apos;s six-interfaces contest. When submissions close, every entry becomes an outcome in an Opportunity Market like these.
          </p>
          <a href="https://poidh.xyz/mainnet/bounty/38" target="_blank" rel="noreferrer" className="relative mt-2 inline-block text-[12.5px] text-[#B48BFF] hover:underline">poidh bounty #38 ↗</a>
        </aside>
      </div>

      <div role="tablist" aria-label="Markets" className="scrollbar-none mt-8 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.k}
            role="tab"
            aria-selected={k === t.k}
            href={t.k === "jobboard" ? "/opportunity" : `/opportunity?m=${t.k}`}
            scroll={false}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3.5 text-[13.5px] ${k === t.k ? "bg-primary text-on-primary" : "bg-card text-text-2 hover:text-text"}`}
          >
            {t.label}
            <span className={`num rounded px-1.5 py-px text-[9.5px] uppercase tracking-wider ${k === t.k ? "bg-white/15" : t.tag === "Live" ? "bg-up/15 text-up" : "bg-nested text-muted"}`}>{t.tag}</span>
          </Link>
        ))}
      </div>

      {!m ? (
        <div className="mt-6"><ErrorNote>This market couldn&apos;t be loaded right now.</ErrorNote></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="max-w-[60ch] text-[20px] font-medium leading-snug tracking-[-0.015em]">{m.question}</h2>
              <p className="mt-1 text-[12.5px] text-text-2">{m.note}</p>
            </div>
            <ProvenanceChip p={res} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-line sm:grid-cols-4">
            <S k="Entries" v={String(m.entries.length)} />
            <S k="Volume" v={fmtUSD(m.volumeUSD)} />
            <S
              k={m.status === "live" ? (m.closes * 1000 > Date.now() ? "Trading closes" : "Awaiting the answer since") : "Question closed"}
              v={m.status === "live" && m.closes * 1000 > Date.now() ? fmtRelative(m.closes) : fmtDate(m.closes)}
            />
            <S k="Team selection" v={m.status === "live" ? "Pending" : m.winner ?? "—"} accent={m.status !== "live"} />
          </dl>

          {k === "rebrand" && ef && (
            <p className="mt-4 rounded-md bg-secondary/60 px-4 py-3 text-[13.5px] leading-relaxed text-text-2">
              <span className="text-text">Electric Foundation</span> — the identity this whole prototype is built on — won. Before the team chose, the market ranked it{" "}
              <span className="num text-text">#{efRank}</span> at <span className="num text-text">{(ef.prob * 100).toFixed(0)}%</span>.
            </p>
          )}

          <div className="mt-4">
            <OpportunityBoard m={m} />
          </div>
          <p className="mt-3 text-[12px] text-muted">
            Trade on <a className="text-signal hover:underline" href={m.status === "live" ? "https://opportunity.seer.pm" : `https://app.seer.pm/markets/${m.chainId}/${m.marketIds[0]}`} target="_blank" rel="noreferrer">Seer ↗</a> · market {m.marketIds.length > 1 ? "ids" : "id"}{" "}
            {m.marketIds.map((id, i) => (
              <Link key={id} href={`/app/market/${m.chainId}/${id}`} className="num text-text-2 hover:text-signal hover:underline">{i ? ", " : ""}{id.slice(0, 8)}…</Link>
            ))}
          </p>
        </>
      )}
    </div>
  );
}

function S({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-[11.5px] text-text-2">{k}</dt>
      <dd className={`num mt-1 truncate text-[22px] tracking-tight ${accent ? "text-signal" : ""}`}>{v}</dd>
    </div>
  );
}
