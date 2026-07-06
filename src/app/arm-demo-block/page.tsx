"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Wordmark, IconCheck, IconShield } from "@/components/ui";
import { LoginWithGoogleButton, SignOutButton } from "@/components/login-with-google";
import { buildMandateTypedData, getSpendPolicyAddress } from "@/lib/mandates/mandate";
import { DEMO_BLOCK_MANDATE, DEMO_BLOCK_PAYER } from "@/lib/demo/firewall-block";
import { getPublicRpcUrl, ARBITRUM_CHAIN } from "@/lib/config/payment";

/**
 * One-time signer for the walletless "guided live" firewall block (/try). The demo PAYER logs in
 * via Magic and signs the exact fixed DEMO_BLOCK_MANDATE; copy the printed signature into
 * DEMO_BLOCK_SIGNATURE (env). Intentionally NOT gated behind the debug flag (it moves no funds and
 * only the payer's own signature is usable), and NOT under /debug/* so it doesn't contradict the
 * R18 "debug routes are disabled in prod" invariant. Removed after the demo is armed.
 */

let Magic: any = null;
let OAuthExtension: any = null;
async function loadMagic() {
  if (!Magic) Magic = (await import("magic-sdk")).Magic;
  if (!OAuthExtension) OAuthExtension = (await import("@magic-ext/oauth2")).OAuthExtension;
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

export default function ArmDemoBlockPage() {
  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadMagic().then(() => {
      setMagic(
        new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
          network: { rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN), chainId: ARBITRUM_CHAIN.chainId },
          extensions: [new OAuthExtension()],
        }),
      );
    });
  }, []);

  useEffect(() => {
    if (!magic) return;
    (async () => {
      try {
        if (await magic.user.isLoggedIn()) {
          const eoa = await resolveEoa(magic);
          if (eoa) setAddress(eoa);
        }
      } catch {
        /* no session */
      }
    })();
  }, [magic]);

  const connect = useCallback(async () => {
    if (!magic || !email) return;
    setBusy("Signing in…");
    setError(null);
    try {
      await magic.auth.loginWithMagicLink({ email });
      setAddress(await resolveEoa(magic));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }, [magic, email]);

  const sign = useCallback(async () => {
    if (!magic) return;
    setBusy("Signing the demo mandate…");
    setError(null);
    setSignature(null);
    setRecovered(null);
    try {
      const { BrowserProvider, verifyTypedData } = await import("ethers");
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const spendPolicy = getSpendPolicyAddress(DEMO_BLOCK_MANDATE.chainId);
      const typed = buildMandateTypedData(DEMO_BLOCK_MANDATE, spendPolicy);
      const sig = await signer.signTypedData(
        typed.domain,
        typed.types as unknown as Record<string, Array<{ name: string; type: string }>>,
        typed.message,
      );
      setSignature(sig);
      const rec = verifyTypedData(typed.domain as any, typed.types as any, typed.message as any, sig);
      setRecovered(rec);
    } catch (e: any) {
      setError(e.message ?? "sign failed");
    } finally {
      setBusy(null);
    }
  }, [magic]);

  const isPayer = address?.toLowerCase() === DEMO_BLOCK_PAYER.toLowerCase();
  const recoveredOk = recovered?.toLowerCase() === DEMO_BLOCK_PAYER.toLowerCase();

  return (
    <main className="op-shell px-5 py-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          {address ? <SignOutButton magic={magic} /> : null}
        </header>

        <div className="op-card p-6">
          <span className="op-eyebrow">Arm the walletless demo</span>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Sign the demo block mandate</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Log in as the demo payer (
            <span className="font-mono text-xs">{DEMO_BLOCK_PAYER.slice(0, 10)}…{DEMO_BLOCK_PAYER.slice(-6)}</span>
            ) and sign the fixed demo mandate. It moves no funds and costs no gas — it&rsquo;s a plain
            EIP-712 signature. Copy the result into <span className="font-mono text-xs">DEMO_BLOCK_SIGNATURE</span>.
          </p>

          {!address ? (
            <div className="mt-5 space-y-3">
              <LoginWithGoogleButton magic={magic} returnTo="/arm-demo-block" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="payer email"
                className="op-input"
              />
              <button onClick={connect} disabled={!email || !!busy} className="op-btn-secondary w-full">
                {busy ?? "Sign in with email"}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="flex items-center gap-2 text-sm">
                <span className={isPayer ? "text-verify" : "text-danger"}>
                  {isPayer ? <IconCheck className="inline h-4 w-4" /> : "⚠"}
                </span>
                <span className="font-mono text-xs text-ink2">{address}</span>
                {isPayer ? null : <span className="text-danger">not the demo payer</span>}
              </p>
              <button onClick={sign} disabled={!!busy || !isPayer} className="op-btn-primary w-full">
                <IconShield className="h-4 w-4" /> {busy ?? "Sign the demo mandate"}
              </button>
            </div>
          )}

          {signature ? (
            <div className="mt-5 rounded-2xl border border-line bg-paper2 p-4">
              <p className="op-eyebrow">Signature (copy to DEMO_BLOCK_SIGNATURE)</p>
              <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-ink2">{signature}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs">
                {recoveredOk ? (
                  <>
                    <IconCheck className="h-3.5 w-3.5 text-verify" />{" "}
                    <span className="text-verify">Recovers to the payer — valid.</span>
                  </>
                ) : (
                  <span className="text-danger">Recovered {recovered ?? "?"} ≠ payer — do not use.</span>
                )}
              </p>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/try" className="op-link">/try</Link> uses this signature (server-side) to
          simulate the over-cap block for anyone, no wallet.
        </p>
      </div>
    </main>
  );
}
