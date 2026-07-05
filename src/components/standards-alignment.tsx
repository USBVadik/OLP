import { Chip, ConceptTag, IconArrowUpRight } from "@/components/ui";
import { STANDARDS } from "@/lib/positioning/landscape";

/**
 * Standards-alignment block for /trust. Shows that the Ethereum ecosystem is now drafting the exact
 * shape OneLink already ships (bounded, revocable, code-enforced agent spend), and that our proof
 * receipt complements ERC-8004 agent identity/reputation. Honesty: `relation` is only
 * "aligned" | "complements" — never "implements"; the caption states we ship our own SpendPolicy,
 * not any draft ERC. Every entry carries a source link (guarded by landscape.test.ts). Server
 * component, no client JS.
 */
export function StandardsAlignment() {
  const linkCls =
    "inline-flex items-center gap-1 text-xs text-muted underline-offset-2 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";
  return (
    <section className="op-card p-6 sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-ink">Built for the emerging standards</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        The Ethereum community is now drafting the exact shape OneLink already ships — bounded,
        revocable, code-enforced agent spend. We&rsquo;re a working implementation of that idea today
        (our own SpendPolicy, live on Base + Arbitrum), aligned with the vocabulary — not an
        implementation of any single draft ERC.
      </p>
      <ul className="mt-5 space-y-3">
        {STANDARDS.map((s) => (
          <li key={s.url} className="op-card-quiet p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">{s.name}</span>
              <ConceptTag>{s.status}</ConceptTag>
              {s.relation === "aligned" ? (
                <Chip tone="gold">aligned</Chip>
              ) : (
                <Chip tone="verify">complements</Chip>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.what}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink2">{s.ours}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href={s.url} target="_blank" rel="noreferrer" className={linkCls}>
                {s.source} · emerging standard · {s.asOf}
                <IconArrowUpRight className="h-3 w-3" />
              </a>
              {s.study ? (
                <a href={s.study.url} target="_blank" rel="noreferrer" className={linkCls}>
                  {s.study.source}
                  <IconArrowUpRight className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        &ldquo;Aligned&rdquo; means the same shape as our live on-chain mandate; &ldquo;complements&rdquo;
        means it solves a different problem — agent identity/reputation — that our proof receipt sits
        beside. OneLink implements its own SpendPolicy contract, not these drafts.
      </p>
    </section>
  );
}
