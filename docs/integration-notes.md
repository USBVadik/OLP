# Integration Notes

## Exact SDK Versions

| Package | Version |
|---|---:|
| `@particle-network/authkit` | 2.1.1, installed but not used |
| `@particle-network/universal-account-sdk` | 1.1.1 |
| `magic-sdk` | 29.4.2 |
| `viem` | 2.48.8 |
| `ethers` | 6.16.0 |
| `next` | 14.2.35 |
| `@openzeppelin/contracts` | 5.6.1 |

## Active Milestone B Fallback Flow

This is pre-hackathon prototyping, not final submission work.

The active checkout flow is Particle `createTransferTransaction()` plus server-side verification and ReceiptEmitter proof.

1. Magic login returns the customer EOA.
2. Particle UA is initialized with `ownerAddress`.
3. `getPrimaryAssets()` reads unified balances.
4. Checkout requires `contract_invoice_id` and `registered_tx_hash`.
5. `createTransferTransaction()` sends Base USDC to the merchant.
6. `inspectUserOps` logs EIP-7702 authorization fields when present.
7. Magic signs `transaction.rootHash` with `personal_sign`.
8. `ua.sendTransaction()` submits the transaction.
9. `mark-paid` verifies the Base USDC `Transfer` server-side.
10. Backend calls `recordVerifiedPayment()` and verifies `InvoicePaid` before marking Supabase paid.

## Contract

ReceiptEmitter v1.1 uses OpenZeppelin `5.6.1`.

Active Base mainnet deployment:

- Address: `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- Explorer: `https://basescan.org/address/0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`
- Deploy tx: `0x6148c0780797c91210c62650b5f4d79316995ff21112616e04d4b18c626afc57`
- Owner: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

Important imports:

```solidity
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```

Public functions:

- `registerInvoice(bytes32 invoiceId, address merchant, address token, uint256 amount, uint256 deadline) onlyOwner`
- `payInvoice(bytes32 invoiceId) nonReentrant`
- `recordVerifiedPayment(bytes32 invoiceId, address payer, bytes32 paymentTxHash) onlyOwner nonReentrant`
- `isPaid(bytes32 invoiceId)`
- `getInvoice(bytes32 invoiceId)`

`recordVerifiedPayment` is the active fallback proof path. It marks the invoice paid before emitting `InvoicePaid` and stores the verified payment tx hash.

## Backend Verification

`POST /api/payments/[id]/mark-paid` verifies:

- Base mainnet receipt exists.
- `receipt.status === success`.
- Base USDC `Transfer` log exists.
- Transfer recipient is the invoice merchant.
- Transfer amount is the invoice amount.
- Payment tx hash was not already used for another invoice.
- `recordVerifiedPayment` proof tx succeeds.
- Proof tx emits matching `InvoicePaid`.

If the link is already completed with the same tx hash, the endpoint returns success. If completed with a different tx hash, it returns conflict.

## Historical Proofs

The transfer-only P0 succeeded as a Particle UA value-movement proof, but it is now historical because it did not emit `InvoicePaid`.

The old Base Sepolia ReceiptEmitter v0 is historical:

- Address: `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`
- Deploy tx: `0x351db8dfa40cd5c70423510524133b186fe995b5ac7f52d6704ce09ea4d64fcc`

It shares the same hex address as the active Base mainnet contract, but it is a different deployment on a different chain.

## Known Risk

Particle `createUniversalTransaction()` currently returns a maintenance error for custom calls in this project. The strict custom-call path remains documented as blocked, while the active Milestone B fallback uses `createTransferTransaction()` plus server-side verification and on-chain proof.

## Chain Config

Chain and token config lives in `src/lib/config/payment.ts`.

- Active: Base mainnet, USDC, ReceiptEmitter v1.1.
- Exploratory inactive: Arbitrum One, native USDC, optional ReceiptEmitter address.

Arbitrum spike notes live in `docs/arbitrum-spike.md`.
