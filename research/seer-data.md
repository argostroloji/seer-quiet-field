# Seer — public data sources for the six interfaces

Researched 2026-10-21. Every endpoint below was called with curl **without auth** and returned 200.
Raw samples: `public/snapshots/*.json` (index in `public/snapshots/_index.json`).
Fetch everything from a Next.js route handler (server side). Several endpoints send no CORS headers,
and the Deep functions are slow (5–11 s), so the server should cache them.

## 0. App URLs

| Interface | Live URL | Source repo (github.com/seer-pm/…) | Data backend |
|---|---|---|---|
| Homepage | https://seer.pm | `landing` (static HTML, no API) | links only |
| Seer app | https://app.seer.pm | `demo` (`web/` + `packages/seer-pm-sdk`) | Netlify functions `app.seer.pm/.netlify/functions/*` + Envio indexer |
| Deep | https://deep.seer.pm (alias deep-pm.netlify.app) | `ai-prediction-markets` | Netlify functions `deep.seer.pm/.netlify/functions/*` (Optimism) |
| Futarchy | https://futarchy.seer.pm (also futarchy.fi) | `futarchy`, `futarchy-api`, `futarchy-indexers` | `api.futarchy.seer.pm` (= `api.futarchy.fi`) + Goldsky subgraphs |
| Opportunity | https://opportunity.seer.pm | `opportunity-markets` | Seer `markets-search` with a hard-coded id list (`src/config/market.ts`) |
| Risk Pricing | https://risk.seer.pm | `risk-pricing-ui` | `risk.seer.pm/api/v1/risk-pricing*` (documented public API) |

Docs: https://docs.seer.pm. Other repos: `seer-indexer` (Envio schema), `api-gateway` (ERC-4337 write side, not needed for reads), `lens`, `circles-mini-app`.

## 1. Endpoint matrix

| # | Endpoint | Page(s) | Key fields | Chains | CORS | Freshness / limits |
|---|---|---|---|---|---|---|
| A | `POST app.seer.pm/.netlify/functions/markets-search` | App, Home, Opportunity, Deep, Futarchy | full `SerializedMarket[]` + `count`,`pages` | 100, 10, 8453, 1 (all by default) | `*` | live (subgraph + Supabase cache); ~0.7–1.5 s; `limit` max **1000** |
| B | `POST app.seer.pm/.netlify/functions/get-market` | App detail, all detail views | single `SerializedMarket` (no `images`) | any (`chainId` required) | `*` | live; 404 if unknown |
| C | `GET app.seer.pm/.netlify/functions/market-chart?marketId=&chainId=` | App detail chart | per-outcome array of pool hour snapshots | any | `*` | cached and refreshed in the background when over 5 min old; `&fresh=true` regenerates. **Large: 4.5 MB for 17 outcomes** |
| C2 | `GET app.seer.pm/.netlify/functions/markets-charts?ids=a,b` | batch charts | `{ [marketId]: chartData }` | any | **none** | Supabase cache; max 24 per page |
| D | `GET app.seer.pm/.netlify/functions/market-comments?market_id=&chain_id=` | App detail | `{data:[{id,author,body,parentId,createdAt}]}` | any | `*` | live |
| E | `POST https://indexer.hyperindex.xyz/798eb82/v1/graphql` (Envio/Hasura) | App stats, explorer | `Market`, `MarketsCount`, `Question`, `Condition`, `Token`, `Transfer`, `TokenBalance`, `chain_metadata` | 100, 10, 8453, 1 | echoes Origin | real time (a few blocks behind); **250 req / 60 s** (`x-ratelimit-*`) |
| F | `GET deep.seer.pm/.netlify/functions/get-*-markets-data` | Deep | `marketsData{repo→{id,price,pool}}`, parent/other market | 10 (Optimism, sUSDS collateral) | **none** | live, **5–11 s**, no cache headers |
| F2 | `GET deep.seer.pm/.netlify/functions/get-market-charts?ids=` | Deep charts | `{id:{series:[{points:[[ts,price]]}]}}` (clean) | 10 | none | background-built |
| F3 | `GET deep.seer.pm/.netlify/functions/get-leaderboard` | Deep/App leaderboard | `rows[{rank,address,pnl,volume,roi,marketCount}]` | 10 | none | `updatedAt` hourly-ish |
| G | `POST api.futarchy.seer.pm/registry/graphql` | Futarchy list | aggregator → organizations → proposals (+ JSON `metadata`) | 100 registry (covers chain 1 proposals too) | `*` | live |
| G2 | `POST api.futarchy.seer.pm/candles/graphql` (`?chainId=1` for mainnet) | Futarchy detail | `proposal{companyToken,currencyToken,outcomeTokens,pools{type,outcomeSide,price,candles}}` | 100, 1 | `*` | live |
| G3 | `GET api.futarchy.seer.pm/api/v2/proposals/{id}/chart?minTimestamp=` | Futarchy chart | `market{conditional_yes/no.price_usd, volume}`, `candles{yes,no,spot}` | **100 only in practice** | `*` | `X-Cache` headers, 10 s warmer |
| G4 | `GET api.futarchy.seer.pm/api/v1/market-events/proposals/{id}/prices` | Futarchy cards | yes/no price, volume | 100 only in practice | `*` | same |
| G5 | Goldsky direct: `https://api.goldsky.com/api/public/project_cmair7jgkzena01x58241cqow/subgraphs/{futarchy-registry-gnosis,futarchy-candles-gnosis,futarchy-candles-mainnet}/1.0.0/gn` | fallback for G/G2 | same schemas | 100 / 1 | `*` | real time (`_meta.block`) |
| H | `GET risk.seer.pm/api/v1/risk-pricing[?market=]` | Risk | `assets[{name,symbol,price,pdQuarterly,pdYearly}]`, `noToAll` | 100 | `*` | 5 min cache, hourly pool data |
| H2 | `GET risk.seer.pm/api/v1/risk-pricing/markets` | Risk | `markets[{id,quarter,startTime,endTime,current}]` | 100 | `*` | |
| H3 | `GET risk.seer.pm/api/v1/risk-pricing/history[?market=]` | Risk chart | `times[]` + per-asset `pdQuarterly[]`,`pdYearly[]` on a 4 h grid | 100 | `*` | 225 KB |

