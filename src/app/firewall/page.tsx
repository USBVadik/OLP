"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { formatUnits, type Address } from "viem";
import { ARBITRUM_CHAIN, getExplorerTxUrl, getPublicRpcUrl } from "@/lib/config/payment";
import { ERC20_APPROVE_ABI } from "@/lib/contracts/receipt-emitter";
import { SPEND_POLICY_ABI, toContractMandate } from "@/lib/contracts/spend-policy";
import {
  buildMandateTypedData,
  computeMandateId,
  getSpendPolicyAddress,
  toRawMandate,
} from "@/lib/mandates/mandate";
import { type MandatePreset, type PaymentMandate } from "@/lib/mandates/types";
import { PermissionFirewall } from "@/components/permission-firewall";
import { LoginWithGoogleButton, MagicLoginReassurance, SignOutButton } from "@/components/login-with-google";
import { MandateCard } from "@/components/mandate-card";
import { BudgetHud } from "@/components/budget-hud";
import { AgentTerminal } from "@/components/agent-terminal";
import { buildAgentScenarios, type AgentScenario } from "@/lib/agent/scenarios";
import {
  firewallResultLine,
  type LogEntry,
  type LogSource,
  type LogTone,
} from "@/lib/agent/log-formatter";
import {
  Wordmark,
  Chip,
  Dot,
  IconShield,
  IconLock,
  IconCheck,
  IconBan,
  IconBolt,
  AppNav,
  Term,
} from "@/components/ui";

// Demo on Arbitrum (where SpendPolicy is deployed + USDC + relayer gas live).
const CHAIN = ARBITRUM_CHAIN;
const USDC = CHAIN.usdcAddress;
const DEMO_MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const DEMO_AMOUNT_ATOMIC = "100000"; // 0.10 USDC per charge basis

let Magic: any = null;
let OAuthExtension: any = null;
async function loadMagic() {
  if (!Magic) {
    const m = await import("magic-sdk");
    Magic = m.Magic;
  }
  if (!OAuthExtension) {
    const o = await import("@magic-ext/oauth2");
    OAuthExtension = o.OAuthExtension;
  }
}
async function loadEthers() {
  const e = await import("ethers");
  return { BrowserProvider: e.BrowserProvider, Contract: e.Contract };
}

async function resolveEoa(magic: any): Promise<string | null> {
  for (const method of ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const accounts = await magic.rpcProvider.request({ method });
      if (accounts?.[0]) return accounts[0];
    } catch {
      /* next */
    }
  }
  return null;
}

function fmt(atomic: bigint) {
  const n = Number(formatUnits(atomic, 6));
  return `${n % 1 === 0 ? n : n.toFixed(2)} USDC`;
}

