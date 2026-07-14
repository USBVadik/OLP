import type { ReactNode } from "react";
import {
  Chip,
  Disclosure,
  Field,
  TxReference,
  VerifiedSeal,
  IconCheck,
  IconShield,
  IconReceipt,
} from "@/components/ui";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { CopyValue } from "@/components/copy-value";
import { ParticleActivityProof } from "@/components/particle-activity-proof";

export interface ProofReceiptCardProps {
  amountLabel: string;
  merchant: string;
  invoiceId: string | null;
  mode?: string;
  settlementChainName: string;
  proofChainName: string;
  isCrossChain?: boolean;
  /** Settlement (value) transaction — the "verified" leg. */
  payment: { hash: string | null; href: string | null };
  /** InvoicePaid proof transaction — the "recorded" leg. */
  proof: { hash: string | null; href: string | null };
  /**
   * Universal Account cross-chain activity on UniversalX. Only present on the UA/7702 path,
   * where `ua.sendTransaction` returns a transactionId that spans the whole cross-chain
   * orchestration. Rendered alongside the settlement leg when an id is available.
   */
  universalActivity?: { id: string | null; href: string | null; verified?: boolean };
  /**
   * Cross-chain funding summary. When the payment was SOURCED from chain(s) other than the
   * settlement chain, this surfaces the "no manual bridge" story (Particle UA chain abstraction).
   * Omit/null for a same-chain payment.
   */
  crossChain?: { fromNames: string[]; toName: string; verified?: boolean; sourceLegs?: { name: string; href: string }[] } | null;
  /** Override the "matched" leg detail line. */
  matchedDetail?: string;
  /** ISO timestamp the payment settled — rendered as the certificate date. */
  settledAt?: string | null;
}

function Leg({
  index,
  done,
  icon,
  title,
  detail,
  children,
}: {
  index: number;
  done: boolean;
  icon: ReactNode;
  title: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            done ? "border-verify/30 bg-verify-soft text-verify" : "border-line bg-paper2 text-faint",
          ].join(" ")}
          aria-hidden="true"
        >
          {done ? icon : <span className="text-xs font-semibold">{index}</span>}
        </span>
        <span className="mt-1 w-px flex-1 bg-line last:hidden" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</p>
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </li>
  );
}

/** Format the settlement timestamp as a stable UTC certificate date, e.g. "6 Jul 2026, 13:41 UTC". */
function formatSettled(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(d);
  return `${date} UTC`;
}