## 2. Exact requests

```bash
# A. Market list/search (all filters optional)
curl -X POST https://app.seer.pm/.netlify/functions/markets-search -H 'Content-Type: application/json' -d '{
  "chainsList": ["100","10","8453","1"],        // strings; [] = all
  "type": "Generic",                             // "Generic" | "Futarchy" | ""
  "marketName": "election",                      // text search
  "marketStatusList": ["open"],                  // not_open|open|answer_not_final|in_dispute|pending_execution|closed
  "verificationStatusList": ["verified"],        // verified|verifying|challenged|not_verified
  "categoryList": ["elections"],                 // misc|weather|elections|sports|science|...
  "minLiquidity": 100,
  "showConditionalMarkets": true,
  "parentMarket": "0x…",                         // children of a market
  "marketIds": ["0x…"],                          // exact ids
  "creator": "0x…", "participant": "0x…",
  "orderBy": "liquidityUSD",                     // openingTs|outcomesSupply|liquidityUSD|volumeUSD|creationDate|oddsRunTimestamp
  "orderDirection": "desc",
  "limit": 40, "page": 1 }'
# → { markets: SerializedMarket[], count: 2947, pages: N }

# B. Single market (id or slug)
curl -X POST https://app.seer.pm/.netlify/functions/get-market -H 'Content-Type: application/json' \
  -d '{"chainId":100,"id":"0xe7850b0d928aa40ab8732BD323Fa4F6Ef3c24B8a"}'
curl -X POST https://app.seer.pm/.netlify/functions/get-market -H 'Content-Type: application/json' \
  -d '{"chainId":100,"url":"which-of-the-following-submissions-will-win-the-seer-rebrand-contest"}'

# C. Price history
curl 'https://app.seer.pm/.netlify/functions/market-chart?marketId=0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a&chainId=100'

# E. Envio indexer (GraphQL, Hasura syntax: where/_eq, order_by, limit)
curl -X POST https://indexer.hyperindex.xyz/798eb82/v1/graphql -H 'Content-Type: application/json' -d \
 '{"query":"{ MarketsCount { id count } Market(where:{marketType:{_eq:Futarchy}}, order_by:{blockTimestamp:desc}, limit:10){ id chainId marketName outcomes wrappedTokens conditionId questionId parentMarket_id payoutReported finalizeTs creator } chain_metadata { chain_id latest_processed_block } }"}'

# F. Deep
curl https://deep.seer.pm/.netlify/functions/get-originality-r3-v3-markets-data   # live round
curl https://deep.seer.pm/.netlify/functions/get-l1-markets-data                  # Deep Funding L1 (68 repos)
curl https://deep.seer.pm/.netlify/functions/get-markets-data                     # 46-repo juror-weight market
curl 'https://deep.seer.pm/.netlify/functions/get-market-charts?ids=0x5D6A571b0f663C33831E6f81DD3C3f554eca188B'
curl https://deep.seer.pm/.netlify/functions/get-leaderboard
# others: get-l2-markets-data (3.2 MB), get-octant-markets-data, get-originality-markets-data,
#         get-zcash-markets-data, get-zcash-nu7-markets-data, get-prediction-scores, get-profiles?addresses=

# G. Futarchy
curl -X POST https://api.futarchy.seer.pm/registry/graphql -H 'Content-Type: application/json' -d \
 '{"query":"{ aggregator(id:\"0xc5eb43d53e2fe5fdde5faf400cc4167e5b5d4fc1\"){ organizations(first:50){ id name metadata proposals(first:50,orderBy:createdAtTimestamp,orderDirection:desc){ proposalAddress title displayNameQuestion displayNameEvent createdAtTimestamp metadata } } } }"}'
curl -X POST 'https://api.futarchy.seer.pm/candles/graphql?chainId=1' -H 'Content-Type: application/json' -d \
 '{"query":"{ proposal(id:\"0x0d78b95fca9f3e1b588271a330b0d6f731ec38aa\"){ marketName companyToken{symbol} currencyToken{symbol} pools{ id name type outcomeSide price candles(first:48,orderBy:periodStartUnix,orderDirection:desc,where:{period:3600}){ periodStartUnix close volumeUSD } } } }"}'
curl 'https://api.futarchy.seer.pm/api/v2/proposals/0x4120de9931fd29c8a6effea4df57a7c8760c1677/chart?minTimestamp=1790000000'
curl  https://api.futarchy.seer.pm/api/v1/market-events/proposals/0x4120de9931fd29c8a6effea4df57a7c8760c1677/prices

# H. Risk
curl https://risk.seer.pm/api/v1/risk-pricing
curl https://risk.seer.pm/api/v1/risk-pricing/markets
curl 'https://risk.seer.pm/api/v1/risk-pricing/history?market=0xc84786B06390F11dED0DD362E27Fc881B540e6F2'
```

