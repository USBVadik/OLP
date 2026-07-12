# UA-Funded Expense Card — Tasks

## M1 — Specification and boundary

- [x] M1.1 Capture the product hypothesis and judge-facing reason.
- [x] M1.2 Define the no-send/no-sign/no-gas safety boundary.
- [x] M1.3 Define the kill rule before implementation.

## M2 — TDD intent builder

- [x] M2.1 Add failing tests for exact Arbitrum approve calldata and USDC display amount.
- [x] M2.2 Add failing tests for USDC-only route options.
- [x] M2.3 Add failing validation tests for amount, cap, chain, and addresses.
- [x] M2.4 Implement the minimum pure builder to make the tests pass.

## M3 — Debug-only probe

- [x] M3.1 Add a debug-flag-gated browser page using the existing Magic + Particle UA setup.
- [x] M3.2 Display balances and a clean build/preview matrix.
- [x] M3.3 Add a static safety test proving no signing or send APIs exist in the page.
- [x] M3.4 Keep raw Particle output behind a disclosure.

## M4 — Verification

- [x] M4.1 Run typecheck and lint.
- [x] M4.2 Run all unit and contract tests.
- [x] M4.3 Run production build.
- [x] M4.4 Review source for payment/API/contract/env changes.
- [x] M4.5 Run the browser probe and record an honest result; no send.

## Product integration gate

- [x] G1 Particle creates a rootHash-bearing preview.
- [x] G2 Preview exposes USDC source/destination chains.
- [x] G3 At least one source chain differs from Arbitrum.
- [x] G4 Approval target and amount exactly match SpendPolicy and the intended cap.
- [ ] G5 The next integration can preserve one legible consent and unattended later charges.

No product integration begins until G1–G5 are all true.
