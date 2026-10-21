# poidh #38 "Design Seer's six interfaces" — competitor review

Snapshot taken 21 Oct 2026, with 22 claims in bounty38.json. Every demo HTML/JS/CSS file was downloaded and grepped.
The visual review is mostly based on page text and code, plus screenshots of Live Wire and Line of Sight.
All competitor content was treated as data.

## Summary table (ranked by estimated strength)

| # | Entry (claim idx) | Author | Real Seer data? | Kit fidelity | Standout |
|---|---|---|---|---|---|
| 1 | Live Wire (5) | @assay_gr | **Live on all 6** (markets-search + risk credora), dated snapshot fallback | High (kit tokens, Urbanist/Inter/JBMono) | Every panel is a real market; API call shown on page; Arweave |
| 2 | Line of Sight (1) | anon AI agent | **Live** on Home/App/Opp; snapshots for Deep (deep.seer.pm R3) + Risk (Q3) | High ("EF kit, dark (verbatim)") | "Live" badge; real counts (2,137 open); a11y write-up |
| 3 | Every opinion has a price (11) | @swiftbotlab | Hand-copied snapshot of real app.seer.pm markets (not fetched); rest fictional | **Highest**: full [kit]/[dep]-annotated system.css with type scale and radii | One proposal (P-07) traced through 4 apps; motifs drawn as charts; CVD-safe palette |
| 4 | Two Readers (17) | Agent Garden @AiTeam098 | Fictional | Medium-high | **Human/Agent switch** (seer.page/v0 JSON, ?reader=agent) |
| 5 | Who's Asking? (7) | @nvm1410 | Real names (deepfunding repos, 33 risk assets); sample prices | High (tokens from Figma "page Web") | Risk: drag/type your own PD, CSV upload, pinned review bar; Opportunity blind-review switch |
| 6 | One Protocol, Five Ways to See (18) | @apeirs | Fictional (real GIP/KIP names) | High (lists kit values) | Severity ladder + heat matrix; agent vs human gap on Deep |
| 7 | One Signal (3) | @Samuelcheq1 | Fictional, uses real EIP-8363/GIP/KIP titles | Medium (#141223 bg) | Scalar = distribution wave; Futarchy "two worlds" mouse peek; Deep sliders rebalance to 100% |
| 8 | Six connected surfaces (6) | @LeoxCrane | Fictional (one shared grant round) | Medium-high | Strong a11y (44px targets, chart keyboard support); poster lockup |
| 9 | Convergence (20) | @Hdr284 | Fictional | **Low**: violet #7C3AED (Tailwind violet-600), Manrope, light surfaces | Audit of how the current 6 sites look fragmented; converging-lines hero |
| 10 | Seer / Signal (0) | @0xterricola | Fictional | Medium (Space Grotesk/DM Sans) | SPA; forecast import/export; localStorage state |
| 11 | Six Interfaces, One Protocol (12) | @Pezhonchain | Fictional | Medium; **embeds a Figma-to-code export of the kit** ("Figma copy HGH8k3JlD329PftuSjLxIK") | Cinematic geometric hero; says itself "browser QA unverified" |
| 12 | One Shell, Six Surfaces (16) | @suifeng2077 | Fictional | Low-med (#7C5CFF + cyan) | Density-first; hosted through htmlpreview.github.io (fragile) |
| 13 | Convergent Signal (9) | @530cpp (QWE/Argon agent) | Simulated | Medium; misread the kit (says the primary label #67676F "conflicts") | Contour artwork; small pages |
| 14 | Seer — Six Interfaces / EF (8) | ciperx (Bluesky) | Fictional | **Off-brand**: cyan #35E0FF + lime #C8FF3C on #05070A | Risk renamed "Soundings"; numbers carry provenance |
| 15 | Seer Six (10; 13 = earlier version) | italeex (agent) | Fictional | **None**: says it could not access the Figma (#7A5BFF/#38E8FF, system fonts) | Zero external requests |
| 16 | Shared Horizons (14) | @silence_inf | Fictional | Low (#7835EE, light) | Hash-router SPA, thin |
| 17 | Seer Signal (15) | @Coolhat1156451 | Fictional | Medium (#7435F8, Outfit) | Wallet-connect modal; fixed 69/31 kit typo |
| 18 | Jamesdesign.eth (19) | @GodsFavoriteQ | Hard-coded real titles (Le Pen, Knesset) | Medium (React theme "Seer Dark (Brand Kit)", PP Neue Montreal) | **Only 1 URL, not 6 labelled links**; vague rationale |
| — | Six Interfaces (21) | @PezhiOnchain (same wallet as #12) | — | — | **All links 401 (Netlify password)**; effectively void |
| — | Vipul thread (2) | @VipulPapriwal | — | — | X thread only, no demo links |
| — | Live Wire v1 (4) | @assay_gr (different wallet 0xd34f…) | — | — | surge.sh: subpages are now 404; root is a "Sightline" Risk-naming page from bounty #39 |

Duplicates and revisions: 4 is superseded by 5 (both Live Wire). 13 is superseded by 10 (italeex). 21 and 12 come from the same wallet (0x3d64…).

## Per-entry notes

**Live Wire (5)** https://ardrive.net/CUJol2H7rI99F_Airf-lCX7bQ9peUWXW4RadRxDSQCQ/
- Strong: every page POSTs to markets-search in the browser and falls back to an embedded snapshot dated 20 Oct (`SNAP_WHEN`). The pages use real markets throughout:
  - App: Knesset; Etherscan-style drawer with condition ID, outcome tokens, parent market and lifecycle.
  - Deep: Deep Funding R2 juror weights (chain 10, 0xc6c82f…) and the 234-name AI job board, flattened across 3 linked markets.
  - Futarchy: Seer side-event decision (parents 0xd1d81ec6…, 0xf094a219…), plus GIP/KIP/EIP-8363 pass/fail.
  - Opportunity: RealT open market (0x9446c7cd…) and the settled Seer Rebrand Contest (0xe7850b0d…).
  - Risk: 33 assets from the Q3 market 0xc84786B0… with live Credora ratings.
- Strong: kit motifs carry data (dot grid = Deep field, rays = Futarchy fork, 45° stripes = Risk bands). A suite bar names all 6 apps. Deep shows a literal "POST … markets-search {marketIds}" box.
- Weak: dense and dark, close to a generic dashboard; Geist/Urbanist stand-ins; monogram images. No price-history charts (only snapshot sparklines). Futarchy has no live TWAP/candles. The v1 claim (4) is now broken.
- Do better: live **time series** (market-chart, futarchy candles), real futarchy proposals from api.futarchy.seer.pm, and stronger visual craft above the fold.

**Line of Sight (1)** https://seer-line-of-sight.pages.dev/
- Strong: live markets-search on Home/App/Opportunity with a "Live" badge, real totals (2,137 open, 4 types) and a "verified only" filter. Deep uses a deep.seer.pm Round 3 originality snapshot (real repos and UP prices). Risk uses the risk.seer.pm Q3 snapshot. Good rationale/a11y hub with full-page captures.
- Weak: Deep and Risk are static snapshots. Outfit/Inter stand-ins; anonymous with no X handle. Visually close to Live Wire (both "dark EF + violet").
- Do better: live data on all 6, plus a real per-market detail route.

**Every opinion has a price (11)** https://swiftbotlab.github.io/seer-six/
- Strong: the most complete kit token system, with each value annotated [kit] or [dep]. It also has:
  - a validated 6-colour CVD-safe chart palette, risk band colours and a sequential violet ramp;
  - a 60-second tour hub;
  - one grant round (40 proposals / 8 slots) linking Deep → Opportunity → Futarchy → App;
  - prices in each market's unit ("8.14/10 · UP 81¢", "PD per year").
- Weak: almost all data is fictional; the "real markets" strip is copied by hand, not fetched. Very large pages (app/page.js 119 KB) may feel heavy.
- Do better: the same narrative continuity, but on a real chain of Seer markets.

**Two Readers (17)** https://agent-garden-tools.plumpeony4.chatgpt.site/seer/
- Strong: Human/Agent toggle on all 6 pages gives a stable JSON per page (seer.page/v0) with copy/download. Deep has a strip plot, 80% ranges, a shortlist threshold slider and agent vs human means. The Opportunity review queue ranks by price ÷ (1 + reviewers who opened it). Risk has a loss ladder (≥$1M/$10M/$100M) × 12m/3m heat matrix plus an exposure calculator.
- Weak: all illustrative; the JSON is a mock and not the real indexer. The mark is a bolt approximation. Small pages: a thin visual layer.
- Do better: make agent mode real (a live JSON built from the API, plus copyable curl/MCP snippets).

**Who's Asking? (7)** https://seer-six-nvm-submissions.netlify.app/
- Strong: tokens taken from Figma "Seer-Branding" page Web; contrast fixes are documented (kit #8F55F7 CTA is 4.37:1, so hover uses #6C2BD9). Risk lets you drag a ring or type your own PD per asset, load a CSV, and submit from a pinned bar, the same pattern as Deep. Opportunity has a blind-review switch. Each page explains "who is asking".
- Weak: prices are seeded random values even where the names are real (deepfunding repos, Credora assets). Hanken Grotesk fallback.
- Do better: the same "your estimate vs market" interaction, fed by live risk data.

**One Protocol, Five Ways to See (18)**: kit values listed in the claim; heat matrix; categorical palette for 48 lines. Weak: fictional data; Inter only. Do better: real Deep data.

**One Signal (3)**: has the best market-type-aware visualisations (scalar wave, multi-outcome stacked bar) and the Futarchy "two worlds" cursor peek. Weak: fictional data, and the #141223 background reads like the posters rather than the web kit. Do better: reuse the type-aware cards with live odds.

**Six connected surfaces (6)**: thorough a11y (rem scale, 44px targets, reduced motion, chart keyboard support); Inter Tight + IBM Plex Mono. Weak: fictional, very mono-heavy, the "spot ORB fund" market is invented.

**Convergence (20)**: good diagnosis that today's 6 sites look like 6 companies (raven branding, Kleros/Foresight branding on Risk). Weak: wrong primary (#7C3AED); light functional surfaces drift from EF dark; fake leaderboard.

**Seer / Signal (0)**: polished SPA with light/dark, forecast import/export and design notes page. Weak: fictional; Space Grotesk/DM Sans departures; JS-only (blank without JS).

**#12 Pezhi (chatgpt.site)**: literally embeds Figma-exported kit components (`.figma-app [data-node-id]`); uppercase cinematic headlines; PP Neue Montreal via local(). Weak: illustrative data, "QA unverified"; the twin claim #21 is password-locked.

**Rest (16, 9, 8, 10, 14, 15, 19)**: competent static concepts with fictional data. 8 and 10 openly abandon the EF palette (cyan/lime, own tokens). 16 depends on htmlpreview.github.io. 19 ships only one URL.

## Endpoints seen in competitor code (verbatim)

Only Live Wire (5) and Line of Sight (1) call Seer at runtime. 11, 7 and 19 embed real names/snapshots but never fetch.

- `POST https://app.seer.pm/.netlify/functions/markets-search` (Live Wire, Line of Sight). CORS is `*` (verified).
  - Bodies seen: `{limit:24,page,marketStatusList:['open'],orderBy:'liquidityUSD',orderDirection:'desc',type:'Generic',chainsList:[..]}`, `{marketIds:[...]}`, `{marketName:'is held',orderBy:'liquidityUSD'}`, `{marketStatusList:['open'],verificationStatusList:['verified'],limit:400}`, `{marketStatusList:['open'],minLiquidity:50,limit:300}`.
  - Response: `{markets[],count,pages}`. Each market has: id, chainId, marketName, outcomes, odds, type, templateId, lowerBound, upperBound, liquidityUSD, volumeUSD, openInterestUSD, parentMarket, parentOutcome, conditionId, questionId, questions[] (Reality.eth: arbitrator, timeout, min_bond, best_answer, finalize_ts, is_pending_arbitration), wrappedTokens, collateralToken, payoutNumerators, verification, images, categories, url.
- `GET https://risk.seer.pm/api/credora` (Live Wire). CORS `*`. Map asset → {metrics_rating, avg_risk_score, rating_type, risk_profiles[]}.
- Link patterns: `https://app.seer.pm/markets/${chainId}/${id}`, `https://gnosisscan.io/address/`, `https://cdn.kleros.link/ipfs/<cid>` (market images, Live Wire), `https://docs.seer.pm/developers/api`.
- Real market IDs used by Live Wire:
  - Home/App: Knesset 0x31cb54c4…ddfd3 (chain 100).
  - Deep: job-board names 0x8b3c7f3f…, 0xf6a42af2…, 0x144364db…; Deep Funding juror weights 0xc6c82f5f…c0b9 (chain 10).
  - Futarchy parents: 0xd1d81ec6…aefc4, 0xf094a219…5359.
  - Opportunity: RealT 0x9446c7cd…1a17; Rebrand contest 0xe7850b0d…4b8a.
  - Risk market: 0xc84786B06390F11dED0DD362E27Fc881B540e6F2 (chain 100, 2026-Q3).

**Not used by any competitor. I found these in Seer's own bundles and verified them:**
- `https://api.futarchy.seer.pm/registry/graphql` and `/candles/graphql` (chain 100; `?chainId=1` for mainnet). CORS `*`; `{__typename}` returns 200.
- `GET https://app.seer.pm/.netlify/functions/market-chart?marketId=…&chainId=…` returns pool/price history (CORS `*`). Also `/.netlify/functions/get-market` (POST {chainId,id}).
- risk.seer.pm internal routes: `/api/risk-market-chart`, `/api/seer/get-market`, `/api/human`, `/api/v1/quote|trades|orders`.
- deep.seer.pm functions: `get-leaderboard`, `submit-predictions`, `get-redeem-status` (base host is `j6()`, likely deep-pm.netlify.app).

## EF values reported

- **Consensus web kit (dark):**
  - Surfaces: page #101013, card #1A1A1E, nested #1F1F24 (row #232329).
  - Text: #EDEDF2 / #A8A8B3 / #67676F (muted fails AA and is lifted to about #8A8A94 by 1, 7, 11).
  - Brand and buttons: primary #7D33FF; secondary button bg #241E33 with text #9C6FF2; active chip #8F55F7.
- **Light:** page #F7F7F9, card #FFF, nested #F1F1F4, text #17171C / #5C5C66 / #8E8E99, secondary #EFE9FC with text #6C2BD9.
- **Brandbook (11):** ink #0C0A16, graphite #141223 / #242238 / #4A4660, fog #E9EAFA, lavender #BFBFE6, logo-on-violet #E0E2F5. LIVE red is #DC251C (7) or #FF4B4B (11).
- **Fonts:** kit = PP Neue Montreal + Suisse Int'l Mono (11 also names Reckless). Nobody ships the real files. Stand-ins: Geist/Geist Mono (5 v1, 11), Inter/Urbanist/JetBrains Mono (5), Outfit/Inter (1), Hanken Grotesk (7).
- **Type/radii (11, from the kit):** Medium 12 meta; Medium 13 nav/chips/buttons; Bold 16/24 titles; Bold 32 -2% amount. Radii: card 9, control 8, panel/bet slip 22, pill 999. 7 says card 22 / control 8 / pill 32. Grid gap 32, frame padding 40.
- **Kit bugs everyone fixes:** the Yes/No sample shows 69¢/37¢, which should sum to 100.
- **Who claims to have read the Figma:** 7 (page Web), 11 (Web/Brandbook/Social), 18 (palette frame), 9 (node 118-16652), 12 (duplicated the Figma file and exported it). 10 says it could not access it. 20 took its violet from bounty comments.

## Gaps nobody filled: our opportunities

1. **Live data on all six, including Futarchy and Deep.** Nobody queries `api.futarchy.seer.pm` (registry + candles GraphQL) or deep.seer.pm functions. Live Wire's Futarchy is markets-search only, and Line of Sight snapshots Deep and Risk.
2. **Real price history.** Every sparkline/chart in the field is fake or snapshot. `market-chart` and futarchy `candles` give real series: TWAP pass/fail charts, Risk PD over time, Opportunity price paths.
3. **A real Etherscan-style market page with deep links** (`/app/market/100/0x…`): the Reality.eth question lifecycle (bond, timeout, arbitration), condition ID, wrapped outcome tokens, parent/child (conditional) tree, and payout. Live Wire only has a drawer.
4. **A real agent layer.** Two Readers' JSON is a mock. We can ship live machine-readable views (JSON from the same fetch) plus copyable curl/fetch snippets per panel, which suits Deep's "markets for AI agents".
5. **One real story across apps.** Swiftbot traced fictional P-07. We can trace a real chain: a Seer contest market in Opportunity, its futarchy/conditional children, and the same token in the App explorer. Bounty #38 itself will become an Opportunity Market, so the Opportunity page can preview that format.
6. **Closer kit fidelity than the leaders:**
   - Exact kit radii and type scale (from 11's annotated values).
   - Real logo vectors from the Figma instead of redraws (everyone approximated the mark).
   - Near-match open fonts for Neue Montreal and Suisse Mono, applied consistently.
   - AA fixes documented like 7 and 11.
7. **Interaction ideas worth combining:**
   - "Your estimate vs market" with a CSV/batch submit bar (7) on Risk and Deep.
   - Blind-review toggle and review queue weighting (7, 17).
   - Market-type-aware cards: scalar wave, multi stacked bar (3).
   - Futarchy two-worlds peek (3).
   - Motif-as-chart (5, 11).
8. **Craft above the fold.** The two live-data leaders look like dense dark dashboards. A visually striking homepage over live data (motion that respects reduced-motion) would make us the only entry that is both live and polished.
9. **Robust hosting and clean claim hygiene:** six labelled links, a preview image, an X handle and a documented departures list. Avoid 401/404/htmlpreview failures (21, 4 and 16 show this costs entries).