## 3. Real markets per page

### Seer app / homepage
- Top open by liquidity (2026-10-21): Israeli election `0x31cb54c4…ddfd3` (chain 100, $27.7k liq), French presidential `0xbbf8f7e4…c32e`, Brazil 2026 `0x95149fcc…a355`.
- Homepage hero links (from seer.pm): `100/0x43d881f5…a6d9` (US 2024, $574k vol, resolved Trump), `0x528c5535…67cc`, `0x8df5b3a6…7ea5`, `0xe12f48ec…888b`.
- Aggregate stats (`seer-aggregate-stats.json`, derived from all 2,947 markets in `markets-search`): about $4.32M `volumeUSD` ($21.6M notional), $249k current liquidity, 599 resolved, 266 verified. Envio `MarketsCount`: Gnosis 2,593 · Optimism 731 · Base 157 · Ethereum 14. **There's no single "stats" endpoint, so compute and cache totals server-side.**

### Deep (Optimism, chain 10, sUSDS collateral)
- **Live:** Deep Funding *Round 3 Originality*, parent `0x37ab5cbeee3a32289430e5d38b914ec7f580fd87` (Bundle A/B/C). It has three middle markets (`0xc217920a…` A, 33 repos; `0xf0638b89…` B; `0x99a94113…` C) and 98 per-repo scalar markets with `upPrice`/`downPrice`. Source: `get-originality-r3-v3-markets-data`.
- **Many-outcome showcase (closed):** L1 juror weights `0x3220a208aaf4d2ceecde5a2e21ec0c9145f40ba6` (68 repos + "other" market `0xfea47428…` with 33 more). AI-agent juror-weight market `0xb88275fe4e2494e04cea8fb5e9d913aa48add581` (46 repos, $30.9k vol). Octant `0xe85ada7c…6ece` (26 projects). Largest Seer market has 100 outcomes.

