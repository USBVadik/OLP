import Link from "next/link";
import { Wordmark, Chip, IconCheck, IconShield, IconArrowUpRight, AppNav } from "@/components/ui";
import { EcosystemStack } from "@/components/ecosystem-stack";
import { TrustGap } from "@/components/trust-gap";
import { RailComparison } from "@/components/rail-comparison";
import { StandardsAlignment } from "@/components/standards-alignment";

export const metadata = {
  title: "What's real · OneLink Pay",
  description: "Exactly what's live, what's a pattern, and what's future — with on-chain proof.",
};

type Status = "real" | "pattern" | "future";

const ROWS: { claim: string; status: Status; note: string }[] = [
  {
    claim: "Cross-chain USDC settlement via Particle Universal Account + EIP-7702 — no manual bridge",
    status: "real",
    note: "Live and proven on-chain (ledger C21): paid on Arbitrum, USDC sourced from Base in one operation.",
  },
  {
    claim: "On-chain spend mandate — per-charge / daily / total caps + expiry + single-merchant + revoke",
    status: "real",
    note: "Enforced by our SpendPolicy contract on Base + Arbitrum. Over-cap reverts at zero gas. 22 contract tests pass.",
  },
  {
    claim: "Walletless login (Magic email / Google)",
    status: "real",
    note: "No seed phrase, no extension: a Magic embedded wallet is live. Magic exposes the headless EIP-7702 authorization methods used by our Particle UA flow, so onboarding stays embedded and the one-time delegation can be relayer-sponsored.",
  },
  {
    claim: "Agent buys an x402-gated API; over-cap call is blocked",
    status: "pattern",
    note: "The x402 pattern (402 → pay → retry-with-proof → 200), settled by the mandate via our onelink-mandate scheme — NOT the Coinbase EIP-3009 facilitator.",
  },
  {
    claim: "The “agent”",
    status: "real",
    note: "Runs unattended: one click and it works through the x402 APIs within its budget, halted by the firewall on the over-cap call. Deterministic — not LLM-driven, so we don't claim AI reasoning.",
  },
  {
    claim: "Gas abstraction — network fee paid in USDC, no destination-chain gas to hold",
    status: "real",
    note: "Particle deducts the routing/network fee in USDC from your Universal Account, so you never top up native gas on the destination chain. And the one-time EIP-7702 delegation per chain is relayer-sponsored (C23), so a first-time payer needs zero native gas too.",
  },
  {
    claim: "Zero-gas onboarding — the one-time EIP-7702 delegation is relayer-sponsored",
    status: "real",
    note: "The payer signs the authorization (gasless, via Magic); our relayer submits the type-4 delegation tx and pays the gas. Proven live on Arbitrum (C23). Scoped to the one-time delegation only — a general settlement paymaster is still NOT claimed (the settlement fee is paid in USDC by the Universal Account).",
  },
  {
    claim: "Circle Gateway · ZeroDev · Openfort",
    status: "future",
    note: "Not integrated — narrative / prior-art only; cross-chain is proven natively via Particle. For arming unattended automation, ZeroDev session keys are the production primitive we'd adopt; enforcement today is our own SpendPolicy contract.",
  },
];

function StatusChip({ status }: { status: Status }) {
  if (status === "real") return <Chip tone="verify"><IconCheck className="h-3 w-3" /> Real · live</Chip>;
  if (status === "pattern") return <Chip tone="gold">Pattern</Chip>;
  return <Chip>Not built</Chip>;
}

export default function TrustPage() {
  const receiptUrl =
    "https://onelink-pay.vercel.app/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5";
  const counts = { real: 0, pattern: 0, future: 0 } as Record<Status, number>;
  for (const r of ROWS) counts[r.status] += 1;
  return (
    <main className="op-shell px-5 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <Link href="/" className="op-btn-ghost px-3 py-2">
            Home
          </Link>
        </header>

        <AppNav className="mb-6" />

        <section className="op-animate-rise">
          <span className="op-eyebrow">Claim discipline</span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
            What&rsquo;s real, what&rsquo;s a pattern, what&rsquo;s future.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink2">
            We keep an honest-claim ledger: every public claim maps to something verifiable on-chain
            or in our own code. Here is exactly what is live today, what is a pattern we implement,
            and what we deliberately do not claim.
          </p>
        </section>

        <section className="mt-8 op-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="verify"><IconCheck className="h-3 w-3" /> {counts.real} real · live</Chip>
              <Chip tone="gold">{counts.pattern} pattern</Chip>
              <Chip>{counts.future} future</Chip>
            </div>
            <Chip tone="verify"><IconShield className="h-3.5 w-3.5" /> No overclaiming</Chip>
          </div>
          <ul className="divide-y divide-line">
            {ROWS.map((row, i) => (
              <li key={i} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{row.claim}</p>
                  <span className="shrink-0">
                    <StatusChip status={row.status} />
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{row.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 space-y-6">
          <EcosystemStack />
          <TrustGap />
          <RailComparison />
          <StandardsAlignment />
        </div>

        <section className="mt-6 op-card-quiet p-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <IconCheck className="h-4 w-4 text-verify" /> Don&rsquo;t take our word for it
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            The cross-chain claim is backed by public transactions. Open the proof receipt — it
            cross-checks the on-chain settlement against the invoice, with explorer links per chain
            and the InvoicePaid attestation, no account required.
          </p>
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-iris transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40"
          >
            Open a verifiable cross-chain receipt
            <IconArrowUpRight className="h-4 w-4" />
          </a>
        </section>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          The agent runs unattended once started (deterministic, not an LLM), the x402 scheme is our own (not facilitator-compatible),
          and the one-time delegation is relayer-sponsored (zero-gas onboarding) while no general settlement paymaster is claimed. Saying so plainly is the point.
        </p>
      </div>
    </main>
  );
}
