import { ConceptTag } from "@/components/ui";
import { COMPARISON } from "@/lib/positioning/landscape";

/**
 * A fair "different approach" comparison vs the current giants. Not "they're worse" — a different
 * approach (non-custodial, on-chain enforcement on the user's own account, public proof). Rows
 * tagged `directional` show a chip so they are never read as a shipped integration. Server component.
 */
export function RailComparison() {
  return (
    <section className="op-card p-6 sm:p-7">
      <span className="op-eyebrow">A different approach</span>
      <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Vs the giants</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Not &ldquo;they&rsquo;re worse&rdquo; — a different shape: non-custodial, on-chain
        enforcement on your own account, with a publicly verifiable proof.
      </p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper2 text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Player</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Their approach</th>
              <th className="px-4 py-2.5 font-semibold">Where OneLink differs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {COMPARISON.map((row) => (
              <tr key={row.player} className="align-top">
                <td className="px-4 py-3 font-medium text-ink">
                  {row.player}
                  {row.kind === "directional" ? (
                    <span className="mt-1 block">
                      <ConceptTag>directional</ConceptTag>
                    </span>
                  ) : null}
                </td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{row.approach}</td>
                <td className="px-4 py-3 text-ink2">{row.ours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        &ldquo;Built&rdquo; rows are live today and map to our honest-claim ledger. The
        &ldquo;directional&rdquo; row is a design direction, not a shipped integration.
      </p>
    </section>
  );
}
