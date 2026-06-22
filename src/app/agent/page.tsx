"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, type Address } from "viem";
import { ARBITRUM_CHAIN, getExplorerTxUrl, getPublicRpcUrl } from "@/lib/config/payment";
import { ERC20_APPROVE_ABI } from "@/lib/contracts/receipt-emitter";
import {
  buildMandateTypedData,
  deriveMandate,
  getSpendPolicyAddress,
  toRawMandate,
} from "@/lib/mandates/mandate";
import { type PaymentMandate } from "@/lib/mandates/types";
import { listResources, type X402Resource } from "@/lib/x402/catalog";
import { LoginWithGoogleButton } from "@/components/login-with-google";
import { AgentTerminal } from "@/components/agent-terminal";
import { BudgetHud } from "@/components/budget-hud";
import { MandateCard } from "@/components/mandate-card";
import {
  firewallResultLine,
  type LogEntry,
  type LogSource,
  type LogTone,
} from "@/lib/agent/log-formatter";
import { Wordmark, Chip, IconBolt, IconCheck, IconBan, IconLock } from "@/components/ui";
import { UniversalBalanceCard } from "@/components/universal-balance-card";
import { summarizeUniversalBalance, type UniversalBalanceSummary } from "@/lib/particle/assets";

// Demo on Arbitrum (where SpendPolicy + USDC + relayer gas live).
const CHAIN = ARBITRUM_CHAIN;
const USDC = CHAIN.usdcAddress;
const DEMO_MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const AGENT_BASIS = 100_000n; // 0.10 USDC per-charge basis -> agent_budget caps

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
let UniversalAccount: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;
async function loadParticle() {
  if (!UniversalAccount) {
    const p = await import("@particle-network/universal-account-sdk");
    UniversalAccount = p.UniversalAccount;
    UNIVERSAL_ACCOUNT_VERSION = p.UNIVERSAL_ACCOUNT_VERSION;
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

export default function AgentPage() {
  const spendPolicy = getSpendPolicyAddress(CHAIN.chainId);
  const deployed = spendPolicy !== "0x0000000000000000000000000000000000000000";

  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [armed, setArmed] = useState<{ mandate: PaymentMandate; signature: string } | null>(null);
  const [agentLog, setAgentLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [bought, setBought] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<UniversalBalanceSummary | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceReloadKey, setBalanceReloadKey] = useState(0);

  const append = useCallback(
    (source: LogSource, message: string, tone: LogTone, txUrl?: string) => {
      setAgentLog((prev) => [...prev, { ts: Date.now(), source, message, tone, txUrl }]);
    },
    []
  );

  // Manual re-trigger for the read-only balance (Particle reads can flake mid-demo).
  const reloadBalance = useCallback(() => setBalanceReloadKey((k) => k + 1), []);

  // A stable agent_budget mandate preview derived once we know the payer address.
  const chosen = useMemo<PaymentMandate | null>(() => {
    if (!address) return null;
    return deriveMandate({
      payer: address as Address,
      merchant: DEMO_MERCHANT,
      token: USDC,
      chainId: CHAIN.chainId,
      invoiceAmount: AGENT_BASIS,
      preset: "agent_budget",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined" || !deployed) return;
    loadMagic().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      setMagic(
        new Magic(key, {
          network: { rpcUrl: getPublicRpcUrl(CHAIN), chainId: CHAIN.chainId },
          extensions: [new OAuthExtension()],
        })
      );
    });
  }, [deployed]);

  // Restore an existing Magic session (email or Google OAuth round-trip).
  useEffect(() => {
    if (!magic) return;
    let cancelled = false;
    (async () => {
      try {
        if (!(await magic.user.isLoggedIn())) return;
        const eoa = await resolveEoa(magic);
        if (cancelled || !eoa) return;
        setAddress(eoa);
      } catch {
        /* no session */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magic]);

  // Read-only Particle Universal Account balance (the chain-abstraction showcase).
  // getPrimaryAssets aggregates the wallet's balance across chains — no tx, no gas.
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setBalanceLoading(true);
    setBalanceError(null);
    (async () => {
      try {
        await loadParticle();
        const ua = new UniversalAccount({
          projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
          projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
          projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
          smartAccountOptions: {
            useEIP7702: true,
            name: "UNIVERSAL",
            version: UNIVERSAL_ACCOUNT_VERSION,
            ownerAddress: address,
          },
          tradeConfig: { slippageBps: 100, universalGas: false },
        });
        const raw = await ua.getPrimaryAssets();
        if (cancelled) return;
        setBalanceSummary(summarizeUniversalBalance(raw));
      } catch (e: any) {
        if (!cancelled) setBalanceError(e?.message ?? "balance unavailable");
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, balanceReloadKey]);

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

      const typed = buildMandateTypedData(chosen, spendPolicy);
      const signature = await signer.signTypedData(
        typed.domain,
        typed.types as unknown as Record<string, Array<{ name: string; type: string }>>,
        typed.message
      );

      const usdc = new Contract(USDC, ERC20_APPROVE_ABI as any, signer);
      const tx = await usdc.approve(spendPolicy, chosen.totalCap);
      await tx.wait();

      setArmed({ mandate: chosen, signature });
      setAgentLog([]);
      append(
        "USER",
        `Agent armed — budget up to ${fmt(chosen.totalCap)}, ${fmt(chosen.maxPerCharge)} per call.`,
        "ok"
      );
    } catch (e: any) {
      setError(e.message ?? "Arming failed");
    } finally {
      setBusy(null);
    }
  }, [magic, address, chosen, spendPolicy, append]);

  const buy = useCallback(
    async (resource: X402Resource) => {
      if (!armed || running) return;
      setRunning(true);
      setError(null);
      const path = `/api/x402/${resource.id}`;
      try {
        // 1) Unpaid request -> expect 402 + payment requirements (the x402 handshake).
        append("AGENT", `GET ${path} — requesting resource…`, "info");
        const unpaid = await fetch(path);
        if (unpaid.status !== 402) {
          append("AGENT", `Unexpected ${unpaid.status} (expected 402 Payment Required).`, "error");
          return;
        }
        const body = await unpaid.json();
        const reqs = body?.accepts?.[0];
        if (!reqs) {
          append("FIREWALL", "402 had no payment requirements.", "error");
          return;
        }
        append(
          "FIREWALL",
          `402 Payment Required — ${fmt(BigInt(reqs.maxAmountRequired))} to ${reqs.payTo.slice(0, 6)}…${reqs.payTo.slice(-4)}`,
          "info"
        );

        // 2) Pay within the mandate (relayer charges SpendPolicy; over-cap reverts here).
        append("AGENT", `Paying ${fmt(resource.priceAtomic)} within mandate…`, "info");
        const chargeRes = await fetch("/api/mandates/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandate: toRawMandate(armed.mandate),
            signature: armed.signature,
            amount: resource.priceAtomic.toString(),
          }),
        });
        const charge = await chargeRes.json();
        if (!charge.ok) {
          if (charge.blocked) {
            const line = firewallResultLine({ kind: "blocked", reason: charge.reason });
            append("FIREWALL", line.message, line.tone);
            append("AGENT", `Access denied — over budget. ${resource.title} not delivered.`, "error");
          } else {
            const line = firewallResultLine({ kind: "error", message: charge.error ?? "charge failed" });
            append("FIREWALL", line.message, line.tone);
          }
          return;
        }
        append(
          "FIREWALL",
          `Charged ${fmt(resource.priceAtomic)}. Settled to merchant.`,
          "ok",
          getExplorerTxUrl(CHAIN, charge.txHash)
        );

        // 3) Retry with the on-chain proof; poll briefly while the tx mines.
        const proof = {
          scheme: "onelink-mandate",
          txHash: charge.txHash,
          amount: resource.priceAtomic.toString(),
          asset: USDC,
          payTo: reqs.payTo,
          resource: path,
        };
        const xPayment = btoa(JSON.stringify(proof));
        append("AGENT", `GET ${path} (paid) — retrying with proof…`, "info");

        for (let attempt = 0; attempt < 6; attempt++) {
          const paid = await fetch(path, { headers: { "X-PAYMENT": xPayment } });
          if (paid.ok) {
            const data = await paid.json();
            append("AGENT", `200 OK — received ${resource.title}.`, "ok");
            setBought((prev) => ({ ...prev, [resource.id]: data.data }));
            return;
          }
          const err = await paid.json().catch(() => ({}));
          if (typeof err?.error === "string" && /not found on-chain yet/.test(err.error) && attempt < 5) {
            await new Promise((r) => setTimeout(r, 1500)); // wait for mining
            continue;
          }
          append("FIREWALL", `Resource withheld: ${err?.error ?? paid.status}`, "blocked");
          return;
        }
      } catch (e: any) {
        append("FIREWALL", `ERROR: ${e?.message ?? "network"}`, "error");
      } finally {
        setRunning(false);
      }
    },
    [armed, running, append]
  );

  const resources = listResources();

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark />
          <span className="op-chip">
            <IconBolt className="h-3.5 w-3.5" /> x402 gateway
          </span>
        </header>

        <div className="op-card op-animate-rise p-6 sm:p-7">
          <div className="mb-5">
            <p className="op-eyebrow">Agent commerce on x402</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              An agent that pays per call — on a leash
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              x402 lets an AI agent pay for any API over HTTP. OneLink Pay bounds it: every x402
              payment is settled through an on-chain mandate, so the agent can buy what it needs but
              physically cannot overspend. Over-budget requests are refused before any funds move.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="op-chip" title="Universal Accounts in EIP-7702 mode — one balance across chains">
                Particle · one balance, every chain
              </span>
              <span className="op-chip" title="Magic embedded wallet — email/Google login, your wallet is your email">
                Magic · walletless login
              </span>
              <span className="op-chip" title="Settles on Arbitrum One">
                Arbitrum · settlement
              </span>
            </div>
          </div>

          {!deployed ? (
            <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4 text-sm text-ink2">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <IconLock className="h-4 w-4 text-gold" /> SpendPolicy not deployed
              </p>
              <p className="mt-1.5 text-muted">
                Set <span className="font-mono text-xs">NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM</span>{" "}
                to enable the x402 agent demo.
              </p>
            </div>
          ) : !address ? (
            <div className="space-y-4">
              <LoginWithGoogleButton magic={magic} returnTo="/agent" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                <span className="h-px flex-1 bg-line" />
                <span>or with email</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="op-input"
              />
              <button onClick={connect} disabled={!email || !!busy} className="op-btn-primary w-full">
                {busy ?? "Connect with Magic"}
              </button>
            </div>
          ) : !armed ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-paper2 p-4">
                <p className="op-eyebrow">Connected · Magic</p>
                <p className="mt-1 font-mono text-sm text-ink2">
                  {address.slice(0, 10)}…{address.slice(-6)}
                </p>
              </div>
              <UniversalBalanceCard
                summary={balanceSummary}
                loading={balanceLoading}
                error={balanceError}
                onRetry={reloadBalance}
              />
              {chosen ? <MandateCard mandate={chosen} /> : null}
              <button onClick={arm} disabled={!chosen || !!busy} className="op-btn-primary w-full">
                {busy ?? "Arm agent budget"}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <UniversalBalanceCard
                  summary={balanceSummary}
                  loading={balanceLoading}
                  error={balanceError}
                  onRetry={reloadBalance}
                />
                <BudgetHud chainId={CHAIN.chainId} mandate={armed.mandate} />
                <div className="space-y-2">
                  <p className="op-eyebrow">Paid APIs (x402)</p>
                  {resources.map((r) => {
                    const owned = r.id in bought;
                    return (
                      <div key={r.id} className="rounded-2xl border border-line bg-paper2 p-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{r.title}</p>
                          <span className="font-mono text-xs text-ink2">{fmt(r.priceAtomic)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{r.description}</p>
                        <button
                          onClick={() => buy(r)}
                          disabled={running || owned}
                          className="op-btn-secondary mt-2 w-full justify-center"
                        >
                          {owned ? (
                            <>
                              <IconCheck className="h-4 w-4 text-verify" /> Purchased
                            </>
                          ) : r.priceAtomic > armed.mandate.maxPerCharge ? (
                            <>
                              <IconBan className="h-4 w-4 text-danger" /> Send agent (over cap)
                            </>
                          ) : (
                            <>
                              <IconBolt className="h-4 w-4 text-gold" /> Send agent to buy
                            </>
                          )}
                        </button>
                        {owned ? (
                          <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-paper p-2 text-[11px] leading-relaxed text-ink2">
                            {JSON.stringify(bought[r.id], null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="op-eyebrow">Autonomous AI agent</p>
                <AgentTerminal entries={agentLog} />
                <p className="text-xs leading-relaxed text-muted">
                  Each purchase runs the real x402 handshake: the API answers{" "}
                  <span className="font-mono">402 Payment Required</span>, the agent pays through the
                  mandate, then retries with the on-chain proof to unlock the data. Over-cap calls are
                  blocked before settlement.
                </p>
                <p className="text-[11px] leading-relaxed text-faint">
                  The agent sees one balance across chains (Particle Universal Account). Today
                  settlement runs on Arbitrum; Particle&apos;s cross-chain V2 extends the same flow to
                  spend from every chain in one transaction.
                </p>
              </div>
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-2xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Chip>x402 pattern</Chip>
          <span>settled by an on-chain spend mandate</span>
        </div>
      </div>
    </main>
  );
}
