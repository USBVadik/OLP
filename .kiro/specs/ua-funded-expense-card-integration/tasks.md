# UA-Funded Expense Card Integration — Tasks

## M1 — TDD orchestration

- [x] M1.1 Test exact feature flag behavior.
- [x] M1.2 Test daily-cap funding amount selection.
- [x] M1.3 Test honest preview/fee/route summarization.
- [x] M1.4 Test unique delegation followed by one fresh rebuild.
- [x] M1.5 Test inline authorization signing and one send.
- [x] M1.6 Test FINISHED, terminal failure, and timeout behavior.

## M2 — Product integration

- [x] M2.1 Add an EVM-capable Magic instance without removing OAuth.
- [x] M2.2 Preserve the existing direct approval when the flag is off.
- [x] M2.3 Build the unsigned preview only when the flag is on.
- [x] M2.4 Render one legible consent sheet with real Particle route and fee data.
- [x] M2.5 Execute only from the explicit primary action and wait for FINISHED.
- [x] M2.6 Keep technical transaction details secondary.

## M3 — Verification

- [x] M3.1 Typecheck and lint.
- [x] M3.2 Unit and contract tests.
- [x] M3.3 Production build.
- [x] M3.4 Review active payment/API/contract behavior for regressions.
- [x] M3.5 Confirm no transaction, signature, or gas action was run.

## Live gate (requires explicit approval later)

- [ ] L1 One small Particle funding transaction reaches FINISHED.
- [ ] L2 Arbitrum allowance equals the intended daily funding amount.
- [ ] L3 Particle activity proves the actual source chain(s).
- [ ] L4 The armed agent buys within cap and rejects the over-cap resource.
