import Link from "next/link";
import { Wordmark, AppNav, Term } from "@/components/ui";
import { FirewallBlockDemo } from "@/components/firewall-block-demo";

export const metadata = {
  title: "Try the firewall · OneLink Pay",
  description:
    "Watch an AI agent try to overspend and get blocked on-chain — no wallet, no login, no gas.",
};

export default function TryPage() {
  return (
    <main className="op-shell px-5 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <Link href="/" className="op-btn-ghost px-3 py-2">
            Home
          </Link>
        </header>

        <AppNav className="mb-6" />

        <section className="op-animate-rise">
          <span className="op-eyebrow">Try it yourself</span>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Make the AI overspend. Watch it fail.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink2">
            No wallet, no login, no gas. Press one button and an agent tries to charge more than the
            mandate allows — the on-chain firewall refuses it, live, in front of you.
          </p>
        </section>

        <div className="mt-7">
          <FirewallBlockDemo />
        </div>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          This calls the real{" "}
          <Term def="Our on-chain contract that enforces the payer's signed spending limits.">SpendPolicy</Term>{" "}
          contract on Arbitrum with a payer-signed demo mandate. The over-cap charge reverts in
          simulation, so nothing moves and no gas is spent — the same firewall that bounds the{" "}
          <Link href="/agent" className="op-link">live agent</Link>. See exactly what&rsquo;s real on{" "}
          <Link href="/trust" className="op-link">/trust</Link>.
        </p>
      </div>
    </main>
  );
}
