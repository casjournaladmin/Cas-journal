import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // Top-level journal home shortcuts
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)",
        destination: "/journals/:journal",
      },
      // Journal-scoped subpages
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/about",
        destination: "/journals/:journal/about",
      },
      {
        source:
          "/:journal(existentia|concrescence|cjmr|izu|polis)/editorial-board",
        destination: "/journals/:journal/editorial-board",
      },
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/archives",
        destination: "/archives?journal=:journal",
      },
      {
        source:
          "/:journal(existentia|concrescence|cjmr|izu|polis)/announcements",
        destination: "/announcements?journal=:journal",
      },
      {
        source:
          "/:journal(existentia|concrescence|cjmr|izu|polis)/current-issue",
        destination: "/current-issue?journal=:journal",
      },
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/contact",
        destination: "/contact?journal=:journal",
      },
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/submit",
        destination: "/author/submissions/new?journal=:journal",
      },
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/for-authors",
        destination: "/submissions?journal=:journal",
      },
      {
        source:
          "/:journal(existentia|concrescence|cjmr|izu|polis)/author-guidelines",
        destination: "/journals/:journal",
      },
      {
        source: "/:journal(existentia|concrescence|cjmr|izu|polis)/editor",
        destination: "/editor/:journal",
      },
    ];
  },
};

export default nextConfig;
