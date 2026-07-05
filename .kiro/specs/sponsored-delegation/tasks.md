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
- [x] **T7. Live spike — PASSED (2026-07-05).** Zero-native-gas payer delegated Arbitrum via the
  relayer: delegation tx `0x74ae6ad6…82615e8`, sender = relayer `0x0AC0…9f41` (RPC-verified ≠ payer,
  type 4, status 1), payer then delegated (`eth_getCode` = `0xef0100‖13E00E08…`); payment settled
  (invoice `03feedba`, Arbitrum `0x3ee25d54…`, Base proof `0x0242c24f…`). Two prior runs caught a
  client-inline bug (flag read via an aliased helper → Next doesn't inline it client-side) — fixed to
  a literal `process.env` read (commit `2e5f49f`).
- [x] **T8.** Flag `NEXT_PUBLIC_SPONSORED_DELEGATION` enabled on prod; ledger claim **C23** added; gas
  sponsorship now claimable scoped to the delegation step only; risk-register **R25** (relayer gas
  surface). NOTE: the prod env var is currently Sensitive (not inlined at build) so this deploy used
  `--build-env`; make it non-sensitive so normal deploys keep the client flag on.

## Acceptance

Closes when T1–T7 done: a zero-gas payer completes a sponsored delegation (relayer-paid,
RPC-verified) and the payment settles; flag-gated with a clean fallback to the proven self-paid path;
gate green; no settlement/SpendPolicy/EIP-712 change. The public "gas sponsorship" claim lands only
after T7 (T8).

## Notes / progress log

- (Phase 1 in progress)

## Status: SHIPPED + PROVEN LIVE (2026-07-05). Sponsored 7702 delegation works end-to-end on prod —
zero-gas payer, relayer-paid delegation (C23, RPC-verified). Flag-gated + self-paid fallback.
Follow-up (non-blocking): make the prod env var non-sensitive (so normal deploys keep the client flag
without `--build-env`); shared relayer gas limiter for non-demo prod (R25/R16).
