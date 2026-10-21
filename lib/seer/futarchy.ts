import "server-only";
import { sourced } from "./api";
import type { PricePoint, Sourced } from "./types";

const API = "https://api.futarchy.seer.pm";
const AGGREGATOR = "0xc5eb43d53e2fe5fdde5faf400cc4167e5b5d4fc1";
const FORCE = process.env.SEER_FORCE_SNAPSHOT === "1";

async function gql<T>(url: string, query: string, revalidate = 120): Promise<T> {
  if (FORCE) throw new Error("forced snapshot mode");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate },
    });
    if (!r.ok) throw new Error(`${r.status}`);
    const j = (await r.json()) as { data?: T; errors?: unknown };
    if (!j.data) throw new Error("graphql error");
    return j.data;
  } finally {
    clearTimeout(t);
  }
}

export interface ProposalMeta {
  id: string;
  org: string;
  orgLogo?: string;
  orgColor?: string;
  chainId: 1 | 100;
  title: string;
  question: string;
  event: string;
  description?: string;
  createdAt: number;
  closeTimestamp?: number;
  twapStart?: number;
  twapHours?: number;
  twapDescription?: string;
  resolution?: string;
}

type RegistryRaw = {
  aggregator: {
    organizations: {
      id: string;
      name: string;
      metadata: string;
      proposals: { proposalAddress: string; title: string; displayNameQuestion?: string; displayNameEvent?: string; createdAtTimestamp: string; metadata: string }[];
    }[];
  };
};

const parse = (s: string) => {
  try {
    return JSON.parse(s || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

function parseRegistry(r: RegistryRaw): ProposalMeta[] {
  const out: ProposalMeta[] = [];
  for (const o of r.aggregator?.organizations ?? []) {
    const om = parse(o.metadata);
    for (const p of o.proposals ?? []) {
      const m = parse(p.metadata);
      if (m.archived) continue;
      const chain = Number(m.chain ?? om.chain ?? 100);
      const q = (p.displayNameQuestion || (m.displayNameQuestion as string) || (m.display_title_0 as string) || p.title || "").trim();
      const ev = (p.displayNameEvent || (m.displayNameEvent as string) || (m.display_title_1 as string) || "").trim();
      out.push({
        id: p.proposalAddress.toLowerCase(),
        org: o.name.replace(/Kleros Dao$/, "Kleros DAO"),
        orgLogo: om.logo as string | undefined,
        orgColor: (om.colors as { primary?: string } | undefined)?.primary,
        chainId: chain === 1 ? 1 : 100,
        title: p.title,
        question: q,
        event: ev,
        description: m.description as string | undefined,
        createdAt: Number(p.createdAtTimestamp),
        closeTimestamp: m.closeTimestamp ? Number(m.closeTimestamp) : undefined,
        twapStart: m.twapStartTimestamp ? Number(m.twapStartTimestamp) : undefined,
        twapHours: m.twapDurationHours ? Number(m.twapDurationHours) : undefined,
        twapDescription: m.twapDescription as string | undefined,
        resolution: (m.resolution_status as string) || (m.resolution_outcome as string) || undefined,
      });
    }
  }
  // de-dup the two Kleros orgs and keep newest first
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getProposals(): Promise<Sourced<ProposalMeta[]>> {
  const q = `{ aggregator(id:"${AGGREGATOR}"){ organizations(first:50){ id name metadata proposals(first:50,orderBy:createdAtTimestamp,orderDirection:desc){ proposalAddress title displayNameQuestion displayNameEvent createdAtTimestamp metadata } } } }`;
  return sourced(
    "api.futarchy.seer.pm · registry",
    "https://futarchy.seer.pm",
    async () => parseRegistry(await gql<RegistryRaw>(`${API}/registry/graphql`, q, 300)),
    async () => parseRegistry(((await import("@/public/snapshots/futarchy-registry.json")).default as unknown as { data: RegistryRaw }).data),
  );
}

export interface ProposalPrices {
  id: string;
  marketName: string;
  company: string;
  currency: string;
  pass: number | null;
  fail: number | null;
  /** probability the proposal passes, from the PREDICTION pool (null when that pool is degenerate) */
  passProb: number | null;
  passSeries: PricePoint[];
  failSeries: PricePoint[];
  volumeUSD: number;
}

type PoolRaw = { type: string; outcomeSide: string; price: string; candles: { periodStartUnix: string; close: string; volumeUSD: string }[] };
type CandlesRaw = {
  proposal: { id: string; marketName: string; companyToken: { symbol: string }; currencyToken: { symbol: string }; pools: PoolRaw[] } | null;
};

function parseCandles(id: string, d: CandlesRaw): ProposalPrices | null {
  const p = d.proposal;
  if (!p) return null;
  const sane = (v: string | number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 1e-12 ? n : null;
  };
  const pool = (type: string, side: string) => p.pools.find((x) => x.type === type && x.outcomeSide === side);
  const series = (x?: PoolRaw) =>
    (x?.candles ?? [])
      .map((c) => ({ t: Number(c.periodStartUnix), p: Number(c.close) }))
      .filter((c) => Number.isFinite(c.p) && c.p > 1e-12)
      .sort((a, b) => a.t - b.t);
  const yes = pool("CONDITIONAL", "YES");
  const no = pool("CONDITIONAL", "NO");
  const pred = pool("PREDICTION", "YES");
  const predNo = pool("PREDICTION", "NO");
  let passProb = pred ? sane(pred.price) : null;
  if (passProb == null && predNo && sane(predNo.price) != null) passProb = 1 - Number(predNo.price);
  if (passProb != null && (passProb < 0 || passProb > 1)) passProb = null;
  const vol = [yes, no].reduce((a, x) => a + (x?.candles ?? []).reduce((s, c) => s + Number(c.volumeUSD || 0), 0), 0);
  return {
    id,
    marketName: p.marketName,
    company: p.companyToken.symbol,
    currency: p.currencyToken.symbol,
    pass: yes ? sane(yes.price) : null,
    fail: no ? sane(no.price) : null,
    passProb,
    passSeries: series(yes),
    failSeries: series(no),
    volumeUSD: vol,
  };
}

const SNAP: Record<string, () => Promise<unknown>> = {
  "0x0d78b95fca9f3e1b588271a330b0d6f731ec38aa": () => import("@/public/snapshots/futarchy-candles-eip8363.json"),
  "0x4120de9931fd29c8a6effea4df57a7c8760c1677": () => import("@/public/snapshots/futarchy-candles-gip153.json"),
};

export async function getProposalPrices(id: string, chainId: 1 | 100, candles = 96): Promise<Sourced<ProposalPrices | null>> {
  const q = `{ proposal(id:"${id}"){ id marketName companyToken{symbol} currencyToken{symbol} pools{ type outcomeSide price candles(first:${candles},orderBy:periodStartUnix,orderDirection:desc,where:{period:3600}){ periodStartUnix close volumeUSD } } } }`;
  return sourced(
    "api.futarchy.seer.pm · candles",
    `https://futarchy.seer.pm`,
    async () => parseCandles(id, await gql<CandlesRaw>(`${API}/candles/graphql${chainId === 1 ? "?chainId=1" : ""}`, q, 120)),
    async () => {
      const f = SNAP[id];
      if (!f) return null;
      const mod = (await f()) as { default: { data: CandlesRaw } };
      return parseCandles(id, mod.default.data);
    },
  );
}
