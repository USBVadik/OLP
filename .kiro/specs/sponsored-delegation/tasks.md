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

- [ ] **T3.** `src/app/api/delegate/sponsor/route.ts`: validate via the pure module; reuse the R16
  relayer key + gas-budget guard; submit the viem type-4 tx (`authorizationList`); return the
  delegation tx hash. Unit-test the validation/budget branches; the broadcast is live-verified.

## Phase 3 — client wiring (flag-gated, fallback)

- [ ] **T4.** `sponsoredDelegateChain` in `src/lib/particle/delegation.ts`; branch in the delegation
  step (`isSponsoredDelegationEnabled()` → sponsored, else self-paid); fall back to self-paid on any
  sponsor error. No change to settlement / SpendPolicy / EIP-712.
- [ ] **T5.** `.env.example`: add `NEXT_PUBLIC_SPONSORED_DELEGATION=false` with a comment.

## Phase 4 — verify + live spike + claim

- [ ] **T6. Gate:** typecheck 0, lint 0, test:unit green (incl. T1), build clean.
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

## Status: DRAFT — Phase 1 (pure TDD core) building now; commit/deploy + live spike await "го"
