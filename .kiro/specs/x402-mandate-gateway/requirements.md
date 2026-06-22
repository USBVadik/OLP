# Spec: x402-mandate-gateway — Requirements

> Epic: **E5. Agentic adoption signals** (ELEVATED from stretch to core — the originality wedge)
> Stories: **E5.S1**, plus new **E5.S2, E5.S3**
> Priority: **P1** (originality core — user directive 2026-06-21: "originality is the weak spot")
> Estimated effort: **6-10h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

All four deep-research reports said the same thing: the spend-permission *primitive* is not
novel (Coinbase Spend Permissions, ERC-7715/7710, ZeroDev session keys). To be a clear winner we
need an original primitive the field does not have.

Web research (2026-06-21) confirms the wedge:

- **x402 is the breakout agent-payment rail of 2026.** ~120M+ transactions, $41M+ USDC settled
  across 14 chains, ~$0.05 average payment
  ([CoinDesk via MeXC](https://www.mexc.com/news/1147346)). Circle reports 140M+ agent payments,
  $43M, 400k+ agents ([Sherlock](https://sherlock.xyz/post/how-to-build-an-ai-agent-that-pays-with-usdc)).
  (Figures rephrased for licensing compliance.)
- **x402 has a documented security gap.** Two papers — "Five Attacks on x402 Agentic Payment
  Protocol" ([arXiv](https://arxiv.org/html/2605.11781v1)) and "Demystifying Logic Flaws in
  x402-Enabled Payment Systems" ([arXiv](https://arxiv.org/html/2605.30998v1)) — name the attack
  surface. Industry coverage lists **allowance scopes** among the primary risks
  ([MeXC](https://www.mexc.com/news/1147346)). x402 gives an agent a way to pay; it does not bound
  how much the agent can spend.
- **`x402-next` is a real package** (Next.js middleware for the x402 HTTP pattern)
  ([npm](https://www.npmjs.org/package/x402-next)).

**Our original primitive:** OneLink Pay is the **on-chain spending-limit layer for the x402
economy**. An x402 payment, instead of being an unbounded raw transfer, is gated by a payer-signed
on-chain mandate (per-charge / daily / total caps + expiry + merchant-only + revoke). Over-budget
agent requests **never get paid** — the firewall reverts before settlement. "x402 gives agents a
wallet; OneLink Pay is the leash."

Content was rephrased for compliance with licensing restrictions.

## 2. Honesty constraints (binding)

- This is the **x402 HTTP handshake** (server returns `402 Payment Required` + payment
  requirements; client pays; client retries with proof) with **settlement enforced through our
  on-chain mandate**. It is NOT wire-compatible with the canonical Coinbase x402 facilitator
  (which settles via EIP-3009 `transferWithAuthorization`). We use a custom settlement scheme
  (`onelink-mandate`) and say so.
- Public framing: "x402-style / x402-pattern, settled by an on-chain spend mandate" — never
  "Coinbase x402 facilitator compatible" unless that is actually built and proven.
- The on-chain enforcement mechanics are already proven (claim C16). This spec adds the HTTP
  resource-delivery layer on top.
- No live on-chain spend is required to land the code; the live agent-buys-a-resource run is a
  user-side verification (it costs real USDC + gas).

## 3. User stories covered

- **E5.S1** — As a demo viewer, I see the agent hit a 402-gated API endpoint and pay via the
  mandate (over-budget refused), so I understand the agentic-payments ecosystem fit.
- **E5.S2** — As a developer, my API route returns a faithful x402 `402` response with payment
  requirements when called without payment, so the pattern is recognizably x402.
- **E5.S3** — As a payer, an x402 purchase that would exceed my mandate caps is blocked before any
  funds move, so my agent literally cannot overspend on paid APIs.

## 4. Acceptance criteria (EARS)

### Ubiquitous
- The system shall expose a 402-gated resource endpoint at `/api/x402/<resource>`.
- The 402 response body shall include `x402Version` and an `accepts` array of payment
  requirements (scheme, network, maxAmountRequired, resource, payTo, asset, maxTimeoutSeconds,
  description, mimeType, extra).
- Payment requirements amounts shall be expressed in atomic USDC (6 decimals) as strings.

### Event-driven
- **When** `/api/x402/<resource>` is requested **without** a payment proof header, **the system
  shall** respond `402` with the resource's payment requirements.
- **When** `/api/x402/<resource>` is requested **with** a valid payment proof (an on-chain
  MandateCharged of at least the price, to the required recipient, for the required asset), **the
  system shall** respond `200` with the resource payload.
- **When** the payment proof is present but insufficient (wrong amount / asset / recipient /
  already-consumed), **the system shall** respond `402` with an `error` describing why.

### State-driven
- **While** the resource id is unknown, **the system shall** respond `404`.

### Unwanted-behavior
- **If** the payment proof header is malformed (not valid base64 JSON), **then the system shall**
  respond `402` with a clear `error`, not `500`.
- **If** an agent attempts an x402 purchase whose price exceeds the armed mandate's per-charge or
  remaining caps, **then the firewall shall** block the settlement (simulation revert) and the
  resource shall NOT be delivered.

## 5. Scope

### In scope
- `src/lib/x402/requirements.ts` — pure: build the 402 payload; encode/decode the payment header.
- `src/lib/x402/catalog.ts` — demo resource catalog with prices + payloads.
- `src/lib/x402/verify.ts` — pure: validate a payment proof against requirements.
- `src/app/api/x402/[resource]/route.ts` — the 402-gated endpoint (GET).
- `/agent` page — a self-contained demo: login, arm a mandate, then the agent buys resources over
  the x402 handshake bounded by the mandate; over-budget purchase is denied.
- Docs: spec, master-tz mapping, demo-runbook x402 section, honest-claim DRAFT, risk register.

### Out of scope (cut)
- Coinbase-facilitator wire compatibility / EIP-3009 settlement.
- Real third-party paid APIs (the catalog is mock resources).
- Streaming / MPP (Stripe) payments.
- Persisting mandates across pages (the `/agent` page arms its own in-memory mandate).
- Multi-chain x402 (Arbitrum only, where SpendPolicy + relayer live).

## 6. INVEST check

- **I**ndependent — additive; does not modify `/firewall` or any proven flow. ✅
- **N**egotiable — resource catalog + page placement open. ✅
- **V**aluable — the originality wedge: UA+7702 innovation (30%) + adoption (20%). ✅
- **E**stimable — 6-10h. ✅
- **S**mall enough — split into tested libs + a route + one page. ✅
- **T**estable — all settlement-independent logic is pure + unit-tested; the live buy is a
  user-side check. ✅

## 7. Definition of Done

- All EARS criteria have a green test or a documented manual check.
- `/firewall` and all prior proven flows are unregressed.
- typecheck + lint + test:unit + build all green.
- Honest-claim row added as DRAFT (code-complete, live on-chain run pending user).
- Master-tz §4 + §7 updated; demo-runbook gains an x402 beat.
