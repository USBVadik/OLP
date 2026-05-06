"use client";

import { useState, useEffect, useCallback } from "react";
import { encodeFunctionData, type Address } from "viem";
import { formatAtomicTokenAmount, resolvePaymentToken } from "@/lib/tokens";
import {
  ERC20_APPROVE_ABI,
  RECEIPT_EMITTER_ABI,
} from "@/lib/contracts/receipt-emitter";
import {
  getActivePaymentChain,
  getConfiguredPaymentMode,
  getExplorerTxUrl,
} from "@/lib/config/payment";

// Dynamic imports for browser-only SDKs
let Magic: any = null;
let UniversalAccount: any = null;
let SUPPORTED_TOKEN_TYPE: any = null;

async function loadSDKs() {
  if (!Magic) {
    const magicMod = await import("magic-sdk");
    Magic = magicMod.Magic;
  }
  if (!UniversalAccount) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccount = particleMod.UniversalAccount;
    SUPPORTED_TOKEN_TYPE = particleMod.SUPPORTED_TOKEN_TYPE;
  }
}

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();

interface PaymentLink {
  id: string;
  merchant_address: string;
  amount: string;
  token: string;
  destination_chain_id: number;
  destination_token_address: string | null;
  label: string | null;
  status: "active" | "expired" | "completed" | "failed";
  contract_invoice_id: string | null;
  receipt_emitter_address: string | null;
  registered_tx_hash: string | null;
  paid_tx_hash: string | null;
  paid_at: string | null;
  error_message: string | null;
  latest_payment?: {
    tx_hash: string | null;
    receipt_tx_hash: string | null;
    status: string;
  } | null;
}

type Step = "loading" | "login" | "balances" | "preview" | "paying" | "success" | "error";

interface DiagnosticLog {
  ts: string;
  action: string;
  result: string;
  data?: any;
}

function summarizeUserOps(transaction: any) {
  const userOps = transaction?.userOps ?? transaction?.data?.userOps ?? [];

  return userOps.map((entry: any) => {
    const userOp = entry.userOp ?? {};
    const eip7702Auth = userOp.eip7702Auth ?? entry.eip7702Auth;

    return {
      chainId: entry.chainId,
      userOpHash: entry.userOpHash,
      userOpKeys: Object.keys(userOp),
      hasEip7702Auth: Boolean(eip7702Auth),
      eip7702Delegated: eip7702Auth?.eip7702Delegated ?? userOp.eip7702Delegated ?? null,
      eip7702Auth,
    };
  });
}

function hasBlockingEip7702Auth(userOps: Array<ReturnType<typeof summarizeUserOps>[number]>) {
  return userOps.some((userOp) => userOp.hasEip7702Auth && userOp.eip7702Delegated === false);
}

function extractEvmTxHash(value: any, keyHint?: string): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const normalizedHint = keyHint?.toLowerCase();
    if (normalizedHint && ["txhash", "transactionhash", "hash"].includes(normalizedHint)) {
      return /^0x[a-fA-F0-9]{64}$/.test(value) ? value : null;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractEvmTxHash(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    for (const [key, item] of entries) {
      const found = extractEvmTxHash(item, key);
      if (found) return found;
    }
  }
  return null;
}

function getPaymentAmountLabel(paymentLink: PaymentLink): string {
  try {
    const token = resolvePaymentToken(paymentLink.token, paymentLink.destination_chain_id);
    return `${formatAtomicTokenAmount(paymentLink.amount, token)} ${token.symbol}`;
  } catch {
    return `${paymentLink.amount} ${paymentLink.token}`;
  }
}

