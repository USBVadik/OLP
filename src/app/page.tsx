import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">OneLink Pay</h1>
      <p className="text-lg text-gray-600 max-w-md text-center">
        Invisible crypto checkout with safe spend caps.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Merchant Dashboard
        </Link>
        <Link
          href="/checkout/demo"
          className="px-6 py-3 border border-black rounded-lg"
        >
          Demo Checkout
        </Link>
      </div>
    </main>
  );
}
