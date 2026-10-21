// Builds public/preview.png (1600x1000): six live pages composited in EF style.
import { chromium } from "playwright";
import fs from "node:fs";
const base = process.argv[2] || "http://localhost:3200";
const name = process.argv[3] || "Quiet Field";
const pages = [
  ["/", "01 Seer"], ["/app", "02 Seer app"], ["/deep", "03 Deep"],
  ["/futarchy", "04 Futarchy"], ["/opportunity", "05 Opportunity Markets"], ["/risk", "06 Risk Pricing"],
];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
const p = await ctx.newPage();
const shots = [];
for (const [path] of pages) {
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.waitForTimeout(500);
  shots.push((await p.screenshot({ type: "jpeg", quality: 88 })).toString("base64"));
}
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Geist+Mono:wght@400&display=swap');
*{box-sizing:border-box;margin:0}body{width:1600px;height:1000px;background:#101013;color:#EDEDF2;font-family:'Instrument Sans',sans-serif;overflow:hidden;position:relative}
.lines{position:absolute;inset:0;opacity:.55}
.head{position:absolute;left:56px;top:48px;right:56px;display:flex;justify-content:space-between;align-items:flex-end}
h1{font-size:76px;font-weight:500;letter-spacing:-.035em;line-height:.95}
.k{font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8A8A94}
.sub{font-size:19px;color:#A8A8B3;margin-top:14px;max-width:640px;line-height:1.35}
.sub b{color:#9C6FF2;font-weight:500}
.grid{position:absolute;left:56px;right:56px;top:262px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:#1A1A1E;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #2A2A31}
.card img{display:block;width:100%;height:306px;object-fit:cover;object-position:top}
.cap{font-family:'Geist Mono',monospace;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:#A8A8B3;padding:10px 14px;display:flex;justify-content:space-between}
.cap span:last-child{color:#3ECF8E}
.mark{display:flex;align-items:center;gap:10px;font-size:26px;font-weight:600;letter-spacing:-.045em}
</style></head><body>
<svg class="lines" viewBox="0 0 1600 1000" preserveAspectRatio="none">${Array.from({ length: 34 }, (_, i) => `<line x1="-10" y1="${-400 + i * 50}" x2="1180" y2="150" stroke="#EDEDF2" stroke-opacity="${0.04 + (i % 7 === 3 ? 0.18 : 0.04)}" stroke-width="1"/>`).join("")}<line x1="1180" y1="150" x2="1620" y2="150" stroke="#7C33FF" stroke-width="2.5"/><circle cx="1180" cy="150" r="6" fill="#7C33FF"/><circle cx="1180" cy="150" r="90" fill="#7C33FF" opacity=".18" filter="blur(30px)"/></svg>
<div class="head"><div><p class="k">Seer · six interfaces · Electric Foundation</p><h1 style="margin-top:14px">${name}</h1><p class="sub">Six connected Seer apps, <b>live on Seer's own data</b> — one clear signal against a quiet, neutral field.</p></div>
<div class="mark"><svg width="30" height="30" viewBox="0 0 32 32"><path d="M11 3h17.5l-5.2 8H13.6l-3.9 6H1.5z" fill="#EDEDF2"/><path d="M21 29H3.5l5.2-8h9.7l3.9-6h8.2z" fill="#EDEDF2"/></svg>seer</div></div>
<div class="grid">${pages.map(([, label], i) => `<div class="card"><img src="data:image/jpeg;base64,${shots[i]}"/><div class="cap"><span>${label}</span><span>● live</span></div></div>`).join("")}</div>
</body></html>`;
const q = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await q.setContent(html, { waitUntil: "networkidle" });
await q.waitForTimeout(600);
await q.screenshot({ path: "public/preview.png" });
await b.close();
console.log("public/preview.png", (fs.statSync("public/preview.png").size / 1024).toFixed(0) + " KB");
