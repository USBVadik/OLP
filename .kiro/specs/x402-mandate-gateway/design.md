# Spec: x402-mandate-gateway — Design

> Pairs with `requirements.md` and `tasks.md`.

## 1. The flow (x402 handshake, mandate settlement)

```
agent                          /api/x402/insight                 SpendPolicy (Arbitrum)
  │  GET /api/x402/insight            │                                   │
  │ ─────────────────────────────────▶                                   │
  │      402 + paymentRequirements    │                                   │
  │ ◀─────────────────────────────────                                   │
  │                                   │                                   │
  │  (pay within mandate via relayer) │   POST /api/mandates/charge       │
  │ ──────────────────────────────────────────────────────────────────▶ │
  │                                   │     simulate -> charge / revert   │
  │      { ok, txHash } or { blocked }│ ◀──────────────────────────────── │
  │                                   │                                   │
  │  GET /api/x402/insight            │                                   │
  │   X-PAYMENT: base64({txHash,...}) │                                   │
  │ ─────────────────────────────────▶  verify MandateCharged on-chain    │
  │      200 + resource payload       │                                   │
  │ ◀─────────────────────────────────                                   │
```

If the price exceeds the mandate's per-charge / remaining caps, the `/api/mandates/charge`
simulation reverts (`PerChargeExceeded` / `DailyCapExceeded` / `TotalCapExceeded`), no funds move,
and the agent never obtains a valid proof -> the resource is never delivered. That is the wedge.

## 2. Module breakdown

```
src/
├── lib/
│   └── x402/
│       ├── requirements.ts        (new, pure) build 402 body; encode/decode X-PAYMENT
│       ├── requirements.test.ts    (new)
│       ├── catalog.ts             (new, pure) demo resource catalog
│       ├── catalog.test.ts         (new)
│       ├── verify.ts              (new, pure) validate proof vs requirements
│       └── verify.test.ts          (new)
├── app/
│   ├── api/
│   │   └── x402/
│   │       └── [resource]/
│   │           └── route.ts       (new) GET: 402-gate + on-chain proof verification
│   └── agent/
│       └── page.tsx               (new) the x402 agent-commerce demo
```

No changes to `/firewall`, `permission-firewall.tsx`, `agent-terminal.tsx` (reused as-is),
`/api/mandates/charge`, or any contract.

## 3. requirements.ts — contracts

```ts
export const X402_VERSION = 1;
export const X402_SCHEME = "onelink-mandate"; // honest: not "exact"/EIP-3009

export type X402PaymentRequirements = {
  scheme: typeof X402_SCHEME;
  network: string;            // "arbitrum"
  maxAmountRequired: string;  // atomic USDC, string
  resource: string;           // "/api/x402/insight"
  description: string;
  mimeType: string;           // "application/json"
  payTo: `0x${string}`;       // merchant
  maxTimeoutSeconds: number;
  asset: `0x${string}`;       // USDC
  extra: { mandatePolicy: `0x${string}`; settledVia: "spend-mandate" };
};

export type X402Response = {
  x402Version: number;
  accepts: X402PaymentRequirements[];
  error?: string;
};

export type X402PaymentProof = {
  scheme: typeof X402_SCHEME;
  txHash: `0x${string}`;
  amount: string;            // atomic USDC the agent claims it paid
  asset: `0x${string}`;
  payTo: `0x${string}`;
  resource: string;
};

export function buildPaymentRequirements(input: {...}): X402PaymentRequirements;
export function build402Response(reqs: X402PaymentRequirements, error?: string): X402Response;
export function encodePaymentHeader(proof: X402PaymentProof): string;       // base64 JSON
export function decodePaymentHeader(header: string): X402PaymentProof | null; // null on malformed
```

`decodePaymentHeader` must never throw — return `null` on bad base64/JSON/shape so the route
returns 402 not 500.

## 4. catalog.ts — contracts

```ts
export type X402Resource = {
  id: string;
  title: string;
  priceAtomic: bigint;       // atomic USDC
  description: string;
  /** Produces the resource body once paid. Pure / deterministic for the demo. */
  payload: () => unknown;
};

export const X402_CATALOG: Record<string, X402Resource>;
export function getResource(id: string): X402Resource | null;
```

Demo resources (priced around a 0.10 per-charge cap so the "blocked" beat is natural):

| id | title | price | demo intent |
|----|-------|-------|-------------|
| `market-insight` | Market insight snapshot | 0.05 USDC | within cap -> succeeds |
| `sentiment-feed` | Live sentiment feed | 0.08 USDC | within cap -> succeeds |
| `premium-dataset` | Premium dataset (full) | 0.20 USDC | over per-charge cap -> blocked |

