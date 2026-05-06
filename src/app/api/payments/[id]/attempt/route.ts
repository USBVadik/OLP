import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { BASE_MAINNET_CHAIN_ID } from "@/lib/contracts/receipt-emitter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AttemptSchema = z.object({
  payerAddress: z.string().startsWith("0x"),
  previewJson: z.unknown(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = AttemptSchema.parse(body);

    const { data: link, error: linkError } = await supabaseAdmin
      .from("payment_links")
      .select("*")
      .eq("id", params.id)
      .single();

    if (linkError || !link) throw new Error("Payment link not found");

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        payment_link_id: params.id,
        payer_address: parsed.payerAddress,
        source_chain_id: BASE_MAINNET_CHAIN_ID,
        destination_chain_id: link.destination_chain_id,
        token: link.token,
        amount: link.amount,
        tx_hash: null,
        receipt_tx_hash: null,
        preview_json: parsed.previewJson,
        error_message: null,
        status: "pending",
        completed_at: null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ paymentAttempt: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
