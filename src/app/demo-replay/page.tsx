import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEMO_REPLAY_AGENT,
  DEMO_REPLAY_AGENT_FUNDING,
  DEMO_REPLAY_AGENT_SUMMARY,
  DEMO_REPLAY_PAYMENT,
  DEMO_REPLAY_PAYMENT_LINK,
  getDemoReplaySuccess,
} from "@/lib/demo/replay";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import { formatUsdcAmount } from "@/lib/mandates/format";
import { AgentTaskResult } from "@/components/agent-task-result";
import { CrossChainRoute } from "@/components/cross-chain-route";
import { ParticleActivityProof } from "@/components/particle-activity-proof";
import {
  Wordmark,
  Chip,
  Field,
  TxReference,
  AppNav,
  IconCheck,
  IconArrowUpRight,
  IconShield,
  IconReceipt,
  IconLock,
} from "@/components/ui";

const CROSS_CHAIN_RECEIPT_ID = "fc5adc83-3b17-4004-8902-a5a40a178dd5";

function formatAmount() {
  const token = resolvePaymentToken(DEMO_REPLAY_PAYMENT_LINK.token, DEMO_REPLAY_PAYMENT_LINK.destination_chain_id);
  return `${formatAtomicTokenAmount(DEMO_REPLAY_PAYMENT_LINK.amount, token)} ${token.symbol}`;
}

