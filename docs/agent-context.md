# OneLink Pay — Agent Operating Context

> Operating context for AI agents working on this repo. Read this plus `docs/status.md`
> before acting. Last synchronized with submission RC2 on 2026-07-12.

## Workspace

`/Users/usbdick/Documents/new-project/OneLink-Pay`

Do NOT silently switch to `/Users/usbdick/code/OneLink-Pay`. That is an older copy unless
explicitly requested. (Confirmed 2026-06-19: that older copy directory does exist.)

## Project

OneLink Pay is a consent + proof layer for Universal Accounts, not just a crypto checkout.

Core phrase: **Particle handles the rails. OneLink Pay handles consent, proof, and
permission safety.** This is live product behavior: Trust Preview, on-chain SpendPolicy limits,
revoke, server-verified settlement, Proof Receipt, and PAID state. Real session keys and LLM
reasoning are not implemented; keep the narrower claim discipline below.

## Active working direction

- Magic embedded wallet
- Particle Universal Accounts
- Base + Arbitrum One (Arbitrum-first settlement); cross-chain via Particle UA (C21). UA SDK pinned stable `2.0.3`.
- `PAYMENT_MODE=universal_7702_transfer` as the current Universal Accounts Track candidate
- `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-routed-chain EIP-7702 pre-delegation
- server-side USDC `Transfer` verification
- `ReceiptEmitter.recordVerifiedPayment` proof
- Supabase PAID state
- `SpendPolicy` merchant/per-charge/daily/total/expiry/revoke enforcement on Arbitrum and Base
- Research Agent Expense Card as the primary use case: paid inputs -> useful brief -> over-cap block -> on-chain revoke
- Default-off `NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT` integration: live unsigned Particle preview for
  funding the Arbitrum daily budget from unified USDC; execution code is implemented but not yet
  broadcast or eligible for a live claim

## Fallback / stable mode

- `PAYMENT_MODE=transfer_fallback`

## Inactive strict invoice path

- `PAYMENT_MODE=universal_invoice`
- `createUniversalTransaction` -> approve + payInvoice -> `InvoicePaid`
- not the active payment path; the deployed product settles via direct verified USDC transfer
- the historical `-32801` custom-call maintenance issue is resolved for the active V2 universal transaction rail
- do not make this mode default without a fresh, separately verified `approve + payInvoice` run

## Proven live

- Base EIP-7702 delegation succeeded.
- Owner EOA: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Delegation tx: `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- BaseScan: https://basescan.org/tx/0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0
- Particle reports Base `isDelegated=true` after delegation (true on-chain: EOA code is
  `0xef0100` + Particle delegate `0x6640c1cccaf07dbe765ec05e294fe427cc92831c`).
- Cross-chain value movement is proven on stable UA SDK `2.0.3`: Base-funded USDC settled to a merchant on Arbitrum through `createUniversalTransaction`, without a manual bridge (C21).
- The Research Agent Expense Card was live-verified on Arbitrum on 2026-07-12: `0.05 + 0.08 USDC` paid for two inputs, a useful brief produced, and an unexpected `0.20 USDC` export blocked before settlement (C25).
- One-click `/agent` revoke was live-verified through a successful `MandateRevoked` transaction on Arbitrum (C26).

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
- Do not claim that the integrated Research Agent Expense Card was funded cross-chain. Its Particle
  `Arbitrum + Base -> Arbitrum` preview is proven; the feature-gated send path still needs one
  explicitly approved live verification.
- The x402 flow is the **pattern** (`onelink-mandate` scheme), not Coinbase-facilitator-compatible.
- The agent is an **unattended deterministic** loop — never claim an LLM / AI-reasoning agent.
- Particle AuthKit is **not installed** and is not on the live path.

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

## Verification (submission RC2, 2026-07-12)

Cross-checked against the RC2 repository and live evidence:

- Payment modes remain `transfer_fallback | universal_invoice | universal_7702_transfer`; prod uses `universal_7702_transfer`.
- Particle UA SDK is pinned to stable `2.0.3`; AuthKit and ZeroDev are absent from the active stack.
- Arbitrum is the primary settlement and SpendPolicy chain; Base remains a supported source/proof chain.
- `submission-rc2` points to `c1f051a` and includes the Research Agent Expense Card plus one-click revoke.
- Current local gate: typecheck, lint, 251 unit tests, 22 contract tests, and production build.
  The last deployed `origin/main` baseline passed 7/7 HTTP smoke checks; rerun smoke after this
  local batch is pushed and deployed.
- Live proof details belong in `docs/honest-claim-ledger.md`, `docs/proof-pack.md`, and `docs/research-agent-expense-card-spec.md`; those artifacts override narrative summaries.
