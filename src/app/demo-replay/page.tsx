import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_REPLAY_PAYMENT, DEMO_REPLAY_PAYMENT_LINK, getDemoReplaySuccess } from "@/lib/demo/replay";
import { BASE_CHAIN, getPaymentModeLabel } from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import {
  Wordmark,
  Chip,
  Field,
  TxReference,
  AppNav,
  IconCheck,
  IconArrowUpRight,
  IconShield,
  IconReceipt,
  IconLock,
} from "@/components/ui";

const ACTIVE_CHAIN = BASE_CHAIN;
const PAYMENT_MODE_LABEL = getPaymentModeLabel();

function formatAmount() {
  const token = resolvePaymentToken(DEMO_REPLAY_PAYMENT_LINK.token, DEMO_REPLAY_PAYMENT_LINK.destination_chain_id);
  return `${formatAtomicTokenAmount(DEMO_REPLAY_PAYMENT_LINK.amount, token)} ${token.symbol}`;
}

export default function DemoReplayPage() {
  const replay = getDemoReplaySuccess(DEMO_REPLAY_PAYMENT_LINK.id);
  if (!replay) notFound();

  const amount = formatAmount();

  return (
    <main className="op-shell px-5 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <Link href="/" className="op-btn-ghost px-3 py-2">
            Home
          </Link>
        </header>

        <AppNav className="mb-6" />

        {/* Intro */}
        <section className="op-animate-rise">
          <span className="op-eyebrow">Demo replay · no wallet needed</span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Trust before you pay.{" "}
            <span className="text-gold">Proof</span> after it settles.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink2">
            Watch a real, verified payment without spending a thing: the customer paid {amount} on{" "}
            {ACTIVE_CHAIN.name}, the backend verified the USDC transfer, and a ReceiptEmitter proof
            was recorded on-chain before the invoice was marked paid.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip tone="verify">
              <IconCheck className="h-3.5 w-3.5" /> No wallet needed
            </Chip>
            <Chip>No gas spent</Chip>
            <Chip>Everything verifiable on-chain</Chip>
          </div>
        </section>

        {/* Three moments */}
        <section className="mt-10">
          <p className="op-eyebrow mb-3">The three moments that build trust</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Moment icon={<IconShield className="h-4 w-4" />} step="Before" title="Trust Preview" />
            <Moment icon={<IconReceipt className="h-4 w-4" />} step="After" title="Proof Receipt" />
            <Moment icon={<IconLock className="h-4 w-4" />} step="Live" title="Permission Firewall" href="/firewall" />
          </div>
        </section>

        {/* Verified summary */}
        <section className="mt-8 op-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="op-eyebrow">Verified payment</span>
            <Chip tone="verify">
              <IconCheck className="h-3.5 w-3.5" /> PAID · proof recorded
            </Chip>
          </div>

          <div className="px-6 py-2">
            <dl className="divide-y divide-line">
              <Field label="Amount" value={amount} emphasis />
              <Field label="Merchant" value={DEMO_REPLAY_PAYMENT_LINK.merchant_address} mono />
              <Field label="Payer Universal Account" value={DEMO_REPLAY_PAYMENT.payer_address} mono />
              <Field label="Invoice ID" value={DEMO_REPLAY_PAYMENT_LINK.contract_invoice_id} mono />
              <Field label="Payment mode" value={PAYMENT_MODE_LABEL} />
            </dl>
          </div>

          <div className="space-y-2 px-6 pb-5 pt-2">
            <p className="op-eyebrow mb-1">On-chain proof</p>
            <TxReference label="Payment transaction" hash={DEMO_REPLAY_PAYMENT.tx_hash} href={replay.paymentExplorer} />
            <TxReference label="Proof transaction" hash={DEMO_REPLAY_PAYMENT.receipt_tx_hash} href={replay.proofExplorer} />
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-paper2 px-6 py-5 sm:flex-row sm:items-center">
            <Link href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`} className="op-btn-primary">
              Open proof receipt
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard?demo=replay&merchantId=${DEMO_REPLAY_PAYMENT_LINK.merchant_id}`}
              className="op-btn-secondary"
            >
              Open merchant dashboard
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Honest scope: this replay shows a real, same-chain payment and its on-chain proof. The
          Permission Firewall above is live and enforced on-chain.
        </p>
      </div>
    </main>
  );
}

function Moment({
  icon,
  step,
  title,
  href,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="op-eyebrow">{step}</p>
        <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
          {title}
          {href ? <IconArrowUpRight className="h-3.5 w-3.5 text-faint group-hover:text-gold" /> : null}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="op-card-quiet group flex items-center gap-3 p-4 transition-colors hover:border-gold/40 hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        {inner}
      </Link>
    );
  }

  return <div className="op-card-quiet flex items-center gap-3 p-4">{inner}</div>;
}
