"use client";

import { useEffect, useState } from "react";

/** Human / Agent lens. The agent tab shows the exact JSON this page is built from, the public endpoint
 *  that serves it, and a copy-paste call — so agents never scrape and humans can audit what agents see. */
export function ViewTabs({ human, agent, id }: { human: React.ReactNode; agent: React.ReactNode; id: string }) {
  const [tab, setTab] = useState<"human" | "agent">("human");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#agent") setTab("agent");
  }, []);
  const set = (t: "human" | "agent") => {
    setTab(t);
    try { history.replaceState(null, "", t === "agent" ? "#agent" : window.location.pathname + window.location.search); } catch {}
  };
  return (
    <div>
      <div role="tablist" aria-label="Lens" className="inline-flex rounded-full bg-card p-1 ring-1 ring-line">
        {(["human", "agent"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            id={`${id}-${t}-tab`}
            aria-controls={`${id}-${t}`}
            aria-selected={tab === t}
            onClick={() => set(t)}
            className={`h-8 rounded-full px-4 text-[13px] ${tab === t ? "bg-primary text-on-primary" : "text-text-2 hover:text-text"}`}
          >
            {t === "human" ? "Human view" : "Agent view"}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-human`} aria-labelledby={`${id}-human-tab`} hidden={tab !== "human"} className="mt-6">{human}</div>
      <div role="tabpanel" id={`${id}-agent`} aria-labelledby={`${id}-agent-tab`} hidden={tab !== "agent"} className="mt-6">{agent}</div>
    </div>
  );
}

export function CodeBlock({ code, label, lang = "json" }: { code: string; label: string; lang?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="overflow-hidden rounded-[10px] bg-card ring-1 ring-line">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="num text-[11px] uppercase tracking-[0.12em] text-muted">{label} · {lang}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(code).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); })}
          className="h-7 rounded px-2 text-[12px] text-text-2 hover:bg-nested hover:text-text"
        >
          {done ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="num max-h-[440px] overflow-auto p-4 text-[12px] leading-relaxed text-text-2"><code>{code}</code></pre>
    </div>
  );
}
