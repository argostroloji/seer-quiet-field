import type { Metadata } from "next";
import Link from "next/link";
import { getJobBoard, getSettled, type OppMarket } from "@/lib/seer/opportunity";
import { OpportunityBoard } from "@/components/opportunity/board";
import { ErrorNote, ProvenanceChip } from "@/components/ui";
import { Lede, MetaRule, PosterTitle, StatRow } from "@/components/poster";
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
    <>
    <MetaRule index="05" app="Opportunity Markets" items={["Selection markets", m ? m.title : ""]} p={res} />
    <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
      <PosterTitle className="max-w-[12ch]">Who gets picked?</PosterTitle>
      <Lede
        aside={
          <>
            <p className="font-medium">This page will judge itself.</p>
            <p className="mt-1 text-text-2">
              This design is an entry in Seer&apos;s six-interfaces contest. When submissions close, every entry becomes an outcome in a market like these.{" "}
              <a href="https://poidh.xyz/mainnet/bounty/38" target="_blank" rel="noreferrer" className="text-signal underline-offset-4 hover:underline">poidh #38 ↗</a>
            </p>
          </>
        }
      >
        Traders forecast which submissions will be selected. Reviewers get a second signal on a long list; the final choice stays with them.
      </Lede>

      <div role="tablist" aria-label="Markets" className="scrollbar-none mt-12 flex gap-6 overflow-x-auto border-b border-text/85">
        {TABS.map((t) => (
          <Link
            key={t.k}
            role="tab"
            aria-selected={k === t.k}
            href={t.k === "jobboard" ? "/opportunity" : `/opportunity?m=${t.k}`}
            scroll={false}
            className={`relative flex h-12 shrink-0 items-center gap-2 text-[16px] ${k === t.k ? "text-text" : "text-text-2 hover:text-text"}`}
          >
            {k === t.k && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[3px] bg-primary" />}
            {t.label}
            <span className={`num rounded px-1.5 py-px text-[9.5px] uppercase tracking-wider ${t.tag === "Live" ? "bg-up/15 text-up" : "bg-nested text-text-2"}`}>{t.tag}</span>
          </Link>
        ))}
      </div>

      {!m ? (
        <div className="mt-6"><ErrorNote>This market couldn&apos;t be loaded right now.</ErrorNote></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="max-w-[34ch] text-[26px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[36px]">{m.question}</h2>
              <p className="mt-2 text-[13px] text-text-2">{m.note}</p>
            </div>
            <ProvenanceChip p={res} />
          </div>
          <div className="mt-6">
            <StatRow
              items={[
                { k: "Entries", v: String(m.entries.length) },
                { k: "Volume", v: fmtUSD(m.volumeUSD) },
                {
                  k: m.status === "live" ? (m.closes * 1000 > Date.now() ? "Trading closes" : "Awaiting answer since") : "Question closed",
                  v: m.status === "live" && m.closes * 1000 > Date.now() ? fmtRelative(m.closes) : fmtDate(m.closes),
                },
                { k: "Team selection", v: m.status === "live" ? "Pending" : m.winner ?? "—", accent: m.status !== "live" },
              ]}
            />
          </div>

          {k === "rebrand" && ef && (
            <p className="mt-6 max-w-[80ch] border-l-[3px] border-primary pl-4 text-[15px] leading-relaxed text-text-2">
              <span className="text-text">Electric Foundation</span> — the identity this whole prototype is built on — won. Before the team chose, the market ranked it{" "}
              <span className="num text-text">#{efRank}</span> at <span className="num text-text">{(ef.prob * 100).toFixed(0)}%</span>.
            </p>
          )}

          <div className="mt-10">
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
    </>
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
