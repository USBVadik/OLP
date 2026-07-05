// Sponsored EIP-7702 delegation — pure, side-effect-free core (unit-tested).
//
// A first-time payer can delegate their EOA with ZERO native gas: they sign the 7702 authorization
// off-chain (Magic, popup-less) and our relayer submits the type-4 transaction, paying the gas.
// EIP-7702 natively allows this — the authorization is the EOA's; the tx sender can be anyone.
//
// The one correctness crux is the authorization nonce (EIP-7702 §Behavior: the tx increments the
// SENDER nonce first, then checks authority.nonce == auth.nonce):
//   - self-submit  (EOA is the sender): sign authorityNonce + 1
//   - sponsor-submit (relayer is the sender; EOA untouched): sign authorityNonce
// A wrong nonce makes the delegation revert, so it lives here behind a test.

/** Settlement chains we can sponsor delegation on (the relayer must be funded on each). */
export const SUPPORTED_SPONSOR_CHAINS = [8453, 42161, 10] as const; // Base, Arbitrum, Optimism

export type Submitter = "self" | "sponsor";

/** EIP-7702 authorization nonce for the given transaction submitter. */
export function authorizationNonce(authorityNonce: bigint, submitter: Submitter): bigint {
  return submitter === "self" ? authorityNonce + 1n : authorityNonce;
}

/**
 * Opt-in flag gate — default OFF (shipping is a no-op until a live spike verifies a relayer-paid
 * delegation on-chain). Fail-closed: only the exact string "true" enables it.
 */
export function isSponsoredDelegationEnabled(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): boolean {
  try {
    return env.NEXT_PUBLIC_SPONSORED_DELEGATION === "true";
  } catch {
    return false;
  }
}

export interface SponsorAuthorization {
  address: string; // delegate contract the EOA is authorizing
  chainId: number;
  nonce: number;
  r: string; // 0x + 64 hex
  s: string; // 0x + 64 hex
  yParity: number; // 0 | 1
}

export interface SponsorRequest {
  payer: string; // the EOA to delegate
  chainId: number;
  authorization: SponsorAuthorization;
}

export type SponsorRequestResult =
  | { ok: true; value: SponsorRequest }
  | { ok: false; error: string };

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const HEX32_RE = /^0x[0-9a-fA-F]{64}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Validate a sponsor request before the relayer spends any gas. Fail-closed with a specific error.
 * Checks: payer is a 20-byte address; chainId is supported; the authorization tuple is well-formed
 * and its chainId matches the request (never sponsor a delegation for a different chain).
 */
export function validateSponsorRequest(req: unknown): SponsorRequestResult {
  if (!isRecord(req)) return { ok: false, error: "request must be an object" };
  const { payer, chainId, authorization } = req as Record<string, unknown>;

  if (typeof payer !== "string" || !ADDRESS_RE.test(payer)) {
    return { ok: false, error: "payer must be a 0x-prefixed 20-byte address" };
  }
  if (typeof chainId !== "number" || !SUPPORTED_SPONSOR_CHAINS.includes(chainId as never)) {
    return { ok: false, error: `chainId must be one of ${SUPPORTED_SPONSOR_CHAINS.join(", ")}` };
  }
  if (!isRecord(authorization)) return { ok: false, error: "authorization is required" };

  const a = authorization as Record<string, unknown>;
  if (typeof a.address !== "string" || !ADDRESS_RE.test(a.address)) {
    return { ok: false, error: "authorization.address must be a 0x-prefixed 20-byte address" };
  }
  if (a.chainId !== chainId) {
    return { ok: false, error: "authorization.chainId must match the request chainId" };
  }
  if (typeof a.nonce !== "number" || !Number.isInteger(a.nonce) || a.nonce < 0) {
    return { ok: false, error: "authorization.nonce must be a non-negative integer" };
  }
  if (typeof a.r !== "string" || !HEX32_RE.test(a.r)) {
    return { ok: false, error: "authorization.r must be 0x + 64 hex" };
  }
  if (typeof a.s !== "string" || !HEX32_RE.test(a.s)) {
    return { ok: false, error: "authorization.s must be 0x + 64 hex" };
  }
  if (a.yParity !== 0 && a.yParity !== 1) {
    return { ok: false, error: "authorization.yParity must be 0 or 1" };
  }

  return {
    ok: true,
    value: {
      payer,
      chainId,
      authorization: {
        address: a.address,
        chainId,
        nonce: a.nonce,
        r: a.r,
        s: a.s,
        yParity: a.yParity,
      },
    },
  };
}
