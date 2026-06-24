"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Chip, IconCheck } from "@/components/ui";

/**
 * ReceiveCard — the "receive into one balance" face of the Universal Account. Send USDC to this
 * address on ANY supported chain and it shows up as one balance (no bridging). Read-only: it just
 * displays the account address + a QR; it never signs or moves funds.
 */
export function ReceiveCard({ address }: { address: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(address, {
      margin: 1,
      width: 200,
      color: { dark: "#23201B", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        /* QR is a nicety; the address + copy still work */
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the address is visible to copy manually */
    }
  };

  return (
    <div className="op-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="op-eyebrow">Receive</span>
        <Chip tone="gold">any chain &rarr; one balance</Chip>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Send USDC to this address on any supported chain — it lands as one Universal Account balance,
        with no bridging and no chain to pick.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code of your account address"
            width={120}
            height={120}
            className="shrink-0 rounded-xl border border-line"
          />
        ) : (
          <div className="h-[120px] w-[120px] shrink-0 rounded-xl border border-line bg-paper2" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="op-eyebrow">Your account</p>
          <p className="mt-1 break-all font-mono text-xs leading-relaxed text-ink2">{address}</p>
          <button onClick={copy} className="op-btn-secondary mt-3">
            {copied ? (
              <>
                <IconCheck className="h-4 w-4 text-verify" /> Copied
              </>
            ) : (
              "Copy address"
            )}
          </button>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-faint">
        Supported via Particle: Base, Arbitrum, Optimism, Ethereum, Polygon, BNB Chain, Avalanche,
        Solana, and more — 15 chains, one balance.
      </p>
    </div>
  );
}
