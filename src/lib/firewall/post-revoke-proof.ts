import { BaseError, ContractFunctionRevertedError } from "viem";

/**
 * Post-revoke kill-switch proof — turns "the revoke button worked" into verified contract
 * behavior. After the revoke transaction mines, the caller SIMULATES one more within-cap
 * `SpendPolicy.charge` (read-only eth_call: no signature prompt, no broadcast, no gas) and shows
 * the live revert. The observed error name must be `MandateIsRevoked`; any earlier guard or RPC
 * failure remains explicitly inconclusive.
 *
 * Honesty: the copy only ever reports what the simulation actually returned. Anything other than
 * the expected revert is surfaced as-is (or as "inconclusive"), never claimed as proof.
 */

/** The SpendPolicy revert every post-revoke charge must hit. */
export const POST_REVOKE_EXPECTED_ERROR = "MandateIsRevoked";

/** Extract the named SpendPolicy error from a viem simulate/call revert, else null. */
export function revertErrorName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return null;
  return revert.data?.errorName ?? null;
}

export type PostRevokeProof = {
  /** True only when the simulation reverted with the expected MandateIsRevoked. */
  proven: boolean;
  /** Judge-facing line describing what the live contract just did. */
  message: string;
};

export type RevokedStatusCopy = {
  proven: boolean;
  message: string;
  detail: string | null;
};

/** Build the judge-facing proof line from the simulated revert name (null = did not revert). */
export function postRevokeProofLine(errorName: string | null): PostRevokeProof {
  if (errorName === POST_REVOKE_EXPECTED_ERROR) {
    return {
      proven: true,
      message:
        "Re-checked against the live contract: a retry charge reverts with MandateIsRevoked. No transaction submitted, no gas spent.",
    };
  }
  if (errorName) {
    return {
      proven: false,
      message: `Post-revoke check: the retry simulation reverted with ${errorName} (expected MandateIsRevoked).`,
    };
  }
  return {
    proven: false,
    message: "Post-revoke check inconclusive — the retry simulation did not revert as expected.",
  };
}

/** Line for when the simulation call itself failed (RPC/network) — distinct from "did not revert". */
export function postRevokeCheckUnavailableLine(): PostRevokeProof {
  return {
    proven: false,
    message:
      "Post-revoke check unavailable — the retry simulation could not run; the mined revoke transaction above remains the on-chain source of truth.",
  };
}

/**
 * Present the mined revoke separately from the optional retry proof. This prevents the fallback
 * UI from claiming a specific revert when the simulation returned another guard or never ran.
 */
export function revokedStatusCopy(proof: PostRevokeProof | null): RevokedStatusCopy {
  if (proof?.proven) {
    return { proven: true, message: proof.message, detail: null };
  }
  if (proof) {
    return {
      proven: false,
      message: "Revocation confirmed on-chain. The agent is disarmed.",
      detail: proof.message,
    };
  }
  return {
    proven: false,
    message: "Revocation confirmed on-chain. Checking the live contract retry now…",
    detail: null,
  };
}
