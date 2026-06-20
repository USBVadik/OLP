# Particle createUniversalTransaction Repro

Hi Particle / Encode team,

## Update — Base EIP-7702 Delegation Verified (2026-06-20)

OneLink Pay now has a successful live Base EIP-7702 delegation through Magic + Particle UA:

- Owner EOA: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Delegation tx: `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- BaseScan: `https://basescan.org/tx/0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- Transaction type: `eip7702`, authorization list length `1`
- Delegate contract: `0x6640c1CCCaF07Dbe765eC05E294FE427cC92831C`

After delegation, `getEIP7702Deployments()` reports Base `isDelegated: true`, and `createTransferTransaction()` builds cleanly in EIP-7702 mode with `rootHash`, fee quotes, token changes, and no inline auth requirement. This makes `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer` the current Universal Accounts Track candidate.

The strict custom-call path (`createUniversalTransaction` with `approve + payInvoice`) remains tracked separately because it previously returned `-32801` maintenance on custom calls.

We are building OneLink Pay for UXmaxx. Our intended qualifying path was:

Magic embedded wallet -> Particle Universal Account -> `createUniversalTransaction` on Base -> USDC `approve` + `ReceiptEmitter.payInvoice` -> `InvoicePaid` event.

The wallet, UA, balance, transfer, and contract registration pieces work. The blocker is isolated to custom `createUniversalTransaction` calls.

## Working State

- Magic login works.
- Particle UA initialization works.
- `getPrimaryAssets()` works.
- `createTransferTransaction()` works and returns `rootHash`, fee quotes, and token changes.
- `ReceiptEmitter v1` is deployed on Base mainnet.
- Invoice registration works on-chain.

## Exact Error

```text
-32801 System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

The error happens before preview/signing.

## Probe Matrix

1. `createTransferTransaction` with Base USDC: works.
2. `createUniversalTransaction` with single `USDC.transfer`: fails with `-32801`.
3. `createUniversalTransaction` with single `USDC.approve`: fails with `-32801`.
4. `createUniversalTransaction` with `USDC.approve + ReceiptEmitter.payInvoice`: fails with `-32801`.

## Environment

- Particle UA SDK: `1.1.1`
- Magic SDK: `29.4.2`
- Next.js: `14.2.35`
- Chain: Base mainnet `8453`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- ReceiptEmitter: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`

## Questions

1. Is custom `createUniversalTransaction` currently disabled, under maintenance, or behind an allowlist for this SDK/project?
2. For UXmaxx, if `createUniversalTransaction` remains unavailable, is a Particle SEND/TRANSFER flow acceptable for the cross-chain value movement requirement if we verify the payment server-side and record an on-chain payment proof separately?

---

## Update — Root Cause Research (2026-06-19)

After reviewing current Particle and Magic primary sources, the `-32801` is most likely **not** an OneLink payload bug. Two overlapping causes:

### 1. Universal Accounts V2 migration (primary, external)

Particle's docs now carry a site-wide notice that Universal Accounts are upgrading to V2, that users should withdraw funds from existing accounts, and that during the migration only `createTransferTransaction` (withdrawals) is available. That matches our matrix exactly: transfer works; `createUniversalTransaction` / `createBuyTransaction` / `createConvertTransaction` all return `-32801`. The published SDK (`1.1.1`) still pins `UNIVERSAL_ACCOUNT_VERSION = "1.0.3"`, i.e. the V2 account class is not yet in the public SDK. So custom/convert/buy may stay blocked until Particle ships V2, regardless of our code.

### 2. Our integration was on the deprecated path (secondary, fixed in-repo)

- `magic-sdk` 29.4.2 -> 33.7.1 (adds `wallet.sign7702Authorization` / `wallet.send7702Transaction`); added `@magic-ext/evm`.
- UA now initializes in EIP-7702 mode via `smartAccountOptions { useEIP7702: true, name: "UNIVERSAL", version: UNIVERSAL_ACCOUNT_VERSION }`. Use the exported constant — a hardcoded `"2.0"` returns "Unsupported smart account".
- Added the delegation flow: `getEIP7702Auth` -> Magic `sign7702Authorization` -> `send7702Transaction`, then inline-auth signing on `sendTransaction`.
- In 7702 mode funds/balances read from the **EOA**, not the legacy UA address — fund the EOA (USDC + a little ETH for the one-time delegation).

Behind `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`. Live verification via `/debug/particle-probe` (EIP-7702 Delegation Probe).

### Refined questions for Particle

1. During the V2 migration, is `-32801` expected for **all** non-transfer ops (custom/convert/buy) on existing projects, on both Base and Arbitrum?
2. Is custom-call support gated by project allowlist, account version, or purely the migration timeline? Anything we can toggle?
3. ETA for V2 GA and the V2-capable SDK / `UNIVERSAL_ACCOUNT_VERSION` bump?
4. Does EIP-7702 in-place delegation + cross-chain `createTransferTransaction` (value moved via UA across chains) qualify for the Universal Accounts Track while custom calls are under maintenance?

Updated environment: Particle UA `1.1.1`, `magic-sdk` `33.7.1`, `@magic-ext/evm` `1.5.0`, Next `14.2.35`, Base `8453`.

### Live probe result (2026-06-19, against production Particle backend)

Ran a Node build-only probe with the real project credentials (no transactions sent, no gas). Owner EOA `0x53Bd...3206a`.

| Call | Legacy mode | EIP-7702 mode | Arbitrum (7702) |
| --- | --- | --- | --- |
| `getSmartAccountOptions` | UA = `0xeE1FB8...0246` | UA = owner EOA `0x53Bd...3206a` | — |
| `getPrimaryAssets` | ~$1.62 (on legacy UA) | ~$1.17 (on EOA) | — |
| `createTransferTransaction` | OK (rootHash + userOp) | OK (rootHash + userOp) | OK |
| `createUniversalTransaction` (USDC.transfer) | **-32801 maintenance** | **-32801 maintenance** | **-32801 maintenance** |

`getEIP7702Deployments` shows `isDelegated:false` on all chains (EOA not yet delegated). `getEIP7702Auth([8453])` returns `chainId:0` (chain-agnostic) with delegate contract `0x6640c1...831C` — confirming Magic must pre-delegate per chain (cannot sign chainId:0).

**Conclusion (now empirically confirmed, high confidence):** `-32801` is a Particle-side, system-wide block on custom universal transactions (both Base and Arbitrum, both account modes). Correct EIP-7702 init does **not** unblock it, and Arbitrum is not a workaround. `createTransferTransaction` is the only build-able rail right now — which is exactly what `universal_7702_transfer` mode uses. The strict `universal_invoice` path stays blocked until Particle completes the V2 migration.