### Futarchy
- **Live (closes 2026-10-24):** Ethereum org, *EIP-8363 Tapered Issuance Burn*, proposal `0x0d78b95fca9f3e1b588271a330b0d6f731ec38aa`, **chain 1**. CONDITIONAL pools YES_WETH/YES_USDS ≈ 2447.66 vs NO ≈ 2447.59, plus PREDICTION pools (YES ≈ 0.30 / NO ≈ 0.70 USDS) and EXPECTED_VALUE pools. Use G2 with `?chainId=1`. G3/G4 return zeros for it.
- **Resolved (Gnosis DAO, chain 100):** GIP-153 `0x4120de9931fd29c8a6effea4df57a7c8760c1677`: YES GNO 91.24 vs NO 90.34 sDAI, passed (`payoutNumerators [1,0]`), full chart via G3. Also GIP-152 `0xee8878d0…badef`, GIP-151 `0xece80208…dcf0`.
- **Kleros DAO:** KIP-90 `0x84412fe9…ab1cf`, KIP-88 `0x0cae5e6f…2e31`, KIP-81 `0x2c1e0867…481a`.
- Orgs in the registry: Gnosis DAO, Kleros DAO, Ethereum, Aave DAO (chain 1), CoW DAO, VeloraDAO. Each org's `metadata` JSON has logo, cover, colors and chain.

### Opportunity (chain 100; ids from `opportunity-markets/src/config/market.ts`)
- **Seer Rebrand Contest** `0xe7850b0d928aa40ab8732BD323Fa4F6Ef3c24B8a`: 16 entries + Invalid, $7.2k vol, **resolved: Electric Foundation** (`payoutNumerators[0]=1`). `odds` is `null` after resolution, so take final prices from `market-chart`.
- **Live:** *AI Job Board Name*, a chained 3-level market of 80 outcomes each, where "Other" (index 78) feeds the next level: `0x8b3C7f3f09f6A85353926D8ee0f12decc1C9A5e8` → `0xf6A42aF200C181Df45e0f3Fd49D58F5D57bb7D35` → `0x144364dB8EDD6225248fE9d02f77ECc3ec0E4C4c`. About $2.4k liquidity, $8.3k vol.
- Devcon Mumbai merch `0xc2b8E25675db9977AD14BcA62b655E4aa6B36683` (18 outcomes, resolved).
- Bounty #38 ("Design Seer's six interfaces") market doesn't exist yet. It'll be created after submissions close on 2026-10-23.
- Submission images come from the IPFS manifest in that repo (`submissions/ipfs-manifest.json`) and the `images` field in `markets-search`.

### Risk Pricing (chain 100, sDAI)
- Market `0xc84786B06390F11dED0DD362E27Fc881B540e6F2`, quarter **2026-Q3** (ended 2026-09-30). It covers 33 assets (LSTs: weETH, stETH, rETH…; stables: USDC, USDT, USDS, USDF, avUSD…; BTC wrappers; RWAs: BUIDL-I, JAAA, JTRSY…) plus "no default" (`noToAll`, index 33, yearly P ≈ 0.465). Highest yearly PD: USDF 15.8%, avETH 12.6%, avUSD 9.7%.

## 4. Draft normalized TypeScript types

