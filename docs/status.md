# Status

Last updated: 2026-06-20

## Active Stack

This is a pre-hackathon prototype. The active Milestone B checkout uses Magic + Particle Universal Accounts.

- Magic is the embedded wallet/auth layer.
- Particle Universal Account SDK is the chain abstraction layer.
- Legacy/fallback modes use `new UniversalAccount({ ownerAddress })` (separate smart-account address, `UNIVERSAL` version `1.0.3`).
- An explicit EIP-7702 mode (`universal_7702_transfer`) is now implemented: `smartAccountOptions { useEIP7702: true, version: UNIVERSAL_ACCOUNT_VERSION }`, with the EOA delegated in-place via Magic's `sign7702Authorization` / `send7702Transaction`.
- Particle AuthKit is installed but not used in the active flow.
- Base mainnet USDC is the only supported MVP token.
- Arbitrum is configured only for exploratory probes.
- Default example payment mode is `transfer_fallback`; the active Universal Accounts Track candidate is `universal_7702_transfer`.

## Active Payment Path

1. Merchant creates a payment link from the dashboard.
2. `POST /api/payment-links` requires `x-admin-create-token`.
3. Backend inserts the Supabase invoice row.
4. Backend computes `contract_invoice_id = keccak256(utf8(payment_link.id))`.
5. Backend calls `ReceiptEmitter.registerInvoice()` on Base mainnet.
6. Customer signs in with Magic.
7. App initializes Particle UA with Magic EOA as `ownerAddress`.
8. App calls `getPrimaryAssets()`.
9. App calls `createTransferTransaction()` for Base USDC to the merchant.
10. App logs `inspectUserOps`.
11. App signs `transaction.rootHash` via Magic `personal_sign`.
12. App sends through `ua.sendTransaction(transaction, signature)`.
13. App calls `POST /api/payments/[id]/mark-paid`.
14. Backend verifies the Base mainnet receipt contains matching Base USDC `Transfer`.
15. Backend calls `ReceiptEmitter.recordVerifiedPayment()`.
16. Backend verifies the proof receipt emitted matching `InvoicePaid`.
17. Supabase `payment_links.status` and `payments.status` become completed.

## EIP-7702 Authorization Handling

The app logs `inspectUserOps` after transaction creation:

- `userOps[].chainId`
- `userOps[].userOpHash`
- `userOps[].hasEip7702Auth`
- `userOps[].eip7702Delegated`

In the legacy/fallback modes, if a transaction includes `eip7702Auth` and `eip7702Delegated === false`, the checkout stops with a clear diagnostic and signs `rootHash` with `personal_sign`.

In `universal_7702_transfer` mode (magic-sdk 33.7.1 + `@magic-ext/evm`), the checkout now performs explicit delegation: `getEIP7702Auth` -> `magic.wallet.sign7702Authorization` -> `send7702Transaction` (pre-delegation), then signs inline `eip7702Auth` user-ops and the `rootHash`, and calls `ua.sendTransaction(tx, signature, authorizations)`.

Live Base proof, 2026-06-20:

- Owner EOA: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Delegation tx: `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- BaseScan: `https://basescan.org/tx/0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- Transaction type: `eip7702`
- Authorization list length: `1`
- Delegate contract: `0x6640c1CCCaF07Dbe765eC05E294FE427cC92831C`
- Post-delegation Particle state: `getEIP7702Deployments()` reports Base `isDelegated: true`.
- Post-delegation transfer build: `createTransferTransaction()` returns `rootHash`, fee quotes, token changes, one userOp, and `eip7702Delegated: true` without a maintenance error.

## ReceiptEmitter Status

Current source contract is ReceiptEmitter v1.1:

- `registerInvoice(bytes32,address,address,uint256,uint256)`
- `payInvoice(bytes32)`
- `recordVerifiedPayment(bytes32,address,bytes32)`
- `isPaid(bytes32)`
- `getInvoice(bytes32)`
- Events: `InvoiceRegistered`, `InvoicePaid`
- OpenZeppelin: `5.6.1`

Active Base mainnet deployment:

- Address: `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- Explorer: `https://basescan.org/address/0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- Deploy tx: `0x6148c0780797c91210c62650b5f4d79316995ff21112616e04d4b18c626afc57`
- Owner: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
- Token: Base USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

Previous Base mainnet v1 deployment is historical:

- Address: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Deploy tx: `0x3a99f8e3525c50783c2a774cadbe3204424d81c9e615aa10c29579c33dc22e2e`

Historical Base Sepolia v0 deployment:

- Address: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Explorer: `https://sepolia.basescan.org/address/0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Deploy tx: `0x351db8dfa40cd5c70423510524133b186fe995b5ac7f52d6704ce09ea4d64fcc`

The historical Sepolia v0 and previous Base mainnet v1 share the same hex address, but they are separate deployments on separate chains.

The historical transfer-only P0 is no longer the target path. It remains proof that Magic + Particle UA can move real USDC on Base.

## Known Risk

Particle `createUniversalTransaction()` has previously returned:

```text
System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

The strict custom-call path is recorded as externally blocked. Root cause (empirically confirmed 2026-06-19 via a live build-only probe with the real project credentials): `createUniversalTransaction` returns `-32801` on both Base and Arbitrum, in both legacy and EIP-7702 modes, while `createTransferTransaction` builds fine everywhere. This matches Particle's Universal Accounts V2 migration (legacy accounts in a withdraw-only window; public SDK `1.1.1` still pins version `1.0.3`). It is an external/timeline block, not a payload bug — correct EIP-7702 init does not unblock custom calls, and Arbitrum is not a workaround. The active fallback uses Particle `createTransferTransaction()` plus server-side USDC `Transfer` verification and `recordVerifiedPayment()` proof. Refined Particle questions + probe results: `docs/particle-create-universal-repro.md`.

## Payment Mode Flag

- `NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback`: stable legacy smart-account mode + transfer/proof.
- `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`: EIP-7702 mode — EOA delegated in-place, then `createTransferTransaction` settles USDC to the merchant. This is the active Universal Accounts Track candidate. Fund the EOA (USDC + a little Base ETH for the one-time delegation). Verify via `/debug/particle-probe`.
- `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`: keeps the strict `createUniversalTransaction(approve + payInvoice)` path available for future Particle retesting (currently blocked by the V2 migration).

Do not spend more mainnet gas for strict-path testing unless explicitly requested.
