// Usage: node scripts/shot.mjs [baseUrl] path1 path2 ... [--mobile] [--light] [--full]
import { chromium } from "playwright";
const args = process.argv.slice(2);
const base = args[0]?.startsWith("http") ? args.shift() : "http://localhost:3100";
const mobile = args.includes("--mobile");
const light = args.includes("--light");
const full = args.includes("--full");
const paths = args.filter((a) => !a.startsWith("--"));
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  colorScheme: light ? "light" : "dark",
});
if (light) await ctx.addInitScript(() => localStorage.setItem("seer-theme", "light"));
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  const name = (p === "/" ? "home" : p.replace(/^\//, "").replace(/[\/?=&#]/g, "_")) + (mobile ? "-m" : "") + (light ? "-light" : "");
  await page.screenshot({ path: `qa/${name}.png`, fullPage: full });
  console.log("saved", `qa/${name}.png`);
}
if (errors.length) console.log("CONSOLE ERRORS:\n" + errors.join("\n"));
await browser.close();
