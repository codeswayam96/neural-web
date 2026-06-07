"use client";

import { CSWProvider } from "@codeswayam/auth";

// neural-web authenticates via JWT cookie (from codeswayam-auth), NOT via API key.
// All API calls go through /api/neural proxy which forwards the JWT.
// The @codeswayam/neural SDK is for external SaaS backends (auraflow, ems, etc.) only.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CSWProvider
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
      authDomain={process.env.NEXT_PUBLIC_AUTH_URL}
    >
      {children}
    </CSWProvider>
  );
}
