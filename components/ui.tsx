import { Ago } from "./ago";

export type Provenance = {
  source: string;          // human label, e.g. "app.seer.pm markets API"
  href?: string;           // where the data came from
  fetchedAt: string;       // ISO
  mode: "live" | "snapshot";
};

export function fmtAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

/** Every data panel carries one of these: where the numbers came from and how fresh they are. */
export function ProvenanceChip({ p, className = "", compact = false }: { p: Provenance; className?: string; compact?: boolean }) {
  const live = p.mode === "live";
  const when = new Date(p.fetchedAt);
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-nested/60 py-0.5 pl-1.5 pr-2.5 text-[11px] text-text-2 ${className}`}
      title={`${live ? "Live" : "Snapshot"} · ${p.source} · fetched ${when.toUTCString()}`}
    >
      <span
        className={`num rounded-full px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider ${
          live ? "bg-up/15 text-up" : "bg-warn/15 text-warn"
        } whitespace-nowrap`}
      >
        {live ? "● live" : "snapshot"}
      </span>
      {compact ? null : p.href ? (
        <a href={p.href} target="_blank" rel="noreferrer" className="truncate hover:text-text hover:underline">
          {p.source}
        </a>
      ) : (
        <span className="truncate">{p.source}</span>
      )}
      {compact && <span className="sr-only">{p.source}</span>}
      <span className="num shrink-0 text-muted">
        {live ? <Ago iso={p.fetchedAt} /> : <time dateTime={p.fetchedAt}>as of {p.fetchedAt.slice(0, 10)}</time>}
      </span>
    </span>
  );
}

export function Panel({
  title,
  kicker,
  provenance,
  actions,
  children,
  className = "",
  pad = true,
}: {
  title?: React.ReactNode;
  kicker?: React.ReactNode;
  provenance?: Provenance;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`min-w-0 border-t border-text/85 ${className}`}>
      {(title || provenance || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 pt-3">
          <div className="min-w-0">
            {kicker && <p className="num mb-2 text-[10.5px] uppercase tracking-[0.14em] text-text-2">{kicker}</p>}
            {title && <h2 className="text-[22px] font-medium leading-tight tracking-[-0.025em] sm:text-[26px]">{title}</h2>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {provenance && <ProvenanceChip p={provenance} />}
          </div>
        </header>
      )}
      <div className={pad ? "pt-5" : ""}>{children}</div>
    </section>
  );
}

export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`num text-[11px] uppercase tracking-[0.14em] text-muted ${className}`}>{children}</p>;
}

/* Chip is interactive only through onClick; usable from client components. */
export function Chip({
  children,
  active,
  onClick,
  className = "",
  ...rest
}: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 shrink-0 rounded-md px-3 text-[13px] transition-colors ${
        active ? "bg-primary text-on-primary" : "text-text-2 hover:bg-nested hover:text-text"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-up/12 text-up" },
  pending: { label: "Answer pending", cls: "bg-warn/12 text-warn" },
  disputed: { label: "Disputed", cls: "bg-down/12 text-down" },
  resolved: { label: "Resolved", cls: "bg-nested text-text-2" },
  closed: { label: "Trading closed", cls: "bg-nested text-text-2" },
};
export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-nested text-text-2" };
  return <span className={`num inline-flex h-5 items-center rounded px-1.5 text-[10.5px] uppercase tracking-wider ${s.cls}`}>{s.label}</span>;
}

export function DemoBadge({ children = "Demo — no transaction" }: { children?: React.ReactNode }) {
  return (
    <span className="stripes num inline-flex items-center rounded border border-dashed border-muted-line px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-text-2">
      {children}
    </span>
  );
}

export function shortAddr(a?: string, n = 4) {
  if (!a) return "—";
  return `${a.slice(0, 2 + n)}…${a.slice(-n)}`;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="stripes rounded-md border border-dashed border-warn/50 px-3 py-2 text-[12.5px] text-text-2">{children}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="dots grid min-h-32 place-items-center rounded-md px-6 py-10 text-center text-[13px] text-text-2">{children}</div>;
}

export { CopyAddr } from "./copy-addr";
