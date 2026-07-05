"use client";

import { useCallback, useEffect, useState } from "react";
import { ARBITRUM_CHAIN, BASE_CHAIN, getExplorerTxUrl, type ChainPaymentConfig } from "@/lib/config/payment";
import { getDelegationStatus, undelegateChain, type ChainDelegation } from "@/lib/particle/delegation";
import { getKeyExportCapability, openKeyExport } from "@/lib/magic/key-export";
import { useProMode } from "@/hooks/use-pro-mode";
import { ProModeToggle } from "@/components/pro-mode-toggle";
import { Chip, Disclosure, Dot, IconArrowUpRight, IconCheck, IconShield } from "@/components/ui";

// Chains where OneLink delegates the EOA (Base + Arbitrum). The helper is chain-generic; this
// panel intentionally scopes to the two we use.
const CHAINS: ChainPaymentConfig[] = [BASE_CHAIN, ARBITRUM_CHAIN];

// Dynamically import the SDK (kept lazy, matching the wallet page) and build a read/write-capable
// UA in 7702 mode. Self-contained so this panel never refactors the balance-read path.
let UniversalAccount: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;
async function loadParticle() {
  if (!UniversalAccount) {
    const p = await import("@particle-network/universal-account-sdk");
    UniversalAccount = p.UniversalAccount;
    UNIVERSAL_ACCOUNT_VERSION = p.UNIVERSAL_ACCOUNT_VERSION;
  }
}
function buildUa(ownerAddress: string): any {
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    smartAccountOptions: {
      useEIP7702: true,
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
    },
    tradeConfig: { slippageBps: 100, universalGas: false },
  });
}

/**
 * "Account" panel on /wallet: shows, per chain, whether the address is a plain wallet or upgraded to
 * a smart account (EIP-7702 delegated), and lets the user revert to a plain wallet. This makes the
 * non-custodial truth inspectable — it's your own EOA, reversible, no vendor lock-in.
 * `magic` must be initialised with the EVM extension (sign7702Authorization / send7702Transaction).
 */