```ts
export type ChainId = 1 | 10 | 100 | 8453;
export type MarketStatus = "not_open" | "open" | "answer_not_final" | "in_dispute" | "pending_execution" | "closed";

/** Raw shape from markets-search / get-market (SerializedMarket). BigInts arrive as strings. */
export interface SeerMarketRaw {
  id: `0x${string}`; chainId: ChainId; type: "Generic" | "Futarchy";
  marketName: string; outcomes: string[]; templateId: string;     // Reality template: 1 = scalar (uint), 2 = categorical (single-select), 3 = multi-categorical
  lowerBound: string; upperBound: string;                           // scalar bounds
  wrappedTokens: `0x${string}`[]; collateralToken: string; collateralToken1: string; collateralToken2: string;
  conditionId: string; questionId: string; parentCollectionId: string; parentOutcome: string;
  parentMarket: { id: string; conditionId: string; payoutReported: boolean; payoutNumerators: string[] };
  questions: { id: string; opening_ts: number; finalize_ts: number; timeout: number; bond: string; min_bond: string;
               best_answer: string; arbitrator: string; is_pending_arbitration: boolean; base_question: string }[];
  openingTs: number; finalizeTs: number; hasAnswers: boolean; questionsInArbitration: string;
  payoutReported: boolean; payoutNumerators: string[]; outcomesSupply: string;
  creator: string; factory: string; transactionHash: string; blockTimestamp: number; encodedQuestions: string[];
  verification?: { status: "verified" | "verifying" | "challenged" | "not_verified"; itemID?: string; deadline?: number };
  liquidityUSD: number; volumeUSD: number; volumeNotionalUSD: number; openInterestUSD: number;
  incentive: number; hasLiquidity: boolean; maxLiquidity: number;
  odds: (number | null)[];                       // percent 0-100, aligned with outcomes; null = no pool/resolved
  poolBalance: ({ token0: { symbol: string; balance: number }; token1: { symbol: string; balance: number } } | null)[];
  categories: string[]; url: string;             // slug
  images?: { market: string; outcomes: string[] }; // only in markets-search
}

export interface Outcome { index: number; name: string; token: string; probability: number | null; image?: string; isInvalid: boolean; won?: boolean }
export interface Market {
  key: `${ChainId}:${string}`; id: string; chainId: ChainId; slug: string;
  kind: "categorical" | "scalar" | "multi-scalar" | "futarchy" | "conditional";
  title: string; outcomes: Outcome[]; status: MarketStatus;
  collateral: string; liquidityUSD: number; volumeUSD: number;
  conditionId: string; questionId: string; parentMarketId: string | null; creator: string;
  realityQuestionIds: string[]; openingTs: number; finalizeTs: number | null; // null when 33260976000 sentinel
  verified: boolean; categories: string[]; appUrl: string;   // https://app.seer.pm/markets/{chainId}/{id}
}
export interface PricePoint { t: number; p: number }          // unix s, collateral price 0..1
export type MarketChart = Record<number /*outcome idx*/, PricePoint[]>;

export interface DeepRepoMarket { repo: string; marketId: string; token?: string; price: number; upPrice?: number; downPrice?: number; status?: MarketStatus }
export interface DeepRound { id: string; parentMarketId: string; chainId: 10; repos: DeepRepoMarket[]; status: MarketStatus }

export interface FutarchyProposal {
  id: string; chainId: 1 | 100; org: { id: string; name: string; logo?: string };
  title: string; question?: string; event?: string; createdAt: number; closeTimestamp?: number;
  snapshotId?: string; twapHours?: number; twapDescription?: string; archived: boolean;
  companyToken: string; currencyToken: string;
  pass: { price: number; poolId: string; volume?: number };   // CONDITIONAL YES pool
  fail: { price: number; poolId: string; volume?: number };   // CONDITIONAL NO pool
  passProbability?: number;                                  // PREDICTION YES pool price
  candles?: { yes: PricePoint[]; no: PricePoint[]; spot: PricePoint[] };
  seerMarketId?: string;                                     // chain 100 only (Seer Futarchy factory)
}

export interface RiskAsset { index: number; name: string; symbol: string; outcomeToken: string; price: number; pdQuarterly: number; pdYearly: number }
export interface RiskSnapshot { marketId: string; chainId: 100; quarter?: string; updatedAt: number; assets: RiskAsset[];
  noToAll: { index: number; outcomeToken: string; price: number; probability: number }; solverMaxErr: number }
export interface RiskHistory { marketId: string; quarter: string; intervalSeconds: number; times: number[];
  assets: { index: number; name: string; symbol: string; pdQuarterly: number[]; pdYearly: number[] }[];
  noToAll: { index: number; probability: number[] } }

export interface SeerStats { markets: number; byChain: Record<ChainId, number>; volumeUSD: number; liquidityUSD: number; resolved: number; updatedAt: number }
```

