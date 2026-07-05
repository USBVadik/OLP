import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, base, optimism } from "viem/chains";
import {
  isSponsoredDelegationEnabled,
  validateSponsorRequest,
} from "@/lib/particle/sponsored-delegation";

export const dynamic = "force-dynamic";

function chainFor(chainId: number) {
  if (chainId === arbitrum.id)
    return { chain: arbitrum, rpc: process.env.ARBITRUM_MAINNET_RPC_URL || "https://arb1.arbitrum.io/rpc" };
  if (chainId === optimism.id)
    return { chain: optimism, rpc: process.env.OPTIMISM_MAINNET_RPC_URL || "https://mainnet.optimism.io" };
  return { chain: base, rpc: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org" };
}

// Relayer gas guard for sponsored delegations (same rationale as the charge route, R16): this route
// spends the relayer's native gas, so cap the sends per rolling window. In-memory per instance —
// a shared limiter (Redis) would be needed for real multi-instance production.
const WINDOW_MS = Number(process.env.RELAYER_CHARGE_WINDOW_MS ?? 600_000);
const MAX_DELEGATIONS = Number(process.env.RELAYER_MAX_DELEGATIONS_PER_WINDOW ?? 20);
let windowStart = 0;
let delegationCount = 0;

function tryConsumeDelegationBudget(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    delegationCount = 0;
  }
  if (delegationCount >= MAX_DELEGATIONS) return false;
  delegationCount += 1;
  return true;
}

/**
 * Sponsored EIP-7702 delegation. The payer signs the authorization off-chain (Magic, gasless); this
 * route submits the type-4 transaction from the RELAYER, which pays the gas — so a first-time payer
 * needs zero native gas. The authorization is the payer's own (scoped to the delegate contract); the
 * route only broadcasts it. Funds are never at risk here (no value transfer, no mandate).
 *
 * Server-side flag-gated: when sponsored delegation is off, the route is inert (no gas surface).
 * Bounded by the relayer gas guard. Production would need per-caller rate limiting / auth (see R16).
 */
export async function POST(request: Request) {
  try {
    if (!isSponsoredDelegationEnabled()) {
      return NextResponse.json({ error: "Sponsored delegation is disabled" }, { status: 403 });
    }

    const relayerKey = (process.env.RELAYER_PRIVATE_KEY ??
      process.env.RECEIPT_EMITTER_OWNER_PRIVATE_KEY) as Hex | undefined;
    if (!relayerKey) {
      return NextResponse.json({ error: "Relayer key is not configured" }, { status: 500 });
    }

    const validation = validateSponsorRequest(await request.json());
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { payer, chainId, authorization } = validation.value;

    if (!tryConsumeDelegationBudget()) {
      return NextResponse.json(
        { error: "Relayer delegation budget temporarily exhausted. Try again shortly." },
        { status: 429 },
      );
    }

    const { chain, rpc } = chainFor(chainId);
    const account = privateKeyToAccount(relayerKey);
    const publicClient = createPublicClient({ chain, transport: http(rpc) });
    const walletClient = createWalletClient({ account, chain, transport: http(rpc) });

    // EIP-7702 sponsor-submit: relayer is the tx sender (pays gas); the payer's EOA is the authority.
    const txHash = await walletClient.sendTransaction({
      to: payer as Address,
      data: "0x",
      authorizationList: [
        {
          address: authorization.address as Address,
          chainId: authorization.chainId,
          nonce: authorization.nonce,
          r: authorization.r as Hex,
          s: authorization.s as Hex,
          yParity: authorization.yParity,
        },
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      ok: receipt.status === "success",
      delegationTxHash: txHash,
      chainId,
      status: receipt.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Sponsored delegation failed" },
      { status: 500 },
    );
  }
}
