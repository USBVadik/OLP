import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoReplaySuccess } from "@/lib/demo/replay";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";

function formatAmount(amount: string, tokenSymbol: string, chainId: number) {
  const token = resolvePaymentToken(tokenSymbol, chainId);
  return `${formatAtomicTokenAmount(amount, token)} ${token.symbol}`;
}

export default function SuccessPage({ params }: { params: { id: string } }) {
  const replay = getDemoReplaySuccess(params.id);
  if (!replay) notFound();

  const { link, payment, paymentExplorer, proofExplorer } = replay;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Demo replay mode</p>
          <p>
            This page replays an existing successful payment and proof transaction. It does not execute
            a new payment.
          </p>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            OK
          </div>
          <h1 className="text-2xl font-bold text-green-800">Payment Verified</h1>
          <p className="text-sm text-gray-500">Existing Base USDC transfer plus ReceiptEmitter proof</p>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Amount</dt>
            <dd className="font-semibold">{formatAmount(link.amount, link.token, link.destination_chain_id)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Merchant</dt>
            <dd className="break-all font-mono text-xs">{link.merchant_address}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Invoice ID</dt>
            <dd className="break-all font-mono text-xs">{link.contract_invoice_id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Payment tx</dt>
            <dd className="break-all text-right font-mono text-xs">
              <a className="text-blue-700 underline" href={paymentExplorer} target="_blank" rel="noreferrer">
                {payment.tx_hash}
              </a>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Proof tx</dt>
            <dd className="break-all text-right font-mono text-xs">
              <a className="text-blue-700 underline" href={proofExplorer} target="_blank" rel="noreferrer">
                {payment.receipt_tx_hash}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Dashboard replay status: <span className="font-semibold">PAID / proof ok</span>
        </div>

        <Link
          className="mt-5 inline-block text-sm text-blue-700 underline"
          href={`/dashboard?demo=replay&merchantId=${link.merchant_id}`}
        >
          Open demo replay dashboard
        </Link>
      </div>
    </main>
  );
}
