# Rules Watch

> **SUPERSEDED / HISTORICAL (kickoff-era planning, 2026-05).** This file reflects
> the early Base-active / Arbitrum-exploratory / `transfer_fallback` plan that was
> later reversed. Current reality: Arbitrum-first settlement,
> `universal_7702_transfer`, and cross-chain payment proven live in ledger C21.
> Source of truth: `docs/status.md`, `docs/agent-context.md`,
> `docs/honest-claim-ledger.md`, and `docs/demo-runbook.md`. Kept for trace only;
> do not act on the chain or payment-mode directives below.

Last updated: 2026-05-07

This document tracks what we currently know before the official UXmaxx kickoff. Treat it as planning context, not final submission truth.

Public source checked:

- CompeteHub UXmaxx Hackathon page: `https://www.competehub.dev/en/competitions/encodeclub_uxmaxx-hackathon`, which summarizes the current public placeholder information.

Private/contextual guidance from Carlos:

- The current public page is a placeholder.
- Final partners, prizes, requirements, and judging details may change.
- Lightweight prep and prototyping are fine.
- Magic is a good wallet direction.
- Arbitrum is worth exploring.

## 1. Current Known Placeholder Rules

Current public judging criteria:

- UX & Design: 45%.
- Technical Implementation: 25%.
- Creativity & Ambition: 20%.
- Completeness: 10%.

Current public technical requirements:

- Use Particle Universal Accounts SDK in EIP-7702 mode.
- Use an embedded wallet such as Magic or Openfort, or managed server-side wallet flow.
- Include partner technologies where applicable.
- Include at least one cross-chain operation.
- Provide a functional demo, either deployed or runnable locally.

Working interpretation for OneLink Pay:

- UX matters more than raw protocol cleverness.
- The demo must hide wallet, chain, bridge, and gas complexity.
- Technical points likely depend on real use of Particle Universal Accounts and EIP-7702, not just branding.
- Completeness means one clean end-to-end path beats many half-built features.

## 2. Carlos Comments

Treat these as helpful pre-kickoff guidance, not final written rules:

- Lightweight prep and prototyping are fine.
- The current public page is a placeholder.
- Magic is a good wallet direction.
- Arbitrum is worth exploring.

## 3. Current Technical Direction

Current project interpretation:

- Active wallet: Magic.
- Active chain abstraction: Particle Universal Accounts.
- Active chain: Base mainnet.
- Exploratory chain: Arbitrum One.
- Active payment mode: `transfer_fallback`.
- Strict path: `universal_invoice`, gated behind `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`.

## 4. Unstable Or Placeholder Elements

These can change after kickoff:

- Final judging rubric and weights.
- Exact definition of “cross-chain operation”.
- Whether a Particle SEND/TRANSFER flow plus verified proof is acceptable if custom calls remain under maintenance.
- Whether `createUniversalTransaction()` custom calls are expected, required, allowlisted, or temporarily unavailable.
- Final partner list.
- Prize amounts and sponsor bounties.
- Required deployment chain or preferred demo chain.
- Whether Arbitrum receives explicit sponsor preference.
- Submission requirements, video requirements, repo timing, and allowed pre-work.

Do not build irreversible scope around any unstable item before kickoff.

## 5. What Our Prototype Currently Satisfies

Current prototype status:

- Magic embedded wallet login works.
- Particle UA initialization works.
- `getPrimaryAssets()` works.
- Base mainnet USDC transfer through Particle `createTransferTransaction()` works.
- Human-readable transfer preview exists before payment.
- Base mainnet ReceiptEmitter v1.1 is deployed.
- Invoice registration works on-chain.
- Backend verifies Base USDC `Transfer` server-side.
- Backend records `ReceiptEmitter.InvoicePaid` proof via `recordVerifiedPayment`.
- Supabase records payment/link status as completed after verification.
- Dashboard shows PAID/proof status.
- Arbitrum probe config exists and is documented as exploratory.
- Strict `createUniversalTransaction()` custom-call blocker is documented with exact `-32801` maintenance error.

## 6. What Remains Pending

Pending until final rules and SDK behavior are confirmed:

- A proven cross-chain operation that satisfies the final rule wording.
- Confirmation from Particle/Encode that transfer fallback is acceptable if custom calls remain blocked.
- Fresh probe matrix after kickoff and after checking latest SDK/docs.
- Decision between Base-only, Arbitrum-only, or later dual-chain support.
- Decision whether to keep fallback path or revive strict `approve + payInvoice`.
- Any final partner-specific integration.
- Any final submission packaging, pitch, and video work.

## 7. Decision Matrix For Final Partner Requirements

| Final partner requirement | Decision |
|---|---|
| `createUniversalTransaction()` custom calls work after kickoff | Switch `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`, retest `approve + payInvoice`, then build around direct ReceiptEmitter payment. |
| Custom calls still return `-32801`, but transfer rail is accepted | Keep `transfer_fallback`: Particle transfer -> server verifies USDC `Transfer` -> ReceiptEmitter proof -> Supabase PAID. |
| Cross-chain operation must be explicit and transfer fallback on Base is not enough | Rerun Base and Arbitrum probes, then choose the smallest real cross-chain Particle-supported flow. |
| Arbitrum is sponsor-preferred and probes work | Consider Arbitrum as final target chain before doing more Base work. |
| Arbitrum custom calls also fail and transfer rail is weaker than Base | Keep Base as active chain, document Arbitrum as explored but not selected. |
| Magic remains accepted/recommended | Keep Magic as active wallet/auth path. |
| Magic has a final-rule issue | Evaluate Openfort or managed server-side path only after confirming the issue. |
| Partner tech requirements expand | Add only the smallest qualifying partner integration after core checkout is stable. |
| Particle AuthKit becomes mandatory | Timebox an AuthKit spike and compare it against the working Magic path before migrating. |
| ZeroDev/Repeat-Pay becomes a bounty target but core payment is unstable | Cut stretch; do not trade core checkout reliability for optional caps. |

## 8. What Not To Overclaim

Do not claim:

- Cross-chain payment is fully proven unless we have a final-rule-compliant cross-chain transaction.
- `createUniversalTransaction(approve + payInvoice)` works while it still returns `-32801`.
- Particle AuthKit is active; it is installed but not used in checkout.
- Arbitrum is active; it is exploratory only.
- ZeroDev or Repeat-Pay Caps are implemented.
- Merchant auth is implemented.
- Multi-token support is implemented.
- The fallback is equivalent to strict `payInvoice`; it is a verified Particle transfer plus on-chain proof.
- The public placeholder page is final.

Allowed phrasing for the current prototype:

- “Pre-hackathon prototype.”
- “Magic + Particle UA transfer fallback works on Base.”
- “Backend verifies the USDC Transfer server-side before marking paid.”
- “ReceiptEmitter records an on-chain proof after verification.”
- “Strict custom universal calls are currently blocked by Particle `-32801` maintenance in this project.”
- “Arbitrum has been explored but is not the active product chain yet.”
