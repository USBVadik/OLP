import { decodeEventLog, isAddress, parseAbiItem, type Hex } from "viem";

const PARTICLE_FINISHED = 7;
const TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);

export interface ExpenseCardFundingOperation {
  chainId?: unknown;
  txHash?: unknown;
  status?: unknown;
}

export interface ExpenseCardFundingActivity {
  status?: unknown;
  sender?: unknown;
  tokenChanges?: {
    fromChains?: unknown;
    toChains?: unknown;
    decr?: unknown;
  } | null;
  depositUserOperations?: unknown;
  lendingUserOperations?: unknown;
  settlementUserOperations?: unknown;
  refundUserOperations?: unknown;
}

export interface FundingOperationReceipt {
  chainId: number;
  txHash: Hex;
  status: "success" | "reverted";
  logs: Array<{
    address: string;
    topics: readonly Hex[];
    data: Hex;
  }>;
}

export interface ExpenseCardFundingEvidenceContext {
  payer: string;
  settlementChainId: number;
  settlementTokenAddress: string;
  spendPolicyAddress: string;
  requiredAmount: bigint;
  usdcByChain: Record<number, string>;
}

export interface ExpenseCardFundingEvidence {
  verified: boolean;
  reason: string;
  crossChain: boolean;
  sourceChainIds: number[];
  sourceLegs: Array<{ chainId: number; txHash: Hex }>;
  destinationTxHashes: Hex[];
  approvalTxHash: Hex | null;
  approvedAmount: bigint | null;
}

function failed(reason: string): ExpenseCardFundingEvidence {
  return {
    verified: false,
    reason,
    crossChain: false,
    sourceChainIds: [],
    sourceLegs: [],
    destinationTxHashes: [],
    approvalTxHash: null,
    approvedAmount: null,
  };
}

function sameAddress(left: unknown, right: string): boolean {
  return typeof left === "string" && left.toLowerCase() === right.toLowerCase();
}

function uniqueChainIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (entry): entry is number => Number.isInteger(entry) && Number(entry) > 0,
      ),
    ),
  );
}

