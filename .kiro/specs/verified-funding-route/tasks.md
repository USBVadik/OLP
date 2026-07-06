# Verified Funding Route — Tasks

- [ ] 1. Pure `deriveFundingRoute(activity, ctx)` + unit tests with a captured `fc5adc83` activity
      fixture (crossChain / same-chain / sender-receiver mismatch / non-finished status).
- [ ] 2. Server-safe `UniversalAccount` construction (Particle credentials helper usable outside a
      `"use client"` module).
- [ ] 3. `verifyFundingRoute(uaTransactionId, ctx)` — `getTransaction` with a ~2.5s timeout + try/catch
      + validation; always falls back to `client_reported`, never throws.
- [ ] 4. Thread `verification` into `/receipt/[id]` + `CrossChainRoute` label switch (keep
      settlement/proof legs + UniversalX link unchanged). Optionally `/success/[id]`.
- [ ] 5. Gate (typecheck / lint / unit / build) + live read re-verify on `fc5adc83`; confirm the
      fallback path renders "reported" for a missing/bogus id.
