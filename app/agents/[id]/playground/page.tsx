"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bot, Send, RefreshCw, ArrowLeft, Loader2,
  Clock, Hash, Shield, Zap, AlertCircle, X, ChevronDown, Key as KeyIcon,
  Info, Copy, Check, AlertTriangle, Lock,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi, Agent, ChatMessage } from "@/lib/neural-api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { checkUserAuth, getApiUrl } from "@/lib/auth";

/** Max playground messages non-admin users can send on managed agents (per session). */
const TEST_MSG_LIMIT = 5;

interface PlaygroundErrorInfo {
  title: string;
  description: string;
  badge?: string;
  suggestion?: string;
  command?: string;
  statusCode?: number;
  raw?: string;
  failedPrompt?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  keyPreview?: string | null;
  isError?: boolean;
  errorInfo?: PlaygroundErrorInfo;
}

function parsePlaygroundError(err: any, modelName?: string, userPrompt?: string): PlaygroundErrorInfo {
  const raw = err?.raw || (typeof err === "string" ? err : err?.message || "");
  let statusCode = err?.status || err?.statusCode || err?.data?.statusCode;
  let parsedJson: any = null;

  if (err?.data && typeof err.data === "object") {
    parsedJson = err.data;
  } else {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[0]);
      }
    } catch {}
  }

  const cleanMsg =
    parsedJson?.message ||
    err?.data?.message ||
    err?.message ||
    raw ||
    "Failed to get AI response";

  if (!statusCode) {
    if (parsedJson?.statusCode) statusCode = parsedJson.statusCode;
    else {
      const statusMatch = raw.match(/\b(4\d\d|5\d\d)\b/);
      if (statusMatch) statusCode = parseInt(statusMatch[1], 10);
    }
  }

  const modelLower = (modelName || "").toLowerCase();
  const msgLower = (cleanMsg + " " + raw).toLowerCase();

  // 1. Ollama / Local Model connection failure
  const isLocalModel = modelLower.includes("gemma") || modelLower.includes("llama") || modelLower.includes("mistral") || modelLower.includes("qwen") || modelLower.includes("phi") || modelLower.includes("deepseek-r1");
  const isConnFailed = msgLower.includes("fetch failed") || msgLower.includes("econnrefused") || msgLower.includes("cannot connect to ollama") || msgLower.includes("11434");

  if (isConnFailed || (isLocalModel && (msgLower.includes("fetch failed") || msgLower.includes("failed")))) {
    return {
      title: "Model Service Unreachable",
      badge: "Ollama Offline",
      statusCode: statusCode || 500,
      description: `The AI gateway could not connect to ${modelName || "the model provider"} (fetch failed). Local models run through Ollama on your machine.`,
      suggestion: "Ensure Ollama is running locally on port 11434. Start it from your terminal with:",
      command: `ollama run ${modelName || "gemma3:4b"}`,
      raw: raw,
      failedPrompt: userPrompt,
    };
  }

  // 2. Upstream Provider Rate limit / Quota Exhaustion (Google, OpenAI, Anthropic)
  const isUpstreamQuota =
    statusCode === 429 ||
    msgLower.includes("429") ||
    msgLower.includes("rate limit") ||
    msgLower.includes("too many requests") ||
    msgLower.includes("resource_exhausted") ||
    msgLower.includes("resource has been exhausted") ||
    msgLower.includes("upstream quota") ||
    (msgLower.includes("quota") && (msgLower.includes("google") || msgLower.includes("gemini") || msgLower.includes("openai") || msgLower.includes("upstream")));

  if (isUpstreamQuota) {
    return {
      title: "Provider Rate Limit Reached",
      badge: "HTTP 429",
      statusCode: 429,
      description: `The upstream AI provider (${modelName || "selected model"}) has reached its rate limit or free quota (e.g. Google AI Studio 5 RPM / 20 RPD free tier limit).`,
      suggestion: "Wait a minute before sending another message, or add secondary API keys to the model pool in Model Settings to distribute load.",
      raw: raw,
      failedPrompt: userPrompt,
    };
  }

  // 3. Authentication / Key
  if (statusCode === 401 || statusCode === 403 || msgLower.includes("api key") || msgLower.includes("unauthorized") || msgLower.includes("authentication") || msgLower.includes("api_key_invalid")) {
    return {
      title: "API Authentication Failed",
      badge: `HTTP ${statusCode || 401}`,
      statusCode: statusCode || 401,
      description: "The AI provider rejected the request due to an invalid or missing API key.",
      suggestion: "Check your API key settings in the Model Registry or add a valid BYOK key.",
      raw: raw,
      failedPrompt: userPrompt,
    };
  }

  // 4. Platform Credits Exhausted (Internal NeuralHub credits)
  if (statusCode === 402 || msgLower.includes("insufficient credits") || msgLower.includes("credits exhausted") || msgLower.includes("credit balance")) {
    return {
      title: "AI Credits Exhausted",
      badge: "Quota Exceeded",
      statusCode: 402,
      description: "Your workspace has exhausted its available platform AI credits.",
      suggestion: "Upgrade your subscription tier or recharge credits in the Billing portal.",
      raw: raw,
      failedPrompt: userPrompt,
    };
  }

  // 5. Timeout
  if (statusCode === 504 || msgLower.includes("timeout") || msgLower.includes("timed out")) {
    return {
      title: "AI Reasoning Timed Out",
      badge: "Timeout",
      statusCode: 504,
      description: "The model did not generate a response within the timeout limit.",
      suggestion: "Try shortening your message, or switch to a faster model with lower response latency.",
      raw: raw,
      failedPrompt: userPrompt,
    };
  }

  // 6. Generic / Fallback
  const sanitized = cleanMsg
    .replace(/^⚠️\s*Error:\s*/i, "")
    .replace(/^NeuralAPI \d+:\s*[^—]+—\s*/i, "")
    .trim();

  return {
    title: "AI Execution Failed",
    badge: statusCode ? `HTTP ${statusCode}` : "Error",
    statusCode: statusCode || 500,
    description: sanitized || "The model was unable to process your request.",
    suggestion: "Check the agent prompt configuration or try again in a few moments.",
    raw: raw,
    failedPrompt: userPrompt,
  };
}

