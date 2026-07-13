import { NextResponse } from "next/server";
import { isAddress, verifyTypedData, zeroAddress, type Address, type Hex } from "viem";
import { z } from "zod";
import { ARBITRUM_CHAIN, BASE_CHAIN, OPTIMISM_CHAIN } from "@/lib/config/payment";
import {
  buildMandateTypedData,
  computeMandateId,
  fromRawMandate,
  getSpendPolicyAddress,
} from "@/lib/mandates/mandate";
import type { PaymentMandateRaw } from "@/lib/mandates/types";
import {
  assertResearchAgentFundingMandate,
  RESEARCH_AGENT_DAILY_FUNDING_ATOMIC,
} from "@/lib/agent/expense-card-config";
import { verifyExpenseCardFundingServerSide } from "@/lib/agent/expense-card-funding-verifier";
import {
  assertFundingEvidenceIdentity,
  type FundingEvidenceIdentity,
} from "@/lib/agent/funding-evidence-store";
import { supabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  uaTransactionId: z.string().regex(/^0x[a-fA-F0-9]{8,198}$/),
  payerAddress: z.string().refine(isAddress, "Invalid payer address"),
  mandate: z.object({
    payer: z.string().refine(isAddress),
    merchant: z.string().refine(isAddress),
    token: z.string().refine(isAddress),
    chainId: z.number().int().positive(),
    maxPerCharge: z.string().regex(/^\d+$/),
    maxPerDay: z.string().regex(/^\d+$/),
    totalCap: z.string().regex(/^\d+$/),
    expiry: z.number().int().positive(),
    nonce: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  }),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

function expectedIdentity(input: {
  uaTransactionId: string;
  payerAddress: string;
  spendPolicyAddress: string;
  mandateId: string;
}): FundingEvidenceIdentity {
  return {
    ua_transaction_id: input.uaTransactionId,
    mandate_id: input.mandateId,
    payer_address: input.payerAddress,
    settlement_chain_id: ARBITRUM_CHAIN.chainId,
    token_address: ARBITRUM_CHAIN.usdcAddress,
    spend_policy_address: input.spendPolicyAddress,
    required_amount: RESEARCH_AGENT_DAILY_FUNDING_ATOMIC.toString(),
  };
}

async function findExisting(uaTransactionId: string) {
  return supabaseAdmin
    .from("agent_funding_evidence")
    .select("*")
    .eq("ua_transaction_id", uaTransactionId)
    .maybeSingle();
}

async function findExistingMandate(mandateId: string) {
  return supabaseAdmin
    .from("agent_funding_evidence")
    .select("*")
    .eq("mandate_id", mandateId)
    .maybeSingle();
}

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT !== "true") {
    return NextResponse.json({ error: "UA-funded Expense Card is disabled" }, { status: 404 });
  }

  const payerAddress = new URL(request.url).searchParams.get("payerAddress");
  if (!payerAddress || !isAddress(payerAddress)) {
    return NextResponse.json({ error: "Invalid payer address" }, { status: 400 });
  }

  try {
    const result = await supabaseAdmin
      .from("agent_funding_evidence")
      .select("*")
      .ilike("payer_address", payerAddress)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) {
      return NextResponse.json({ error: "Verified funding evidence was not found" }, { status: 404 });
    }
    return NextResponse.json(
      { ok: true, evidence: result.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Funding evidence read failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT !== "true") {
    return NextResponse.json({ error: "UA-funded Expense Card is disabled" }, { status: 404 });
  }

  try {
    const parsed = RequestSchema.parse(await request.json());
    const spendPolicyAddress = getSpendPolicyAddress(ARBITRUM_CHAIN.chainId);
    if (spendPolicyAddress === zeroAddress) {
      throw new Error("Arbitrum SpendPolicy is not configured");
    }

    const rawMandate: PaymentMandateRaw = {
      ...parsed.mandate,
      payer: parsed.mandate.payer as Address,
      merchant: parsed.mandate.merchant as Address,
      token: parsed.mandate.token as Address,
      nonce: parsed.mandate.nonce as Hex,
    };
    const mandate = fromRawMandate(rawMandate);
    assertResearchAgentFundingMandate({
      mandate,
      payerAddress: parsed.payerAddress,
      chainId: ARBITRUM_CHAIN.chainId,
      tokenAddress: ARBITRUM_CHAIN.usdcAddress,
    });
    const typedData = buildMandateTypedData(mandate, spendPolicyAddress);
    let validSignature = false;
    try {
      validSignature = await verifyTypedData({
        address: mandate.payer,
        ...typedData,
        signature: parsed.signature as Hex,
      });
    } catch {
      // Malformed signatures are authentication failures, never internal errors.
    }
    if (!validSignature) {
      return NextResponse.json({ error: "Invalid Expense Card mandate signature" }, { status: 401 });
    }

    const mandateId = computeMandateId(mandate, spendPolicyAddress);
    const identity = expectedIdentity({ ...parsed, spendPolicyAddress, mandateId });
    const existingResult = await findExisting(parsed.uaTransactionId);
    if (existingResult.error) throw existingResult.error;
    if (existingResult.data) {
      assertFundingEvidenceIdentity(existingResult.data, identity);
      return NextResponse.json({ ok: true, deduped: true, evidence: existingResult.data });
    }
    const existingMandate = await findExistingMandate(mandateId);
    if (existingMandate.error) throw existingMandate.error;
    if (existingMandate.data) {
      assertFundingEvidenceIdentity(existingMandate.data, identity);
      return NextResponse.json({ ok: true, deduped: true, evidence: existingMandate.data });
    }

    const evidence = await verifyExpenseCardFundingServerSide({
      uaTransactionId: parsed.uaTransactionId,
      context: {
        payer: parsed.payerAddress,
        settlementChainId: ARBITRUM_CHAIN.chainId,
        settlementTokenAddress: ARBITRUM_CHAIN.usdcAddress,
        spendPolicyAddress,
        requiredAmount: RESEARCH_AGENT_DAILY_FUNDING_ATOMIC,
        usdcByChain: {
          [BASE_CHAIN.chainId]: BASE_CHAIN.usdcAddress,
          [ARBITRUM_CHAIN.chainId]: ARBITRUM_CHAIN.usdcAddress,
          [OPTIMISM_CHAIN.chainId]: OPTIMISM_CHAIN.usdcAddress,
        },
      },
    });

    const verifiedAt = new Date().toISOString();
    const payload = {
      ...identity,
      approved_amount: evidence.approvedAmount!.toString(),
      destination_balance: evidence.destinationBalance.toString(),
      cross_chain: evidence.crossChain,
      source_chain_ids: evidence.sourceChainIds,
      source_legs: evidence.sourceLegs,
      destination_tx_hashes: evidence.destinationTxHashes,
      approval_tx_hash: evidence.approvalTxHash,
      verified_at: verifiedAt,
    };
    const inserted = await supabaseAdmin
      .from("agent_funding_evidence")
      .insert(payload)
      .select("*")
      .single();

    if (inserted.error) {
      if (inserted.error.code !== "23505") throw inserted.error;
      const raced = await findExisting(parsed.uaTransactionId);
      if (raced.error) throw raced.error;
      if (!raced.data) {
        throw new Error("Mandate or Approval evidence is already recorded by another activity");
      }
      assertFundingEvidenceIdentity(raced.data, identity);
      return NextResponse.json({ ok: true, deduped: true, evidence: raced.data });
    }

    return NextResponse.json({ ok: true, deduped: false, evidence: inserted.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Funding evidence verification failed";
    const status =
      error instanceof z.ZodError
        ? 400
        : message.includes("Signed mandate does not match")
          ? 403
          : message.includes("already recorded")
            ? 409
            : message.includes("verification failed")
              ? 422
              : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