## 5. verify.ts — contracts

```ts
export type ProofCheck = { ok: true } | { ok: false; reason: string };

/** Settlement-independent checks: amount >= required, asset + payTo + resource match. */
export function isPaymentSufficient(
  proof: X402PaymentProof,
  reqs: X402PaymentRequirements
): ProofCheck;
```

The route layers the ON-CHAIN check (does `txHash` contain a `MandateCharged` to `payTo` for
>= price in `asset`?) on top of this pure check.

## 6. route.ts — orchestration

`GET /api/x402/[resource]`:

1. `getResource(params.resource)` -> 404 if unknown.
2. Build requirements (price, payTo = demo merchant, asset = USDC, mandatePolicy = SpendPolicy).
3. Read `X-PAYMENT` header.
   - missing -> `402` + `build402Response(reqs)`.
   - present -> `decodePaymentHeader`; null -> `402` + error "malformed payment".
4. `isPaymentSufficient(proof, reqs)` -> if not ok -> `402` + error reason.
5. On-chain verify: fetch the tx receipt for `proof.txHash` on Arbitrum; confirm it has a
   `MandateCharged` log from the SpendPolicy with `to == payTo` and `amount >= price`. Also guard
   replay: a given `txHash` settles at most one resource delivery within the request (the demo
   does not need a persistent nonce store; document this limitation).
   - valid -> `200` + `{ resource: id, paidTx: txHash, data: payload() }`.
   - invalid -> `402` + error.

On-chain read uses viem `createPublicClient` (Arbitrum) + the existing `SPEND_POLICY_ABI` event.
Keep the pure decision logic in libs; the route only does I/O + orchestration.

## 7. /agent page — design

Self-contained so it does not depend on `/firewall` state:

- Reuse `LoginWithGoogleButton` + the `loadMagic`/`OAuthExtension` pattern + `useMandateState`.
- Compact arm: reuse `deriveMandate("agent_budget")` + sign EIP-712 + approve (same code path as
  `/firewall` arm; extracted inline to avoid coupling).
- Resource catalog rendered as cards with prices.
- An `AgentTerminal` (reused) narrates the handshake:
  `[AGENT] GET /api/x402/market-insight -> 402 ($0.05). Paying within mandate…`
  `[FIREWALL] Charged 0.05 USDC.`
  `[AGENT] GET /api/x402/market-insight (paid) -> 200 OK. data: {...}`
- The "premium-dataset" card triggers the leash beat:
  `[AGENT] GET premium-dataset -> 402 ($0.20). Paying…`
  `[FIREWALL] BLOCKED: PerChargeExceeded. No funds moved.`
  `[AGENT] Access denied — over budget. Resource not delivered.`
- Budget HUD on the side so judges watch the agent's allowance drain per purchase.

During this autonomous build the page is render-checked only (no live charges — that spends real
USDC). The live buy is a user-side verification.

## 8. Reuse vs duplication

- AgentTerminal, BudgetHud, MandateCard, LoginWithGoogleButton, scenarios/log-formatter pattern,
  useMandateState — all reused.
- The arm logic is duplicated inline on `/agent` (≈40 lines). A future refactor could extract a
  shared `useArmedMandate` hook used by both `/firewall` and `/agent`; deferred to avoid
  re-touching the proven `/firewall` during an unattended build.

## 9. Risks introduced

- **R-NEW-7:** on-chain proof verification adds an RPC read per paid request; a slow/--down RPC
  makes the resource feel laggy. Mitigation: short timeout + clear "verifying payment…" agent log
  line; demo uses tiny amounts on fast Arbitrum.
- **R-NEW-8:** replay — the demo does not persist consumed txHashes, so the same proof could be
  reused to fetch a resource twice. Acceptable for a demo; documented. A production version needs a
  nonce/consumed-proof store. Add to risk register.
- **R-NEW-9:** honesty — judges may assume "x402" means facilitator-compatible. Mitigation: the
  scheme is literally named `onelink-mandate` and the docs/demo say "x402-pattern, mandate-settled".

## 10. References

- x402 pattern: [docs.x402.org quickstart](https://docs.x402.org/getting-started/quickstart-for-sellers),
  [x402-next npm](https://www.npmjs.org/package/x402-next).
- Security gap: [Five Attacks on x402 (arXiv)](https://arxiv.org/html/2605.11781v1).
- `src/lib/contracts/spend-policy.ts` (SPEND_POLICY_ABI, MandateCharged event).
- `src/app/api/mandates/charge/route.ts` (the settlement the agent calls).
- `src/components/agent-terminal.tsx`, `src/hooks/use-mandate-state.ts` (reused).
