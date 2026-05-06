"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { encodeFunctionData, type Address } from "viem";
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_USDC,
  BASE_MAINNET_CHAIN_ID,
  BASE_MAINNET_USDC,
  ERC20_APPROVE_ABI,
  RECEIPT_EMITTER_ABI,
  getArbitrumReceiptEmitterAddress,
  getReceiptEmitterAddress,
} from "@/lib/contracts/receipt-emitter";

const MERCHANT: Address = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
const PROBE_AMOUNT_ATOMIC = "10000"; // 0.01 USDC
const FULL_INVOICE_AMOUNT_ATOMIC = "100000"; // 0.10 USDC registered invoice
const DEFAULT_INVOICE_ID =
  "0x860e092e17e1a54c054e411f48781dcca1a474c878f7f35d754f1c587a2e08bd";

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

type ProbeName =
  | "Probe A createTransferTransaction"
  | "Probe B createUniversalTransaction USDC.transfer"
  | "Probe C createUniversalTransaction USDC.approve"
  | "Probe D createUniversalTransaction approve + payInvoice"
  | "Probe A Arbitrum createTransferTransaction"
  | "Probe B Arbitrum createUniversalTransaction USDC.transfer"
  | "Probe C Arbitrum createUniversalTransaction USDC.approve"
  | "Probe D Arbitrum createUniversalTransaction approve + payInvoice";

interface ProbeResult {
  probeName: ProbeName;
  network: "Base" | "Arbitrum";
  method: string;
  chainId: number;
  token: string;
  amountAtomic: string;
  recipientOrContract: string;
  createdTransaction: boolean;
  rootHashPresent: boolean;
  userOpsLength: number;
  userOpKeys: string[];
  hasEip7702Auth: boolean;
  eip7702Delegated: boolean | null;
  feeQuotesPresent: boolean;
  tokenChangesPresent: boolean;
  exactErrorMessage: string | null;
  exactErrorCode: string | number | null;
  stage: "build" | "preview" | "auth" | "sign" | "send";
  isParticleMaintenanceError: boolean;
  raw?: unknown;
}

interface ProbeTarget {
  network: "Base" | "Arbitrum";
  chainId: number;
  usdc: Address;
  receiptEmitter: Address | null;
  invoiceId: string;
}

let MagicCtor: any = null;
let UniversalAccountCtor: any = null;
let SUPPORTED_TOKEN_TYPE: any = null;

async function loadSDKs() {
  if (!MagicCtor) {
    const magicMod = await import("magic-sdk");
    MagicCtor = magicMod.Magic;
  }
  if (!UniversalAccountCtor) {
    const particleMod = await import("@particle-network/universal-account-sdk");
    UniversalAccountCtor = particleMod.UniversalAccount;
    SUPPORTED_TOKEN_TYPE = particleMod.SUPPORTED_TOKEN_TYPE;
  }
}

function findDeepKey(value: unknown, targetKeys: string[], depth = 0): boolean {
  if (!value || depth > 8) return false;
  if (Array.isArray(value)) return value.some((item) => findDeepKey(item, targetKeys, depth + 1));
  if (typeof value !== "object") return false;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (targetKeys.includes(key)) return true;
    if (findDeepKey(nested, targetKeys, depth + 1)) return true;
  }
  return false;
}

function getUserOps(transaction: any): any[] {
  return transaction?.userOps ?? transaction?.data?.userOps ?? [];
}

function summarizeTransaction(probe: Omit<ProbeResult, "createdTransaction" | "rootHashPresent" | "userOpsLength" | "userOpKeys" | "hasEip7702Auth" | "eip7702Delegated" | "feeQuotesPresent" | "tokenChangesPresent" | "exactErrorMessage" | "exactErrorCode" | "isParticleMaintenanceError" | "raw">, transaction: any): ProbeResult {
  const userOps = getUserOps(transaction);
  const userOpKeys = Array.from(
    new Set(
      userOps.flatMap((entry: any) => {
        const userOp = entry?.userOp ?? {};
        return Object.keys(userOp);
      })
    )
  );
  const authValues = userOps
    .map((entry: any) => entry?.userOp?.eip7702Auth ?? entry?.eip7702Auth)
    .filter(Boolean);
  const delegatedValue = authValues
    .map((auth: any) => auth?.eip7702Delegated)
    .find((value: unknown) => typeof value === "boolean");

  return {
    ...probe,
    createdTransaction: true,
    rootHashPresent: Boolean(transaction?.rootHash),
    userOpsLength: userOps.length,
    userOpKeys,
    hasEip7702Auth: authValues.length > 0,
    eip7702Delegated: typeof delegatedValue === "boolean" ? delegatedValue : null,
    feeQuotesPresent: findDeepKey(transaction, ["feeQuotes", "feeQuote", "fees", "feeTokens"]),
    tokenChangesPresent: findDeepKey(transaction, ["tokenChanges", "tokenChange", "tokenChangesPreview"]),
    exactErrorMessage: null,
    exactErrorCode: null,
    isParticleMaintenanceError: false,
    raw: transaction,
  };
}

