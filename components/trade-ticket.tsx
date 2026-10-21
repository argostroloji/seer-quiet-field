"use client";

import { useMemo, useState } from "react";
import { DemoBadge } from "./ui";

export type TicketOutcome = { name: string; price: number | null }; // price in collateral units per share (0..1)

/** Kit-faithful trade ticket (Yes/No or N outcomes). Fully simulated: estimates use the current
 *  price only, no slippage model, and nothing is ever sent to a wallet. */
export function TradeTicket({
  outcomes,
  collateral = "sDAI",
  marketUrl,
  compact = false,
  title,
}: {
  outcomes: TicketOutcome[];
  collateral?: string;
  marketUrl?: string;
  compact?: boolean;
  title?: string;
}) {
  const tradable = outcomes.filter((o) => o.price != null && o.price > 0 && o.price < 1);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [sel, setSel] = useState(0);
  const [amount, setAmount] = useState("100");
  const [placed, setPlaced] = useState(false);
  const o = tradable[sel] ?? tradable[0];
  const amt = Math.max(0, Number(amount.replace(/,/g, "")) || 0);
  const est = useMemo(() => {
    if (!o?.price) return null;
    if (side === "buy") {
      const shares = amt / o.price;
      return { a: shares, aLabel: "Est. shares", b: shares, bLabel: "Payout if it resolves this way", c: shares - amt };
    }
    const proceeds = amt * o.price;
    return { a: proceeds, aLabel: `Est. ${collateral} received`, b: null, bLabel: "", c: null };
  }, [o, amt, side, collateral]);

  if (!tradable.length) {
    return (
      <div className="rounded-[10px] bg-card p-4 text-[13px] text-text-2">
        No live price to trade against right now (market closed or without liquidity).
      </div>
    );
  }

  const two = tradable.length === 2;
  return (
    <div className="rounded-[10px] bg-card p-4" aria-label="Trade ticket (simulated)">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium">{title ?? "Trade"}</p>
        <DemoBadge />
      </div>
      <div role="tablist" aria-label="Side" className="mb-3 grid grid-cols-2 gap-1 rounded-md bg-nested p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => { setSide(s); setPlaced(false); }}
            className={`h-8 rounded text-[13px] capitalize ${side === s ? "bg-card text-text shadow-sm" : "text-text-2 hover:text-text"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={two ? "grid grid-cols-2 gap-2" : "scrollbar-none flex max-h-52 flex-col gap-1.5 overflow-y-auto"}>
        {tradable.map((t, i) => {
          const active = i === sel;
          return (
            <button
              key={t.name + i}
              type="button"
              onClick={() => { setSel(i); setPlaced(false); }}
              aria-pressed={active}
              className={`flex h-11 items-center justify-between gap-2 rounded-md px-3 text-[13.5px] transition-colors ${
                active ? "bg-primary text-on-primary" : "bg-secondary text-secondary-text hover:brightness-110"
              }`}
            >
              <span className="truncate">{t.name}</span>
              <span className="num shrink-0 text-[12.5px]">{((t.price ?? 0) * 100).toFixed(1)}¢</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block text-[12px] text-text-2" htmlFor="ticket-amt">
        {side === "buy" ? `Amount (${collateral})` : "Shares to sell"}
      </label>
      <div className="mt-1.5 flex h-12 items-center rounded-md bg-nested px-3 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]">
        <span className="num text-text-2">{side === "buy" ? "$" : "#"}</span>
        <input
          id="ticket-amt"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value.replace(/[^\d.,]/g, "")); setPlaced(false); }}
          className="num w-full bg-transparent px-2 text-right text-[20px] outline-none"
        />
      </div>
      <div className="mt-2 flex gap-1.5">
        {[10, 100, 500].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(String(v))} className="num h-7 flex-1 rounded bg-nested text-[11.5px] text-text-2 hover:text-text">
            +{v}
          </button>
        ))}
      </div>

      {est && (
        <dl className={`mt-4 space-y-1.5 text-[12.5px] ${compact ? "" : "border-t border-line pt-3"}`}>
          <div className="flex justify-between"><dt className="text-text-2">{est.aLabel}</dt><dd className="num">{est.a.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd></div>
          {est.b != null && (
            <div className="flex justify-between"><dt className="text-text-2">{est.bLabel}</dt><dd className="num">{est.b.toLocaleString(undefined, { maximumFractionDigits: 2 })} {collateral}</dd></div>
          )}
          {est.c != null && (
            <div className="flex justify-between"><dt className="text-text-2">Potential return</dt><dd className="num text-up">+{est.c.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({amt ? ((est.c / amt) * 100).toFixed(0) : 0}%)</dd></div>
          )}
          <p className="pt-1 text-[11px] leading-snug text-muted">At the current price; real trades move the price (slippage) and pay pool fees.</p>
        </dl>
      )}

      <button
        type="button"
        onClick={() => setPlaced(true)}
        className="mt-4 h-11 w-full rounded-md bg-primary text-[14px] font-medium text-on-primary hover:bg-primary-hover"
      >
        {side === "buy" ? `Buy ${o?.name}` : `Sell ${o?.name}`} — demo
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-4 text-center text-[11.5px] text-text-2">
        {placed ? "Simulated only — no transaction was created or signed." : ""}
      </p>
      {marketUrl && (
        <a href={marketUrl} target="_blank" rel="noreferrer" className="mt-1 block text-center text-[12px] text-signal hover:underline">
          Trade for real on Seer ↗
        </a>
      )}
    </div>
  );
}
