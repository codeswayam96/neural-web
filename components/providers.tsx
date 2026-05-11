"use client";

import { NeuralProvider } from "@codeswayam/neural/react";
import { CSWProvider } from "@codeswayam/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CSWProvider
      apiUrl={process.env.NEXT_PUBLIC_API_URL}
      authDomain={process.env.NEXT_PUBLIC_AUTH_URL}
    >
      <NeuralProvider
        config={{
          apiKey: process.env.NEXT_PUBLIC_NEURAL_API_KEY || "nhub_internal",
          baseUrl: process.env.NEXT_PUBLIC_NEURAL_API_URL || "http://localhost:3006",
        }}
      >
        {children}
      </NeuralProvider>
    </CSWProvider>
  );
}
