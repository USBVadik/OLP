import { type X402PaymentProof, type X402PaymentRequirements } from "./requirements";

export type ProofCheck = { ok: true } | { ok: false; reason: string };

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Settlement-independent validation of a payment proof against the resource's requirements:
 * the claimed amount must be >= the price, and the asset, recipient, and resource must match.
 *
 * This does NOT verify the proof on-chain — the route layers the on-chain MandateCharged check
 * (does `txHash` actually contain a charge of >= price to payTo?) on top of this pure gate.
 */
export function isPaymentSufficient(
  proof: X402PaymentProof,
  reqs: X402PaymentRequirements
): ProofCheck {
  if (!sameAddress(proof.asset, reqs.asset)) {
    return { ok: false, reason: `wrong asset: expected ${reqs.asset}` };
  }
  if (!sameAddress(proof.payTo, reqs.payTo)) {
    return { ok: false, reason: `wrong recipient (payTo): expected ${reqs.payTo}` };
  }
  if (proof.resource !== reqs.resource) {
    return { ok: false, reason: `wrong resource: expected ${reqs.resource}` };
  }

  let paid: bigint;
  let required: bigint;
  try {
    paid = BigInt(proof.amount);
    required = BigInt(reqs.maxAmountRequired);
  } catch {
    return { ok: false, reason: `non-numeric amount: ${proof.amount}` };
  }
  if (paid < required) {
    return { ok: false, reason: `insufficient amount: paid ${paid}, required ${required}` };
  }

  return { ok: true };
}
