export type ChainId = 1 | 10 | 100 | 8453;
export type MarketStatus = "not_open" | "open" | "answer_not_final" | "in_dispute" | "pending_execution" | "closed";
export type MarketKind = "binary" | "categorical" | "multi-categorical" | "scalar" | "futarchy";

/** Raw shape from markets-search / get-market. */
export interface SeerMarketRaw {
  id: string;
  chainId: ChainId;
  type: "Generic" | "Futarchy";
  marketName: string;
  outcomes: string[];
  templateId: string;
  lowerBound: string;
  upperBound: string;
  wrappedTokens: string[];
  collateralToken: string;
  collateralToken1: string;
  collateralToken2: string;
  conditionId: string;
  questionId: string;
  parentCollectionId: string;
  parentOutcome: string;
  parentMarket: { id: string; conditionId: string; payoutReported: boolean; payoutNumerators: string[] };
  questions: {
    id: string;
    opening_ts: number;
    finalize_ts: number;
    timeout: number;
    bond: string;
    min_bond: string;
    best_answer: string;
    arbitrator: string;
    is_pending_arbitration: boolean;
    base_question?: string;
  }[];
  openingTs: number;
  finalizeTs: number;
  hasAnswers: boolean;
  questionsInArbitration: string;
  payoutReported: boolean;
  payoutNumerators: string[];
  outcomesSupply: string;
  creator: string;
  factory: string;
  transactionHash: string;
  blockTimestamp: number;
  verification?: { status: string; itemID?: string; deadline?: number };
  liquidityUSD: number;
  volumeUSD: number;
  volumeNotionalUSD?: number;
  openInterestUSD?: number;
  hasLiquidity?: boolean;
  odds: (number | null)[];
  poolBalance?: ({ token0: { symbol: string; balance: number }; token1: { symbol: string; balance: number } } | null)[];
  categories?: string[];
  url: string;
  images?: { market?: string; outcomes?: string[] };
}

export interface Outcome {
  index: number;
  name: string;
  token: string;
  /** raw pool price, collateral per share (0..1); null = no pool */
  price: number | null;
  /** normalised probability over the non-invalid outcomes (0..1) */
  prob: number | null;
  image?: string;
  isInvalid: boolean;
  won?: boolean;
}

export interface Market {
  id: string;
  chainId: ChainId;
  slug: string;
  kind: MarketKind;
  type: "Generic" | "Futarchy";
  title: string;
  outcomes: Outcome[];
  status: MarketStatus;
  collateral: string;
  collateralSymbol: string;
  liquidityUSD: number;
  volumeUSD: number;
  openInterestUSD: number;
  conditionId: string;
  questionId: string;
  parentMarketId: string | null;
  parentOutcome: number | null;
  creator: string;
  factory: string;
  txHash: string;
  createdAt: number;
  openingTs: number;
  finalizeTs: number | null;
  questions: SeerMarketRaw["questions"];
  verified: boolean;
  verification: string;
  categories: string[];
  image?: string;
  lowerBound?: number;
  upperBound?: number;
  /** scalar only: market-implied value */
  implied?: number;
  resolved: boolean;
  appUrl: string;
}

export interface PricePoint { t: number; p: number }

export type Source = "live" | "snapshot";
export interface Sourced<T> {
  data: T;
  mode: Source;
  fetchedAt: string;
  source: string;
  href?: string;
  error?: string;
}
