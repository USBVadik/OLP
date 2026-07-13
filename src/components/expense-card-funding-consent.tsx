import { formatUnits } from "viem";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { chainLabel } from "@/lib/particle/assets";
import type { ExpenseCardFundingPreview } from "@/lib/particle/expense-card-funding";

function formatUsdc(atomic: bigint): string {
  const amount = Number(formatUnits(atomic, 6));
  return `${amount % 1 === 0 ? amount : amount.toFixed(2)} USDC`;
}

export function ExpenseCardFundingConsent({
  amountAtomic,
  totalCapAtomic,
  summary,
  loading,
  error,
  onRetry,
}: {
  amountAtomic: bigint;
  totalCapAtomic: bigint;
  summary: ExpenseCardFundingPreview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const sourceNames = summary?.sourceChainIds.map(chainLabel) ?? [];
  const destinationName = summary?.destinationChainIds[0]
    ? chainLabel(summary.destinationChainIds[0])
    : "Arbitrum";
  const feeLabel =
    summary?.feeUsd !== null && summary?.feeUsd !== undefined
      ? `~$${summary.feeUsd < 0.01 ? summary.feeUsd.toFixed(4) : summary.feeUsd.toFixed(2)} ${summary.feeSymbol ?? "USDC"}`
      : null;

  return (
    <section
      aria-label="Particle card funding preview"
      className="rounded-2xl border border-iris/25 bg-iris-soft/25 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="op-eyebrow">Daily card funding · experimental</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink">
            Make {formatUsdc(amountAtomic)} available to the agent
          </h2>
        </div>
        <span className="op-chip-iris shrink-0">Particle UA</span>
      </div>

      {loading ? (
        <div role="status" className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm text-muted">
          Building a live, unsigned funding route…
        </div>
      ) : error ? (
        <div role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm">
          <p className="text-danger">Preview unavailable: {error}</p>
          <button type="button" onClick={onRetry} className="op-btn-secondary mt-3 w-full justify-center">
            Retry funding preview
          </button>
        </div>
      ) : summary ? (
        <div className="mt-4 space-y-3">
          {summary.crossChain ? (
            <CrossChainRoute
              status="preview"
              fromNames={sourceNames}
              toName={destinationName}
              amountLabel={formatUsdc(amountAtomic)}
              feeLabel={feeLabel}
            />
          ) : (
            <div className="rounded-xl border border-line bg-paper p-3 text-sm text-ink2">
              Particle plans a same-chain {destinationName} approval for {formatUsdc(amountAtomic)}.
              {feeLabel ? <> Quoted fee {feeLabel}.</> : null}
            </div>
          )}

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-paper/80 p-3">
              <dt className="text-muted">Available for today</dt>
              <dd className="mt-1 font-semibold text-ink">{formatUsdc(amountAtomic)}</dd>
            </div>
            <div className="rounded-xl bg-paper/80 p-3">
              <dt className="text-muted">Signed lifetime ceiling</dt>
              <dd className="mt-1 font-semibold text-ink">{formatUsdc(totalCapAtomic)}</dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-muted">
            The funding transaction approves only today&apos;s budget to SpendPolicy. The signed
            merchant, per-call, daily, expiry, total, and revoke rules still apply on-chain.
          </p>
          <p className="rounded-xl border border-line bg-paper/70 p-3 text-xs leading-relaxed text-muted">
            Preview only. The card is not treated as funded until the server verifies Particle
            FINISHED status, each reported source leg, and the exact on-chain USDC approval.
          </p>
          {summary.feeUsd !== null && summary.feeUsd > Number(formatUnits(amountAtomic, 6)) * 0.1 ? (
            <p className="rounded-xl border border-gold/25 bg-gold-soft/50 p-3 text-xs leading-relaxed text-gold">
              This quote is expensive relative to the small demo budget. It proves the routing
              architecture; production amounts should be chosen only after measuring current fees.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
