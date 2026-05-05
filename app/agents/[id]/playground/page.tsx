"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bot, Send, RefreshCw, ArrowLeft, Loader2,
  Clock, Hash, Shield, Zap, AlertCircle,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi, Agent, ChatMessage } from "@/lib/neural-api";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    neuralApi.agents.get(agentId)
      .then(setAgent)
      .catch((e) => setAgentError(e.message))
      .finally(() => setAgentLoading(false));
  }, [agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setSending(true);

    try {
      const result: ChatMessage = await neuralApi.agents.chat(agentId, userText, sessionId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: result.text,
          latencyMs: result.latencyMs,
          tokensIn: result.usage?.tokensIn,
          tokensOut: result.usage?.tokensOut,
          model: result.model,
        },
      ]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `⚠️ Error: ${err.message}`,
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
    <div className="flex gap-5 h-[calc(100vh-3.5rem-3rem)] max-w-6xl mx-auto">
      {/* Left panel — Agent Config */}
      <aside className="w-64 shrink-0 flex flex-col gap-4">
        <div>
          <Link href="/agents" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={11} /> Back to Agents
          </Link>

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
                <span className="font-mono text-[10px]">{agent.model}</span>
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
      <div className="flex-1 flex flex-col glass rounded-xl border border-border overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/40">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="status-dot active" />
            Agent Playground
          </div>
          <span className="text-xs text-muted-foreground ml-auto font-mono">
            {sessionId.slice(-8)}
          </span>
        </div>

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
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === "user"
                      ? "bg-primary/20 border border-primary/30 text-primary"
                      : "bg-secondary border border-border text-muted-foreground"
                    }`}>
                    {msg.role === "user" ? "U" : <Bot size={12} />}
                  </div>
                  <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
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
                    {msg.role === "assistant" && msg.latencyMs && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                        <span className="flex items-center gap-0.5"><Clock size={8} /> {msg.latencyMs}ms</span>
                        {msg.tokensIn !== undefined && (
                          <span className="flex items-center gap-0.5"><Hash size={8} /> {(msg.tokensIn + (msg.tokensOut ?? 0))} tokens</span>
                        )}
                        {msg.model && <span className="font-mono">{msg.model}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              onClick={sendMessage}
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
            AI responses are generated by {agent.model} and may contain errors. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
