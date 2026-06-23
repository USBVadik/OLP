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

// SpendPolicy's own enforcement errors. ONLY these mean "the firewall blocked it" — the demo
// punchline. Anything else (e.g. the ERC20 reverting because the payer holds no USDC on this
// chain, or the allowance is too low) is a real failure and must NOT be dressed up as a block.
const POLICY_ERRORS: Record<string, string> = {
  PerChargeExceeded: "over the per-charge cap",
  DailyCapExceeded: "over the daily cap",
  TotalCapExceeded: "over the total budget",
  MandateExpired: "mandate expired",
  MandateIsRevoked: "mandate revoked",
  BadSignature: "bad mandate signature",
  WrongChain: "wrong chain",
  InvalidAmount: "invalid amount",
  NotPayer: "caller is not the payer",
};

type RevertInfo = { policy: true; reason: string } | { policy: false; detail: string };

/** Classify a viem revert: a SpendPolicy policy block vs. any other on-chain failure. */
function classifyRevert(err: unknown): RevertInfo | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return null;

  const name = revert.data?.errorName;
  if (name && name in POLICY_ERRORS) {
    return { policy: true, reason: POLICY_ERRORS[name] };
  }
  // Standard Error(string) (e.g. "ERC20: transfer amount exceeds balance"), Panic, or any
  // non-policy custom error. Pull the most specific human-readable text available.
  const stringArg =
    typeof revert.data?.args?.[0] === "string" ? (revert.data!.args![0] as string) : undefined;
  const detail = stringArg ?? revert.reason ?? name ?? revert.shortMessage ?? "execution reverted";
  return { policy: false, detail };
}

/** Turn a non-policy revert into an actionable message for the agent terminal. */
function humanizeChargeFailure(detail: string): string {
  const d = detail.toLowerCase();
  if (d.includes("balance")) {
    return "payer has no USDC on the settlement chain (Arbitrum) to settle this charge — fund the payer address and retry.";
  }
  if (d.includes("allowance")) {
    return "SpendPolicy allowance is too low — re-arm the mandate (approve) and retry.";
  }
  return detail;
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
      const info = classifyRevert(simErr);
      if (info?.policy) {
        // Genuine firewall enforcement — the only case allowed to claim "blocked".
        return NextResponse.json({ ok: false, blocked: true, reason: info.reason });
      }
      if (info) {
        // A real on-chain failure that is NOT a policy block (e.g. insufficient USDC/allowance).
        // Surface it honestly instead of mislabeling it as an over-budget block.
        return NextResponse.json({ ok: false, blocked: false, error: humanizeChargeFailure(info.detail) });
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
