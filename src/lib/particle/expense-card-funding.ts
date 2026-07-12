const UA_FINISHED = 7;

const UA_FAILED_STATUS: Record<number, string> = {
  6: "EXECUTION_FAILED",
  8: "REFUND_LOCAL",
  9: "REFUND_PENDING",
  10: "REFUND_FAILED",
  11: "REFUND_FINISHED",
  14: "PENNY_FAILED",
};

type PublicEnv = Record<string, string | undefined>;

export function isUaFundedExpenseCardEnabled(env: PublicEnv = process.env): boolean {
  return env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT === "true";
}

export function getExpenseCardFundingAmount(input: {
  maxPerDay: bigint;
  totalCap: bigint;
}): bigint {
  if (input.totalCap <= 0n || input.maxPerDay < 0n) {
    throw new Error("Expense Card caps must be positive");
  }
  if (input.maxPerDay === 0n) return input.totalCap;
  return input.maxPerDay < input.totalCap ? input.maxPerDay : input.totalCap;
}

export function assertExpenseCardAllowance(allowance: bigint, required: bigint): void {
  if (required <= 0n || allowance < 0n) {
    throw new Error("Expense Card allowance requirement must be positive");
  }
  if (allowance < required) {
    throw new Error(
      `Expense Card allowance verification failed: expected at least ${required}, received ${allowance}. The agent was not armed.`,
    );
  }
}

export function assertExpenseCardReadiness(input: {
  balance: bigint;
  allowance: bigint;
  required: bigint;
}): void {
  assertExpenseCardAllowance(input.allowance, input.required);
  if (input.balance < input.required) {
    throw new Error(
      `Expense Card balance verification failed: expected at least ${input.required}, received ${input.balance}. The agent was not armed.`,
    );
  }
}

function uniqueChainIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.filter((value): value is number => Number.isInteger(value) && Number(value) > 0)),
  );
}

function userOps(transaction: any): any[] {
  const entries = transaction?.userOps ?? transaction?.data?.userOps;
  return Array.isArray(entries) ? entries : [];
}

function feeUsdFromQuote(transaction: any): { feeUsd: number | null; feeSymbol: string | null } {
  try {
    const fees = transaction?.feeQuotes?.[0]?.fees;
    const raw = fees?.totals?.feeTokenAmountInUSD;
    const symbol = fees?.feeTokens?.[0]?.token?.symbol;
    if (typeof raw !== "string" || !/^0x[0-9a-f]+$/i.test(raw)) {
      return { feeUsd: null, feeSymbol: null };
    }
    const value = Number(BigInt(raw)) / 1e18;
    if (!Number.isFinite(value) || value < 0) return { feeUsd: null, feeSymbol: null };
    return {
      feeUsd: value,
      feeSymbol: typeof symbol === "string" && symbol ? symbol.toUpperCase() : "USDC",
    };
  } catch {
    return { feeUsd: null, feeSymbol: null };
  }
}

export interface ExpenseCardFundingPreview {
  rootHashPresent: boolean;
  transactionId: string | null;
  userOpChainIds: number[];
  sourceChainIds: number[];
  destinationChainIds: number[];
  crossChain: boolean;
  feeUsd: number | null;
  feeSymbol: string | null;
}

export function summarizeExpenseCardFundingPreview(transaction: any): ExpenseCardFundingPreview {
  const sourceChainIds = uniqueChainIds(transaction?.tokenChanges?.fromChains);
  const destinationChainIds = uniqueChainIds(transaction?.tokenChanges?.toChains);
  const userOpChainIds = uniqueChainIds(userOps(transaction).map((entry) => entry?.chainId));
  const destinations = new Set(destinationChainIds);
  // Multiple user-ops can represent fee/routing machinery without proving that value was sourced
  // from another chain. Only Particle tokenChanges with a foreign source earn the cross-chain label.
  const crossChain = sourceChainIds.some((chainId) => !destinations.has(chainId));
  const fee = feeUsdFromQuote(transaction);

  return {
    rootHashPresent: Boolean(transaction?.rootHash),
    transactionId:
      typeof transaction?.transactionId === "string" ? transaction.transactionId : null,
    userOpChainIds,
    sourceChainIds,
    destinationChainIds,
    crossChain,
    ...fee,
  };
}

