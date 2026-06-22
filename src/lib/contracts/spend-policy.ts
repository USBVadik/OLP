/**
 * SpendPolicy contract helpers — on-chain enforcement of payer-signed PaymentMandates.
 * ABI is hand-written to match contracts/contracts/SpendPolicy.sol.
 */
import { type PaymentMandate } from "@/lib/mandates/types";

const MANDATE_TUPLE = {
  type: "tuple",
  name: "mandate",
  components: [
    { name: "payer", type: "address" },
    { name: "merchant", type: "address" },
    { name: "token", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "maxPerCharge", type: "uint256" },
    { name: "maxPerDay", type: "uint256" },
    { name: "totalCap", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const SPEND_POLICY_ABI = [
  {
    type: "function",
    name: "charge",
    stateMutability: "nonpayable",
    inputs: [MANDATE_TUPLE, { name: "signature", type: "bytes" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "mandateId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "chargeWithPermit",
    stateMutability: "nonpayable",
    inputs: [
      MANDATE_TUPLE,
      { name: "signature", type: "bytes" },
      { name: "amount", type: "uint256" },
      {
        type: "tuple",
        name: "permit",
        components: [
          { name: "value", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "v", type: "uint8" },
          { name: "r", type: "bytes32" },
          { name: "s", type: "bytes32" },
        ],
      },
    ],
    outputs: [{ name: "mandateId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "revoke",
    stateMutability: "nonpayable",
    inputs: [MANDATE_TUPLE],
    outputs: [],
  },
  {
    type: "function",
    name: "hashMandate",
    stateMutability: "view",
    inputs: [MANDATE_TUPLE],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getMandateState",
    stateMutability: "view",
    inputs: [{ name: "mandateId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "spentTotal", type: "uint256" },
          { name: "spentToday", type: "uint256" },
          { name: "dayStart", type: "uint256" },
          { name: "revoked", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "remaining",
    stateMutability: "view",
    inputs: [MANDATE_TUPLE],
    outputs: [
      { name: "perCharge", type: "uint256" },
      { name: "today", type: "uint256" },
      { name: "total", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "MandateCharged",
    inputs: [
      { name: "mandateId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "spentTotal", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MandateRevoked",
    inputs: [
      { name: "mandateId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
    ],
  },
  { type: "error", name: "BadSignature", inputs: [] },
  { type: "error", name: "WrongChain", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "MandateExpired", inputs: [] },
  { type: "error", name: "MandateIsRevoked", inputs: [] },
  { type: "error", name: "PerChargeExceeded", inputs: [] },
  { type: "error", name: "DailyCapExceeded", inputs: [] },
  { type: "error", name: "TotalCapExceeded", inputs: [] },
  { type: "error", name: "NotPayer", inputs: [] },
] as const;

/** Convert a frontend PaymentMandate into the contract tuple form (uint fields as bigint). */
export function toContractMandate(m: PaymentMandate) {
  return {
    payer: m.payer,
    merchant: m.merchant,
    token: m.token,
    chainId: BigInt(m.chainId),
    maxPerCharge: m.maxPerCharge,
    maxPerDay: m.maxPerDay,
    totalCap: m.totalCap,
    expiry: BigInt(m.expiry),
    nonce: m.nonce,
  };
}
