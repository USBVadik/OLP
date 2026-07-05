# Spec: sponsored-delegation — Requirements

> Epic: **Zero-friction onboarding (UX-40)**
> Story: As a first-time payer, I complete a payment **without holding any native gas** — the
> one-time per-chain EIP-7702 delegation of my wallet is **sponsored** (a relayer submits the type-4
> transaction and pays the gas), while I only sign the authorization off-chain (gasless, popup-less).
> Priority: **P1** (removes the last honest friction we currently disclaim: "first payment needs a
> little native gas per chain for the one-time delegation").
> Estimated effort: **M** (pure core + 1 relayer API route + client wiring + a live spike)
> Process: `.kiro/steering/methodology.md` — TDD (test-first) for the pure logic; §7 manual-checklist
> + live-verify for the relayer/RPC glue and the browser flow.
> Scores: **UX 40 (true zero-gas onboarding) · UA+7702 30 (deepens the 7702 story) · adoption 20**

## 1. Why this exists

Today the payment itself is gas-abstracted (Particle Universal Gas → fee in USDC), but the **one-time
per-chain 7702 delegation** is a native type-4 transaction sent by the user's EOA, so a brand-new
payer still needs a little native gas on each chain the first time. That's the single onboarding
friction we honestly disclaim (see the cross-chain denylist note + C21).

EIP-7702 natively supports **sponsorship**: the authorization tuple is signed by the EOA, but the
type-4 transaction carrying it can be submitted by **any** account, which pays the gas. Magic already
exposes `sign7702Authorization` (returns the signed tuple, no popup). So our existing **relayer** can
submit the delegation tx on the user's behalf → the payer delegates at **zero gas cost to them**.

This is the sponsor-blessed "extra point on UX" from the Particle workshop, done in a way that is
entirely in our control (no external paymaster dependency).

## 2. Verified mechanism (primary source — do not re-derive from memory)

EIP-7702 §Behavior ([spec](https://eips.ethereum.org/EIPS/eip-7702)): "The authorization list is
processed … **after the sender's nonce is incremented**", then per tuple it verifies
`authority.nonce == auth.nonce` and finally increments the authority nonce by one. Therefore:

- **Self-submission** (EOA is BOTH sender and authority): the sender/EOA nonce is bumped first, so the
  authorization must use `authorityNonce + 1`. ← our current live path (`delegateChain7702`, C7).
- **Sponsor-submission** (relayer is sender, EOA is authority): the EOA nonce is untouched by the
  relayer's tx, so the authorization must use `authorityNonce` (N, not N+1).

This one-line difference is the correctness crux → covered by a pure unit test.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The system shall let a payer with **zero native gas** complete the one-time per-chain 7702
  delegation, with the **relayer** submitting the type-4 transaction and paying the gas.
- The system shall have the payer sign only the 7702 authorization (off-chain, via Magic) — the payer
  shall never pay gas for a sponsored delegation.

### State / event-driven
- **When** sponsored delegation is enabled and the payer lacks native gas on a chain they must
  delegate, the system shall request the signed authorization and POST it to the sponsor route, which
  submits the type-4 tx from the relayer and returns the delegation tx hash.
- **When** the relayer confirms the delegation, the payment flow shall proceed exactly as today
  (build → sign → settle) — no change to settlement, SpendPolicy, or the EIP-712 mandate.

### Unwanted-behavior
- **If** sponsored delegation is disabled (default) or the sponsor route errors, **then** the flow
  shall fall back to the existing self-paid `delegateChain7702` path (no regression).
- **If** the sponsor request is malformed (bad EOA, unsupported chain, ill-formed authorization tuple)
  or the relayer gas budget is exhausted, **then** the route shall reject it before broadcasting.
- **If** the authorization nonce is computed for the wrong submitter, **then** the delegation would
  revert — guarded by the pure `authorizationNonce` unit test (self = N+1, sponsor = N).

### Honesty (hard)
- The relayer pays **real** native gas; this is bounded by the existing R16 rolling-window gas guard.
- "Gas sponsorship" is a **new public claim** — it stays on the denylist until a **live sponsored
  delegation is verified on-chain** (eth_getCode(EOA) == `0xef0100 || delegate`), then gets a ledger row.
- Flag-gated (`NEXT_PUBLIC_SPONSORED_DELEGATION`, default **OFF**) so shipping is a no-op until verified.

## 4. Scope

### In scope
- `src/lib/particle/sponsored-delegation.ts` — pure: `authorizationNonce`, enable-flag read,
  request validation (supported chain, EOA shape, authorization-tuple shape) + `.test.ts` (TDD).
- `src/app/api/delegate/sponsor/route.ts` — relayer submits the type-4 tx (viem `authorizationList`),
  reusing the R16 relayer key + gas-budget guard; validates via the pure module.
- Client wiring (`src/lib/particle/delegation.ts` and/or `/pay`) — when enabled, sign auth → POST →
  await confirmation; fall back to self-paid delegation otherwise. Flag-gated.
- Docs: `.env.example` flag; risk-register entry (relayer gas surface); ledger denylist note (claim
  only after the live spike).

### Out of scope (cut)
- Sponsoring the settlement/payment gas (already abstracted to USDC by Particle) or the mandate charge.
- Any external paymaster (Pimlico/Circle) — not needed for this path.
- Changing `SpendPolicy`, the EIP-712 mandate, or the settlement flow.
- Removing the existing self-paid delegation path (kept as the fallback).

## 5. Definition of Done

- Pure core TDD-green (esp. `authorizationNonce`: self=N+1, sponsor=N; + validation guards).
- Sponsor route submits a relayer-paid type-4 tx and returns the delegation hash; rejects malformed /
  over-budget requests; gated + fallback intact.
- Gate green (typecheck / lint / test:unit / build).
- **Live spike (user-run):** a zero-native-gas payer delegates one chain via the relayer; RPC-verified
  `eth_getCode(EOA)` shows the delegate. Only then: flip the flag on + add the ledger claim.
- No change to settlement / SpendPolicy / EIP-712; positioning + hero untouched.

## Status: DRAFT — building the pure TDD core now; API + wiring + live spike follow; commit awaits "го"
