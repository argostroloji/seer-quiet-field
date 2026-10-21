import type { Metadata } from "next";
import Link from "next/link";
import { getProposalPrices, getProposals, type ProposalMeta, type ProposalPrices } from "@/lib/seer/futarchy";
import { IDS } from "@/lib/seer/config";
import { fmtDate, fmtRelative, fmtUSD } from "@/lib/seer/normalize";
import { Kicker, Panel, ProvenanceChip, ErrorNote } from "@/components/ui";
import { MarketChart } from "@/components/market-chart";
import { ForkLines } from "@/components/motifs";
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
    <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <Kicker>04 · Futarchy</Kicker>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[48px]">If it passes vs. if it doesn&apos;t.</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-2">
            Two conditional markets price the same success metric in two possible futures. When the vote is decided, trades in the future that didn&apos;t happen are reverted.
          </p>
        </div>
        <ForkLines className="hidden h-auto w-full text-text lg:block" />
      </div>

      <Featured meta={featured} prices={main} />

      <section aria-labelledby="all-h" className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="all-h" className="text-[22px] font-medium tracking-[-0.02em]">Every proposal in the futarchy registry</h2>
          <ProvenanceChip p={reg} />
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {others.map(({ meta, prices }) => (
            <li key={meta.id}><ProposalRow meta={meta} prices={prices} active={meta.id === featured.id} /></li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 rounded-[10px] bg-card p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <p className="text-[28px] font-medium leading-[1.05] tracking-[-0.025em] sm:text-[40px]">
          The market informs the DAO.<br /><span className="text-signal">The DAO decides.</span>
        </p>
        <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-text-2">
          A gap between the two prices is a forecast of the metric under each outcome. It is not proof that the proposal causes the change; thin liquidity, news and the vote itself all move prices. Delegates weigh it with everything else.
        </p>
      </section>
    </div>
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

  return (
    <section aria-labelledby="feat-h" className="mt-8 space-y-4">
      <div className="rounded-[10px] bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {meta.orgLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.orgLogo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md bg-nested object-cover" />
            )}
            <div className="min-w-0">
              <p className="num text-[11px] uppercase tracking-[0.12em] text-muted">{[meta.org, meta.chainId === 1 ? "Ethereum" : "Gnosis"].filter((v, i, a) => a.indexOf(v) === i).join(" · ")} · {open ? `closes ${fmtRelative(meta.closeTimestamp)}` : `closed ${fmtDate(meta.closeTimestamp)}`}</p>
              <h2 id="feat-h" className="mt-1 text-[20px] font-medium leading-snug tracking-[-0.015em] sm:text-[24px]">{meta.question} <span className="text-signal">{meta.event}</span></h2>
              {p?.marketName && <p className="mt-1 text-[13px] text-text-2">{p.marketName}</p>}
            </div>
          </div>
          <ProvenanceChip p={prices} />
        </div>

        <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-md bg-nested px-3 py-2 text-[12.5px]">
          <span className="num text-[10.5px] uppercase tracking-[0.12em] text-muted">Success metric</span>
          <span className="text-text">{p ? `${p.company} price in ${p.currency}` : "Token price"}</span>
          {meta.twapHours && <span className="text-text-2">· {meta.twapHours} h TWAP decides the recommendation</span>}
        </div>

        {!p || p.pass == null || p.fail == null ? (
          <div className="mt-6"><ErrorNote>No conditional prices for this proposal yet.</ErrorNote></div>
        ) : (
          <>
            {/* Shared scale — both futures on one axis */}
            <div className="mt-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <Branch label="If it passes" value={p.pass} unit={p.currency} tone="pass" />
                <Branch label="If it fails" value={p.fail} unit={p.currency} tone="fail" />
              </div>
              <div className="relative mt-8 h-20" role="img" aria-label={`Shared scale: pass ${p.pass.toFixed(2)}, fail ${p.fail.toFixed(2)} ${p.currency}`}>
                <div className="absolute inset-x-0 top-7 h-px bg-line" />
                {bandPct && (
                  <div className="stripes absolute top-3 h-9 rounded-sm bg-nested/60" style={{ left: `${pos(base * (1 - bandPct))}%`, width: `${pos(base * (1 + bandPct)) - pos(base * (1 - bandPct))}%` }}>
                    <span className="num absolute left-1 top-[38px] whitespace-nowrap text-[10px] text-muted">neutral band ±{band}%</span>
                  </div>
                )}
                <Marker x={pos(p.pass)} label="pass" cls="bg-primary" />
                <Marker x={pos(p.fail)} label="fail" cls="bg-text-2" dashed below />
                <span className="num absolute left-0 top-12 text-[10.5px] text-muted">−{(half * 100).toFixed(1)}%</span>
                <span className="num absolute right-0 top-12 text-[10.5px] text-muted">+{(half * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="num text-[30px] leading-none tracking-tight">{gap != null ? `${gap >= 0 ? "+" : ""}${(gap * 100).toFixed(3)}%` : "—"}</p>
                <p className="text-[13px] text-text-2">expected {p.company} price if it passes vs. if it fails — <span className="text-text">a forecast, not a measured effect</span>.</p>
              </div>
              {bandPct && gap != null && (
                <p className="mt-3 text-[13px] text-text-2">
                  This proposal&apos;s own rule: {Math.abs(gap) <= bandPct ? (
                    <span className="text-text">the gap is inside the ±{band}% band, so the futarchy recommendation is currently <b className="font-medium text-signal">neutral</b>.</span>
                  ) : (
                    <span className="text-text">the gap is outside the ±{band}% band, so the recommendation currently leans <b className="font-medium text-signal">{gap > 0 ? "towards passing" : "against passing"}</b>.</span>
                  )}
                </p>
              )}
              {thin && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-warn/10 px-3 py-1.5 text-[12.5px] text-warn">
                  <span aria-hidden="true">▲</span> Thin market: {p.volumeUSD ? `${fmtUSD(p.volumeUSD)} traded` : "no recorded volume"} in the window shown. Small trades can move this gap.
                </p>
              )}
            </div>

            {p.passProb != null && (
              <div className="mt-6 max-w-md">
                <div className="flex justify-between text-[12.5px]"><span className="text-text-2">Chance it passes (prediction pool)</span><span className="num">{(p.passProb * 100).toFixed(0)}%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nested"><div className="h-full rounded-full bg-primary" style={{ width: `${p.passProb * 100}%` }} /></div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Both futures over time" kicker={`Conditional ${p?.company ?? ""} price · hourly`}>
          {p && p.passSeries.length > 1 ? (
            <MarketChart
              unit="number"
              label="Pass and fail conditional prices over time"
              series={[
                { name: "If it passes", color: "var(--primary)", points: p.passSeries },
                { name: "If it fails", color: "var(--text-2)", points: p.failSeries, dashed: true },
              ]}
            />
          ) : (
            <p className="dots rounded-md px-4 py-12 text-center text-[13px] text-text-2">Not enough candles yet.</p>
          )}
        </Panel>
        <Panel title="How this proposal resolves" kicker="Timeline">
          <Timeline meta={meta} />
        </Panel>
      </div>
      {meta.twapDescription && <p className="px-1 text-[12px] leading-relaxed text-muted">{meta.twapDescription}</p>}
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
    <div className={`absolute flex -translate-x-1/2 items-center ${below ? "top-3 flex-col-reverse" : "-top-3 flex-col"}`} style={{ left: `${x}%` }}>
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
      className={`flex h-full items-center gap-3 rounded-[10px] p-3.5 transition-colors ${active ? "bg-secondary ring-1 ring-primary/60" : "bg-card hover:bg-nested"}`}
    >
      {meta.orgLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.orgLogo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md bg-nested object-cover" loading="lazy" />
      ) : <span className="h-8 w-8 shrink-0 rounded-md bg-nested" />}
      <div className="min-w-0 flex-1">
        <p className="num text-[10.5px] uppercase tracking-[0.1em] text-muted">{meta.org} · {fmtDate(meta.createdAt)}</p>
        <p className="line-clamp-1 text-[13.5px]">{meta.question} <span className="text-text-2">{meta.event}</span></p>
      </div>
      <div className="w-24 shrink-0 text-right">
        {gap == null ? (
          <span className="text-[11.5px] text-muted">no prices</span>
        ) : (
          <>
            <span className={`num text-[13px] ${gap >= 0 ? "text-signal" : "text-text-2"}`}>{gap >= 0 ? "+" : ""}{(gap * 100).toFixed(2)}%</span>
            <span className="relative mt-1 block h-1.5 rounded-full bg-nested" aria-hidden="true">
              <span className="absolute left-1/2 top-[-2px] h-2.5 w-px bg-muted-line" />
              <span className={`absolute top-0 h-full rounded-full ${gap >= 0 ? "bg-primary" : "bg-text-2"}`} style={gap >= 0 ? { left: "50%", width: `${g * 50}%` } : { right: "50%", width: `${-g * 50}%` }} />
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
