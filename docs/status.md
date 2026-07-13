# Status

Last updated: 2026-07-12

## Active Stack

This is the active UXmaxx submission candidate. The production checkout uses Magic + Particle Universal Accounts.

- Magic is the embedded wallet/auth layer.
- Particle Universal Account SDK (`2.0.3`, pinned exact stable) is the chain abstraction layer.
- Legacy/fallback modes use `new UniversalAccount({ ownerAddress })` (separate smart-account address, `UNIVERSAL` version `1.0.3`).
- An explicit EIP-7702 mode (`universal_7702_transfer`) is now implemented: `smartAccountOptions { useEIP7702: true, version: UNIVERSAL_ACCOUNT_VERSION }`, with the EOA delegated in-place via Magic's `sign7702Authorization` / `send7702Transaction`.
- Particle AuthKit was removed from the dependency tree and is not part of the active flow.
- Base + Arbitrum One mainnet USDC are supported. Arbitrum is the active settlement chain; the `InvoicePaid` proof is anchored on Base.
- The active payment mode is `universal_7702_transfer`: cross-chain settlement via Particle UA in EIP-7702 mode — **proven live and deployed (ledger C21)**. `transfer_fallback` remains only as a legacy same-chain fallback.

## Final Rules Snapshot

Current intended track: Universal Accounts Track.

Requirements captured from the UXmaxx rules:

- Use Particle Universal Accounts SDK in EIP-7702 mode.
- Include at least one cross-chain operation moving value via UA.
- Provide a functional demo, deployed or runnable locally.

Judging weights:

- UX excellence: 40%.
- Prominent / innovative Universal Accounts + EIP-7702 usage: 30%.
- Adoption potential: 20%.
- Technical quality / polish: 10%.

Current status (see `docs/honest-claim-ledger.md` for evidence):

- Base EIP-7702 delegation is proven (C7).
- Same-chain USDC checkout + proof is proven (C8).
- **Cross-chain value movement via the Universal Account is proven live and deployed (C21):** a merchant is paid on Arbitrum with USDC sourced cross-chain from Base in one operation, no manual bridge. The final-rule cross-chain requirement is **met**.
- Proof + procedure (requirement now CLOSED): ledger C21 + `docs/cross-chain-proof-runbook.md`.

## Active Payment Path (`universal_7702_transfer`, cross-chain via UA — C21)

1. Merchant creates a payment link from the dashboard.
2. `POST /api/payment-links` requires `x-admin-create-token`.
3. Backend inserts the Supabase invoice row.
4. Backend computes `contract_invoice_id = keccak256(utf8(payment_link.id))`.
5. Backend calls `ReceiptEmitter.registerInvoice()` (proof anchored on Base).
6. Customer signs in with Magic (email / Google).
7. App initializes Particle UA with the Magic EOA as `ownerAddress` in EIP-7702 mode.
8. App reads the unified balance via `getPrimaryAssets()`.
9. App builds `createUniversalTransaction` (USDC transfer to the merchant on the settlement chain) with `usePrimaryTokens:[USDC]`, pre-delegates EVERY routed userOp chain (`delegateChain7702`), then rebuilds fresh (avoids stale-delegate AA24).
10. App logs `inspectUserOps` (chainId, userOpHash, `eip7702Delegated`).
11. App signs `transaction.rootHash` via Magic and sends through `ua.sendTransaction(...)` (single-shot build/sign/send avoids `-32608`).
12. USDC is sourced cross-chain (e.g. from Base) and settled to the merchant on the settlement chain (e.g. Arbitrum) — no manual bridge.
13. App calls `POST /api/payments/[id]/mark-paid` with the settlement chain id(s).
14. Backend verifies the on-chain USDC `Transfer` to the merchant on the settlement chain.
15. Backend calls `ReceiptEmitter.recordVerifiedPayment()` and verifies the matching `InvoicePaid` proof (on Base).
16. Backend persists `source_chain_id` (true funding source) and `ua_transaction_id`.
17. Supabase `payment_links.status` and `payments.status` become completed; the public `/receipt/[id]` shows the cross-chain route + UniversalX link.

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

## Submission RC2: Research Agent Expense Card

