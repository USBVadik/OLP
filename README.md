# OneLink Pay

**On-chain spending limits for the agent era.** Sign one scoped mandate; your AI agent (or a merchant) can charge USDC — but only inside the per-charge, daily, and total caps you approved. Over-cap, off-merchant, or post-revoke charges revert on-chain at zero gas. Every payment ships a public, verifiable proof receipt.

Built for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon) (Encode Club + 7702 Collective).

## Evaluate in 2 minutes (for judges)

**Live app:** https://onelink-pay.vercel.app

**No login or wallet needed — verify the core claims right now:**

1. **Watch the 90-second replay** → [`/demo-replay`](https://onelink-pay.vercel.app/demo-replay): both wow moments — cross-chain checkout and the agent blocked on-chain — with the same proof links.
2. **Verify the cross-chain payment yourself (~60s)** → open the live receipt [`/receipt/fc5adc83…`](https://onelink-pay.vercel.app/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5); every tx is on arbiscan/basescan (settled on Arbitrum, USDC sourced from Base, InvoicePaid on Base). Full evidence: [`docs/proof-pack.md`](docs/proof-pack.md).
3. **What's real vs pattern vs future** is stated plainly in-app at [`/trust`](https://onelink-pay.vercel.app/trust).

**Explore the live product** (the live buttons run on our funded demo account — we can drive it on stage):

- **Agent on a leash** → `/agent`: arm a budget → **Send the agent** → it buys within the caps and is **blocked on-chain** on the over-cap call (no funds moved, zero gas) → revoke.
- **Cross-chain checkout** → `/pay`: Magic login → a merchant is paid on Arbitrum with USDC sourced from Base (no manual bridge) → public proof receipt.

**Prize fit:** Particle Universal Accounts + EIP-7702 (cross-chain, chain-abstracted UX) · Magic (walletless Google/email login) · Arbitrum (USDC settlement + on-chain mandate enforcement).

Full talk track, judging-criteria map, and dry-run checklist: [`docs/demo-runbook.md`](docs/demo-runbook.md).

## What's live

- **Permission Firewall** — `SpendPolicy.sol` enforces an EIP-712 `PaymentMandate` (per-charge / daily / total caps + expiry + single-merchant + revoke). Deployed on Base (`0x73C8…3957`) and Arbitrum One (`0x9782…164E`). Over-cap charges revert with `PerChargeExceeded` at zero gas. 22 Hardhat tests pass.
- **Cross-chain settlement via Particle Universal Account (EIP-7702)** — a Magic-signed UA pays a merchant on Arbitrum with USDC sourced cross-chain from Base in one operation — no manual bridge. Proven live (Arbitrum settle `0x85d8…4911`, Base source `0x8b85…4a2e`, UniversalX `0x0654e81cfea86a`) and wired into `/pay` (`NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`, live in prod). Same-chain checkout runs on the same path.
- **Agent on a leash (x402-pattern)** — `/agent` runs the real x402 HTTP handshake (`GET → 402 → pay → retry-with-proof → 200`) settled through the on-chain mandate, so an agent's per-call spend is bounded by the caps. Within-cap buys succeed; over-cap calls are refused before any funds move. Proven live on Arbitrum. Settlement scheme is `onelink-mandate` (the x402 *pattern*, not the Coinbase facilitator).
- **Legible consent** — a plain-English mandate card before signing (EIP-712 hash behind a disclosure) and a live budget HUD that drains from on-chain `SpendPolicy` state.
- **Proof receipts** — `ReceiptEmitter.sol` emits an `InvoicePaid` event after server-side verification of the on-chain USDC `Transfer`. Public, shareable receipt at `/receipt/[id]` (copy-link + QR) with a "Cross-chain: Base → Arbitrum" badge and a UniversalX activity link. Deployed on Base (`0x89CF…5bC3`) and Arbitrum One (`0xe4C6…D2A1`).
- **Walletless onboarding** — Magic embedded wallet, email + Google OAuth (live, with auto-detect on reload).
- **EIP-7702 delegation** — Magic EOA delegated in-place via Particle UA (`useEIP7702: true`), proven on Base (tx `0x4ca6…cef0`).

## Honest scope

- ✅ The on-chain firewall is live and tested (22 Hardhat tests pass).
- ✅ Same-chain USDC checkout is proven end-to-end on Arbitrum, with proof anchored on Base.
- ✅ Cross-chain value movement via the Universal Account is **proven live** on `@particle-network/universal-account-sdk@2.0.3` (stable): a merchant is paid on Arbitrum with USDC sourced cross-chain from Base in one operation. The active `/pay` rail is `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation to the V2 7702 delegate; `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer` is live in prod.
- ✅ Zero-gas onboarding is live: the one-time EIP-7702 delegation is relayer-sponsored (C23), so a first-time payer needs zero native gas — scoped to the delegation step only (no general settlement paymaster; the settlement fee is paid in USDC). Particle AuthKit is installed but not on the live path.

**Honesty caveats:**

- The cross-chain settlement is independently verified on-chain and was re-run live through the prod `/pay` on the stable `2.0.3` build (2026-07-04); a first-time payer needs zero native gas — the one-time 7702 delegation is relayer-sponsored (C23).
- Prod runs the pinned **stable** Particle SDK (`2.0.3`) — real EIP-7702 + cross-chain, with same-chain and cross-chain settlement live-verified on it (RPC-checked, 2026-07-04).
- `/agent` uses the x402 **pattern** with a custom `onelink-mandate` settlement scheme — not the Coinbase EIP-3009 facilitator. The on-chain enforcement is real; the "agent" runs a real **unattended deterministic** loop over the same firewall (one click, then no human per-step) — not an LLM that reasons, so no AI decision-making is claimed.
- `@particle-network/authkit` is installed but is not used in the active flow. AuthKit should not be described as the live demo wallet/auth path.

## How OneLink compares (prior art)

Scoped spend permissions are not new — OneLink builds on the wave rather than reinventing it. The wedge is the packaging: an on-chain, revocable mandate bound to the **x402** agent-payment rail, entered through a **Particle Universal Account + EIP-7702**, with a public proof receipt.

| Prior art | What it is | Where OneLink differs |
|-----------|-----------|------------------------|
| [Coinbase / Base Spend Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions) | Allowance (token, period, amount) + revoke for smart wallets | Wallet-agnostic — the mandate lives on the 7702 Universal Account, not a specific smart wallet; adds a public proof receipt + x402 binding |
| [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715) / [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) | Emerging standard: wallet-granted scoped permissions + delegation | A focused, auditable payments-specific mandate aligned to that vocabulary, shipping today |
| [ZeroDev session keys](https://docs.zerodev.app/smart-accounts/permissions/intro) | Low-level account-layer delegation (rate limits, allowed calls) | We enforce a payment policy (per-charge / daily / total / merchant) with legible consent + on-chain proof |
| [Google AP2](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol/) | Agent "mandates" as off-chain Verifiable Credentials | Same word "mandate", but enforced on-chain at the user's account — a promise becomes a guarantee |
| [x402 (Coinbase)](https://docs.x402.org/) | HTTP 402 pay-per-call rail for agents; no spend controls | OneLink is the spending-limit layer that bounds x402 spend |

**The wedge:** OneLink Pay is the on-chain, revocable spending limit for the x402 agent economy — built on Particle Universal Accounts + EIP-7702, with a public proof receipt for every payment.

Built with **Particle** (Universal Accounts + EIP-7702), **Magic** (email/Google embedded wallet), and **Arbitrum** (settlement).

## Security Notes

`POST /api/payment-links` registers invoices on-chain from the server-side ReceiptEmitter owner wallet. To avoid public gas-drain, it requires:

```text
x-admin-create-token: <ADMIN_CREATE_TOKEN>
```

`POST /api/payments/[id]/mark-paid` does not trust a frontend tx hash by itself. It fetches the settlement-chain receipt (Base or Arbitrum, per the invoice), parses the USDC `Transfer`, verifies merchant and amount, then records `InvoicePaid` through the ReceiptEmitter owner key — using the **actual on-chain sender** as the payer, never a client-supplied address — before marking Supabase as paid.

`POST /api/mandates/charge` is public but gas-safe: funds are bounded by the EIP-712 mandate signature plus the on-chain caps, and the relayer is protected by an optional dedicated `RELAYER_PRIVATE_KEY` and a rolling-window budget on gas-spending sends. Over-cap charges are caught in simulation and cost zero gas.

## Required Env

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PARTICLE_PROJECT_ID=
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=
NEXT_PUBLIC_PARTICLE_APP_ID=
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DESTINATION_CHAIN_ID=8453
NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer
NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS=
BASE_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_CHAIN_ID=42161
NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
ARBITRUM_MAINNET_RPC_URL=
NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS=
RECEIPT_EMITTER_OWNER_PRIVATE_KEY=
RELAYER_PRIVATE_KEY=
ADMIN_CREATE_TOKEN=
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false
```

Never commit `.env.local`, private keys, seed phrases, or admin tokens. `RELAYER_PRIVATE_KEY` is optional (falls back to the ReceiptEmitter owner key). Keep `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false` in any deployed build — it gates the `/debug/*` lab routes and is inlined at build time.

## Local Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
cd contracts && corepack pnpm test
```

Deploy ReceiptEmitter v1.1 to Base mainnet:

```bash
cd contracts
BASE_MAINNET_RPC_URL=... RECEIPT_EMITTER_OWNER_PRIVATE_KEY=... corepack pnpm hardhat run scripts/deploy.ts --network base
```

## Historical P0 Proof

The previous transfer-only P0 proved Magic + Particle UA can move real USDC on Base, but it did not call the receipt contract. That path is now historical.

Historical Base Sepolia ReceiptEmitter v0:

- Address: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Explorer: `https://sepolia.basescan.org/address/0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Deploy tx: `0x351db8dfa40cd5c70423510524133b186fe995b5ac7f52d6704ce09ea4d64fcc`

This is the same hex address as the previous Base mainnet v1 deployment, but it is a different contract on a different chain.

## SDK Versions

Pinned to what's installed (verified against the lockfile). The Universal Account SDK is on the pinned **stable** release (`2.0.3`) — real EIP-7702 + cross-chain; the other crypto SDKs are on their latest releases.

- `@particle-network/universal-account-sdk`: `2.0.3` (pinned exact; stable — real EIP-7702 + cross-chain)
- `@particle-network/chains`: `1.8.3` (latest)
- `magic-sdk`: `33.7.1` (pinned; latest 33.9.0, upgrade deferred until after submission)
- `@magic-ext/evm`: `1.5.1` (latest)
- `@magic-ext/oauth2`: `15.8.0` (latest) — Google OAuth
- `viem`: `2.53.1`
- `ethers`: `6.17.0`
- `next`: `14.2.35`
- `@openzeppelin/contracts`: `5.6.1` (latest)
- `hardhat`: `2.28.6`

Intentionally held back (major upgrades require code changes; out of scope mid-hackathon): `next` 14 → 16, `zod` 3 → 4, `hardhat` 2 → 3.

SDK note: prod runs the pinned **stable** Particle SDK (`2.0.3`) for real EIP-7702 + cross-chain. The earlier `-32801`/`-32613` maintenance errors on custom universal calls are resolved (cross-chain payment proven live on stable); the version is pinned exact, so prod cannot float to a new release unreviewed.
