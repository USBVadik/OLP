export interface FundingEvidenceIdentity {
  ua_transaction_id: string;
  mandate_id: string;
  payer_address: string;
  settlement_chain_id: number;
  token_address: string;
  spend_policy_address: string;
  required_amount: string;
}

export interface StoredFundingEvidence extends FundingEvidenceIdentity {
  approved_amount: string;
  destination_balance: string;
  cross_chain: boolean;
  source_chain_ids: number[];
  source_legs: Array<{ chainId: number; txHash: string }>;
  destination_tx_hashes: string[];
  approval_tx_hash: string;
  verified_at: string;
}

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function assertFundingEvidenceIdentity(
  existing: FundingEvidenceIdentity,
  expected: FundingEvidenceIdentity,
): void {
  const matches =
    existing.ua_transaction_id === expected.ua_transaction_id &&
    existing.mandate_id.toLowerCase() === expected.mandate_id.toLowerCase() &&
    sameAddress(existing.payer_address, expected.payer_address) &&
    existing.settlement_chain_id === expected.settlement_chain_id &&
    sameAddress(existing.token_address, expected.token_address) &&
    sameAddress(existing.spend_policy_address, expected.spend_policy_address) &&
    existing.required_amount === expected.required_amount;

  if (!matches) {
    throw new Error(
      "Funding evidence is already recorded with different Expense Card funding parameters",
    );
  }
}
