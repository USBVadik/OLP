import { type UniversalBalanceSummary } from "@/lib/particle/assets";

/**
 * Withdrawal *forecast* (estimate) for a Universal Account balance that is spread across many
 * chains.
 *
 * This is a Trust-Preview-style estimate: it helps the user understand, BEFORE withdrawing, roughly
 * how much will land at their destination address and *why* it costs what it does. It deliberately
 * does NOT quote a live network fee, make a live cross-chain claim, or move any funds — the wallet
 * view stays read-only and the exact cost is quoted at execution.
 *
 * Two effects drive the cost, and the model makes both legible:
 *   1. Destination chain — Ethereum L1 settlement gas is far higher than an L2's.
 *   2. Scattered funds — every source chain that has to be drained into the route is one routing
 *      leg, so a balance spread thin across 10 chains costs more to consolidate than the same
 *      total sitting on one chain. Funds already on the destination chain need no routing.
 *
 * Pure + defensive: a null/odd summary yields an empty (zero) forecast rather than throwing.
 */

export type DestTier = "low" | "medium" | "high";

type DestMeta = {
  chainId: number;
  /** Representative "typical" cost in USD to settle one token transfer on this chain. Rough by
   *  design and always surfaced in the UI as an estimate. */
  settlementUsd: number;
  tier: DestTier;
};

/**
 * Curated withdrawal destinations, ordered for the picker. Settlement costs are rough typical
 * figures (a single ERC-20 transfer's gas), used only to make the forecast legible — not a quote.
 * Ethereum L1 leads as the deliberately-expensive case the user reasons about.
 */
export const WITHDRAW_DESTINATIONS: DestMeta[] = [
  { chainId: 8453, settlementUsd: 0.02, tier: "low" }, // Base (app home chain)
  { chainId: 42161, settlementUsd: 0.02, tier: "low" }, // Arbitrum
  { chainId: 10, settlementUsd: 0.02, tier: "low" }, // Optimism
  { chainId: 137, settlementUsd: 0.03, tier: "low" }, // Polygon
  { chainId: 101, settlementUsd: 0.002, tier: "low" }, // Solana
  { chainId: 43114, settlementUsd: 0.12, tier: "medium" }, // Avalanche
  { chainId: 56, settlementUsd: 0.3, tier: "medium" }, // BNB Chain
  { chainId: 1, settlementUsd: 4.0, tier: "high" }, // Ethereum L1 — the expensive one
];

const DEFAULT_SETTLEMENT_USD = 0.15;

/** Cost to drain one *source* chain into the route (sourcing + a bridge hop). More scattered
 *  funds means more legs means more of this. */
export const PER_LEG_ROUTING_USD = 0.15;

export function destinationSettlementUsd(chainId: number): number {
  return WITHDRAW_DESTINATIONS.find((d) => d.chainId === chainId)?.settlementUsd ?? DEFAULT_SETTLEMENT_USD;
}

export function destinationTier(chainId: number): DestTier {
  return WITHDRAW_DESTINATIONS.find((d) => d.chainId === chainId)?.tier ?? "medium";
}

export type WithdrawLeg = { chainId: number; amountUsd: number; isDestination: boolean };

export type WithdrawForecast = {
  /** Requested amount, already clamped to the available balance. */
  requestedUsd: number;
  availableUsd: number;
  destChainId: number;
  /** Source chains drained to cover the request (destination-chain funds first, then largest). */
  legs: WithdrawLeg[];
  legCount: number;
  /** Source chains that need a routing hop (i.e. not already on the destination chain). */
  routedLegCount: number;
  routingCostUsd: number;
  settlementCostUsd: number;
  totalCostUsd: number;
  netReceivedUsd: number;
  /** netReceived / requested (0..1). */
  effectivePct: number;
  /** True when the request was capped to the available balance. */
  clamped: boolean;
};

/** Flatten per-token, per-chain balances into one USD-per-chain list (largest first). */
function chainUsdList(summary: UniversalBalanceSummary): { chainId: number; usd: number }[] {
  const byChain = new Map<number, number>();
  for (const token of summary.tokens) {
    for (const c of token.byChain) {
      if (c.amountInUSD <= 0) continue;
      byChain.set(c.chainId, (byChain.get(c.chainId) ?? 0) + c.amountInUSD);
    }
  }
  return [...byChain.entries()]
    .map(([chainId, usd]) => ({ chainId, usd }))
    .sort((a, b) => b.usd - a.usd);
}

/**
 * Plan a withdrawal of `requestedUsd` to `destChainId` from the (scattered) balance in `summary`.
 * Greedy sourcing prefers funds already on the destination chain (no routing hop), then the largest
 * holdings — which both minimises legs and mirrors how a router would consolidate liquidity.
 */
export function planWithdrawal(
  summary: UniversalBalanceSummary | null,
  destChainId: number,
  requestedUsd: number
): WithdrawForecast {
  const sources = summary ? chainUsdList(summary) : [];
  const availableUsd = sources.reduce((sum, c) => sum + c.usd, 0);

  const safeRequest = Number.isFinite(requestedUsd) && requestedUsd > 0 ? requestedUsd : 0;
  const clamped = safeRequest > availableUsd;
  const target = Math.max(0, Math.min(safeRequest, availableUsd));

  // Prefer destination-chain funds (no routing), then largest holdings first.
  const ordered = [...sources].sort((a, b) => {
    if (a.chainId === destChainId && b.chainId !== destChainId) return -1;
    if (b.chainId === destChainId && a.chainId !== destChainId) return 1;
    return b.usd - a.usd;
  });

  const legs: WithdrawLeg[] = [];
  let remaining = target;
  for (const source of ordered) {
    if (remaining <= 1e-6) break;
    const take = Math.min(source.usd, remaining);
    if (take <= 0) continue;
    legs.push({ chainId: source.chainId, amountUsd: take, isDestination: source.chainId === destChainId });
    remaining -= take;
  }

  const legCount = legs.length;
  const routedLegCount = legs.filter((l) => !l.isDestination).length;
  const routingCostUsd = routedLegCount * PER_LEG_ROUTING_USD;
  const settlementCostUsd = target > 0 ? destinationSettlementUsd(destChainId) : 0;
  const totalCostUsd = routingCostUsd + settlementCostUsd;
  const netReceivedUsd = Math.max(0, target - totalCostUsd);
  const effectivePct = target > 0 ? netReceivedUsd / target : 0;

  return {
    requestedUsd: target,
    availableUsd,
    destChainId,
    legs,
    legCount,
    routedLegCount,
    routingCostUsd,
    settlementCostUsd,
    totalCostUsd,
    netReceivedUsd,
    effectivePct,
    clamped,
  };
}