function sameNumbers(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort((a, b) => a - b);
  const rightSorted = [...right].sort((a, b) => a - b);
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

export function hasMaterialExpenseCardPreviewChange(
  previous: ExpenseCardFundingPreview,
  fresh: ExpenseCardFundingPreview,
): boolean {
  if (!sameNumbers(previous.sourceChainIds, fresh.sourceChainIds)) return true;
  if (!sameNumbers(previous.destinationChainIds, fresh.destinationChainIds)) return true;

  if ((previous.feeUsd === null) !== (fresh.feeUsd === null)) return true;
  if (previous.feeUsd !== null && fresh.feeUsd !== null) {
    const allowedIncrease = Math.max(0.05, previous.feeUsd * 0.2);
    if (fresh.feeUsd > previous.feeUsd + allowedIncrease) return true;
  }
  return false;
}

export async function prepareExpenseCardFundingTransaction(input: {
  initialTransaction: any;
  buildTransaction: () => Promise<any>;
  ensureDelegated: (chainId: number) => Promise<unknown>;
}): Promise<{ transaction: any; routedChainIds: number[] }> {
  const initial = summarizeExpenseCardFundingPreview(input.initialTransaction);
  if (!initial.rootHashPresent) {
    throw new Error("Particle funding preview is missing rootHash");
  }
  if (initial.userOpChainIds.length === 0) {
    throw new Error("Particle funding preview has no routed user-op chains");
  }

  for (const chainId of initial.userOpChainIds) {
    await input.ensureDelegated(chainId);
  }

  // Delegation changes the user-op authorization shape. Always rebuild and sign the fresh root.
  const transaction = await input.buildTransaction();
  const fresh = summarizeExpenseCardFundingPreview(transaction);
  if (!fresh.rootHashPresent) {
    throw new Error("Fresh Particle funding transaction is missing rootHash");
  }

  return { transaction, routedChainIds: fresh.userOpChainIds };
}

export interface ExpenseCardAuthorizationRequest {
  contractAddress: string;
  chainId: number;
  legChainId: number;
  nonce: number;
}

export async function sendExpenseCardFundingTransaction(input: {
  transaction: any;
  signAuthorization: (request: ExpenseCardAuthorizationRequest) => Promise<string>;
  signRootHash: (rootHash: string) => Promise<string>;
  sendTransaction: (
    transaction: any,
    rootSignature: string,
    authorizations: Array<{ userOpHash: string; signature: string }> | undefined,
  ) => Promise<any>;
}): Promise<any> {
  const rootHash = input.transaction?.rootHash;
  if (typeof rootHash !== "string" || !rootHash) {
    throw new Error("Particle funding transaction is missing rootHash");
  }

  const signatureCache = new Map<string, string>();
  const authorizations: Array<{ userOpHash: string; signature: string }> = [];

  for (const entry of userOps(input.transaction)) {
    const operation = entry?.userOp ?? {};
    const auth = operation?.eip7702Auth ?? entry?.eip7702Auth;
    const delegated = operation?.eip7702Delegated ?? entry?.eip7702Delegated;
    if (!auth || delegated === true) continue;
    if (typeof entry?.userOpHash !== "string") {
      throw new Error("Particle inline authorization is missing userOpHash");
    }

    const legChainId = Number(entry?.chainId);
    const authChainId = Number(auth?.chainId ?? legChainId);
    const nonce = Number(auth?.nonce);
    const contractAddress = String(auth?.address ?? "");
    if (!Number.isInteger(legChainId) || !Number.isInteger(authChainId) || !Number.isInteger(nonce) || !contractAddress) {
      throw new Error("Particle inline authorization is malformed");
    }

    const cacheKey = `${contractAddress.toLowerCase()}:${authChainId}:${nonce}`;
    let signature = signatureCache.get(cacheKey);
    if (!signature) {
      try {
        signature = await input.signAuthorization({
          contractAddress,
          chainId: authChainId,
          legChainId,
          nonce,
        });
      } catch (error) {
        if (authChainId !== 0) throw error;
        signature = await input.signAuthorization({
          contractAddress,
          chainId: legChainId,
          legChainId,
          nonce,
        });
      }
      signatureCache.set(cacheKey, signature);
    }
    authorizations.push({ userOpHash: entry.userOpHash, signature });
  }

  const rootSignature = await input.signRootHash(rootHash);
  return input.sendTransaction(
    input.transaction,
    rootSignature,
    authorizations.length > 0 ? authorizations : undefined,
  );
}

export async function waitForExpenseCardFunding(input: {
  transactionId: string;
  getTransaction: (transactionId: string) => Promise<any>;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  intervalMs?: number;
  onStatus?: (status: number, attempt: number) => void;
}): Promise<any> {
  if (!input.transactionId) throw new Error("Particle funding transactionId is missing");
  const maxAttempts = input.maxAttempts ?? 20;
  const intervalMs = input.intervalMs ?? 3_000;
  const sleep = input.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const activity = await input.getTransaction(input.transactionId);
    const status = Number(activity?.status);
    input.onStatus?.(status, attempt);
    if (status === UA_FINISHED) return activity;
    if (status in UA_FAILED_STATUS) {
      throw new Error(
        `Particle Expense Card funding failed (status ${status} = ${UA_FAILED_STATUS[status]}). The agent was not armed.`,
      );
    }
    if (attempt < maxAttempts) await sleep(intervalMs);
  }

  throw new Error(
    "Particle has not confirmed Expense Card funding yet. The agent was not armed. Do not retry blindly; inspect the Universal Account activity first.",
  );
}
