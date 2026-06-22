"use client";

import { useCallback, useMemo, useState } from "react";
import { type Address } from "viem";
import { ARBITRUM_CHAIN, BASE_CHAIN, getExplorerTxUrl, getPublicRpcUrl } from "@/lib/config/payment";
import { summarizeCrossChainPreview, type CrossChainPreviewSummary } from "@/lib/particle/cross-chain-proof";

const OWNER_EMAIL = "usbvadik@gmail.com";
const EXPECTED_OWNER: Address = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";
const MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const SEND_CONFIRMATION = "SEND CROSS-CHAIN";

let MagicCtor: any = null;
let EVMExtensionCtor: any = null;
let UniversalAccountCtor: any = null;
let UNIVERSAL_ACCOUNT_VERSION: string | null = null;

interface LogEntry {
  at: string;
  stage: string;
  status: string;
  data?: unknown;
}

interface PreviewState {
  transaction: any;
  summary: CrossChainPreviewSummary;
}

interface TokenChangeRow {
  id: string;
  chainId: number | undefined;
  symbol: string | undefined;
  amount: string;
  senderAddress: string | undefined;
}

async function loadSDKs() {
  if (!MagicCtor || !EVMExtensionCtor) {
    const magicMod = await import("magic-sdk");
    MagicCtor = magicMod.Magic;
    const evmMod = await import("@magic-ext/evm");
    EVMExtensionCtor = evmMod.EVMExtension;
  }
  if (!UniversalAccountCtor || !UNIVERSAL_ACCOUNT_VERSION) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccountCtor = particleMod.UniversalAccount;
    UNIVERSAL_ACCOUNT_VERSION = particleMod.UNIVERSAL_ACCOUNT_VERSION;
  }
}

async function resolveMagicEoa(magic: any): Promise<string | null> {
  try {
    const meta = await magic.user.getInfo();
    const fromMeta = meta?.publicAddress ?? meta?.wallets?.ethereum?.publicAddress;
    if (fromMeta) return fromMeta;
  } catch {
    // Fall through to provider methods.
  }

  for (const method of ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const accounts = await magic.rpcProvider.request({ method });
      if (accounts?.[0]) return accounts[0];
    } catch {
      // Try the next method.
    }
  }
  return null;
}

function shortAddress(address: string | null | undefined) {
  if (!address) return "not connected";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
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
    for (const [key, item] of Object.entries(value)) {
      const found = extractEvmTxHash(item, key);
      if (found) return found;
    }
  }
  return null;
}

function hexAmountToDisplay(amount: string | undefined): string {
  if (!amount) return "unknown";
  try {
    return `${Number(BigInt(amount)) / 1e18}`;
  } catch {
    return amount;
  }
}

function getTokenChangeRows(transaction: any): TokenChangeRow[] {
  const decr = transaction?.tokenChanges?.decr ?? [];
  return decr.map((item: any, index: number) => ({
    id: `${item?.token?.chainId ?? "chain"}-${item?.token?.symbol ?? "token"}-${index}`,
    chainId: item?.token?.chainId,
    symbol: item?.token?.symbol,
    amount: hexAmountToDisplay(item?.amount),
    senderAddress: item?.senderAddress,
  }));
}

