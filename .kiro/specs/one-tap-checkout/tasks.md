# Spec: one-tap-checkout — Tasks

> Process: `.kiro/steering/methodology.md` · Requirements: `./requirements.md` · Design: `./design.md`
> Touches the payment path → feature-flagged, default OFF, reuse proven functions, live-verify before
> enabling. Check a box only when verifiably true.

## Implementation (all in `src/app/pay/[id]/page.tsx` + PreviewStep)

- [ ] **B1 — Make handlers composable (additive, no internal rewrite)**
  - [ ] `handleCreateTransaction` returns the built `tx` (keeps `setTransaction` too).
  - [ ] `handlePay(txArg?)` uses `txArg ?? transaction` (defaults to today's behaviour).
- [ ] **B2 — One-tap orchestrator** `handlePayOneTap`: set `paying` + phase → `const tx = await
      handleCreateTransaction()` → guard `!tx` → `await handlePay(tx)`. Errors reuse existing
      handling; no funds moved on failure.
- [ ] **B3 — Feature flag** `const ONE_TAP = process.env.NEXT_PUBLIC_ONE_TAP_CHECKOUT === "true";`
      passed as `oneTap` into `PreviewStep`.
- [ ] **B4 — PreviewStep branch**
  - [ ] `oneTap` ON → Trust Preview + single **"Pay {amount}"** (→ `onPayOneTap`); no build-preview
        step, no intermediate settlement-preview gate.
  - [ ] `oneTap` OFF → today's two-button flow **byte-identical**.
- [ ] **B5 — Progress + route** drive `payPhase` ("Preparing route…" → "Signing & settling…") and
      reuse `CrossChainRoute status="routing"` from the tap; keep the honest error/retry states.
- [ ] a11y: single action keyboard-operable, busy/disabled state, aria-live phase updates, reduced-motion.

## Gate (before deploy; flag OFF)

- [ ] `corepack pnpm typecheck` / `pnpm lint` / `pnpm test:unit` / `pnpm build` green.
- [ ] Manual, **flag OFF**: `/pay` renders today's two-step flow unchanged (byte-identical).
- [ ] Manual, **flag ON (local/preview)**: preview shows Trust Preview + one "Pay {amount}";
      tapping drives paying phases; error path retryable.

## Deploy (flag OFF in prod)

- [ ] Ship with `NEXT_PUBLIC_ONE_TAP_CHECKOUT` unset/false in prod → zero behaviour change live.

## Live-verify (user-run; only then enable)

- [ ] Enable the flag on a preview/prod deploy; run a **same-chain** one-tap `/pay` → settles + proof;
      record tx.
- [ ] Run a **cross-chain** one-tap `/pay` (Arbitrum→Base or Base→Arbitrum) → settles, "Cross-chain"
      badge, no bridge; record txs + RPC-verify (status 1, merchant credited).
- [ ] Confirm the single tap surfaced route/fee by the paying phase and never bypassed the Trust
      Preview consent.

## Record (after live-verify)

- [ ] `docs/honest-claim-ledger.md`: note one-tap checkout live (UX), flag ON, with the verified txs;
      no new capability claim (same settle+proof, fewer taps).
- [ ] Demo-runbook: update Act 1 to the one-tap flow ("read the Trust Preview → one tap → settled +
      proof"). Keep the two-step note as the flag-OFF fallback.

## Non-regression checklist (confirm at PR)

- [ ] Flag OFF = current two-step flow unchanged (default shipped).
- [ ] Build/sign/send internals, `PaymentMandate`/`SpendPolicy`, cross-chain recipe untouched.
- [ ] Trust Preview + explicit Pay tap preserved (one-consent rule); no auto-pay, no eager pre-build.
- [ ] Canonical positioning + hero untouched.
