import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { linkId: string } }
) {
  const { data, error } = await supabaseAdmin
    .from("payment_links")
    .select("*")
    .eq("id", params.linkId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Payment link not found" },
      { status: 404 }
    );
  }

  if (data.status === "completed") {
    const { data: latestPayment } = await supabaseAdmin
      .from("payments")
      .select("tx_hash,receipt_tx_hash,status,completed_at")
      .eq("payment_link_id", data.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ link: { ...data, latest_payment: latestPayment ?? null } });
  }

  if (data.status !== "active") {
    return NextResponse.json(
      { error: "Payment link is no longer active" },
      { status: 410 }
    );
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Payment link has expired" },
      { status: 410 }
    );
  }

  return NextResponse.json({ link: data });
}
