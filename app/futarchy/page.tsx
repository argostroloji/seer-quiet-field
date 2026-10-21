import type { Metadata } from "next";
import Link from "next/link";
import { getProposalPrices, getProposals, type ProposalMeta, type ProposalPrices } from "@/lib/seer/futarchy";
import { IDS } from "@/lib/seer/config";
import { fmtDate, fmtRelative, fmtUSD } from "@/lib/seer/normalize";
import { Panel, ProvenanceChip, ErrorNote } from "@/components/ui";
import { MarketChart } from "@/components/market-chart";
import { FutarchyPoster } from "@/components/futarchy/poster";
import { Lede, MetaRule, PosterTitle } from "@/components/poster";
import type { Sourced } from "@/lib/seer/types";

export const metadata: Metadata = { title: "Futarchy — conditional markets", description: "If this passes vs. if it doesn't: what does the market expect for the metric?" };
export const revalidate = 300;

type SP = Record<string, string | string[] | undefined>;

export default async function FutarchyPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const reg = await getProposals();
  const list = reg.data;
  const wanted = String(sp.p ?? "").toLowerCase();
  const featured = list.find((p) => p.id === wanted) ?? list.find((p) => p.id === IDS.futarchyLive.id) ?? list[0];
  const [main, ...rest] = await Promise.all([
    getProposalPrices(featured.id, featured.chainId, 120),
    ...list.slice(0, 14).map((p) => getProposalPrices(p.id, p.chainId, 2)),
  ]);
  const others = list.slice(0, 14).map((p, i) => ({ meta: p, prices: rest[i] }));

  return (
    <>
      <MetaRule index="04" app="Futarchy" items={["Conditional markets", `${featured.org} · ${featured.event || featured.question}`]} p={main} />
      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8 sm:pt-12">
        <PosterTitle>
          If it passes.<br />
          <span className="text-text-2">If it doesn&apos;t.</span>
        </PosterTitle>
        <Lede
          aside={
            <>
              <p className="font-medium">The market informs the DAO. The DAO decides.</p>
              <p className="mt-1 text-text-2">The gap is a forecast of the metric under each outcome, not proof the proposal causes it.</p>
            </>
          }
        >
          Two conditional markets price the same success metric in two possible futures. When the vote is decided, trades in the future that didn&apos;t happen are reverted.
        </Lede>

        <Featured meta={featured} prices={main} />

        <section aria-labelledby="all-h" className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-text/85 pb-3">
            <h2 id="all-h" className="text-[28px] font-medium tracking-[-0.03em] sm:text-[40px]">Every proposal in the registry</h2>
            <ProvenanceChip p={reg} />
          </div>
          <ul className="grid md:grid-cols-2 md:gap-x-10">
            {others.map(({ meta, prices }) => (
              <li key={meta.id} className="border-b border-text/15"><ProposalRow meta={meta} prices={prices} active={meta.id === featured.id} /></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function gapOf(p?: ProposalPrices | null) {
  if (!p?.pass || !p?.fail) return null;
  const g = (p.pass - p.fail) / p.fail;
  return Math.abs(g) > 0.5 ? null : g; // degenerate pools (e.g. 1e-39 prices) — don't pretend
}

function Featured({ meta, prices }: { meta: ProposalMeta; prices: Sourced<ProposalPrices | null> }) {
  const p = prices.data;
  const gap = gapOf(p);
  const thin = (p?.volumeUSD ?? 0) < 1000;
  const now = Date.now() / 1000;
  const open = !meta.closeTimestamp || meta.closeTimestamp > now;
  // Scale centred on the fail price. If the proposal states a decision band (e.g. ±1%), draw it.
  const band = /\b(\d+(?:\.\d+)?)%/.exec(meta.twapDescription ?? "")?.[1];
  const bandPct = band ? Number(band) / 100 : null;
  const base = p?.fail ?? 1;
  const half = Math.max(bandPct ? bandPct * 2 : 0.01, Math.abs(gap ?? 0) * 1.6);
  const dLo = base * (1 - half);
  const dHi = base * (1 + half);
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - dLo) / (dHi - dLo)) * 100));

  const closesLabel = open ? `vote closes ${fmtRelative(meta.closeTimestamp)}` : `closed ${fmtDate(meta.closeTimestamp)}`;

  return (
    <section aria-labelledby="feat-h" className="mt-16">
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-text/85 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          {meta.orgLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.orgLogo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-md bg-nested object-cover" />
          )}
          <div className="min-w-0">
            <p className="num text-[11px] uppercase tracking-[0.14em] text-text-2">{[meta.org, meta.chainId === 1 ? "Ethereum" : "Gnosis"].filter((v, i, a) => a.indexOf(v) === i).join(" · ")} · {closesLabel}</p>
            <h2 id="feat-h" className="mt-1 max-w-[30ch] text-[26px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[36px]">{meta.question} <span className="text-signal">{meta.event}</span></h2>
            {p?.marketName && <p className="mt-2 max-w-[80ch] text-[13px] text-text-2">{p.marketName}</p>}
          </div>
        </div>
        <ProvenanceChip p={prices} />
      </div>

      {!p || p.pass == null || p.fail == null ? (
        <div className="mt-6"><ErrorNote>No conditional prices for this proposal yet.</ErrorNote></div>
      ) : (
        <>
          <div className="mt-6">
            <FutarchyPoster history={p.passSeries} pass={p.pass} fail={p.fail} unit={p.currency} company={p.company} closesLabel={closesLabel} />
          </div>

          <div className="grid border-b border-text/85 md:grid-cols-3">
            <div className="py-5 md:pr-6">
              <p className="num text-[10.5px] uppercase tracking-[0.14em] text-text-2">The gap · pass vs. fail</p>
              <p className="num mt-2 text-[44px] leading-none tracking-[-0.04em]">{gap != null ? `${gap >= 0 ? "+" : ""}${(gap * 100).toFixed(3)}%` : "—"}</p>
              <p className="mt-2 text-[13px] text-text-2">Expected {p.company} price if it passes vs. if it fails: a forecast, not a measured effect.</p>
            </div>
            <div className="border-t border-text/15 py-5 md:border-l md:border-t-0 md:px-6">
              <p className="num text-[10.5px] uppercase tracking-[0.14em] text-text-2">{bandPct ? `The proposal's own rule · ±${band}% band` : "Shared scale"}</p>
              <div className="relative mt-6 h-16" role="img" aria-label={`Shared scale: pass ${p.pass.toFixed(2)}, fail ${p.fail.toFixed(2)} ${p.currency}`}>
                <div className="absolute inset-x-0 top-7 h-px bg-text/40" />
                {bandPct && (
                  <div className="stripes absolute top-3 h-9 bg-nested/60" style={{ left: `${+(pos(base * (1 - bandPct))).toFixed(3)}%`, width: `${+(pos(base * (1 + bandPct)) - pos(base * (1 - bandPct))).toFixed(3)}%` }} />
                )}
                <Marker x={pos(p.pass)} label="pass" cls="bg-primary" />
                <Marker x={pos(p.fail)} label="fail" cls="bg-text" dashed below />
                <span className="num absolute left-0 top-11 text-[10.5px] text-muted">−{(half * 100).toFixed(1)}%</span>
                <span className="num absolute right-0 top-11 text-[10.5px] text-muted">+{(half * 100).toFixed(1)}%</span>
              </div>
              {bandPct && gap != null && (
                <p className="mt-3 text-[13px] text-text-2">
                  {Math.abs(gap) <= bandPct ? (
                    <>Inside the band: the recommendation is currently <b className="font-medium text-signal">neutral</b>.</>
                  ) : (
                    <>Outside the band: the recommendation leans <b className="font-medium text-signal">{gap > 0 ? "towards passing" : "against passing"}</b>.</>
                  )}
                </p>
              )}
            </div>
            <div className="border-t border-text/15 py-5 md:border-l md:border-t-0 md:pl-6">
              <p className="num text-[10.5px] uppercase tracking-[0.14em] text-text-2">Chance it passes</p>
              <p className="num mt-2 text-[44px] leading-none tracking-[-0.04em]">{p.passProb != null ? `${(p.passProb * 100).toFixed(0)}%` : "—"}</p>
              {p.passProb != null && <div className="mt-3 h-1.5 bg-nested"><div className="h-full bg-primary" style={{ width: `${+(p.passProb * 100).toFixed(3)}%` }} /></div>}
              <p className="mt-2 text-[13px] text-text-2">{p.passProb != null ? "From the proposal's prediction pool." : "No usable prediction pool for this proposal."}</p>
            </div>
          </div>
          {thin && (
            <p className="mt-4 inline-flex items-center gap-2 bg-warn/10 px-3 py-1.5 text-[12.5px] text-warn">
              <span aria-hidden="true">▲</span> Thin market: {p.volumeUSD ? `${fmtUSD(p.volumeUSD)} traded` : "no recorded volume"} in the window shown. Small trades can move this gap.
            </p>
          )}
        </>
      )}

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <Panel title="Both futures over time" kicker={`Conditional ${p?.company ?? ""} price · hourly`}>
          {p && p.passSeries.length > 1 ? (
            <MarketChart
              unit="number"
              label="Pass and fail conditional prices over time"
              series={[
                { name: "If it passes", color: "var(--primary)", points: p.passSeries },
                { name: "If it fails", color: "var(--text)", points: p.failSeries, dashed: true },
              ]}
            />
          ) : (
            <p className="dots px-4 py-12 text-center text-[13px] text-text-2">Not enough candles yet.</p>
          )}
        </Panel>
        <Panel title="How this proposal resolves" kicker="Timeline">
          <Timeline meta={meta} />
        </Panel>
      </div>
      {meta.twapDescription && <p className="mt-4 max-w-[90ch] text-[12px] leading-relaxed text-text-2">{meta.twapDescription}</p>}
    </section>
  );
}

