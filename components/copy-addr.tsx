"use client";

import { useState } from "react";

function shortAddr(a?: string, n = 4) {
  if (!a) return "—";
  return `${a.slice(0, 2 + n)}…${a.slice(-n)}`;
}

export function CopyAddr({ value, label, href, n = 4 }: { value: string; label?: string; href?: string; n?: number }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="num text-[12.5px] text-text hover:text-signal hover:underline" title={value}>
          {label ?? shortAddr(value, n)}
        </a>
      ) : (
        <span className="num text-[12.5px]" title={value}>{label ?? shortAddr(value, n)}</span>
      )}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          });
        }}
        className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-nested hover:text-text"
        aria-label={`Copy ${value}`}
      >
        {done ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>
        )}
      </button>
    </span>
  );
}

