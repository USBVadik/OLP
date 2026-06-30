import { Chip } from "@/components/ui";
import { STACK_2026 } from "@/lib/positioning/landscape";

/**
 * Where OneLink sits in the 2026 agentic-payments stack: authorization → checkout → settlement →
 * enforcement & proof (ours, highlighted). Server component, no client JS.
 */
export function EcosystemStack() {
  return (
    <section className="op-card p-6 sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-ink">Where OneLink fits the 2026 stack</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        We don&rsquo;t replace the rails — we&rsquo;re the consent, on-chain enforcement, and proof
        layer on top of any of them.
      </p>
      <ol className="mt-5 space-y-2">
        {STACK_2026.map((layer) => (
          <li
            key={layer.layer}
            className={[
              "flex flex-col gap-1.5 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
              layer.isOurs ? "border-iris/30 bg-iris-soft/50" : "border-line bg-paper2",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <span className={`font-semibold ${layer.isOurs ? "text-iris-ink" : "text-ink"}`}>
                {layer.layer}
              </span>
              {layer.isOurs ? <Chip tone="gold">You are here</Chip> : null}
            </span>
            <span className="text-sm leading-relaxed text-muted sm:text-right">{layer.examples}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
