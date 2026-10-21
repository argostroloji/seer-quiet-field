# Quiet Field — Seer's six interfaces on the Electric Foundation kit

Entry for [poidh bounty #38](https://poidh.xyz/mainnet/bounty/38): homepage, Seer app (explorer), Deep, Futarchy,
Opportunity Markets and Risk Pricing, running on **live Seer data** with dated snapshot fallbacks.
Trading and wallets are simulated — no transactions, no signatures.

| Route | Answers |
|---|---|
| `/` | What is Seer, and how do the apps fit together? |
| `/app` · `/app/market/[chain]/[id]` | Find any market, see everything about it |
| `/deep` (+ `/api/deep` JSON) | Across a big field, where does the market point? |
| `/futarchy` | If it passes vs. if it doesn't — what does the market expect? |
| `/opportunity` | Which entries will the team pick? |
| `/risk` | How risky is each asset relative to the others? |
| `/about` | Rationale, EF-kit departures, data sources |

```bash
npm install
npm run dev            # http://localhost:3100
SEER_FORCE_SNAPSHOT=1 npm run dev   # every live call fails → snapshot fallbacks
```

- Design tokens: `app/globals.css` (values read from the Seer Branding Figma — see `research/ef-kit.md`)
- Data layer: `lib/seer/*` (endpoints documented in `research/seer-data.md`), snapshots in `public/snapshots/`
- QA helpers: `scripts/shot.mjs` (Playwright screenshots), `scripts/lh.mjs` (Lighthouse), `scripts/preview.mjs` (claim image)

Next.js 16 · React 19 · Tailwind 4 · hand-rolled SVG charts (d3-shape only).
