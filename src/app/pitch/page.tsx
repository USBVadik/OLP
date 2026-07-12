import Link from "next/link";
import {
  Wordmark,
  Chip,
  AppNav,
  IconArrowUpRight,
  IconCheck,
  IconShield,
  IconReceipt,
  IconLock,
} from "@/components/ui";
import { TrustGap } from "@/components/trust-gap";
import { RailComparison } from "@/components/rail-comparison";

export const metadata = {
  title: "Pitch · OneLink Pay",
  description:
    "A research agent expense card with on-chain spending limits and verifiable settlement.",
};

const APP = "https://onelink-pay.vercel.app";
const RECEIPT = `${APP}/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5`;

const STEPS: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <IconShield className="h-5 w-5" />,
    title: "Sign one mandate",
    body: "An EIP-712 PaymentMandate — per-charge, daily and total caps, expiry, one merchant, revocable. Read in plain English, not a blind hash.",
  },
  {
    icon: <IconLock className="h-5 w-5" />,
    title: "SpendPolicy enforces it on-chain",
    body: "A contract checks every charge. Over-cap, off-merchant, or post-revoke charges revert at zero gas — there is no server you have to trust.",
  },
  {
    icon: <IconReceipt className="h-5 w-5" />,
    title: "Every payment leaves a proof",
    body: "A public receipt links the settlement and the on-chain InvoicePaid attestation — re-checkable by anyone, no account.",
  },
];

const DEMO_BEATS: { t: string; d: string }[] = [
  { t: "Walletless, gasless login", d: "Google or email via Magic — no seed phrase, no extension, no gas — into a Particle Universal Account in EIP-7702 mode; the first-time delegation is relayer-sponsored." },
  { t: "Read the card, not a hash", d: "A plain-English mandate: $0.10 / charge, $2 / day, one merchant, expires today, revocable. The EIP-712 hash sits behind a disclosure." },
  { t: "Run one useful research task", d: "The deterministic workflow buys a 0.05 USDC market snapshot and a 0.08 USDC sentiment feed through the x402 pattern." },
  { t: "Brief ready; overreach blocked", d: "The useful ETH brief appears first. Then an unnecessary 0.20 USDC premium export exceeds the cap and is refused before settlement." },
  { t: "Cross-chain, no manual bridge", d: "A merchant is paid on Arbitrum with USDC sourced from Base in one operation — the user never bridges or picks a chain." },
  { t: "Proof, then revoke", d: "Open the public proof receipt — anyone re-checks it on a block explorer. One click revokes the mandate." },
];

const PROVEN: string[] = [
  "Permission Firewall — SpendPolicy enforces per-charge / daily / total caps + expiry + single-merchant + revoke, live on Base + Arbitrum. Over-cap reverts at zero gas. 22 contract tests pass.",
  "Cross-chain settlement via Particle Universal Account (EIP-7702) — merchant paid on Arbitrum, USDC sourced from Base, one operation, no manual bridge. Proven live on-chain.",
  "Research agent expense card — two paid inputs produce a useful brief through the x402 pattern; the unexpected premium export is bounded by the mandate and refused before settlement.",
  "Public proof receipts — ReceiptEmitter anchors an InvoicePaid attestation after server-side verification of the on-chain USDC transfer; re-verifiable by anyone.",
  "Zero-gas onboarding — the one-time per-chain EIP-7702 delegation is submitted by our relayer (relayer pays); a first-time payer needs no native gas. Proven live on Arbitrum (the delegation tx is sent by the relayer, not the payer).",
  "Self-custody — the limit lives on your own EOA (same address), not a custodial or MPC wallet; export your key via Magic's own reveal (OneLink never sees it) or revert the delegation anytime.",
];

const NOT_CLAIMED: React.ReactNode[] = [
  <>x402 is the <span className="font-medium text-ink">pattern</span> (our <span className="font-mono text-xs">onelink-mandate</span> scheme), not the Coinbase facilitator.</>,
  <>The agent is an <span className="font-medium text-ink">unattended deterministic</span> loop — not an LLM. No AI reasoning is claimed.</>,
  <>No <span className="font-medium text-ink">general</span> gas paymaster — only the one-time 7702 delegation is sponsored (relayer-paid); the settlement fee is paid in USDC.</>,
  <>Prod runs the pinned <span className="font-medium text-ink">stable</span> Particle SDK (<span className="font-mono text-xs">2.0.3</span>) — real 7702 + cross-chain, live-verified.</>,
];