export default function DemoReplayPage() {
  const replay = getDemoReplaySuccess(DEMO_REPLAY_PAYMENT_LINK.id);
  if (!replay) notFound();

  const amount = formatAmount();

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

        {/* Intro — the h1 carries the hook; the chips below state the guarantees (no kicker). */}
        <section className="op-animate-rise">
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            The task finished.{" "}
            <span className="text-gold">The overspend didn&apos;t.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink2">
            Inspect the verified mainnet outcome without signing or spending: a deterministic
            workflow bought the two inputs needed for an ETH risk brief. Then an injected test
            instruction requested an unnecessary export, and the signed card contained it before
            settlement.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip tone="verify">
              <IconCheck className="h-3.5 w-3.5" /> No wallet needed
            </Chip>
            <Chip>No transaction sent by replay</Chip>
            <Chip>Real Arbitrum evidence</Chip>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="research-replay-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="research-replay-title" className="font-display text-3xl font-semibold text-ink">
              Research Agent Expense Card
            </h2>
            <Chip tone="verify">
              <IconCheck className="h-3.5 w-3.5" /> Verified replay
            </Chip>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            The resource payloads and brief are deterministic demo fixtures. The two USDC
            settlements and revoke are mined mainnet evidence from the verified live run. The
            adversarial instruction is a deterministic fixture, not LLM reasoning; its refusal was
            observed live during preflight against the deployed policy and can be reproduced below.
          </p>

          <dl className="mt-5 grid border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line">
            <ReplayMetric label="Mission" value="Prepare an ETH risk brief" />
            <ReplayMetric
              label="Signed boundary"
              value={`${formatUsdcAmount(DEMO_REPLAY_AGENT.perToolCapAtomic)} / tool`}
            />
            <ReplayMetric
              label="Daily budget"
              value={formatUsdcAmount(DEMO_REPLAY_AGENT.dailyCapAtomic)}
            />
          </dl>

          <div className="mt-5 rounded-2xl border border-verify/25 bg-verify-soft/70 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-verify text-white">
                <IconCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  Funded across chains before the work began
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink2">
                  Particle assembled the 2.00 USDC Arbitrum budget with a successful Base source
                  leg, then approved the exact amount to SpendPolicy on Arbitrum. OneLink&apos;s
                  server matched the finished activity, both receipts, and the approval before the
                  card could be armed.
                </p>
              </div>
            </div>

            {/* Money in motion — the same settled-route visual judges see on /pay and /receipt —
                but with NO amount on the arrow. The 2.00 USDC is an approved SpendPolicy ceiling,
                not the sum that crossed chains (only part routed from Base; the rest was already on
                Arbitrum), so the amount lives in its own labelled figure below to avoid implying
                "2 USDC crossed". */}
            <CrossChainRoute
              className="mt-4"
              status="settled"
              fromNames={[DEMO_REPLAY_AGENT_FUNDING.sourceChain]}
              toName={DEMO_REPLAY_AGENT_FUNDING.settlementChain}
              verified
              sourceLegs={[
                {
                  name: DEMO_REPLAY_AGENT_FUNDING.sourceChain,
                  href: DEMO_REPLAY_AGENT_FUNDING.sourceExplorer,
                },
              ]}
            />

            <ParticleActivityProof
              activityId={DEMO_REPLAY_AGENT_FUNDING.uaTransactionId}
              href={DEMO_REPLAY_AGENT_FUNDING.activityUrl}
              sourceNames={[DEMO_REPLAY_AGENT_FUNDING.sourceChain]}
              settlementName={DEMO_REPLAY_AGENT_FUNDING.settlementChain}
              verified
              variant="inline"
              summary="EIP-7702 · Base source leg helped make the Arbitrum card budget available"
            />

            <div className="mt-3 flex items-center justify-between rounded-xl bg-paper/70 px-3.5 py-2.5">
              <span className="text-xs text-muted">Budget made available</span>
              <span className="font-display text-sm font-semibold text-ink tnum">
                {formatUsdcAmount(DEMO_REPLAY_AGENT_FUNDING.amountAtomic)}
              </span>
            </div>

            <div className="mt-3">
              <TxReference
                label="Arbitrum budget approval"
                hash={DEMO_REPLAY_AGENT_FUNDING.approvalTxHash}
                href={DEMO_REPLAY_AGENT_FUNDING.approvalExplorer}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Funding and spending are separate proofs: this operation funded the card
              cross-chain; the two resource purchases shown below later settled on Arbitrum.
              Opening this replay never sends a transaction.
            </p>
          </div>

          <div className="mt-5">
            <AgentTaskResult summary={DEMO_REPLAY_AGENT_SUMMARY} />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-verify/25 bg-verify-soft/55 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-verify text-white">
                <IconLock className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-ink">Budget revoked on-chain</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  The payer&apos;s kill switch disarmed this mandate after the verified run.
                </p>
              </div>
            </div>
            <TxReference
              label="Revoke transaction"
              hash={DEMO_REPLAY_AGENT.revokeTxHash}
              href={DEMO_REPLAY_AGENT.revokeExplorer}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gold/25 bg-gold-soft/45 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">Reproduce the refusal yourself</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                No login or wallet. Simulate an over-cap request against the live Arbitrum policy;
                nothing is broadcast.
              </p>
            </div>
            <Link href="/try" className="op-btn-secondary shrink-0">
              Trigger live policy check
              <IconShield className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-verify/25 bg-verify-soft/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Base funded. Arbitrum settled.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink2">
              Inspect the real 2 USDC Universal Account payment, its Base debit, Arbitrum merchant
              settlement, and the anchored InvoicePaid proof.
            </p>
          </div>
          <Link
            href={`/receipt/${CROSS_CHAIN_RECEIPT_ID}`}
            className="op-btn-primary mt-4 shrink-0 sm:mt-0"
          >
            Verify cross-chain receipt
            <IconArrowUpRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Three moments */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">
            The three moments that build trust
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Moment icon={<IconShield className="h-4 w-4" />} step="Before" title="Trust Preview" />
            <Moment icon={<IconReceipt className="h-4 w-4" />} step="After" title="Proof Receipt" />
            <Moment icon={<IconLock className="h-4 w-4" />} step="Live" title="Permission Firewall" href="/firewall" />
          </div>
        </section>

        {/* Verified summary */}
        <section className="mt-8 op-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="font-display text-lg font-semibold text-ink">Earlier checkout replay</h3>
            <Chip tone="verify">
              <IconCheck className="h-3.5 w-3.5" /> PAID · proof recorded
            </Chip>
          </div>

          <div className="px-6 py-2">
            <dl className="divide-y divide-line">
              <Field label="Amount" value={amount} emphasis />
              <Field label="Merchant" value={DEMO_REPLAY_PAYMENT_LINK.merchant_address} mono />
              <Field label="Payer smart account (legacy mode)" value={DEMO_REPLAY_PAYMENT.payer_address} mono />
              <Field label="Invoice ID" value={DEMO_REPLAY_PAYMENT_LINK.contract_invoice_id} mono />
              <Field label="Payment mode" value="Legacy smart-account checkout (pre-7702)" />
            </dl>
            <p className="pb-3 pt-1 text-xs leading-relaxed text-muted">
              This early checkout ran in the SDK&apos;s legacy smart-account mode, so the payer is a
              separate contract address. The current product path is EIP-7702 — the Universal
              Account is the owner&apos;s own EOA (same address); see the cross-chain receipt above.
            </p>
          </div>

          <div className="space-y-2 px-6 pb-5 pt-2">
            <p className="mb-1 text-sm font-semibold text-ink">On-chain proof</p>
            <TxReference label="Payment transaction" hash={DEMO_REPLAY_PAYMENT.tx_hash} href={replay.paymentExplorer} />
            <TxReference label="Proof transaction" hash={DEMO_REPLAY_PAYMENT.receipt_tx_hash} href={replay.proofExplorer} />
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-paper2 px-6 py-5 sm:flex-row sm:items-center">
            <Link href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`} className="op-btn-primary">
              Open proof receipt
              <IconArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard?demo=replay&merchantId=${DEMO_REPLAY_PAYMENT_LINK.merchant_id}`}
              className="op-btn-secondary"
            >
              Open merchant dashboard
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Honest scope: the Research Agent resources are deterministic fixtures; its two payments,
          policy block, and revoke evidence are real Arbitrum results. The checkout card uses a
          separate real same-chain payment, while the main-track receipt is a separate real
          Base-to-Arbitrum Universal Account settlement. No transaction is created by this replay.
        </p>
      </div>
    </main>
  );
}

function ReplayMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 sm:px-4 sm:first:pl-0 sm:last:pr-0">
      <dt className="op-eyebrow">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function Moment({
  icon,
  step,
  title,
  href,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="op-eyebrow">{step}</p>
        <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
          {title}
          {href ? <IconArrowUpRight className="h-3.5 w-3.5 text-faint group-hover:text-gold" /> : null}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="op-card-quiet group flex items-center gap-3 p-4 transition-colors hover:border-gold/40 hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        {inner}
      </Link>
    );
  }

  return <div className="op-card-quiet flex items-center gap-3 p-4">{inner}</div>;
}
