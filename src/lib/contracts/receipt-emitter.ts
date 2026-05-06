/**
 * ReceiptEmitter v1.1 contract helpers.
 */
import { type Address } from "viem";
import { PAYMENT_CHAINS } from "@/lib/config/payment";

export const BASE_MAINNET_CHAIN_ID = PAYMENT_CHAINS.base.chainId;
export const BASE_MAINNET_USDC: Address = PAYMENT_CHAINS.base.usdcAddress;
export const ARBITRUM_MAINNET_CHAIN_ID = PAYMENT_CHAINS.arbitrum.chainId;
export const ARBITRUM_MAINNET_USDC: Address = PAYMENT_CHAINS.arbitrum.usdcAddress;

export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export const ERC20_TRANSFER_EVENT_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const RECEIPT_EMITTER_ABI = [
  {
    type: "function",
    name: "registerInvoice",
    inputs: [
      { name: "invoiceId", type: "bytes32" },
      { name: "merchant", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "payInvoice",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "recordVerifiedPayment",
    inputs: [
      { name: "invoiceId", type: "bytes32" },
      { name: "payer", type: "address" },
      { name: "paymentTxHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isPaid",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInvoice",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "invoiceId", type: "bytes32" },
          { name: "merchant", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "paid", type: "bool" },
          { name: "payer", type: "address" },
          { name: "paidAt", type: "uint256" },
          { name: "paymentTxHash", type: "bytes32" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "InvoiceRegistered",
    inputs: [
      { name: "invoiceId", type: "bytes32", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "InvoicePaid",
    inputs: [
      { name: "invoiceId", type: "bytes32", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "chainId", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export function getReceiptEmitterAddress(): Address {
  const addr = process.env.NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS is not configured");
  return addr as Address;
}

export function getArbitrumReceiptEmitterAddress(): Address | null {
  const addr = process.env.NEXT_PUBLIC_ARBITRUM_RECEIPT_EMITTER_ADDRESS;
  return addr ? (addr as Address) : null;
}

export function getBaseScanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

export function getArbiscanTxUrl(txHash: string): string {
  return `https://arbiscan.io/tx/${txHash}`;
}
