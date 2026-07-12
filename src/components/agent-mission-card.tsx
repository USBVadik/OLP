import { formatMerchant, formatShortDate, formatUsdcAmount } from "@/lib/mandates/format";
import { type PaymentMandate } from "@/lib/mandates/types";
import { RESEARCH_MISSION } from "@/lib/agent/research-task";
import { Chip, IconBolt, IconCheck, IconLock, IconShield } from "@/components/ui";

type Props = {
  mandate: PaymentMandate;
  running: boolean;
  onRun: () => void;
  /** When true (e.g. after revoke), disable Run without showing the "preparing" label. */
  disabled?: boolean;
};

export function AgentMissionCard({ mandate, running, onRun, disabled = false }: Props) {
  return (
    <section aria-labelledby="research-mission-title" className="rounded-2xl border border-gold/25 bg-paper p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="op-eyebrow">Research task</p>
        <Chip>
          <IconBolt className="h-3 w-3 text-gold" /> Deterministic workflow
        </Chip>
      </div>

      <h2 id="research-mission-title" className="mt-2 font-display text-xl font-semibold text-ink">
        {RESEARCH_MISSION.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Buy the two inputs needed for the brief. Then a deterministic adversarial fixture requests
        an unnecessary export, testing whether the signed card contains workflow overreach.
      </p>

      <div className="mt-4 border-y border-line py-1">
        <MissionRow label="Per tool" value={formatUsdcAmount(mandate.maxPerCharge)} />
        <MissionRow label="Daily budget" value={formatUsdcAmount(mandate.maxPerDay)} />
        <MissionRow label="Provider scope" value={formatMerchant(mandate.merchant)} mono />
        <MissionRow label="Permission ends" value={formatShortDate(mandate.expiry)} />
      </div>

      <div className="mt-4 border-l-2 border-danger/55 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">
          {RESEARCH_MISSION.adversarialFixture.label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink2">
          “{RESEARCH_MISSION.adversarialFixture.instruction}”
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Injected deterministic fixture · no LLM reasoning or wallet key.
        </p>
      </div>

      <ul className="mt-4 grid gap-2 text-xs text-ink2 sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <IconCheck className="h-4 w-4 shrink-0 text-verify" /> Only this provider can receive funds
        </li>
        <li className="flex items-center gap-2">
          <IconLock className="h-4 w-4 shrink-0 text-verify" /> Permission remains revocable
        </li>
      </ul>

      <button
        type="button"
        onClick={onRun}
        disabled={running || disabled}
        className="op-btn-primary mt-5 w-full justify-center"
      >
        {running ? (
          "Preparing the brief..."
        ) : (
          <>
            <IconShield className="h-4 w-4" /> Run task + safety test
          </>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-faint">
        This unattended demo follows a fixed resource plan. It does not use an LLM or hold a full
        wallet key.
      </p>
    </section>
  );
}

function MissionRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={mono ? "font-mono text-xs font-medium text-ink" : "font-medium text-ink"}>
        {value}
      </span>
    </div>
  );
}
