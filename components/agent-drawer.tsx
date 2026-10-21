"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SITE = "https://seer-quiet-field.vercel.app";

/** Map the page being read to its JSON twin (keeping the page's own query: filters, proposal, market). */
function endpointFor(path: string, search: string) {
  if (path === "/") return "/api/home";
  if (path === "/app") return `/api/markets${search}`;
  const m = path.match(/^\/app\/market\/(\d+)\/(0x[0-9a-fA-F]{40})/);
  if (m) return `/api/market/${m[1]}/${m[2]}`;
  if (path === "/deep") return "/api/deep";
  if (path === "/futarchy") return `/api/futarchy${search}`;
  if (path === "/opportunity") return `/api/opportunity${search}`;
  if (path === "/risk") return "/api/risk";
  return "/api";
}

/** Keep the preview readable: long arrays show their first items and a count. */
function trim(v: unknown, depth = 0): unknown {
  if (Array.isArray(v)) {
    const keep = depth === 0 ? 8 : 5;
    const head = v.slice(0, keep).map((x) => trim(x, depth + 1));
    return v.length > keep ? [...head, `… ${v.length - keep} more`] : head;
  }
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, trim(x, depth + 1)]));
  return v;
}

/** JSON with short primitive arrays kept on one line ([t, p] pairs read like a table). */
function pretty(v: unknown) {
  return JSON.stringify(v, null, 2).replace(/\[\s+([^\[\]{}]*?)\s+\]/g, (_, inner: string) => (inner.length < 90 ? `[${inner.replace(/\s+/g, " ")}]` : `[
${inner}
]`));
}

type Tab = "response" | "curl" | "js" | "python";

export function AgentButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onHash = () => setOpen(window.location.hash === "#agent");
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const toggle = (v: boolean) => {
    setOpen(v);
    try {
      history.replaceState(null, "", v ? "#agent" : window.location.pathname + window.location.search);
    } catch {}
  };
  return (
    <>
      <button
        type="button"
        onClick={() => toggle(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="num hidden h-9 items-center gap-1.5 rounded-full px-3 text-[12px] text-text-2 ring-1 ring-text/25 transition-colors hover:text-text hover:ring-text sm:inline-flex"
        title="Read this page as JSON"
      >
        <span aria-hidden="true" className="text-signal">{"{ }"}</span> Agent view
      </button>
      <button type="button" onClick={() => toggle(true)} className="num grid h-9 w-9 place-items-center rounded-full text-[12px] text-signal ring-1 ring-text/25 sm:hidden" aria-label="Agent view: read this page as JSON">
        {"{}"}
      </button>
      {/* portal: the sticky header uses backdrop-filter, which would trap a fixed child */}
      {open && typeof document !== "undefined" && createPortal(<AgentDrawer onClose={() => toggle(false)} />, document.body)}
    </>
  );
}

function AgentDrawer({ onClose }: { onClose: () => void }) {
  const path = usePathname() || "/";
  const [ep] = useState(() => endpointFor(path, typeof window === "undefined" ? "" : window.location.search));
  const [tab, setTab] = useState<Tab>("response");
  const [json, setJson] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const url = SITE + ep;

  useEffect(() => {
    closeRef.current?.focus();
    const t0 = performance.now();
    fetch(ep)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((j) => { setJson(j); setMs(Math.round(performance.now() - t0)); })
      .catch((e) => setErr(String(e.message || e)));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [ep, onClose]);

  const copy = useCallback((label: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1200); });
  }, []);

  const code: Record<Exclude<Tab, "response">, string> = {
    curl: `curl -s "${url}"`,
    js: `const res = await fetch("${url}");\nconst { purpose, provenance, data } = await res.json();\n// provenance.mode is "live" or "snapshot" — check it before acting.`,
    python: `import requests\nj = requests.get("${url}").json()\nprint(j["purpose"])\nprint(j["provenance"]["mode"], j["provenance"]["fetchedAt"])\ndata = j["data"]`,
  };
  const body = tab === "response" ? (err ? `// request failed: ${err}` : json ? pretty(trim(json)) : "// loading live JSON…") : code[tab];
  const prov = json?.provenance as { mode?: string; fetchedAt?: string } | undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="agent-h">
      <button type="button" aria-label="Close agent view" onClick={onClose} className="absolute inset-0 bg-[#101013]/40 backdrop-blur-[2px]" tabIndex={-1} />
      <aside data-theme="dark" className="rise absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-page text-text shadow-2xl sm:border-l sm:border-primary/50">
        <header className="border-b border-white/15 px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="num text-[11px] uppercase tracking-[0.14em] text-signal">Agent view · {(json?.schema as string) ?? "…"}</p>
              <h2 id="agent-h" className="mt-1 text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[30px]">This page, as data.</h2>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="num grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-white/25 hover:ring-white" aria-label="Close">
              ✕
            </button>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-text-2">
            {(json?.purpose as string) ?? "Every page of this site has a JSON twin with the same numbers, so agents never scrape and humans can audit what agents read."}
          </p>
        </header>

        <div className="border-b border-white/15 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-2 rounded-md bg-nested px-3 py-2">
            <span className="num rounded bg-up/15 px-1.5 py-0.5 text-[10.5px] text-up">GET</span>
            <code className="num min-w-0 flex-1 truncate text-[12.5px]">{url}</code>
            <button type="button" onClick={() => copy("url", url)} className="num shrink-0 text-[11.5px] text-text-2 hover:text-text">{copied === "url" ? "copied" : "copy"}</button>
          </div>
          <p className="num mt-2 flex flex-wrap gap-x-4 text-[11px] text-text-2">
            <span>{prov?.mode ? <span className={prov.mode === "live" ? "text-up" : "text-warn"}>● {prov.mode}</span> : "…"}</span>
            {prov?.fetchedAt && <span>fetched {prov.fetchedAt.slice(11, 16)} UTC</span>}
            {ms != null && <span>{ms} ms</span>}
            <span>CORS *</span>
            <span>read-only</span>
          </p>
        </div>

        <div role="tablist" aria-label="Format" className="flex gap-5 border-b border-white/15 px-5 sm:px-7">
          {(["response", "curl", "js", "python"] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`num relative h-10 text-[12px] uppercase tracking-[0.12em] ${tab === t ? "text-text" : "text-text-2 hover:text-text"}`}>
              {t === "js" ? "JavaScript" : t}
              {tab === t && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />}
            </button>
          ))}
          <button type="button" onClick={() => copy("body", tab === "response" && json ? JSON.stringify(json, null, 2) : body)} className="num ml-auto text-[11.5px] text-text-2 hover:text-text">
            {copied === "body" ? "copied" : tab === "response" ? "copy full JSON" : "copy"}
          </button>
        </div>

        <pre className="num min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px] leading-relaxed text-text-2 sm:px-7" tabIndex={0} aria-label="Response body">
          <code>{body}</code>
        </pre>

        <footer className="num flex flex-wrap gap-x-5 gap-y-1 border-t border-white/15 px-5 py-3 text-[11.5px] text-text-2 sm:px-7">
          <a className="hover:text-text" href="/api" target="_blank" rel="noreferrer">/api — all endpoints</a>
          <a className="hover:text-text" href="/llms.txt" target="_blank" rel="noreferrer">/llms.txt</a>
          <a className="hover:text-text" href={ep} target="_blank" rel="noreferrer">open raw ↗</a>
          <span className="ml-auto">Markets inform; people decide.</span>
        </footer>
      </aside>
    </div>
  );
}
