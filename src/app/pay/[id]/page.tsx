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
import {
  Wordmark,
  Chip,
  ConceptTag,
  Dot,
  Disclosure,
  VerifiedSeal,
  TxReference,
  Field,
  IconShield,
  IconLock,
  IconCheck,
} from "@/components/ui";

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
        // Particle settles the UA transfer on-chain asynchronously, so the Base tx hash
        // (e.g. under userOps[].txHash) is usually absent from the immediate send result.
        // Poll getTransaction until it surfaces instead of failing on the first miss.
        if (!txHash && transaction.transactionId) {
          setPayPhase("Waiting for on-chain settlement...");
          for (let attempt = 0; attempt < 12 && !txHash; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const status = await ua.getTransaction(transaction.transactionId);
            txHash = extractEvmTxHash(status);
            log(
              "getParticleTransaction",
              txHash ? `hash found (attempt ${attempt})` : `pending (attempt ${attempt})`,
              status
            );
          }
        }
        if (!txHash) {
          throw new Error(
            "Particle has not surfaced a Base settlement tx hash yet. The transfer may still be processing. If USDC already left your wallet, do NOT retry — verify with the Particle transactionId instead."
          );
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
    <main className="op-shell px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <Wordmark />
          <span className="op-chip">
            <IconLock className="h-3.5 w-3.5" /> Secure checkout
          </span>
        </header>

        <div className="op-card op-animate-rise p-6 sm:p-7">
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

        {/* Developer logs */}
        <div className="mt-4">
          <Disclosure summary={`Developer logs (${logs.length})`}>
            <div className="max-h-96 space-y-2 overflow-auto">
              {logs.length === 0 ? (
                <p className="text-xs text-faint">No events yet.</p>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="border-b border-line pb-1 font-mono text-xs">
                    <span className="text-faint">{l.ts.split("T")[1]?.slice(0, 8)}</span>{" "}
                    <span className="font-bold text-ink2">{l.action}</span>{" "}
                    <span className={l.result === "error" ? "text-danger" : "text-verify"}>
                      [{l.result}]
                    </span>
                    {l.data && (
                      <pre className="mt-0.5 whitespace-pre-wrap break-all text-muted">
                        {JSON.stringify(l.data, null, 2).slice(0, 500)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </Disclosure>
        </div>
      </div>
    </main>
  );
}

// --- Sub-components ---

function CheckoutBadges() {
  return (
    <div className="mb-5 flex flex-wrap gap-2" title={getModeHelpText()}>
      <Chip>
        mode <span className="ml-1 font-mono text-ink">{PAYMENT_MODE}</span>
      </Chip>
      <Chip>
        chain <span className="ml-1 font-mono text-ink">{ACTIVE_CHAIN.name} {ACTIVE_CHAIN.chainId}</span>
      </Chip>
    </div>
  );
}

function LoadingState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="op-card-quiet flex items-start gap-3 p-4">
      <span className="relative mt-1 flex h-3 w-3" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4">
      <p className="font-semibold text-danger">Checkout error</p>
      <p className="mt-1 text-sm text-danger/90">{message || "Something went wrong."}</p>
      <button onClick={onRetry} className="op-btn-secondary mt-4">
        Try again
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
    <section className="overflow-hidden rounded-3xl border border-line bg-paper">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="op-eyebrow">Trust Preview</span>
        <span className="op-chip-gold">
          <IconShield className="h-3.5 w-3.5" /> Consent
        </span>
      </div>

      <div className="px-5 pt-4">
        <div className="rounded-2xl bg-paper2 p-5 text-center">
          <p className="text-xs text-muted">You pay</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink tnum">
            {getPaymentAmountLabel(paymentLink)}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-line px-5">
        <Field
          label="Merchant receives"
          value={`${getPaymentAmountLabel(paymentLink)} on ${ACTIVE_CHAIN.name}`}
        />
        <Field label="Active chain" value={`${ACTIVE_CHAIN.name} (${ACTIVE_CHAIN.chainId})`} />
        <Field label="Payment mode" value={PAYMENT_MODE} mono />
        <Field label="Merchant" value={shortAddress(paymentLink.merchant_address)} mono />
        {address ? <Field label="Your wallet" value={shortAddress(address)} mono /> : null}
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm text-muted">Spend caps</p>
            <p className="mt-0.5 text-xs text-faint">Scoped limits for future automation</p>
          </div>
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Off</span>
            <ConceptTag />
          </span>
        </div>
      </dl>

      <div className="m-5 mt-3 rounded-2xl border border-line bg-paper2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Dot tone="gold" /> Proof behavior
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{getModeProofText()}</p>
        <p className="mt-2 text-xs font-medium">
          <span className={paymentLink.registered_tx_hash ? "text-verify" : "text-muted"}>
            {paymentLink.registered_tx_hash
              ? "Invoice registered on-chain"
              : "Invoice not yet registered on-chain"}
          </span>
        </p>
      </div>
    </section>
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
    <div className="py-2">
      <div className="mb-5 text-center">
        <VerifiedSeal animate />
        <p className="mt-4 font-display text-2xl font-semibold text-ink">Payment verified</p>
        <p className="mt-1 text-sm text-muted">
          USDC transfer verified and an InvoicePaid proof was recorded on-chain.
        </p>
      </div>

      {paymentLink && txResult?.txHash ? (
        <div className="rounded-2xl border border-line bg-paper2 p-4">
          <dl className="divide-y divide-line">
            <Field label="Amount" value={getPaymentAmountLabel(paymentLink)} emphasis />
            <Field label="Merchant" value={shortAddress(paymentLink.merchant_address)} mono />
            <Field label="Invoice ID" value={paymentLink.contract_invoice_id ?? "—"} mono />
            <Field label="Payment mode" value={PAYMENT_MODE} mono />
          </dl>
          <div className="mt-4 space-y-2">
            <TxReference label="Payment transaction" hash={txResult.txHash} href={txResult.paymentExplorer} />
            <TxReference label="Proof transaction" hash={txResult.proofTxHash} href={txResult.proofExplorer} />
          </div>
        </div>
      ) : null}

      {txResult ? (
        <div className="mt-4">
          <Disclosure summary="Raw payment result">
            <pre className="max-h-72 overflow-auto text-left text-xs text-muted">
              {JSON.stringify(txResult, null, 2)}
            </pre>
          </Disclosure>
        </div>
      ) : null}
    </div>
  );
}

function LoginForm({ paymentLink, onLogin }: { paymentLink: PaymentLink; onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <PaymentSummary paymentLink={paymentLink} />
      {paymentLink.label ? <p className="px-1 text-sm text-muted">{paymentLink.label}</p> : null}

      <div className="space-y-3 rounded-2xl border border-line bg-paper2 p-4">
        <div>
          <label htmlFor="op-email" className="mb-1 block text-sm font-medium text-ink">
            Email to sign in
          </label>
          <input
            id="op-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="op-input"
            placeholder="you@example.com"
          />
        </div>
        <button
          onClick={() => { setLoading(true); onLogin(email); }}
          disabled={!email || loading}
          className="op-btn-primary w-full"
        >
          {loading ? "Signing in…" : "Sign in with Magic"}
        </button>
        <p className="text-xs leading-relaxed text-muted">
          A Particle Universal Account is initialized for your wallet and a payment preview is built
          before anything is sent.
        </p>
      </div>
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
  return (
    <div className="space-y-4">
      {/* Wallet info */}
      <div className="rounded-2xl border border-line bg-paper2 p-4">
        <p className="op-eyebrow">Connected wallet · Magic</p>
        <p className="mt-1 font-mono text-sm text-ink2">{shortAddress(address)}</p>
      </div>

      <PaymentSummary paymentLink={paymentLink} address={address} />

      {/* Balances */}
      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Universal Account balance</p>
          {balances?.error ? (
            <span className="text-xs font-medium text-danger">Unavailable</span>
          ) : balances ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-verify">
              <IconCheck className="h-3.5 w-3.5" /> Loaded
            </span>
          ) : (
            <span className="text-xs text-faint">No data</span>
          )}
        </div>
        {balances?.error ? (
          <p className="mt-1 text-xs text-danger">{balances.error}</p>
        ) : balances ? (
          <div className="mt-3">
            <Disclosure summary="Show balance details">
              <pre className="max-h-40 overflow-auto text-xs text-muted">
                {JSON.stringify(balances, null, 2)}
              </pre>
            </Disclosure>
          </div>
        ) : null}
      </div>

      {/* Transaction preview */}
      {transaction ? (
        <div className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-4">
          <p className="op-eyebrow text-gold">Settlement preview</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink2">
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              You pay {getPaymentAmountLabel(paymentLink)} from your Particle Universal Account.
            </li>
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {PAYMENT_MODE === "universal_invoice"
                ? "Particle builds approve + payInvoice as a universal transaction."
                : `Merchant receives USDC on ${ACTIVE_CHAIN.name} through your Universal Account.`}
            </li>
            <li className="flex gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {PAYMENT_MODE === "universal_invoice"
                ? "ReceiptEmitter handles the invoice payment directly."
                : "Backend verifies the USDC Transfer and records an InvoicePaid proof."}
            </li>
            {IS_7702 ? (
              <li className="flex gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                Your first payment includes a one-time EIP-7702 delegation of this wallet (same
                address, reversible).
              </li>
            ) : null}
          </ul>
          <div className="mt-3">
            <Disclosure summary="Raw Particle transaction">
              <p className="mb-2 text-xs text-muted">
                Settlement chain IDs: {settlementChainIds.join(", ") || ACTIVE_CHAIN.chainId}
              </p>
              <pre className="max-h-40 overflow-auto text-xs text-muted">
                {JSON.stringify(transaction, null, 2)}
              </pre>
            </Disclosure>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4">
          <p className="text-sm font-semibold text-danger">Transaction preview failed</p>
          <p className="mt-1 text-xs text-danger/90">{error}</p>
        </div>
      ) : null}

      {/* Actions */}
      {!transaction ? (
        <button onClick={onCreateTx} disabled={isCreatingTx} className="op-btn-primary w-full">
          {isCreatingTx ? "Building preview…" : "Build payment preview"}
        </button>
      ) : (
        <button onClick={onPay} className="op-btn-primary w-full">
          Confirm &amp; pay
        </button>
      )}
    </div>
  );
}
