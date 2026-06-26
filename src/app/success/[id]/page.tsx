import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoReplaySuccess } from "@/lib/demo/replay";
import {
  BASE_CHAIN,
  getConfiguredPaymentMode,
  getPaymentChainById,
  getProofChain,
  type ChainPaymentConfig,
} from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import { Wordmark, IconCheck, IconArrowUpRight, AppNav } from "@/components/ui";
import { ProofReceiptCard, VerificationMethod } from "@/components/proof-receipt";
import { CopyLinkButton } from "@/components/copy-link-button";

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

export default function SuccessPage({ params }: { params: { id: string } }) {
  const replay = getDemoReplaySuccess(params.id);
  if (!replay) notFound();

  const { link, payment, paymentExplorer, proofExplorer } = replay;
  const settlementChain = chainFor(link.destination_chain_id);
  const proofChain = getProofChain();
  const amount = amountLabelFor(link.amount, link.token, link.destination_chain_id);

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark href="/" />
          <span className="op-chip-verify">
            <IconCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </header>

        <AppNav className="mb-5" />

        <ProofReceiptCard
          amountLabel={amount}
          merchant={link.merchant_address}
          invoiceId={link.contract_invoice_id}
          mode={getConfiguredPaymentMode()}
          settlementChainName={settlementChain.name}
          proofChainName={proofChain.name}
          isCrossChain={settlementChain.chainId !== proofChain.chainId}
          payment={{ hash: payment.tx_hash, href: paymentExplorer }}
          proof={{ hash: payment.receipt_tx_hash, href: proofExplorer }}
        />

        {/* Share & verify */}
        <div className="op-card mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="op-eyebrow">Share &amp; verify</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Anyone can re-check the settlement and the InvoicePaid proof on-chain — no account
              needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyLinkButton />
            <Link
              href={`/dashboard?demo=replay&merchantId=${link.merchant_id}`}
              className="op-btn-ghost"
            >
              Open dashboard
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <VerificationMethod
            amountLabel={amount}
            settlementChainName={settlementChain.name}
            proofChainName={proofChain.name}
          />
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Demo replay: this certificate reflects an existing verified payment and proof transaction.
          It does not execute a new payment.
        </p>
      </div>
    </main>
  );
}