function Branch({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: "pass" | "fail" }) {
  return (
    <div className={`rounded-md p-4 ${tone === "pass" ? "bg-primary/12 ring-1 ring-primary/50" : "bg-nested ring-1 ring-line"}`}>
      <p className="flex items-center gap-2 text-[12.5px] text-text-2">
        <span className={`inline-block h-0.5 w-5 ${tone === "pass" ? "bg-primary" : "border-t-2 border-dashed border-text-2"}`} aria-hidden="true" />
        {label}
      </p>
      <p className="num mt-2 text-[28px] leading-none tracking-tight">
        {value.toLocaleString("en-US", { maximumFractionDigits: 2 })} <span className="text-[14px] text-text-2">{unit}</span>
      </p>
    </div>
  );
}

function Marker({ x, label, cls, dashed, below }: { x: number; label: string; cls: string; dashed?: boolean; below?: boolean }) {
  return (
    <div className={`absolute flex -translate-x-1/2 items-center ${below ? "top-3 flex-col-reverse" : "-top-3 flex-col"}`} style={{ left: `${+(x).toFixed(3)}%` }}>
      <span className="num text-[10.5px] text-text-2">{label}</span>
      <span className={`h-8 w-[3px] rounded-full ${cls} ${dashed ? "opacity-70" : ""}`} />
    </div>
  );
}

