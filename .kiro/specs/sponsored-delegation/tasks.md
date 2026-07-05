# Spec: sponsored-delegation — Tasks

> TDD (test-first, red→green) for the pure core; live-verify for the relayer/RPC + browser glue.
> Flag `NEXT_PUBLIC_SPONSORED_DELEGATION` default OFF. Commit only on explicit "го".

## Phase 1 — pure core (TDD) ← this pass

- [x] **T1. Failing tests** `src/lib/particle/sponsored-delegation.test.ts` (9 tests): authorizationNonce
  (self=N+1, sponsor=N, incl. N=0 + large), isSponsoredDelegationEnabled (fail-closed), and
  validateSponsorRequest (accepts valid; rejects non-object, bad payer, unsupported chain, chainId
  mismatch, malformed r/s/yParity/nonce/address).
- [x] **T2. Implement** `src/lib/particle/sponsored-delegation.ts` — GREEN (9/9). Pure, side-effect-free.

## Phase 2 — relayer route (live-verify glue)

- [x] **T3.** `src/app/api/delegate/sponsor/route.ts` DONE: server-side flag gate (403 when off → inert,
  no gas surface), `validateSponsorRequest` (400 on bad input), reuses the R16 relayer key + a rolling
  gas-budget guard (`RELAYER_MAX_DELEGATIONS_PER_WINDOW`, default 20; 429 when exhausted), submits the
  viem type-4 tx (`authorizationList`), returns `{ delegationTxHash, chainId, status }`. Broadcast is
  live-verified (T7). Diagnostics clean; viem authorizationList shape typechecks.

## Phase 3 — client wiring (flag-gated, fallback)

- [x] **T4.** `sponsoredDelegateChain` added to `src/lib/particle/delegation.ts` (sign auth with the
  sponsor nonce = authority's current nonce → POST /api/delegate/sponsor → poll until delegated;
  throws on failure). Wired into `/pay` via a local `delegateOrSponsor` wrapper that branches on
  `isSponsoredDelegationEnabled()` and falls back to the proven self-paid `delegateChain7702` on any
  sponsor error. Both delegation call sites (build loop + `ensureDelegated7702`) use it. Flag OFF
  (default) => byte-identical behavior to before. No change to settlement / SpendPolicy / EIP-712.
- [x] **T5.** `.env.example`: added `NEXT_PUBLIC_SPONSORED_DELEGATION=false` + the optional budget cap.

## Phase 4 — verify + live spike + claim

- [x] **T6. Gate:** typecheck 0, lint 0, test:unit 147 (incl. the 9 core guards), build clean.
- [ ] **T7. Live spike (user-run):** a payer with **0 native gas** on a chain delegates it via the
  relayer (relayer pays); RPC-verify `eth_getCode(payer)` == `0xef0100 || <delegate>`; then a payment
  completes end-to-end. Keep the relayer funded on the sponsored chain.
- [ ] **T8.** Only after T7: flip `NEXT_PUBLIC_SPONSORED_DELEGATION=true` on prod, add a ledger claim
  ("first-time payer delegates with zero native gas — relayer-sponsored 7702"), move gas sponsorship
  off the denylist (scoped to the delegation), add a risk-register entry for the relayer gas surface.

## Acceptance

Closes when T1–T7 done: a zero-gas payer completes a sponsored delegation (relayer-paid,
RPC-verified) and the payment settles; flag-gated with a clean fallback to the proven self-paid path;
gate green; no settlement/SpendPolicy/EIP-712 change. The public "gas sponsorship" claim lands only
after T7 (T8).

## Notes / progress log

- (Phase 1 in progress)

## Status: Phases 1–3 built (pure TDD core + relayer route + flag-gated wiring), gate green (147 unit).
Flag OFF by default → ships as a no-op. Next: **T7 live spike** (user-run, local flag ON in `.env.local`:
a 0-native-gas payer delegates a chain via the relayer, RPC-verify `eth_getCode`). Only after T7: flip
the prod flag + add the ledger claim (T8). Commit done incrementally; prod deploy of the flag-OFF code
awaits "го".
