import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import {
  RECEIPT_EMITTER_ABI,
} from "@/lib/contracts/receipt-emitter";
import { getActivePaymentChain } from "@/lib/config/payment";
import {
  assertCanMarkPaid,
  normalizeAddress,
  verifyUsdcTransferForPayment,
} from "@/lib/payments/mark-paid-verification";
import { createPublicClient, createWalletClient, http, parseEventLogs, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MarkPaidSchema = z.object({
  payerAddress: z.string().startsWith("0x"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
const ACTIVE_CHAIN = getActivePaymentChain();

function getPublicClient() {
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL;
  if (!rpcUrl) throw new Error("BASE_MAINNET_RPC_URL is not configured");
  return createPublicClient({ chain: base, transport: http(rpcUrl) });
}

function getServerWalletClient() {
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL;
  const privateKey = process.env.RECEIPT_EMITTER_OWNER_PRIVATE_KEY;
  if (!rpcUrl) throw new Error("BASE_MAINNET_RPC_URL is not configured");
  if (!privateKey) throw new Error("RECEIPT_EMITTER_OWNER_PRIVATE_KEY is not configured");

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = MarkPaidSchema.parse(body);

    const { data: link, error: linkError } = await supabaseAdmin
      .from("payment_links")
      .select("*")
      .eq("id", params.id)
      .single();

    if (linkError || !link) throw new Error("Payment link not found");
    if (!link.contract_invoice_id) throw new Error("Payment link is missing contract_invoice_id");
    if (!link.registered_tx_hash) throw new Error("Payment link is not registered on-chain");

    try {
      const markPaidState = assertCanMarkPaid(link, parsed.txHash);
      if (markPaidState.deduped) {
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("payment_link_id", params.id)
          .eq("tx_hash", parsed.txHash)
          .maybeSingle();
        return NextResponse.json({
          ok: true,
          deduped: true,
          link,
          payment,
          proofTxHash: payment?.receipt_tx_hash ?? null,
        });
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Payment link is already completed" },
        { status: 409 }
      );
    }

    const receiptEmitterAddress = ACTIVE_CHAIN.receiptEmitterAddress;
    if (!receiptEmitterAddress) throw new Error(`${ACTIVE_CHAIN.name} ReceiptEmitter address is not configured`);
    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: parsed.txHash as Hex,
      confirmations: 1,
      timeout: 60_000,
    });

    const duplicatePaymentTx = await supabaseAdmin
      .from("payments")
      .select("id,payment_link_id,status")
      .eq("tx_hash", parsed.txHash)
      .neq("payment_link_id", params.id)
      .maybeSingle();
    if (duplicatePaymentTx.error) throw duplicatePaymentTx.error;
    if (duplicatePaymentTx.data) {
      throw new Error("Payment tx hash was already used for another payment link");
    }

    const matchingTransfer = verifyUsdcTransferForPayment({
      receipt,
      chain: ACTIVE_CHAIN,
      link,
      txHash: parsed.txHash as Hex,
    });

    const walletClient = getServerWalletClient();
    const proofTxHash = await walletClient.writeContract({
      address: receiptEmitterAddress,
      abi: RECEIPT_EMITTER_ABI,
      functionName: "recordVerifiedPayment",
      args: [link.contract_invoice_id as Hex, parsed.payerAddress as Address, parsed.txHash as Hex],
    });

    const proofReceipt = await publicClient.waitForTransactionReceipt({
      hash: proofTxHash,
      confirmations: 1,
      timeout: 60_000,
    });

    if (proofReceipt.status !== "success") {
      throw new Error(`recordVerifiedPayment reverted: ${proofTxHash}`);
    }

    const emitterLogs = proofReceipt.logs.filter(
      (log) => normalizeAddress(log.address) === normalizeAddress(receiptEmitterAddress)
    );
    const parsedLogs = parseEventLogs({
      abi: RECEIPT_EMITTER_ABI,
      eventName: "InvoicePaid",
      logs: emitterLogs,
    });
    const invoicePaid = parsedLogs.find(
      (log) => log.args.invoiceId.toLowerCase() === link.contract_invoice_id.toLowerCase()
    );

    if (!invoicePaid) throw new Error("InvoicePaid proof event not found after recordVerifiedPayment");

    const args = invoicePaid.args;
    if (normalizeAddress(args.merchant) !== normalizeAddress(link.merchant_address)) {
      throw new Error("InvoicePaid merchant does not match payment link");
    }
    if (normalizeAddress(args.token) !== normalizeAddress(ACTIVE_CHAIN.usdcAddress)) {
      throw new Error(`InvoicePaid token is not ${ACTIVE_CHAIN.name} USDC`);
    }
    if (args.amount !== BigInt(link.amount)) {
      throw new Error("InvoicePaid amount does not match payment link");
    }
    if (args.chainId !== BigInt(ACTIVE_CHAIN.chainId)) {
      throw new Error(`InvoicePaid chainId is not ${ACTIVE_CHAIN.name}`);
    }

    const completedAt = new Date().toISOString();

    const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("payment_link_id", params.id)
      .eq("tx_hash", parsed.txHash)
      .maybeSingle();

    if (existingPaymentError) throw existingPaymentError;

    const paymentPayload = {
      payment_link_id: params.id,
      payer_address: parsed.payerAddress,
      source_chain_id: ACTIVE_CHAIN.chainId,
      destination_chain_id: link.destination_chain_id,
      token: link.token,
      amount: link.amount,
      tx_hash: parsed.txHash,
      receipt_tx_hash: proofTxHash,
      preview_json: null,
      error_message: null,
      status: "completed",
      completed_at: completedAt,
    };

    let payment = existingPayment;
    if (!payment) {
      const { data: insertedPayment, error: insertError } = await supabaseAdmin
        .from("payments")
        .insert(paymentPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      payment = insertedPayment;
    }

    const { data: updatedLink, error: updateError } = await supabaseAdmin
      .from("payment_links")
      .update({
        status: "completed",
        paid_tx_hash: parsed.txHash,
        paid_at: completedAt,
        error_message: null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      link: updatedLink,
      payment,
      transfer: {
        from: matchingTransfer.from,
        to: matchingTransfer.to,
        value: matchingTransfer.value.toString(),
        txHash: parsed.txHash,
      },
      proofTxHash,
      invoicePaid: {
        invoiceId: args.invoiceId,
        merchant: args.merchant as Address,
        payer: args.payer as Address,
        token: args.token as Address,
        amount: args.amount.toString(),
        chainId: args.chainId.toString(),
        timestamp: args.timestamp.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
