/** @type {import('next').NextConfig} */

// Baseline security headers (audit F6). Conservative set that does not affect Magic/OAuth or the
// payment flow: block MIME sniffing, trim the referrer, and disallow cross-origin framing. CSP is
// intentionally deferred (needs a Magic/Particle smoke pass before locking script/connect sources).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
