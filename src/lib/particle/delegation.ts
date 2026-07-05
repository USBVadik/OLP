"use client";

import { authorizationNonce } from "./sponsored-delegation";

// EIP-7702 delegation helpers (read status + undelegate). These mirror the proven
// `delegateChain7702` flow in `src/app/pay/[id]/page.tsx` beat-for-beat — the ONLY difference for
// undelegation is that the 7702 authorization is signed to the ZERO address instead of the
// Universal Account delegate contract, which clears the delegation and returns the EOA to a plain
// wallet. Pattern confirmed by the Particle workshop + reference repo (docs/workshop-insights.md §A/B).
//
// Kept as a separate, additive module: the live-verified payment path is not touched. The Particle
// SDK is typed as `any` app-wide (see src/types/particle.d.ts), so instances are `any` here too.

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface ChainDelegation {
  isDelegated: boolean;
  /** The delegate contract the EOA points at (when delegated). */
  delegate?: string;
}

type LogFn = (action: string, result: string, data?: unknown) => void;

/**
 * Read per-chain 7702 delegation status from the SDK. Fail-closed: on any read error every
 * requested chain is reported as not-delegated (the UI simply shows "Plain wallet" and offers no
 * action), never throwing into the caller.
 */
export async function getDelegationStatus(
  ua: any,
  chainIds: number[],
): Promise<Record<number, ChainDelegation>> {
  const out: Record<number, ChainDelegation> = {};
  let deployments: any[] = [];
  try {
    deployments = (await ua.getEIP7702Deployments()) || [];
  } catch {
    deployments = [];
  }
  for (const id of chainIds) {
    const dep = (deployments || []).find((d: any) => d?.chainId === id);
    out[id] = {
      isDelegated: Boolean(dep?.isDelegated),
      delegate: dep?.address ?? dep?.delegate ?? undefined,
    };
  }
  return out;
}

// send7702Transaction's return shape isn't guaranteed to be a bare hash string across Magic builds —
// deep-scan the value for a canonical 32-byte tx hash so the explorer link is built from a clean
// hash (or omitted entirely if none is found), never a malformed `.../[object Object]` URL.
export function extractTxHash(value: any): string | undefined {
  if (typeof value === "string") {
    return /^0x[0-9a-fA-F]{64}$/.test(value) ? value : undefined;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      const found = extractTxHash(v);
      if (found) return found;
    }
  }
  return undefined;
}

export interface UndelegateResult {
  /** The account was already a plain wallet on this chain — nothing sent. */
  alreadyPlain?: boolean;
  /** The Type-4 transaction hash, if broadcast. */
  txHash?: string;
  /** Whether the SDK reported the delegation cleared before the poll timed out. */
  confirmed?: boolean;
}

/**
 * Clear the 7702 delegation on ONE chain: sign a 7702 authorization to the zero address and
 * broadcast the Type-4 transaction from the owner EOA (needs a little native gas on that chain,
 * exactly like the one-time delegation). Polls until the SDK reports the delegation cleared.
 *
 * Reversible both ways: a future payment re-delegates via the existing `/pay` flow.
 */
export async function undelegateChain(
  magic: any,
  ua: any,
  ownerAddress: string,
  chainId: number,
  logFn?: LogFn,
): Promise<UndelegateResult> {
  const status = await getDelegationStatus(ua, [chainId]);
  if (!status[chainId]?.isDelegated) {
    logFn?.("undelegate", "already plain", { chainId });
    return { alreadyPlain: true };
  }

  logFn?.("undelegate", "undelegating", { chainId });
  await magic.evm.switchChain(chainId);
  // getEIP7702Auth gives the current nonce (+ the delegate address, which we intentionally ignore).
  const [auth] = await ua.getEIP7702Auth([chainId]);
  const authorization = await magic.wallet.sign7702Authorization({
    contractAddress: ZERO_ADDRESS, // <-- the only difference vs delegate (which uses auth.address)
    chainId,
    nonce: auth.nonce + 1, // the EOA sends its own Type-4 tx
  });
  const sent = await magic.wallet.send7702Transaction({
    to: ownerAddress,
    data: "0x",
    authorizationList: [authorization],
  });
  const txHash = extractTxHash(sent);
  logFn?.("undelegate", "submitted", { chainId, txHash: txHash ?? sent });

  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fresh = await getDelegationStatus(ua, [chainId]);
    if (!fresh[chainId]?.isDelegated) {
      logFn?.("undelegate", "confirmed", { chainId });
      return { txHash, confirmed: true };
    }
  }
  logFn?.("undelegate", "submitted but not confirmed in time", { chainId });
  return { txHash, confirmed: false };
}

export interface SponsoredDelegateResult {
  /** Already delegated on this chain — nothing sent. */
  alreadyDelegated?: boolean;
  /** The relayer-submitted Type-4 delegation tx hash. */
  delegationTxHash?: string;
  /** Whether the SDK reported the delegation before the poll timed out. */
  confirmed?: boolean;
}

/**
 * Sponsored 7702 delegation on ONE chain: the payer signs the authorization (Magic, gasless) and our
 * RELAYER submits the Type-4 tx (pays gas) via `/api/delegate/sponsor` — so a payer with ZERO native
 * gas can still delegate. EIP-7702 nonce: the sponsor case signs the authority's CURRENT nonce (the
 * relayer's tx doesn't bump the payer's nonce), unlike the self-paid path which signs nonce+1.
 * Polls until the SDK reports delegated. THROWS on failure so the caller can fall back to self-paid.
 */
export async function sponsoredDelegateChain(
  magic: any,
  ua: any,
  ownerAddress: string,
  chainId: number,
  logFn?: LogFn,
): Promise<SponsoredDelegateResult> {
  const status = await getDelegationStatus(ua, [chainId]);
  if (status[chainId]?.isDelegated) {
    logFn?.("sponsoredDelegate", "already delegated", { chainId });
    return { alreadyDelegated: true };
  }

  logFn?.("sponsoredDelegate", "delegating (relayer-paid)", { chainId });
  await magic.evm.switchChain(chainId);
  const [auth] = await ua.getEIP7702Auth([chainId]);
  // Sponsor nonce = authority's current nonce (NOT +1): the relayer, not the EOA, sends the tx.
  const sponsorNonce = Number(authorizationNonce(BigInt(auth.nonce), "sponsor"));
  const signed = await magic.wallet.sign7702Authorization({
    contractAddress: auth.address,
    chainId,
    nonce: sponsorNonce,
  });
  // Normalize the recovery id to yParity (0|1) whether Magic returns v (27/28) or yParity.
  const yParity =
    typeof signed.yParity === "number"
      ? signed.yParity
      : Number(signed.v) >= 27
        ? Number(signed.v) - 27
        : Number(signed.v);

  const res = await fetch("/api/delegate/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payer: ownerAddress,
      chainId,
      authorization: { address: auth.address, chainId, nonce: sponsorNonce, r: signed.r, s: signed.s, yParity },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Sponsored delegation failed (HTTP ${res.status})`);
  }
  logFn?.("sponsoredDelegate", "submitted", { chainId, delegationTxHash: data.delegationTxHash });

  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fresh = await getDelegationStatus(ua, [chainId]);
    if (fresh[chainId]?.isDelegated) {
      logFn?.("sponsoredDelegate", "confirmed", { chainId });
      return { delegationTxHash: data.delegationTxHash, confirmed: true };
    }
  }
  logFn?.("sponsoredDelegate", "submitted but not confirmed in time", { chainId });
  return { delegationTxHash: data.delegationTxHash, confirmed: false };
}
