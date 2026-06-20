import Link from "next/link";
import { DEMO_REPLAY_PAYMENT_LINK } from "@/lib/demo/replay";
import { getActivePaymentChain, getConfiguredPaymentMode } from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import {
  Wordmark,
  Chip,
  ConceptTag,
  Dot,
  IconShield,
  IconReceipt,
  IconLock,
  IconArrowUpRight,
  IconCheck,
} from "@/components/ui";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

function demoAmountLabel() {
  const token = resolvePaymentToken(
    DEMO_REPLAY_PAYMENT_LINK.token,
    DEMO_REPLAY_PAYMENT_LINK.destination_chain_id,
  );
  return `${formatAtomicTokenAmount(DEMO_REPLAY_PAYMENT_LINK.amount, token)} ${token.symbol}`;
}

export default function HomePage() {
  const amount = demoAmountLabel();

  return (
    <main className="op-shell">
      <div className="mx-auto max-w-6xl px-5 pb-20">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <Wordmark />
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/demo-replay" className="op-btn-ghost px-3 py-2">
              Demo
            </Link>
            <Link href="/dashboard" className="op-btn-ghost px-3 py-2">
              Merchant
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <div className="op-animate-rise">
            <span className="op-eyebrow">A consent &amp; proof layer for Universal Accounts</span>
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.01em] text-ink sm:text-6xl">
              Trust before you pay.
              <br />
              <span className="text-gold">Proof</span> after it settles.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink2">
              OneLink Pay shows you exactly what you are approving before a payment, then hands
              back a verifiable on-chain receipt the moment it settles. One link, one clear
              outcome.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo-replay" className="op-btn-primary">
                Open demo replay
                <IconArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`} className="op-btn-secondary">
                View a proof receipt
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-verify" /> Real USDC settlement on {ACTIVE_CHAIN.name}
              </span>
              <span className="inline-flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-verify" /> On-chain receipt proof
              </span>
            </div>
          </div>

          {/* Product peek: a Trust Preview card */}
          <div className="op-animate-rise lg:justify-self-end">
            <PreviewPeek amount={amount} />
          </div>
        </section>

        {/* Three pillars */}
        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-ink">Three moments that build trust</h2>
            <span className="hidden text-sm text-muted sm:block">Before · After · Next</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Pillar
              icon={<IconShield className="h-5 w-5" />}
              eyebrow="Before payment"
              title="Trust Preview"
              body="See who receives the money, on which chain, in what mode, and how proof will be recorded — before you ever confirm."
            />
            <Pillar
              icon={<IconReceipt className="h-5 w-5" />}
              eyebrow="After settlement"
              title="Proof Receipt"
              body="A shareable, verified certificate links the payment transaction and the on-chain proof for the exact invoice."
            />
            <Pillar
              icon={<IconLock className="h-5 w-5" />}
              eyebrow="Before future automation"
              title="Permission Firewall"
              tag={<ConceptTag />}
              body="A preview of scoped spend caps for recurring payments. Shown as a concept — not live session keys in this build."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="mt-20 op-card p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">How a payment flows</h2>
            <div className="flex flex-wrap gap-2">
              <Chip>
                mode <span className="ml-1 font-mono text-ink">{PAYMENT_MODE}</span>
              </Chip>
              <Chip>
                chain <span className="ml-1 font-mono text-ink">{ACTIVE_CHAIN.name}</span>
              </Chip>
            </div>
          </div>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { t: "Sign in", d: "Email login with Magic — no seed phrase or extension." },
              { t: "Universal Account", d: "Particle builds a human-readable preview of the transfer." },
              { t: "USDC settles", d: `Merchant receives USDC on ${ACTIVE_CHAIN.name}.` },
              { t: "Server verifies", d: "Backend matches the Transfer to the invoice amount." },
              { t: "Proof recorded", d: "ReceiptEmitter writes an InvoicePaid proof on-chain." },
            ].map((step, i) => (
              <li key={step.t} className="op-card-quiet p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-semibold text-cream">
                  {i + 1}
                </span>
                <p className="mt-3 font-semibold text-ink">{step.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            The strict <span className="font-mono text-ink2">approve + payInvoice</span> universal
            transaction path stays available behind{" "}
            <span className="font-mono text-ink2">universal_invoice</span> while Particle custom
            universal calls return maintenance errors.
          </p>
        </section>

        {/* Honest scope footer */}
        <footer className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <p className="max-w-xl sm:text-right">
            Honest scope: no live cross-chain routing, no real session keys, and no gas sponsorship
            are claimed here. Spend caps and the Permission Firewall are concept previews.
          </p>
        </footer>
      </div>
    </main>
  );
}

function PreviewPeek({ amount }: { amount: string }) {
  return (
    <div className="w-full max-w-sm op-card p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <span className="op-eyebrow">Trust Preview</span>
        <Chip tone="gold">
          <IconShield className="h-3.5 w-3.5" /> Consent
        </Chip>
      </div>

      <div className="mt-5 rounded-2xl bg-paper2 p-4 text-center">
        <p className="text-xs text-muted">You pay</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink tnum">{amount}</p>
      </div>

      <dl className="mt-4 divide-y divide-line">
        <Row label="Merchant receives" value={`${amount} on Base`} />
        <Row label="Active chain" value="Base" />
        <Row label="Payment mode" value="transfer_fallback" mono />
        <Row label="Proof" value="On-chain receipt" />
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted">Spend caps</span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Off</span>
            <ConceptTag />
          </span>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-verify-soft px-3.5 py-2.5 text-sm font-medium text-verify">
        <Dot tone="verify" /> Reviewed before you confirm
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className={mono ? "font-mono text-xs text-ink2" : "text-sm font-medium text-ink"}>{value}</span>
    </div>
  );
}

function Pillar({
  icon,
  eyebrow,
  title,
  body,
  tag,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  tag?: React.ReactNode;
}) {
  return (
    <div className="op-card flex h-full flex-col p-6 transition-shadow hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-gold">
          {icon}
        </span>
        {tag}
      </div>
      <span className="mt-5 op-eyebrow">{eyebrow}</span>
      <h3 className="mt-1.5 font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