export default function PayPage({ params }: { params: { id: string } }) {
  const [step, setStep] = useState<Step>("loading");
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);

  function log(action: string, result: string, data?: any) {
    setLogs((prev) => [...prev, { ts: new Date().toISOString(), action, result, data }]);
  }

  // 1. Fetch payment link
  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/payment-links/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaymentLink(data.link);
        log("fetchPaymentLink", "ok", { id: params.id });
        if (data.link.status === "completed" && data.link.paid_tx_hash) {
          setTxResult({
            txHash: data.link.paid_tx_hash,
            paymentExplorer: getExplorerTxUrl(ACTIVE_CHAIN, data.link.paid_tx_hash),
            proofTxHash: data.link.latest_payment?.receipt_tx_hash ?? null,
            proofExplorer: data.link.latest_payment?.receipt_tx_hash
              ? getExplorerTxUrl(ACTIVE_CHAIN, data.link.latest_payment.receipt_tx_hash)
              : null,
            verification: { deduped: true, link: data.link },
          });
          setStep("success");
        } else {
          setStep("login");
        }
      } catch (e: any) {
        log("fetchPaymentLink", "error", { message: e.message });
        setError(`Payment link not found: ${e.message}`);
        setStep("error");
      }
    }
    fetchLink();
  }, [params.id]);

  // 2. Init Magic
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadSDKs().then(() => {
      const m = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
      setMagic(m);
      log("initMagic", "ok", { key: process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY?.slice(0, 10) + "..." });
    });
  }, []);

  // 3. Login with Magic
  const handleLogin = useCallback(async (email: string) => {
    if (!magic) return;
    await loadSDKs();
    try {
      log("magicLogin", "starting", { email });
      const didToken = await magic.auth.loginWithMagicLink({ email });
      log("magicLogin", "authenticated", { didToken: didToken?.slice(0, 20) + "..." });

      const metadata = await magic.user.getInfo();
      const userAddress = metadata.publicAddress;
      if (!userAddress) throw new Error("No public address from Magic");

      setAddress(userAddress);
      log("magicLogin", "got address", { address: userAddress });

      // 4. Init Particle UA (EIP-7702 mode via ownerAddress)
      const universalAccount = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
        ownerAddress: userAddress,
      });
      setUa(universalAccount);
      log("initParticleUA", "ok", { ownerAddress: userAddress });

      // 5. Fetch balances
      setStep("balances");
      try {
        const assets = await universalAccount.getPrimaryAssets();
        setBalances(assets);
        log("getPrimaryAssets", "ok", { assets });
        setStep("preview");
      } catch (e: any) {
        log("getPrimaryAssets", "error", { message: e.message, stack: e.stack });
        setBalances({ error: e.message });
        setStep("preview"); // proceed anyway to show preview
      }
    } catch (e: any) {
      log("magicLogin", "error", { message: e.message });
      setError(e.message);
      setStep("error");
    }
  }, [magic]);

  // 6. Create transaction preview
  const handleCreateTransaction = useCallback(async () => {
    if (!ua || !paymentLink || !address || isCreatingTx) return;
    setIsCreatingTx(true);
    setError(null);
    try {
      const token = resolvePaymentToken(paymentLink.token, paymentLink.destination_chain_id);
      if (token.symbol !== "USDC" || paymentLink.destination_chain_id !== ACTIVE_CHAIN.chainId) {
        throw new Error(`Active prototype supports ${ACTIVE_CHAIN.name} USDC invoices only`);
      }
      if (!paymentLink.contract_invoice_id || !paymentLink.registered_tx_hash) {
        throw new Error("Invoice is not registered on-chain yet. Missing contract_invoice_id or registered_tx_hash.");
      }
      const receiptEmitterAddress = paymentLink.receipt_emitter_address ?? ACTIVE_CHAIN.receiptEmitterAddress;
      if (!receiptEmitterAddress) throw new Error(`${ACTIVE_CHAIN.name} ReceiptEmitter address is not configured`);
      const particleAmount = formatAtomicTokenAmount(paymentLink.amount, token);

      log("createTransaction", "starting", {
        mode: PAYMENT_MODE,
        chainId: ACTIVE_CHAIN.chainId,
        merchant: paymentLink.merchant_address,
        contractInvoiceId: paymentLink.contract_invoice_id,
        receiptEmitter: receiptEmitterAddress,
        amountAtomic: paymentLink.amount,
        amountForParticle: particleAmount,
        token: token.address,
      });

      let tx: any;
      if (PAYMENT_MODE === "universal_invoice") {
        const rawAmount = BigInt(paymentLink.amount);
        const approveCall = {
          to: token.address,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: "approve",
            args: [receiptEmitterAddress as Address, rawAmount],
          }),
          value: "0",
        };
        const payInvoiceCall = {
          to: receiptEmitterAddress,
          data: encodeFunctionData({
            abi: RECEIPT_EMITTER_ABI,
            functionName: "payInvoice",
            args: [paymentLink.contract_invoice_id as `0x${string}`],
          }),
          value: "0",
        };
        const txPayload = {
          chainId: ACTIVE_CHAIN.chainId,
          expectTokens: [
            {
              type: SUPPORTED_TOKEN_TYPE.USDC,
              amount: particleAmount,
            },
          ],
          transactions: [approveCall, payInvoiceCall],
        };
        log("createUniversalTransaction", "attempting", txPayload);
        tx = await ua.createUniversalTransaction(txPayload);
        log("createUniversalTransaction", "ok", tx);
      } else {
        const txPayload = {
          token: {
            chainId: ACTIVE_CHAIN.chainId,
            address: token.address,
          },
          amount: particleAmount,
          receiver: paymentLink.merchant_address,
        };
        log("createTransferTransaction", "attempting", txPayload);
        tx = await ua.createTransferTransaction(txPayload);
        log("createTransferTransaction", "ok", tx);
      }

      const userOps = summarizeUserOps(tx);
      log("inspectUserOps", "ok", {
        transactionId: tx.transactionId,
        rootHash: tx.rootHash,
        userOps,
      });
      if (hasBlockingEip7702Auth(userOps)) {
        throw new Error(
          "EIP-7702 authorization is required but this Magic SDK path does not expose wallet.sign7702Authorization yet."
        );
      }
      setTransaction(tx);
      setError(null);

      try {
        const attemptRes = await fetch(`/api/payments/${paymentLink.id}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerAddress: address,
            previewJson: tx,
          }),
        });
        const attemptData = await attemptRes.json();
        if (!attemptRes.ok) throw new Error(attemptData.error || "Payment attempt record failed");
        log("recordPaymentAttempt", "ok", { id: attemptData.paymentAttempt?.id });
      } catch (attemptErr: any) {
        log("recordPaymentAttempt", "error", { message: attemptErr.message });
      }
    } catch (e: any) {
      log("createTransaction", "error", {
        message: e.message,
        response: e.response?.data,
      });
      setError(`Transaction creation failed: ${e.message}`);
    } finally {
      setIsCreatingTx(false);
    }
  }, [ua, paymentLink, address, isCreatingTx]);

  // 7. Send transaction
  const handlePay = useCallback(async () => {
    if (!ua || !transaction || !magic) return;
    if (!transaction.rootHash) {
      setError("Payment failed: transaction preview is missing rootHash. Please recreate the preview.");
      setStep("error");
      return;
    }

    setStep("paying");
    try {
      log("sendTransaction", "starting", {
        transactionId: transaction.transactionId,
        rootHash: transaction.rootHash,
      });

      // Sign with Magic provider (cast to any for protected method access)
      const provider = magic.rpcProvider as any;
      const from = address!;

      // Particle expects an EIP-191 signature of transaction.rootHash.
      const signature = await provider.request({
        method: "personal_sign",
        params: [transaction.rootHash, from],
      }) as string;

      log("signRootHash", "ok", {
        rootHash: transaction.rootHash,
        signature: signature.slice(0, 20) + "...",
      });

      const result = await ua.sendTransaction(transaction, signature);
      log("sendTransaction", "ok", result);

      if (paymentLink && address) {
        let txHash = extractEvmTxHash(result);
        if (!txHash && transaction.transactionId) {
          const status = await ua.getTransaction(transaction.transactionId);
          log("getParticleTransaction", "ok", status);
          txHash = extractEvmTxHash(status);
        }
        if (!txHash) {
          throw new Error("sendTransaction did not return a Base mainnet tx hash. Cannot verify InvoicePaid.");
        }

        const markPaidRes = await fetch(`/api/payments/${paymentLink.id}/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payerAddress: address,
            txHash,
          }),
        });
        const markPaidData = await markPaidRes.json();
        if (!markPaidRes.ok) throw new Error(markPaidData.error || "InvoicePaid verification failed");
        log("markPaid", "ok", markPaidData);
        setTxResult({
          particle: result,
          txHash,
          paymentExplorer: getExplorerTxUrl(ACTIVE_CHAIN, txHash),
          proofTxHash: markPaidData.proofTxHash ?? markPaidData.payment?.receipt_tx_hash ?? null,
          proofExplorer: markPaidData.proofTxHash
            ? getExplorerTxUrl(ACTIVE_CHAIN, markPaidData.proofTxHash)
            : null,
          verification: markPaidData,
        });
      }

      setStep("success");
    } catch (e: any) {
      log("sendTransaction", "error", {
        message: e.message,
        response: e.response?.data,
        code: e.code,
        stack: e.stack,
      });
      const retryHint = e.message?.includes("No records found")
        ? " The transaction preview may have expired. Retry and create a fresh preview."
        : "";
      setError(`Payment failed: ${e.message}${retryHint}`);
      setStep("error");
    }
  }, [ua, transaction, magic, address, paymentLink]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-xl font-bold mb-1">OneLink Pay</h1>
          <p className="text-sm text-gray-500 mb-6">P0 Core Loop</p>

          {/* STEP: Loading */}
          {step === "loading" && <p className="text-gray-500">Loading invoice...</p>}

          {/* STEP: Login */}
          {step === "login" && paymentLink && (
            <LoginForm paymentLink={paymentLink} onLogin={handleLogin} />
          )}

          {/* STEP: Balances loading */}
          {step === "balances" && (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-600">Fetching unified balances...</p>
            </div>
          )}

          {/* STEP: Preview */}
          {step === "preview" && paymentLink && (
            <PreviewStep
              paymentLink={paymentLink}
              address={address}
              balances={balances}
              transaction={transaction}
              error={error}
              isCreatingTx={isCreatingTx}
              onCreateTx={handleCreateTransaction}
              onPay={handlePay}
            />
          )}

          {/* STEP: Paying */}
          {step === "paying" && (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-600">Processing payment...</p>
            </div>
          )}

          {/* STEP: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-lg">OK</span>
              </div>
              <p className="font-bold text-green-700">Payment Sent</p>
              {paymentLink && txResult?.txHash && (
                <div className="mt-4 text-left border border-green-200 bg-green-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-green-800">USDC Transfer verified and InvoicePaid recorded on Base</p>
                  <p className="mt-2">
                    <span className="text-gray-500">Amount</span>{" "}
                    <span className="font-bold">{getPaymentAmountLabel(paymentLink)}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Merchant</span>{" "}
                    <span className="font-mono text-xs">{paymentLink.merchant_address}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Invoice</span>{" "}
                    <span className="font-mono text-xs">{paymentLink.contract_invoice_id}</span>
                  </p>
                  <a
                    href={txResult.paymentExplorer}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline break-all"
                  >
                    {txResult.txHash}
                  </a>
                  {txResult.proofTxHash && txResult.proofExplorer && (
                    <p className="mt-2">
                      <span className="text-gray-500">Proof</span>{" "}
                      <a
                        href={txResult.proofExplorer}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline break-all"
                      >
                        {txResult.proofTxHash}
                      </a>
                    </p>
                  )}
                </div>
              )}
              {txResult && (
                <details className="mt-4 text-left">
                  <summary className="text-sm cursor-pointer">Advanced result</summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto text-left">
                    {JSON.stringify(txResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* STEP: Error */}
          {step === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setStep("login"); }}
                className="mt-3 text-sm underline text-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Diagnostic Logs */}
        <details className="bg-white rounded-xl shadow p-4">
          <summary className="text-sm font-medium cursor-pointer">Diagnostic Logs ({logs.length})</summary>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">
            {logs.map((l, i) => (
              <div key={i} className="text-xs font-mono border-b pb-1">
                <span className="text-gray-400">{l.ts.split("T")[1]?.slice(0, 8)}</span>{" "}
                <span className="font-bold">{l.action}</span>{" "}
                <span className={l.result === "error" ? "text-red-600" : "text-green-600"}>
                  [{l.result}]
                </span>
                {l.data && (
                  <pre className="text-gray-500 mt-0.5 whitespace-pre-wrap break-all">
                    {JSON.stringify(l.data, null, 2).slice(0, 500)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}

// --- Sub-components ---

function LoginForm({ paymentLink, onLogin }: { paymentLink: PaymentLink; onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-500">Invoice</p>
        <p className="text-2xl font-bold mt-1">{getPaymentAmountLabel(paymentLink)}</p>
        {paymentLink.label && <p className="text-sm text-gray-600 mt-1">{paymentLink.label}</p>}
        <p className="text-xs text-gray-400 font-mono mt-2">
          To: {paymentLink.merchant_address}
        </p>
      </div>
      <div>
        <label className="text-sm text-gray-600 block mb-1">Email to sign in</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="you@example.com"
        />
      </div>
      <button
        onClick={() => { setLoading(true); onLogin(email); }}
        disabled={!email || loading}
        className="w-full py-3 bg-black text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in with Magic"}
      </button>
    </div>
  );
}

function PreviewStep({
  paymentLink,
  address,
  balances,
  transaction,
  error,
  isCreatingTx,
  onCreateTx,
  onPay,
}: {
  paymentLink: PaymentLink;
  address: string | null;
  balances: any;
  transaction: any;
  error: string | null;
  isCreatingTx: boolean;
  onCreateTx: () => void;
  onPay: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Wallet info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">Connected wallet (Magic)</p>
        <p className="text-sm font-mono">{address}</p>
      </div>

      {/* Balances */}
      <div className="border rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Unified Balance (Particle UA)</p>
        {balances?.error ? (
          <p className="text-xs text-red-500">{balances.error}</p>
        ) : balances ? (
          <details>
            <summary className="text-xs cursor-pointer text-gray-600">
              Balance loaded. Show advanced details
            </summary>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40 mt-2">
              {JSON.stringify(balances, null, 2)}
            </pre>
          </details>
        ) : (
          <p className="text-xs text-gray-400">No balance data</p>
        )}
      </div>

      {/* Payment details */}
      <div className="border rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Payment</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Amount</span>
          <span className="font-bold">{getPaymentAmountLabel(paymentLink)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">To</span>
          <span className="font-mono text-xs">{paymentLink.merchant_address.slice(0, 10)}...</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Chain</span>
          <span>{ACTIVE_CHAIN.name} ({ACTIVE_CHAIN.chainId})</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Mode</span>
          <span>{PAYMENT_MODE === "universal_invoice" ? "Universal invoice" : "Particle Transfer + verified proof"}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Receipt</span>
          <span className={paymentLink.registered_tx_hash ? "text-green-700" : "text-red-600"}>
            {paymentLink.registered_tx_hash ? "Registered" : "Not registered"}
          </span>
        </div>
      </div>

      {/* Transaction preview */}
      {transaction && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Transaction Preview</p>
          <div className="text-sm space-y-1">
            <p>You pay {getPaymentAmountLabel(paymentLink)} from your Particle Universal Account.</p>
            <p>
              {PAYMENT_MODE === "universal_invoice"
                ? "Particle builds approve + payInvoice as a universal transaction."
                : `Merchant receives USDC on ${ACTIVE_CHAIN.name} through Particle transfer.`}
            </p>
            <p>
              {PAYMENT_MODE === "universal_invoice"
                ? "ReceiptEmitter handles the invoice payment directly."
                : "Backend verifies the USDC Transfer and records `InvoicePaid` proof."}
            </p>
            <p>You do not need to switch networks or hold destination-chain gas manually.</p>
          </div>
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-blue-800">Advanced Particle transaction</summary>
            <pre className="text-xs overflow-auto max-h-40 mt-2">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700">Transaction preview failed</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Actions */}
      {!transaction ? (
        <button
          onClick={onCreateTx}
          disabled={isCreatingTx}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isCreatingTx ? "Creating preview..." : "Create Transaction Preview"}
        </button>
      ) : (
        <button
          onClick={onPay}
          className="w-full py-3 bg-black text-white rounded-lg font-medium"
        >
          Confirm & Pay
        </button>
      )}
    </div>
  );
}
