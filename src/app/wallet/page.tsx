"use client";

import { useCallback, useEffect, useState } from "react";
import { ARBITRUM_CHAIN, BASE_CHAIN, getPublicRpcUrl } from "@/lib/config/payment";
import { LoginWithGoogleButton, MagicLoginReassurance, SignOutButton } from "@/components/login-with-google";
import { ReceiveCard } from "@/components/receive-card";
import { UniversalBalanceCard } from "@/components/universal-balance-card";
import { WithdrawForecastCard } from "@/components/withdraw-forecast-card";
import { AccountModeCard } from "@/components/account-mode-card";
import { summarizeUniversalBalance, type UniversalBalanceSummary } from "@/lib/particle/assets";
import { Wordmark, Chip, AppNav, IconBolt, Term } from "@/components/ui";

// Consumer wallet view: log in, see one balance across chains, receive on any chain, and manage the
// account itself (revert the EIP-7702 delegation to a plain wallet). Only the Account panel signs a
// (fundless) delegation-clearing Type-4 tx; the balance + receive parts stay read-only.

let Magic: any = null;
let OAuthExtension: any = null;
let EVMExtension: any = null;
async function loadMagic() {
  if (!Magic) {
    const m = await import("magic-sdk");
    Magic = m.Magic;
  }
  if (!EVMExtension) {
    const e = await import("@magic-ext/evm");
    EVMExtension = e.EVMExtension;
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

export default function WalletPage() {
  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<UniversalBalanceSummary | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceReloadKey, setBalanceReloadKey] = useState(0);

  const reloadBalance = useCallback(() => setBalanceReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadMagic().then(() => {
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      setMagic(
        new Magic(key, {
          // The EVM extension enables the 7702 signing surface (sign7702Authorization /
          // send7702Transaction / evm.switchChain) the Account panel needs to revert delegation.
          // Mirrors the proven /pay init (Base default + Arbitrum).
          extensions: [
            new EVMExtension([
              { rpcUrl: getPublicRpcUrl(BASE_CHAIN), chainId: BASE_CHAIN.chainId, default: true },
              { rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN), chainId: ARBITRUM_CHAIN.chainId },
            ]),
            new OAuthExtension(),
          ],
        })
      );
    });
  }, []);

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

  // Read-only Particle Universal Account balance, aggregated across chains (no tx, no gas).
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

  return (
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark href="/" />
          <div className="flex items-center gap-2">
            <span className="op-chip">
              <IconBolt className="h-3.5 w-3.5" /> Wallet
            </span>
            {address ? <SignOutButton magic={magic} /> : null}
          </div>
        </header>

        <AppNav active="/wallet" className="mb-5" />

        <div className="op-card op-animate-rise p-6 sm:p-7">
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="op-eyebrow">Universal Account</p>
              <span className="op-chip-iris">Powered by Particle</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
              One balance. <span className="text-iris">Receive on any EVM chain.</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your account holds a single USDC balance across Particle-supported chains — powered by
              Particle{" "}
              <Term def="A Particle account that gives you one balance across many chains — no bridging or picking a network.">Universal Accounts</Term>
              . Get paid on Base, Arbitrum, or any supported EVM chain at your address, and it
              arrives as one balance. No bridging, no chain to choose.
            </p>
          </div>

          {!address ? (
            <div className="space-y-4">
              <LoginWithGoogleButton magic={magic} returnTo="/wallet" variant="primary" />
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                <span className="h-px flex-1 bg-line" />
                <span>or with email</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <input
                id="wallet-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="op-input"
              />
              <button onClick={connect} disabled={!email || !!busy} className="op-btn-secondary w-full justify-center">
                {busy ?? "Sign in with Magic"}
              </button>
              <MagicLoginReassurance />
            </div>
          ) : (
            <div className="space-y-4">
              <UniversalBalanceCard
                summary={balanceSummary}
                loading={balanceLoading}
                error={balanceError}
                onRetry={reloadBalance}
              />
              {balanceSummary && balanceSummary.totalUsd > 0 ? (
                <WithdrawForecastCard summary={balanceSummary} />
              ) : null}
              <ReceiveCard address={address} />
              <AccountModeCard magic={magic} address={address} />
            </div>
          )}

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Chip>non-custodial</Chip>
          <span>your balance, receive address, and account controls — the key stays yours</span>
        </div>
      </div>
    </main>
  );
}
