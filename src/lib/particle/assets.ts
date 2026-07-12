/**
 * Summarize a Particle `getPrimaryAssets()` result into a legible unified-balance view.
 *
 * Particle's Universal Account aggregates a single balance across chains; this turns the raw SDK
 * shape into { totalUsd, tokens[], chainIds[] } for the Unified Balance HUD. The headline value of
 * Particle's tooling — one balance across chains — becomes visible here.
 *
 * Pure + defensive: any unexpected shape yields a zero summary instead of throwing, so a flaky
 * read never breaks the page.
 */

export type ChainBalance = { chainId: number; amount: number; amountInUSD: number };

export type TokenBalance = {
  symbol: string;
  amount: number;
  amountInUSD: number;
  byChain: ChainBalance[];
};

export type ChainHolding = { chainId: number; usd: number };

export type UniversalBalanceSummary = {
  totalUsd: number;
  tokens: TokenBalance[];
  chainIds: number[];
  /** Chains ordered by held USD descending; $0 chains trail in stable numeric order. */
  chains: ChainHolding[];
};

const EMPTY: UniversalBalanceSummary = { totalUsd: 0, tokens: [], chainIds: [], chains: [] };

function num(v: unknown): number {
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractTokenArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { assets?: unknown }).assets)) {
    return (raw as { assets: unknown[] }).assets;
  }
  return [];
}

export function summarizeUniversalBalance(raw: unknown): UniversalBalanceSummary {
  const arr = extractTokenArray(raw);
  if (arr.length === 0) return { ...EMPTY };

  const tokens: TokenBalance[] = [];
  const chainSet = new Set<number>();
  const usdByChain = new Map<number, number>();

  for (const entry of arr) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    const symbolRaw = e.tokenType ?? e.symbol ?? e.type ?? "";
    const symbol = String(symbolRaw).toUpperCase();
    if (!symbol) continue;

    const aggregation = Array.isArray(e.chainAggregation) ? e.chainAggregation : [];
    const byChain: ChainBalance[] = [];
    for (const c of aggregation) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const token = (cc.token ?? {}) as Record<string, unknown>;
      const chainId = num(token.chainId);
      if (!chainId) continue; // drop entries without a chain
      byChain.push({ chainId, amount: num(cc.amount), amountInUSD: num(cc.amountInUSD) });
      chainSet.add(chainId);
      usdByChain.set(chainId, (usdByChain.get(chainId) ?? 0) + num(cc.amountInUSD));
    }

    const chainUsd = byChain.reduce((sum, c) => sum + c.amountInUSD, 0);
    const chainAmount = byChain.reduce((sum, c) => sum + c.amount, 0);
    const amountInUSD = e.amountInUSD != null ? num(e.amountInUSD) : chainUsd;
    const amount = e.amount != null ? num(e.amount) : chainAmount;

    tokens.push({ symbol, amount, amountInUSD, byChain });
  }

  tokens.sort((a, b) => b.amountInUSD - a.amountInUSD);
  const totalUsd = tokens.reduce((sum, t) => sum + t.amountInUSD, 0);
  const chainIds = Array.from(chainSet).sort((a, b) => a - b);
  const chains = Array.from(usdByChain.entries())
    .map(([chainId, usd]) => ({ chainId, usd }))
    .sort((a, b) => b.usd - a.usd || a.chainId - b.chainId);

  return { totalUsd, tokens, chainIds, chains };
}

/**
 * Split token rows into the held set and a "$0 tail" count, so the HUD can lead with what the
 * account actually holds and compress the empty rows into one quiet line.
 */
export function splitHeldTokens(tokens: TokenBalance[]): {
  held: TokenBalance[];
  zeroCount: number;
} {
  const held = tokens.filter((t) => t.amount > 0);
  return { held, zeroCount: tokens.length - held.length };
}

const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  101: "Solana",
  137: "Polygon",
  143: "Monad",
  146: "Sonic",
  196: "X Layer",
  999: "HyperEVM",
  5000: "Mantle",
  8453: "Base",
  9745: "Plasma",
  42161: "Arbitrum",
  43114: "Avalanche",
  80094: "Berachain",
};

export function chainLabel(chainId: number): string {
  return CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
}
