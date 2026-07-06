import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  BaseError,
  ContractFunctionRevertedError,
  type Hex,
} from "viem";
import { arbitrum } from "viem/chains";
import { SPEND_POLICY_ABI, toContractMandate } from "@/lib/contracts/spend-policy";
import { fromRawMandate, getSpendPolicyAddress } from "@/lib/mandates/mandate";
import {
  demoBlockRawMandate,
  DEMO_BLOCK_ATTEMPT_AMOUNT,
  DEMO_BLOCK_MANDATE,
  usdc,
} from "@/lib/demo/firewall-block";

export const dynamic = "force-dynamic";

/**
 * Walletless "guided live" firewall block. Anyone (no login) can trigger the REAL on-chain over-cap
 * block: this SIMULATES `SpendPolicy.charge` with the pre-signed demo mandate and a fixed over-cap
 * amount. The over-cap check reverts before any transfer, so nothing moves — and this route NEVER
 * submits a transaction and NEVER reads a client-supplied amount, so there is no drain vector.
 */

const POLICY_REASONS: Record<string, string> = {
  PerChargeExceeded: "over the per-charge cap",
  DailyCapExceeded: "over the daily cap",
  TotalCapExceeded: "over the total budget",
  MandateExpired: "mandate expired",
  MandateIsRevoked: "mandate revoked",
  BadSignature: "bad mandate signature",
  WrongChain: "wrong chain",
  InvalidAmount: "invalid amount",
};

function revertName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return null;
  return revert.data?.errorName ?? null;
}

async function run() {
  const attempted = usdc(DEMO_BLOCK_ATTEMPT_AMOUNT);
  const cap = usdc(DEMO_BLOCK_MANDATE.maxPerCharge);
  const chainId = DEMO_BLOCK_MANDATE.chainId;

  const signature = process.env.DEMO_BLOCK_SIGNATURE as Hex | undefined;
  if (!signature) {
    return NextResponse.json({
      armed: false,
      attempted,
      cap,
      message: "Walletless demo not armed yet (no signed demo mandate configured).",
    });
  }

  const policy = getSpendPolicyAddress(chainId);
  if (policy === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({ armed: false, attempted, cap, message: "SpendPolicy not configured." });
  }

  const mandate = toContractMandate(fromRawMandate(demoBlockRawMandate()));
  const rpc = process.env.ARBITRUM_MAINNET_RPC_URL || "https://arb1.arbitrum.io/rpc";
  const client = createPublicClient({ chain: arbitrum, transport: http(rpc) });

  try {
    await client.simulateContract({
      address: policy,
      abi: SPEND_POLICY_ABI,
      functionName: "charge",
      args: [mandate, signature, DEMO_BLOCK_ATTEMPT_AMOUNT],
      account: DEMO_BLOCK_MANDATE.payer, // charge() is permissionless; read-only simulation
    });
    // Over-cap should have reverted — reaching here is unexpected.
    return NextResponse.json({
      armed: true,
      blocked: false,
      unexpected: true,
      attempted,
      cap,
      chainId,
      policy,
      message: "Simulation did not revert — unexpected for an over-cap charge.",
    });
  } catch (err) {
    const name = revertName(err);
    const blocked = name === "PerChargeExceeded";
    return NextResponse.json({
      armed: true,
      blocked,
      reason: name ? (POLICY_REASONS[name] ?? name) : "simulation error",
      errorName: name ?? undefined,
      attempted,
      cap,
      chainId,
      policy,
      // If it reverted for a non-cap reason (e.g. BadSignature), the demo signature needs fixing.
      note: name && name !== "PerChargeExceeded" ? "reverted before the cap check — verify DEMO_BLOCK_SIGNATURE" : undefined,
    });
  }
}

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}
