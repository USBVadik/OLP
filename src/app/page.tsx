import Link from "next/link";
import { DEMO_REPLAY_PAYMENT_LINK } from "@/lib/demo/replay";
import { getActivePaymentChain, getConfiguredPaymentMode } from "@/lib/config/payment";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <section className="border-b border-gray-200 pb-8">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-gray-200 bg-white px-2 py-1">
              pre-hackathon prototype
            </span>
            <span className="rounded border border-gray-200 bg-white px-2 py-1">
              mode: <span className="font-mono">{PAYMENT_MODE}</span>
            </span>
            <span className="rounded border border-gray-200 bg-white px-2 py-1">
              chain: <span className="font-mono">{ACTIVE_CHAIN.name}</span>
            </span>
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-normal">
            OneLink Pay turns a crypto payment into a checkout link with wallet login, Particle preview, and verifiable receipt proof.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            The current live prototype uses Magic login, Particle Universal Account transfer on Base, server-side USDC Transfer verification, and a ReceiptEmitter proof transaction.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo-replay"
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Open Demo Replay
            </Link>
            <Link
              href={`/success/${DEMO_REPLAY_PAYMENT_LINK.id}`}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium"
            >
              View Receipt
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium"
            >
              Merchant Dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          <InfoPanel
            title="Problem"
            body="Crypto checkout still feels like infrastructure: wallet setup, chain switching, gas confusion, and weak merchant status reconciliation."
          />
          <InfoPanel
            title="Solution"
            body="A merchant creates one link. The customer signs in with Magic, Particle builds a human-readable payment preview, and the app handles proof after payment."
          />
          <InfoPanel
            title="Proof"
            body="The fallback path verifies a real Base USDC Transfer server-side and records a ReceiptEmitter InvoicePaid proof tx before showing PAID."
          />
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-bold">Current Working Flow</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-5">
            {["Magic login", "Particle UA", "USDC transfer", "Server verification", "Receipt proof"].map((step) => (
              <div key={step} className="rounded border border-gray-200 bg-gray-50 p-3">
                {step}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The strict approve + payInvoice universal transaction path stays behind <span className="font-mono">universal_invoice</span> while Particle custom universal calls return -32801 maintenance.
          </p>
        </section>
      </div>
    </main>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
    </div>
  );
}
