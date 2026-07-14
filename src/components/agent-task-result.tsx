import { ParticleActivityProof } from "@/components/particle-activity-proof";
import {
  Chip,
  IconArrowUpRight,
  IconBan,
  IconCheck,
  IconReceipt,
  IconShield,
} from "@/components/ui";
import type { PostRevokeProof } from "@/lib/firewall/post-revoke-proof";
import { formatUsdcAmount } from "@/lib/mandates/format";
import {
  type ResearchPolicyBlock,
  type ResearchTaskSummary,
} from "@/lib/agent/research-task";

export type AgentOutcomeParticleActivity = {
  activityId: string;
  href: string | null;
  sourceNames?: string[];
  settlementName?: string;
  verified: boolean;
};

export type AgentOutcomeEvidenceLink = {
  label: string;
  href: string;
};

type Props = {
  summary: ResearchTaskSummary;
  particleActivity?: AgentOutcomeParticleActivity | null;
  fundingLinks?: AgentOutcomeEvidenceLink[];
  revoked?: boolean;
  revokeProof?: PostRevokeProof | null;
  revokeTxUrl?: string | null;
  receiptHref?: string | null;
};

export function AgentTaskResult({
  summary,
  particleActivity = null,
  fundingLinks = [],
  revoked = false,
  revokeProof = null,
  revokeTxUrl = null,
  receiptHref = null,
}: Props) {
  if (summary.status === "idle") return null;

  const complete = summary.status === "complete" && summary.brief;
  const contained = Boolean(
    complete && summary.policyBlock && summary.policyBlock.fundsMovedAtomic === 0n,
  );

  return (
    <section
      aria-live="polite"
      aria-labelledby="research-result-title"
      className={`overflow-hidden rounded-2xl border bg-paper shadow-card ${
        complete ? "border-verify/35" : "border-gold/35"
      }`}
    >
      {complete ? (
        <>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <IconReceipt className="h-4 w-4 text-verify" /> Outcome
              </p>
              <Chip tone="verify">
                <IconCheck className="h-3 w-3" />
                {contained ? "Task complete · policy held" : "Task complete"}
              </Chip>
            </div>

            <h2
              id="research-result-title"
              className="mt-4 max-w-xl font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl"
            >
              {contained ? "Task completed safely" : "Brief completed"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink2">
              {contained
                ? `Software bought ${summary.purchasedCount} required inputs, produced the brief, and could not move funds for the unexpected over-cap request.`
                : `Software bought ${summary.purchasedCount} required inputs and produced the requested brief within the signed budget.`}
            </p>

            <dl className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4">
              <OutcomeMetric
                label="Useful spend"
                value={formatUsdcAmount(summary.spentAtomic)}
                detail={`${summary.purchasedCount} inputs`}
              />
              <OutcomeMetric
                label="Blocked request"
                value={summary.blockedCount ? formatUsdcAmount(summary.protectedAtomic) : "Not tested"}
                detail={summary.blockedCount ? `${summary.blockedCount} refused` : "No policy block"}
                verified={summary.blockedCount > 0}
              />
              <OutcomeMetric
                label="Budget left"
                value={formatUsdcAmount(summary.remainingDailyAtomic)}
                detail="Still controlled"
              />
            </dl>

            <div className="mt-5 border-l-2 border-verify/45 pl-4">
              <p className="text-xs font-semibold text-verify">Useful result</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-ink">
                {summary.brief?.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink2">{summary.brief?.summary}</p>
              {summary.brief?.evidence.length ? (
                <ul className="mt-3 space-y-2 text-sm text-ink2">
                  {summary.brief.evidence.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-verify" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {summary.policyBlock ? <PolicyBlockEvidence block={summary.policyBlock} /> : null}

          <OutcomeProofTrail
            summary={summary}
            particleActivity={particleActivity}
            fundingLinks={fundingLinks}
            revoked={revoked}
            revokeProof={revokeProof}
            revokeTxUrl={revokeTxUrl}
            receiptHref={receiptHref}
          />
        </>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <IconBan className="h-4 w-4 text-gold" /> Task result
            </p>
            <Chip tone="gold">Incomplete</Chip>
          </div>
          <h2 id="research-result-title" className="mt-4 font-display text-lg font-semibold text-ink">
            The brief could not be completed
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Required data was not delivered: {summary.missingRequiredResources.join(", ") || "unknown input"}.
            Check technical activity before retrying.
          </p>
          {summary.errorCount > 0 || summary.withheldCount > 0 ? (
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              {summary.errorCount + summary.withheldCount} infrastructure or delivery issue
              {summary.errorCount + summary.withheldCount === 1 ? " was" : "s were"} recorded separately.
              They are not counted as protected spend.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function OutcomeMetric({
  label,
  value,
  detail,
  verified = false,
}: {
  label: string;
  value: string;
  detail: string;
  verified?: boolean;
}) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
      <dt className="text-[10px] font-semibold uppercase text-muted sm:text-[11px]">{label}</dt>
      <dd
        className={`mt-1 break-words font-display text-lg font-semibold leading-tight sm:text-2xl ${
          verified ? "text-verify" : "text-ink"
        }`}
      >
        {value}
      </dd>
      <p className="mt-1 text-[10px] leading-tight text-faint sm:text-xs">{detail}</p>
    </div>
  );
}

function PolicyBlockEvidence({ block }: { block: ResearchPolicyBlock }) {
  const revoked = /revoked|MandateIsRevoked/i.test(block.reason);
  const rule = /per[- ]?charge|PerChargeExceeded/i.test(block.reason)
    ? "Per-charge limit enforced"
    : revoked
      ? "Revoked permission enforced"
      : "Signed policy enforced";

  return (
    <section
      aria-labelledby="policy-block-title"
      className="op-animate-seal border-y border-danger/30 bg-danger-soft px-5 py-5 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold text-danger">
          <IconShield className="h-4 w-4" />
          {revoked ? "Post-revoke charge" : "Unexpected over-cap request"}
        </p>
        <Chip tone="verify">
          <IconCheck className="h-3 w-3" /> Refused before broadcast
        </Chip>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h3 id="policy-block-title" className="font-display text-xl font-semibold text-ink">
            {revoked ? "Charge after revoke, blocked" : "Over-cap charge blocked"}
          </h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink2">
            SpendPolicy rejected the request in preflight. No transaction was broadcast and nothing
            left the account.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-display text-2xl font-semibold text-verify sm:text-3xl">
            {formatUsdcAmount(block.fundsMovedAtomic)} moved
          </p>
          <p className="mt-1 text-xs font-medium text-muted">zero gas on the blocked attempt</p>
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-danger/20 pt-3 text-xs">
        <PolicyMetric label="Attempted" value={formatUsdcAmount(block.attemptedAtomic)} />
        <PolicyMetric
          label={block.signedLimitAtomic === null ? "Verdict" : "Signed limit"}
          value={
            block.signedLimitAtomic === null
              ? "Refused"
              : formatUsdcAmount(block.signedLimitAtomic)
          }
        />
        <PolicyMetric label="Rule" value={rule} />
      </dl>
    </section>
  );
}

function PolicyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function OutcomeProofTrail({
  summary,
  particleActivity,
  fundingLinks,
  revoked,
  revokeProof,
  revokeTxUrl,
  receiptHref,
}: {
  summary: ResearchTaskSummary;
  particleActivity: AgentOutcomeParticleActivity | null;
  fundingLinks: AgentOutcomeEvidenceLink[];
  revoked: boolean;
  revokeProof: PostRevokeProof | null;
  revokeTxUrl: string | null;
  receiptHref: string | null;
}) {
  const hasLinkedEvidence = Boolean(
    particleActivity?.verified || fundingLinks.length || summary.settlementLinks.length || revokeTxUrl,
  );

  return (
    <section aria-labelledby="outcome-proof-title" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="outcome-proof-title" className="font-display text-lg font-semibold text-ink">
            Proof trail
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Linked receipts prove money movement; the blocked attempt records the observed preflight verdict.
          </p>
        </div>
        <Chip tone={hasLinkedEvidence ? "verify" : "default"}>
          {hasLinkedEvidence ? "Linked evidence" : "Run evidence"}
        </Chip>
      </div>

      {particleActivity ? (
        <ParticleActivityProof
          activityId={particleActivity.activityId}
          href={particleActivity.href}
          sourceNames={particleActivity.sourceNames}
          settlementName={particleActivity.settlementName}
          verified={particleActivity.verified}
          variant="inline"
          summary={`EIP-7702 · Particle activity verified for card funding and the ${particleActivity.settlementName ?? "settlement-chain"} approval`}
        />
      ) : null}

      {fundingLinks.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {fundingLinks.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="op-btn-secondary min-w-0 text-xs"
            >
              <span className="truncate">{link.label}</span>
              <IconArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </div>
      ) : null}

      {summary.settlementLinks.length ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs font-semibold text-ink">Tool purchase settlements</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.settlementLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="op-btn-secondary min-w-0 text-xs"
              >
                <span className="truncate">{link.label}</span>
                <IconArrowUpRight className="h-3.5 w-3.5 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-3 border-t border-line pt-4">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            revoked ? "bg-verify text-white" : "bg-paper2 text-muted"
          }`}
        >
          {revoked ? <IconCheck className="h-4 w-4" /> : <IconShield className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {revoked ? "Budget revoked" : "Budget remains revocable"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {revoked
              ? revokeProof?.message ?? "The mined revoke disarmed this permission on-chain."
              : "The owner can disarm this permission at any time. Use Revoke budget below to prove the kill switch."}
          </p>
        </div>
      </div>

      {receiptHref || revokeTxUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {receiptHref ? (
            <a href={receiptHref} className="op-btn-primary text-xs">
              <IconReceipt className="h-4 w-4" /> View Proof Receipt
            </a>
          ) : null}
          {revokeTxUrl ? (
            <a href={revokeTxUrl} target="_blank" rel="noreferrer" className="op-btn-secondary text-xs">
              Revoke transaction <IconArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {receiptHref ? (
            <p className="basis-full text-[11px] leading-relaxed text-faint">
              The receipt is the separate canonical Particle UA checkout proof; the tool purchases
              and funding evidence above remain linked to this agent run.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
