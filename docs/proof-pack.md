# OneLink Pay — Proof Pack (cross-chain, verifiable)

> Last updated: 2026-07-06 · One page a judge can open and verify independently.
> Backs ledger claim **C21**. Every tx below is on a public mainnet explorer.

## The one claim we make (verbatim, ledger C21)

> A cross-chain USDC payment settles live via a Magic-signed Particle Universal Account in
> EIP-7702 mode: a merchant is paid 1.0 USDC on **Arbitrum** with ~0.12 USDC sourced cross-chain
> from **Base** in the same operation — no manual bridge.

Nothing beyond this sentence is claimed about cross-chain. See "What's real / pattern / future" below.

---

## Evidence A — cross-chain settlement (proof-lab run)

A Magic-signed UA in EIP-7702 mode pays the merchant **1.0 USDC on Arbitrum**, sourcing USDC
cross-chain from **Base** in one operation. Verified on-chain (RPC + explorers).

| Field | Value |
|---|---|
| Payer (Magic EOA, 7702-delegated) | `0x53Bd615635Af778e5E460d5EEC2d6b234693206a` |
| Merchant (recipient) | `0x8C54783849A2C042544efc37c4657Ee98a411Fb7` |
| Amount delivered | 1.0 USDC on Arbitrum |
| **Arbitrum settlement tx** | [`0x85d8…4911`](https://arbiscan.io/tx/0x85d8c4c24b75ef404889b44a63e97b9b2ac23d9a341a991f86cd0a4dbf6a4911) (USDC `Transfer` payer → merchant) |
| **Base source tx** | [`0x8b85…4a2e`](https://basescan.org/tx/0x8b85d45f013f7ef86436b723e00cabebd41cba8f96c5d9ec85ad4e5d757d4a2e) |
| UniversalX activity | [`0x0654e81cfea86a`](https://universalx.app/activity/details?id=0x0654e81cfea86a) |

---

## Evidence B — end-to-end through the product (`/pay`)

Invoice `fc5adc83` paid through the live product on the **stable SDK 2.0.3** (2026-07-06). Funded
from **Base (8453)**, settled on **Arbitrum (42161)** — recorded with the true funding source. The
InvoicePaid attestor is the relayer key, **distinct from the merchant payee** (R26). RPC-verified.

| Field | Value |
|---|---|
| Invoice | `fc5adc83-3b17-4004-8902-a5a40a178dd5` |
| Public receipt (no account) | https://onelink-pay.vercel.app/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5 |
| Funding source → settlement | Base `8453` → Arbitrum `42161` (`source_chain_id` recorded) |
| Amount | 2 USDC |
| **Arbitrum settlement tx** | [`0x65ef…f72d`](https://arbiscan.io/tx/0x65ef93082bc8bfabcd16d5034e95f45e60ad80e17bbf8c12f0494606cffcf72d) (status 0x1, RPC-verified) |
| **Base InvoicePaid proof tx** | [`0x9912…8cf8`](https://basescan.org/tx/0x991296565f53896660c9adae53d7c498b1c0dad6c9e53b2f9dc90114ee898cf8) (sender = relayer `0x0AC0…`, not the merchant) |
| UniversalX activity | [`0x0655f16e0cd6c8`](https://universalx.app/activity/details?id=0x0655f16e0cd6c8) |

> Screenshot: open the public receipt URL above — it is the live, self-verifying artifact
> (cross-chain badge, animated route, per-chain explorer links, UniversalX link, InvoicePaid proof).

---

## Contracts & addresses (all mainnet)

| Item | Base (8453) | Arbitrum One (42161) |
|---|---|---|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| SpendPolicy | `0x73C862a8312c12C764487a9a484f1d1ad44E3957` | `0x9782e3724859469fbBAC5085EA8bf8E70724164E` |
| ReceiptEmitter | `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3` | `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1` |

- EIP-7702 V2 delegate: `0x13E00E089F81aD9F36B655C9E9A07C6BF1489A5A`
- Recipe: `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation + single-shot build/sign/send.
- SDK: `@particle-network/universal-account-sdk@2.0.3` (pinned exact, stable). Wallet/auth: Magic.

---

## Verify it yourself (60 seconds)

1. Open the Arbitrum settlement tx → confirm a USDC `Transfer` of 1.0 to the merchant, status success.
2. Open the Base source / proof tx → confirm the same operation's Base leg.
3. Open the UniversalX activity link → see the cross-chain orchestration as one transaction.
4. Open the public receipt → it cross-checks the on-chain settlement against the invoice and shows
   the InvoicePaid attestation, with no account required.

---

## What's real / pattern / future (read before the pitch)

| Claim | Status |
|---|---|
| Cross-chain USDC settlement via Particle UA + EIP-7702, no manual bridge | **Real, live, on-chain (C21)** |
| On-chain spend mandate (per-charge/daily/total/expiry/merchant/revoke), over-cap reverts at zero gas | **Real, live + 22 contract tests** |
| Walletless login (Magic email/Google) | **Real, live** |
| x402 agent loop (402 → pay → 200; over-cap blocked) | **Real — x402 *pattern*, `onelink-mandate` settled (NOT Coinbase facilitator-compatible)** |
| The "agent" | **Real unattended deterministic loop** — one click; it works through the x402 APIs within budget and is halted by the firewall on the over-cap call. NOT LLM-driven (no AI decision-making claimed); on-chain enforcement is real |
| Gas abstraction (network fee paid in USDC, no destination-chain gas) | **Real, live** — and the one-time 7702 delegation is relayer-sponsored (C23), so a first-time payer needs zero native gas |
| Zero-gas onboarding (one-time 7702 delegation relayer-sponsored) | **Real, live (C23)** — payer needs zero native gas; scoped to the delegation step |
| General gas paymaster (settlement fees) | **Not claimed** — settlement fee paid in USDC by the UA; account is paymaster-compatible |
| Circle Gateway / ZeroDev / Openfort | **Not integrated** — narrative / prior-art. Session keys (ZeroDev) are the production primitive we'd adopt to *arm* unattended automation |

---

## Notes for the team (not for judges)

- Use **invoice `fc5adc83`** as the product cross-chain example: stable SDK 2.0.3, 2 USDC,
  `source_chain_id` = `8453` (Base → Arbitrum), and the InvoicePaid attestor is the relayer key
  (distinct from the merchant payee — R26).
- Older cross-chain runs (`40027dcf` on beta-3, `7be9118e`) remain valid on-chain but predate the
  stable-SDK + attestor-split; prefer `fc5adc83` in any public material.
- All claims trace to `docs/honest-claim-ledger.md`. This page adds no new claim.
