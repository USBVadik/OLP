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
  getPublicRpcUrl,
} from "@/lib/config/payment";

// Dynamic imports for browser-only SDKs
let Magic: any = null;
let EVMExtension: any = null;
let UniversalAccount: any = null;
let SUPPORTED_TOKEN_TYPE: any = null;
let UNIVERSAL_ACCOUNT_VERSION: any = null;

async function loadSDKs() {
  if (!Magic || !EVMExtension) {
    const magicMod = await import("magic-sdk");
    Magic = magicMod.Magic;
    const evmMod = await import("@magic-ext/evm");
    EVMExtension = evmMod.EVMExtension;
  }
  if (!UniversalAccount) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccount = particleMod.UniversalAccount;
    SUPPORTED_TOKEN_TYPE = particleMod.SUPPORTED_TOKEN_TYPE;
    UNIVERSAL_ACCOUNT_VERSION = particleMod.UNIVERSAL_ACCOUNT_VERSION;
  }
}

async function loadEthers() {
  const ethersMod = await import("ethers");
  return {
    BrowserProvider: ethersMod.BrowserProvider,
    getBytes: ethersMod.getBytes,
    Signature: ethersMod.Signature,
  };
}

// Magic v33 removed top-level metadata.publicAddress; the EVM address now lives under
// wallets.ethereum. Fall back to the EIP-1193 provider for maximum version robustness.
async function resolveMagicEoa(magic: any): Promise<string | null> {
  try {
    const meta = await magic.user.getInfo();
    const fromMeta = meta?.publicAddress ?? meta?.wallets?.ethereum?.publicAddress;
    if (fromMeta) return fromMeta;
  } catch {
    /* fall through to provider */
  }
  for (const method of ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const accounts = await magic.rpcProvider.request({ method });
      if (accounts?.[0]) return accounts[0];
    } catch {
      /* try next */
    }
  }
  return null;
}

const ACTIVE_CHAIN = getActivePaymentChain();
const PAYMENT_MODE = getConfiguredPaymentMode();
const IS_7702 = PAYMENT_MODE === "universal_7702_transfer";

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

