# Spec: legible-mandate-card — Tasks

> TDD-ordered. DoD per `methodology.md` §6.
> Branch: `feat/legible-mandate-card`.

## Phase 0 — Read

- [x] **T0. Confirm `getMandateState` behavior on never-charged mandates.**
  - Read `contracts/contracts/SpendPolicy.sol` `getMandateState`.
  - Confirm: does it revert on a mandate-hash with no prior charge, or return zeros?
  - **DoD:** answer recorded as a comment in this task.

## Phase 1 — Pure helpers

- [x] **T1. Failing test: `formatUsdcAmount`.** `src/lib/mandates/format.test.ts`. Cases:
  - `100_000n` → `"0.10 USDC"`
  - `1_000_000n` → `"1.00 USDC"`
  - `123_456n` → `"0.123456 USDC"` (preserves precision when not a clean fraction)
  - `0n` → `"0.00 USDC"`
  - `1n` → `"0.000001 USDC"` (not silently rounded)
  - **DoD:** red.

- [x] **T2. Implement `formatUsdcAmount`.** `src/lib/mandates/format.ts`.
  - **DoD:** T1 green; lint/typecheck green.

- [x] **T3. Failing test: `formatMerchant`.** Cases: full address → `"0x8C54…1Fb7"`. Lowercase
      and mixed-case. Throws on non-`0x…` input.
  - **DoD:** red.

- [x] **T4. Implement `formatMerchant`.**
  - **DoD:** T3 green.

- [x] **T5. Failing test: `formatExpiry`.** Cases: 4h ahead → "Jun XX, HH:MM (in 4h 0m)";
      past → "(expired)"; right now → "(expired)". Use injected `now` for determinism.
  - **DoD:** red.

- [x] **T6. Implement `formatExpiry`.**
  - **DoD:** T5 green.

- [x] **T7. Failing test: `formatRemaining`.** Cases: half used → 50%; fully used → 100%
      with `display="0.00 / 0.10 USDC"`; over-cap (defensive) → clamp to 100%.
  - **DoD:** red.

- [x] **T8. Implement `formatRemaining`.**
  - **DoD:** T7 green.

- [x] **T9. Failing test: `formatCountdown`.** Cases: hours+minutes; minutes+seconds; ≤0 →
      `"expired"`; days for >24h.
  - **DoD:** red.

- [x] **T10. Implement `formatCountdown`.**
  - **DoD:** T9 green.

## Phase 2 — Hook

- [x] **T11. Failing test: `useMandateState`.** `src/hooks/use-mandate-state.test.ts`. Mock
      viem read; cases:
  - Initial returns `null` then state.
  - On `revoked: true`, polling stops.
  - On `expiry < now`, polling stops; status becomes `expired`.
  - `refetch()` triggers an extra read.
  - **DoD:** red.

- [x] **T12. Implement `useMandateState`.** `src/hooks/use-mandate-state.ts`. Per `design.md`
      §3.
  - **DoD:** T11 green.

## Phase 3 — Components

- [x] **T13. Failing component test: `mandate-card`.** `src/components/mandate-card.test.tsx`.
  - Renders merchant truncated.
  - Renders all four amounts using `formatUsdcAmount`.
  - Hash hidden by default.
  - Click "Show technical details" → reveals hash + domain + struct.
  - Copy button copies merchant to clipboard (assert via spy on `navigator.clipboard.writeText`).
  - **DoD:** red.

- [x] **T14. Implement `mandate-card.tsx`.** Per `design.md` §4.
  - **DoD:** T13 green; visual smoke at `/firewall`.

- [x] **T15. Failing component test: `budget-hud`.** Cases:
  - Armed state shows both bars + countdown text.
  - Revoked state shows scrim + "Revoked" label.
  - Expired state shows scrim + "Expired" label.
  - Countdown updates after a fake-timer tick.
  - **DoD:** red.

- [x] **T16. Implement `budget-hud.tsx`.** Per `design.md` §5.
  - **DoD:** T15 green.

## Phase 4 — Wire into firewall

- [x] **T17. Render `MandateCard` before sign in `permission-firewall.tsx`.**
  - Modify the arm flow: after the user fills caps, show the card; signing happens on a
    distinct "Confirm & sign" CTA.
  - **DoD:** typecheck/lint green; manual: visiting `/firewall`, the card renders before any
    signature is requested.

- [x] **T18. Replace static cap display with `BudgetHud` post-arm.**
  - Wire `useMandateState` once a mandate is armed. Pass `state` to `BudgetHud`.
  - **DoD:** typecheck/lint green; manual: arming on `/firewall` shows the HUD; HUD shows
    initial caps with full remaining.

- [x] **T19. Expose `refetch()` to peer specs.** Pull the hook one level up if needed so the
      agent-on-a-leash spec can call `refetch()` after a successful charge.
  - **DoD:** typecheck/lint green.

## Phase 5 — Manual verification

- [x] **T20. Full arm + charge + revoke check.**
  1. `/firewall` → arm mandate (small caps, e.g. `maxPerCharge=0.10`, `maxPerDay=0.20`,
     `total=0.50`, expiry +1h).
  2. See mandate card → click "Show technical details" → confirm hash + domain.
  3. Click "Confirm & sign" → sign.
  4. See HUD: today=0/0.20, total=0/0.50, countdown ~59m.
  5. Manual charge 0.10 → HUD updates within 5s: today=0.10/0.20, total=0.10/0.50.
  6. Manual charge 0.20 (over cap) → blocked (existing behavior; HUD unchanged).
  7. Revoke → HUD switches to Revoked state; countdown stops.
  - **DoD:** screenshots saved to `.kiro/specs/legible-mandate-card/verification/`:
      `card-pre-sign.png`, `hud-armed.png`, `hud-after-charge.png`,
      `hud-revoked.png`. Tx hashes recorded in this task.

## Phase 6 — Wrap-up

- [x] **T21. Update demo runbook.** `docs/demo-runbook.md`. Insert the "show the card"
      moment between the cap inputs and the signature; add the HUD reading to the post-arm
      narration.
  - **DoD:** dry-run rehearsal once.

- [x] **T22. Add claim ledger row C14.** "The mandate card displays merchant + caps + expiry
      in plain English before the user signs; the EIP-712 hash is disclosed only on demand."
      Proof artifact = `card-pre-sign.png` and `card-technical-expanded.png`.
  - Risk: `low`.
  - **DoD:** row added.

- [x] **T23. Close R8 partially in risk register.** This spec covers the "looks centralized"
      angle by making proof readable; full close is in `proof-receipt-polish` spec.
  - **DoD:** R8 mitigation notes updated.

- [x] **T24. Update master TZ verification trail.** Row in §7.
  - **DoD:** row exists.

- [ ] **T25. Squash-merge `feat/legible-mandate-card` to main.** _(deferred — no git commits made this session)_
  - Commit: `feat(E1): legible mandate card + budget HUD (E1.S1, E1.S4)`.
  - **DoD:** main builds clean.

## Acceptance for the spec

This spec is closed when:

- All EARS criteria in `requirements.md` §3 have either a green test or a manual checklist
  tick (T20).
- The `/firewall` page shows the card BEFORE every sign and the HUD AFTER every arm.
- Existing arm/charge/revoke flow is unregressed.
- `useMandateState` is consumable by `agent-on-a-leash-demo` for `refetch()` after charges.
