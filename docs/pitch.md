# OneLink Pay — Pitch Kit

> For the UXmaxx submission + live demo. Every claim here is honest and traceable to
> `docs/honest-claim-ledger.md` and `docs/risk-register.md`. Primary track: Universal Accounts.
> Stacked: Arbitrum bounty + Magic bonus. Cross-chain value movement via UA is **proven live** (C21);
> zero-gas onboarding via sponsored 7702 delegation is live (C23).

## One-liner

**Give your AI agent a card, not your wallet.** OneLink Pay is the on-chain spending limit for the
agent economy.

## Elevator (≈20s)

Autonomous software is starting to buy data and tools, but the choices today are full wallet access
or constant human approval. OneLink Pay gives the workflow a scoped expense card on the user's own
Universal Account: per-charge, daily and total caps, expiry, one merchant, instant revoke. In our
live demo a research workflow buys two inputs, produces an ETH risk brief, and a buggy premium export
physically cannot exceed the signed limit. Particle handles execution; OneLink Pay handles consent,
limits, and proof.

## The problem

Three 2026 rails are converging and none of them enforce the limit at the user's account:

- **x402** (Coinbase, now wired into AWS) gives agents a way to pay over HTTP in USDC.
- **AP2** (Google, donated to FIDO) defines signed agent "mandates" — but as off-chain credentials.
- **EIP-7702** upgrades an EOA in place; its #1 documented risk is signing a delegation to malicious
  code (drainer phishing).

The missing piece: **nothing enforces the mandate on-chain, at the user's own account.**

## The solution

Sign one scoped mandate. The Universal Account can be charged only inside it; everything else
reverts; you can revoke instantly; every payment is provable. It's the on-chain guardrail that makes
agentic payments safe — an "AI-safe card", not a blank-cheque wallet.

## 90-second demo script (the wow)

| Time | On screen (do) | Say |
|------|----------------|-----|
| 0:00–0:10 | `/agent` completed result | "I gave this research workflow a ten-cent-per-tool card. It completed the task — and the unexpected twenty-cent export could not spend." |
| 0:10–0:25 | Mission + mandate card | "One merchant, 0.10 per tool, 2.00 per day, expiry and revoke. The policy is enforced on-chain, not trusted to the workflow." |
| 0:25–0:50 | **Run task with my budget** → two purchases → **Brief ready** | "It buys market insight for 0.05 and sentiment for 0.08, then produces this ETH risk brief. Useful work comes first; payment plumbing stays behind details." |
| 0:50–1:02 | Blocked premium export | "A buggy step asks for 0.20. SpendPolicy rejects it before settlement — no funds move and no gas is spent on the blocked attempt." |
| 1:02–1:14 | **Revoke budget** | "I still hold the kill switch. Revoke disarms the mandate on-chain." |
| 1:14–1:30 | Canonical `/receipt/<id>` | "The same Magic EOA is a Particle Universal Account. This verified payment sourced USDC from Base and settled on Arbitrum without a manual bridge, with a public receipt anyone can check." |

## Why it wins (rubric 40 / 30 / 20 / 10)

- **UX excellence (40%)** — Google/email onboarding, no seed phrase or extension; a *legible* mandate
  card (plain-English caps, EIP-712 hash tucked behind "show technical details") instead of a blind
  signature; a concrete task and useful brief; a live draining budget HUD; the visceral "unexpected
  spend blocked on-chain" moment; one-tap revoke; a shareable proof receipt (screen-reader-announced).
- **Universal Accounts + EIP-7702 (30%)** — a Magic EOA upgraded in place via EIP-7702 (same address
  across Base and Arbitrum); account-level mandate enforcement (`SpendPolicy`, 22 passing tests,
  deployed on Base + Arbitrum); one unified balance across chains via Particle `getPrimaryAssets`;
  directly answers the documented 7702 drainer risk with a scoped, revocable delegation.
  *(Cross-chain value movement via UA: proven live — C21.)*
- **Adoption potential (20%)** — a non-custodial expense-card layer for autonomous software buying
  paid data, inference, compute, storage, or APIs; the Research Agent is one concrete vertical; an
  x402-pattern gateway already ships, settled by the on-chain mandate.
- **Technical quality / polish (10%)** — 207 unit + 22 contract tests; typed end-to-end; the EIP-712
  mandate is byte-identical between contract and frontend; clean production build; honest claim
  ledger + risk register discipline.

## Tracks claimed

- **Universal Accounts Track (primary):** prominently uses Particle Universal Accounts in EIP-7702
  mode with Magic, for a chain-agnostic UX (meets the track requirement as written) + legible
  consent + on-chain enforcement + proof. Cross-chain value movement via UA is **proven live** (C21)
  — a merchant paid on Arbitrum with USDC sourced from Base, no manual bridge.
- **Arbitrum "Road to Open House London" Bounty:** SpendPolicy + ReceiptEmitter live on Arbitrum
  One; the firewall demo and default settlement run on Arbitrum (proven on-chain).
- **Magic Labs Bonus:** Google OAuth + email onboarding live; session persists across reload.

## Honest status (state this plainly to judges)

- **Live & proven on-chain (operator-verified):** EIP-7702 delegation; on-chain mandate enforcement +
  over-cap revert (`PerChargeExceeded`, zero gas); same-chain USDC checkout on Arbitrum; **cross-chain
  value movement via UA — a merchant paid on Arbitrum with USDC sourced from Base, no manual bridge
  (C21)**; **zero-gas onboarding — the one-time 7702 delegation is relayer-sponsored (C23)**; proof
  receipt (payer bound to the real on-chain sender); Magic Google + email login; unified cross-chain
  balance read; x402-pattern purchase, mandate-settled.
- **Not claimed:** a general gas paymaster — only the one-time 7702 delegation is sponsored (the
  settlement fee is paid in USDC). And this is the **x402 HTTP pattern** with a custom
  `onelink-mandate` settlement scheme — **not** Coinbase-facilitator wire-compatible. We say so.

## Verifiable on-chain (drop these in the submission)

- SpendPolicy (Arbitrum): `0x9782e3724859469fbBAC5085EA8bf8E70724164E`
- `MandateCharged` (Arbitrum, 0.10 USDC): `0x33a4e69e2d4f0a2a9269bf9fb758b3043cbae4c5e146e3e16cf9c75d439b9ced`
- SpendPolicy (Base): `0x73C862a8312c12C764487a9a484f1d1ad44E3957`
- ReceiptEmitter (Base): `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- EIP-7702 delegation (Base): `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- Research input 1 (Arbitrum, 0.05 USDC): `0xbe1b718305fd60b228e27c44156678e2c13fd1714510d8b9a02aa161814d7eb3`
- Research input 2 (Arbitrum, 0.08 USDC): `0xfaa29913ae64dd0731b21758d58529d5f08e7b007e306c282b05012661254aa8`
- Research budget revoke (Arbitrum): `0xe01a85f70d25acbda2d54f1dbe4350a055c0cf567658b0dbe015e643a3cd5aea`

## Stack (one line)

Next.js 14 + TypeScript · Magic (email/Google, EIP-7702) · Particle Universal Accounts SDK ·
Solidity 0.8.28 + OpenZeppelin (`SpendPolicy`, `ReceiptEmitter`) · Arbitrum + Base · Supabase.