function shortAddress(address: string | null | undefined) {
  if (!address) return "Not connected";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function getSettlementChainIds(tx: any): number[] {
  const ops = tx?.userOps ?? tx?.data?.userOps ?? [];
  const ids = ops
    .map((op: any) => op?.chainId)
    .filter((id: any) => typeof id === "number");
  return Array.from(new Set(ids));
}

function getModeHelpText() {
  if (PAYMENT_MODE === "universal_invoice") {
    return "Strict invoice mode: Particle builds approve + payInvoice.";
  }
  if (PAYMENT_MODE === "universal_7702_transfer") {
    return "EIP-7702 mode: your Magic EOA is delegated in-place to the Universal Account, then Particle settles USDC to the merchant on Base.";
  }
  return "Fallback mode: Particle sends USDC on Base, then backend verifies the Transfer and records proof.";
}

function getModeProofText() {
  if (PAYMENT_MODE === "universal_invoice") {
    return "Future strict path: ReceiptEmitter receives payInvoice directly in the same universal transaction.";
  }
  if (PAYMENT_MODE === "universal_7702_transfer") {
    return "EIP-7702 path: the EOA acts as the Universal Account; after USDC settles, the backend verifies the Transfer and records an InvoicePaid proof.";
  }
  return "Current working path: the merchant receives USDC first, then the backend writes an InvoicePaid proof after verification.";
}

function getErrorMessage(error: any) {
  return error?.message || error?.response?.data?.message || String(error);
}

function isParticleMaintenanceError(error: any) {
  const message = JSON.stringify({
    message: error?.message,
    response: error?.response?.data,
    code: error?.code,
  }).toLowerCase();
  return message.includes("-32801") || message.includes("maintanence") || message.includes("maintenance");
}

function getCreateTransactionError(error: any) {
  const message = getErrorMessage(error);
  if (PAYMENT_MODE === "universal_invoice" && isParticleMaintenanceError(error)) {
    return [
      "Universal invoice mode is selected, but Particle custom universal transactions are currently blocked for this project.",
      `Exact Particle error: ${message}`,
      "No transfer_fallback was attempted automatically. Switch NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback to use the stable path.",
    ].join(" ");
  }
  if (IS_7702 && isParticleMaintenanceError(error)) {
    return [
      "EIP-7702 transfer mode is selected, but Particle returned a maintenance error (-32801).",
      `Exact Particle error: ${message}`,
      "This usually means the Universal Accounts V2 migration window is still gating this operation. Use NEXT_PUBLIC_PAYMENT_MODE=transfer_fallback as the safe demo path until Particle confirms V2 is live.",
    ].join(" ");
  }
  return `Transaction creation failed: ${message}`;
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
  const [payPhase, setPayPhase] = useState<string | null>(null);

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
      const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!;
      // EIP-7702 needs Magic's EVM extension (sign7702Authorization / send7702Transaction
      // and evm.switchChain are exposed through it on the configured chain).
      const m = IS_7702
        ? new Magic(key, {
            extensions: [
              new EVMExtension([
                { rpcUrl: getPublicRpcUrl(ACTIVE_CHAIN), chainId: ACTIVE_CHAIN.chainId, default: true },
              ]),
            ],
          })
        : new Magic(key);
      setMagic(m);
      log("initMagic", "ok", { mode: PAYMENT_MODE, eip7702: IS_7702, key: key?.slice(0, 10) + "..." });
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

      const userAddress = await resolveMagicEoa(magic);
      if (!userAddress) throw new Error("No public address from Magic");

      setAddress(userAddress);
      log("magicLogin", "got address", { address: userAddress });

      // 4. Init Particle UA. In EIP-7702 mode the EOA itself becomes the Universal Account.
      const particleCreds = {
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
      };
      const universalAccount = IS_7702
        ? new UniversalAccount({
            ...particleCreds,
            smartAccountOptions: {
              useEIP7702: true,
              name: "UNIVERSAL",
              version: UNIVERSAL_ACCOUNT_VERSION,
              ownerAddress: userAddress,
            },
            tradeConfig: { slippageBps: 100, universalGas: false },
          })
        : new UniversalAccount({ ...particleCreds, ownerAddress: userAddress });
      setUa(universalAccount);
      log("initParticleUA", "ok", { mode: PAYMENT_MODE, eip7702: IS_7702, ownerAddress: userAddress });

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
      if (!IS_7702 && hasBlockingEip7702Auth(userOps)) {
        throw new Error(
          "EIP-7702 authorization is required. Set NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer to delegate the EOA in-place and sign the authorization, instead of this non-7702 path."
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
        code: e.code,
        mode: PAYMENT_MODE,
        stage: PAYMENT_MODE === "universal_invoice" ? "createUniversalTransaction" : "createTransferTransaction",
        particleMaintenance: isParticleMaintenanceError(e),
      });
      setError(getCreateTransactionError(e));
    } finally {
      setIsCreatingTx(false);
    }
  }, [ua, paymentLink, address, isCreatingTx]);

  // EIP-7702: pre-delegate the EOA on the active chain (split from the payment tx to
  // avoid the AA24 error seen when delegation + transaction are combined in one step).
  const ensureDelegated7702 = useCallback(async () => {
    if (!ua || !magic || !address) throw new Error("Universal Account or wallet not ready");
    const deployments = await ua.getEIP7702Deployments();
    const dep = (deployments || []).find((d: any) => d.chainId === ACTIVE_CHAIN.chainId);
    if (dep?.isDelegated) {
      log("ensureDelegated", "already delegated", { chainId: ACTIVE_CHAIN.chainId });
      return;
    }
    setPayPhase(`Step 1/2: delegating your account on ${ACTIVE_CHAIN.name} (one-time)...`);
    log("ensureDelegated", "delegating", { chainId: ACTIVE_CHAIN.chainId });
    await magic.evm.switchChain(ACTIVE_CHAIN.chainId);
    // getEIP7702Auth returns chain-specific params; Magic cannot sign chainId:0 auths,
    // so we pre-delegate per chain. nonce is incremented by 1 for the standalone tx.
    const [auth] = await ua.getEIP7702Auth([ACTIVE_CHAIN.chainId]);
    const authorization = await magic.wallet.sign7702Authorization({
      contractAddress: auth.address,
      chainId: ACTIVE_CHAIN.chainId,
      nonce: auth.nonce + 1,
    });
    const delegationTx = await magic.wallet.send7702Transaction({
      to: address,
      data: "0x",
      authorizationList: [authorization],
    });
    log("ensureDelegated", "ok", { delegationTx });
  }, [ua, magic, address]);

  // EIP-7702: pre-delegate, sign any inline authorizations the SDK still needs, sign the
  // rootHash, then broadcast through the Universal Account SDK with the authorizations.
  const sendVia7702 = useCallback(async (tx: any) => {
    if (!ua || !magic || !address) throw new Error("Universal Account or wallet not ready");
    const { BrowserProvider, getBytes, Signature } = await loadEthers();

    await ensureDelegated7702();
    setPayPhase("Step 2/2: signing and settling the payment...");

    const authorizations: Array<{ userOpHash: string; signature: string }> = [];
    const nonceMap = new Map<number, string>();
    for (const op of tx.userOps ?? []) {
      if (op.eip7702Auth && !op.eip7702Delegated) {
        let serialized = nonceMap.get(op.eip7702Auth.nonce);
        if (!serialized) {
          const a = await magic.wallet.sign7702Authorization({
            contractAddress: op.eip7702Auth.address,
            chainId: op.eip7702Auth.chainId || op.chainId,
            nonce: op.eip7702Auth.nonce,
          });
          serialized = Signature.from({ r: a.r, s: a.s, v: a.v }).serialized;
          nonceMap.set(op.eip7702Auth.nonce, serialized);
        }
        authorizations.push({ userOpHash: op.userOpHash, signature: serialized });
      }
    }
    log("sign7702Authorizations", "ok", { count: authorizations.length });

    // Particle expects an EIP-191 signature of transaction.rootHash.
    const provider = new BrowserProvider(magic.rpcProvider);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(getBytes(tx.rootHash));
    log("signRootHash", "ok", { rootHash: tx.rootHash, signature: signature.slice(0, 20) + "..." });

    return ua.sendTransaction(tx, signature, authorizations.length ? authorizations : undefined);
  }, [ua, magic, address, ensureDelegated7702]);

  // 7. Send transaction
  const handlePay = useCallback(async () => {
    if (!ua || !transaction || !magic) return;
    if (!transaction.rootHash) {
      setError("Payment failed: transaction preview is missing rootHash. Please recreate the preview.");
      setStep("error");
      return;
    }

    setStep("paying");
    setPayPhase(IS_7702 ? "Preparing EIP-7702 payment..." : null);
    try {
      log("sendTransaction", "starting", {
        transactionId: transaction.transactionId,
        rootHash: transaction.rootHash,
      });

      let result: any;
      if (IS_7702) {
        result = await sendVia7702(transaction);
      } else {
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

        result = await ua.sendTransaction(transaction, signature);
      }
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

      setPayPhase(null);
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
      setPayPhase(null);
      setStep("error");
    }
  }, [ua, transaction, magic, address, paymentLink, sendVia7702]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-xl font-bold mb-1">OneLink Pay</h1>
          <p className="text-sm text-gray-500">Checkout prototype</p>
          <CheckoutBadges />

          {/* STEP: Loading */}
          {step === "loading" && <LoadingState title="Loading invoice" detail="Fetching payment link details." />}

          {/* STEP: Login */}
          {step === "login" && paymentLink && (
            <LoginForm paymentLink={paymentLink} onLogin={handleLogin} />
          )}

          {/* STEP: Balances loading */}
          {step === "balances" && (
            <LoadingState title="Checking balance" detail="Reading Particle Universal Account assets." />
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
            <LoadingState title="Processing payment" detail={payPhase ?? "Waiting for Particle transaction and server-side proof verification."} />
          )}

          {/* STEP: Success */}
          {step === "success" && (
            <SuccessState paymentLink={paymentLink} txResult={txResult} />
          )}

          {/* STEP: Error */}
          {step === "error" && (
            <ErrorState message={error} onRetry={() => { setError(null); setStep(paymentLink ? "login" : "loading"); }} />
          )}
        </div>

        {/* Diagnostic Logs */}
        <details className="bg-white rounded-xl shadow p-4">
          <summary className="text-sm font-medium cursor-pointer">Advanced debug: raw Particle/probe data ({logs.length})</summary>
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

function CheckoutBadges() {
  return (
    <div className="my-4 flex flex-wrap gap-2 text-xs">
      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1" title={getModeHelpText()}>
        mode: <span className="font-mono">{PAYMENT_MODE}</span>
      </span>
      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
        chain: <span className="font-mono">{ACTIVE_CHAIN.name} {ACTIVE_CHAIN.chainId}</span>
      </span>
    </div>
  );
}

function LoadingState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{detail}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700 font-medium">Checkout error</p>
      <p className="text-red-600 text-sm mt-1">{message || "Something went wrong."}</p>
      <button
        onClick={onRetry}
        className="mt-3 text-sm underline text-red-700"
      >
        Retry
      </button>
    </div>
  );
}

