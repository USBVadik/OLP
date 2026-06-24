# OneLink Pay — Proof Pack (cross-chain, verifiable)

> Last updated: 2026-06-21 · One page a judge can open and verify independently.
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

Invoice `40027dcf` paid through the live product. Funded from **Base (8453)**, settled on
**Arbitrum (42161)** — recorded with the true funding source. The public receipt renders the
"Cross-chain: Base → Arbitrum" badge (smoke-verified on prod this session).

| Field | Value |
|---|---|
| Invoice | `40027dcf-f45e-4991-a215-553dfb71d0e3` |
| Public receipt (no account) | https://onelink-pay.vercel.app/receipt/40027dcf-f45e-4991-a215-553dfb71d0e3 |
| Funding source → settlement | Base `8453` → Arbitrum `42161` (`source_chain_id` recorded post-fix) |
| Amount | 1.0 USDC |
| **Arbitrum settlement tx** | [`0x8163…6464`](https://arbiscan.io/tx/0x8163be21df713539c257165bdcd2de9ce4a4d097e6ff60ca6ad50c569f966464) |
| **Base InvoicePaid proof tx** | [`0x2fba…7055`](https://basescan.org/tx/0x2fba4854014cba9a56ca6a29061cef408f94bb03e25a2e36d9ce1a6963fd7055) |
| UniversalX activity | [`0x0654ea35e34844`](https://universalx.app/activity/details?id=0x0654ea35e34844) |

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
- SDK: `@particle-network/universal-account-sdk@2.0.0-beta.3` (pinned exact). Wallet/auth: Magic.

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
| The "agent" | **Agent-*initiated* harness over the real on-chain firewall — autonomy is dramatized, enforcement is not** |
| Gas | First-time 7702 delegation needs a little native gas per chain; **no gas sponsorship claimed** |
| Circle Gateway / ZeroDev / Openfort | **Not integrated** — narrative / prior-art only |

---

## Notes for the team (not for judges)

- Use **invoice `40027dcf`** as the product cross-chain example: it is post the "store true funding
  source" fix, so its `source_chain_id` correctly reads `8453` (Base).
- Invoice `7be9118e` was also cross-chain (build preview `fromChains:[8453] → toChains:[42161]`,
  same `ua_transaction_id 0x0654e9323a0bf7`), but its completed-row `source_chain_id` reads `42161`
  because it predates that fix — a stored-field artifact, not a same-chain payment. Prefer
  `40027dcf` in any public material to avoid confusion.
- All claims trace to `docs/honest-claim-ledger.md`. This page adds no new claim.