The primary adoption story is now a concrete outcome rather than a generic payment harness:

1. The user signs an on-chain agent budget: `0.10 USDC` per paid tool, `2 USDC` per day, one merchant, expiry, and revoke.
2. An unattended deterministic workflow buys market insight for `0.05 USDC` and sentiment for `0.08 USDC` through the x402 pattern.
3. The purchased inputs produce a readable ETH market-risk brief.
4. An unexpected `0.20 USDC` premium export is rejected with `PerChargeExceeded` before broadcast; no funds move and no gas is spent on the blocked attempt.
5. The user revokes the budget on-chain; the `/agent` run control is disabled and later charges are contractually invalid.

Live Arbitrum evidence and exact transaction links are recorded in `docs/research-agent-expense-card-spec.md` and claim-ledger rows C25-C26. Submission RC2 is tagged at commit `c1f051a`; the current local gate is 253 unit tests, 22 contract tests, and production build. A production baseline is accepted only after the 7/7 HTTP smoke suite passes; rerun it after every deploy.

### Experimental UA-funded arm path (default off)

`NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT=true` connects the Research Agent consent directly to the
Particle cross-chain rail. After Magic login, `/agent` builds a live unsigned preview for making the
`2 USDC` daily budget available on Arbitrum and approving that amount to SpendPolicy. The consent
surface shows the real Particle source chains and fee quote.

The explicit execution path is implemented fail-closed: sign mandate -> ensure every routed chain
is delegated -> rebuild fresh -> stop for renewed consent if route/fee materially changes -> sign
Particle root -> send once -> wait for Particle `FINISHED` -> read-verify Arbitrum USDC balance and
allowance -> arm. The current direct Arbitrum approval remains the default rollback while the flag
is false.

The post-send evidence gate is also code-complete and default-off. Before arming, the server now:

1. fetches `getTransaction(uaTransactionId)` directly from Particle;
2. requires `FINISHED`, the exact payer, Arbitrum destination, and configured USDC on every reported
   funding chain;
3. fetches the activity's source/destination operation receipts from their chains;
4. requires every foreign source leg to have succeeded;
5. requires an exact Arbitrum USDC `Approval(payer, SpendPolicy, 2 USDC)` inside a successful
   destination operation;
6. requires the server-read Arbitrum USDC balance to cover the full daily budget;
7. inserts immutable, idempotent evidence in `agent_funding_evidence`, keyed by both
   `ua_transaction_id` and the exact EIP-712 `mandate_id`, before the UI treats the card as armed.

The Supabase table in `supabase/schema.sql` must be applied before this flag can be enabled. The
route returns 404 while the flag is false, requires the exact payer-signed EIP-712 Research Agent
mandate before any vendor/database read, and never treats preview data as verified evidence.

This integration has **not** been broadcast live yet. The successful evidence is an unsigned
`Arbitrum + Base -> Arbitrum` preview only; do not claim that the Expense Card itself was funded
cross-chain until the separately approved live gate is complete.

## Known Risk (resolved -> residual)

Earlier (SDK `1.1.1` / `UNIVERSAL` version `1.0.3`, before 2026-06-21), Particle
`createUniversalTransaction()` returned:

```text
System maintanence, please use SEND/TRANSFER/SELL feature to transfer your assets immediately
```

i.e. `-32801` on both Base and Arbitrum, in both legacy and EIP-7702 modes, during Particle's
Universal Accounts V2 migration; the interim rail was `createTransferTransaction` + server-side
`Transfer` verification.

**This is resolved.** On `@particle-network/universal-account-sdk` (now pinned stable `2.0.3`) the cross-chain
payment is proven live and deployed (ledger C21) using `createUniversalTransaction` +
`usePrimaryTokens:[USDC]` + per-chain pre-delegation to the V2 delegate
(`0x13E00E089F81aD9F36B655C9E9A07C6BF1489A5A`) + single-shot build/sign/send. The residual risk is
**beta API drift** — the SDK is pinned **exact**, so prod cannot float to a newer beta unreviewed
(R19). Historical probe notes: `docs/particle-create-universal-repro.md`.

## Payment Mode Flag