function Timeline({ meta }: { meta: ProposalMeta }) {
  const now = Date.now() / 1000;
  const twapEnd = meta.twapStart && meta.twapHours ? meta.twapStart + meta.twapHours * 3600 : undefined;
  const steps = [
    { k: "Proposal listed", d: fmtDate(meta.createdAt), t: meta.createdAt },
    { k: "Conditional trading", d: "pass & fail markets open", t: meta.createdAt + 1 },
    { k: "TWAP window", d: meta.twapStart ? `${fmtDate(meta.twapStart)} → ${fmtDate(twapEnd)}` : "time-weighted price is measured", t: meta.twapStart },
    { k: "DAO decides", d: meta.closeTimestamp ? `vote closes ${fmtDate(meta.closeTimestamp)}` : "governance vote", t: meta.closeTimestamp },
    { k: "Losing branch voided", d: "its trades revert; tokens redeem 1:1", t: meta.closeTimestamp ? meta.closeTimestamp + 1 : undefined },
  ];
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {steps.map((s) => {
        const done = s.t != null && s.t < now;
        return (
          <li key={s.k} className="relative">
            <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${done ? "bg-primary" : "bg-nested ring-1 ring-muted-line"}`} aria-hidden="true" />
            <p className={`text-[13px] ${done ? "text-text" : "text-text-2"}`}>{s.k}{done ? <span className="sr-only"> (done)</span> : null}</p>
            <p className="num text-[11.5px] text-muted">{s.d}</p>
          </li>
        );
      })}
    </ol>
  );
}

function ProposalRow({ meta, prices, active }: { meta: ProposalMeta; prices: Sourced<ProposalPrices | null>; active: boolean }) {
  const p = prices.data;
  const gap = gapOf(p);
  const g = gap == null ? 0 : Math.max(-1, Math.min(1, gap / 0.05)); // ±5% fills the gauge
  return (
    <Link
      href={`/futarchy?p=${meta.id}`}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`relative flex h-full items-center gap-3 py-4 pl-3 transition-colors ${active ? "bg-secondary/60" : "hover:bg-nested/70"}`}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
      {meta.orgLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.orgLogo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md bg-nested object-cover" loading="lazy" />
      ) : <span className="h-8 w-8 shrink-0 rounded-md bg-nested" />}
      <div className="min-w-0 flex-1">
        <p className="num text-[10.5px] uppercase tracking-[0.1em] text-muted">{meta.org} · {fmtDate(meta.createdAt)}</p>
        <p className="line-clamp-2 text-[13.5px] leading-snug">{meta.event ? <>{meta.event.replace(/^if /i, "If ")} <span className="text-text-2">— {meta.question.replace(/^What will (the )?/i, "").replace(/ be$/i, "")}</span></> : meta.question}</p>
      </div>
      <div className="w-24 shrink-0 text-right">
        {gap == null ? (
          <span className="text-[11.5px] text-muted">no prices</span>
        ) : (
          <>
            <span className={`num text-[13px] ${gap >= 0 ? "text-signal" : "text-text-2"}`}>{gap >= 0 ? "+" : ""}{(gap * 100).toFixed(2)}%</span>
            <span className="relative mt-1 block h-1.5 rounded-full bg-nested" aria-hidden="true">
              <span className="absolute left-1/2 top-[-2px] h-2.5 w-px bg-muted-line" />
              <span className={`absolute top-0 h-full rounded-full ${gap >= 0 ? "bg-primary" : "bg-text-2"}`} style={gap >= 0 ? { left: "50%", width: `${+(g * 50).toFixed(3)}%` } : { right: "50%", width: `${+(-g * 50).toFixed(3)}%` }} />
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
