# Cross-Chain Proof Runbook

Use this to close the Universal Accounts Track requirement:

> At least one cross-chain operation moving value via Particle Universal Accounts in EIP-7702 mode.

## Current State

- Base EIP-7702 delegation is proven for owner EOA `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`.
- Delegation tx: `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`.
- `createTransferTransaction()` builds after delegation with `eip7702Delegated: true`.
- Base-to-Base USDC transfer/proof works.
- Cross-chain value movement is not yet proven in the live run.
- Read-only asset check earlier on 2026-06-20 showed funds only on Base:
  - Base ETH: `0.000099540215445268`
  - Base USDC: `0.760619`
  - Arbitrum USDC: `0`
- After funding, read-only checks show:
  - Base ETH: `0.000099540215445268`
  - Base USDC: `0.760619`
  - Arbitrum USDC: `2`

Do not claim cross-chain proof until the acceptance checks below are complete.

## Target Demo

Customer has spendable USDC on Arbitrum, pays a Base invoice, and the merchant receives Base USDC.

```text
Magic login
-> Particle UA in EIP-7702 mode
-> source funds on Arbitrum
-> createTransferTransaction
-> merchant receives Base USDC
-> server verifies Base USDC Transfer
-> ReceiptEmitter.recordVerifiedPayment
-> Proof Receipt + dashboard PAID
```

## Preconditions

- `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`.
- `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true` only while probing.
- Supabase is reachable and `payment_links` responds through PostgREST.
- Base ReceiptEmitter v1.1 is active:
  `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`.
- Base USDC:
  `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- Arbitrum native USDC:
  `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.

## Funding Need

Fund the EOA, not the legacy UA address:

```text
0x53Bd615635Af778e5E460d5EEC2d6b234693206a
```

Recommended tiny funding:

- Arbitrum USDC: `1-2 USDC`.
- Keep a little Base ETH on the EOA for any EIP-7702/delegation maintenance.

Do not fund old legacy UA addresses for this test.

## Build-Only Probe First

Before sending any transaction:

1. Open:

```text
http://localhost:3000/debug/particle-probe
```

2. Connect Magic with the same email.
3. Confirm:
   - owner EOA is `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`;
   - smart account address equals the EOA in 7702 mode;
   - Base `isDelegated: true`;
   - Arbitrum USDC appears in `getPrimaryAssets()`.
4. Run the transfer build probe with destination Base merchant.
5. Do not send from the probe page.

Record:

- source chain chosen by Particle;
- destination chain;
- rootHash present;
- fee quotes present;
- token changes present;
- userOps count;
- `eip7702Delegated`.

## Probe Findings After Arbitrum Funding

Read-only / build-only probes after funding `2 USDC` on Arbitrum:

- Particle `getPrimaryAssets()` sees Arbitrum USDC.
- Arbitrum target transfer `0.1 USDC` builds, but Arbitrum `eip7702Delegated: false` and includes inline `eip7702Auth`.
- Base target transfer above the Base balance, e.g. `1.5 USDC`, still shows only Base in `fromChains` / `toChains`. Do not treat this as cross-chain proof.
- Arbitrum target transfer above the Arbitrum balance, e.g. `2.05 USDC`, builds with two userOps:
  - Base userOp: `eip7702Delegated: true`
  - Arbitrum userOp: `hasEip7702Auth: true`, `eip7702Delegated: false`

This is the current best cross-chain proof candidate, but it settles to Arbitrum USDC. The current `/pay/[id]` proof endpoint verifies Base USDC settlement only, so do not send this through the normal checkout until the product path is adjusted or a separate proof/demo route is chosen.

## Controlled Proof Lab

A dedicated debug route exists for the cross-chain candidate:

```text
http://localhost:3000/debug/cross-chain-proof
```

Guard:

```text
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true
```

What it does:

- Connects Magic + Particle UA in EIP-7702 mode.
- Builds an Arbitrum-target `createTransferTransaction`.
- Defaults to `2.05 USDC` so Particle is likely to build multi-chain userOps with the current balances.
- Shows whether the preview is a multi-chain candidate.
- Shows userOp chains, delegated chains, and chains needing inline EIP-7702 authorization.
- Keeps raw Particle data in a debug accordion.

Safety:

- It does not call the Base checkout APIs.
- It does not call `mark-paid`.
- It does not call `ReceiptEmitter.recordVerifiedPayment`.
- It cannot send unless the operator types `SEND CROSS-CHAIN`.
- A live send spends real assets and is separate from the Base proof receipt flow.

Use this route to prove Particle UA cross-chain execution if the normal Base settlement path cannot source from Arbitrum.

## Live Test Steps

Only after explicit approval to spend mainnet funds:

1. Create a tiny invoice, preferably `0.10 USDC`.
2. Confirm `registered_tx_hash` exists.
3. Open `/pay/[id]`.
4. Log in with Magic.
5. Confirm Trust Preview:
   - amount;
   - merchant;
   - destination Base;
   - payment mode `universal_7702_transfer`;
   - proof behavior.
6. Build Particle transfer preview.
7. Confirm the preview indicates cross-chain source or non-Base source liquidity.
8. Send payment.
9. Wait for tx hash.
10. Call `mark-paid`.
11. Verify Base USDC `Transfer` server-side.
12. Verify ReceiptEmitter proof tx.
13. Refresh dashboard and success page.

## Acceptance

The cross-chain requirement is closed only when all are true:

- Source funds came from a non-Base chain, preferably Arbitrum.
- Merchant received Base USDC.
- Particle UA was in EIP-7702 mode.
- Payment tx is visible on an explorer.
- Backend verified the Base USDC `Transfer`.
- `ReceiptEmitter.recordVerifiedPayment` proof tx succeeded.
- Proof Receipt shows payment tx and proof tx.
- Supabase `payment_links.status = completed`.
- Supabase `payments.status = completed`.

## If It Fails

Return the exact stage:

- Magic login;
- UA init;
- getPrimaryAssets;
- transfer preview;
- EIP-7702 delegation;
- rootHash signing;
- sendTransaction;
- Base USDC settlement;
- mark-paid verification;
- ReceiptEmitter proof;
- Supabase update.

Do not silently fall back to same-chain payment and call it cross-chain.
