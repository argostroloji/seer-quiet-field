"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { APPS } from "@/lib/apps";
import { SeerMark } from "./mark";

function isActive(path: string, href: string) {
  if (href === "/") return path === "/" || path === "/about";
  return path === href || path.startsWith(href + "/");
}

export function EcosystemBar() {
  const path = usePathname() || "/";
  const navRef = useRef<HTMLUListElement>(null);
  // on phones the app list scrolls sideways: keep the current app in view
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.closest("li") as HTMLElement | null;
    const ul = navRef.current;
    if (el && ul && ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: el.offsetLeft - ul.clientWidth / 2 + el.offsetWidth / 2 });
  }, [path]);
  return (
    <header className="sticky top-0 z-40 border-b border-text/85 bg-page/90 backdrop-blur-md">
      <div className="mx-auto flex h-[52px] max-w-[1440px] items-stretch gap-4 px-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 pr-2" aria-label="Seer home">
          <SeerMark size={19} className="text-text" />
          <span className="text-[19px] font-semibold leading-none tracking-[-0.045em]">seer</span>
        </Link>

        <nav aria-label="Seer ecosystem" className="relative min-w-0 flex-1">
          <ul ref={navRef} className="scrollbar-none flex h-full items-stretch overflow-x-auto [mask-image:linear-gradient(90deg,#000_86%,transparent)] md:[mask-image:none]">
            {APPS.map((a, i) => {
              const active = isActive(path, a.href);
              return (
                <li key={a.key} className="relative shrink-0">
                  <Link
                    href={a.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex h-full items-center gap-1 px-3 text-[13.5px] transition-colors ${active ? "text-text" : "text-text-2 hover:text-text"}`}
                  >
                    <sup className={`num -mt-2 text-[9.5px] ${active ? "text-signal" : "text-muted"}`}>0{i + 1}</sup>
                    {a.short}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3 -bottom-px h-[3px] transition-transform duration-300 ${active ? "scale-x-100 bg-primary" : "scale-x-0 bg-text group-hover:scale-x-100"}`}
                      style={{ transformOrigin: "left" }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <ConnectDemo />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as "dark" | "light") || "light");
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem("seer-theme", next); } catch {}
        setTheme(next);
      }}
      className="grid h-9 w-9 place-items-center rounded-md text-text-2 hover:bg-nested hover:text-text"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
      )}
    </button>
  );
}

function ConnectDemo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="h-9 rounded-full border border-text px-3.5 text-[13px] font-medium text-text transition-colors hover:bg-text hover:text-page"
      >
        Connect<span className="hidden sm:inline"> wallet</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Demo wallet" className="rise absolute right-0 top-11 w-72 rounded-[10px] border border-line bg-card p-4 shadow-2xl">
          <p className="text-[13px] font-medium">Demo mode — no wallet needed</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2">
            This is a design prototype. Market data is live from Seer; trading is simulated and
            nothing here ever asks your wallet to sign.
          </p>
          <div className="mt-3 flex items-center justify-between rounded-md bg-nested px-3 py-2">
            <span className="num text-[12px] text-text-2">0xDEMO…5eer</span>
            <span className="num text-[12px]">1,000.00 sDAI</span>
          </div>
          <p className="mt-2 text-[11px] text-muted">Simulated balance for the trade tickets.</p>
        </div>
      )}
    </div>
  );
}