function PaymentSummary({
  paymentLink,
  address,
}: {
  paymentLink: PaymentLink;
  address?: string | null;
}) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium mb-3">Payment summary</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">You pay</span>
          <span className="font-bold text-right">{getPaymentAmountLabel(paymentLink)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Merchant receives</span>
          <span className="text-right">{getPaymentAmountLabel(paymentLink)} on {ACTIVE_CHAIN.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Merchant</span>
          <span className="font-mono text-xs text-right">{shortAddress(paymentLink.merchant_address)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Wallet</span>
          <span className="font-mono text-xs text-right">{shortAddress(address)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Mode</span>
          <span className="font-mono text-xs text-right">{PAYMENT_MODE}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Chain</span>
          <span className="font-mono text-xs text-right">{ACTIVE_CHAIN.name} ({ACTIVE_CHAIN.chainId})</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Receipt</span>
          <span className={paymentLink.registered_tx_hash ? "text-green-700" : "text-red-600"}>
            {paymentLink.registered_tx_hash ? "Registered" : "Not registered"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">{getModeHelpText()}</p>
      <p className="mt-1 text-xs text-gray-500">{getModeProofText()}</p>
    </div>
  );
}

function SuccessState({
  paymentLink,
  txResult,
}: {
  paymentLink: PaymentLink | null;
  txResult: any;
}) {
  return (
    <div className="py-4">
      <div className="mb-4 text-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-green-600 text-lg">OK</span>
        </div>
        <p className="font-bold text-green-700">PAID</p>
        <p className="text-sm text-gray-600">USDC Transfer verified and InvoicePaid proof recorded.</p>
      </div>

      {paymentLink && txResult?.txHash && (
        <div className="text-left border border-green-200 bg-green-50 rounded-lg p-3 text-sm">
          <div className="space-y-2">
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-bold">{getPaymentAmountLabel(paymentLink)}</p>
            </div>
            <div>
              <p className="text-gray-500">Merchant</p>
              <p className="font-mono text-xs break-all">{paymentLink.merchant_address}</p>
            </div>
            <div>
              <p className="text-gray-500">Invoice ID</p>
              <p className="font-mono text-xs break-all">{paymentLink.contract_invoice_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment mode</p>
              <p className="font-mono text-xs">{PAYMENT_MODE}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment tx</p>
              <a
                href={txResult.paymentExplorer}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline break-all font-mono text-xs"
              >
                {txResult.txHash}
              </a>
            </div>
            {txResult.proofTxHash && txResult.proofExplorer && (
              <div>
                <p className="text-gray-500">Proof tx</p>
                <a
                  href={txResult.proofExplorer}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline break-all font-mono text-xs"
                >
                  {txResult.proofTxHash}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {txResult && (
        <details className="mt-4 text-left">
          <summary className="text-sm cursor-pointer">Advanced debug: raw payment result</summary>
          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto text-left max-h-72">
            {JSON.stringify(txResult, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function LoginForm({ paymentLink, onLogin }: { paymentLink: PaymentLink; onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <PaymentSummary paymentLink={paymentLink} />
      {paymentLink.label && <p className="text-sm text-gray-600">{paymentLink.label}</p>}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
        <p className="font-medium">Wallet path</p>
        <p className="mt-1">
          Sign in with Magic. The app initializes a Particle Universal Account for that wallet and builds a payment preview before any transaction is sent.
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
  const settlementChainIds = transaction ? getSettlementChainIds(transaction) : [];
  const routingLabel =
    settlementChainIds.length > 1
      ? `across ${settlementChainIds.length} chains`
      : `on ${ACTIVE_CHAIN.name}`;
  return (
    <div className="space-y-4">
      {/* Wallet info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">Connected wallet (Magic)</p>
        <p className="text-sm font-mono">{address}</p>
        <p className="mt-2 text-xs text-gray-500">
          Particle UA is initialized from this Magic wallet and used to create the payment preview.
        </p>
      </div>

      <PaymentSummary paymentLink={paymentLink} address={address} />

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
            <p className="font-medium text-blue-900">
              Powered by Particle Universal Account &mdash; chain-abstracted settlement {routingLabel}.
            </p>
            {IS_7702 && (
              <p className="text-blue-900">
                Your first payment includes a one-time EIP-7702 delegation of this wallet (same address, reversible).
              </p>
            )}
          </div>
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-blue-800">Advanced debug: raw Particle transaction</summary>
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
