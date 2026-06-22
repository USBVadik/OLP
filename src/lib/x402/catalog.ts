/**
 * Demo catalog of x402-priced agent resources.
 *
 * These are mock "paid APIs" an autonomous agent might buy. Prices are chosen around a typical
 * 0.10 USDC per-charge mandate cap so the demo has a natural "within budget -> paid" path and an
 * "over the per-charge cap -> blocked" path. Payloads are deterministic stand-ins; in a real
 * deployment the payload producer would call the upstream data source after payment is verified.
 *
 * Pure module — no I/O, no chain.
 */

export type X402Resource = {
  id: string;
  title: string;
  /** Atomic USDC price (6 decimals). */
  priceAtomic: bigint;
  description: string;
  /** Produces the resource body once payment is verified. Deterministic for the demo. */
  payload: () => unknown;
};

export const X402_CATALOG: Record<string, X402Resource> = {
  "market-insight": {
    id: "market-insight",
    title: "Market insight snapshot",
    priceAtomic: 50_000n, // 0.05 USDC
    description: "A one-shot market insight snapshot an agent can buy per call.",
    payload: () => ({
      kind: "market-insight",
      asOf: "2026-06-21T00:00:00Z",
      summary: "ETH momentum neutral-to-positive; stablecoin flows rising on L2s.",
      signals: [
        { name: "l2_stablecoin_inflow", value: "rising", confidence: 0.71 },
        { name: "eth_funding", value: "neutral", confidence: 0.6 },
      ],
    }),
  },
  "sentiment-feed": {
    id: "sentiment-feed",
    title: "Live sentiment feed",
    priceAtomic: 80_000n, // 0.08 USDC
    description: "A short sentiment feed slice for the agent's current task.",
    payload: () => ({
      kind: "sentiment-feed",
      window: "1h",
      score: 0.62,
      label: "mildly bullish",
      sources: 1284,
    }),
  },
  "premium-dataset": {
    id: "premium-dataset",
    title: "Premium dataset (full export)",
    priceAtomic: 200_000n, // 0.20 USDC — over a 0.10 per-charge cap on purpose
    description: "A pricey full-export an over-eager agent might try to buy beyond its budget.",
    payload: () => ({
      kind: "premium-dataset",
      rows: 50000,
      note: "If you can read this, the payment was inside the mandate.",
    }),
  },
};

export function getResource(id: string): X402Resource | null {
  return X402_CATALOG[id] ?? null;
}

export function listResources(): X402Resource[] {
  return Object.values(X402_CATALOG);
}
