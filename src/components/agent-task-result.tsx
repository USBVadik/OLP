import { formatUsdcAmount } from "@/lib/mandates/format";
import { type ResearchTaskSummary } from "@/lib/agent/research-task";
import {
  Chip,
  IconArrowUpRight,
  IconBan,
  IconCheck,
  IconReceipt,
  IconShield,
} from "@/components/ui";

type Props = {
  summary: ResearchTaskSummary;
};

export function AgentTaskResult({ summary }: Props) {
  if (summary.status === "idle") return null;

  const complete = summary.status === "complete" && summary.brief;

  return (
    <section
      aria-live="polite"
      aria-labelledby="research-result-title"
      className={`rounded-2xl border p-4 sm:p-5 ${
        complete ? "border-verify/30 bg-verify-soft/45" : "border-gold/30 bg-gold-soft/35"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          {complete ? (
            <IconReceipt className="h-4 w-4 text-verify" />
          ) : (
            <IconBan className="h-4 w-4 text-gold" />
          )}
          Task result
        </p>
        <Chip tone={complete ? "verify" : "gold"}>
          {complete ? (
            <>
              <IconCheck className="h-3 w-3" /> Brief ready
            </>
          ) : (
            "Incomplete"
          )}
        </Chip>
      </div>

      {complete ? (
        <div className="mt-4">
          <h2 id="research-result-title" className="font-display text-xl font-semibold text-ink">
            {summary.brief?.headline}
          </h2>
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
      ) : (
        <div className="mt-4">
          <h2 id="research-result-title" className="font-display text-lg font-semibold text-ink">
            The brief could not be completed
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Required data was not delivered: {summary.missingRequiredResources.join(", ") || "unknown input"}.
            Check technical activity before retrying.
          </p>
        </div>
      )}

      <dl className="mt-5 divide-y divide-line border-y border-line">
        <ResultRow
          label="Useful data purchased"
          value={formatUsdcAmount(summary.spentAtomic)}
          detail={`${summary.purchasedCount} required input${summary.purchasedCount === 1 ? "" : "s"}`}
        />
        <ResultRow
          label="Unexpected spend blocked"
          value={formatUsdcAmount(summary.protectedAtomic)}
          detail={
            summary.blockedCount > 0
              ? "Premium export refused before settlement"
              : "No policy block recorded"
          }
          protectedValue={summary.blockedCount > 0}
        />
        <ResultRow
          label="Daily budget remaining"
          value={formatUsdcAmount(summary.remainingDailyAtomic)}
          detail="Available under this signed permission"
        />
      </dl>

      {summary.errorCount > 0 || summary.withheldCount > 0 ? (
        <p className="mt-3 rounded-xl border border-gold/25 bg-paper/70 px-3 py-2 text-xs leading-relaxed text-muted">
          {summary.errorCount + summary.withheldCount} infrastructure or delivery issue
          {summary.errorCount + summary.withheldCount === 1 ? " was" : "s were"} recorded separately.
          They are not counted as protected spend.
        </p>
      ) : null}

      {summary.settlementLinks.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Settlement evidence
          </p>
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
    </section>
  );
}

function ResultRow({
  label,
  value,
  detail,
  protectedValue = false,
}: {
  label: string;
  value: string;
  detail: string;
  protectedValue?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
      <div>
        <dt className="text-sm font-medium text-ink">{label}</dt>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
      <dd className={`font-mono text-sm font-semibold ${protectedValue ? "text-verify" : "text-ink"}`}>
        {protectedValue ? (
          <span className="inline-flex items-center gap-1.5">
            <IconShield className="h-4 w-4" /> {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