export default function CrossChainProofPage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true";
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [amount, setAmount] = useState("2.05");
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [assets, setAssets] = useState<any>(null);
  const [deployments, setDeployments] = useState<any>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [sendConfirmation, setSendConfirmation] = useState("");
  const [sendResult, setSendResult] = useState<any>(null);
  const [settlementTxHash, setSettlementTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((stage: string, status: string, data?: unknown) => {
    setLogs((entries) => [
      {
        at: new Date().toLocaleTimeString(),
        stage,
        status,
        data,
      },
      ...entries,
    ]);
  }, []);

  const arbiUsdcBalance = useMemo(() => {
    const usdc = assets?.assets?.find((asset: any) => asset.tokenType === "usdc");
    const arbi = usdc?.chainAggregation?.find((entry: any) => entry.token?.chainId === ARBITRUM_CHAIN.chainId);
    return arbi?.amount ?? 0;
  }, [assets]);

  const baseUsdcBalance = useMemo(() => {
    const usdc = assets?.assets?.find((asset: any) => asset.tokenType === "usdc");
    const base = usdc?.chainAggregation?.find((entry: any) => entry.token?.chainId === BASE_CHAIN.chainId);
    return base?.amount ?? 0;
  }, [assets]);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await loadSDKs();
      const instance = new MagicCtor(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
        extensions: [
          new EVMExtensionCtor([
            {
              rpcUrl: getPublicRpcUrl(BASE_CHAIN),
              chainId: BASE_CHAIN.chainId,
              default: true,
            },
            {
              rpcUrl: getPublicRpcUrl(ARBITRUM_CHAIN),
              chainId: ARBITRUM_CHAIN.chainId,
            },
          ]),
        ],
      });

      await instance.auth.loginWithEmailOTP({ email });
      const resolved = await resolveMagicEoa(instance);
      if (!resolved) throw new Error("Magic did not return an EVM address");

      const universalAccount = new UniversalAccountCtor({
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
        ownerAddress: resolved,
        smartAccountOptions: {
          name: "UNIVERSAL",
          version: UNIVERSAL_ACCOUNT_VERSION,
          ownerAddress: resolved,
          useEIP7702: true,
        },
      });

      const [primaryAssets, eip7702Deployments] = await Promise.all([
        universalAccount.getPrimaryAssets(),
        universalAccount.getEIP7702Deployments(),
      ]);

      setMagic(instance);
      setUa(universalAccount);
      setOwnerAddress(resolved);
      setAssets(primaryAssets);
      setDeployments(eip7702Deployments);
      setPreview(null);
      setSendResult(null);
      setSettlementTxHash(null);
      addLog("connect", "ok", {
        ownerAddress: resolved,
        totalAmountInUSD: primaryAssets?.totalAmountInUSD,
        deployments: eip7702Deployments,
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("connect", "error", err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }, [addLog, email]);

  const handleBuildPreview = useCallback(async () => {
    if (!ua) return;
    setBusy(true);
    setError(null);
    try {
      const transaction = await ua.createTransferTransaction({
        token: {
          chainId: ARBITRUM_CHAIN.chainId,
          address: ARBITRUM_CHAIN.usdcAddress,
        },
        amount,
        receiver: MERCHANT,
      });
      const summary = summarizeCrossChainPreview(transaction);
      setPreview({ transaction, summary });
      setSendResult(null);
      setSettlementTxHash(null);
      addLog("buildPreview", "ok", {
        transactionId: transaction.transactionId,
        summary,
        tokenChanges: transaction.tokenChanges,
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("buildPreview", "error", {
        message: err?.message,
        code: err?.code,
        response: err?.response?.data,
      });
    } finally {
      setBusy(false);
    }
  }, [addLog, amount, ua]);

  const handleSend = useCallback(async () => {
    if (!ua || !magic || !preview?.transaction) return;
    if (sendConfirmation !== SEND_CONFIRMATION) {
      setError(`Type ${SEND_CONFIRMATION} to unlock the live send button.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { BrowserProvider, getBytes, Signature } = await import("ethers");
      const authorizations: Array<{ userOpHash: string; signature: string }> = [];
      const signedByNonce = new Map<string, string>();

      for (const op of preview.transaction.userOps ?? []) {
        if (op.eip7702Auth && op.eip7702Delegated === false) {
          const nonceKey = `${op.chainId}:${op.eip7702Auth.nonce}`;
          let serialized = signedByNonce.get(nonceKey);
          if (!serialized) {
            const auth = await magic.wallet.sign7702Authorization({
              contractAddress: op.eip7702Auth.address,
              chainId: op.eip7702Auth.chainId || op.chainId,
              nonce: op.eip7702Auth.nonce,
            });
            serialized = Signature.from({ r: auth.r, s: auth.s, v: auth.v }).serialized;
            signedByNonce.set(nonceKey, serialized);
          }
          authorizations.push({ userOpHash: op.userOpHash, signature: serialized });
        }
      }
      addLog("sign7702Authorizations", "ok", { count: authorizations.length });

      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(getBytes(preview.transaction.rootHash));
      addLog("signRootHash", "ok", {
        rootHash: preview.transaction.rootHash,
        signature: `${signature.slice(0, 18)}...`,
      });

      const result = await ua.sendTransaction(
        preview.transaction,
        signature,
        authorizations.length ? authorizations : undefined
      );
      setSendResult(result);
      addLog("sendTransaction", "ok", result);

      let txHash = extractEvmTxHash(result);
      for (let attempt = 0; attempt < 12 && !txHash; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const status = await ua.getTransaction(preview.transaction.transactionId);
        txHash = extractEvmTxHash(status);
        addLog("getParticleTransaction", txHash ? `hash found ${attempt}` : `pending ${attempt}`, status);
      }
      setSettlementTxHash(txHash);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      addLog("sendTransaction", "error", {
        message: err?.message,
        code: err?.code,
        response: err?.response?.data,
      });
    } finally {
      setBusy(false);
    }
  }, [addLog, magic, preview, sendConfirmation, ua]);

  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#F5F1E8] p-8 text-[#201C1A]">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-[#746D64]">Debug route disabled</p>
          <h1 className="mt-3 text-3xl font-semibold">Cross-chain proof lab</h1>
          <p className="mt-4 text-[#746D64]">
            Set <code>NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true</code> locally to use this route.
          </p>
        </section>
      </main>
    );
  }

  const tokenRows = preview ? getTokenChangeRows(preview.transaction) : [];
  const canSend = Boolean(preview?.transaction?.rootHash) && sendConfirmation === SEND_CONFIRMATION && !busy;

  return (
    <main className="min-h-screen bg-[#F5F1E8] px-4 py-8 text-[#201C1A]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[28px] border border-[#E4D8C7] bg-[#FFFDF7] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-[#7A3E73]">Controlled proof path</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Cross-chain proof lab</h1>
              <p className="mt-3 max-w-2xl text-lg text-[#746D64]">
                Build an Arbitrum-target Particle UA transfer that uses multiple EIP-7702 userOps. This does not touch
                the Base checkout or ReceiptEmitter proof path.
              </p>
            </div>
            <div className="rounded-full border border-[#E4D8C7] px-4 py-2 text-sm text-[#746D64]">
              Debug only
            </div>
          </div>
        </header>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-semibold">Error</p>
            <p className="mt-1 break-words text-sm">{error}</p>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-6 shadow-sm">
              <h2 className="text-xl font-semibold">1. Connect</h2>
              <label className="mt-5 block text-sm font-medium text-[#746D64]">Magic email</label>
              <input
                className="mt-2 w-full rounded-xl border border-[#E4D8C7] bg-white px-4 py-3 outline-none focus:border-[#7A3E73]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                className="mt-4 w-full rounded-full bg-[#201C1A] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={handleConnect}
              >
                {busy ? "Working..." : "Connect Magic + UA"}
              </button>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#746D64]">EOA</dt>
                  <dd className="font-mono">{shortAddress(ownerAddress)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#746D64]">Expected</dt>
                  <dd className={ownerAddress?.toLowerCase() === EXPECTED_OWNER.toLowerCase() ? "text-[#2F8068]" : "text-[#B7832F]"}>
                    {ownerAddress ? (ownerAddress.toLowerCase() === EXPECTED_OWNER.toLowerCase() ? "matched" : "different") : "waiting"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#746D64]">Base USDC</dt>
                  <dd>{baseUsdcBalance || "unknown"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#746D64]">Arbitrum USDC</dt>
                  <dd>{arbiUsdcBalance || "unknown"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-6 shadow-sm">
              <h2 className="text-xl font-semibold">2. Build preview</h2>
              <p className="mt-2 text-sm text-[#746D64]">
                Default `2.05 USDC` intentionally exceeds the current Arbitrum balance so Particle may build multi-chain
                userOps. Preview only; no send.
              </p>
              <label className="mt-5 block text-sm font-medium text-[#746D64]">Target amount on Arbitrum</label>
              <input
                className="mt-2 w-full rounded-xl border border-[#E4D8C7] bg-white px-4 py-3 outline-none focus:border-[#7A3E73]"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <button
                className="mt-4 w-full rounded-full bg-[#7A3E73] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || !ua}
                onClick={handleBuildPreview}
              >
                Build cross-chain preview
              </button>
            </div>

            <div className="rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-6 shadow-sm">
              <h2 className="text-xl font-semibold">3. Optional live send</h2>
              <p className="mt-2 text-sm text-[#746D64]">
                This spends real assets and does not call the Base ReceiptEmitter. Use only when you explicitly want a
                cross-chain Particle transaction proof.
              </p>
              <label className="mt-5 block text-sm font-medium text-[#746D64]">
                Type <span className="font-mono">{SEND_CONFIRMATION}</span>
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[#E4D8C7] bg-white px-4 py-3 outline-none focus:border-[#7A3E73]"
                value={sendConfirmation}
                onChange={(event) => setSendConfirmation(event.target.value)}
              />
              <button
                className="mt-4 w-full rounded-full bg-[#B7832F] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSend}
                onClick={handleSend}
              >
                Send live cross-chain transaction
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#E4D8C7] bg-[#FFFDF7] p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#746D64]">Trust Preview</p>
                  <h2 className="mt-2 text-3xl font-semibold">Cross-chain candidate</h2>
                </div>
                <span
                  className={
                    preview?.summary.crossChainCandidate
                      ? "rounded-full bg-[#E6F3ED] px-3 py-1 text-sm font-semibold text-[#2F8068]"
                      : "rounded-full bg-[#FFF4D9] px-3 py-1 text-sm font-semibold text-[#B7832F]"
                  }
                >
                  {preview?.summary.crossChainCandidate ? "multi-chain preview" : "not proven yet"}
                </span>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <PreviewMetric label="Target" value={`${amount} USDC`} detail="Arbitrum" />
                <PreviewMetric label="Merchant" value={shortAddress(MERCHANT)} detail="Receives target transfer" />
                <PreviewMetric label="Root hash" value={preview?.summary.rootHashPresent ? "ready" : "waiting"} detail="No send yet" />
              </div>

              {preview && (
                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-[#E4D8C7] bg-[#F5F1E8] p-5">
                    <h3 className="font-semibold">UserOps</h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <PreviewMetric label="Chains" value={preview.summary.userOpChainIds.join(", ") || "none"} detail="Built userOps" />
                      <PreviewMetric label="Needs 7702 auth" value={preview.summary.authRequiredChainIds.join(", ") || "none"} detail="Signed only on live send" />
                      <PreviewMetric label="Delegated" value={preview.summary.delegatedChainIds.join(", ") || "none"} detail="Already active" />
                      <PreviewMetric label="Candidate" value={preview.summary.crossChainCandidate ? "yes" : "no"} detail="For UA track proof" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E4D8C7] bg-[#F5F1E8] p-5">
                    <h3 className="font-semibold">Token sources</h3>
                    <div className="mt-3 space-y-2">
                      {tokenRows.length ? (
                        tokenRows.map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-4 rounded-xl bg-[#FFFDF7] px-4 py-3 text-sm">
                            <span>{row.amount} {row.symbol} on chain {row.chainId}</span>
                            <span className="font-mono text-xs text-[#746D64]">{shortAddress(row.senderAddress)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#746D64]">Build a preview to inspect token source rows.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {sendResult && (
              <section className="rounded-2xl border border-[#2F8068]/30 bg-[#E6F3ED] p-6 text-[#201C1A]">
                <p className="text-sm uppercase tracking-[0.18em] text-[#2F8068]">Live send result</p>
                <h2 className="mt-2 text-2xl font-semibold">Particle transaction submitted</h2>
                {settlementTxHash ? (
                  <a
                    className="mt-4 inline-flex rounded-full bg-[#2F8068] px-4 py-2 text-sm font-semibold text-white"
                    href={getExplorerTxUrl(ARBITRUM_CHAIN, settlementTxHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Arbiscan tx
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-[#746D64]">
                    Particle accepted the transaction; settlement hash has not surfaced yet.
                  </p>
                )}
              </section>
            )}

            <details className="rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold">Raw debug data</summary>
              <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl bg-[#201C1A] p-4 text-xs text-[#FFFDF7]">
                {JSON.stringify({ deployments, preview: preview?.transaction, sendResult, logs }, null, 2)}
              </pre>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#E4D8C7] bg-[#FFFDF7] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#746D64]">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#746D64]">{detail}</p>
    </div>
  );
}
