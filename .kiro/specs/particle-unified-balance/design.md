# Spec: particle-unified-balance — Design

> Pairs with `requirements.md` and `tasks.md`.

## 1. `getPrimaryAssets()` shape (observed)

From a live checkout log, `universalAccount.getPrimaryAssets()` returns an object with an
`assets` array; each entry is a token type aggregated across chains:

```jsonc
{
  "assets": [
    {
      "tokenType": "usdc",            // or "eth", etc.
      "price": 1.0,
      "amount": 1.95,                 // total across chains (human units)
      "amountInUSD": 1.95,
      "chainAggregation": [
        {
          "token": { "assetId": "usdc", "type": "usdc", "chainId": 42161,
                     "address": "0xaf88…5831", "decimals": 6, "realDecimals": 6,
                     "isMultiChain": true },
          "amount": 1.6,
          "amountInUSD": 1.6
        },
        { "token": { "chainId": 8453, ... }, "amount": 0.35, "amountInUSD": 0.35 }
      ]
    }
  ]
}
```

The summarizer must be defensive: accept either `{ assets: [...] }` or a bare `[...]`, tolerate
missing fields, and never throw.

## 2. `assets.ts` — contracts (pure)

```ts
export type ChainBalance = { chainId: number; amount: number; amountInUSD: number };
export type TokenBalance = {
  symbol: string;        // upper-cased tokenType, e.g. "USDC"
  amount: number;        // total across chains
  amountInUSD: number;
  byChain: ChainBalance[];
};
export type UniversalBalanceSummary = {
  totalUsd: number;
  tokens: TokenBalance[];
  chainIds: number[];    // sorted unique chains the balance spans
};

/** Defensive: never throws; unknown shapes -> { totalUsd: 0, tokens: [], chainIds: [] }. */
export function summarizeUniversalBalance(raw: unknown): UniversalBalanceSummary;

/** Map a chainId to a short human label for the HUD. */
export function chainLabel(chainId: number): string; // 8453->"Base", 42161->"Arbitrum", 10->"Optimism"
```

Rules:
- token array = `Array.isArray(raw) ? raw : (raw?.assets ?? [])`.
- per token: `symbol = String(tokenType).toUpperCase()`, coerce amount/amountInUSD via `Number(...) || 0`.
- `byChain` from `chainAggregation`, each `{ chainId: Number(token.chainId), amount, amountInUSD }`,
  dropping entries with no chainId.
- `totalUsd` = sum of token.amountInUSD (fallback to sum of byChain USD if token total missing).
- `chainIds` = sorted unique across all byChain.
- Sort tokens by amountInUSD desc so USDC/ETH lead.

## 3. `universal-balance-card.tsx` — design

```tsx
type Props = {
  summary: UniversalBalanceSummary | null;
  loading?: boolean;
  error?: string | null;
};
```

Layout:
```
┌───────────────────────────────────────────────┐
│ Universal Account balance     ⛓ Base · Arbitrum │
│                                                 │
│           $2.30                                 │
│   one balance across 2 chains                   │
│                                                 │
│ USDC   1.95   ($1.95)   Arbitrum 1.60 · Base .35│
│ ETH    0.0007 ($1.20)   Base 0.0007             │
│                                                 │
│ Powered by Particle Universal Accounts          │
└───────────────────────────────────────────────┘
```

- States: loading (skeleton text), error ("balance unavailable" + muted), empty ("$0.00").
- The chain chips + "one balance across N chains" line are the visceral chain-abstraction cue.
- Attribution line is small but explicit (sponsor showcase).

## 4. /agent read-only UA init

Mirror the `/pay/[id]` pattern, but only call `getPrimaryAssets()` — no transaction.

```ts
// after Magic login + address known
await loadSDKs();                  // adds UniversalAccount (already used by checkout)
const ua = new UniversalAccount({
  projectId, projectClientKey, projectAppUuid,
  smartAccountOptions: { useEIP7702: true, name: "UNIVERSAL", version, ownerAddress: address },
  tradeConfig: { slippageBps: 100, universalGas: false },
});
const raw = await ua.getPrimaryAssets();
setBalanceSummary(summarizeUniversalBalance(raw));
```

- Runs once after login (and after arming is fine too). Guard with try/catch -> error state.
- Particle creds come from the same `NEXT_PUBLIC_PARTICLE_*` envs checkout uses.
- This is the SAME read checkout already performs; no new risk, no gas.

To avoid duplicating the SDK loader, add a tiny `loadParticle()` in a shared module OR inline the
dynamic import on `/agent` (mirror firewall's inline `loadMagic`). Inline keeps the proven checkout
untouched; a shared extraction is deferred.

## 5. Sponsor-showcase framing (honest captions)

Small badges row on `/agent` (and a caption under the balance):
- **Particle** — "One balance across chains · EIP-7702 Universal Account"
- **Magic** — "Email/Google login · your wallet is your email"
- **Arbitrum** — "Settles on Arbitrum One"

Caption under the balance (honest):
"Your agent sees one balance across chains (Particle UA). It pays for x402 APIs without choosing a
chain or holding gas. Today settlement runs on Arbitrum; Particle V2 cross-chain extends the same
flow to source from every chain."

## 6. Reuse / no-regression

- Reuses Particle creds + the proven `getPrimaryAssets` read.
- Does not touch `/firewall`, the charge route, the x402 route, or contracts.
- Optional checkout swap (raw JSON -> card) is gated behind "only if trivially safe"; default is to
  leave checkout as-is to protect the proven flow.

## 7. Risks introduced

- **R-NEW-12:** Particle UA init on `/agent` could be slow / rate-limited. Mitigation: it's a single
  read with a loading state; failure shows "unavailable" and the rest of the demo still works.
- **R-NEW-13:** the unified balance could read $0 if the wallet was swept. Mitigation: empty state is
  handled; for the demo the payer holds Base + Arbitrum USDC.

## 8. References

- `src/app/pay/[id]/page.tsx` (loadSDKs, UniversalAccount init, getPrimaryAssets) — the pattern.
- `src/app/agent/page.tsx` — where the HUD lands.
- `src/components/budget-hud.tsx` — visual sibling (on-chain mandate budget vs UA wallet balance).
