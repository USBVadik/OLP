import { computeMandateId } from "@/lib/mandates/mandate";
import { describePermission } from "@/lib/mandates/permission";
import { type PaymentMandate } from "@/lib/mandates/types";
import { Chip, Dot, IconCheck, IconReceipt } from "@/components/ui";

type Props = {
  /** The signed, armed mandate this receipt certifies. */
  mandate: PaymentMandate;
  /** True once the mandate has been revoked on-chain. */
  revoked?: boolean;
};

/**
 * Permission Receipt — the post-sign consent certificate for an armed mandate. It is the
 * authorization-time analog of the post-settlement Proof Receipt: a legible, honest record of
 * exactly what the payer granted (merchant, per-action, daily/total caps, expiry, revocability)
 * plus the Permission ID (EIP-712 digest) for verification.
 *
 * Honest by construction: it renders the mandate's real values via `describePermission`, and the
 * footer states plainly that this is a bounded pull-charge permission — NOT autopay: nothing
 * charges on its own, every pull is checked on-chain, and anything over the limits reverts.
 */
export function PermissionReceipt({ mandate, revoked = false }: Props) {
  const p = describePermission(mandate);
  const permissionId = computeMandateId(mandate);
  const inert = revoked || p.expired;

  return (
    <section
      aria-label="Permission Receipt"
      className={`rounded-2xl border p-4 ${
        inert ? "border-line bg-paper2 text-ink2" : "border-verify/30 bg-verify-soft/50 text-ink"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconReceipt className="h-4 w-4 text-gold" /> Permission Receipt
        </p>
        {revoked ? (
          <Chip>Revoked</Chip>
        ) : p.expired ? (
          <Chip>Expired</Chip>
        ) : (
          <Chip tone="verify">
            <IconCheck className="h-3 w-3" /> Granted
          </Chip>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Signed &amp; on-chain — the exact spending permission you granted.
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label="Merchant (only recipient)">
          <span className="font-mono text-ink">{p.merchant}</span>
        </Row>
        <Row label="Per action">
          <span className="font-medium text-ink">up to {p.perAction}</span>
        </Row>
        <Row label="Daily limit">{p.daily ?? "No daily limit"}</Row>
        <Row label="Total cap">{p.total}</Row>
        <Row label="Expires">{p.expiry}</Row>
        <Row label="Revoke">Anytime</Row>
      </dl>

      <p className="mt-3 font-mono text-[11px] text-faint">Permission ID {permissionId.slice(0, 18)}&hellip;</p>

      <p className="mt-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-muted">
        A signed spending permission: a merchant or agent can pull charges only within these caps,
        only to this merchant, until it expires or you revoke. It is not autopay &mdash; nothing
        charges on its own; every pull is checked on-chain, and anything over the limits reverts.
      </p>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted">
        <Dot tone="gold" /> {label}
      </dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
