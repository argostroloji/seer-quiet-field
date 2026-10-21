import { chromium } from "playwright";
import lighthouse from "lighthouse";
import fs from "node:fs";
const base = process.argv[2] || "http://localhost:3200";
const paths = process.argv.slice(3);
const mobile = process.env.LH_MOBILE === "1";
const b = await chromium.launch({ args: ["--remote-debugging-port=9223"] });
for (const p of paths) {
  const r = (await lighthouse(base + p, { port: 9223, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices"] }, mobile ? undefined : (await import("lighthouse/core/config/desktop-config.js")).default)).lhr;
  fs.writeFileSync(`qa/lh${p.replace(/[\/?=]/g, "_")}${mobile ? "-m" : ""}.json`, JSON.stringify(r));
  const s = Object.values(r.categories).map((c) => `${c.id.slice(0, 4)}:${Math.round(c.score * 100)}`).join("  ");
  const a11y = r.categories.accessibility.auditRefs.map((x) => r.audits[x.id]).filter((a) => a.score !== null && a.score < 1).map((a) => a.id);
  const perf = ["largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift"].map((k) => r.audits[k].displayValue).join(" / ");
  console.log(p.padEnd(14), s, " ", perf, a11y.length ? " a11y: " + a11y.join(",") : "");
}
await b.close();
