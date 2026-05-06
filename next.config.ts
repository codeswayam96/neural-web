import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Reverse proxy for neural-api (hosted on Render free tier — no custom domain available).
   *
   * Problem: neural-api is at *.onrender.com — a different domain from neural.codeswayam.com.
   * This means:
   *   1. Browsers block CORS requests to *.onrender.com from neural.codeswayam.com
   *   2. The Authentication cookie (domain=.codeswayam.com) is never sent to Render
   *
   * Solution: All neural-api calls go to /neural-proxy/* on neural.codeswayam.com (same origin).
   * Vercel server-side rewrites these to NEURAL_API_INTERNAL_URL (the Render URL).
   * The Render URL is NEVER exposed to the browser — it's a server-side-only env var.
   *
   * In the frontend, set NEXT_PUBLIC_NEURAL_API_URL=/neural-proxy (in Vercel env vars).
   * In local dev, NEXT_PUBLIC_NEURAL_API_URL=http://localhost:3006 bypasses the proxy.
   */
  async rewrites() {
    const renderUrl = process.env.NEURAL_API_INTERNAL_URL;
    if (!renderUrl) return []; // Dev: no rewrite needed, direct localhost call
    return [
      {
        source: '/neural-proxy/:path*',
        destination: `${renderUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
