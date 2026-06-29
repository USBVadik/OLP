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
    "Give your AI a card, not your wallet. The pitch in one page — with the live demo one click away.",
};

const APP = "https://onelink-pay.vercel.app";
const RECEIPT = `${APP}/receipt/40027dcf-f45e-4991-a215-553dfb71d0e3`;

const DEMO_BEATS: { t: string; d: string }[] = [
  { t: "Walletless login", d: "Google or email via Magic — no seed phrase, no extension — into a Particle Universal Account in EIP-7702 mode." },
  { t: "Read the card, not a hash", d: "A plain-English mandate: $0.10 / charge, $2 / day, one merchant, expires today, revocable. The EIP-712 hash sits behind a disclosure." },
  { t: "Send the agent", d: "It runs the x402 handshake (402 → pay → 200) and buys within budget; the live Budget HUD drains from on-chain state." },
  { t: "Over-cap is blocked on-chain", d: "The next charge exceeds the cap and reverts (PerChargeExceeded) — no funds move, zero gas. The visceral moment." },
  { t: "Cross-chain, no manual bridge", d: "A merchant is paid on Arbitrum with USDC sourced from Base in one operation — the user never bridges or picks a chain." },
  { t: "Proof, then revoke", d: "Open the public proof receipt — anyone re-checks it on a block explorer, no account. One click revokes the mandate." },
];

const LIVE: string[] = [
  "Permission Firewall — SpendPolicy enforces per-charge / daily / total caps + expiry + single-merchant + revoke, live on Base + Arbitrum. Over-cap charges revert at zero gas. 22 Hardhat tests pass.",
  "Cross-chain settlement via Particle Universal Account (EIP-7702) — merchant paid on Arbitrum, USDC sourced from Base, one operation, no manual bridge. Proven live on-chain.",
  "Agent on a leash — the real x402 pattern, bounded by the on-chain mandate; within-cap buys succeed, over-cap is refused before any funds move.",
  "Public proof receipts — ReceiptEmitter anchors an InvoicePaid attestation after server-side verification of the on-chain USDC transfer; shareable and re-verifiable by anyone.",
];

export default function PitchPage() {
  return (
    <main className="op-shell px-5 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <span className="op-chip">Pitch</span>
        </header>

        <AppNav active="/pitch" className="mb-8" />

        {/* 1. Hero */}
        <section className="op-animate-rise">
          <div className="flex flex-wrap gap-2">
            <Chip tone="gold">
              <IconShield className="h-3.5 w-3.5" /> Universal Accounts Track
            </Chip>
            <Chip>Arbitrum · Road to Open House London</Chip>
            <Chip>Magic Labs</Chip>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.25rem]">
            Give your AI a card.
            <br />
            <span className="text-gold">Not your wallet.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink2">
            OneLink Pay is a permission firewall for Universal Accounts. You sign one scoped on-chain
            mandate — per-charge, daily and total caps, expiry, a single merchant, instant revoke —
            and your agent (or a merchant) can pay USDC but <span className="font-semibold text-ink">physically cannot overspend</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/agent" className="op-btn-primary">
              See the agent demo
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

        {/* 2. The problem + the trust gap */}
        <section className="mt-14">
          <span className="op-eyebrow">The problem</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
            Agents can pay now. Nothing stops them overspending.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink2">
            AI agents can already pay for anything over HTTP (x402). But a buggy or hijacked agent
            can drain the wallet — and consumers feel it. The rails are here; the trust isn&rsquo;t.
          </p>
        </section>
        <div className="mt-5">
          <TrustGap />
        </div>

        {/* 3. How it works */}
        <section className="mt-14">
          <span className="op-eyebrow">The solution</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
            One mandate. Enforced on-chain. Can&rsquo;t overspend.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Step
              icon={<IconShield className="h-5 w-5" />}
              n={1}
              title="Sign one mandate"
              body="An EIP-712 PaymentMandate: per-charge / daily / total caps, expiry, one merchant, revocable — read in plain English, not a blind hash."
            />
            <Step
              icon={<IconLock className="h-5 w-5" />}
              n={2}
              title="Enforced by SpendPolicy"
              body="An on-chain contract checks every charge. Over-cap, off-merchant, or post-revoke charges revert at zero gas — no server you must trust."
            />
            <Step
              icon={<IconReceipt className="h-5 w-5" />}
              n={3}
              title="Public proof receipt"
              body="Every payment anchors a verifiable receipt linking the settlement and the InvoicePaid attestation — re-checkable by anyone, no account."
            />
          </div>
          <p className="mt-5 rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3 text-sm font-medium text-ink">
            Built on Particle Universal Accounts in EIP-7702 mode + Magic walletless login: one
            balance across chains, cross-chain settlement with no manual bridge, bounding x402 agent
            payments.
          </p>
        </section>

        {/* 4. The 90-second demo */}
        <section className="mt-14 op-card p-6 sm:p-7">
          <span className="op-eyebrow">The 90-second demo</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">What the judges see</h2>
          <ol className="mt-5 space-y-3">
            {DEMO_BEATS.map((b, i) => (
              <li key={b.t} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-xs font-semibold text-cream">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{b.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{b.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. Why it's different */}
        <div className="mt-6">
          <RailComparison />
        </div>

        {/* 6. What's live (honest) */}
        <section className="mt-14 op-card p-6 sm:p-7">
          <span className="op-eyebrow">What&rsquo;s live — honestly</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Proven, not promised</h2>
          <ul className="mt-5 space-y-2.5">
            {LIVE.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-verify" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl border border-line bg-paper2 p-4">
            <p className="text-sm font-semibold text-ink">We say what we don&rsquo;t claim</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
              <li>x402 is the <span className="font-medium text-ink2">pattern</span> (our <span className="font-mono text-xs">onelink-mandate</span> scheme), not the Coinbase facilitator.</li>
              <li>The agent is an <span className="font-medium text-ink2">unattended deterministic</span> loop — not an LLM; no AI reasoning is claimed.</li>
              <li>No gas sponsorship — a first-time EIP-7702 delegation needs a little native gas per chain.</li>
              <li>Prod runs a pinned <span className="font-medium text-ink2">beta</span> Particle SDK (<span className="font-mono text-xs">2.0.0-beta.3</span>) — the build that ships real 7702 + cross-chain.</li>
            </ul>
          </div>
          <p className="mt-4 text-sm text-muted">
            Full claim ledger and what&rsquo;s real vs pattern vs future:{" "}
            <Link href="/trust" className="op-link">/trust</Link>.
          </p>
        </section>

        {/* 7. CTA footer */}
        <section className="mt-14 op-card p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-ink">See it for yourself</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Everything below runs live — no slideware. The buttons run on our funded demo account; the
            replay and receipt need no wallet at all.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/agent" className="op-btn-primary">
              Agent on a leash
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/receipt/40027dcf-f45e-4991-a215-553dfb71d0e3" className="op-btn-secondary">
              Cross-chain receipt
            </Link>
            <Link href="/demo-replay" className="op-btn-ghost">
              90-second replay
            </Link>
            <Link href="/trust" className="op-btn-ghost">
              What&rsquo;s real
            </Link>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <Wordmark />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Particle Universal Accounts + EIP-7702 · Magic walletless login · Arbitrum settlement.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({
  icon,
  n,
  title,
  body,
}: {
  icon: React.ReactNode;
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="op-card-quiet flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-gold">
          {icon}
        </span>
        <span className="font-display text-sm font-semibold text-faint">{n}</span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