export function AccountModeCard({ magic, address }: { magic: any; address: string }) {
  const [ua, setUa] = useState<any>(null);
  const [status, setStatus] = useState<Record<number, ChainDelegation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmChainId, setConfirmChainId] = useState<number | null>(null);
  const [busyChainId, setBusyChainId] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, { txHash: string; href: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [pro] = useProMode();
  const [copied, setCopied] = useState(false);
  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the address is still shown in full for manual copy */
    }
  }, [address]);

  const refresh = useCallback(async (uaInstance: any) => {
    const s = await getDelegationStatus(uaInstance, CHAINS.map((c) => c.chainId));
    setStatus(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadParticle();
        const uaInstance = buildUa(address);
        if (cancelled) return;
        setUa(uaInstance);
        await refresh(uaInstance);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not read account status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, refresh]);

  const onRevert = useCallback(
    async (chain: ChainPaymentConfig) => {
      if (!ua || !magic) return;
      setConfirmChainId(null);
      setBusyChainId(chain.chainId);
      setError(null);
      try {
        const res = await undelegateChain(magic, ua, address, chain.chainId);
        if (res.txHash) {
          setResults((prev) => ({
            ...prev,
            [chain.chainId]: { txHash: res.txHash!, href: getExplorerTxUrl(chain, res.txHash!) },
          }));
        }
        await refresh(ua);
      } catch (e: any) {
        const raw = String(e?.message ?? "");
        setError(
          /gas|insufficient|fund|balance/i.test(raw)
            ? `Needs a little native gas on ${chain.name} to send the revert transaction. Top up and retry.`
            : raw || "Could not revert on this chain.",
        );
      } finally {
        setBusyChainId(null);
      }
    },
    [ua, magic, address, refresh],
  );

  return (
    <section className="op-card-quiet p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="op-eyebrow inline-flex items-center gap-1.5">
          <IconShield className="h-3.5 w-3.5 text-gold" /> Account
        </span>
        <div className="flex items-center gap-2">
          <Chip>your own EOA</Chip>
          <ProModeToggle />
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This is your own wallet address, upgraded in place with EIP-7702 — not a wallet we hold. You
        can revert it to a plain wallet anytime.
      </p>

      {pro ? (
        <div className="mt-3 rounded-xl border border-line bg-paper p-3">
          <p className="op-eyebrow">Your address (EOA)</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink2">{address}</code>
            <button
              type="button"
              onClick={copyAddress}
              className="op-btn-ghost shrink-0 px-2.5 py-1 text-xs"
              aria-label="Copy your address"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <dl className="mt-4 divide-y divide-line" aria-live="polite">
        {CHAINS.map((chain) => {
          const st = status?.[chain.chainId];
          const delegated = Boolean(st?.isDelegated);
          const busy = busyChainId === chain.chainId;
          const confirming = confirmChainId === chain.chainId;
          const result = results[chain.chainId];
          return (
            <div key={chain.chainId} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{chain.name}</span>
                {loading && !status ? (
                  <span className="text-xs text-faint">checking…</span>
                ) : delegated ? (
                  <Chip tone="gold">
                    <IconShield className="h-3 w-3" /> Smart account · active
                  </Chip>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Dot tone="muted" /> Plain wallet
                  </span>
                )}
              </div>

              {pro && delegated && st?.delegate ? (
                <p className="mt-1 break-all font-mono text-[11px] text-faint">
                  delegate {st.delegate}
                </p>
              ) : null}

              {delegated && !busy && !confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirmChainId(chain.chainId)}
                  className="op-link mt-1.5 text-xs"
                >
                  Revert to a plain wallet
                </button>
              ) : null}

              {!delegated && !loading ? (
                <p className="mt-1 text-xs text-faint">Arms automatically on your next payment.</p>
              ) : null}

              {confirming ? (
                <div className="mt-2 rounded-xl border border-line bg-paper2 p-3">
                  <p className="text-xs leading-relaxed text-muted">
                    Sends a small transaction on {chain.name} (needs a little native gas) that turns
                    this address back into a normal wallet. Re-armable anytime on your next payment.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => onRevert(chain)} className="op-btn-secondary px-3 py-1.5 text-xs">
                      Confirm revert
                    </button>
                    <button type="button" onClick={() => setConfirmChainId(null)} className="op-btn-ghost px-3 py-1.5 text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {busy ? <p className="mt-1.5 text-xs text-gold">Reverting on {chain.name}…</p> : null}

              {result ? (
                <a
                  href={result.href}
                  target="_blank"
                  rel="noreferrer"
                  className="op-link mt-1.5 inline-flex items-center gap-1 text-xs"
                >
                  <IconCheck className="h-3 w-3 text-verify" /> Revert tx
                  <span className="font-mono">{`${result.txHash.slice(0, 6)}…${result.txHash.slice(-4)}`}</span>
                  <IconArrowUpRight className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          );
        })}
      </dl>

      {pro ? <KeyCustodyRow magic={magic} /> : null}

      {pro ? (
        <div className="mt-3">
          <Disclosure summary="Why an embedded wallet (and not MetaMask)?">
            <div className="space-y-2 text-xs leading-relaxed text-ink2">
              <p>
                Upgrading your account in place uses an EIP-7702 authorization. Browser-extension
                wallets (MetaMask, OKX) don&rsquo;t expose that signing method yet, so they can&rsquo;t
                arm this kind of account.
              </p>
              <p>
                Magic&rsquo;s embedded wallet can sign it — while the account stays your own EOA at
                the same address. You&rsquo;re never locked in: revert to a plain wallet above, or
                export your key to hold it yourself.
              </p>
            </div>
          </Disclosure>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mt-3 rounded-xl border border-danger/25 bg-danger-soft p-3 text-xs text-danger">
          {error}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Pro-mode key-custody row. Offers Magic's HOSTED key export only if the SDK exposes it (probed,
 * fail-closed); otherwise shows the honest exit path (revert to a plain wallet). OneLink never
 * handles, stores, or logs the private key — any reveal happens entirely inside Magic's own UI.
 */
function KeyCustodyRow({ magic }: { magic: any }) {
  const cap = getKeyExportCapability(magic);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const onExport = useCallback(async () => {
    setBusy(true);
    setNote(null);
    const res = await openKeyExport(magic);
    if (!res.ok) {
      setNote(
        "Magic didn't open the key reveal — export may not be enabled for this app. Your funds are still on your own EOA; reverting to a plain wallet above removes the delegation.",
      );
    }
    setBusy(false);
  }, [magic]);

  return (
    <div className="mt-4 rounded-xl border border-line bg-paper2 p-3">
      <p className="op-eyebrow">Key custody</p>
      {cap.available ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Your key lives in Magic&rsquo;s secure infrastructure, unlocked by your login. Reveal it
            anytime to hold it yourself — it&rsquo;s shown inside Magic&rsquo;s own screen; OneLink
            never sees it.
          </p>
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="op-btn-secondary mt-2 px-3 py-1.5 text-xs"
          >
            {busy ? "Opening…" : "Reveal my private key"}
          </button>
        </>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Key export isn&rsquo;t enabled for this app right now, so moving the key elsewhere
          isn&rsquo;t available here. Your funds are still on your own EOA — not an account OneLink
          controls; reverting to a plain wallet above removes the delegation. Full key portability
          depends on Magic enabling export.
        </p>
      )}
      {note ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {note}
        </p>
      ) : null}
    </div>
  );
}
