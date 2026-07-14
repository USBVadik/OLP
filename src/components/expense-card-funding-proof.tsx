import { ARBITRUM_CHAIN, getExplorerTxUrl, getUniversalXActivityUrl } from "@/lib/config/payment";
import { chainLabel } from "@/lib/particle/assets";
import type { StoredFundingEvidence } from "@/lib/agent/funding-evidence-store";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { ParticleActivityProof } from "@/components/particle-activity-proof";
import { IconArrowUpRight, IconCheck } from "@/components/ui";

export function ExpenseCardFundingProof({ evidence }: { evidence: StoredFundingEvidence }) {
  const activityUrl = getUniversalXActivityUrl(evidence.ua_transaction_id);
  const approvalUrl = getExplorerTxUrl(ARBITRUM_CHAIN, evidence.approval_tx_hash);
  const sourceNames = evidence.source_chain_ids.map(chainLabel);
  const budgetLabel = `${(Number(evidence.approved_amount) / 1_000_000).toFixed(2)} USDC`;
  const settlementName = chainLabel(evidence.settlement_chain_id);
  const particleSummary = sourceNames.length
    ? `EIP-7702 · ${sourceNames.join(" + ")} source leg${sourceNames.length > 1 ? "s" : ""} helped make the budget available on ${settlementName}`
    : `EIP-7702 · Particle activity matched to the ${settlementName} budget approval`;

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

      {/* Money in motion — the same settled-route visual as /pay and /receipt, but with NO amount
          on the arrow. The approved budget is a SpendPolicy ceiling, not the sum that crossed
          chains (only part routed from the source chain; the rest was already on the settlement
          chain), so the route stays qualitative and the budget is its own labelled figure below —
          otherwise the arrow would overclaim "N USDC crossed". */}
      {evidence.cross_chain && sourceNames.length ? (
        <CrossChainRoute
          className="mt-4"
          status="settled"
          fromNames={sourceNames}
          toName={settlementName}
          verified
        />
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-paper/80 px-3.5 py-3 text-xs">
          <span className="text-muted">Funding route</span>
          <span className="font-semibold text-ink">On {settlementName}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-xl bg-paper/80 px-3.5 py-3">
        <span className="text-xs text-muted">Approved daily budget</span>
        <span className="font-display text-sm font-semibold text-ink tnum">{budgetLabel}</span>
      </div>

      <ParticleActivityProof
        activityId={evidence.ua_transaction_id}
        href={activityUrl}
        sourceNames={sourceNames}
        settlementName={settlementName}
        verified
        variant="inline"
        summary={particleSummary}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={approvalUrl} target="_blank" rel="noreferrer" className="op-btn-secondary text-xs">
          Approval proof <IconArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