export default function PitchPage() {
  return (
    <main className="op-shell px-5 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <span className="op-chip">Pitch</span>
        </header>

        <AppNav active="/pitch" className="mb-10" />

        {/* Hero */}
        <section className="op-animate-rise">
          <div className="flex flex-wrap gap-2">
            <Chip tone="gold">
              <IconShield className="h-3.5 w-3.5" /> Universal Accounts Track
            </Chip>
            <Chip>Arbitrum · Road to Open House London</Chip>
            <Chip>Magic Labs</Chip>
          </div>
          <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.02em] text-ink sm:text-[3.4rem]">
            Give a research agent a card.
            <br />
            <span className="text-gold">Not your wallet.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink2">
            Give a deterministic research workflow 2 USDC for paid tools. It buys two market feeds,
            produces an ETH risk brief, and an unexpected premium request is stopped by the signed
            0.10 USDC per-tool limit.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink2">
            Underneath that legible story, OneLink Pay is the{" "}
            <span className="font-semibold text-ink">safety layer for the payments your apps and
            agents make</span>: Particle handles chain-abstracted value movement while an on-chain
            mandate enforces limits and public receipts make settlement verifiable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/agent" className="op-btn-primary">
              Run the research task
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/demo-replay" className="op-btn-secondary">
              Watch the 90-second replay
            </Link>
            <a href={RECEIPT} target="_blank" rel="noreferrer" className="op-btn-ghost">
              Verify a receipt on-chain
            </a>
          </div>
        </section>

        {/* The problem */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            Agents can pay now. Nothing stops them overspending.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink2">
            Software agents can already pay for anything over HTTP (x402). But a buggy or hijacked workflow
            can drain the wallet — and consumers feel it. The rails are here; the trust isn&rsquo;t.
          </p>
          <div className="mt-6">
            <TrustGap />
          </div>
        </section>

        {/* The solution — a sequence, not a card grid */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            One mandate. Enforced on-chain. Can&rsquo;t overspend.
          </h2>
          <ol className="mt-7">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 pb-7 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold">
                    {s.icon}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span className="mt-2 w-px flex-1 bg-line" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 max-w-2xl rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3 text-sm font-medium text-ink">
            Built on Particle Universal Accounts in EIP-7702 mode + Magic walletless login: one
            balance across chains, cross-chain settlement with no manual bridge, and zero-gas
            onboarding (the one-time delegation is relayer-sponsored) — bounding x402 agent payments,
            non-custodial on your own EOA.
          </p>
        </section>

        {/* The 90-second demo — a real sequence */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            The 90 seconds a judge sees
          </h2>
          <ol className="mt-7 space-y-5">
            {DEMO_BEATS.map((b, i) => (
              <li key={b.t} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-paper font-display text-xs font-semibold text-ink2 tnum">
                  {i + 1}
                </span>
                <div className="-mt-0.5">
                  <p className="font-semibold text-ink">{b.t}</p>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink2">{b.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Why it's different */}
        <section className="mt-20">
          <RailComparison />
        </section>

        {/* What's live + what we don't claim — two sibling panels, no nesting */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            Proven, not promised
          </h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="op-card-quiet p-5">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <IconCheck className="h-4 w-4 text-verify" /> Live today
              </p>
              <ul className="mt-3 space-y-2.5">
                {PROVEN.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink2">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-verify" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="op-card-quiet p-5">
              <p className="font-semibold text-ink">What we don&rsquo;t claim</p>
              <ul className="mt-3 space-y-2.5">
                {NOT_CLAIMED.map((node, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" aria-hidden="true" />
                    <span>{node}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink2">
            Every public claim maps to an on-chain proof — the full ledger is at{" "}
            <Link href="/trust" className="op-link">/trust</Link>.
          </p>
        </section>

        {/* For builders */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            Integrate in one call
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink2">
            No contracts to deploy, no SDK. Send users to a hosted link, or bound an agent&rsquo;s
            x402 spend with a signed mandate — two paths a builder ships today.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="op-card-quiet p-5">
              <p className="font-semibold text-ink">Hosted pay link</p>
              <p className="mt-1 text-sm leading-relaxed text-ink2">
                One POST from your backend, then redirect the customer. Cross-chain USDC, settled on
                your chain.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper p-3 font-mono text-[11px] leading-relaxed text-ink2">{`POST /api/payment-links
  x-admin-create-token: $TOKEN
  { merchantAddress, amount, token,
    destinationChainId }
→ { checkoutUrl: ".../pay/<id>" }`}</pre>
            </div>
            <div className="op-card-quiet p-5">
              <p className="font-semibold text-ink">Agent on x402</p>
              <p className="mt-1 text-sm leading-relaxed text-ink2">
                GET → 402 → pay within the signed mandate → retry with proof → 200. The firewall
                caps every call on-chain.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper p-3 font-mono text-[11px] leading-relaxed text-ink2">{`GET  /api/x402/<resource>   → 402 + terms
POST /api/mandates/charge   → { txHash }
     (reverts on-chain if over-cap)
GET  /api/x402/<resource>
     X-PAYMENT: <proof>     → 200 + data`}</pre>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink2">
            <span className="font-medium text-ink">Who it&rsquo;s for:</span> AI-agent frameworks that
            need a hard spend ceiling, usage/subscription billing that wants a revocable capped
            mandate, and API providers pricing per call over x402. Full guide:{" "}
            <span className="font-mono text-xs">docs/integrate.md</span>.
          </p>
        </section>

        {/* See it for yourself */}
        <section className="mt-20 rounded-3xl border border-line bg-paper2 p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
            See it for yourself
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-ink2">
            Everything here runs live — no slideware. The buttons run on our funded demo account; the
            replay and receipt need no wallet at all.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/agent" className="op-btn-primary">
              Research agent expense card
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5" className="op-btn-secondary">
              Cross-chain receipt
            </Link>
            <Link href="/demo-replay" className="op-btn-ghost">
              90-second replay
            </Link>
            <Link href="/try" className="op-btn-ghost">
              Try the block (no wallet)
            </Link>
            <Link href="/trust" className="op-btn-ghost">
              What&rsquo;s real
            </Link>
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <Wordmark />
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
              Particle Universal Accounts + EIP-7702 · Magic walletless login · Arbitrum settlement.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
