import {
  encodeFunctionData,
  formatUnits,
  isAddress,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";

export const ARBITRUM_ONE_CHAIN_ID = 42161;
export const PRIMARY_USDC_TOKEN_TYPE = "usdc" as const;

export const ERC20_APPROVE_INTENT_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface ExpenseCardArmIntentInput {
  chainId: number;
  tokenAddress: string;
  spendPolicyAddress: string;
  amountAtomic: bigint;
  totalCapAtomic: bigint;
}

export interface ExpenseCardArmIntent {
  request: {
    chainId: number;
    expectTokens: Array<{ type: typeof PRIMARY_USDC_TOKEN_TYPE; amount: string }>;
    transactions: Array<{ to: Address; data: Hex; value: "0x0" }>;
  };
  options: {
    usePrimaryTokens: Array<typeof PRIMARY_USDC_TOKEN_TYPE>;
    slippageBps: 100;
  };
}

/**
 * Build the smallest Particle custom-call intent that could prepare an Arbitrum Expense Card.
 * This function only returns calldata. It has no provider, signer, or transaction side effects.
 */
export function buildExpenseCardArmIntent(
  input: ExpenseCardArmIntentInput
): ExpenseCardArmIntent {
  if (input.chainId !== ARBITRUM_ONE_CHAIN_ID) {
    throw new Error("Expense Card funding probe supports Arbitrum One only");
  }
  if (!isAddress(input.tokenAddress) || input.tokenAddress === zeroAddress) {
    throw new Error("Invalid token address");
  }
  if (!isAddress(input.spendPolicyAddress) || input.spendPolicyAddress === zeroAddress) {
    throw new Error("Invalid SpendPolicy address");
  }
  if (input.amountAtomic <= 0n || input.totalCapAtomic <= 0n) {
    throw new Error("Approval amount and total cap must be positive");
  }
  if (input.amountAtomic > input.totalCapAtomic) {
    throw new Error("Approval amount cannot exceed the signed total cap");
  }

  const tokenAddress = input.tokenAddress as Address;
  const spendPolicyAddress = input.spendPolicyAddress as Address;

  return {
    request: {
      chainId: input.chainId,
      expectTokens: [
        {
          type: PRIMARY_USDC_TOKEN_TYPE,
          amount: formatUnits(input.amountAtomic, 6),
        },
      ],
      transactions: [
        {
          to: tokenAddress,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_INTENT_ABI,
            functionName: "approve",
            args: [spendPolicyAddress, input.amountAtomic],
          }),
          value: "0x0",
        },
      ],
    },
    options: {
      usePrimaryTokens: [PRIMARY_USDC_TOKEN_TYPE],
      slippageBps: 100,
    },
  };
}
