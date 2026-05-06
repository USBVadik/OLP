import "./globals.css";

export const metadata = {
  title: "OneLink Pay",
  description: "Invisible crypto checkout with safe spend caps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