- `NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback`: legacy same-chain smart-account mode + transfer/proof. Fallback only.
- `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`: **active mode (prod).** EIP-7702 — the EOA is delegated in-place, then `createUniversalTransaction` (+ `usePrimaryTokens:[USDC]` + per-chain pre-delegation) settles USDC to the merchant, sourcing cross-chain when needed (C21). Fund the EOA (USDC + a little native gas per chain for the one-time delegation). Verify via `/debug/particle-probe`.
- `NEXT_PUBLIC_PAYMENT_MODE=universal_invoice`: keeps the strict `createUniversalTransaction(approve + payInvoice)` invoice-contract path available for future Particle retesting; not the active path (the active path settles via a direct USDC transfer, C21).

Do not spend more mainnet gas for strict-path testing unless explicitly requested.

## Permission Firewall (SpendPolicy)

The differentiator: on-chain enforcement of a payer-signed `PaymentMandate`. A merchant or relayer can pull USDC only within the scope the payer signed; everything else reverts. The payer can revoke anytime.

- Contract: `contracts/contracts/SpendPolicy.sol` (EIP-712 mandates via OpenZeppelin EIP712 + ECDSA, SafeERC20, ReentrancyGuard; Solidity 0.8.28 / cancun).
- Enforced limits: `maxPerCharge`, rolling `maxPerDay` (24h reset), lifetime `totalCap`, `expiry`, single `merchant` recipient, `revoke`.
- Entry points: `charge` (existing allowance), `chargeWithPermit` (gasless EIP-2612 allowance + charge), `revoke`, plus `hashMandate` / `getMandateState` / `remaining` views.
- Events: `MandateCharged`, `MandateRevoked`.
- Tests: 22 passing (`contracts/test/SpendPolicy.test.ts`) — valid charge, per-charge cap, daily cap + reset, total cap, expiry, revoke + non-payer rejection, forged signature, wrong chain, gasless permit.
- The EIP-712 `PaymentMandate` type is byte-identical between the contract and the frontend (`src/lib/mandates`), so the payer's signature validates on-chain.

Frontend surface:

- Checkout `Permission Firewall` (legible scoped consent + presets): `src/components/permission-firewall.tsx`.
- Live arm / charge / revoke demo: `/firewall` (`src/app/firewall/page.tsx`); relayer charge route `POST /api/mandates/charge` (simulates first, so an over-cap attempt costs zero gas).
- Proof Receipt (verified -> matched -> recorded) + public `/receipt/[id]`.

Live Base mainnet deployment + proof, 2026-06-20:

- SpendPolicy: `0x73C862a8312c12C764487a9a484f1d1ad44E3957`
- Deploy tx: `0x63de9403bce99cbb0665f12af5ad0a968eedc3f6ce1e9de2db1e059dfab508a3`
- Within-cap `MandateCharged` (0.10 USDC, payer -0.10 / merchant +0.10): `0x4e64eaddd25b3eb65b0d531d3e3237122775c1ca0fcae0497e3b073346334b00`
- Over-cap attempt blocked on-chain with `PerChargeExceeded` (no funds moved, zero gas).
- Env: `NEXT_PUBLIC_SPEND_POLICY_ADDRESS=0x73C862a8312c12C764487a9a484f1d1ad44E3957`.

Demo script: `docs/demo-runbook.md`.

## Arbitrum-first (bonus track)

Same SpendPolicy + ReceiptEmitter deployed on Arbitrum One; per-chain SpendPolicy resolution wired (`getSpendPolicyAddress(chainId)`); the `/firewall` demo and the default invoice settlement now run on Arbitrum. Base deployment remains functional.

- SpendPolicy (Arbitrum): `0x9782e3724859469fbBAC5085EA8bf8E70724164E`
- ReceiptEmitter (Arbitrum): `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Proven live: `MandateCharged` (0.10 USDC, payer -0.10 / merchant +0.10) tx `0x33a4e69e2d4f0a2a9269bf9fb758b3043cbae4c5e146e3e16cf9c75d439b9ced`; over-cap blocked with `PerChargeExceeded`.
- Env: `NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM`, `NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS`.
- Proof anchoring stays on Base for now (proven path); the Arbitrum ReceiptEmitter is deployed and ready if/when proof moves to Arbitrum.