function summarizeError(
  probe: Omit<ProbeResult, "createdTransaction" | "rootHashPresent" | "userOpsLength" | "userOpKeys" | "hasEip7702Auth" | "eip7702Delegated" | "feeQuotesPresent" | "tokenChangesPresent" | "exactErrorMessage" | "exactErrorCode" | "isParticleMaintenanceError" | "raw">,
  error: any
): ProbeResult {
  const message =
    error?.response?.data?.message ??
    error?.data?.message ??
    error?.message ??
    String(error);
  const code = error?.response?.data?.code ?? error?.data?.code ?? error?.code ?? null;

  return {
    ...probe,
    createdTransaction: false,
    rootHashPresent: false,
    userOpsLength: 0,
    userOpKeys: [],
    hasEip7702Auth: false,
    eip7702Delegated: null,
    feeQuotesPresent: false,
    tokenChangesPresent: false,
    exactErrorMessage: message,
    exactErrorCode: code,
    isParticleMaintenanceError: /maint/i.test(message),
    raw: {
      message,
      code,
      response: error?.response?.data,
    },
  };
}

function formatReportLine(value: unknown) {
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  return String(value);
}

export default function ParticleProbePage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_PROBES === "true";
  const receiptEmitter = useMemo(() => {
    try {
      return getReceiptEmitterAddress();
    } catch {
      return null;
    }
  }, []);
  const arbitrumReceiptEmitter = useMemo(() => getArbitrumReceiptEmitterAddress(), []);
  const [email, setEmail] = useState("usbvadik@gmail.com");
  const [invoiceId, setInvoiceId] = useState(DEFAULT_INVOICE_ID);
  const [arbitrumInvoiceId, setArbitrumInvoiceId] = useState("");
  const [magic, setMagic] = useState<any>(null);
  const [ua, setUa] = useState<any>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [uaAddress, setUaAddress] = useState<string | null>(null);
  const [primaryAssetsStatus, setPrimaryAssetsStatus] = useState("not loaded");
  const [status, setStatus] = useState("Idle");
  const [results, setResults] = useState<ProbeResult[]>([]);

  useEffect(() => {
    if (!enabled) return;
    loadSDKs().then(() => {
      setMagic(new MagicCtor(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!));
    });
  }, [enabled]);

  const connect = useCallback(async () => {
    if (!magic) return;
    setStatus("Connecting Magic...");
    await loadSDKs();

    const loggedIn = await magic.user.isLoggedIn();
    if (!loggedIn) {
      await magic.auth.loginWithMagicLink({ email });
    }

    const metadata = await magic.user.getInfo();
    if (!metadata.publicAddress) throw new Error("Magic did not return publicAddress");
    setOwnerAddress(metadata.publicAddress);

    const universalAccount = new UniversalAccountCtor({
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
      ownerAddress: metadata.publicAddress,
    });
    setUa(universalAccount);

    try {
      const options = await universalAccount.getSmartAccountOptions();
      setUaAddress(options?.smartAccountAddress ?? options?.senderAddress ?? null);
    } catch {
      setUaAddress(null);
    }

    try {
      await universalAccount.getPrimaryAssets();
      setPrimaryAssetsStatus("loaded");
    } catch (error: any) {
      setPrimaryAssetsStatus(`error: ${error?.message ?? String(error)}`);
    }

    setStatus("Connected");
  }, [email, magic]);

  const runProbe = useCallback(
    async (probeName: ProbeName): Promise<ProbeResult> => {
      if (!ua) throw new Error("Connect Magic + Particle UA first");
      await loadSDKs();

      const isArbitrum = probeName.includes("Arbitrum");
      const target: ProbeTarget = isArbitrum
        ? {
            network: "Arbitrum",
            chainId: ARBITRUM_MAINNET_CHAIN_ID,
            usdc: ARBITRUM_MAINNET_USDC,
            receiptEmitter: arbitrumReceiptEmitter,
            invoiceId: arbitrumInvoiceId,
          }
        : {
            network: "Base",
            chainId: BASE_MAINNET_CHAIN_ID,
            usdc: BASE_MAINNET_USDC,
            receiptEmitter,
            invoiceId,
          };
      const isFullInvoiceProbe = probeName.includes("approve + payInvoice");
      const isTransferRailProbe = probeName.includes("createTransferTransaction");
      const isUniversalTransferProbe = probeName.includes("USDC.transfer");
      const isUniversalApproveProbe = probeName.includes("USDC.approve");
      const approveSpender = target.receiptEmitter ?? MERCHANT;
      const particleAmount = isFullInvoiceProbe ? "0.1" : "0.01";
      const amountAtomic = isFullInvoiceProbe
        ? FULL_INVOICE_AMOUNT_ATOMIC
        : PROBE_AMOUNT_ATOMIC;
      const base = {
        probeName,
        network: target.network,
        chainId: target.chainId,
        token: target.usdc,
        amountAtomic,
        stage: "build" as const,
      };

      try {
        if (isTransferRailProbe) {
          const tx = await ua.createTransferTransaction({
            token: {
              chainId: target.chainId,
              address: target.usdc,
            },
            amount: particleAmount,
            receiver: MERCHANT,
          });
          return summarizeTransaction(
            {
              ...base,
              method: "createTransferTransaction",
              recipientOrContract: MERCHANT,
            },
            tx
          );
        }

        if (isFullInvoiceProbe && (!target.receiptEmitter || !target.invoiceId)) {
          throw new Error(`${target.network} ReceiptEmitter/invoiceId is not configured; skipping approve + payInvoice probe.`);
        }

        const transactions =
          isUniversalTransferProbe
            ? [
                {
                  to: target.usdc,
                  data: encodeFunctionData({
                    abi: ERC20_TRANSFER_ABI,
                    functionName: "transfer",
                    args: [MERCHANT, BigInt(amountAtomic)],
                  }),
                  value: "0",
                },
              ]
            : isUniversalApproveProbe
              ? [
                  {
                    to: target.usdc,
                    data: encodeFunctionData({
                      abi: ERC20_APPROVE_ABI,
                      functionName: "approve",
                      args: [approveSpender, BigInt(amountAtomic)],
                    }),
                    value: "0",
                  },
                ]
              : [
                  {
                    to: target.usdc,
                    data: encodeFunctionData({
                      abi: ERC20_APPROVE_ABI,
                      functionName: "approve",
                      args: [target.receiptEmitter!, BigInt(amountAtomic)],
                    }),
                    value: "0",
                  },
                  {
                    to: target.receiptEmitter!,
                    data: encodeFunctionData({
                      abi: RECEIPT_EMITTER_ABI,
                      functionName: "payInvoice",
                      args: [target.invoiceId as `0x${string}`],
                    }),
                    value: "0",
                  },
                ];

        const tx = await ua.createUniversalTransaction({
          chainId: target.chainId,
          expectTokens: [
            {
              type: SUPPORTED_TOKEN_TYPE.USDC,
              amount: particleAmount,
            },
          ],
          transactions,
        });

        return summarizeTransaction(
          {
            ...base,
            method: "createUniversalTransaction",
            recipientOrContract:
              isUniversalTransferProbe
                ? target.usdc
                : approveSpender,
          },
          tx
        );
      } catch (error: any) {
        return summarizeError(
          {
            ...base,
            method:
              isTransferRailProbe
                ? "createTransferTransaction"
                : "createUniversalTransaction",
            recipientOrContract:
              isUniversalTransferProbe
                ? target.usdc
                : isTransferRailProbe
                  ? MERCHANT
                  : approveSpender,
          },
          error
        );
      }
    },
    [arbitrumInvoiceId, arbitrumReceiptEmitter, invoiceId, receiptEmitter, ua]
  );

  const runAll = useCallback(async () => {
    setResults([]);
    const probeNames: ProbeName[] = [
      "Probe A createTransferTransaction",
      "Probe B createUniversalTransaction USDC.transfer",
      "Probe C createUniversalTransaction USDC.approve",
      "Probe D createUniversalTransaction approve + payInvoice",
    ];

    const nextResults: ProbeResult[] = [];
    for (const probeName of probeNames) {
      setStatus(`Running ${probeName}...`);
      const result = await runProbe(probeName);
      nextResults.push(result);
      setResults([...nextResults]);
    }
    setStatus("Probe matrix complete. No transactions were sent.");
  }, [runProbe]);

  const runArbitrumAll = useCallback(async () => {
    setResults([]);
    const probeNames: ProbeName[] = [
      "Probe A Arbitrum createTransferTransaction",
      "Probe B Arbitrum createUniversalTransaction USDC.transfer",
      "Probe C Arbitrum createUniversalTransaction USDC.approve",
    ];
    if (arbitrumReceiptEmitter && arbitrumInvoiceId) {
      probeNames.push("Probe D Arbitrum createUniversalTransaction approve + payInvoice");
    }

    const nextResults: ProbeResult[] = [];
    for (const probeName of probeNames) {
      setStatus(`Running ${probeName}...`);
      const result = await runProbe(probeName);
      nextResults.push(result);
      setResults([...nextResults]);
    }
    setStatus("Arbitrum probe matrix complete. No transactions were sent.");
  }, [arbitrumInvoiceId, arbitrumReceiptEmitter, runProbe]);

  if (!enabled) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6">
          <h1 className="text-xl font-bold">Particle Probe Disabled</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set <code>NEXT_PUBLIC_ENABLE_DEBUG_PROBES=true</code> locally to enable this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-lg border bg-white p-5">
          <h1 className="text-xl font-bold">Particle UA Probe Matrix</h1>
          <p className="mt-1 text-sm text-gray-600">
            Local debug only. This page builds previews/rootHash only and never sends transactions.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="block text-gray-600">Magic email</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600">Invoice id for Probe D</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
                value={invoiceId}
                onChange={(event) => setInvoiceId(event.target.value)}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-gray-600">Arbitrum invoice id for optional Probe D</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
                value={arbitrumInvoiceId}
                onChange={(event) => setArbitrumInvoiceId(event.target.value)}
                placeholder="Only needed if ReceiptEmitter is deployed on Arbitrum"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={connect}
              disabled={!magic}
            >
              Connect Magic + UA
            </button>
            <button
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={runAll}
              disabled={!ua}
            >
              Run Base Probe Matrix
            </button>
            <button
              className="rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={runArbitrumAll}
              disabled={!ua}
            >
              Run Arbitrum Probe Matrix
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-700">{status}</p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold">Environment</h2>
          <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
{`Particle UA SDK version: 1.1.1
Magic SDK version: 29.4.2
Next version: 14.2.35
ownerAddress: ${ownerAddress ?? "not connected"}
UA address if available: ${uaAddress ?? "not available"}
getPrimaryAssets: ${primaryAssetsStatus}
Base chain id: ${BASE_MAINNET_CHAIN_ID}
Base USDC: ${BASE_MAINNET_USDC}
Base ReceiptEmitter: ${receiptEmitter ?? "not configured"}
Base invoiceId: ${invoiceId}
Arbitrum chain id: ${ARBITRUM_MAINNET_CHAIN_ID}
Arbitrum USDC: ${ARBITRUM_MAINNET_USDC}
Arbitrum ReceiptEmitter: ${arbitrumReceiptEmitter ?? "not configured"}
Arbitrum invoiceId: ${arbitrumInvoiceId || "not configured"}
Merchant: ${MERCHANT}`}
          </pre>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold">Probe Results</h2>
          <div className="mt-3 space-y-3">
            {results.map((result) => (
              <details key={result.probeName} open className="rounded border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {result.probeName}: {result.createdTransaction ? "created" : "failed"}
                </summary>
                <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
{`${result.probeName}:
- result: ${result.createdTransaction ? "created transaction" : "failed"}
- network: ${result.network}
- method: ${result.method}
- chainId: ${result.chainId}
- token: ${result.token}
- amountAtomic: ${result.amountAtomic}
- recipient/contract: ${result.recipientOrContract}
- rootHash: ${formatReportLine(result.rootHashPresent)}
- userOps length: ${result.userOpsLength}
- userOp keys: ${formatReportLine(result.userOpKeys)}
- hasEip7702Auth: ${formatReportLine(result.hasEip7702Auth)}
- eip7702Delegated: ${formatReportLine(result.eip7702Delegated)}
- feeQuotes present: ${formatReportLine(result.feeQuotesPresent)}
- tokenChanges present: ${formatReportLine(result.tokenChangesPresent)}
- stage: ${result.stage}
- Particle maintenance error: ${formatReportLine(result.isParticleMaintenanceError)}
- error code: ${formatReportLine(result.exactErrorCode)}
- error: ${formatReportLine(result.exactErrorMessage)}`}
                </pre>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600">Raw result/error</summary>
                  <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </details>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