export function collectExpenseCardFundingOperations(
  activity: ExpenseCardFundingActivity | null | undefined,
): Array<{ chainId: number; txHash: Hex }> {
  if (!activity) return [];
  const groups = [
    activity.depositUserOperations,
    activity.lendingUserOperations,
    activity.settlementUserOperations,
  ];
  const seen = new Set<string>();
  const operations: Array<{ chainId: number; txHash: Hex }> = [];

  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const raw of group as ExpenseCardFundingOperation[]) {
      const chainId = Number(raw?.chainId);
      const txHash = raw?.txHash;
      if (!Number.isInteger(chainId) || chainId <= 0 || typeof txHash !== "string" || !TX_HASH.test(txHash)) {
        continue;
      }
      const key = `${chainId}:${txHash.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      operations.push({ chainId, txHash: txHash as Hex });
    }
  }

  return operations;
}

function normalizedSourceDebit(
  activity: ExpenseCardFundingActivity,
  chainId: number,
  expectedAddress: string,
): bigint | null {
  const decrements = activity.tokenChanges?.decr;
  if (!Array.isArray(decrements)) return null;

  let matched = false;
  let total = 0n;
  for (const entry of decrements) {
    if (!entry || typeof entry !== "object") continue;
    const token = (entry as { token?: unknown }).token;
    if (!token || typeof token !== "object") continue;
    const candidate = token as { chainId?: unknown; address?: unknown; type?: unknown; symbol?: unknown };
    const isExpectedToken =
      Number(candidate.chainId) === chainId &&
      sameAddress(candidate.address, expectedAddress) &&
      (String(candidate.type ?? "").toLowerCase() === "usdc" ||
        String(candidate.symbol ?? "").toUpperCase() === "USDC");
    if (!isExpectedToken) continue;

    const rawAmount = (entry as { amount?: unknown }).amount;
    if (typeof rawAmount !== "string" || !/^(0x[a-fA-F0-9]+|\d+)$/.test(rawAmount)) {
      return null;
    }
    matched = true;
    total += BigInt(rawAmount);
  }
  return matched ? total : null;
}

function decodeMatchingApproval(
  receipt: FundingOperationReceipt,
  context: ExpenseCardFundingEvidenceContext,
): bigint | null {
  for (const log of receipt.logs) {
    if (!sameAddress(log.address, context.settlementTokenAddress)) continue;
    if (log.topics.length === 0) continue;
    try {
      const decoded = decodeEventLog({
        abi: [approvalEvent],
        eventName: "Approval",
        topics: log.topics as [Hex, ...Hex[]],
        data: log.data,
        strict: true,
      });
      const args = decoded.args as {
        owner?: string;
        spender?: string;
        value?: bigint;
      };
      if (!sameAddress(args.owner, context.payer)) continue;
      if (!sameAddress(args.spender, context.spendPolicyAddress)) continue;
      if (typeof args.value !== "bigint" || args.value !== context.requiredAmount) continue;
      return args.value;
    } catch {
      // A receipt can contain unrelated USDC logs. Only an exact Approval earns evidence.
    }
  }
  return null;
}

export function deriveExpenseCardFundingEvidence(
  activity: ExpenseCardFundingActivity | null | undefined,
  receipts: FundingOperationReceipt[],
  context: ExpenseCardFundingEvidenceContext,
): ExpenseCardFundingEvidence {
  if (!activity || typeof activity !== "object") return failed("Particle activity is missing");
  if (
    !isAddress(context.payer) ||
    !isAddress(context.settlementTokenAddress) ||
    !isAddress(context.spendPolicyAddress) ||
    !Number.isInteger(context.settlementChainId) ||
    context.settlementChainId <= 0 ||
    context.requiredAmount <= 0n
  ) {
    return failed("Expense Card verification context or amount is invalid");
  }
  if (Number(activity.status) !== PARTICLE_FINISHED) {
    return failed("Particle activity is not FINISHED");
  }
  if (!sameAddress(activity.sender, context.payer)) {
    return failed("Particle activity sender does not match the Expense Card owner");
  }

  const fromChainIds = uniqueChainIds(activity.tokenChanges?.fromChains);
  const toChainIds = uniqueChainIds(activity.tokenChanges?.toChains);
  if (fromChainIds.length === 0) {
    return failed("Particle activity has no funding source chains");
  }
  if (!toChainIds.includes(context.settlementChainId)) {
    return failed("Particle activity destination does not include the Expense Card chain");
  }

  let totalSourceDebit18 = 0n;
  for (const chainId of fromChainIds) {
    const expectedToken = context.usdcByChain[chainId];
    if (!expectedToken || !isAddress(expectedToken)) {
      return failed(`Particle activity uses unsupported source chain ${chainId}`);
    }
    const debit = normalizedSourceDebit(activity, chainId, expectedToken);
    if (debit === null) {
      return failed(`Particle activity source token does not match USDC on chain ${chainId}`);
    }
    totalSourceDebit18 += debit;
  }
  // Particle normalizes primary-token activity amounts to 18 decimals while native USDC uses 6.
  // The source debit can exceed the card budget because it also covers routing fees, but it may
  // never be smaller than the exact budget we are claiming was made available.
  if (totalSourceDebit18 < context.requiredAmount * 1_000_000_000_000n) {
    return failed("Particle activity USDC source amount is below the Expense Card budget");
  }

  const operations = collectExpenseCardFundingOperations(activity);
  const operationKeys = new Set(
    operations.map((operation) => `${operation.chainId}:${operation.txHash.toLowerCase()}`),
  );
  const matchedReceipts = receipts.filter((receipt) =>
    operationKeys.has(`${receipt.chainId}:${receipt.txHash.toLowerCase()}`),
  );
  const successfulReceipts = matchedReceipts.filter((receipt) => receipt.status === "success");

  const sourceChainIds = fromChainIds.filter((chainId) => chainId !== context.settlementChainId);
  const sourceLegs: Array<{ chainId: number; txHash: Hex }> = [];
  for (const chainId of sourceChainIds) {
    const legs = successfulReceipts.filter((receipt) => receipt.chainId === chainId);
    if (legs.length === 0) {
      return failed(`Particle activity has no successful on-chain source leg for chain ${chainId}`);
    }
    sourceLegs.push(...legs.map((receipt) => ({ chainId, txHash: receipt.txHash })));
  }

  const destinationReceipts = successfulReceipts.filter(
    (receipt) => receipt.chainId === context.settlementChainId,
  );
  let approvalTxHash: Hex | null = null;
  let approvedAmount: bigint | null = null;
  for (const receipt of destinationReceipts) {
    const amount = decodeMatchingApproval(receipt, context);
    if (amount === null) continue;
    approvalTxHash = receipt.txHash;
    approvedAmount = amount;
    break;
  }
  if (!approvalTxHash || approvedAmount === null) {
    return failed("Matching on-chain USDC Approval was not found in the Particle destination leg");
  }

  return {
    verified: true,
    reason: "ok",
    crossChain: sourceChainIds.length > 0,
    sourceChainIds,
    sourceLegs,
    destinationTxHashes: destinationReceipts.map((receipt) => receipt.txHash),
    approvalTxHash,
    approvedAmount,
  };
}
