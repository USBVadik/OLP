import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RecordPaymentSchema = z.object({
  paymentLinkId: z.string().uuid(),
  payerAddress: z.string().startsWith("0x"),
  txHash: z.string().optional(),
  sourceChainId: z.number(),
  destinationChainId: z.number(),
  token: z.string(),
  amount: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RecordPaymentSchema.parse(body);

    if (parsed.txHash) {
      return NextResponse.json(
        { error: "Direct payment completion is disabled. Use /api/payments/[id]/mark-paid for on-chain event verification." },
        { status: 410 }
      );
    }

    if (parsed.txHash) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("payment_link_id", parsed.paymentLinkId)
        .eq("tx_hash", parsed.txHash)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        await supabaseAdmin
          .from("payment_links")
          .update({ status: "completed" })
          .eq("id", parsed.paymentLinkId);

        return NextResponse.json({ payment: existing, deduped: true });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        payment_link_id: parsed.paymentLinkId,
        payer_address: parsed.payerAddress,
        tx_hash: parsed.txHash || null,
        source_chain_id: parsed.sourceChainId,
        destination_chain_id: parsed.destinationChainId,
        token: parsed.token,
        amount: parsed.amount,
        status: parsed.txHash ? "completed" : "processing",
        completed_at: parsed.txHash ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Mark payment link as completed
    if (parsed.txHash) {
      await supabaseAdmin
        .from("payment_links")
        .update({ status: "completed" })
        .eq("id", parsed.paymentLinkId);
    }

    return NextResponse.json({ payment: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get("merchantId");

  if (!merchantId) {
    return NextResponse.json(
      { error: "merchantId required" },
      { status: 400 }
    );
  }

  // Get all payment links for this merchant, then get their payments
  const { data: links } = await supabaseAdmin
    .from("payment_links")
    .select("id")
    .eq("merchant_id", merchantId);

  const linkIds = links?.map((l) => l.id) || [];

  if (linkIds.length === 0) {
    return NextResponse.json({
      payments: [],
      stats: { total: 0, completed: 0, pending: 0, failed: 0 },
    });
  }

  const { data: payments, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .in("payment_link_id", linkIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allPayments = payments || [];
  const stats = {
    total: allPayments.length,
    completed: allPayments.filter((p) => p.status === "completed").length,
    pending: allPayments.filter((p) => p.status === "pending" || p.status === "processing").length,
    failed: allPayments.filter((p) => p.status === "failed").length,
  };

  return NextResponse.json({ payments: allPayments, stats });
}
