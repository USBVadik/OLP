import type { Address } from "viem";
import type { PaymentMandate } from "@/lib/mandates/types";

export const RESEARCH_AGENT_MERCHANT: Address =
  "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
export const RESEARCH_AGENT_BASIS_ATOMIC = 100_000n;
export const RESEARCH_AGENT_DAILY_FUNDING_ATOMIC = 2_000_000n;
export const RESEARCH_AGENT_TOTAL_CAP_ATOMIC = 10_000_000n;

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function assertResearchAgentFundingMandate(input: {
  mandate: PaymentMandate;
  payerAddress: string;
  chainId: number;
  tokenAddress: string;
}): void {
  const { mandate } = input;
  if (
    !sameAddress(mandate.payer, input.payerAddress) ||
    !sameAddress(mandate.merchant, RESEARCH_AGENT_MERCHANT) ||
    !sameAddress(mandate.token, input.tokenAddress) ||
    mandate.chainId !== input.chainId ||
    mandate.maxPerCharge !== RESEARCH_AGENT_BASIS_ATOMIC ||
    mandate.maxPerDay !== RESEARCH_AGENT_DAILY_FUNDING_ATOMIC ||
    mandate.totalCap !== RESEARCH_AGENT_TOTAL_CAP_ATOMIC ||
    mandate.expiry <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Signed mandate does not match the Research Agent Expense Card limits");
  }
}
