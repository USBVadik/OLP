"use client";

import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { ARBITRUM_CHAIN, BASE_CHAIN, getPublicRpcUrl } from "@/lib/config/payment";
import { getSpendPolicyAddress } from "@/lib/mandates/mandate";
import {
  ARBITRUM_ONE_CHAIN_ID,
  buildExpenseCardArmIntent,
} from "@/lib/particle/expense-card-arm";
import { summarizeCrossChainPreview } from "@/lib/particle/cross-chain-proof";
import { createUniversal7702Account } from "@/lib/particle/universal-account";

let MagicCtor: any = null;
let EVMExtensionCtor: any = null;

async function loadMagic() {
  if (MagicCtor && EVMExtensionCtor) return;
  const [magicModule, evmModule] = await Promise.all([
    import("magic-sdk"),
    import("@magic-ext/evm"),
  ]);
  MagicCtor = magicModule.Magic;
  EVMExtensionCtor = evmModule.EVMExtension;
}

async function resolveMagicEoa(magic: any): Promise<string | null> {
  try {
    const metadata = await magic.user.getInfo();
    const address = metadata?.publicAddress ?? metadata?.wallets?.ethereum?.publicAddress;
    if (address) return address;
  } catch {
    // Fall through to the provider account read.
  }

  try {
    const accounts = await magic.rpcProvider.request({ method: "eth_accounts" });
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

function userOpFacts(transaction: any) {
  const entries = transaction?.userOps ?? transaction?.data?.userOps ?? [];
  return entries.map((entry: any) => {
    const userOp = entry?.userOp ?? {};
    const auth = userOp?.eip7702Auth ?? entry?.eip7702Auth;
    return {
      chainId: entry?.chainId ?? null,
      hasEip7702Auth: Boolean(auth),
      eip7702Delegated:
        auth?.eip7702Delegated ?? userOp?.eip7702Delegated ?? entry?.eip7702Delegated ?? null,
    };
  });
}

function chainLabel(chainId: number) {
  if (chainId === BASE_CHAIN.chainId) return "Base";
  if (chainId === ARBITRUM_CHAIN.chainId) return "Arbitrum";
  return `Chain ${chainId}`;
}

export default function UaExpenseCardProbePage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true";
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("2.00");
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [ua, setUa] = useState<any>(null);
  const [assets, setAssets] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spendPolicyAddress = getSpendPolicyAddress(ARBITRUM_ONE_CHAIN_ID);
  const previewSummary = useMemo(
    () => (preview ? summarizeCrossChainPreview(preview) : null),
    [preview]
  );
  const ops = useMemo(() => (preview ? userOpFacts(preview) : []), [preview]);

  const connect = useCallback(async () => {
    setBusy("Connecting Magic + Particle UA…");
    setError(null);
    setPreview(null);
    try {
      await loadMagic();
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
      if (!key) throw new Error("Missing Magic publishable key");

      const magic = new MagicCtor(key, {
        extensions: [
          new EVMExtensionCtor([
            {
              rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN),
              chainId: ARBITRUM_CHAIN.chainId,
              default: true,
            },
            {
              rpcUrl: getPublicRpcUrl(BASE_CHAIN),
              chainId: BASE_CHAIN.chainId,
            },
          ]),
        ],
      });

      const loggedIn = await magic.user.isLoggedIn();
      if (!loggedIn) {
        if (!email.trim()) throw new Error("Enter the Magic email for this local probe");
        await magic.auth.loginWithEmailOTP({ email: email.trim() });
      }

      const eoa = await resolveMagicEoa(magic);
      if (!eoa) throw new Error("Magic did not return an EVM address");
      const account = createUniversal7702Account(eoa);
      const primaryAssets = await account.getPrimaryAssets();

      setOwnerAddress(eoa);
      setUa(account);
      setAssets(primaryAssets);
    } catch (cause: any) {
      setError(cause?.message ?? "Could not initialize the build-only probe");
    } finally {
      setBusy(null);
    }
  }, [email]);

  const buildPreview = useCallback(async () => {
    if (!ua) return;
    setBusy("Building unsigned Particle preview…");
    setError(null);
    setPreview(null);
    try {
      const amountAtomic = parseUnits(amount, 6);
      const intent = buildExpenseCardArmIntent({
        chainId: ARBITRUM_ONE_CHAIN_ID,
        tokenAddress: ARBITRUM_CHAIN.usdcAddress,
        spendPolicyAddress,
        amountAtomic,
        totalCapAtomic: 10_000_000n,
      });
      const transaction = await ua.createUniversalTransaction(intent.request, intent.options);
      setPreview(transaction);
    } catch (cause: any) {
      setError(cause?.message ?? "Particle could not build the Expense Card preview");
    } finally {
      setBusy(null);
    }
  }, [amount, spendPolicyAddress, ua]);

  if (!enabled) {
    return (
      <main className="op-shell px-5 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-line bg-paper p-6">
          <p className="op-eyebrow">Debug-only route</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Probe disabled</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Set <code>NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true</code> in a local environment to build
            unsigned Particle previews.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="op-shell px-5 py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <p className="op-eyebrow">Local build-only experiment</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            UA-funded Expense Card probe
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Tests whether Particle can prepare an Arbitrum SpendPolicy allowance from unified USDC.
            This page creates an unsigned preview only. It cannot approve, sign, or broadcast.
          </p>
        </header>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="op-input"
              placeholder="Magic email (only needed when signed out)"
              aria-label="Magic email"
            />
            <button type="button" onClick={connect} disabled={Boolean(busy)} className="op-btn-primary">
              {ownerAddress ? "Refresh account" : "Connect account"}
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Magic EOA / UA owner</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink2">
                {ownerAddress ?? "Not connected"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Approval target</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink2">{spendPolicyAddress}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="text-sm font-medium text-ink">
              Preview card funding amount
              <span className="mt-1 flex items-center rounded-xl border border-line bg-paper2 px-3">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  aria-label="USDC amount"
                />
                <span className="text-sm text-muted">USDC</span>
              </span>
            </label>
            <button type="button" onClick={buildPreview} disabled={!ua || Boolean(busy)} className="op-btn-primary">
              Build preview only
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Maximum for this probe is the demo mandate total cap: 10 USDC. No wallet signature is
            requested after Particle returns the preview.
          </p>
        </section>

        {busy ? <p role="status" className="text-sm text-ink2">{busy}</p> : null}
        {error ? <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}

        {previewSummary ? (
          <section className="rounded-2xl border border-verify/30 bg-verify-soft p-5">
            <p className="op-eyebrow">Unsigned Particle result</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              {previewSummary.rootHashPresent ? "Preview created" : "Preview incomplete"}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Fact label="rootHash" value={previewSummary.rootHashPresent ? "present" : "missing"} />
              <Fact label="Cross-chain candidate" value={previewSummary.crossChainCandidate ? "yes" : "no"} />
              <Fact
                label="Funding sources"
                value={previewSummary.tokenChangeFromChains.map(chainLabel).join(" + ") || "not reported"}
              />
              <Fact
                label="Destination chains"
                value={previewSummary.tokenChangeToChains.map(chainLabel).join(" + ") || "not reported"}
              />
              <Fact label="User-op chains" value={previewSummary.userOpChainIds.map(chainLabel).join(" + ") || "none"} />
              <Fact label="Fee quotes" value={preview?.feeQuotes ? "present" : "missing"} />
              <Fact label="Token changes" value={preview?.tokenChanges ? "present" : "missing"} />
              <Fact
                label="7702 authorization"
                value={ops.some((op: any) => op.hasEip7702Auth) ? "required in preview" : "not required"}
              />
            </dl>
            <details className="mt-4 rounded-xl border border-line bg-paper/70 p-3">
              <summary className="cursor-pointer text-sm font-medium text-ink">Raw preview and primary assets</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs text-ink2">
                {JSON.stringify({ preview, userOps: ops, primaryAssets: assets }, null, 2)}
              </pre>
            </details>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
