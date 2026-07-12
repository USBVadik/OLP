# UA-Funded Expense Card — Design

## Safety boundary

The spike ends at Particle transaction creation. A created transaction is an unsigned preview, not
an executed approval. The debug page deliberately has no signing or send controls.

## Modules

### 1. Pure intent builder

`src/lib/particle/expense-card-arm.ts`

`buildExpenseCardArmIntent(input)` returns:

- `request.chainId` — Arbitrum One (`42161`);
- `request.expectTokens` — USDC in a canonical human-readable amount;
- one transaction — `USDC.approve(SpendPolicy, amountAtomic)` with zero native value;
- `options.usePrimaryTokens` — USDC only;
- `options.slippageBps` — the same `100` used by the proven checkout path.

The module is pure and imports no browser/Magic APIs. Address and amount validation happen before
any Particle request.

### 2. Preview summarizer

Reuse `summarizeCrossChainPreview` and add only the missing debug facts locally:

- fee quote presence;
- token changes presence;
- user-op EIP-7702 auth/delegation details.

No new claim is derived from a rootHash alone. `crossChainCandidate` means preview evidence only.

### 3. Debug-only page

`src/app/debug/ua-expense-card-probe/page.tsx`

Flow:

1. Render disabled stub unless the debug flag is true.
2. Connect with the existing Magic email session.
3. Resolve the EOA and instantiate `createUniversal7702Account(ownerAddress)`.
4. Read `getPrimaryAssets()` for operator context.
5. Build the approval intent with an operator-selected small amount.
6. Call `createUniversalTransaction(request, options)`.
7. Render the clean preview matrix and raw result behind a disclosure.

The source file must contain no `sendTransaction`, `personal_sign`, `signMessage`,
`sign7702Authorization`, or `send7702Transaction` invocation.

## Why approve-only first

It is the smallest experiment that tests whether Particle can prepare an Arbitrum allowance from
the unified balance without changing the live agent flow. A combined `approve + charge` probe is a
second step only if approve-only preview semantics are valid and honest.

## Test plan

- TDD unit tests for exact calldata, display amount, options, and validation failures.
- Static safety test reads the debug-page source and rejects every signing/sending method.
- Typecheck, lint, all unit tests, 22 contract tests, and production build.
- Browser runtime run only after code review; build/preview only.
