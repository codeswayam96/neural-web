# NeuralHub — AI Dashboard Platform

> **neural-web** · Next.js 16 · React 19 · TypeScript  
> The primary web client for the NeuralHub AI platform. Manage agents, models, workflows, knowledge bases, and image generation from a single, real-time dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [Application Routes](#application-routes)
6. [Component Inventory](#component-inventory)
7. [Library & SDK Layer](#library--sdk-layer)
8. [Data Flow & Real-Time Events](#data-flow--real-time-events)
9. [API Client Reference](#api-client-reference)
10. [Environment Variables](#environment-variables)
11. [Development Setup](#development-setup)
12. [Code Examples](#code-examples)
13. [Authentication & Middleware](#authentication--middleware)
14. [Theming](#theming)
15. [Project Structure](#project-structure)

---

## Overview

NeuralHub is a full-featured AI operations platform. **neural-web** is its web frontend — a Next.js 16 App Router application that surfaces every capability of the NeuralHub backend: multi-provider LLM inference, autonomous agent orchestration, visual workflow pipelines, retrieval-augmented generation (RAG), text-to-image generation, and deep usage analytics.

Key design goals:

- **Real-time first.** Every AI execution emits live trace events over WebSocket so operators see exactly what is happening inside a model call or agent loop as it runs.
- **Multi-model agnostic.** Gemini, GPT-4, and self-hosted Ollama models are first-class citizens behind a single unified interface.
- **Operator-grade tooling.** Credit tracking, per-key cost analytics, and an admin panel give platform operators the visibility they need to run AI infrastructure responsibly.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                           │
│                                                                     │
│  ┌──────────────┐   ┌───────────────────┐   ┌──────────────────┐   │
│  │  Next.js App │   │  Socket.io Client │   │  Theme Provider  │   │
│  │  Router      │   │  /neural-events   │   │  (dark / light)  │   │
│  │  (RSC + CSR) │   │  namespace        │   └──────────────────┘   │
│  └──────┬───────┘   └────────┬──────────┘                          │
│         │                    │  WebSocket (real-time traces)        │
└─────────┼────────────────────┼────────────────────────────────────-┘
          │ HTTPS / REST       │
          ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NeuralHub Backend Services                     │
│                                                                     │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │  Core API       │   │  WebSocket /     │   │  Auth Service   │  │
│  │  (REST + Neural │   │  neural-events   │   │  (CSW Auth)     │  │
│  │  merged)        │   │  NEXT_PUBLIC_    │   │  NEXT_PUBLIC_   │  │
│  │  port 3000      │   │  SOCKET_URL      │   │  AUTH_URL       │  │
│  └────────┬────────┘   └──────────────────┘   └─────────────────┘  │
│           │                                                         │
│  ┌────────▼────────────────────────────────────────────────────┐   │
│  │               AI Provider Backends                          │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐    │   │
│  │  │  Gemini  │   │  GPT-4   │   │  Ollama (self-hosted) │    │   │
│  │  └──────────┘   └──────────┘   └──────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser Request
      │
      ▼
Next.js Middleware (withCSWAuth)
      │
      ├── /auth/callback  ──► Public, passes through
      │
      └── /* (all other)  ──► Validate JWT / session
                                    │
                          ┌─────────┴──────────┐
                          │ Valid              │ Invalid
                          ▼                   ▼
                     Route Handler      Redirect to
                          │             Auth Service
                          ▼
                   React Server Component
                          │
                          ▼
                   Client Components
                   (hooks, SDK calls)
                          │
                          ▼
                   lib/neural-api.ts  ──►  NeuralHub REST API
                   lib/socket.ts      ──►  WebSocket /neural-events
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16 | App Router, RSC, SSR/SSG |
| UI Runtime | React | 19 | Component model, Suspense |
| Language | TypeScript | Latest | Type safety across the stack |
| Auth | @codeswayam/auth | 2.5.1 | SSO / JWT middleware |
| AI SDK | @codeswayam/neural | 1.0.3 | NeuralHub API client |
| Analytics | @codeswayam/analytics | Latest | Usage event tracking |
| HTTP Client | axios | Latest | REST API calls |
| Real-time | socket.io-client | Latest | Live AI execution traces |

---

## Features

### 1. Real-Time AI Execution Tracing

The **Trace Inspector Drawer** (`trace-inspector-drawer.tsx`, 20 KB) connects to the `/neural-events` Socket.io namespace and streams every step of a running AI execution in real time — token generation, tool calls, retrieval steps, errors, and timing breakdowns. Operators can open the drawer for any running job and watch its internal state evolve without refreshing.

### 2. Multi-Model Support

The Models page (`/models`) and the underlying `neural-api.ts` support:

- **Google Gemini** (Gemini 1.5 Pro, Flash)
- **OpenAI GPT-4 / GPT-4o**
- **Ollama** — self-hosted open-weight models (Llama 3, Mistral, Phi-3, etc.)

Each model is configured with provider credentials, context window limits, and cost-per-token metadata tracked for billing.

### 3. Agent Configuration

The Agents page (`/agents`) provides a full agent management interface:

- Create and name agents with custom **system prompts**
- Set inference parameters: **temperature**, **max tokens**, **top-p**, **stop sequences**
- Choose backing model per agent
- **Test agents inline** with a built-in chat interface
- Attach agents to knowledge bases for RAG-augmented responses

### 4. Visual Workflow Builder

The Workflows page (`/workflows`) is a multi-step AI pipeline builder:

- Chain LLM calls, branching logic, tool invocations, and data transforms
- Each step produces typed outputs consumed by the next
- Workflows are versioned and can be triggered via API key or scheduled

### 5. Knowledge Base & RAG

The Knowledge Base page (`/knowledge-base`) manages document collections for Retrieval-Augmented Generation:

- Upload PDFs, DOCX, plain text, and Markdown documents
- Documents are automatically chunked and embedded on the backend
- Query knowledge bases directly from the UI to validate retrieval quality
- Attach bases to agents or workflow steps

### 6. Image Generation

The Image Generation page (`/image-generation`) provides a prompt-to-image interface:

- Supports multiple backends (Stable Diffusion, DALL-E, Imagen)
- Configurable resolution, guidance scale, negative prompts, and seed
- Gallery view of previously generated images with metadata

### 7. Per-Key Analytics & Cost Tracking

The Analytics page (`/analytics`) breaks down usage by API key:

- Token consumption over time (input vs. output tokens)
- Cost attribution per key, per model, per agent
- Request latency percentiles (p50, p95, p99)
- Error rate trends

### 8. Dark / Light Theme

Global theme toggle (`theme-toggle.tsx`) backed by `theme-provider.tsx`. Theme preference is persisted to `localStorage` and applied server-side via a cookie to eliminate flash-of-wrong-theme on first render.

---

## Application Routes

| Route | Type | Description | Auth Required |
|---|---|---|---|
| `/` | Page | NeuralHub landing page and product overview | No |
| `/dashboard` | Page | Main AI dashboard — active jobs, credit balance, recent activity, system metrics | Yes |
| `/agents` | Page | Agent directory — list, create, edit, delete, and test AI agents | Yes |
| `/agents/[id]` | Page | Agent detail — full configuration editor and inline test console | Yes |
| `/models` | Page | LLM model registry — add models, configure provider credentials, view quotas | Yes |
| `/models/[id]` | Page | Model detail — benchmark stats, usage history, configuration | Yes |
| `/workflows` | Page | Workflow pipeline list — create and manage multi-step AI pipelines | Yes |
| `/workflows/[id]` | Page | Workflow canvas — visual step editor, trigger configuration, version history | Yes |
| `/knowledge-base` | Page | Document collection management — upload, index, query | Yes |
| `/knowledge-base/[id]` | Page | Collection detail — documents, embedding stats, test retrieval | Yes |
| `/image-generation` | Page | Text-to-image dashboard — prompt input, parameter controls, gallery | Yes |
| `/analytics` | Page | Usage analytics — charts, cost breakdown, export | Yes |
| `/api-keys` | Page | API key management — create, rotate, revoke, set rate limits | Yes |
| `/billing` | Page | Subscription plan, credit balance, invoices, payment methods | Yes |
| `/settings` | Page | Account and application settings | Yes |
| `/auth/callback` | Page | OAuth/SSO callback handler — public route, no auth required | No |
| `/admin` | Page | Admin panel — user management, platform configuration (scoped to admin role) | Yes (Admin) |

---

## Component Inventory

### Core Layout Components

| Component | File | Size | Description |
|---|---|---|---|
| Navbar | `components/navbar.tsx` | ~13 KB | Top navigation bar. Displays active route, user profile, **real-time credit balance**, notifications, and model selector. Contains animated credit counter that updates via WebSocket events. |
| Theme Toggle | `components/theme-toggle.tsx` | Small | Sun/moon toggle button. Reads and writes theme preference. Integrates with `next-themes` or custom ThemeProvider. |
| Theme Provider | `components/theme-provider.tsx` | Small | React context provider that wraps the app. Reads system preference on first load, applies `dark` / `light` class to `<html>`. Persists selection. |
| Error Boundary | `components/error-boundary.tsx` | Small | React class-based error boundary. Catches render errors in any subtree, renders a fallback UI with error details (in development) or a generic message (production). Reports errors to the analytics layer. |

### Feature Components

| Component | File | Description |
|---|---|---|
| Trace Inspector Drawer | `components/trace-inspector-drawer.tsx` | **The most complex component (20 KB).** A slide-in drawer that subscribes to the `/neural-events` Socket.io namespace for a given execution ID. Renders a live, auto-scrolling timeline of trace events: token chunks, tool calls, retrieval results, errors, and per-step timing. Includes filters by event type, copy-to-clipboard for payloads, and a latency flame chart. |

### Provider Components

Providers are likely co-located under `components/providers/` or `app/providers/` and wrap the app shell to supply context for auth state, theme, and socket connection lifecycle.

---

## Library & SDK Layer

### `lib/neural-api.ts` (~17 KB)

The central API client. Wraps the `@codeswayam/neural` SDK and exposes typed functions for every backend capability. All functions use `axios` under the hood with a shared interceptor that attaches the current auth token from the CSW Auth session.

**Key exports (representative):**

```typescript
// Agents
export async function listAgents(): Promise<Agent[]>
export async function getAgent(id: string): Promise<Agent>
export async function createAgent(payload: CreateAgentPayload): Promise<Agent>
export async function updateAgent(id: string, patch: Partial<Agent>): Promise<Agent>
export async function deleteAgent(id: string): Promise<void>
export async function testAgent(id: string, message: string): Promise<AgentTestResult>

// Models
export async function listModels(): Promise<Model[]>
export async function addModel(payload: AddModelPayload): Promise<Model>

// Workflows
export async function listWorkflows(): Promise<Workflow[]>
export async function createWorkflow(payload: CreateWorkflowPayload): Promise<Workflow>
export async function runWorkflow(id: string, input: Record<string, unknown>): Promise<WorkflowRun>

// Knowledge Bases
export async function listKnowledgeBases(): Promise<KnowledgeBase[]>
export async function uploadDocument(kbId: string, file: File): Promise<Document>
export async function queryKnowledgeBase(kbId: string, query: string): Promise<RetrievalResult[]>

// API Keys
export async function listApiKeys(): Promise<ApiKey[]>
export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKey>
export async function revokeApiKey(id: string): Promise<void>

// Analytics
export async function getUsageAnalytics(params: AnalyticsParams): Promise<AnalyticsData>
```

### `lib/socket.ts`

Manages the singleton Socket.io client connection to the `/neural-events` namespace. Handles:

- **Lazy initialization** — socket is only created when first requested
- **Automatic reconnection** with exponential backoff
- **Auth token injection** in the handshake `auth` object
- **Typed event emitters/listeners** to avoid stringly-typed socket code

```typescript
// Rough shape of lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getNeuralSocket(token: string): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_NEURAL_URL}/neural-events`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectNeuralSocket(): void {
  socket?.disconnect();
  socket = null;
}
```

### `lib/hooks/`

Custom React hooks that encapsulate data-fetching, caching, and mutation logic for core domain objects. Keeps page components thin.

| Hook | Description |
|---|---|
| `useAgents` | Fetches and caches the agent list. Exposes `create`, `update`, `delete` mutations with optimistic updates. |
| `useModels` | Fetches available models. Refreshes when a new model is added. |
| `useWorkflows` | Fetches workflows and exposes `run` trigger. Subscribes to run-status events via the socket layer. |
| `useTraceEvents` | Subscribes to the `/neural-events` namespace for a specific `executionId`. Returns a live-updated array of `TraceEvent` objects. Used by the Trace Inspector Drawer. |

---

## Data Flow & Real-Time Events

### REST Data Flow

```
Page Component
    │
    ├── useEffect / React Query / SWR
    │
    ▼
lib/hooks/use*.ts   (domain hook)
    │
    ▼
lib/neural-api.ts   (typed API client)
    │
    ▼
axios (with auth interceptor)
    │
    ▼
NEXT_PUBLIC_NEURAL_URL  ──►  NeuralHub REST API
```

### WebSocket Trace Event Flow

```
User triggers AI execution (agent test, workflow run, etc.)
    │
    ▼
neural-api.ts  ──► POST /executions  ──►  Returns { executionId }
    │
    ▼
useTraceEvents(executionId)
    │
    ▼
lib/socket.ts  ──► socket.on(`trace:${executionId}`, handler)
    │
    ▼
Trace Inspector Drawer renders live event timeline
    │
    ▼
Events pushed by backend as execution progresses:
  • trace:token_chunk   — streamed LLM output
  • trace:tool_call     — agent tool invocation
  • trace:retrieval     — RAG retrieval step
  • trace:step_start    — workflow step begins
  • trace:step_end      — workflow step completes (with timing)
  • trace:error         — execution error with stack
  • trace:complete      — execution finished
```

---

## API Client Reference

All calls go through `lib/neural-api.ts`. The base URL is `NEXT_PUBLIC_NEURAL_URL`. Every request includes an `Authorization: Bearer <token>` header injected by the axios interceptor.

### Agents Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List all agents for the authenticated org |
| POST | `/agents` | Create a new agent |
| GET | `/agents/:id` | Get agent by ID |
| PATCH | `/agents/:id` | Update agent configuration |
| DELETE | `/agents/:id` | Delete an agent |
| POST | `/agents/:id/test` | Run a test message against the agent |

### Models Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/models` | List available LLM models |
| POST | `/models` | Register a new model / provider config |
| DELETE | `/models/:id` | Remove a model registration |

### Workflows Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/workflows` | List workflows |
| POST | `/workflows` | Create a workflow |
| GET | `/workflows/:id` | Get workflow with steps |
| PUT | `/workflows/:id` | Replace workflow definition |
| DELETE | `/workflows/:id` | Delete workflow |
| POST | `/workflows/:id/run` | Trigger a workflow run |
| GET | `/workflows/:id/runs` | List past runs |

### Knowledge Base Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/knowledge-bases` | List knowledge bases |
| POST | `/knowledge-bases` | Create a collection |
| POST | `/knowledge-bases/:id/documents` | Upload a document (multipart) |
| GET | `/knowledge-bases/:id/documents` | List documents in a collection |
| POST | `/knowledge-bases/:id/query` | Test retrieval with a query string |
| DELETE | `/knowledge-bases/:id/documents/:docId` | Delete a document |

### Analytics Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/analytics/usage` | Token usage over time (query: `from`, `to`, `keyId`) |
| GET | `/analytics/cost` | Cost breakdown by key / model |
| GET | `/analytics/latency` | Latency percentiles |

### API Key Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api-keys` | List API keys |
| POST | `/api-keys` | Create an API key |
| DELETE | `/api-keys/:id` | Revoke an API key |

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# Core API — platform backbone (auth, subscriptions, credits, AND neural/AI)
# neural-api has been merged into core-api. Both REST and WebSocket run on port 3000.
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_NEURAL_API_URL=http://localhost:3000

# Server-side only — used by the /api/neural proxy route (never exposed to browser)
NEURAL_API_URL=http://localhost:3000

# WebSocket — /neural-events namespace is served by core-api on port 3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Auth service
NEXT_PUBLIC_AUTH_URL=http://localhost:3003

# Production example
# NEXT_PUBLIC_API_URL=https://core.codeswayam.com
# NEXT_PUBLIC_NEURAL_API_URL=https://core.codeswayam.com
# NEURAL_API_URL=https://core.codeswayam.com
# NEXT_PUBLIC_SOCKET_URL=https://core.codeswayam.com
# NEXT_PUBLIC_AUTH_URL=https://auth.codeswayam.com
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Core API base URL. Used for platform calls (auth, subscriptions, credits). |
| `NEXT_PUBLIC_NEURAL_API_URL` | Yes | Neural/AI API base URL. Points to core-api (port 3000) — neural-api has been merged in. Used by `lib/neural-api.ts`. |
| `NEURAL_API_URL` | Yes | Server-side only version of `NEXT_PUBLIC_NEURAL_API_URL`. Used by the `/api/neural` Next.js proxy route. |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | WebSocket server URL. The `/neural-events` Socket.io namespace is served by core-api on port 3000. Used by `lib/socket.ts`. |
| `NEXT_PUBLIC_AUTH_URL` | Yes | CodeSwayam Auth service URL. Middleware redirects unauthenticated users here. |

> **Note:** `NEXT_PUBLIC_NEURAL_API_URL`, `NEURAL_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` all point to the same `core-api` server (port 3000 locally). The standalone `neural-api` (port 3006) no longer exists — it was merged into `core-api` in Phase 2 of the implementation plan.

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 20.x (LTS recommended)
- **npm** ≥ 10 or **pnpm** ≥ 9 or **yarn** ≥ 4
- Access credentials for a running NeuralHub backend (or a local dev instance)

### Step 1 — Clone and Install

```bash
git clone https://github.com/codeswayam/neural-web.git
cd neural-web
npm install          # or: pnpm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in the three NEXT_PUBLIC_ variables
```

### Step 3 — Start the Development Server

```bash
npm run dev
# Server starts at http://localhost:3000 by default
```

To use a different port:

```bash
npm run dev -- -p 3001
```

### Step 4 — Verify

Open `http://localhost:3000`. You should be redirected to the Auth service login page. After authenticating, you will land on `/dashboard`.

### Linting & Type Checking

```bash
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

### Production Build

```bash
npm run build
npm run start         # Serves the production build locally
```

---

## Code Examples

### 1. Sending a Chat Message via the NeuralClient SDK

```typescript
// lib/neural-api.ts (excerpt showing SDK usage pattern)
import NeuralClient from '@codeswayam/neural';

const client = new NeuralClient({
  baseUrl: process.env.NEXT_PUBLIC_NEURAL_URL!,
  // Token is injected per-request via the axios interceptor in practice
});

export async function sendChatMessage(
  agentId: string,
  message: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ executionId: string; response: string }> {
  const result = await client.agents.chat(agentId, {
    message,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 2048,
  });

  return {
    executionId: result.executionId,
    response: result.content,
  };
}
```

### 2. Subscribing to Real-Time Trace Events

```typescript
// In a component or hook that uses the Trace Inspector
import { useEffect, useState } from 'react';
import { getNeuralSocket } from '@/lib/socket';
import { useSession } from '@codeswayam/auth/react';

export interface TraceEvent {
  type: 'token_chunk' | 'tool_call' | 'retrieval' | 'step_start' | 'step_end' | 'error' | 'complete';
  timestamp: number;
  payload: Record<string, unknown>;
}

export function useTraceEvents(executionId: string | null) {
  const { token } = useSession();
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!executionId || !token) return;

    const socket = getNeuralSocket(token);

    const handleEvent = (event: TraceEvent) => {
      setEvents(prev => [...prev, event]);
      if (event.type === 'complete' || event.type === 'error') {
        setIsComplete(true);
      }
    };

    socket.on(`trace:${executionId}`, handleEvent);

    return () => {
      socket.off(`trace:${executionId}`, handleEvent);
    };
  }, [executionId, token]);

  return { events, isComplete };
}
```

### 3. Creating an API Key

```typescript
// components/api-keys/create-key-dialog.tsx (excerpt)
import { createApiKey } from '@/lib/neural-api';
import { useState } from 'react';

interface CreateApiKeyPayload {
  name: string;
  rateLimit?: number;      // requests per minute
  monthlyBudget?: number;  // USD cents
  allowedModels?: string[];
}

export function useCreateApiKey() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: CreateApiKeyPayload) {
    setIsLoading(true);
    setError(null);
    try {
      const key = await createApiKey(payload);
      // key.secret is only returned once — show it to the user immediately
      return key;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { create, isLoading, error };
}
```

### 4. Connecting the Trace Inspector Drawer

```tsx
// Usage in an agent test page
import { TraceInspectorDrawer } from '@/components/trace-inspector-drawer';
import { sendChatMessage } from '@/lib/neural-api';
import { useState } from 'react';

export default function AgentTestPage({ agentId }: { agentId: string }) {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSendMessage(message: string) {
    const result = await sendChatMessage(agentId, message);
    setExecutionId(result.executionId);
    setDrawerOpen(true);  // Open trace inspector automatically
  }

  return (
    <div>
      {/* ... chat input UI ... */}
      <TraceInspectorDrawer
        executionId={executionId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
```

---

## Authentication & Middleware

Authentication is handled by `@codeswayam/auth` v2.5.1 via the `withCSWAuth` middleware wrapper applied in `middleware.ts`.

```typescript
// middleware.ts
import { withCSWAuth } from '@codeswayam/auth/middleware';

export default withCSWAuth({
  publicRoutes: ['/auth/callback', '/'],
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Behavior:**

- `/auth/callback` and `/` are public — no authentication check
- All other routes check for a valid session token in cookies
- If no valid session, the middleware issues a 302 redirect to `NEXT_PUBLIC_AUTH_URL` with a `returnTo` parameter
- On successful login, the auth service redirects back to `/auth/callback`, which stores the token and redirects to the original destination

---

## Theming

The application supports **dark** and **light** themes, toggled via `theme-toggle.tsx` and managed by `theme-provider.tsx`.

- Theme preference is stored in `localStorage` as `neuralhub-theme`
- A cookie is set server-side to allow `ThemeProvider` to read the preference during SSR, preventing flash-of-wrong-theme
- CSS custom properties (`--background`, `--foreground`, `--primary`, etc.) are used throughout for consistent token-based theming
- The `dark` class is applied to the `<html>` element to activate the dark palette

---

## Project Structure

```
neural-web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (ThemeProvider, Navbar, ErrorBoundary)
│   ├── page.tsx                  # / — Landing page
│   ├── dashboard/
│   │   └── page.tsx
│   ├── agents/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── models/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── workflows/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── knowledge-base/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── image-generation/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   ├── api-keys/
│   │   └── page.tsx
│   ├── billing/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── auth/
│   │   └── callback/page.tsx
│   └── admin/
│       └── page.tsx
├── components/                   # Shared React components
│   ├── navbar.tsx
│   ├── trace-inspector-drawer.tsx
│   ├── theme-toggle.tsx
│   ├── theme-provider.tsx
│   └── error-boundary.tsx
├── lib/                          # Application logic layer
│   ├── neural-api.ts             # Full API client (~17 KB)
│   ├── socket.ts                 # Socket.io client factory
│   └── hooks/                   # Custom React hooks
│       ├── use-agents.ts
│       ├── use-models.ts
│       └── use-workflows.ts
├── middleware.ts                 # withCSWAuth middleware
├── public/                       # Static assets
├── .env.local                    # Local environment variables (gitignored)
├── .env.example                  # Template for environment variables
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## Contributing

1. Branch from `main` using the convention `feat/<topic>`, `fix/<topic>`, or `chore/<topic>`
2. Run `npm run lint && npm run type-check` before opening a PR
3. Keep PR scope focused — one feature or fix per PR
4. Real-time features (socket integrations, trace inspector changes) require manual testing against a live backend; document tested scenarios in the PR description

---

*Built with the NeuralHub platform. © CodeSwayam.*
