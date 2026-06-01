import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CloudFront domain that serves art images. Optional until the media pipeline
// is provisioned; when present we allow it as a remote image source.
const cloudfrontUrl = process.env.CLOUDFRONT_URL;

/**
 * Content-Security-Policy.
 *
 * Goal: mitigate XSS by constraining where scripts/styles/frames can load from.
 * Stripe.js and Stripe Checkout require their domains in script-src / frame-src
 * / connect-src. Next.js injects some inline styles (Tailwind) so style-src
 * keeps 'unsafe-inline'. In dev we additionally allow 'unsafe-eval' for HMR.
 *
 * NEXT STEP (tracked in docs/IMPLEMENTATION.md): move script-src to a per-request
 * nonce to drop 'unsafe-inline' on scripts entirely.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://js.stripe.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://api.stripe.com ${isDev ? "ws: http://localhost:*" : ""}`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
]
  .join("; ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for 2 years, including subdomains. Safe behind Vercel/CloudFront TLS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: cloudfrontUrl
      ? [{ protocol: "https", hostname: new URL(cloudfrontUrl).hostname }]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
