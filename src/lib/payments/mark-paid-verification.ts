import { parseEventLogs, type Address, type Hex, type Log } from "viem";
import { type ChainPaymentConfig } from "@/lib/config/payment";

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

export interface PaymentLinkVerificationFields {
  status: string;
  paid_tx_hash: string | null;
  merchant_address: Address;
  amount: string | number;
}

export interface PaymentReceiptLike {
  status: "success" | "reverted";
  logs: Log[];
}

export interface MatchingTransfer {
  from: Address;
  to: Address;
  value: bigint;
}

export function normalizeAddress(address: string | null | undefined) {
  return address?.toLowerCase();
}

export function assertCanMarkPaid(
  link: Pick<PaymentLinkVerificationFields, "status" | "paid_tx_hash">,
  submittedTxHash: string
) {
  if (link.status !== "completed") return { deduped: false };

  if (normalizeAddress(link.paid_tx_hash) === normalizeAddress(submittedTxHash)) {
    return { deduped: true };
  }

  throw new Error("Payment link is already completed with a different tx hash");
}

export function verifyUsdcTransferForPayment({
  receipt,
  chain,
  link,
  txHash,
}: {
  receipt: PaymentReceiptLike;
  chain: Pick<ChainPaymentConfig, "name" | "usdcAddress">;
  link: Pick<PaymentLinkVerificationFields, "merchant_address" | "amount">;
  txHash: Hex;
}): MatchingTransfer {
  if (receipt.status !== "success") {
    throw new Error(`Transaction failed on ${chain.name}: ${txHash}`);
  }

  const usdcLogs = receipt.logs.filter(
    (log) => normalizeAddress(log.address) === normalizeAddress(chain.usdcAddress)
  );
  const transferLogs = parseEventLogs({
    abi: ERC20_TRANSFER_EVENT_ABI,
    eventName: "Transfer",
    logs: usdcLogs,
  });

  const expectedAmount = BigInt(link.amount);
  const matchingTransfer = transferLogs.find(
    (log) =>
      normalizeAddress(log.args.to) === normalizeAddress(link.merchant_address) &&
      log.args.value === expectedAmount
  );

  if (!matchingTransfer) {
    throw new Error(`Matching ${chain.name} USDC Transfer to merchant for invoice amount was not found`);
  }

  return {
    from: matchingTransfer.args.from,
    to: matchingTransfer.args.to,
    value: matchingTransfer.args.value,
  };
}
