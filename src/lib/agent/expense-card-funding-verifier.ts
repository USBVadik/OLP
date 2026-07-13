import { createPublicClient, http, type Address, type Hex } from "viem";
import { arbitrum, base, optimism } from "viem/chains";
import {
  collectExpenseCardFundingOperations,
  deriveExpenseCardFundingEvidence,
  type ExpenseCardFundingActivity,
  type ExpenseCardFundingEvidence,
  type ExpenseCardFundingEvidenceContext,
  type FundingOperationReceipt,
} from "./expense-card-funding-evidence";

const MAX_ACTIVITY_OPERATIONS = 24;
const PARTICLE_TIMEOUT_MS = 10_000;
const RPC_TIMEOUT_MS = 10_000;
const balanceOfAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms),
    ),
  ]);
}

function serverRpcUrl(chainId: number): string {
  if (chainId === base.id) {
    return (
      process.env.BASE_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_BASE_RPC_URL ||
      "https://mainnet.base.org"
    );
  }
  if (chainId === arbitrum.id) {
    return (
      process.env.ARBITRUM_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
      "https://arb1.arbitrum.io/rpc"
    );
  }
  if (chainId === optimism.id) {
    return (
      process.env.OPTIMISM_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL ||
      "https://mainnet.optimism.io"
    );
  }
  throw new Error(`Unsupported Particle funding chain ${chainId}`);
}

function viemChain(chainId: number) {
  if (chainId === base.id) return base;
  if (chainId === arbitrum.id) return arbitrum;
  if (chainId === optimism.id) return optimism;
  throw new Error(`Unsupported Particle funding chain ${chainId}`);
}

async function readOperationReceipt(input: {
  chainId: number;
  txHash: Hex;
}): Promise<FundingOperationReceipt> {
  const client = createPublicClient({
    chain: viemChain(input.chainId),
    transport: http(serverRpcUrl(input.chainId)),
  });
  const receipt = await withTimeout(
    client.getTransactionReceipt({ hash: input.txHash }),
    RPC_TIMEOUT_MS,
    `Receipt ${input.txHash}`,
  );
  return {
    chainId: input.chainId,
    txHash: input.txHash,
    status: receipt.status,
    logs: receipt.logs.map((log) => ({
      address: log.address,
      topics: log.topics,
      data: log.data,
    })),
  };
}

export interface ExpenseCardFundingVerificationProviders {
  getActivity: (uaTransactionId: string) => Promise<ExpenseCardFundingActivity>;
  getReceipt: (operation: { chainId: number; txHash: Hex }) => Promise<FundingOperationReceipt>;
  getDestinationBalance: () => Promise<bigint>;
}

export interface ServerVerifiedExpenseCardFundingEvidence extends ExpenseCardFundingEvidence {
  destinationBalance: bigint;
}

export async function verifyExpenseCardFundingWithProviders(input: {
  uaTransactionId: string;
  context: ExpenseCardFundingEvidenceContext;
  providers: ExpenseCardFundingVerificationProviders;
}): Promise<ServerVerifiedExpenseCardFundingEvidence> {
  const activity = await input.providers.getActivity(input.uaTransactionId);
  const operations = collectExpenseCardFundingOperations(activity);
  if (operations.length === 0) {
    throw new Error("Particle activity has no on-chain operations");
  }
  if (operations.length > MAX_ACTIVITY_OPERATIONS) {
    throw new Error("Particle activity has too many on-chain operations to verify safely");
  }

  const receipts = await Promise.all(
    operations.map((operation) => input.providers.getReceipt(operation)),
  );
  const evidence = deriveExpenseCardFundingEvidence(activity, receipts, input.context);
  if (!evidence.verified) {
    throw new Error(`Expense Card funding verification failed: ${evidence.reason}`);
  }
  const destinationBalance = await input.providers.getDestinationBalance();
  if (destinationBalance < input.context.requiredAmount) {
    throw new Error(
      `Expense Card funding verification failed: Arbitrum USDC balance ${destinationBalance} is below ${input.context.requiredAmount}`,
    );
  }
  return { ...evidence, destinationBalance };
}

export async function verifyExpenseCardFundingServerSide(input: {
  uaTransactionId: string;
  context: ExpenseCardFundingEvidenceContext;
}): Promise<ServerVerifiedExpenseCardFundingEvidence> {
  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const projectClientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const projectAppUuid = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;
  if (!projectId || !projectClientKey || !projectAppUuid) {
    throw new Error("Particle server verification is not configured");
  }

  const { UniversalAccount, UNIVERSAL_ACCOUNT_VERSION } = await import(
    "@particle-network/universal-account-sdk"
  );
  const ua = new UniversalAccount({
    projectId,
    projectClientKey,
    projectAppUuid,
    smartAccountOptions: {
      useEIP7702: true,
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress: input.context.payer,
    },
  });

  return verifyExpenseCardFundingWithProviders({
    ...input,
    providers: {
      getActivity: (uaTransactionId) =>
        withTimeout(
          ua.getTransaction(uaTransactionId) as Promise<ExpenseCardFundingActivity>,
          PARTICLE_TIMEOUT_MS,
          "Particle getTransaction",
        ),
      getReceipt: readOperationReceipt,
      getDestinationBalance: async () => {
        const client = createPublicClient({
          chain: viemChain(input.context.settlementChainId),
          transport: http(serverRpcUrl(input.context.settlementChainId)),
        });
        return withTimeout(
          client.readContract({
            address: input.context.settlementTokenAddress as Address,
            abi: balanceOfAbi,
            functionName: "balanceOf",
            args: [input.context.payer as Address],
          }),
          RPC_TIMEOUT_MS,
          "Destination USDC balance",
        );
      },
    },
  });
}