export function ProofReceiptCard({
  amountLabel,
  merchant,
  invoiceId,
  mode,
  settlementChainName,
  proofChainName,
  isCrossChain = false,
  payment,
  proof,
  universalActivity,
  crossChain,
  matchedDetail,
  settledAt,
}: ProofReceiptCardProps) {
  const recorded = Boolean(proof.hash);
  const verified = Boolean(payment.hash);
  const settledLabel = formatSettled(settledAt);

  return (
    <article className="op-card overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft" aria-hidden="true" />

      <div className="px-6 pt-8 text-center sm:px-8">
        <p className="op-eyebrow">Proof Receipt</p>
        <div className="mt-5">
          <VerifiedSeal animate />
        </div>
        <p className="mt-5 text-sm text-muted">Paid &amp; verified</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink tnum">{amountLabel}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Chip tone="verify">
            <IconCheck className="h-3.5 w-3.5" /> Settled on {settlementChainName}
          </Chip>
          {crossChain && crossChain.fromNames.length ? (
            <Chip tone="gold">Cross-chain: {crossChain.fromNames.join(" + ")} &rarr; {crossChain.toName}</Chip>
          ) : null}
          {isCrossChain ? <Chip tone="gold">Proof anchored on {proofChainName}</Chip> : null}
        </div>
      </div>

      <ParticleActivityProof
        activityId={universalActivity?.id}
        href={universalActivity?.href}
        sourceNames={crossChain?.fromNames}
        settlementName={settlementChainName}
        verified={universalActivity?.verified}
      />

      {crossChain && crossChain.fromNames.length ? (
        <div className="px-6 pt-6 sm:px-8">
          <CrossChainRoute
            status="settled"
            fromNames={crossChain.fromNames}
            toName={crossChain.toName}
            amountLabel={amountLabel}
            verified={crossChain.verified}
            sourceLegs={crossChain.sourceLegs}
          />
        </div>
      ) : null}

      {/* Verification trail */}
      <div className="px-6 pb-2 pt-7 sm:px-8">
        <p className="op-eyebrow">Verification trail</p>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-muted">
          The payment and proof links open independent block explorers — verify them yourself, no
          account needed. The Particle activity above shows the complete UA orchestration and may
          require a UniversalX sign-in.
        </p>
        <ol className="ml-0.5">
          <Leg
            index={1}
            done={verified}
            icon={<IconCheck className="h-4 w-4" />}
            title="Verified"
            detail={`USDC settled to the merchant on ${settlementChainName}.`}
          >
            <div className="space-y-2">
              <TxReference label={`Payment · ${settlementChainName}`} hash={payment.hash} href={payment.href} />
            </div>
          </Leg>
          <Leg
            index={2}
            done={verified}
            icon={<IconShield className="h-4 w-4" />}
            title="Matched consent"
            detail={matchedDetail ?? `${amountLabel}, token and recipient matched exactly what you approved.`}
          />
          <Leg
            index={3}
            done={recorded}
            icon={<IconReceipt className="h-4 w-4" />}
            title="Recorded"
            detail={`An InvoicePaid proof was anchored on ${proofChainName}.`}
          >
            <TxReference label={`Proof · ${proofChainName}`} hash={proof.hash} href={proof.href} />
          </Leg>
        </ol>
      </div>

      <div className="px-6 pb-6 sm:px-8">
        <dl className="divide-y divide-line border-t border-line">
          <Field label="Merchant" value={<CopyValue value={merchant} />} />
          {invoiceId ? <Field label="Invoice ID" value={<CopyValue value={invoiceId} />} /> : null}
          {settledLabel ? <Field label="Settled" value={settledLabel} /> : null}
          {mode ? <Field label="Payment mode" value={mode} /> : null}
          {isCrossChain ? (
            <Field label="Proof anchor" value={`${proofChainName}`} />
          ) : null}
        </dl>
      </div>
    </article>
  );
}

/**
 * Honest, judge-facing explanation of the two-layer trust model behind a proof receipt.
 * Addresses the "receipt looks centralized" risk (R8) by stating exactly what is trustless
 * and what is attested: the settlement is independently verifiable on-chain by anyone, and
 * the InvoicePaid record is an on-chain ATTESTATION re-checked by OneLink — not an oracle
 * "source of truth." Native <details>, no client JS.
 */
export function VerificationMethod({
  amountLabel,
  settlementChainName,
  proofChainName,
}: {
  amountLabel: string;
  settlementChainName: string;
  proofChainName: string;
}) {
  return (
    <Disclosure summary="How is this verified?">
      <div className="space-y-3 text-sm leading-relaxed text-ink2">
        <p>
          <span className="font-semibold text-ink">Settlement — trustless.</span> The USDC moved on{" "}
          {settlementChainName}. Open the payment transaction on the block explorer and confirm the
          merchant received exactly {amountLabel}. You never have to trust OneLink for this part.
        </p>
        <p>
          <span className="font-semibold text-ink">Proof — an attestation, not an oracle.</span> The
          InvoicePaid record on {proofChainName} is written by OneLink&rsquo;s server only after it
          re-reads the settlement transaction and checks the recipient and amount against this
          invoice. Because the settlement underneath is public, you can re-verify the attestation
          yourself — it adds a signed, on-chain trail; it is not the source of truth.
        </p>
        <p className="text-muted">The matching logic is open-source in the OneLink Pay repository.</p>
      </div>
    </Disclosure>
  );
}
