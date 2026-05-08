import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMO_REPLAY_PAYMENT, DEMO_REPLAY_PAYMENT_LINK, getDemoReplaySuccess } from "@/lib/demo/replay";
import { getActivePaymentChain, getConfiguredPaymentMode } from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

function formatAmount() {
  const token = resolvePaymentToken(DEMO_REPLAY_PAYMENT_LINK.token, DEMO_REPLAY_PAYMENT_LINK.destination_chain_id);
  return `${formatAtomicTokenAmount(DEMO_REPLAY_PAYMENT_LINK.amount, token)} ${token.symbol}`;
}

export default function DemoReplayPage() {
  const replay = getDemoReplaySuccess(DEMO_REPLAY_PAYMENT_LINK.id);
  if (!replay) notFound();

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Demo replay mode</p>
          <p className="mt-1">
            This uses an existing successful payment transaction and proof transaction. It does not execute a new payment or spend gas.
          </p>
        </div>

        <section className="rounded-lg border bg-white p-6">
          <div className="mb-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
              status: <span className="font-semibold text-green-700">PAID</span>
            </span>
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
              mode: <span className="font-mono">{PAYMENT_MODE}</span>
            </span>
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
              chain: <span className="font-mono">{ACTIVE_CHAIN.name}</span>
            </span>
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
              proof: <span className="font-semibold text-green-700">ok</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold">OneLink Pay Demo Replay</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            The customer paid {formatAmount()} in USDC on Base. The backend verified the USDC Transfer and recorded a ReceiptEmitter proof transaction before marking the invoice paid.
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <ReceiptRow label="Amount" value={formatAmount()} />
            <ReceiptRow label="Merchant" value={DEMO_REPLAY_PAYMENT_LINK.merchant_address} mono />
            <ReceiptRow label="Payer UA" value={DEMO_REPLAY_PAYMENT.payer_address} mono />
            <ReceiptRow label="Invoice ID" value={DEMO_REPLAY_PAYMENT_LINK.contract_invoice_id} mono />
            <ReceiptLink label="Payment tx" href={replay.paymentExplorer} value={DEMO_REPLAY_PAYMENT.tx_hash} />
            <ReceiptLink label="Proof tx" href={replay.proofExplorer} value={DEMO_REPLAY_PAYMENT.receipt_tx_hash} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open Receipt Page
            </Link>
            <Link
              href={`/dashboard?demo=replay&merchantId=${DEMO_REPLAY_PAYMENT_LINK.merchant_id}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Open Dashboard Replay
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function ReceiptRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 pb-3 sm:grid-cols-[140px_1fr]">
      <dt className="text-gray-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function ReceiptLink({ label, href, value }: { label: string; href: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 pb-3 sm:grid-cols-[140px_1fr]">
      <dt className="text-gray-500">{label}</dt>
      <dd>
        <a className="break-all font-mono text-xs text-blue-700 underline" href={href} target="_blank" rel="noreferrer">
          {value}
        </a>
      </dd>
    </div>
  );
}
