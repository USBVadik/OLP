# OneLink Pay — Agent Operating Context

> Operating context for AI agents working on this repo. Read this plus `docs/status.md`
> before acting. Verified by Kiro on 2026-06-19 (see "Verification" at the bottom).

## Workspace

`/Users/usbdick/Documents/new-project/OneLink-Pay`

Do NOT silently switch to `/Users/usbdick/code/OneLink-Pay`. That is an older copy unless
explicitly requested. (Confirmed 2026-06-19: that older copy directory does exist.)

## Project

OneLink Pay is a consent + proof layer for Universal Accounts, not just a crypto checkout.

Core phrase: **Particle handles the rails. OneLink Pay handles consent, proof, and
permission safety.** (Positioning. Today the code delivers the proof + PAID state; the
consent / permission-safety pieces are concept-mode — keep claim discipline below.)

## Active working direction

- Magic embedded wallet
- Particle Universal Accounts
- Base mainnet
- `PAYMENT_MODE=universal_7702_transfer` as the current Universal Accounts Track candidate
- `createTransferTransaction` rail
- server-side USDC `Transfer` verification
- `ReceiptEmitter.recordVerifiedPayment` proof
- Supabase PAID state

## Fallback / stable mode

- `PAYMENT_MODE=transfer_fallback`

## Strict future path

- `PAYMENT_MODE=universal_invoice`
- `createUniversalTransaction` -> approve + payInvoice -> `InvoicePaid`
- currently blocked by Particle `-32801` maintenance/custom-call issue (V2 migration)
- do not make it default unless probes prove it works

## Proven live (2026-06-20 per prompt; environment clock showed 2026-06-19)

- Base EIP-7702 delegation succeeded.
- Owner EOA: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Delegation tx: `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- BaseScan: https://basescan.org/tx/0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0
- Particle reports Base `isDelegated=true` after delegation (true on-chain: EOA code is
  `0xef0100` + Particle delegate `0x6640c1cccaf07dbe765ec05e294fe427cc92831c`).
- `createTransferTransaction` builds after delegation with rootHash, fee quotes, and token
  changes. (See Verification note 1: `eip7702Delegated=true` on the post-delegation build
  was not yet captured in a log — re-run "Build transfer in 7702" once delegated to confirm.)

## Active ReceiptEmitter

- Address: `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- BaseScan: https://basescan.org/address/0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3
- Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Claim discipline

> Source of truth: `docs/honest-claim-ledger.md` (C1–C23) + `docs/risk-register.md`. This list is a
> quick guardrail; the ledger wins on any conflict. (Updated 2026-07-06 — the pre-2026-06-21 notes
> here were stale.)

- Cross-chain value movement via UA is **proven live** (C21) — claim it with the tx proof.
- Zero-gas onboarding is **live** — the one-time 7702 delegation is relayer-sponsored (C23). Do NOT
  claim a general gas paymaster (the settlement fee is paid in USDC).
- On-chain spend caps (SpendPolicy) are **live** on Base + Arbitrum (C1–C6) — not Concept Mode.
- Arbitrum is a **primary settlement chain** (live), not exploratory.
- Do not claim real session keys or automated future (unattended-recurring) payments.
- The x402 flow is the **pattern** (`onelink-mandate` scheme), not Coinbase-facilitator-compatible.
- The agent is an **unattended deterministic** loop — never claim an LLM / AI-reasoning agent.
- Particle AuthKit is installed but **inactive** — not on the live path.

## Constraints

- Do not spend mainnet gas unless explicitly approved (note: creating an invoice via
  `POST /api/payment-links` registers on-chain and spends owner gas — that counts).
- Do not send transactions unless explicitly approved.
- Do not change payment execution unless requested.
- Do not implement ZeroDev/AuthKit/Arbitrum migration.
- Do not print secrets.
- Do not touch `.env.local` except when explicitly asked.

## Start by reading

- `docs/status.md`
- `docs/integration-notes.md`
- `docs/particle-create-universal-repro.md`
- `supabase/schema.sql`
- `src/lib/config/payment.ts`
- `src/app/pay/[id]/page.tsx`

## Before claiming success, run

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:unit`

## Verification (Kiro, 2026-06-19)

Cross-checked this context against the repo — accurate. Specifics confirmed:

- Payment modes in `src/lib/config/payment.ts` are exactly
  `transfer_fallback | universal_invoice | universal_7702_transfer`.
- ReceiptEmitter + Base USDC addresses match `.env.local` / config.
- The three commands run clean (`typecheck` ok, `lint` "No ESLint warnings or errors",
  `test:unit` all pass). Plain `corepack pnpm` (pnpm 9.15) works for these scripts; only
  `pnpm add`/install needs the matching pnpm 10 (store v10).
- AuthKit not imported in `src`; ZeroDev not wired in. Arbitrum chain is `active: false`.
- Older copy `/Users/usbdick/code/OneLink-Pay` exists — the warning is valid.

Notes / slight nuances:

1. `eip7702Delegated=true` on a post-delegation `createTransferTransaction` build was not
   directly captured in a log. The build (pre-delegation) and the on-chain delegation were
   each confirmed separately. Re-run "Build transfer in 7702" while delegated to confirm.
2. Date label: "2026-06-20" per the source prompt; the environment clock read 2026-06-19.
   The delegation tx itself is the source of truth regardless of label.
