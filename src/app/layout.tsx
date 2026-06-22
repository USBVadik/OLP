import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Resolved at build time. Set NEXT_PUBLIC_APP_URL in production so OG/Twitter
// images resolve to absolute URLs; fall back to Vercel's deploy URL, then local.
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const title = "OneLink Pay — Give your AI a card, not your wallet.";
const description =
  "A Permission Firewall for Universal Accounts. Give AI agents a card, not your wallet: on-chain spend limits, instant revoke, and a verifiable proof receipt for every charge.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title,
  description,
  applicationName: "OneLink Pay",
  openGraph: {
    type: "website",
    siteName: "OneLink Pay",
    url: "/",
    title,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "OneLink Pay — a Permission Firewall for AI agents on Universal Accounts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
