"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatAtomicTokenAmount, parseTokenAmountToAtomic, resolvePaymentToken } from "@/lib/tokens";
import { DEMO_REPLAY_PAYMENT_LINK } from "@/lib/demo/replay";
import { getActivePaymentChain, getConfiguredPaymentMode, getExplorerTxUrl } from "@/lib/config/payment";

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

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

  function TxLink({ hash, label }: { hash: string | null | undefined; label: string }) {
    if (!hash) return null;
    return (
      <a
        className="block text-xs text-blue-700 underline font-mono"
        href={getExplorerTxUrl(ACTIVE_CHAIN, hash)}
        target="_blank"
        rel="noreferrer"
      >
        {label} {hash.slice(0, 10)}...
      </a>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-gray-200 bg-white px-2 py-1">
            mode: <span className="font-mono">{PAYMENT_MODE}</span>
          </span>
          <span className="rounded border border-gray-200 bg-white px-2 py-1">
            chain: <span className="font-mono">{ACTIVE_CHAIN.name}</span>
          </span>
          <span className="rounded border border-gray-200 bg-white px-2 py-1">
            proof: <span className="font-semibold">ReceiptEmitter</span>
          </span>
        </div>
      </div>

      {isDemoReplay && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Demo replay mode</p>
          <p>
            This dashboard is showing seeded data from an existing successful payment tx and proof tx.
            It does not create or execute a new payment.
          </p>
        </div>
      )}

      {!isDemoReplay && (
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-bold mb-3">Create Payment Link</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Merchant 0x address"
            value={newLink.merchantAddress}
            onChange={(e) => setNewLink({ ...newLink, merchantAddress: e.target.value })}
            className="border rounded px-3 py-2 col-span-2 font-mono text-sm"
          />
          <input
            placeholder="Admin create token"
            value={adminCreateToken}
            onChange={(e) => setAdminCreateToken(e.target.value)}
            className="border rounded px-3 py-2 col-span-2"
            type="password"
          />
          <input
            placeholder="Amount (max 0.25 USDC)"
            value={newLink.amount}
            onChange={(e) => setNewLink({ ...newLink, amount: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={newLink.token}
            onChange={(e) => setNewLink({ ...newLink, token: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option>USDC</option>
          </select>
          <input
            placeholder="Label (optional)"
            value={newLink.label}
            onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <button onClick={createLink} className="bg-black text-white rounded px-4 py-2">
            Create
          </button>
        </div>
        {createdUrl && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm break-all">
            {createdUrl}
          </div>
        )}
      </div>
      )}

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-bold mb-3">Payment Links</h2>
        <input
          placeholder="Enter merchant address to view links"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3 font-mono text-sm"
        />
        <div className="grid grid-cols-4 gap-2 mb-4 text-center text-sm">
          <div className="bg-gray-50 rounded p-2">Total: {stats.total}</div>
          <div className="bg-green-50 rounded p-2">Paid: {stats.completed}</div>
          <div className="bg-yellow-50 rounded p-2">Pending: {stats.pending}</div>
          <div className="bg-red-50 rounded p-2">Failed: {stats.failed}</div>
        </div>
        {links.length === 0 ? (
          <p className="text-gray-400 text-sm">No links found</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {links.map((l: any) => {
              const completedPayment = getCompletedPaymentForLink(l.id);
              return (
              <li key={l.id} className="border rounded-lg p-3">
                <div className="flex justify-between gap-3">
                <span>
                  <span className="font-medium">{l.label || l.id.slice(0, 8)}</span>
                  <span className="block text-gray-600">{formatLinkAmount(l)} on {ACTIVE_CHAIN.name}</span>
                  <span className="block text-xs text-gray-500">
                    mode <span className="font-mono">{PAYMENT_MODE}</span>
                  </span>
                  {l.registered_tx_hash && (
                    <span className="block text-xs text-gray-400 font-mono">
                      registered {l.registered_tx_hash.slice(0, 10)}...
                    </span>
                  )}
                  {isDemoReplay && l.status === "completed" && (
                    <a
                      href={`/success/${l.id}`}
                      className="mt-1 block text-xs text-blue-700 underline"
                    >
                      open replay success page
                    </a>
                  )}
                </span>
                <span className={l.status === "completed" ? "text-green-600 font-bold text-right" : "text-gray-500 text-right"}>
                  {l.status === "completed" ? "PAID" : l.status}
                  {l.status === "completed" && (
                    <span className="block text-xs font-normal">
                      {completedPayment?.receipt_tx_hash ? "proof ok" : "proof pending"}
                    </span>
                  )}
                </span>
                </div>
                {completedPayment && (
                  <div className="mt-3 rounded border border-green-100 bg-green-50 p-2">
                    <p className="mb-1 text-xs font-medium text-green-800">Verified payment proof</p>
                    <TxLink hash={completedPayment.tx_hash} label="payment tx" />
                    <TxLink hash={completedPayment.receipt_tx_hash} label="proof tx" />
                  </div>
                )}
              </li>
            )})}
          </ul>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8 max-w-4xl mx-auto">Loading dashboard...</main>}>
      <DashboardContent />
    </Suspense>
  );
}
