import { test } from "node:test";
import assert from "node:assert/strict";
import { BaseError, ContractFunctionRevertedError, encodeErrorResult } from "viem";
import { SPEND_POLICY_ABI } from "@/lib/contracts/spend-policy";
import {
  POST_REVOKE_EXPECTED_ERROR,
  postRevokeCheckUnavailableLine,
  postRevokeProofLine,
  revokedStatusCopy,
  revertErrorName,
} from "./post-revoke-proof";

function revertError(errorName: "MandateIsRevoked" | "PerChargeExceeded"): BaseError {
  const data = encodeErrorResult({ abi: SPEND_POLICY_ABI, errorName });
  const reverted = new ContractFunctionRevertedError({
    abi: SPEND_POLICY_ABI,
    functionName: "charge",
    data,
  });
  return new BaseError("execution reverted", { cause: reverted });
}

test("revertErrorName extracts the SpendPolicy error name from a viem revert", () => {
  assert.equal(revertErrorName(revertError("MandateIsRevoked")), "MandateIsRevoked");
  assert.equal(revertErrorName(revertError("PerChargeExceeded")), "PerChargeExceeded");
});

test("revertErrorName returns null for non-revert errors", () => {
  assert.equal(revertErrorName(new Error("network down")), null);
  assert.equal(revertErrorName(null), null);
  assert.equal(revertErrorName("boom"), null);
});

test("proof line: MandateIsRevoked reads as a verified kill switch with no tx submitted", () => {
  const line = postRevokeProofLine("MandateIsRevoked");
  assert.equal(line.proven, true);
  assert.match(line.message, /MandateIsRevoked/);
  assert.match(line.message, /no transaction submitted/i);
});

test("proof line: an unexpected revert name is reported honestly, not claimed as proof", () => {
  const line = postRevokeProofLine("BadSignature");
  assert.equal(line.proven, false);
  assert.match(line.message, /BadSignature/);
});

test("proof line: no revert at all is inconclusive, never claimed as proof", () => {
  const line = postRevokeProofLine(null);
  assert.equal(line.proven, false);
  assert.match(line.message, /inconclusive/i);
});

test("proof line: an RPC failure is 'unavailable', never conflated with 'did not revert'", () => {
  const line = postRevokeCheckUnavailableLine();
  assert.equal(line.proven, false);
  assert.match(line.message, /unavailable/i);
  assert.match(line.message, /source of truth/i);
});

test("honesty guard: proof copy never claims cross-chain / bridge / gasless-in-general", () => {
  const blob = [
    postRevokeProofLine("MandateIsRevoked").message,
    postRevokeProofLine("BadSignature").message,
    postRevokeProofLine(null).message,
    postRevokeCheckUnavailableLine().message,
  ]
    .join(" ")
    .toLowerCase();
  for (const forbidden of ["cross-chain", "bridge", "sourced from", "solana"]) {
    assert.ok(!blob.includes(forbidden), `proof copy must not contain "${forbidden}"`);
  }
});

test("expected error constant matches the SpendPolicy revert", () => {
  assert.equal(POST_REVOKE_EXPECTED_ERROR, "MandateIsRevoked");
});

test("revoked status stays neutral while the retry check is pending", () => {
  const copy = revokedStatusCopy(null);
  assert.equal(copy.proven, false);
  assert.match(copy.message, /revocation confirmed on-chain/i);
  assert.match(copy.message, /checking/i);
  assert.doesNotMatch(copy.message, /MandateIsRevoked/);
  assert.equal(copy.detail, null);
});

test("revoked status does not claim MandateIsRevoked when the check is inconclusive", () => {
  const proof = postRevokeProofLine("BadSignature");
  const copy = revokedStatusCopy(proof);
  assert.equal(copy.proven, false);
  assert.match(copy.message, /revocation confirmed on-chain/i);
  assert.doesNotMatch(copy.message, /MandateIsRevoked/);
  assert.match(copy.detail ?? "", /BadSignature/);
});

test("revoked status promotes the exact live revert only after it is proven", () => {
  const proof = postRevokeProofLine("MandateIsRevoked");
  const copy = revokedStatusCopy(proof);
  assert.equal(copy.proven, true);
  assert.equal(copy.message, proof.message);
  assert.equal(copy.detail, null);
});
