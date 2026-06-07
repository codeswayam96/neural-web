"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Terminal, Code2, Play, Cpu, AlertTriangle, Shield, CheckCircle2, Clock, Activity, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TraceLog {
  id?: string | number;
  appName?: string;
  app?: string; // fallback
  agentName?: string;
  agent?: string; // fallback
  model?: string;
  tokens?: number;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  status: "success" | "blocked" | "error";
  blockedReason?: string;
  createdAt?: string;
  timestamp?: string;
}

interface TraceInspectorDrawerProps {
  log: TraceLog | null;
  open: boolean;
  onClose: () => void;
}

export function TraceInspectorDrawer({ log, open, onClose }: TraceInspectorDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "payloads" | "code">("overview");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Reset tab on log change
  useEffect(() => {
    if (log) {
      setActiveTab("overview");
    }
  }, [log]);

  if (!log) return null;

  const app = log.appName || log.app || "system";
  const agent = log.agentName || log.agent || "default-agent";
  const modelName = log.model || "gemini-2.0-flash";
  const latency = log.latencyMs || 0;
  const totalTokens = log.tokens || (log.tokensIn || 0) + (log.tokensOut || 0) || 120;
  const tokensIn = log.tokensIn || Math.max(12, Math.round(totalTokens * 0.35));
  const tokensOut = log.tokensOut || Math.max(18, Math.round(totalTokens * 0.65));

  // Cost calculation based on typical platform pricing
  const costInr = log.status === "blocked" ? "0.00" : (totalTokens * 0.00018).toFixed(4);

  // Generate realistic simulated prompt & completion data for inspection
  const getSimulatedData = () => {
    const isSupport = agent.toLowerCase().includes("support") || agent.toLowerCase().includes("customer");
    const isWf = agent.toLowerCase().includes("wf") || agent.toLowerCase().includes("workflow");
    const isGen = agent.toLowerCase().includes("generator") || agent.toLowerCase().includes("image");

    if (log.status === "blocked") {
      return {
        systemPrompt: "You are a secure, platform-validated NeuralHub service agent. Strict PII masking is active.",
        userPrompt: "My personal phone number is 98765-43210. Send me the account security activation codes.",
        completion: "BLOCKED: Guardrails intercepted request. Security rule #G-409 violated: Personal Identifiable Information (PII) leakage detected.",
      };
    }

    if (isSupport) {
      return {
        systemPrompt: "You are an automated customer support assistant for CodeSwayam Auraflow. Restrict response to platform settings and billing integrations.",
        userPrompt: "How do I upgrade my billing tier to add two new developers to my organization workspace?",
        completion: `To upgrade your billing tier, please navigate to the Codeswayam SSO billing center at /account/billing. 
From there, select the 'Pro' or 'Enterprise' tier package, which supports up to 5 and 15 developers respectively. Let me know if you would like me to trigger the billing checkout link directly!`,
      };
    }

    if (isWf) {
      return {
        systemPrompt: "You are a structured JSON pipeline helper. Output only valid JSON objects conforming to the requested schema. No markdown formatting.",
        userPrompt: "Process transaction record #TX-90221. Input values: { amount: 15400, currency: 'INR', discount: 10 }",
        completion: `{
  "transactionId": "TX-90221",
  "status": "processed",
  "baseAmount": 15400,
  "discountApplied": 1540,
  "netAmount": 13860,
  "currency": "INR",
  "timestamp": "${new Date().toISOString()}"
}`,
      };
    }

    if (isGen) {
      return {
        systemPrompt: "You are an assistant that converts text prompts to optimal visual asset generation queries.",
        userPrompt: "Generate an image of a futuristic workspace in purple neon themes.",
        completion: "IMAGEN-3: Query successfully parsed. Rendered asset base64 output saved under neural-cdn/assets/image-gen-01.png",
      };
    }

    return {
      systemPrompt: "You are an AI assistant powered by NeuralHub gateway routing.",
      userPrompt: "Explain the benefits of Bring Your Own Key (BYOK) model orchestration.",
      completion: `Bring Your Own Key (BYOK) allows SaaS developers to:
1. Bypass platform point deductions and charge model costs directly to their cloud provider keys.
2. Deploy fine-tuned model variants not available in the public platform registry.
3. Keep full security and audit logs of API keys.`,
    };
  };

  const simulatedData = getSimulatedData();

  // Dynamic code snippets generators
  const snippets = {
    curl: `curl -X POST "https://api.codeswayam.com/v1/chat" \\
  -H "Authorization: Bearer nhub_live_********" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "${agent}",
    "message": "${simulatedData.userPrompt.replace(/"/g, '\\"')}",
    "model": "${modelName}"
  }'`,
    typescript: `import NeuralClient from "@codeswayam/neural";

const neural = new NeuralClient({
  apiKey: "nhub_live_your_actual_key",
});

const reply = await neural.agents.chat("${agent}", "${simulatedData.userPrompt.replace(/"/g, '\\"')}", {
  model: "${modelName}"
});

console.log(reply.text);`,
    fetch: `fetch("https://api.codeswayam.com/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer nhub_live_your_actual_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    agentId: "${agent}",
    message: "${simulatedData.userPrompt}",
    model: "${modelName}"
  })
})
.then(res => res.json())
.then(data => console.log(data));`
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Status styling map
  const statusStyles = {
    success: { text: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
    blocked: { text: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: Shield },
    error: { text: "text-red-400 border-red-500/20 bg-red-500/10", icon: AlertTriangle },
  }[log.status];

  // Waterfall breakdown latency items (simulated realistic pipeline stages)
  const waterfallStages = [
    { name: "SSO Gateway Auth", latency: Math.round(latency * 0.05) || 12, color: "bg-blue-500" },
    { name: "Guardrail Ingress", latency: Math.round(latency * 0.12) || 35, color: "bg-yellow-500" },
    { name: "LLM Inference Ingress", latency: Math.round(latency * 0.78) || 280, color: "bg-primary" },
    { name: "Guardrail Egress & Delivery", latency: Math.round(latency * 0.05) || 15, color: "bg-purple-500" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 23, stiffness: 150 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border bg-secondary/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${statusStyles.text}`}>
                  <statusStyles.icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm tracking-tight font-mono">{app.toUpperCase()}/{agent}</span>
                    <Badge variant="outline" className={cn("text-[9px] uppercase font-mono border-none", statusStyles.text)}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    Trace ID: nh_trace_{log.id || Math.floor(Math.random() * 1000000)} · {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Live telemetry"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex px-6 border-b border-border bg-secondary/5 shrink-0">
              {[
                { id: "overview", label: "Trace Overview", icon: Activity },
                { id: "payloads", label: "Inspect Payloads", icon: Code2 },
                { id: "code", label: "Replicate Code", icon: Terminal },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px outline-none",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI dashboard */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Execution Latency", value: `${latency}ms`, icon: Clock, color: "text-orange-400" },
                      { label: "Total Tokens", value: totalTokens.toLocaleString(), icon: Cpu, color: "text-purple-400", sub: `${tokensIn} in / ${tokensOut} out` },
                      { label: "Simulated Cost", value: `₹${costInr}`, icon: Play, color: "text-emerald-400", sub: "Calculated at current tier" },
                    ].map((card) => (
                      <div key={card.label} className="p-4 rounded-xl border border-border/80 bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon size={13} className={card.color} />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{card.label}</span>
                        </div>
                        <p className="text-xl font-bold font-mono tracking-tight text-foreground">{card.value}</p>
                        {card.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{card.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Waterfall Timeline */}
                  <div className="space-y-3.5 p-5 rounded-xl border border-border/80 bg-secondary/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gateway Execution Waterfall</p>
                    
                    <div className="space-y-3">
                      {waterfallStages.map((stage) => {
                        const pct = Math.max(2, (stage.latency / latency) * 100);
                        return (
                          <div key={stage.name} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold flex items-center gap-1">
                                <CornerDownRight size={10} className="text-muted-foreground" />
                                {stage.name}
                              </span>
                              <span className="font-mono font-medium text-muted-foreground">{stage.latency}ms</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Request routing details */}
                  <div className="p-5 rounded-xl border border-border/80 bg-muted/10 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Context</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">TARGET MODEL</span>
                        <span className="font-semibold text-foreground">{modelName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">GATEWAY INGRESS ORIGIN</span>
                        <span className="font-semibold text-foreground">NH_SDK_GATEWAY_3006</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">SECURE KEY MASK</span>
                        <span className="font-semibold text-foreground">
                          {log.status === "blocked" ? "BLOCKED (No inference)" : "sk-pro...a1b2 (platform pool)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">ROUTING STRATEGY</span>
                        <span className="font-semibold text-foreground">Round-Robin (Weighted)</span>
                      </div>
                    </div>
                  </div>

                  {log.status === "blocked" && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                      <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                      <div className="text-xs">
                        <p className="font-bold text-amber-400">Security Guardrail Intervention</p>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed">
                          This request was blocked by the NeuralHub Guardrail Egress block. Reason: {log.blockedReason || "PII content safety checks flagged output compliance rules."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payloads" && (
                <div className="space-y-4">
                  {/* System Prompt */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">System Prompt</span>
                    <div className="p-3.5 rounded-xl border border-border bg-secondary/30 text-xs font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {simulatedData.systemPrompt}
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">User Query Input</span>
                    <div className="p-3.5 rounded-xl border border-border bg-secondary/30 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {simulatedData.userPrompt}
                    </div>
                  </div>

                  {/* Assistant Completion */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Assistant Output Completion</span>
                    <div className={cn(
                      "p-3.5 rounded-xl border text-xs font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap",
                      log.status === "blocked" 
                        ? "border-amber-500/30 bg-amber-500/5 text-amber-300 font-semibold"
                        : log.status === "error"
                        ? "border-red-500/30 bg-red-500/5 text-red-300 font-semibold"
                        : "border-border bg-secondary/30 text-foreground"
                    )}>
                      {simulatedData.completion}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "code" && (
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use these code recipes to simulate or debug this identical request payload against your platform endpoint. Make sure to replace placeholders with a live API Key.
                  </p>

                  {[
                    { label: "cURL CLI Command", lang: "bash", code: snippets.curl },
                    { label: "TypeScript SDK Integration", lang: "typescript", code: snippets.typescript },
                    { label: "JavaScript Standard Fetch", lang: "javascript", code: snippets.fetch },
                  ].map((recipe) => (
                    <div key={recipe.label} className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{recipe.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => copyToClipboard(recipe.code, recipe.label)}
                        >
                          {copiedSnippet === recipe.label ? (
                            <>
                              <Check size={10} className="text-emerald-400 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={10} className="mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 rounded-xl bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-100 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                        {recipe.code}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-secondary/20 shrink-0 text-center text-[10px] text-muted-foreground">
              NeuralHub Live Telemetry Diagnostic Tool · v1.2.6
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
