# Spec: one-tap-checkout — Design

> Process: `.kiro/steering/methodology.md` · Requirements: `./requirements.md`
> Principle: **re-orchestrate, don't rewrite.** Reuse `/pay`'s proven build + send functions
> verbatim; add a thin one-tap orchestrator behind a flag. Instant rollback via the flag.

## 1. Current flow (grounded in `src/app/pay/[id]/page.tsx`)

Preview step renders `PaymentSummary` (Trust Preview) + `PermissionFirewall` (concept) + balances,
then **two buttons**:
1. **"Build payment preview"** → `handleCreateTransaction`: builds the tx
   (`build7702Transaction` = `createUniversalTransaction` + `usePrimaryTokens:[USDC]`), computes the
   touched chains, pre-delegates each via `delegateChain7702` (blind), rebuilds, sets `transaction`
   state, POSTs `/api/payments/[id]/attempt`.
2. **"Confirm & pay"** → `handlePay` → `sendVia7702(transaction)`: signs inline 7702 auths + the
   rootHash (blind), `ua.sendTransaction(...)`, then `mark-paid` → success.

The two steps are coupled only by the `transaction` React state set between them.

## 2. One-tap orchestration (additive)

Make the two proven handlers composable, then chain them behind one button.

- **`handleCreateTransaction` returns the built tx** (in addition to `setTransaction`). Additive —
  existing caller ignores the return; the internals are unchanged.
- **`handlePay(txArg?)`** accepts an optional tx and falls back to the `transaction` state. Additive.
- **New `handlePayOneTap`:**
  ```
  setError(null); setStep("paying"); setPayPhase("Preparing your payment…");
  const tx = await handleCreateTransaction();   // build + pre-delegate (blind plumbing)
  if (!tx) return;                              // build failed -> error already surfaced
  await handlePay(tx);                          // sign rootHash + send + mark-paid -> success
  ```
  On any throw: existing error handling sets the error + a retryable state; **no funds moved**.

- **`PreviewStep`** gains an `oneTap` prop:
  - `oneTap` ON → render the Trust Preview + a single primary **"Pay {amount}"** button
    (`onClick=onPayOneTap`). No "Build payment preview" / "Confirm & pay" pair, no intermediate
    "Settlement preview" gate.
  - `oneTap` OFF → today's exact two-button flow (unchanged).

## 3. Progress + route visibility (no dead wait, route not hidden)

- On the Pay tap, switch to the existing **`paying`** UI immediately. Drive `payPhase`:
  - during build + pre-delegation: "Preparing route…"
  - during send/settle: "Signing & settling {amount} on {chain}…"
- Reuse the existing `CrossChainRoute status="routing"` animation in the paying step so a cross-chain
  payment shows **Base/Arbitrum → settlement** live. The exact route + USDC fee are visible by the
  paying phase (satisfies req §4 "route not hidden"), even though the explicit consent was the Trust
  Preview shown before the tap.

## 4. Feature flag (instant rollback)

- Module-level `const ONE_TAP = process.env.NEXT_PUBLIC_ONE_TAP_CHECKOUT === "true";` (mirrors how
  `PAYMENT_MODE` is read). Pass `oneTap={ONE_TAP}` into `PreviewStep`.
- **Default OFF** in prod until live-verified. Enable/disable via the Vercel env var; `NEXT_PUBLIC_`
  is inlined at build time, so set the var + redeploy (no code change). The two-step path is the fallback.

## 5. Why not eager-build (rejected)

Eager-building on preview entry would make the Trust Preview show the exact route/fee before the tap,
but it would **pre-delegate (on-chain, gas) before the user intends to pay** — surprising and costly
for a fresh user. Rejected: the build runs on the explicit Pay tap; the route/fee surface during the
paying phase instead. (The one-consent rule is satisfied either way; this choice avoids pre-intent
on-chain actions.)

## 6. Honesty & non-regression

- One-consent rule enforced by construction: one "Pay" tap = one spend; plumbing (delegation, inline
  auths, rootHash) is blind-signed, never the spend.
- Build/sign/send internals + `mandate`/`SpendPolicy`/cross-chain recipe unchanged; success + receipt
  + `mark-paid` identical.
- Flag default OFF → simple mode / current flow is the shipped default until verified.

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Reordering breaks the state coupling | Return the tx from build + pass it straight to send (no state round-trip); keep both handlers otherwise intact. |
| Build fails mid-tap after some delegation | Delegation is idempotent (checks `isDelegated`); on build/send error, surface the existing message + retry; no funds moved (spend is the last step). |
| Flag leaks / two-step regresses | `oneTap` is a pure prop; when OFF the branch renders today's JSX unchanged; test BOTH flag states in the gate. |
| Enabling before it's proven | Flag stays OFF in prod until the user runs a real one-tap same-chain AND cross-chain `/pay`, RPC-verified. |
| Cross-chain tap feels like a hang | `paying` UI + phase labels + route animation from tap start. |

## 8. Out of scope
- Any change to build/sign/send internals, the mandate, or the contract.
- Eager pre-build; removing Trust Preview or the Pay tap.
