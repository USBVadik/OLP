import { ARBITRUM_CHAIN, getExplorerTxUrl, getUniversalXActivityUrl } from "@/lib/config/payment";
import { chainLabel } from "@/lib/particle/assets";
import type { StoredFundingEvidence } from "@/lib/agent/funding-evidence-store";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { IconArrowUpRight, IconCheck } from "@/components/ui";

export function ExpenseCardFundingProof({ evidence }: { evidence: StoredFundingEvidence }) {
  const activityUrl = getUniversalXActivityUrl(evidence.ua_transaction_id);
  const approvalUrl = getExplorerTxUrl(ARBITRUM_CHAIN, evidence.approval_tx_hash);
  const sourceNames = evidence.source_chain_ids.map(chainLabel);
  const budgetLabel = `${(Number(evidence.approved_amount) / 1_000_000).toFixed(2)} USDC`;
  const settlementName = chainLabel(evidence.settlement_chain_id);

  return (
    <section className="rounded-2xl border border-verify/25 bg-verify-soft p-4" aria-label="Verified card funding">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-verify text-white">
          <IconCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">
            Daily card budget is ready on Arbitrum
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink2">
            The server matched a finished Particle activity to successful on-chain funding legs and
            the exact USDC approval for SpendPolicy.
          </p>
        </div>
      </div>

      {/* Money in motion: the same settled-route visual as /pay and /receipt, so the card's
          cross-chain funding reads as Particle's superpower rather than a metric row. */}
      {evidence.cross_chain && sourceNames.length ? (
        <CrossChainRoute
          className="mt-4"
          status="settled"
          fromNames={sourceNames}
          toName={settlementName}
          amountLabel={budgetLabel}
          verified
        />
      ) : (
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-paper/80 p-3">
            <dt className="text-muted">Funding route</dt>
            <dd className="mt-1 font-semibold text-ink">{`${settlementName} → ${settlementName}`}</dd>
          </div>
          <div className="rounded-xl bg-paper/80 p-3">
            <dt className="text-muted">Approved daily budget</dt>
            <dd className="mt-1 font-semibold text-ink">{budgetLabel}</dd>
          </div>
        </dl>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {activityUrl ? (
          <a href={activityUrl} target="_blank" rel="noreferrer" className="op-btn-secondary text-xs">
            Particle activity <IconArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
        <a href={approvalUrl} target="_blank" rel="noreferrer" className="op-btn-secondary text-xs">
          Approval proof <IconArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
