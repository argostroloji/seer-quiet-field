"use client";

import { LineChart, type Series } from "./charts/line-chart";

/** Outcome-token price chart (¢). Thin client wrapper so server pages can pass plain data. */
export function MarketChart({ series, label, unit = "cents" }: { series: Series[]; label: string; unit?: "cents" | "number" }) {
  return (
    <LineChart
      series={series}
      label={label}
      yFormat={unit === "cents" ? (v) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}¢` : (v) => v.toLocaleString("en-US", { maximumFractionDigits: 2 })}
    />
  );
}
