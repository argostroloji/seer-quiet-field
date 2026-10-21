"use client";

import { useEffect, useState } from "react";

function rel(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
const abs = (iso: string) => {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
};

/** Absolute UTC time on the server (cache-safe), relative time once hydrated; re-ticks every 30 s. */
export function Ago({ iso }: { iso: string }) {
  const [txt, setTxt] = useState(() => abs(iso));
  useEffect(() => {
    setTxt(rel(iso));
    const t = setInterval(() => setTxt(rel(iso)), 30000);
    return () => clearInterval(t);
  }, [iso]);
  return <time dateTime={iso} title={abs(iso)}>{txt}</time>;
}
