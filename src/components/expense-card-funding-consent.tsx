import { formatUnits } from "viem";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { IconChevronDown } from "@/components/ui";
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
  const destinationChainId = summary?.destinationChainIds[0];
  const sourceNames = summary
    ? [...summary.sourceChainIds]
        .sort(
          (left, right) =>
            Number(left === destinationChainId) - Number(right === destinationChainId),
        )
        .map(chainLabel)
    : [];
  const destinationName = destinationChainId
    ? chainLabel(destinationChainId)
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="op-eyebrow">
          {summary?.crossChain ? "Live cross-chain funding" : "Daily card funding"}
        </p>
        <span className="op-chip-iris self-start sm:self-auto">Particle UA · EIP-7702</span>
      </div>
      <h2 className="mt-2 max-w-lg font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
        Make {formatUsdc(amountAtomic)} available to the agent
      </h2>

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
          {/* No amount on the route arrow: the budget is a SpendPolicy ceiling, not the sum that
              crosses chains (Particle sources part locally on the destination chain). The amount is
              the "Available for today" figure below, so the planned route stays qualitative and
              never implies the whole budget bridges from the source chain. */}
          {summary.crossChain ? (
            <CrossChainRoute
              status="preview"
              fromNames={sourceNames}
              toName={destinationName}
              feeLabel={feeLabel}
            />
          ) : (
            <div className="rounded-xl border border-line bg-paper p-3 text-sm text-ink2">
              Particle plans a same-chain {destinationName} approval for {formatUsdc(amountAtomic)}.
              {feeLabel ? <> Quoted fee {feeLabel}.</> : null}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-paper/80 p-3">
              <dt className="text-muted">Available for today</dt>
              <dd className="mt-1 font-semibold text-ink">{formatUsdc(amountAtomic)}</dd>
            </div>
            <div className="rounded-xl bg-paper/80 p-3">
              <dt className="text-muted">Signed lifetime ceiling</dt>
              <dd className="mt-1 font-semibold text-ink">{formatUsdc(totalCapAtomic)}</dd>
            </div>
          </dl>

          {summary.crossChain ? (
            <p className="rounded-xl border border-iris/25 bg-paper p-3 text-xs font-medium leading-relaxed text-ink2">
              Open Particle explorer appears here after FINISHED and server verification.
            </p>
          ) : null}
          <details className="op-disclosure bg-paper/70">
            <summary>
              Verification &amp; fee details
              <IconChevronDown className="op-chevron h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="space-y-3 border-t border-line px-4 py-3">
              <p className="text-xs leading-relaxed text-muted">
                The funding transaction approves only today&apos;s budget to SpendPolicy. The signed
                merchant, per-call, daily, expiry, total, and revoke rules still apply on-chain.
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Preview only. The card is not treated as funded until the server verifies Particle
                FINISHED status, each reported source leg, and the exact on-chain USDC approval.
              </p>
              {summary.crossChain ? (
                <p className="text-xs leading-relaxed text-ink2">
                  Confirming this route sends a real mainnet Particle UA transaction. The verified
                  result links to Particle&apos;s own explorer before the task starts.
                </p>
              ) : null}
              {summary.feeUsd !== null && summary.feeUsd > Number(formatUnits(amountAtomic, 6)) * 0.1 ? (
                <p className="rounded-xl border border-gold/25 bg-gold-soft/50 p-3 text-xs leading-relaxed text-gold">
                  This quote is expensive relative to the small demo budget. It proves the routing
                  architecture; production amounts should be chosen only after measuring current fees.
                </p>
              ) : null}
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
