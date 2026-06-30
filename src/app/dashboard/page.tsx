"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatAtomicTokenAmount, parseTokenAmountToAtomic, resolvePaymentToken } from "@/lib/tokens";
import { DEMO_REPLAY_PAYMENT_LINK } from "@/lib/demo/replay";
import {
  getActivePaymentChain,
  getConfiguredPaymentMode,
  getExplorerTxUrl,
  getPaymentChainById,
  getPaymentModeLabel,
  getProofChain,
  type ChainPaymentConfig,
} from "@/lib/config/payment";
import { Wordmark, Chip, TxReference, IconArrowUpRight, IconCheck, AppNav } from "@/components/ui";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();
const PAYMENT_MODE_LABEL = getPaymentModeLabel(PAYMENT_MODE);
const PROOF_CHAIN = getProofChain();

/** Resolve a link/payment's settlement chain by id, falling back to the default chain on bad data. */
function chainForId(chainId: number | null | undefined): ChainPaymentConfig {
  if (chainId == null) return ACTIVE_CHAIN;
  try {
    return getPaymentChainById(chainId);
  } catch {
    return ACTIVE_CHAIN;
  }
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const isDemoReplay = searchParams.get("demo") === "replay";
  const [merchantId, setMerchantId] = useState("");
  const [links, setLinks] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0 });
  const [newLink, setNewLink] = useState({ amount: "", token: "USDC", label: "", merchantAddress: "" });
  const [adminCreateToken, setAdminCreateToken] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!merchantId) return;
    const demoQuery = isDemoReplay ? "&demo=replay" : "";
    const [linksRes, paymentsRes] = await Promise.all([
      fetch(`/api/payment-links?merchantId=${merchantId}${demoQuery}`, { cache: "no-store" }),
      fetch(`/api/payments?merchantId=${merchantId}${demoQuery}`, { cache: "no-store" }),
    ]);
    const linksData = await linksRes.json();
    const paymentsData = await paymentsRes.json();
    setLinks(linksData.links || []);
    setPayments(paymentsData.payments || []);
    setStats(paymentsData.stats || { total: 0, completed: 0, pending: 0, failed: 0 });
  }, [merchantId, isDemoReplay]);

  async function createLink() {
    if (!newLink.amount || !newLink.merchantAddress) return;
    let amountAtomic: string;
    try {
      amountAtomic = parseTokenAmountToAtomic(newLink.amount, resolvePaymentToken(newLink.token));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid amount";
      setCreatedUrl(`Error: ${message}`);
      return;
    }

    const res = await fetch("/api/payment-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-create-token": adminCreateToken,
      },
      body: JSON.stringify({
        merchantAddress: newLink.merchantAddress,
        amount: amountAtomic,
        token: newLink.token,
        label: newLink.label || undefined,
      }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      setCreatedUrl(data.checkoutUrl);
      setMerchantId(newLink.merchantAddress);
    } else {
      setCreatedUrl(`Error: ${JSON.stringify(data)}`);
    }
  }

  useEffect(() => {
    if (isDemoReplay) {
      setMerchantId(searchParams.get("merchantId") || DEMO_REPLAY_PAYMENT_LINK.merchant_id);
    }
  }, [isDemoReplay, searchParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function formatLinkAmount(link: any) {
    try {
      const token = resolvePaymentToken(link.token);
      return `${formatAtomicTokenAmount(link.amount, token)} ${token.symbol}`;
    } catch {
      return `${link.amount} ${link.token}`;
    }
  }

  function getCompletedPaymentForLink(linkId: string) {
    return payments.find((payment) => payment.payment_link_id === linkId && payment.status === "completed");
  }

  function TxLink({
    hash,
    label,
    chain,
  }: {
    hash: string | null | undefined;
    label: string;
    chain: ChainPaymentConfig;
  }) {
    return <TxReference label={label} hash={hash} href={hash ? getExplorerTxUrl(chain, hash) : null} />;
  }

  return (
    <main className="op-shell px-5 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark href="/" />
          <span className="op-chip">Merchant dashboard</span>
        </header>

        <AppNav active="/dashboard" className="mb-6" />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip>
            payment mode <span className="ml-1 font-semibold text-ink">{PAYMENT_MODE_LABEL}</span>
          </Chip>
          <Chip>
            proof anchor <span className="ml-1 font-semibold text-ink">{PROOF_CHAIN.name}</span>
          </Chip>
          <Chip>
            proof <span className="ml-1 font-semibold text-ink">ReceiptEmitter</span>
          </Chip>
        </div>

        {isDemoReplay && (
          <div className="mb-6 rounded-2xl border border-gold/25 bg-gold-soft/50 p-4 text-sm">
            <p className="font-semibold text-ink">Demo replay mode</p>
            <p className="mt-1 text-muted">
              Showing seeded data from an existing successful payment and proof transaction. No new
              payment is created or executed.
            </p>
          </div>
        )}

        {!isDemoReplay && (
          <section className="op-card mb-6 p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Create payment link</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="op-merchant" className="mb-1 block text-sm font-medium text-ink">
                  Merchant address
                </label>
                <input
                  id="op-merchant"
                  placeholder="0x…"
                  value={newLink.merchantAddress}
                  onChange={(e) => setNewLink({ ...newLink, merchantAddress: e.target.value })}
                  className="op-input font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="op-admin" className="mb-1 block text-sm font-medium text-ink">
                  Admin create token
                </label>
                <input
                  id="op-admin"
                  placeholder="Required to register on-chain"
                  value={adminCreateToken}
                  onChange={(e) => setAdminCreateToken(e.target.value)}
                  className="op-input"
                  type="password"
                />
              </div>
              <div>
                <label htmlFor="op-amount" className="mb-1 block text-sm font-medium text-ink">
                  Amount
                </label>
                <input
                  id="op-amount"
                  placeholder="Max 0.25 USDC"
                  value={newLink.amount}
                  onChange={(e) => setNewLink({ ...newLink, amount: e.target.value })}
                  className="op-input"
                />
              </div>
              <div>
                <label htmlFor="op-token" className="mb-1 block text-sm font-medium text-ink">
                  Token
                </label>
                <select
                  id="op-token"
                  value={newLink.token}
                  onChange={(e) => setNewLink({ ...newLink, token: e.target.value })}
                  className="op-input"
                >
                  <option>USDC</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="op-label" className="mb-1 block text-sm font-medium text-ink">
                  Label <span className="font-normal text-faint">(optional)</span>
                </label>
                <input
                  id="op-label"
                  placeholder="e.g. Coffee subscription"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  className="op-input"
                />
              </div>
              <div className="sm:col-span-2">
                <button onClick={createLink} className="op-btn-primary w-full sm:w-auto">
                  Create link
                </button>
              </div>
            </div>
            {createdUrl &&
              (createdUrl.startsWith("Error:") ? (
                <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                  {createdUrl}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-verify/20 bg-verify-soft p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-verify">
                    <IconCheck className="h-4 w-4" /> Payment link ready
                  </p>
                  <a
                    href={createdUrl}
                    className="mt-2 block break-all font-mono text-xs text-ink2 underline-offset-2 hover:text-ink hover:underline"
                  >
                    {createdUrl}
                  </a>
                  <p className="mt-1.5 text-xs text-muted">
                    Share this link with your customer to collect payment.
                  </p>
                </div>
              ))}
          </section>
        )}

        <section className="op-card p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Payment links</h2>
          <div className="mt-4">
            <label htmlFor="op-view-merchant" className="mb-1 block text-sm font-medium text-ink">
              Merchant address
            </label>
            <input
              id="op-view-merchant"
              placeholder="Enter a merchant address to view links"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="op-input font-mono"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Total" value={stats.total} />
            <Stat label="Paid" value={stats.completed} tone="verify" />
            <Stat label="Pending" value={stats.pending} tone="gold" />
            <Stat label="Failed" value={stats.failed} tone="danger" />
          </div>

          {links.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line2 bg-paper2 p-8 text-center">
              <p className="text-sm font-medium text-ink2">No payment links yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
                {merchantId
                  ? "This merchant address has no payment links. Create one above to start accepting payments."
                  : "Enter a merchant address above to view its payment links, statuses, and on-chain proofs."}
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {links.map((l: any) => {
                const completedPayment = getCompletedPaymentForLink(l.id);
                const isPaid = l.status === "completed";
                return (
                  <li key={l.id} className="rounded-2xl border border-line bg-paper p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{l.label || l.id.slice(0, 8)}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {formatLinkAmount(l)} on {chainForId(l.destination_chain_id).name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="op-chip-concept">{PAYMENT_MODE_LABEL}</span>
                          {l.registered_tx_hash && (
                            <span className="op-chip-concept">On-chain invoice</span>
                          )}
                        </div>
                        {isDemoReplay && isPaid && (
                          <a
                            href={`/success/${l.id}`}
                            className="op-link mt-2 inline-flex items-center gap-1 text-xs"
                          >
                            Open proof receipt <IconArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {isPaid ? (
                          <span className="op-chip-verify">
                            <IconCheck className="h-3.5 w-3.5" /> PAID
                          </span>
                        ) : (
                          <span className="op-chip capitalize">{l.status}</span>
                        )}
                        {isPaid && (
                          <p className="mt-1.5 text-xs font-medium">
                            {completedPayment?.receipt_tx_hash ? (
                              <span className="text-verify">proof recorded</span>
                            ) : (
                              <span className="text-muted">proof pending</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {completedPayment && (
                      <div className="mt-3 space-y-2 border-t border-line pt-3">
                        <p className="op-eyebrow">Verified payment proof</p>
                        <TxLink
                          hash={completedPayment.tx_hash}
                          label="Payment transaction"
                          chain={chainForId(completedPayment.source_chain_id ?? l.destination_chain_id)}
                        />
                        <TxLink
                          hash={completedPayment.receipt_tx_hash}
                          label="Proof transaction"
                          chain={PROOF_CHAIN}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="op-shell px-5 py-10">
          <div className="mx-auto max-w-3xl text-sm text-muted">Loading dashboard…</div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "verify" | "gold" | "danger";
}) {
  const valueColor =
    tone === "verify"
      ? "text-verify"
      : tone === "gold"
        ? "text-gold"
        : tone === "danger"
          ? "text-danger"
          : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-paper2 p-3 text-center">
      <p className={`font-display text-2xl font-semibold tnum ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
