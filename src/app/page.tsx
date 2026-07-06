import Link from "next/link";
import { DEMO_REPLAY_PAYMENT_LINK } from "@/lib/demo/replay";
import { getConfiguredPaymentMode, getPaymentModeLabel } from "@/lib/config/payment";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import {
  Wordmark,
  Chip,
  IconShield,
  IconReceipt,
  IconLock,
  IconArrowUpRight,
  IconCheck,
  Term,
} from "@/components/ui";
import { ParticleField } from "@/components/particle-field";
import { CustomCursor } from "@/components/custom-cursor";
import { Magnetic } from "@/components/magnetic";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Reveal } from "@/components/reveal";
import { ScrollNarrative } from "@/components/scroll-narrative";
import { CrossChainRoute } from "@/components/cross-chain-route";

const PAYMENT_MODE = getConfiguredPaymentMode();
const PAYMENT_MODE_LABEL = getPaymentModeLabel(PAYMENT_MODE);

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
      <SmoothScroll />
      <CustomCursor />
      <div className="op-grain" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-y-2 py-6">
          <Wordmark href="/" />
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link href="/pitch" className="op-btn-ghost px-3 py-2.5">
              Pitch
            </Link>
            <Link href="/firewall" className="op-btn-ghost px-3 py-2.5">
              Firewall
            </Link>
            <Link href="/agent" className="op-btn-ghost px-3 py-2.5">
              Agent
            </Link>
            <Link href="/wallet" className="op-btn-ghost px-3 py-2.5">
              Wallet
            </Link>
            <Link href="/demo-replay" className="op-btn-ghost px-3 py-2.5">
              Demo
            </Link>
            <Link href="/dashboard" className="op-btn-ghost px-3 py-2.5">
              Merchant
            </Link>
            <Link href="/trust" className="op-btn-ghost px-3 py-2.5">
              What&rsquo;s real
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative pt-10 lg:pt-16">
          <div
            className="pointer-events-none absolute -inset-x-10 -top-28 bottom-0 overflow-hidden"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fx/aurora.webp" alt="" className="h-full w-full object-cover opacity-[0.6]" />
          </div>
          <ParticleField density={1.15} />
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
            <span
              className="op-eyebrow op-animate-rise inline-flex items-center gap-2"
              style={{ animationDelay: "60ms" }}
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verify" />
              </span>
              On-chain spending limits for the agent era
            </span>
            <h1
              className="op-animate-rise mt-4 font-display text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.02em] text-ink sm:text-[4.75rem]"
              style={{ animationDelay: "140ms" }}
            >
              Give your AI a card.
              <br />
              <span className="relative inline-block text-gold">
                Not your wallet.
                <span
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-gold to-iris animate-draw-line"
                  aria-hidden="true"
                />
              </span>
            </h1>
            <p
              className="op-animate-rise mt-5 max-w-xl text-lg leading-relaxed text-ink2"
              style={{ animationDelay: "240ms" }}
            >
              Sign one scoped mandate. Your AI agent (or a merchant) can spend USDC only inside the
              per-charge, daily, and total caps you set — over-cap charges revert on-chain at zero
              gas, and every payment ships a verifiable proof receipt.
            </p>

            <p
              className="op-animate-rise mt-3 max-w-xl text-sm leading-relaxed text-muted"
              style={{ animationDelay: "290ms" }}
            >
              In plain words: it&rsquo;s a debit card with a built-in limit — but for your apps and
              AI agents, and the limit is enforced on-chain, not by trust.
            </p>

            <div
              className="op-animate-rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "340ms" }}
            >
              <Magnetic>
                <Link href="/firewall" className="op-btn-primary">
                  Try the live firewall
                  <IconArrowUpRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/agent" className="op-btn-secondary">
                  See the agent demo
                </Link>
              </Magnetic>
              <Link href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`} className="op-btn-ghost">
                View a proof receipt
              </Link>
            </div>

            <p
              className="op-animate-rise mt-3 max-w-xl text-xs leading-relaxed text-muted"
              style={{ animationDelay: "360ms" }}
            >
              The live buttons run on our funded demo account. Exploring on your own?{" "}
              <Link href="/demo-replay" className="op-link">Watch the 90-second replay</Link> — no
              wallet needed.
            </p>
            <p
              className="op-animate-rise mt-4 max-w-xl text-sm leading-relaxed text-muted"
              style={{ animationDelay: "400ms" }}
            >
              <span className="font-semibold text-ink2">The 90-second path:</span> arm an agent
              budget, clear one charge, watch an over-cap charge get blocked on-chain, revoke in one
              click, then open the proof receipt.
            </p>

            <div
              className="op-animate-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"
              style={{ animationDelay: "480ms" }}
            >
              <span className="inline-flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-verify" /> Live on Base + Arbitrum
              </span>
              <span className="inline-flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-verify" /> EIP-712 mandates · enforced by SpendPolicy
              </span>
              <span className="inline-flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-verify" /> On-chain proof receipts
              </span>
            </div>
          </div>

          {/* Product peek: a Trust Preview card */}
          <div
            className="op-animate-rise lg:justify-self-end"
            style={{ animationDelay: "320ms" }}
          >
            <div className="animate-float-y">
              <PreviewPeek amount={amount} />
            </div>
          </div>
          </div>
        </section>

      </div>

      {/* Signature scroll narrative: "Bounded autonomy" — full-bleed cinematic chapter */}
      <ScrollNarrative />

      <div className="mx-auto max-w-6xl px-5 pb-20">
        {/* Three pillars */}
        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-ink">Three moments that build trust</h2>
            <span className="hidden text-sm text-muted sm:block">Before · After · Next</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Reveal delay={0}>
              <Pillar
                icon={<IconShield className="h-5 w-5" />}
                eyebrow="Before payment"
                title="Trust Preview"
                body="See who receives the money, on which chain, in what mode, and how proof will be recorded — before you ever confirm."
              />
            </Reveal>
            <Reveal delay={90}>
              <Pillar
                icon={<IconReceipt className="h-5 w-5" />}
                eyebrow="After settlement"
                title="Proof Receipt"
                body="A shareable, verified certificate links the payment transaction and the on-chain proof for the exact invoice."
              />
            </Reveal>
            <Reveal delay={180}>
              <Pillar
                icon={<IconLock className="h-5 w-5" />}
                eyebrow="While agents run"
                title="Permission Firewall"
                body="Scoped mandates with per-charge, daily, and total caps + expiry, enforced on-chain by SpendPolicy. Sign once; over-cap charges revert at zero gas. Revoke anytime."
              />
            </Reveal>
          </div>
        </section>

        {/* Built for the agent economy + prior art */}
        <Reveal>
          <AgentEconomySection />
        </Reveal>

        {/* Sponsor strip */}
        <Reveal>
          <SponsorStrip />
        </Reveal>

        {/* How it works */}
        <section className="mt-20 op-card p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">How a payment flows</h2>
            <div className="flex flex-wrap gap-2">
              <Chip>
                mode <span className="ml-1 font-medium text-ink">{PAYMENT_MODE_LABEL}</span>
              </Chip>
              <Chip>
                settles on <span className="ml-1 font-medium text-ink">Arbitrum + Base</span>
              </Chip>
            </div>
          </div>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { t: "Sign in", d: "Email or Google login with Magic — no seed phrase or extension." },
              { t: "Universal Account", d: "Particle builds a human-readable preview of the transfer." },
              { t: "USDC settles", d: "Merchant receives USDC on Arbitrum or Base." },
              { t: "Server verifies", d: "Backend matches the Transfer to the invoice amount." },
              { t: "Proof recorded", d: "ReceiptEmitter writes an InvoicePaid proof on-chain." },
            ].map((step, i) => (
              <Reveal as="li" key={step.t} delay={i * 70}>
                <div className="op-card-quiet h-full p-4 transition-colors duration-300 hover:border-gold/40 hover:bg-paper">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-semibold text-cream">
                    {i + 1}
                  </span>
                  <p className="mt-3 font-semibold text-ink">{step.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <div className="mt-7 grid items-center gap-5 rounded-2xl border border-line bg-paper2 p-5 lg:grid-cols-[1fr_1.05fr]">
              <div>
                <span className="op-chip-gold">
                  <IconCheck className="h-3.5 w-3.5" /> Proven live · Base &rarr; Arbitrum
                </span>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Funds are sourced from any chain where you hold USDC and settled where the merchant
                  wants — the Universal Account routes it in one operation, with no manual bridge and
                  the network fee paid in USDC. This is the exact cross-chain flow we proved on-chain.
                </p>
              </div>
              <CrossChainRoute status="settled" fromNames={["Base"]} toName="Arbitrum" amountLabel="1.00 USDC" />
            </div>
          </Reveal>
        </section>

        {/* Honest scope footer */}
        <footer className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Wordmark href="/" />
          <div className="max-w-xl sm:text-right">
            <p>
              Honest scope: the on-chain firewall (SpendPolicy) is live on Base + Arbitrum and
              tested (22 contract tests). Same-chain checkout is proven end-to-end, and cross-chain
              value movement via Universal Accounts is proven live — no manual bridge. The x402 flow
              is the pattern (mandate-settled); the one-time 7702 delegation is relayer-sponsored
              (zero-gas onboarding), while no general settlement paymaster is claimed.
            </p>
            <Link
              href="/trust"
              className="mt-2 inline-flex items-center gap-1 font-medium text-ink2 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              See exactly what&rsquo;s real &rarr;
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function PreviewPeek({ amount }: { amount: string }) {
  return (
    <div className="w-full max-w-sm op-card p-6 shadow-[0_24px_48px_-24px_rgba(35,32,27,0.28),0_0_72px_-20px_rgba(110,86,240,0.40)] transition-shadow duration-500 hover:shadow-[0_24px_60px_-24px_rgba(35,32,27,0.32),0_0_92px_-16px_rgba(110,86,240,0.55)]">
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
        <Row label="Merchant receives" value={amount} />
        <Row label="Settles on" value="Arbitrum + Base" />
        <Row label="Funding" value="Cross-chain · no bridge" />
        <Row label="Proof" value="On-chain receipt" />
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted">Spend mandate</span>
          <span className="text-sm font-medium text-ink">Scoped · revocable</span>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-verify-soft px-3.5 py-2.5 text-sm font-medium text-verify">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-verify" />
        </span>
        Reviewed before you confirm
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

const PRIOR_ART: { name: string; what: string; edge: string }[] = [
  {
    name: "Coinbase Agentic Wallets",
    what: "Vendor MPC agent wallet on Base — bundles an x402 client + programmable spend limits.",
    edge: "No vendor wallet: the limit lives on your own EOA via EIP-7702 (same address), chain-abstracted across EVM chains (Base + Arbitrum), with a public proof receipt.",
  },
  {
    name: "Coinbase Spend Permissions",
    what: "Allowance (token, period, amount) + revoke for smart wallets.",
    edge: "Wallet-agnostic: the mandate lives on the 7702 Universal Account, plus a public proof receipt.",
  },
  {
    name: "ERC-7715 / 7710",
    what: "Emerging standard for wallet-granted scoped permissions + delegation.",
    edge: "A focused, auditable payments mandate aligned to that vocabulary — shipping today.",
  },
  {
    name: "ZeroDev session keys",
    what: "Low-level account delegation (rate limits, allowed calls).",
    edge: "We enforce a payment policy (per-charge / day / total / merchant) with legible consent.",
  },
  {
    name: "Google AP2",
    what: "Agent “mandates” as off-chain Verifiable Credentials.",
    edge: "Same word, but enforced on-chain at your account — a promise becomes a guarantee.",
  },
  {
    name: "x402 (Coinbase)",
    what: "HTTP 402 pay-per-call rail for agents — no spend controls.",
    edge: "We are the spending-limit layer that bounds x402 spend.",
  },
];

function AgentEconomySection() {
  return (
    <section className="mt-24">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        The spending limit x402 is missing
      </h2>
      <p className="mt-3 max-w-2xl text-ink2">
        <Term def="An open web standard that lets software pay for an API call over HTTP — via the '402 Payment Required' response.">x402</Term>{" "}
        (Coinbase, Cloudflare, AWS) lets an AI agent pay for any API over HTTP — and nothing
        bounds how much it spends. OneLink Pay is the on-chain leash: one signed mandate, revocable
        anytime, with a public proof receipt for every payment. We build on the spend-permission
        wave rather than reinvent it.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper2 text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Prior art</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">What it is</th>
              <th className="px-4 py-2.5 font-semibold">Where OneLink differs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {PRIOR_ART.map((row) => (
              <tr key={row.name} className="align-top">
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{row.what}</td>
                <td className="px-4 py-3 text-ink2">{row.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 max-w-2xl rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3 text-sm font-medium text-ink">
        OneLink Pay is the on-chain, revocable spending limit for the x402 agent economy — built on
        Particle{" "}
        <Term def="A Particle account that gives you one balance across many chains — no bridging or picking a network.">Universal Accounts</Term>{" "}
        +{" "}
        <Term def="An Ethereum upgrade that lets your normal wallet act as a smart account for a transaction — no separate smart wallet to set up.">EIP-7702</Term>
        , with a public proof receipt for every payment.
      </p>
    </section>
  );
}

function SponsorStrip() {
  const items: { name: string; advantage: string; accent?: boolean }[] = [
    {
      name: "Particle",
      advantage: "Universal Accounts + EIP-7702 — one balance, every chain",
      accent: true,
    },
    { name: "Magic", advantage: "Email / Google login — your wallet is your email" },
    { name: "Arbitrum", advantage: "Low-fee USDC settlement where the mandate is enforced" },
  ];
  return (
    <section className="mt-12">
      <p className="text-sm font-semibold text-ink2">Built with</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((s) => (
          <div
            key={s.name}
            className={`op-card-quiet p-4 transition-colors duration-300 ${
              s.accent
                ? "border-iris/30 bg-iris-soft/50 hover:bg-iris-soft"
                : "hover:bg-paper"
            }`}
          >
            <p
              className={`font-display text-base font-semibold ${
                s.accent ? "text-iris-ink" : "text-ink"
              }`}
            >
              {s.name}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.advantage}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
