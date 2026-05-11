import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuralHub — Centralized AI Management for Your SaaS Platform",
  description:
    "One gateway for every AI model, agent, knowledge base, and automation workflow. Build smarter SaaS products with NeuralHub's enterprise-grade AI management platform.",
  keywords: [
    "AI management platform",
    "LLM gateway",
    "AI agents",
    "LangChain",
    "RAG",
    "AI SaaS",
    "NeuralHub",
    "codeswayam",
  ],
  authors: [{ name: "Codeswayam" }],
  openGraph: {
    title: "NeuralHub — Centralized AI Management",
    description:
      "One gateway for every AI model, agent, and automation workflow in your SaaS platform.",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@codeswayam/analytics";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Analytics
          gtmId={process.env.NEXT_PUBLIC_GTM_ID}
          ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
          metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
          appName="neural"
        />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