## 5. Gotchas

1. **CORS:** these send no CORS headers: `markets-charts` and all `deep.seer.pm` functions. Envio echoes the Origin header. Everything else sends `*`. Proxy everything through Next.js anyway, so you get caching and rate-limit protection.
2. **Envio rate limit:** 250 requests per 60 s per IP. Batch queries and cache them (stats every 5–10 min).
3. **markets-search pagination:** `limit` is capped at 1,000. Without an `orderBy`, pages overlap: pages 1–3 returned 16 duplicates. Always send `orderBy` + `orderDirection`.
4. **Junk/test markets:** 327 of the "open" Futarchy markets are tests ("test-25", "MarketName"). Filter with `verificationStatusList:["verified"]` or `minLiquidity`, or curate ids.
5. **`finalizeTs = 33260976000`** (year 3024) is the "not answered yet" sentinel. Treat it as null.
6. **`odds`** are percentages, can be `null` (no liquidity, or resolved), and don't sum to 100 for scalar/multi-scalar markets. For resolved markets, derive the winner from `payoutNumerators`.
7. **Outcome naming:** the last outcome is usually "Invalid result" / "Invalid". Hide it or demote it.
8. **market-chart is heavy:** about 4.5 MB for 17 outcomes, and each point repeats the pool object. Downsample server-side. Price = `token1Price` when the outcome token is `token0` (collateral is token1), otherwise `token0Price`. Compare `pool.token0.id` with `wrappedTokens[i]`. Some points have no `liquidity`.
9. **Market ids:** Envio ids are `"{chainId}:{address}"`, while the Netlify API uses a plain address plus `chainId`. The Netlify API accepts mixed-case addresses. `chainsList` takes **strings**.
10. **Deep functions are slow (5–11 s)** and `get-l2-markets-data` is 3.2 MB. Cache them for ≥5 min. Deep R3 repo markets are scalar UP/DOWN pairs, and the per-repo token is an even share of an even share (`collateralUnitPrice = 1/98`). Seer's `liquidityUSD` shows 0 for Optimism Uniswap pools, so use Deep's own prices.
11. **Futarchy REST (`/api/v2/.../chart`, `/prices`) only resolves Gnosis proposals.** For chain-1 proposals it returns `price_usd: 0` with an empty pool. Use `candles/graphql?chainId=1` for those. Pool `type` values: `CONDITIONAL` (pass/fail price), `PREDICTION` (probability), `EXPECTED_VALUE`. Some pools have degenerate prices (~1e-39), so ignore pools with a price < 1e-12. `timeline.start/end` in the REST response is synthetic (a 5-day window around the request time), not the proposal's real window. Use the registry `metadata.closeTimestamp`/`twapStartTimestamp`.
12. **Futarchy registry metadata** is free-form JSON. `chain` may be a number or a string, some proposals carry `"archived":true`, and two Kleros orgs exist ("Kleros DAO" / "Kleros Dao"). Filter on the aggregator `0xc5eb43d53e2fe5fdde5faf400cc4167e5b5d4fc1`.
13. **Risk data is stale:** the only market is 2026-Q3 (ended 2026-09-30) and `updatedAt` = 2026-08-20. There's no Q4 market yet. Show "as of" and the quarter in the UI. The API returns 502 `{error}` when upstream fails.
14. **Spot candles** (`/api/v1/spot-candles?ticker=`) returned empty for the tested ticker, so don't rely on them.
15. `get-market` omits `images`. Get images from `markets-search` with `marketIds:[id]`. Images come from `cdn.kleros.link/ipfs/...`.
16. The README states that the remote futarchy `api.futarchy.fi` GraphQL "requires X-Futarchy-Secret". In practice registry/candles answered without it on 2026-10-21. Keep the Goldsky URLs (G5) as a fallback.
