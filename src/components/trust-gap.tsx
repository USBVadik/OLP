import { IconArrowUpRight } from "@/components/ui";
import { TRUST_STATS, TRUST_TAKEAWAY } from "@/lib/positioning/landscape";

/**
 * The trust gap we close: third-party consumer-research data points. Each stat renders with its
 * source, link, and an "external research" caption so it is never read as OneLink's own metric.
 * The closing takeaway is OUR framing, styled distinctly from the data. Server component.
 */
export function TrustGap() {
  return (
    <section className="op-card p-6 sm:p-7">
      <span className="op-eyebrow">The trust gap we close</span>
      <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Why trust is the bottleneck</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        The agent economy isn&rsquo;t short of rails — it&rsquo;s short of trust. Independent
        research, not our numbers:
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TRUST_STATS.map((s) => (
          <div key={s.url} className="op-card-quiet flex flex-col p-4">
            <p className="text-sm font-medium leading-relaxed text-ink">{s.stat}</p>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex items-center gap-1 pt-3 text-xs text-muted underline-offset-2 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {s.source} · external research · {s.asOf}
              <IconArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3 text-sm font-semibold text-ink">
        {TRUST_TAKEAWAY}
      </p>
    </section>
  );
}
