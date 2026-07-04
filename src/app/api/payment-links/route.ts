import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { DEMO_REPLAY_PAYMENT_LINK, isDemoReplayRequest } from "@/lib/demo/replay";
import {
  RECEIPT_EMITTER_ABI,
} from "@/lib/contracts/receipt-emitter";
import {
  ARBITRUM_CHAIN,
  BASE_CHAIN,
  OPTIMISM_CHAIN,
  getPaymentChainById,
  getProofChain,
} from "@/lib/config/payment";
import { createPublicClient, createWalletClient, http, keccak256, stringToBytes, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateLinkSchema = z.object({
  merchantAddress: z.string().startsWith("0x"),
  amount: z.string(),
  token: z.literal("USDC"),
  destinationChainId: z
    .number()
    .refine(
      (id) =>
        id === BASE_CHAIN.chainId ||
        id === ARBITRUM_CHAIN.chainId ||
        id === OPTIMISM_CHAIN.chainId,
      {
        message: "destinationChainId must be Base, Arbitrum, or Optimism",
      }
    )
    .default(ARBITRUM_CHAIN.chainId),
  label: z.string().optional(),
  expiresInHours: z.number().optional(),
});

function requireAdminCreateToken(request: Request) {
  const expected = process.env.ADMIN_CREATE_TOKEN;
  if (!expected) {
    throw new Error("ADMIN_CREATE_TOKEN is not configured");
  }

  const received = request.headers.get("x-admin-create-token");
  if (received !== expected) {
    const error = new Error("Invalid admin create token");
    error.name = "Unauthorized";
    throw error;
  }
}

function getServerWalletClients() {
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL;
  const privateKey = process.env.RECEIPT_EMITTER_OWNER_PRIVATE_KEY;

  if (!rpcUrl) throw new Error("BASE_MAINNET_RPC_URL is not configured");
  if (!privateKey) throw new Error("RECEIPT_EMITTER_OWNER_PRIVATE_KEY is not configured");

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http(rpcUrl);

  return {
    account,
    publicClient: createPublicClient({ chain: base, transport }),
    walletClient: createWalletClient({ account, chain: base, transport }),
  };
}

export async function POST(request: Request) {
  try {
    requireAdminCreateToken(request);

    const body = await request.json();
    const parsed = CreateLinkSchema.parse(body);
    const amountAtomic = BigInt(parsed.amount);
    if (amountAtomic <= BigInt(0)) throw new Error("Amount must be greater than 0");

    // Settlement chain = where USDC is delivered to the merchant (Base or Arbitrum).
    // Proof chain = where the ReceiptEmitter + owner gas wallet live (always Base). The
    // invoice is registered and proven on the proof chain regardless of settlement chain.
    const settlementChain = getPaymentChainById(parsed.destinationChainId);
    const proofChain = getProofChain();
    // Per-chain demo caps (atomic USDC). Set to 3 USDC on every settlement chain so an invoice
    // can exceed the payer's LOCAL USDC on that chain and force Particle to source the shortfall
    // cross-chain (the amount also comfortably clears the routing fee — tiny amounts can be
    // skipped by solvers as uneconomical).
    const maxAtomicByChain: Record<number, bigint> = {
      [BASE_CHAIN.chainId]: BigInt(3_000_000),
      [ARBITRUM_CHAIN.chainId]: BigInt(3_000_000),
      [OPTIMISM_CHAIN.chainId]: BigInt(3_000_000),
    };
    const maxAtomic = maxAtomicByChain[settlementChain.chainId] ?? BigInt(250_000);
    if (amountAtomic > maxAtomic) {
      throw new Error(`Demo invoices on ${settlementChain.name} are capped at ${Number(maxAtomic) / 1_000_000} USDC`);
    }

    const expiresAt = new Date(Date.now() + (parsed.expiresInHours ?? 24) * 3600_000).toISOString();
    const receiptEmitterAddress = proofChain.receiptEmitterAddress;
    if (!receiptEmitterAddress) throw new Error(`${proofChain.name} ReceiptEmitter address is not configured`);

    const { data, error } = await supabaseAdmin
      .from("payment_links")
      .insert({
        merchant_address: parsed.merchantAddress,
        amount: parsed.amount,
        token: parsed.token,
        destination_chain_id: settlementChain.chainId,
        destination_token_address: settlementChain.usdcAddress,
        merchant_id: parsed.merchantAddress, // simplified for MVP
        label: parsed.label ?? null,
        status: "active",
        receipt_emitter_address: receiptEmitterAddress,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    const contractInvoiceId = keccak256(stringToBytes(data.id));

    try {
      const { publicClient, walletClient, account } = getServerWalletClients();
      const deadline = BigInt(Math.floor(new Date(expiresAt).getTime() / 1000));
      const registerTxHash = await walletClient.writeContract({
        address: receiptEmitterAddress,
        abi: RECEIPT_EMITTER_ABI,
        functionName: "registerInvoice",
        args: [
          contractInvoiceId,
          parsed.merchantAddress as Address,
          settlementChain.usdcAddress,
          amountAtomic,
          deadline,
        ],
        account,
        chain: base,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: registerTxHash,
        confirmations: 1,
      });
      if (receipt.status !== "success") {
        throw new Error(`registerInvoice reverted: ${registerTxHash}`);
      }

      const { error: updateError } = await supabaseAdmin
        .from("payment_links")
        .update({
          contract_invoice_id: contractInvoiceId,
          registered_tx_hash: registerTxHash,
          error_message: null,
        })
        .eq("id", data.id);

      if (updateError) throw updateError;

      data.contract_invoice_id = contractInvoiceId;
      data.registered_tx_hash = registerTxHash;
    } catch (registerErr) {
      const message = registerErr instanceof Error ? registerErr.message : "registerInvoice failed";
      await supabaseAdmin
        .from("payment_links")
        .update({ status: "failed", error_message: message })
        .eq("id", data.id);
      throw new Error(`On-chain invoice registration failed: ${message}`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${appUrl}/pay/${data.id}`;

    return NextResponse.json({ paymentLink: data, checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = err instanceof Error && err.name === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
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

  if (isDemoReplayRequest(searchParams)) {
    const links =
      merchantId.toLowerCase() === DEMO_REPLAY_PAYMENT_LINK.merchant_id.toLowerCase()
        ? [DEMO_REPLAY_PAYMENT_LINK]
        : [];
    return NextResponse.json({
      demoReplay: true,
      links,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("payment_links")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data });
}
