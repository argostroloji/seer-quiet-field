# poidh claim — bounty #38 (ready to paste)

**Title:** Quiet Field

**Image:** `public/preview.png` (1600×1000, ~600 KB)

**Description:**

X: @argostroloji

Quiet Field: Seer's six interfaces on the Electric Foundation kit, running on Seer's live data.

The Brandbook asks for "one clear signal against a quiet, neutral field." Each page is a neutral field of real Seer data, with violet marking the one thing that page answers. One ecosystem bar and one set of market components connect all six. Every number comes from Seer's public endpoints (markets-search, market-chart, the indexer, Deep, the futarchy registry and candles, risk.seer.pm). Each panel shows its source and fetch time, and falls back to a dated snapshot if an endpoint fails. Deep, Futarchy and Opportunity say it in the UI: markets inform, people decide.

Highlights:
- Deep: all 98 Round 3 repos as a dot field with a review threshold, plus a check of the resolved L1 market against the jury's actual weights. Agent view with a JSON API.
- Futarchy: pass and fail on one shared scale against the proposal's own ±1% decision band, with live candles.
- Opportunity: 3 chained 80-outcome markets merged into one ranking that sums to 100%. Blind review, and your shortlist vs. the market's. The market ranked Electric Foundation #1 at 78% before Seer chose it.
- Risk: 33 assets on one log scale, with compare and exposure views and an as-of date.
- Lighthouse 100/100/100 on all six pages.

Departures from the EF kit:
1. OFL stand-ins for PP Neue Montreal and Suisse Intl Mono.
2. Muted text lifted to AA (#67676F to #8A8A94).
3. Added up/down/warning colours and a colour-blind-safe chart palette.
4. Two extra surface steps for dense tables.
5. Fixed the kit's Button Primary label typo; we use #7C33FF.
6. Prices in ¢, alongside normalised probabilities that sum to 100%.
7. New components in the kit's grammar: provenance chip, futarchy fork, blind review, field plot, risk scale, agent view.
8. The mark is redrawn from the 45° construction.

1. Seer homepage: https://seer-quiet-field.vercel.app/
2. Seer app: https://seer-quiet-field.vercel.app/app
3. Deep: https://seer-quiet-field.vercel.app/deep
4. Futarchy: https://seer-quiet-field.vercel.app/futarchy
5. Opportunity Markets: https://seer-quiet-field.vercel.app/opportunity
6. Risk Pricing: https://seer-quiet-field.vercel.app/risk

Rationale and data sources: https://seer-quiet-field.vercel.app/about
Repo: https://github.com/argostroloji/seer-quiet-field
Data is live from Seer's public endpoints. Trading is simulated: no transactions, no signatures.
