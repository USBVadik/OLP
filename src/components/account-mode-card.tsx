"use client";

import { useCallback, useEffect, useState } from "react";
import { ARBITRUM_CHAIN, BASE_CHAIN, getExplorerTxUrl, type ChainPaymentConfig } from "@/lib/config/payment";
import { getDelegationStatus, undelegateChain, type ChainDelegation } from "@/lib/particle/delegation";
import { Chip, Dot, IconArrowUpRight, IconCheck, IconShield } from "@/components/ui";

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
      <div className="flex items-center justify-between">
        <span className="op-eyebrow inline-flex items-center gap-1.5">
          <IconShield className="h-3.5 w-3.5 text-gold" /> Account
        </span>
        <Chip>your own EOA</Chip>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This is your own wallet address, upgraded in place with EIP-7702 — not a wallet we hold. You
        can revert it to a plain wallet anytime.
      </p>

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

      {error ? (
        <div role="alert" className="mt-3 rounded-xl border border-danger/25 bg-danger-soft p-3 text-xs text-danger">
          {error}
        </div>
      ) : null}
    </section>
  );
}