function PlaygroundErrorCard({
  errorInfo,
  onRetry,
}: {
  errorInfo: PlaygroundErrorInfo;
  onRetry?: () => void;
}) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-4 shadow-sm space-y-3 text-left">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-destructive">{errorInfo.title}</h4>
            {errorInfo.statusCode && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-destructive/15 border border-destructive/25 text-destructive font-medium">
                HTTP {errorInfo.statusCode}
              </span>
            )}
            {errorInfo.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-medium">
                {errorInfo.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/90 mt-1.5 leading-relaxed">
            {errorInfo.description}
          </p>

          {errorInfo.suggestion && (
            <div className="mt-2.5 p-3 rounded-xl bg-background/80 border border-border/70 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 text-primary font-medium text-[11px]">
                <Info size={13} />
                <span>Recommended action:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/80">
                {errorInfo.suggestion}
              </p>
              {errorInfo.command && (
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] bg-secondary/80 border border-border rounded-lg px-2.5 py-1.5 text-foreground">
                  <code>{errorInfo.command}</code>
                  <button
                    type="button"
                    onClick={() => copyCommand(errorInfo.command!)}
                    className="text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-destructive/15 text-xs">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/15 hover:bg-destructive/25 text-destructive font-medium text-xs transition-colors active:scale-95"
          >
            <RefreshCw size={12} />
            <span>Retry Message</span>
          </button>
        ) : <div />}

        {errorInfo.raw && (
          <button
            type="button"
            onClick={() => setShowTechnical((p) => !p)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-mono"
          >
            {showTechnical ? "Hide Details" : "Technical Details"}
            <ChevronDown size={11} className={cn("transition-transform", showTechnical && "rotate-180")} />
          </button>
        )}
      </div>

      {showTechnical && errorInfo.raw && (
        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 text-[11px] font-mono text-slate-100 max-h-40 overflow-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
          {errorInfo.raw}
        </pre>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showSidebar, setShowSidebar] = useState(false);
  const [modelDisplayName, setModelDisplayName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth / role — determines whether test limits apply
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Track how many user messages have been sent this session for non-admins
  const [testMsgCount, setTestMsgCount] = useState(0);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Managed-agent test limit: non-admins capped at TEST_MSG_LIMIT messages per session
  const managedLimitReached = !!(agent?.managedByApp && !isAdmin && !roleLoading && testMsgCount >= TEST_MSG_LIMIT);

  // Fetch current user's role once on mount
  useEffect(() => {
    checkUserAuth(getApiUrl())
      .then(({ user }) => setUserRole(user?.role ?? 'user'))
      .catch(() => setUserRole('user'))
      .finally(() => setRoleLoading(false));
  }, []);

  useEffect(() => {
    neuralApi.agents.get(agentId)
      .then(setAgent)
      .catch((e) => setAgentError(e.message))
      .finally(() => setAgentLoading(false));
  }, [agentId]);

  // Resolve the ACTUAL underlying model (modelId slug, e.g. "gemini-2.5-flash")
  // not the wrapper name (e.g. "self" / "auraflow platform modal")
  useEffect(() => {
    if (!agent?.model) return;
    neuralApi.models.list('chat').then(res => {
      const rawId = agent.model;
      // Match by DB id first, then by modelId slug
      const allModels = [...res.platform, ...res.user];
      const match = allModels.find(m =>
        String(m.id) === rawId || m.modelId === rawId
      );
      // Show the actual modelId (e.g. "gemini-2.5-flash"), not the wrapper name
      setModelDisplayName(match ? match.modelId : rawId);
    }).catch(() => {
      setModelDisplayName(agent.model); // fallback to raw value
    });
  }, [agent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || sending || managedLimitReached) return;
    if (!overrideText) setInput("");
    setMessages((m) => [...m, { role: "user", text: textToSend }]);
    // Increment test counter for non-admin users on managed agents
    if (agent?.managedByApp && !isAdmin) {
      setTestMsgCount((c) => c + 1);
    }
    setSending(true);

    try {
      const result: ChatMessage = await neuralApi.agents.chat(agentId, textToSend, sessionId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: result.text,
          latencyMs: result.latencyMs,
          tokensIn: result.usage?.tokensIn,
          tokensOut: result.usage?.tokensOut,
          model: result.model,
          keyPreview: result.keyPreview,
        },
      ]);
    } catch (err: any) {
      const errorInfo = parsePlaygroundError(err, modelDisplayName ?? agent?.model, textToSend);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: errorInfo.description,
          isError: true,
          errorInfo,
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-primary" />
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-sm text-muted-foreground">{agentError || "Agent not found"}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/agents"><ArrowLeft size={13} /> Back to Agents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-5 h-[calc(100vh-3.5rem-3rem)] max-w-6xl mx-auto">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Left panel — Agent Config */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-background lg:bg-transparent border-r lg:border-0 border-border flex flex-col gap-4 p-4 lg:p-0 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:shrink-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <Link href="/agents" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={11} /> Back to Agents
            </Link>
            <button className="lg:hidden w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center" onClick={() => setShowSidebar(false)}>
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>

          <div className="glass rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold font-mono truncate">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground">{agent.app}</p>
              </div>
            </div>
            <Badge variant={agent.status === "active" ? "success" : "secondary"} className="text-[10px] w-fit">
              {agent.status}
            </Badge>

            <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-mono text-[10px] truncate max-w-[120px]" title={agent.model}>
                    {modelDisplayName ?? agent.model}
                  </span>
                </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Guardrails</span>
                <span className={agent.guardrailsEnabled ? "text-emerald-400" : "text-muted-foreground"}>
                  {agent.guardrailsEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PII Masking</span>
                <span className={agent.piiMasking ? "text-emerald-400" : "text-muted-foreground"}>
                  {agent.piiMasking ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Requests</span>
                <span>{agent.requests.toLocaleString()}</span>
              </div>
            </div>

            {agent.systemPrompt && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-mono text-muted-foreground mb-1.5">System Prompt</p>
                <p className="text-[10px] text-foreground leading-relaxed line-clamp-6">
                  {agent.systemPrompt}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Session stats */}
        {messages.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-medium mb-2">Session Stats</p>
            {[
              {
                icon: Hash,
                label: "Messages",
                value: messages.filter((m) => m.role === "assistant").length,
              },
              {
                icon: Zap,
                label: "Tokens Used",
                value: messages.reduce((s, m) => s + (m.tokensIn ?? 0) + (m.tokensOut ?? 0), 0),
              },
              {
                icon: Clock,
                label: "Avg Latency",
                value: (() => {
                  const times = messages.filter((m) => m.latencyMs).map((m) => m.latencyMs!);
                  return times.length ? `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms` : "—";
                })(),
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <s.icon size={10} /> {s.label}
                </div>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}

            {/* Active key used in last response */}
            {(() => {
              const lastAssistant = [...messages].reverse().find(m => m.role === "assistant" && m.keyPreview);
              if (!lastAssistant?.keyPreview) return null;
              const preview = lastAssistant.keyPreview;
              // split at '...' to get start and end
              const [start, end] = preview.includes('...') ? preview.split('...') : [preview.slice(0, 6), preview.slice(-4)];
              return (
                <div className="pt-2 mt-1 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <KeyIcon size={9} /> Active Key
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] bg-secondary/60 border border-border rounded-md px-2 py-1.5">
                    <span className="text-emerald-400">{start}</span>
                    <span className="text-muted-foreground">•••</span>
                    <span className="text-emerald-400">{end}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setMessages([])}
        >
          <RefreshCw size={11} /> Clear Chat
        </Button>
      </aside>

      {/* Right panel — Chat */}
      <div className="flex-1 flex flex-col glass rounded-xl border border-border overflow-hidden min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/40">
          <button
            className="lg:hidden w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            onClick={() => setShowSidebar(true)}
          >
            <Bot size={13} className="text-primary" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="status-dot active" />
            <span className="hidden sm:inline">
              {agent.managedByApp
                ? `Managed by ${agent.managedByApp.charAt(0).toUpperCase() + agent.managedByApp.slice(1)} · Test Mode`
                : "Agent Playground"}
            </span>
            <span className="sm:hidden font-mono text-[10px]">{agent.name}</span>
          </div>
          {agent.managedByApp && (
            isAdmin ? (
              <span className="flex items-center gap-1 ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Unlimited Dashboard Testing
              </span>
            ) : (
              <span className={cn(
                "flex items-center gap-1 ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                managedLimitReached
                  ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/20"
              )}>
                {managedLimitReached ? <Lock size={9} /> : null}
                {managedLimitReached ? "Test Limit Reached" : `Test Mode · ${TEST_MSG_LIMIT - testMsgCount} left`}
              </span>
            )
          )}
          <span className="text-xs text-muted-foreground ml-auto font-mono">
            {sessionId.slice(-8)}
          </span>
        </div>

        {/* Managed agent notice */}
        {agent.managedByApp && (
          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b",
            isAdmin
              ? "bg-amber-500/5 border-amber-500/20"
              : managedLimitReached
              ? "bg-rose-500/5 border-rose-500/20"
              : "bg-amber-500/5 border-amber-500/20"
          )}>
            <AlertCircle size={13} className={cn("shrink-0", isAdmin || !managedLimitReached ? "text-amber-400" : "text-rose-400")} />
            <p className={cn("text-[11px] flex-1", isAdmin || !managedLimitReached ? "text-amber-400/80" : "text-rose-400/80")}>
              This agent is <strong className={isAdmin || !managedLimitReached ? "text-amber-400" : "text-rose-400"}>
                managed by {agent.managedByApp.charAt(0).toUpperCase() + agent.managedByApp.slice(1)}
              </strong>.
              {isAdmin
                ? " As an admin, you have unlimited playground testing here."
                : managedLimitReached
                ? ` You've reached the ${TEST_MSG_LIMIT}-message test limit. Use the app directly for full access.`
                : ` Non-admin users can send up to ${TEST_MSG_LIMIT} test messages per session.`
              }
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_AURAFLOW_URL || 'http://localhost:3004'}/automations`}
              target="_blank" rel="noopener noreferrer"
              className={cn(
                "shrink-0 text-[10px] font-bold hover:underline flex items-center gap-1",
                isAdmin || !managedLimitReached ? "text-amber-400" : "text-rose-400"
              )}
            >
              Open in {agent.managedByApp} <ArrowLeft size={9} className="rotate-180" />
            </a>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{agent.name}</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Start a conversation. The agent will use its configured system prompt and guardrails.
                </p>
              </div>
              {[
                "What can you help me with?",
                "Tell me about your capabilities",
                "Hello! What are you?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isError = Boolean(msg.isError || msg.text?.startsWith("⚠️ Error:") || msg.text?.includes("Internal Server Error") || msg.text?.includes("NeuralAPI 500"));
                const errorInfo = msg.errorInfo || (isError ? parsePlaygroundError(msg.text, modelDisplayName ?? agent.model) : null);
                const prevUserPrompt = i > 0 && messages[i - 1]?.role === "user" ? messages[i - 1]?.text : "";

                return (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30 text-primary"
                        : isError
                        ? "bg-destructive/15 border border-destructive/25 text-destructive"
                        : "bg-secondary border border-border text-muted-foreground"
                    }`}>
                      {msg.role === "user" ? "U" : <Bot size={12} />}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {isError && errorInfo ? (
                        <PlaygroundErrorCard
                          errorInfo={errorInfo}
                          onRetry={prevUserPrompt ? () => sendMessage(prevUserPrompt) : undefined}
                        />
                      ) : (
                        <div className={cn(
                          "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-none",
                          msg.role === "user"
                            ? "bg-primary/15 border border-primary/25 text-foreground"
                            : "bg-secondary border border-border text-foreground prose dark:prose-invert prose-sm prose-p:leading-relaxed prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground prose-blockquote:text-foreground prose-blockquote:border-border dark:prose-pre:bg-black/30 prose-pre:bg-black/5 prose-pre:border prose-pre:border-border/40"
                        )}>
                          {msg.role === "assistant" ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.text}
                            </ReactMarkdown>
                          ) : (
                            msg.text
                          )}
                        </div>
                      )}
                      {msg.role === "assistant" && !isError && msg.latencyMs && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                          <span className="flex items-center gap-0.5"><Clock size={8} /> {msg.latencyMs}ms</span>
                          {msg.tokensIn !== undefined && (
                            <span className="flex items-center gap-0.5"><Hash size={8} /> {(msg.tokensIn + (msg.tokensOut ?? 0))} tokens</span>
                          )}
                          {msg.model && <span className="font-mono">{msg.model}</span>}
                          {msg.keyPreview && (() => {
                            const [start, end] = msg.keyPreview.includes('...')
                              ? msg.keyPreview.split('...')
                              : [msg.keyPreview.slice(0, 6), msg.keyPreview.slice(-4)];
                            return (
                              <span className="flex items-center gap-0.5 font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                <KeyIcon size={7} />
                                {start}<span className="opacity-50">•••</span>{end}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center">
                    <Bot size={12} className="text-muted-foreground" />
                  </div>
                  <div className="bg-secondary border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3 bg-card/40">
          {managedLimitReached ? (
            /* Test limit reached — blocked state for non-admin users */
            <div className="flex flex-col items-center gap-3 py-4 px-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Lock size={16} className="text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Test Limit Reached</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You've used all {TEST_MSG_LIMIT} test messages for this session.
                  Open the app directly to continue chatting.
                </p>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_AURAFLOW_URL || 'http://localhost:3004'}/automations`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Open in {agent.managedByApp} <ArrowLeft size={10} className="rotate-180" />
              </a>
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${agent.name}... (Enter to send, Shift+Enter for new line)`}
                  rows={2}
                  disabled={sending}
                  className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none disabled:opacity-50"
                />
                <Button
                  variant="neural"
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  className="mb-0.5 h-9 px-3"
                >
                  {sending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Send size={14} />
                  }
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                AI responses are generated by <span className="font-medium">{modelDisplayName ?? agent.model}</span> and may contain errors. Verify important information.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
