import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizationNonce,
  isSponsoredDelegationEnabled,
  validateSponsorRequest,
  SUPPORTED_SPONSOR_CHAINS,
} from "./sponsored-delegation";

// The correctness crux (verified against EIP-7702 §Behavior): the type-4 tx increments the SENDER
// nonce first, then checks authority.nonce == auth.nonce. So a self-sent delegation signs N+1 (the
// EOA is the sender) and a relayer-sponsored one signs N (the EOA is untouched by the relayer's tx).
// A wrong nonce here = the delegation reverts, so it gets a dedicated test.

test("authorizationNonce: self = N+1, sponsor = N", () => {
  assert.equal(authorizationNonce(5n, "self"), 6n);
  assert.equal(authorizationNonce(5n, "sponsor"), 5n);
  assert.equal(authorizationNonce(0n, "self"), 1n);
  assert.equal(authorizationNonce(0n, "sponsor"), 0n);
  assert.equal(authorizationNonce(123456789012345n, "sponsor"), 123456789012345n);
});

test("isSponsoredDelegationEnabled is true ONLY for the exact flag, fail-closed", () => {
  assert.equal(isSponsoredDelegationEnabled({ NEXT_PUBLIC_SPONSORED_DELEGATION: "true" }), true);
  assert.equal(isSponsoredDelegationEnabled({ NEXT_PUBLIC_SPONSORED_DELEGATION: "false" }), false);
  assert.equal(isSponsoredDelegationEnabled({ NEXT_PUBLIC_SPONSORED_DELEGATION: "1" }), false);
  assert.equal(isSponsoredDelegationEnabled({ NEXT_PUBLIC_SPONSORED_DELEGATION: "TRUE" }), false);
  assert.equal(isSponsoredDelegationEnabled({}), false);
  const throwing = new Proxy({}, { get() { throw new Error("env blocked"); } }) as Record<string, string | undefined>;
  assert.equal(isSponsoredDelegationEnabled(throwing), false);
});

const VALID = {
  payer: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
  chainId: 42161,
  authorization: {
    address: "0x13E00E089F81aD9F36B655C9E9A07C6BF1489A5A",
    chainId: 42161,
    nonce: 5,
    r: "0x" + "11".repeat(32),
    s: "0x" + "22".repeat(32),
    yParity: 1,
  },
};

test("validateSponsorRequest accepts a well-formed request", () => {
  const res = validateSponsorRequest(VALID);
  assert.equal(res.ok, true);
});

test("validateSponsorRequest rejects a non-object / missing fields", () => {
  assert.equal(validateSponsorRequest(null).ok, false);
  assert.equal(validateSponsorRequest("x").ok, false);
  assert.equal(validateSponsorRequest({}).ok, false);
});

test("validateSponsorRequest rejects a bad payer address", () => {
  assert.equal(validateSponsorRequest({ ...VALID, payer: "0x123" }).ok, false);
  assert.equal(validateSponsorRequest({ ...VALID, payer: "notanaddress" }).ok, false);
});

test("validateSponsorRequest rejects an unsupported chain", () => {
  assert.equal(validateSponsorRequest({ ...VALID, chainId: 1, authorization: { ...VALID.authorization, chainId: 1 } }).ok, false);
});

test("validateSponsorRequest rejects an authorization whose chainId != request chainId", () => {
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, chainId: 8453 } }).ok, false);
});

test("validateSponsorRequest rejects malformed authorization signature parts / nonce / yParity", () => {
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, r: "0xabc" } }).ok, false);
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, s: "zz" } }).ok, false);
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, yParity: 2 } }).ok, false);
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, nonce: -1 } }).ok, false);
  assert.equal(validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, address: "0xnope" } }).ok, false);
});

test("validateSponsorRequest rejects a delegation to a non-allowlisted contract", () => {
  const arbitrary = "0x000000000000000000000000000000000000dEaD";
  assert.equal(
    validateSponsorRequest({ ...VALID, authorization: { ...VALID.authorization, address: arbitrary } }).ok,
    false,
  );
});

test("validateSponsorRequest accepts the known delegate case-insensitively", () => {
  assert.equal(
    validateSponsorRequest({
      ...VALID,
      authorization: { ...VALID.authorization, address: VALID.authorization.address.toLowerCase() },
    }).ok,
    true,
  );
});

test("validateSponsorRequest honors a custom delegate allowlist", () => {
  const custom = "0x00000000000000000000000000000000000000AA";
  // default delegate is rejected under a custom allowlist...
  assert.equal(validateSponsorRequest(VALID, [custom]).ok, false);
  // ...and the custom delegate is accepted
  assert.equal(
    validateSponsorRequest(
      { ...VALID, authorization: { ...VALID.authorization, address: custom } },
      [custom],
    ).ok,
    true,
  );
});

test("SUPPORTED_SPONSOR_CHAINS covers our settlement chains (Base, Arbitrum, Optimism)", () => {
  assert.ok(SUPPORTED_SPONSOR_CHAINS.includes(8453));
  assert.ok(SUPPORTED_SPONSOR_CHAINS.includes(42161));
  assert.ok(SUPPORTED_SPONSOR_CHAINS.includes(10));
});
