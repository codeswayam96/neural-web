# NeuralHub Dashboard (neural-web)

## Overview
**neural-web** is the AI Orchestration dashboard for the CodeSwayam platform. Built with **Next.js** (App Router), **React 19**, and **Tailwind CSS**, it serves as the control center for developers and platform tenants to configure AI agents, track query latency logs, manage API sub-keys, and monitor LLM usage credits.

---

## 🎯 Key Features
- **Agent Orchestrator**: Configure system prompts, model parameters (Gemini, etc.), and RAG knowledge-base linkages.
- **Key Management**: Issue, track, and revoke sub-keys with configured daily rate-limits.
- **Latency & Log Analytics**: Track and debug AI agent execution latency and request payloads in real-time.
- **Credits Wallet**: View active credit balances and transaction histories.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16.x (React 19.x)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, `@codeswayam/ui`
- **Analytics**: `@codeswayam/analytics`
- **HTTP client**: `@codeswayam/api-client`
- **AI client**: `@codeswayam/neural`

---

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3003
```

### 3. Start Development Server
```bash
npm run dev
# Running on http://localhost:3008
```

---

## 🚀 Build and Deploy
```bash
npm run build
npm start
```
