"use client";

import { useCallback, useEffect, useState } from "react";
import { ARBITRUM_CHAIN, getPublicRpcUrl } from "@/lib/config/payment";
import { LoginWithGoogleButton, MagicLoginReassurance, SignOutButton } from "@/components/login-with-google";
import { ReceiveCard } from "@/components/receive-card";
import { UniversalBalanceCard } from "@/components/universal-balance-card";
import { summarizeUniversalBalance, type UniversalBalanceSummary } from "@/lib/particle/assets";
import { Wordmark, Chip, AppNav, IconBolt, Term } from "@/components/ui";

// Read-only consumer wallet view: log in, see one balance across chains, receive on any chain.
// No transactions are signed here — it's the "receive into one balance" face of the UA.
const CHAIN = ARBITRUM_CHAIN;

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
          network: { rpcUrl: getPublicRpcUrl(CHAIN), chainId: CHAIN.chainId },
          extensions: [new OAuthExtension()],
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
            <p className="op-eyebrow">Universal Account</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              One balance. Receive on any chain.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your account holds a single USDC balance across every supported chain — powered by
              Particle{" "}
              <Term def="A Particle account that gives you one balance across many chains — no bridging or picking a network.">Universal Accounts</Term>
              . Get paid on Base, Arbitrum, Solana, or anywhere else, and it all arrives as one
              balance. No bridging, no chain to choose.
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
              <ReceiveCard address={address} />
            </div>
          )}

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <Chip>read-only</Chip>
          <span>this view never moves funds — it shows your balance and receive address</span>
        </div>
      </div>
    </main>
  );
}
