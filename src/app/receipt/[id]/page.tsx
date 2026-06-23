import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase/client";
import {
  BASE_CHAIN,
  getConfiguredPaymentMode,
  getExplorerTxUrl,
  getPaymentChainById,
  getProofChain,
  getUniversalXActivityUrl,
  type ChainPaymentConfig,
} from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import { receiptShareUrl } from "@/lib/receipts/share";
import { ProofReceiptCard, VerificationMethod } from "@/components/proof-receipt";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Wordmark, IconCheck, IconShield, IconArrowUpRight } from "@/components/ui";

export const dynamic = "force-dynamic";

function chainFor(chainId: number): ChainPaymentConfig {
  try {
    return getPaymentChainById(chainId);
  } catch {
    return BASE_CHAIN;
  }
}

function amountLabelFor(amount: string, token: string, chainId: number) {
  try {
    const t = resolvePaymentToken(token, chainId);
    return `${formatAtomicTokenAmount(amount, t)} ${t.symbol}`;
  } catch {
    return `${amount} ${token}`;
  }
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const { data: link } = await supabaseAdmin
    .from("payment_links")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!link) notFound();

  const settlementChain = chainFor(link.destination_chain_id);
  const proofChain = getProofChain();
  const amountLabel = amountLabelFor(link.amount, link.token, link.destination_chain_id);
  const isCompleted = link.status === "completed";

  let paymentHash: string | null = null;
  let proofHash: string | null = null;
  let uaTransactionId: string | null = null;
  if (isCompleted) {
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("tx_hash,receipt_tx_hash,ua_transaction_id,completed_at")
      .eq("payment_link_id", link.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    paymentHash = link.paid_tx_hash ?? payment?.tx_hash ?? null;
    proofHash = payment?.receipt_tx_hash ?? null;
    uaTransactionId = payment?.ua_transaction_id ?? null;
  }

  // Shareable public receipt URL + a best-effort QR (server-rendered SVG, no client JS).
  const shareUrl = receiptShareUrl(process.env.NEXT_PUBLIC_APP_URL ?? "", link.id);
  let qrSvg: string | null = null;
  if (isCompleted) {
    try {
      qrSvg = await QRCode.toString(shareUrl, {
        type: "svg",
        margin: 1,
        width: 148,
        color: { dark: "#1a1a1a", light: "#00000000" },
      });
    } catch {
      qrSvg = null; // QR is best-effort; the receipt + copy-link still work.
    }
  }

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark />
          <span className={isCompleted ? "op-chip-verify" : "op-chip"}>
            {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : <IconShield className="h-3.5 w-3.5" />}
            {isCompleted ? "Verified" : "Unverified"}
          </span>
        </header>

        {isCompleted ? (
          <>
            <ProofReceiptCard
              amountLabel={amountLabel}
              merchant={link.merchant_address}
              invoiceId={link.contract_invoice_id}
              mode={getConfiguredPaymentMode()}
              settlementChainName={settlementChain.name}
              proofChainName={proofChain.name}
              isCrossChain={settlementChain.chainId !== proofChain.chainId}
              payment={{ hash: paymentHash, href: paymentHash ? getExplorerTxUrl(settlementChain, paymentHash) : null }}
              proof={{ hash: proofHash, href: proofHash ? getExplorerTxUrl(proofChain, proofHash) : null }}
              universalActivity={{ id: uaTransactionId, href: getUniversalXActivityUrl(uaTransactionId) }}
              matchedDetail={`Recipient and amount (${amountLabel}) were re-checked against this invoice from the on-chain ${settlementChain.name} USDC transfer.`}
            />
            <div className="op-card mt-4 p-5">
              <p className="op-eyebrow">Share &amp; verify</p>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {qrSvg ? (
                  <div
                    className="shrink-0 rounded-xl border border-line bg-paper p-2"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    aria-label="QR code linking to this public receipt"
                  />
                ) : null}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-sm text-ink2">
                    Scan or share this receipt — anyone can verify the settlement and the
                    InvoicePaid proof on-chain, no account needed.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <CopyLinkButton />
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="op-btn-ghost"
                    >
                      Open public link
                      <IconArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <VerificationMethod
                amountLabel={amountLabel}
                settlementChainName={settlementChain.name}
                proofChainName={proofChain.name}
              />
            </div>
          </>
        ) : (
          <div className="op-card op-animate-rise p-7 text-center">
            <p className="op-eyebrow">Proof Receipt</p>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">Not paid yet</p>
            <p className="mt-2 text-sm text-muted">
              This invoice for {amountLabel} has no verified payment yet. Once paid, a tamper-evident
              receipt with on-chain proof appears here.
            </p>
            <Link href={`/pay/${link.id}`} className="op-btn-primary mt-6 inline-flex">
              Open checkout
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          The settlement is trustless and public on the block explorer; the InvoicePaid proof is an
          on-chain attestation that re-checks it against the invoice. No account needed to verify either.
        </p>
      </div>
    </main>
  );
}
