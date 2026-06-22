# Spec: x402-mandate-gateway — Tasks

> TDD-ordered. DoD per `methodology.md` §6. No live on-chain spend during the unattended block.
> Branch: direct-on-main acceptable (additive surface; all tests green before each step ends).

## Phase 1 — requirements lib (pure, TDD)

- [x] **T1. Failing tests: `requirements.test.ts`.** build402Response shape; encode/decode
      round-trip; decodePaymentHeader returns null on malformed base64/JSON/shape (never throws).
- [x] **T2. Implement `requirements.ts`.** Green.

## Phase 2 — catalog (pure, TDD)

- [x] **T3. Failing tests: `catalog.test.ts`.** 3 resources; getResource(unknown) -> null;
      prices match the design table; premium-dataset price > 0.10 (the block trigger).
- [x] **T4. Implement `catalog.ts`.** Green.

## Phase 3 — verify (pure, TDD)

- [x] **T5. Failing tests: `verify.test.ts`.** isPaymentSufficient ok path; reject wrong amount
      (too low), wrong asset, wrong payTo, wrong resource. Returns `{ok:false, reason}`.
- [x] **T6. Implement `verify.ts`.** Green.

## Phase 4 — 402-gated route

- [x] **T7. Implement `/api/x402/[resource]/route.ts`.**
  - 404 unknown resource; 402 + requirements when no proof; 402 + error on malformed/insufficient;
    200 + payload when the on-chain MandateCharged proof checks out.
  - Pure decision logic delegated to the libs; route does viem RPC read + orchestration.
- [x] **T8. Smoke the route unpaid.** `curl /api/x402/market-insight` -> 402 with requirements
      JSON. `curl /api/x402/nope` -> 404. `curl -H "X-PAYMENT: garbage"` -> 402 + error (not 500).
      Capture outputs.

## Phase 5 — /agent demo page (additive)

- [x] **T9. Build `/agent/page.tsx`.** Login + compact arm (agent_budget) + resource cards +
      reused `AgentTerminal` + `BudgetHud`. Wire the 402 handshake: GET -> 402 -> charge via
      `/api/mandates/charge` -> GET with X-PAYMENT -> 200/denied. Narrate each step.
- [x] **T10. Render-check `/agent`.** Dev server compiles; `curl /agent` 200; the page renders
      login -> (after login) catalog + terminal. NO live charge (costs real USDC; user runs later).

## Phase 6 — verify + docs

- [x] **T11. Full gate.** typecheck + lint + test:unit + build (dev stopped) all green. Restart dev.
- [x] **T12. Docs.**
  - master-tz §4: mark `x402-mandate-gateway` code-complete; elevate E5 to core in §2.
  - master-tz §7: verification row (live buy pending user).
  - demo-runbook: add Part C — "Agent commerce on x402, bounded by the mandate".
  - honest-claim-ledger: DRAFT row C17 (code-complete; live on-chain buy pending user). Keep it in
    a clearly-marked "pending live confirmation" state — do NOT assert it as proven.
  - risk register: add R-NEW-7/8/9 (RPC latency, proof replay in demo, x402 honesty framing).

## Acceptance

Spec closes when T1-T12 are done AND the user has run one live x402 buy + one over-budget block
(deferred — needs real USDC). Until then: status "code-complete, live run pending".

## Notes / progress log (filled as I go)

- (autonomous block 2026-06-21) ALL CODE TASKS DONE. T1-T6 libs (requirements/catalog/verify)
  TDD'd — 28 unit tests, 94 total green. T7 route `/api/x402/[resource]` built; T8 smoke-verified
  live: unpaid→402+requirements, unknown→404, malformed→402 (not 500), well-formed-but-fake-tx→402
  "payment tx not found on-chain yet" (on-chain verify really hit Arbitrum). T9 `/agent` page built
  (login + arm agent_budget + catalog + reused AgentTerminal/BudgetHud; buy() runs the real x402
  handshake with a mining poll). T10 render-checked (200, markers present, no runtime errors). T11
  full gate green: typecheck 0, lint 0, 94 tests, production build clean (19 routes). T12 docs done
  (master-tz E5 elevated to core + §4/§7; demo-runbook Part C; honest-claim C17 DRAFT; risk
  R9/R10/R11).
- **REMAINING (user-side, costs USDC):** run one live buy (market-insight 0.05 → resource
  delivered) + one over-budget block (premium-dataset 0.20 → blocked). Then promote C17 out of
  DRAFT and mark this spec fully closed.

## Status: CLOSED — proven live on Arbitrum 2026-06-21 (user ran $0.05 buy delivered + $0.20 over-cap blocked). C17 promoted out of DRAFT.
