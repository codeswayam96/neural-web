/**
 * NeuralHub API Client
 * Connects neural-web frontend to the neural-api NestJS backend.
 */

const DIRECT_BASE = process.env.NEXT_PUBLIC_NEURAL_API_URL || 'http://localhost:3006';
// On the client, route through the Next.js proxy so the server can attach the HttpOnly cookie.
const BASE = typeof window === 'undefined' ? DIRECT_BASE : '/api/neural';

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // SSR: read the HttpOnly cookie server-side and forward as Bearer token
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('Authentication')?.value;
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // build time — skip
    }
  }

  const { headers: _, ...restOptions } = options || {};

  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    ...restOptions,
    headers,
    // credentials only needed for direct calls (SSR); proxy handles auth via Bearer
    credentials: typeof window === 'undefined' ? 'include' : 'same-origin',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`NeuralAPI ${res.status}: ${path} — ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  app: string;
  model: string;
  version: string;
  status: 'active' | 'inactive';
  requests: number;
  guardrails: number;
  description: string;
  systemPrompt: string;
  negativePrompt?: string;
  type: 'chat' | 'image';
  guardrailsEnabled: boolean;
  topicWhitelist: string;
  topicBlacklist: string;
  piiMasking: boolean;
  knowledgeBaseId?: number;
  embeddingModel?: string;
  createdAt: string;
}

export interface AgentStats {
  total: number;
  active: number;
  inactive: number;
  totalRequests: number;
}

export interface CreateAgentPayload {
  name: string;
  appName: string;
  model: string;
  systemPrompt?: string;
  negativePrompt?: string;
  description?: string;
  type?: 'chat' | 'image';
  guardrailsEnabled?: boolean;
  topicWhitelist?: string;
  topicBlacklist?: string;
  piiMasking?: boolean;
  knowledgeBaseId?: number;
  embeddingModel?: string;
}

export interface ChatMessage {
  text: string;
  usage: { tokensIn: number; tokensOut: number };
  latencyMs: number;
  model: string;
}

export interface ModelProvider {
  id: number;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  userId?: number | null;
  visibility: 'public' | 'private';
  usageType: 'managed' | 'byok';
  tier: 'free' | 'points' | 'premium' | 'internal';
  status: 'active' | 'inactive';
  isDefault: boolean;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsImageGeneration: boolean;
  supportsChat: boolean;
  supportsEmbedding: boolean;
  costPer1kInputTokens: string;
  costPer1kOutputTokens: string;
  pointsPerRequest: number;
  monthlyTokenLimitPerUser: number;
  requestsToday: number;
  totalRequests: number;
  avgLatencyMs: number;
  keysCount: number;
  activeKeysCount: number;
  baseUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelKey {
  id: number;
  modelId: number;
  keyPreview: string;
  weight: number;
  status: 'active' | 'rate_limited' | 'expired' | 'revoked';
  usageCount: number;
  usageToday: number;
  failureCount: number;
  label?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface ModelRegistryResponse {
  platform: ModelProvider[];
  user: ModelProvider[];
}

export interface CreateModelPayload {
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  apiKey?: string;
  baseUrl?: string;
  tier?: 'free' | 'points' | 'premium' | 'internal';
  priority?: number;
  contextWindow?: number;
  pointsPerRequest?: number;
  monthlyTokenLimitPerUser?: number;
  supportsVision?: boolean;
  supportsChat?: boolean;
  supportsEmbedding?: boolean;
  supportsImageGeneration?: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  app: string;
  keyPreview: string;
  permissions: string[];
  rateLimit: number;
  requestsToday: number;
  allowedIps?: string[];
  allowedDomains?: string[];
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsed: string;
}

export interface CreateApiKeyPayload {
  name: string;
  appName: string;
  permissions?: string[];
  rateLimit?: number;
  allowedIps?: string[];
  allowedDomains?: string[];
}

export interface CreatedApiKey extends ApiKey {
  key: string; // Full key shown ONCE on creation
}

export interface AnalyticsOverview {
  totalRequestsToday: number;
  tokensUsed: number;
  estimatedCostInr: number;
  avgLatencyMs: number;
  activeAgents: number;
  guardrailBlocks: number;
  changeRequestsPct: number;
  changeTokensPct: number;
  changeCostPct: number;
  changeLatencyMs: number;
}

export interface AppBreakdown {
  app: string;
  requests: number;
  cost: number;
  agents: number;
}

export interface RecentRequest {
  app: string;
  agent: string;
  model: string;
  tokens: number;
  latencyMs: number;
  status: 'success' | 'blocked' | 'error';
  timeAgo: string;
}

export interface ModelUsage {
  model: string;
  requests: number;
  pct: number;
}

export interface ImageGenerationResult {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  prompt: string;
  error?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  embeddingModel?: string;        // Legacy string field (kept for backward compat)
  embeddingModelId?: number;      // FK to neural.models
  embeddingModelName?: string;    // Cached model ID string e.g. 'text-embedding-004'
  embeddingProviderSlug?: string; // Cached provider e.g. 'google'
  embeddingDimension?: number;    // e.g. 768, 1536
  userId: string;
  createdAt: string;
  updatedAt: string;
  docCount?: number;
  status?: string;
}

export interface KBDocument {
  id: string;
  kbId: string;
  fileName: string;
  content: string;
  createdAt: string;
}

// ── API Methods ───────────────────────────────────────────────────────

export interface Workflow {
  id: string;
  name: string;
  appName: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  nodes?: any[];
  edges?: any[];
  config?: any;
  envs?: { key: string; value: string }[];
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputData: string;
  outputData: string;
  error?: string;
  latencyMs: number;
  createdAt: string;
}

// ── API Methods ───────────────────────────────────────────────────────

export const neuralApi = {
  agents: {
    list: (search?: string, type?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      const query = params.toString();
      return fetcher<Agent[]>(`/agents${query ? `?${query}` : ''}`);
    },

    stats: () => fetcher<AgentStats>('/agents/stats'),

    get: (id: string) => fetcher<Agent>(`/agents/${id}`),

    create: (payload: CreateAgentPayload) =>
      fetcher<Agent>('/agents', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (id: string, payload: Partial<CreateAgentPayload> & { status?: 'active' | 'inactive'; knowledgeBaseId?: number }) =>
      fetcher<Agent>(`/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    delete: (id: string) =>
      fetcher<{ deleted: boolean }>(`/agents/${id}`, { method: 'DELETE' }),

    chat: (id: string, message: string, sessionId?: string) =>
      fetcher<ChatMessage>(`/agents/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, sessionId }),
      }),
  },

  kb: {
    list: () => fetcher<KnowledgeBase[]>('/kb'),
    get: (id: string) => fetcher<KnowledgeBase>(`/kb/${id}`),
    create: (payload: { name: string; description?: string; embeddingModelId?: number }) =>
      fetcher<KnowledgeBase>('/kb', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: { name?: string; description?: string }) =>
      fetcher<KnowledgeBase>(`/kb/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) => fetcher<{ success: boolean }>(`/kb/${id}`, { method: 'DELETE' }),

    getDocuments: (id: string) => fetcher<KBDocument[]>(`/kb/${id}/documents`),
    uploadDocument: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetcher<any>(`/kb/${id}/documents`, {
        method: 'POST',
        body: formData,
        headers: {}, // Fetcher will handle the rest, browser will set Content-Type with boundary
      });
    },
    deleteDocument: (id: string, docId: string) =>
      fetcher<{ success: boolean }>(`/kb/${id}/documents/${docId}`, { method: 'DELETE' }),
    },

  workflows: {
    list: () => fetcher<Workflow[]>('/workflows'),
    get: (id: string) => fetcher<Workflow>(`/workflows/${id}`),
    update: (id: string, payload: Partial<{ name: string; appName: string; description: string; status: 'draft' | 'active' | 'archived'; config: any; envs: any[] }>) =>
      fetcher<Workflow>(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    create: (payload: { name: string; appName: string; description?: string }) =>
      fetcher<Workflow>('/workflows', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateStructure: (id: string, nodes: any[], edges: any[]) =>
      fetcher<Workflow>(`/workflows/${id}/structure`, {
        method: 'PUT',
        body: JSON.stringify({ nodes, edges }),
      }),
    execute: (id: string, input: any) =>
      fetcher<any>(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    getExecutions: (id: string) => fetcher<WorkflowExecution[]>(`/workflows/${id}/executions`),
    executions: (id: string) => fetcher<WorkflowExecution[]>(`/workflows/${id}/executions`), // alias
    delete: (id: string) => fetcher<{ deleted: boolean }>(`/workflows/${id}`, { method: 'DELETE' }),
  },

  models: {
    list: (capability?: 'chat' | 'image' | 'embedding') => fetcher<ModelRegistryResponse>(`/models${capability ? `?capability=${capability}` : ''}`),
    get: (id: number) => fetcher<ModelProvider>(`/models/${id}`),
    stats: () => fetcher<{ totalModels: number; activeModels: number; platformModels: number; userModels: number; totalRequestsToday: number }>('/models/stats/overview'),
    fetchProviderModels: (provider: string, apiKey: string, baseUrl?: string) => 
      fetcher<{ id: string; name: string; capabilities: { chat: boolean; embedding: boolean; image: boolean } }[]>('/models/provider-models', { method: 'POST', body: JSON.stringify({ provider, apiKey, baseUrl }) }),

    // Admin: Create platform model
    createPlatform: (payload: CreateModelPayload) =>
      fetcher<ModelProvider>('/models/platform', { method: 'POST', body: JSON.stringify(payload) }),

    // Admin: Key pool management
    addKey: (modelId: number, payload: { apiKey: string; label?: string; weight?: number }) =>
      fetcher<ModelKey>(`/models/platform/${modelId}/keys`, { method: 'POST', body: JSON.stringify(payload) }),
    listKeys: (modelId: number) => fetcher<ModelKey[]>(`/models/platform/${modelId}/keys`),
    updateKeyStatus: (keyId: number, status: 'active' | 'revoked') => fetcher<{ success: boolean }>(`/models/platform/keys/${keyId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteKey: (keyId: number) => fetcher<{ deleted: boolean }>(`/models/platform/keys/${keyId}`, { method: 'DELETE' }),

    // User BYOK
    createByok: (payload: CreateModelPayload) =>
      fetcher<ModelProvider>('/models/byok', { method: 'POST', body: JSON.stringify(payload) }),

    // Shared
    update: (id: number, payload: Partial<CreateModelPayload> & { status?: string }) =>
      fetcher<ModelProvider>(`/models/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: number) => fetcher<{ deleted: boolean }>(`/models/${id}`, { method: 'DELETE' }),
    testKey: (data: { provider: string, modelId: string, apiKey: string, baseUrl?: string }) => 
      fetcher<{ success: boolean; message?: string; latency?: number; error?: string }>('/models/test-key', { method: 'POST', body: JSON.stringify(data) }),
    testKeyById: (keyId: number) => 
      fetcher<{ success: boolean; message?: string; latency?: number; error?: string }>(`/models/platform/keys/${keyId}/test`, { method: 'POST' }),
  },

  apiKeys: {
    list: () => fetcher<ApiKey[]>('/api-keys'),
    stats: () => fetcher<{ total: number; active: number; totalRequestsToday: number }>('/api-keys/stats'),
    get: (id: string) => fetcher<ApiKey>(`/api-keys/${id}`),

    create: (payload: CreateApiKeyPayload) =>
      fetcher<CreatedApiKey>('/api-keys', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    revoke: (id: string) =>
      fetcher<ApiKey>(`/api-keys/${id}/revoke`, { method: 'POST' }),

    delete: (id: string) =>
      fetcher<{ success: boolean }>(`/api-keys/${id}`, { method: 'DELETE' }),
  },

  analytics: {
    overview: () => fetcher<AnalyticsOverview>('/analytics/overview'),
    timeline: () => fetcher<Array<{ hour: string; requests: number; tokens: number }>>('/analytics/timeline'),
    apps: () => fetcher<AppBreakdown[]>('/analytics/apps'),
    recentRequests: () => fetcher<RecentRequest[]>('/analytics/recent-requests'),
    modelUsage: () => fetcher<ModelUsage[]>('/analytics/model-usage'),
  },

  gateway: {
    generateImage: (prompt: string, negativePrompt?: string, modelId?: string, agentId?: string) =>
      fetcher<ImageGenerationResult>('/v1/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, negativePrompt, modelId, agentId }),
      }),

    /** Generate a workflow prompt using the platform's best available model. */
    generatePrompt: async (userIntent: string): Promise<string | null> => {
      try {
        const result = await fetcher<ChatMessage>('/v1/chat', {
          method: 'POST',
          body: JSON.stringify({
            agentId: 'workflow-helper',
            message: `You are a workflow automation assistant. Generate a concise, professional AI agent prompt for the following use case. The prompt should clearly instruct the AI what to do with the input data (referenced as {{input.fieldname}}). Use exactly one sentence if possible.\n\nUser's goal: ${userIntent}\n\nReturn ONLY the prompt text, nothing else.`,
            sessionId: `wf-helper-${Date.now()}`,
          }),
        });
        return result.text || null;
      } catch {
        return null;
      }
    },
  },
};
