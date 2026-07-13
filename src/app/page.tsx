import Link from "next/link";
import { getConfiguredPaymentMode, getPaymentModeLabel } from "@/lib/config/payment";
import {
  Wordmark,
  Chip,
  IconShield,
  IconReceipt,
  IconLock,
  IconArrowUpRight,
  IconCheck,
  Term,
  AppNav,
} from "@/components/ui";
import { ParticleField } from "@/components/particle-field";
import { Magnetic } from "@/components/magnetic";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Reveal } from "@/components/reveal";
import { ScrollNarrative } from "@/components/scroll-narrative";
import { CrossChainRoute } from "@/components/cross-chain-route";

const PAYMENT_MODE = getConfiguredPaymentMode();
const PAYMENT_MODE_LABEL = getPaymentModeLabel(PAYMENT_MODE);

export default function HomePage() {
  return (
    <main className="op-shell">
      <SmoothScroll />
      <div className="op-grain" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 py-5 sm:py-6">
          <Wordmark href="/" />
          <AppNav className="w-28 sm:w-auto" />
        </header>

        {/* Hero */}
        <section className="relative pt-5 sm:pt-8 lg:pt-12">
          <div
            className="pointer-events-none absolute -inset-x-10 -top-28 bottom-0 overflow-hidden"
            aria-hidden="true"
          >
            {/* Feather the edges so the fixed-width aurora rectangle dissolves into the page on
                wide screens instead of showing a hard image boundary. Radial anchored top-right
                where the silk actually sits; opaque core, transparent at every edge. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fx/aurora.webp"
              alt=""
              className="h-full w-full object-cover opacity-[0.6]"
              style={{
                maskImage:
                  "radial-gradient(115% 115% at 72% 22%, #000 45%, rgba(0,0,0,0.35) 72%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(115% 115% at 72% 22%, #000 45%, rgba(0,0,0,0.35) 72%, transparent 100%)",
              }}
            />
          </div>
          <ParticleField density={1.15} />
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
            <span className="op-eyebrow inline-flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verify" />
              </span>
              A research agent expense card
            </span>
            <h1 className="mt-4 font-display text-[2.3rem] font-semibold leading-[0.98] tracking-[-0.02em] text-ink sm:text-[4.75rem]">
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
            <p className="mt-4 font-display text-xl font-medium text-ink sm:text-2xl">
              Trust before you pay. Proof after it settles.
            </p>
            <p
              className="op-animate-rise mt-4 max-w-lg text-base leading-relaxed text-ink2 sm:text-lg"
              style={{ animationDelay: "240ms" }}
            >
              A research workflow buys the market data it needs, prepares a useful brief, and gets
              stopped when an unexpected premium request exceeds your signed limit.
            </p>

            <div
              className="op-animate-rise mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3"
              style={{ animationDelay: "340ms" }}
            >
              <Magnetic>
                <Link href="/agent" className="op-btn-primary w-full sm:w-auto">
                  Run the research task
                  <IconArrowUpRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Link
                href="/try"
                className="op-btn-secondary w-full sm:w-auto"
              >
                Try the block without a wallet
              </Link>
            </div>

            <p
              className="op-animate-rise mt-3 max-w-lg text-xs leading-relaxed text-muted"
              style={{ animationDelay: "360ms" }}
            >
              The task is deterministic, not an LLM. The separate canonical receipt proves the
              live Base-to-Arbitrum Particle UA payment.
            </p>
          </div>

          {/* Product peek: a Trust Preview card */}
          <div
            className="op-animate-rise lg:justify-self-end"
            style={{ animationDelay: "320ms" }}
          >
            <div className="animate-float-y">
              <PreviewPeek />
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
                  Funds are sourced from supported chains where you hold USDC and settled where the
                  merchant wants — the Universal Account routes it in one operation, with no manual
                  bridge and the network fee paid in USDC. This is the exact Base → Arbitrum flow we
                  proved on-chain.
                </p>
              </div>
              <CrossChainRoute status="settled" fromNames={["Base"]} toName="Arbitrum" amountLabel="1.00 USDC" />
            </div>
          </Reveal>
        </section>

        {/* Integrate in one call — adoption story */}
        <Reveal>
          <IntegrateSection />
        </Reveal>

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

function PreviewPeek() {
  return (
    <div className="w-full max-w-sm op-card p-6 shadow-[0_24px_48px_-24px_rgba(35,32,27,0.28),0_0_72px_-20px_rgba(110,86,240,0.40)] transition-shadow duration-500 hover:shadow-[0_24px_60px_-24px_rgba(35,32,27,0.32),0_0_92px_-16px_rgba(110,86,240,0.55)]">
      <div className="flex items-center justify-between">
        <span className="op-eyebrow">Research expense card</span>
        <Chip tone="gold">
          <IconShield className="h-3.5 w-3.5" /> Armed
        </Chip>
      </div>

      <div className="mt-5 rounded-2xl bg-paper2 p-4">
        <p className="text-xs text-muted">Task</p>
        <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
          Prepare an ETH market-risk brief
        </p>
      </div>

      <dl className="mt-4 divide-y divide-line">
        <Row label="Per paid tool" value="up to 0.10 USDC" />
        <Row label="Daily budget" value="2.00 USDC" />
        <Row label="Provider" value="one approved address" />
        <Row label="Permission" value="expires · revocable" />
      </dl>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-verify-soft px-3.5 py-2.5 text-sm font-medium text-verify">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-verify" />
        </span>
        0.20 USDC premium request will be blocked
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Expected result: brief + settlement evidence
      </p>
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
      advantage: "Universal Accounts + EIP-7702 — one balance across supported chains",
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


const INTEGRATE_SNIPPET = `curl -s https://onelink-pay.vercel.app/api/payment-links \\
  -H "content-type: application/json" \\
  -H "x-admin-create-token: $KEY" \\
  -d '{"merchantAddress":"0xYourMerchant","amount":"1000000","token":"USDC","destinationChainId":42161}'

# → { "paymentLink": { "id": "…" }, "checkoutUrl": "https://onelink-pay.vercel.app/pay/<id>" }`;

// Real, byte-for-byte response of the walletless demo endpoint (GET, no key, no gas). Keep this in
// sync with GET /api/demo/firewall-block — it is a public claim, so it must match the live output.
const FIREWALL_VERDICT_SNIPPET = `# Walletless — no key, no funds, no gas. Hits the live Arbitrum SpendPolicy.
curl -s https://onelink-pay.vercel.app/api/demo/firewall-block

# → the on-chain verdict, machine-readable:
{
  "armed": true,
  "blocked": true,
  "reason": "over the per-charge cap",
  "errorName": "PerChargeExceeded",
  "attempted": "0.50",
  "cap": "0.10",
  "chainId": 42161,
  "policy": "0x9782e3724859469fbBAC5085EA8bf8E70724164E"
}`;

const INTEGRATE_PATHS: { t: string; d: string }[] = [
  { t: "Hosted pay link", d: "One API call returns a checkout URL — no SDK, no contracts to deploy." },
  { t: "Server-to-server charge", d: "Charge a payer-signed mandate within its caps; an over-cap charge reverts on-chain, no funds move." },
  { t: "x402 agent leash", d: "Bound an agent's per-call x402 spend to the same on-chain mandate ceiling." },
];

function IntegrateSection() {
  return (
    <section className="mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Integrate in one call</h2>
        <Link href="/pitch" className="op-link text-sm">
          See all three paths &rarr;
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-ink2">
        No SDK, no contracts to deploy — every endpoint is a route this app already serves. Create a
        hosted checkout with one API call; your customer logs in with email or Google and pays in
        USDC, and the Universal Account sources funds cross-chain and settles on your chain.
      </p>
      <pre className="mt-5 overflow-x-auto rounded-2xl border border-line bg-paper2 p-5 font-mono text-xs leading-relaxed text-ink2">
        <code>{INTEGRATE_SNIPPET}</code>
      </pre>
      <p className="mt-2 text-xs text-muted">
        Server-side call — your create token stays secret; the browser only ever sees the returned{" "}
        <code className="font-mono text-ink2">checkoutUrl</code>.
      </p>

      <p className="mt-7 max-w-2xl text-ink2">
        The firewall speaks JSON, too. Trigger the live block yourself — walletless — and read the
        on-chain verdict your integration branches on: whether it was blocked, why, and the cap it
        broke.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-2xl border border-line bg-paper2 p-5 font-mono text-xs leading-relaxed text-ink2">
        <code>{FIREWALL_VERDICT_SNIPPET}</code>
      </pre>
      <p className="mt-2 text-xs text-muted">
        The over-cap charge reverts in simulation against the live Arbitrum SpendPolicy — nothing
        moves, no gas. Run it now on{" "}
        <Link href="/try" className="op-link">/try</Link>.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {INTEGRATE_PATHS.map((p) => (
          <div key={p.t} className="op-card-quiet p-4">
            <p className="font-semibold text-ink">{p.t}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{p.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
        <span className="font-semibold text-ink2">Who adopts it:</span> an x402 API vendor (data,
        inference, compute) can require a OneLink mandate at agent sign-up &mdash; every calling
        agent then has a hard, revocable per-day ceiling, so the vendor keeps its usage revenue
        while the agent&rsquo;s owner holds a spend cap they can prove and pull. The same shape fits
        a SaaS metering agent usage, or a marketplace handing each automation its own budget.
      </p>
    </section>
  );
}
