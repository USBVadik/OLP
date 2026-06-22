# Spec: legible-mandate-card — Requirements

> Epic: **E1. AI-safe card narrative + agent-on-a-leash demo**
> Stories: **E1.S1 (HUD)**, partial **E1.S4 (legibility)**
> Priority: **P1** (Block A, target close: 2026-06-23 EOD)
> Estimated effort: **4h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

Two of the deep-research reports flagged blind signing as the #1 documented risk of EIP-7702
in the wild. Two flagged "judges don't grok the firewall in <30s" as the #1 risk to the UX
score (`risk-register.md` R2). This spec ships the answer to both with one component pair:

1. **Mandate card** — before the user signs, render the mandate's economic effect in plain
   English (merchant address, max-per-charge in USDC, daily/total caps, expiry, "revocable
   anytime"). The EIP-712 hash is hidden behind a "Show technical details" disclosure.
2. **Budget HUD** — once armed, show a live "remaining today / remaining total / expires in"
   widget on `/firewall` so the abstract mandate becomes tangible during the demo.

These two surfaces convert "permission-safety layer" into "credit card with a leash" UX.

## 2. User stories covered

- **E1.S1 (HUD partial)** — the budget HUD is the visible state that updates after each
  agent charge.
- **E1.S4 (partial)** — visitors arriving on `/firewall` understand the product within seconds
  because the mandate's economic effect is legible at sign time.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The mandate card shall display: merchant address (truncated middle, copy button),
  max-per-charge in USDC, daily cap in USDC, total cap in USDC, expiry as a localized date
  string, "revocable anytime" badge.
- The mandate card shall NOT display the EIP-712 mandate hash unless the user clicks
  "Show technical details".
- The budget HUD shall display: remaining today (USDC + percent of cap), remaining total (USDC
  + percent of cap), expiry countdown.
- All USDC amounts shall be rendered in human-readable form (e.g. `0.10 USDC`), not in atomic
  units.

### Event-driven
- **When** the operator opens the firewall arm flow, **the system shall** render the mandate
  card BEFORE the EIP-712 signature is requested.
- **When** a charge transaction is confirmed, **the system shall** refresh the budget HUD
  state from `SpendPolicy.getMandateState(...)` within 5 seconds.
- **When** the operator clicks "Revoke", **the system shall** transition the budget HUD to a
  `Revoked` state and stop the countdown.
- **When** the operator clicks "Show technical details", **the system shall** reveal the
  EIP-712 hash, type hash, domain, and raw struct for inspection.

### State-driven
- **While** a mandate is armed and not expired or revoked, **the system shall** continuously
  decrement the expiry countdown at 1Hz resolution.
- **While** the mandate is expired, **the system shall** display the budget HUD in an
  `Expired` state and disable any active controls.

### Unwanted-behavior
- **If** `getMandateState` returns an error (RPC, network), **the system shall** show a small
  "Refreshing…" indicator with a retry control, NOT a blank or broken HUD.
- **If** the displayed amount would round to zero due to formatting, **the system shall**
  display the exact 6-decimal value rather than rounding silently.

## 4. Scope

### In scope
- Pure formatting helpers (USDC amount, expiry, merchant truncation, remaining %).
- `MandateCard` component (legible card shown before signing).
- `BudgetHud` component (post-arm state).
- Wiring both into `permission-firewall.tsx`.
- Refetch-on-charge hook for HUD freshness.

### Out of scope (cut)
- Editing mandates after they are armed.
- Multiple concurrent mandates per address.
- A separate `MandateExplainer` modal — disclosure pattern in the card itself is sufficient.

## 5. Dependencies

- ✅ `SpendPolicy.getMandateState(...)` view already exists.
- ✅ `src/lib/contracts/spend-policy.ts` already exposes the ABI helpers.
- ✅ `src/lib/mandates/types.ts` already defines the `PaymentMandate` type.
- ↪ Coordinates with `agent-on-a-leash-demo` spec — that spec triggers charges; this spec
  shows the budget update. A small contract-level hook (`onChargeSettled`) is shared.

## 6. INVEST check

- **I**ndependent — does not block on E2 (cross-chain), E3 (Magic OAuth), or
  `agent-on-a-leash-demo`. Ships independently and renders cleanly even before agent buttons
  exist. ✅
- **N**egotiable — visual treatment open. ✅
- **V**aluable — UX 40% directly + UA 30% (legibility of EIP-7702 mandate). ✅
- **E**stimable — 4h. ✅
- **S**mall — pure helpers + 2 components + a hook. ✅
- **T**estable — every formatting helper is purely functional and unit-tested; HUD/card render
  tests cover the edge cases. ✅

## 7. Definition of Done

Spec is closed when:

- All EARS criteria are testable and have either a green test or a ticked manual checklist
  row.
- Existing arm/charge/revoke flow on `/firewall` is not regressed.
- The mandate card is visible BEFORE every sign attempt, and the budget HUD is visible after
  every successful arm.
- Verification trail row in `master-tz.md` §7 is filled.
