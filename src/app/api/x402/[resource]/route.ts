import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  parseEventLogs,
  type Address,
  type Hex,
} from "viem";
import { arbitrum } from "viem/chains";
import { SPEND_POLICY_ABI } from "@/lib/contracts/spend-policy";
import { getSpendPolicyAddress } from "@/lib/mandates/mandate";
import { ARBITRUM_CHAIN, getPublicRpcUrl } from "@/lib/config/payment";
import { getResource } from "@/lib/x402/catalog";
import {
  buildPaymentRequirements,
  build402Response,
  decodePaymentHeader,
} from "@/lib/x402/requirements";
import { isPaymentSufficient } from "@/lib/x402/verify";
import { supabaseAdmin } from "@/lib/supabase/client";
import { classifyConsume, x402DeliveryDecision, type ConsumeResult } from "@/lib/x402/consume";

export const dynamic = "force-dynamic";

// The demo merchant that receives x402 payments (same payee the /firewall demo uses).
const X402_MERCHANT =
  (process.env.NEXT_PUBLIC_DEMO_MERCHANT as Address | undefined) ??
  "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";

const CHAIN = ARBITRUM_CHAIN;

function requirementsFor(resourcePath: string, priceAtomic: bigint) {
  return buildPaymentRequirements({
    resource: resourcePath,
    description: "OneLink Pay x402 resource",
    priceAtomic,
    payTo: X402_MERCHANT,
    asset: CHAIN.usdcAddress,
    network: CHAIN.key,
    mandatePolicy: getSpendPolicyAddress(CHAIN.chainId),
  });
}

/**
 * Confirm `txHash` is a real on-chain MandateCharged of at least `price`, paid to `payTo`,
 * on the SpendPolicy contract. This is the settlement half of the x402 handshake: the agent's
 * payment is only accepted if the chain shows the mandate actually charged within its caps.
 */
async function verifyOnChainPayment(
  txHash: Hex,
  payTo: Address,
  price: bigint
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const policy = getSpendPolicyAddress(CHAIN.chainId);
  if (policy === "0x0000000000000000000000000000000000000000") {
    return { ok: false, reason: "SpendPolicy not deployed for this chain" };
  }
  const client = createPublicClient({ chain: arbitrum, transport: http(getPublicRpcUrl(CHAIN)) });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash });
  } catch {
    return { ok: false, reason: "payment tx not found on-chain yet" };
  }
  if (!receipt || receipt.status !== "success") {
    return { ok: false, reason: "payment tx did not succeed" };
  }

  const charged = parseEventLogs({
    abi: SPEND_POLICY_ABI,
    eventName: "MandateCharged",
    logs: receipt.logs,
  });

  const match = charged.find((log) => {
    const args = log.args as { merchant?: Address; amount?: bigint };
    return (
      log.address.toLowerCase() === policy.toLowerCase() &&
      typeof args.merchant === "string" &&
      args.merchant.toLowerCase() === payTo.toLowerCase() &&
      typeof args.amount === "bigint" &&
      args.amount >= price
    );
  });

  if (!match) {
    return {
      ok: false,
      reason: "no matching MandateCharged (recipient/amount) in payment tx",
    };
  }
  return { ok: true };
}

// x402 replay protection: claim the settlement tx in the consume-store (UNIQUE(tx_hash)) BEFORE
// delivering. A replayed proof collides and is rejected; any store error fails CLOSED (see
// x402DeliveryDecision) so we never hand out a paid resource we could not de-duplicate.
async function consumeProof(txHash: string, resource: string): Promise<ConsumeResult> {
  try {
    const { error } = await supabaseAdmin
      .from("x402_consumed")
      .insert({ tx_hash: txHash.toLowerCase(), resource });
    const result = classifyConsume(error);
    if (result === "unavailable") {
      console.warn("[x402] consume-store unavailable (failing CLOSED):", error?.message);
    }
    return result;
  } catch (e) {
    console.warn("[x402] consume-store threw (failing CLOSED):", e);
    return "unavailable";
  }
}

export async function GET(
  request: Request,
  { params }: { params: { resource: string } }
) {
  const resource = getResource(params.resource);
  if (!resource) {
    return NextResponse.json({ error: `unknown resource: ${params.resource}` }, { status: 404 });
  }

  const resourcePath = `/api/x402/${resource.id}`;
  const reqs = requirementsFor(resourcePath, resource.priceAtomic);

  const header = request.headers.get("x-payment");

  // No payment yet -> tell the agent how to pay (x402 402 + requirements).
  if (!header) {
    return NextResponse.json(build402Response(reqs), {
      status: 402,
      headers: { "x-402-version": "1" },
    });
  }

  const proof = decodePaymentHeader(header);
  if (!proof) {
    return NextResponse.json(build402Response(reqs, "malformed X-PAYMENT header"), {
      status: 402,
    });
  }

  const sufficient = isPaymentSufficient(proof, reqs);
  if (!sufficient.ok) {
    return NextResponse.json(build402Response(reqs, sufficient.reason), { status: 402 });
  }

  const onChain = await verifyOnChainPayment(proof.txHash, reqs.payTo, resource.priceAtomic);
  if (!onChain.ok) {
    return NextResponse.json(build402Response(reqs, onChain.reason), { status: 402 });
  }

  // Replay guard (fail-CLOSED): a verified proof unlocks ONE resource exactly once. A reused proof
  // is rejected (402); if the consume-store is unavailable we return 503 rather than risk a replay.
  const consumed = await consumeProof(proof.txHash, resource.id);
  const decision = x402DeliveryDecision(consumed);
  if (!decision.deliver) {
    const body =
      decision.status === 402 ? build402Response(reqs, decision.reason) : { error: decision.reason };
    return NextResponse.json(body, { status: decision.status });
  }

  // Paid + verified + freshly consumed -> deliver the resource.
  return NextResponse.json({
    resource: resource.id,
    title: resource.title,
    paidTx: proof.txHash,
    settledVia: "spend-mandate",
    replayProtected: true,
    data: resource.payload(),
  });
}
