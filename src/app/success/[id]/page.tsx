import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoReplaySuccess } from "@/lib/demo/replay";
import { getActivePaymentChain, getConfiguredPaymentMode } from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import { Wordmark, VerifiedSeal, Field, TxReference, Chip, IconCheck, IconArrowUpRight } from "@/components/ui";
import { CopyLinkButton } from "@/components/copy-link-button";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

function formatAmount(amount: string, tokenSymbol: string, chainId: number) {
  const token = resolvePaymentToken(tokenSymbol, chainId);
  return `${formatAtomicTokenAmount(amount, token)} ${token.symbol}`;
}

export default function SuccessPage({ params }: { params: { id: string } }) {
  const replay = getDemoReplaySuccess(params.id);
  if (!replay) notFound();

  const { link, payment, paymentExplorer, proofExplorer } = replay;
  const amount = formatAmount(link.amount, link.token, link.destination_chain_id);

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark />
          <span className="op-chip-verify">
            <IconCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </header>

        {/* Certificate */}
        <article className="op-card op-animate-rise overflow-hidden">
          {/* Gold accent rule */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft" aria-hidden="true" />

          <div className="px-6 pt-8 text-center sm:px-10">
            <p className="op-eyebrow">Proof Receipt</p>
            <div className="mt-5">
              <VerifiedSeal animate />
            </div>
            <p className="mt-5 text-sm text-muted">You paid</p>
            <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink tnum">{amount}</p>
            <div className="mt-4 flex justify-center">
              <Chip tone="verify">
                <IconCheck className="h-3.5 w-3.5" /> Verified on {ACTIVE_CHAIN.name}
              </Chip>
            </div>
          </div>

          <div className="px-6 pb-2 pt-7 sm:px-10">
            <dl className="divide-y divide-line">
              <Field label="Merchant" value={link.merchant_address} mono />
              <Field label="Invoice ID" value={link.contract_invoice_id} mono />
              <Field label="Payment mode" value={PAYMENT_MODE} mono />
              <Field label="Proof status" value={<span className="text-verify">InvoicePaid recorded</span>} />
            </dl>
          </div>

          <div className="space-y-2 px-6 pb-6 sm:px-10">
            <p className="op-eyebrow mb-1">On-chain proof</p>
            <TxReference label="Payment transaction" hash={payment.tx_hash} href={paymentExplorer} />
            <TxReference label="Proof transaction" hash={payment.receipt_tx_hash} href={proofExplorer} />
          </div>

          {/* Certificate footer */}
          <div className="flex flex-col gap-3 border-t border-line bg-paper2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <CopyLinkButton />
            <Link
              href={`/dashboard?demo=replay&merchantId=${link.merchant_id}`}
              className="op-btn-ghost"
            >
              Open dashboard
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Demo replay: this certificate reflects an existing verified payment and proof transaction.
          It does not execute a new payment.
        </p>
      </div>
    </main>
  );
}