export default function FirewallPage() {
  const spendPolicy = getSpendPolicyAddress(CHAIN.chainId);
  const deployed = spendPolicy !== "0x0000000000000000000000000000000000000000";

  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{ mandate: PaymentMandate; preset: MandatePreset } | null>(null);
  const [armed, setArmed] = useState<{ mandate: PaymentMandate; signature: string } | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [blockPulse, setBlockPulse] = useState(0);
  const [settleTick, setSettleTick] = useState(0);
  const [agentLog, setAgentLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const append = useCallback(
    (source: LogSource, message: string, tone: LogTone, txUrl?: string) => {
      setAgentLog((prev) => [...prev, { ts: Date.now(), source, message, tone, txUrl }]);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || !deployed) return;
    loadMagic().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      // Pin Magic to the demo chain, otherwise it defaults to Ethereum mainnet and the
      // approve/revoke txs get sent on the wrong chain (where the EOA has 0 ETH).
      // OAuthExtension is required for the "Continue with Google" button.
      setMagic(
        new Magic(key, {
          network: { rpcUrl: getPublicRpcUrl(CHAIN), chainId: CHAIN.chainId },
          extensions: [new OAuthExtension()],
        })
      );
    });
  }, [deployed]);

  // Auto-detect an existing Magic session (set by a prior email login or a Google
  // OAuth round-trip via /auth/callback). Without this, a returning user — including
  // the one that just completed Google sign-in — would see the login UI again.
  useEffect(() => {
    if (!magic) return;
    let cancelled = false;
    (async () => {
      try {
        const isLoggedIn = await magic.user.isLoggedIn();
        if (cancelled || !isLoggedIn) return;
        const eoa = await resolveEoa(magic);
        if (cancelled || !eoa) return;
        setAddress(eoa);
        append("USER", `Restored Magic session (${eoa.slice(0, 6)}…${eoa.slice(-4)})`, "info");
      } catch {
        // No active session; render the login UI as usual.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magic, append]);

  const connect = useCallback(async () => {
    if (!magic || !email) return;
    setBusy("Signing in…");
    setError(null);
    try {
      await magic.auth.loginWithMagicLink({ email });
      const eoa = await resolveEoa(magic);
      if (!eoa) throw new Error("No address from Magic");
      setAddress(eoa);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }, [magic, email]);

  const arm = useCallback(async () => {
    if (!magic || !address || !chosen) return;
    setBusy("Arming: sign mandate + approve SpendPolicy…");
    setError(null);
    try {
      const { BrowserProvider, Contract } = await loadEthers();
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();

      // 1) sign the EIP-712 mandate (off-chain, gasless)
      const typed = buildMandateTypedData(chosen.mandate, spendPolicy);
      const signature = await signer.signTypedData(
        typed.domain,
        typed.types as unknown as Record<string, Array<{ name: string; type: string }>>,
        typed.message
      );

      // 2) approve SpendPolicy to pull up to the total cap (one tx)
      const usdc = new Contract(USDC, ERC20_APPROVE_ABI as any, signer);
      const tx = await usdc.approve(spendPolicy, chosen.mandate.totalCap);
      await tx.wait();

      setArmed({ mandate: chosen.mandate, signature });
      setRevoked(false);
      setAgentLog([]);
      append("USER", `Mandate armed — your AI agent may spend up to ${fmt(chosen.mandate.totalCap)} within the leash.`, "ok");
    } catch (e: any) {
      setError(e.message ?? "Arming failed");
    } finally {
      setBusy(null);
    }
  }, [magic, address, chosen, spendPolicy, append]);

  const runScenario = useCallback(
    async (scenario: AgentScenario) => {
      if (!armed || running) return;
      setRunning(true);
      setError(null);
      append("AGENT", scenario.preflight, "info");
      try {
        const res = await fetch("/api/mandates/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandate: toRawMandate(armed.mandate),
            signature: armed.signature,
            amount: scenario.amountAtomic.toString(),
          }),
        });
        const data = await res.json();
        if (data.ok) {
          const line = firewallResultLine({
            kind: "ok",
            amountDisplay: fmt(scenario.amountAtomic),
            txUrl: getExplorerTxUrl(CHAIN, data.txHash),
          });
          append("FIREWALL", line.message, line.tone, line.txUrl);
          setSettleTick((n) => n + 1);
        } else if (data.blocked) {
          const line = firewallResultLine({ kind: "blocked", reason: data.reason });
          append("FIREWALL", line.message, line.tone);
          setBlockPulse((n) => n + 1);
        } else {
          const line = firewallResultLine({ kind: "error", message: data.error ?? "Charge failed" });
          append("FIREWALL", line.message, line.tone);
        }
      } catch (e: any) {
        const line = firewallResultLine({ kind: "error", message: e?.message ?? "Network error" });
        append("FIREWALL", line.message, line.tone);
      } finally {
        setRunning(false);
      }
    },
    [armed, running, append]
  );

  const revoke = useCallback(async () => {
    if (!magic || !armed) return;
    setBusy("Revoking mandate…");
    setError(null);
    try {
      const { BrowserProvider, Contract } = await loadEthers();
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const policy = new Contract(spendPolicy, SPEND_POLICY_ABI as any, signer);
      append("USER", "Revoke signed.", "info");
      const tx = await policy.revoke(toContractMandate(armed.mandate));
      await tx.wait();
      setRevoked(true);
      append(
        "FIREWALL",
        "Mandate revoked on-chain. Agent disarmed — further charges will revert.",
        "blocked",
        getExplorerTxUrl(CHAIN, tx.hash)
      );
    } catch (e: any) {
      setError(e.message ?? "Revoke failed");
    } finally {
      setBusy(null);
    }
  }, [magic, armed, spendPolicy, append]);

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark href="/" />
          <div className="flex items-center gap-2">
            <span className="op-chip">
              <IconShield className="h-3.5 w-3.5" /> Permission Firewall
            </span>
            {address ? <SignOutButton magic={magic} /> : null}
          </div>
        </header>

        <AppNav active="/firewall" className="mb-5" />

        <div className="op-card op-animate-rise p-6 sm:p-7">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verify/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-verify" />
              </span>
              <p className="op-eyebrow">Live enforcement · on-chain</p>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">
              Consent your AI agent can&apos;t break
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign one scoped{" "}
              <Term def="A spending permission you sign once: which merchant, how much per charge, per day, in total, and until when — revocable anytime.">mandate</Term>
              . A merchant or agent can then charge — but only inside the limits you approved.
              Everything else reverts on-chain. Revoke anytime.
            </p>
          </div>

          {!deployed ? (
            <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4 text-sm text-ink2">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <IconLock className="h-4 w-4 text-gold" /> SpendPolicy not deployed yet
              </p>
              <p className="mt-1.5 text-muted">
                Set <span className="font-mono text-xs">NEXT_PUBLIC_SPEND_POLICY_ADDRESS</span> after
                deploying (<span className="font-mono text-xs">pnpm deploy:spend-policy:base</span>) to
                enable live arming, charges, and revocation.
              </p>
            </div>
          ) : !address ? (
            <div className="space-y-4">
              <LoginWithGoogleButton magic={magic} returnTo="/firewall" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                <span className="h-px flex-1 bg-line" />
                <span>or with email</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <label htmlFor="fw-email" className="block text-sm font-medium text-ink">
                Email to sign in
              </label>
              <input
                id="fw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="op-input"
              />
              <button onClick={connect} disabled={!email || !!busy} className="op-btn-primary w-full">
                {busy ?? "Sign in with Magic"}
              </button>
              <MagicLoginReassurance />
            </div>
          ) : !armed ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-paper2 p-4">
                <p className="op-eyebrow">Connected · Magic</p>
                <p className="mt-1 font-mono text-sm text-ink2">
                  {address.slice(0, 10)}…{address.slice(-6)}
                </p>
              </div>
              <p className="rounded-2xl border border-line bg-paper2 p-3 text-xs leading-relaxed text-muted">
                A live charge settles in USDC on Arbitrum from your account. Exploring without funds?{" "}
                <Link href="/demo-replay" className="op-link">Watch the labeled replay</Link> — every
                beat, with the same proof links.
              </p>
              <PermissionFirewall
                merchantAddress={DEMO_MERCHANT}
                tokenAddress={USDC}
                chainId={CHAIN.chainId}
                amountAtomic={DEMO_AMOUNT_ATOMIC}
                symbol="USDC"
                decimals={6}
                payerAddress={address}
                onMandateChange={(mandate, preset) => setChosen({ mandate, preset })}
              />
              {chosen ? <MandateCard mandate={chosen.mandate} /> : null}
              <button onClick={arm} disabled={!chosen || !!busy} className="op-btn-primary w-full">
                {busy ?? "Arm this permission"}
              </button>
            </div>
          ) : (
            <ArmedPanel
              mandate={armed.mandate}
              chainId={CHAIN.chainId}
              revoked={revoked}
              busy={busy}
              running={running}
              agentLog={agentLog}
              onRunScenario={runScenario}
              onRevoke={revoke}
              protectedPulse={blockPulse}
              refreshSignal={settleTick}
            />
          )}

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function ArmedPanel({
  mandate,
  chainId,
  revoked,
  busy,
  running,
  agentLog,
  onRunScenario,
  onRevoke,
  protectedPulse,
  refreshSignal,
}: {
  mandate: PaymentMandate;
  chainId: number;
  revoked: boolean;
  busy: string | null;
  running: boolean;
  agentLog: LogEntry[];
  onRunScenario: (scenario: AgentScenario) => void;
  onRevoke: () => void;
  protectedPulse: number;
  refreshSignal: number;
}) {
  const scenarios = buildAgentScenarios(mandate.maxPerCharge);
  const mandateId = computeMandateId(mandate);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left: the leash — mandate state + budget + revoke */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-verify/30 bg-verify-soft/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <IconCheck className="h-4 w-4 text-verify" /> Permission armed
            {revoked ? <Chip>Revoked</Chip> : <Chip tone="verify">Active</Chip>}
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="Max per charge" value={fmt(mandate.maxPerCharge)} />
            <Row label="Daily limit" value={mandate.maxPerDay > BigInt(0) ? fmt(mandate.maxPerDay) : "—"} />
            <Row label="Total cap" value={fmt(mandate.totalCap)} />
          </dl>
          <p className="mt-2 font-mono text-[11px] text-faint">mandate {mandateId.slice(0, 14)}…</p>
        </div>

        <BudgetHud chainId={chainId} mandate={mandate} protectedPulse={protectedPulse} refreshSignal={refreshSignal} />

        <button onClick={onRevoke} disabled={!!busy || running || revoked} className="op-btn-ghost w-full justify-center">
          <IconLock className="h-4 w-4" /> {revoked ? "Revoked" : "Revoke permission"}
        </button>
        {busy ? <p className="text-center text-sm text-muted">{busy}</p> : null}
      </div>

      {/* Right: the agent — autonomous actions + on-chain verdicts */}
      <div className="space-y-3">
        <p className="op-eyebrow">Autonomous agent</p>
        <AgentTerminal entries={agentLog} />
        <div className="space-y-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => onRunScenario(s)}
              disabled={running || revoked}
              className="op-btn-secondary w-full justify-center"
            >
              {s.expectBlocked ? (
                <IconBan className="h-4 w-4 text-danger" />
              ) : (
                <IconBolt className="h-4 w-4 text-gold" />
              )}
              {s.buttonLabel}
            </button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          The agent calls the same on-chain firewall a real one would. Over-cap attempts revert in
          simulation — no funds move and no gas is spent.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted">
        <Dot tone="gold" /> {label}
      </dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
