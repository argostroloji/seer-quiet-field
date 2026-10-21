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
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
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
*{box-sizing:border-box;margin:0}body{width:1600px;height:1000px;background:#F7F7F9;color:#17171C;font-family:'Instrument Sans',sans-serif;overflow:hidden;position:relative}
.lines{position:absolute;inset:0}
.rule{position:absolute;left:48px;right:48px;top:30px;display:flex;justify-content:space-between;border-bottom:1.5px solid #17171C;padding-bottom:10px;font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.rule b{color:#6C2BD9;font-weight:400}
h1{position:absolute;left:44px;top:70px;font-size:150px;font-weight:500;letter-spacing:-.055em;line-height:.86}
.sub{position:absolute;left:48px;top:236px;font-size:20px;color:#5C5C66;max-width:720px;line-height:1.35}
.sub em{font-style:normal;color:#6C2BD9}
.grid{position:absolute;left:48px;right:48px;top:300px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:#fff;overflow:hidden;border:1.5px solid #17171C}
.card img{display:block;width:100%;height:300px;object-fit:cover;object-position:top;border-bottom:1.5px solid #17171C}
.cap{font-family:'Geist Mono',monospace;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;padding:9px 12px;display:flex;justify-content:space-between}
.cap b{color:#6C2BD9;font-weight:400}.cap span:last-child{color:#12875A}
</style></head><body>
<svg class="lines" viewBox="0 0 1600 1000">${Array.from({ length: 30 }, (_, i) => `<line x1="${1600 - i * 0}" y1="${-300 + i * 30}" x2="1180" y2="170" stroke="#17171C" stroke-opacity="${i === 9 ? 0 : 0.14}" stroke-width="1"/>`).join("")}<line x1="1600" y1="-30" x2="1180" y2="170" stroke="#7C33FF" stroke-width="3"/><circle cx="1180" cy="170" r="26" fill="#F7F7F9" stroke="#7C33FF" stroke-width="2"/><g transform="translate(1164 154)"><path d="M11 3h17.5l-5.2 8H13.6l-3.9 6H1.5z" fill="#17171C"/><path d="M21 29H3.5l5.2-8h9.7l3.9-6h8.2z" fill="#17171C"/></g><line x1="1180" y1="170" x2="980" y2="170" stroke="#7C33FF" stroke-width="3"/></svg>
<div class="rule"><span><b>Seer</b> — six interfaces · Electric Foundation</span><span>live on Seer data · <b>poidh #38</b></span></div>
<h1>${name}</h1>
<p class="sub">Seer's six apps as Swiss posters, every motif <em>drawn from live markets</em>: one clear signal against a quiet, neutral field.</p>
<div class="grid">${pages.map(([, label], i) => `<div class="card"><img src="data:image/jpeg;base64,${shots[i]}"/><div class="cap"><span><b>${label.slice(0, 2)}</b> ${label.slice(3)}</span><span>● live</span></div></div>`).join("")}</div>
</body></html>`;
const q = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await q.setContent(html, { waitUntil: "networkidle" });
await q.waitForTimeout(600);
await q.screenshot({ path: "public/preview.png" });
await b.close();
console.log("public/preview.png", (fs.statSync("public/preview.png").size / 1024).toFixed(0) + " KB");
