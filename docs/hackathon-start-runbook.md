# Hackathon Start Runbook

Use this only after the official hackathon kickoff. Until then, keep this repo in pre-hackathon prototype freeze.

## 1. Check Final Rules

- Read the final UXmaxx/Encode/Particle rules before writing new code.
- Confirm whether pre-hackathon prototypes are allowed and what must be rebuilt or newly committed during the event.
- Confirm the exact judging criteria for Particle Universal Accounts, EIP-7702, cross-chain payments, and on-chain proof.
- Write any sponsor-specific required SDKs, chains, or demo constraints in `docs/status.md`.

## 2. Check Latest Particle SDK And Docs

- Check the latest Particle Universal Account SDK version and changelog.
- Check whether `createUniversalTransaction()` custom calls are still under maintenance for this project.
- Check whether Base and Arbitrum support changed for SEND/TRANSFER/custom-call rails.
- Check whether Magic signing requirements changed for EIP-7702 authorization handling.
- Upgrade only after reading migration notes and rerunning the probe matrix.

## 3. Rerun Probe Matrix

Start local dev:

```bash
corepack pnpm dev
```

Open:

```text
http://localhost:3000/debug/particle-probe
```

Use:

```text
NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true
```

Run Base probes first:

- Magic login.
- Particle UA init.
- `getPrimaryAssets()`.
- `createTransferTransaction()` with Base USDC.
- `createUniversalTransaction()` with single USDC `transfer`.
- `createUniversalTransaction()` with single USDC `approve`.
- `createUniversalTransaction()` with `approve + payInvoice`.

Run Arbitrum probes only as exploratory:

- Arbitrum `createTransferTransaction()`.
- Arbitrum custom `createUniversalTransaction()` probes.
- Do not deploy Arbitrum ReceiptEmitter or spend gas unless the rules or sponsor guidance make Arbitrum the target.

Do not send transactions from the probe page unless explicitly approved during the hackathon.

## 4. Choose Payment Mode

Default:

```text
NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback
```

Use this if Particle custom calls still return:

```text
-32801 System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

Strict path:

```text
NEXT_PUBLIC_PAYMENT_MODE=universal_invoice
```

Use this only if the probe matrix confirms `createUniversalTransaction(approve + payInvoice)` builds a preview/rootHash and the Magic EIP-7702 authorization path is understood.

## 5. Choose Chain

Default active chain:

```text
Base mainnet, chainId 8453, USDC 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

Keep Arbitrum exploratory unless it clearly beats Base in the fresh probe matrix:

```text
Arbitrum One, chainId 42161, USDC 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

Do not support both chains in the product flow until one chain is stable.

## 6. Continue Implementation Only After Decisions

Continue product work only after these are written in `docs/status.md`:

- Final rules checked.
- Particle SDK/docs checked.
- Probe matrix rerun.
- Active payment mode chosen.
- Active chain chosen.
- Any known sponsor blockers recorded with exact errors.

Cut until core checkout is stable:

- ZeroDev.
- Repeat-Pay Caps.
- QR links.
- Merchant auth.
- Particle AuthKit checkout.
- UI polish beyond demo-critical clarity.

Do not spend mainnet gas until the exact invoice/payment/proof test has been approved.
