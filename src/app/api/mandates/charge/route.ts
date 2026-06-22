import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  BaseError,
  ContractFunctionRevertedError,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, base, optimism } from "viem/chains";
import { z } from "zod";
import { SPEND_POLICY_ABI, toContractMandate } from "@/lib/contracts/spend-policy";
import { fromRawMandate, getSpendPolicyAddress } from "@/lib/mandates/mandate";
import { type PaymentMandateRaw } from "@/lib/mandates/types";

export const dynamic = "force-dynamic";

const ChargeSchema = z.object({
  mandate: z.object({
    payer: z.string().startsWith("0x"),
    merchant: z.string().startsWith("0x"),
    token: z.string().startsWith("0x"),
    chainId: z.number(),
    maxPerCharge: z.string(),
    maxPerDay: z.string(),
    totalCap: z.string(),
    expiry: z.number(),
    nonce: z.string().startsWith("0x"),
  }),
  signature: z.string().startsWith("0x"),
  amount: z.string().regex(/^\d+$/),
});

function chainFor(chainId: number) {
  if (chainId === arbitrum.id) return { chain: arbitrum, rpc: process.env.ARBITRUM_MAINNET_RPC_URL || "https://arb1.arbitrum.io/rpc" };
  if (chainId === optimism.id) return { chain: optimism, rpc: process.env.OPTIMISM_MAINNET_RPC_URL || "https://mainnet.optimism.io" };
  return { chain: base, rpc: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org" };
}

/** Extract a SpendPolicy custom-error name from a viem revert, if present. */
function revertReason(err: unknown): string | null {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      return revert.data?.errorName ?? revert.shortMessage ?? "reverted";
    }
  }
  return null;
}

/**
 * Right-sized relayer gas guard. This route is public and unauthenticated: a valid EIP-712
 * signature + on-chain caps already protect the payer's FUNDS, but nothing stops a caller with a
 * self-signed mandate from triggering real charges and burning the relayer's gas. This caps the
 * number of gas-spending sends per rolling window. In-memory (per process instance) — enough for
 * the hackathon demo; a shared limiter (Redis/etc.) would be needed for real production.
 */
const RELAYER_CHARGE_WINDOW_MS = Number(process.env.RELAYER_CHARGE_WINDOW_MS ?? 600_000);
const RELAYER_MAX_CHARGES_PER_WINDOW = Number(process.env.RELAYER_MAX_CHARGES_PER_WINDOW ?? 30);
let chargeWindowStart = 0;
let chargeCount = 0;

function tryConsumeChargeBudget(): boolean {
  const now = Date.now();
  if (now - chargeWindowStart > RELAYER_CHARGE_WINDOW_MS) {
    chargeWindowStart = now;
    chargeCount = 0;
  }
  if (chargeCount >= RELAYER_MAX_CHARGES_PER_WINDOW) return false;
  chargeCount += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    // Prefer a dedicated relayer key so the gas-paying signer is separable from the proof-owner
    // key; fall back to the proof owner so existing deployments keep working unchanged.
    const relayerKey = (process.env.RELAYER_PRIVATE_KEY ??
      process.env.RECEIPT_EMITTER_OWNER_PRIVATE_KEY) as Hex | undefined;
    if (!relayerKey) {
      return NextResponse.json({ error: "Relayer key is not configured" }, { status: 500 });
    }

    const parsed = ChargeSchema.parse(await request.json());
    const policyAddress = getSpendPolicyAddress(parsed.mandate.chainId);
    if (policyAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json(
        { error: "SpendPolicy is not deployed for this chain" },
        { status: 503 }
      );
    }
    const rawMandate: PaymentMandateRaw = {
      payer: parsed.mandate.payer as Address,
      merchant: parsed.mandate.merchant as Address,
      token: parsed.mandate.token as Address,
      chainId: parsed.mandate.chainId,
      maxPerCharge: parsed.mandate.maxPerCharge,
      maxPerDay: parsed.mandate.maxPerDay,
      totalCap: parsed.mandate.totalCap,
      expiry: parsed.mandate.expiry,
      nonce: parsed.mandate.nonce as Hex,
    };
    const mandate = toContractMandate(fromRawMandate(rawMandate));
    const amount = BigInt(parsed.amount);
    const { chain, rpc } = chainFor(parsed.mandate.chainId);

    const account = privateKeyToAccount(relayerKey);
    const publicClient = createPublicClient({ chain, transport: http(rpc) });
    const walletClient = createWalletClient({ account, chain, transport: http(rpc) });

    // Simulate first: a charge outside the mandate reverts here with the exact reason and
    // costs ZERO gas (no tx is sent). This powers the "overcharge blocked" demo cleanly.
    try {
      await publicClient.simulateContract({
        address: policyAddress,
        abi: SPEND_POLICY_ABI,
        functionName: "charge",
        args: [mandate, parsed.signature as Hex, amount],
        account,
      });
    } catch (simErr) {
      const reason = revertReason(simErr);
      if (reason) {
        return NextResponse.json({ ok: false, blocked: true, reason });
      }
      throw simErr;
    }

    if (!tryConsumeChargeBudget()) {
      return NextResponse.json(
        { error: "Relayer charge budget temporarily exhausted. Try again shortly." },
        { status: 429 }
      );
    }

    const txHash = await walletClient.writeContract({
      address: policyAddress,
      abi: SPEND_POLICY_ABI,
      functionName: "charge",
      args: [mandate, parsed.signature as Hex, amount],
    });

    return NextResponse.json({ ok: true, txHash });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Charge failed" }, { status: 400 });
  }
}
