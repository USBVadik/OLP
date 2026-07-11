# OneLink Pay — Checkpoint 3 Submission (Universal Accounts Track)

> Paste-ready copy for the final submission form. Deadline: 2026-07-20 14:59 Europe/Kiev.
> Keep it honest — every claim maps to `docs/honest-claim-ledger.md` and the on-chain proofs.

## Form fields

- **Link to Code:** https://github.com/USBVadik/OLP
- **Link to Presentation:** https://onelink-pay.vercel.app/pitch
- **Live Demo Link:** https://onelink-pay.vercel.app
- **Link to Demo Video:** _(add the YouTube/Vimeo link after recording)_

## Submission Details (paste into the required box)

**OneLink Pay — the Permission Firewall for Universal Accounts.** *Give your AI a card, not your wallet.*

**Problem.** Crypto wallets were built for humans clicking "approve." The next wave is apps, agents and scripts touching money — and full wallet access is too dangerous while manual approval is too slow. The blocker is trust, not rails: ~3 in 4 consumers won't let an AI pay autonomously *even with limits set* (Forrester, 2026).

**What we built.** OneLink is the on-chain consent + proof layer on top of Particle Universal Accounts, in three moments:
- **Trust Preview** before you pay — a legible, single consent (not a blind signature).
- **Permission Firewall** before automation — sign one scoped, revocable mandate (per-charge / daily / total caps, a single merchant, expiry), enforced on-chain by our own `SpendPolicy.sol`. Over-limit, off-merchant or post-revoke charges revert in simulation — no funds move, zero gas.
- **Proof Receipt** after settlement — a public, verifiable receipt per payment, checkable by anyone with no account.

**Universal Accounts + EIP-7702 (track fit).** Magic email/Google login delegates the user's *own* EOA in place via EIP-7702, turning it into a Particle Universal Account that settles USDC cross-chain (Base → Arbitrum, no manual bridge) in one operation. We meet the track requirements: UA SDK in 7702 mode, a live cross-chain value operation via the UA, and a functional demo — all proven on-chain (canonical receipt `/receipt/fc5adc83…`).

**Agent on a leash (x402).** An unattended, deterministic agent pays per API call via the x402 *pattern* (our `onelink-mandate` scheme — not the Coinbase facilitator), bounded by the same on-chain mandate; over-cap calls are refused before any funds move.

**Why it's credible, not just a demo.** `SpendPolicy` is source-verified on Basescan and Arbiscan, so anyone can read the enforcement contract. A walletless page (`/try`) lets a judge trigger the real on-chain over-cap revert in one tap — no wallet, no gas. A `/trust` page states plainly what's real vs pattern vs future.

**Honest scope.** x402 *pattern* (not facilitator-compatible); the agent is unattended-deterministic (not an LLM); gas sponsorship is scoped to the one-time 7702 delegation (not a general settlement paymaster); cross-chain is proven Base↔Arbitrum. We build on the emerging spend-permission wave (ERC-7715, Coinbase, MetaMask) — we don't claim to have invented it; our wedge is a merchant-bound, revocable mandate on your own EOA, chain-abstracted, with a public proof receipt.

**Try it:** live at onelink-pay.vercel.app · walletless block at `/try` · cross-chain receipt at `/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5`.

## Judging-criteria map (for our own reference, not for the box)

- **UX excellence (40%):** walletless 10-second "block moment"; legible Trust Preview vs blind signature; live Budget HUD; one-tap revoke; shareable Proof Receipt.
- **Universal Accounts + EIP-7702 (30%):** own EOA delegated in 7702 mode → Particle UA; cross-chain USDC (Base → Arbitrum) proven live; account-level mandate enforcement.
- **Adoption (20%):** an API layer (walletless firewall verdict JSON); a concrete use case (x402 vendor caps agent spend); integrate-in-one-call.
- **Technical quality / polish (10%):** SpendPolicy source-verified on-chain; 22 contract + 191 unit tests; typed end to end; claim-discipline `/trust`.
