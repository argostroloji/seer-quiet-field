# poidh claim — bounty #38 (ready to paste)

**Title:** Quiet Field

**Image:** `public/preview.png` (1600×1000, ~600 KB)

**Description:**

X: @<HANDLE>

Quiet Field: six connected Seer interfaces built on the Electric Foundation kit and running on Seer's live data.

The Brandbook asks for "one clear signal against a quiet, neutral field," and we took that literally. Each page is a neutral field of real Seer data, with violet marking the one thing that page answers. One ecosystem bar and one set of market components carry across all six. Every number comes from Seer's public endpoints: markets-search, market-chart, the Seer indexer, Deep, the futarchy registry and candles, and risk.seer.pm. Every panel shows where its data came from and when it was fetched, and falls back to a dated snapshot if an endpoint fails. Deep, Futarchy and Opportunity state their principle in the UI: markets inform, people decide.

Highlights:
- Deep: all 98 Round 3 repos as a dot field, a review threshold, and a check of how the resolved L1 market compared with the jury's actual weights. Includes an agent view with a JSON endpoint.
- Futarchy: pass and fail on one shared scale against the proposal's own ±1% decision band, with live candles for both futures.
- Opportunity: three chained 80-outcome markets merged into one ranking that sums to 100%. Blind review, and your shortlist compared with the market's. In the rebrand contest the market ranked Electric Foundation #1 at 78% before the team chose it.
- Risk: 33 assets on one log scale with a compare view and an exposure estimate, labelled with its as-of date.
- Lighthouse 100/100/100 on all six pages.

Departures from the EF kit:
1. OFL stand-ins for PP Neue Montreal / Suisse Intl Mono (Instrument Sans, Geist Mono).
2. Muted text lifted to meet WCAG AA (#67676F to #8A8A94 in dark, #8E8E99 to #6B6B76 in light). The kit values are kept for strokes.
3. Added up/down/warning colours and a colour-blind-safe chart palette.
4. Two extra surface steps (hover and hairline) for dense tables.
5. Fixed the kit typo where Button Primary is labelled 67676F. We use #7C33FF.
6. Raw prices are shown in ¢, alongside normalised probabilities that sum to 100%.
7. New components in the kit's grammar: ecosystem bar, provenance chip, futarchy fork, blind review, field plot, risk scale, agent view.
8. The mark is redrawn from the Brandbook's 45° construction.

Demos (public, no login):
1. Seer homepage: <URL>/
2. Seer app: <URL>/app
3. Deep: <URL>/deep
4. Futarchy: <URL>/futarchy
5. Opportunity Markets: <URL>/opportunity
6. Risk Pricing: <URL>/risk

Rationale, departures and data sources: <URL>/about
Repo: <REPO>
Data is live from Seer's public endpoints. Trading and wallets are simulated: no transactions, no signatures.
