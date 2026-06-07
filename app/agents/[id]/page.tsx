"use client";

import { useState, use } from "react";
import {
  Bot, Play, Settings, ArrowLeft, Activity, Clock, Shield, Database, Brain,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, BarChart3, RefreshCw,
  Copy, Zap, Lock, ExternalLink, Loader2, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi, Agent } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Agent stat card ──────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; trend?: { value: number; up: boolean };
}) {
  return (
    <Card glow className="p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold mt-0.5 ${trend.up ? "text-emerald-400" : "text-red-400"}`}>
          <TrendingUp size={9} className={trend.up ? "" : "rotate-180"} />
          {Math.abs(trend.value)}% vs yesterday
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </Card>
  );
}

// ── Main agent detail page ────────────────────────────────────────────────────
export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: agent, loading, error, refetch } = useNeuralFetch(() => neuralApi.agents.get(id), [id]);

  // Fetch per-agent analytics (reuse the analytics API with agent filter if supported,
  // otherwise fall back to the agent's own .requests & .guardrails fields)
  const { data: overview } = useNeuralFetch(() => neuralApi.analytics.overview());

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl animate-pulse">
        <div className="h-8 w-48 bg-secondary rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-secondary rounded-xl" />)}
        </div>
        <div className="h-64 bg-secondary rounded-xl" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <Bot size={40} className="opacity-20" />
        <p className="text-sm font-semibold">Agent not found or API unavailable</p>
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft size={13} className="mr-1.5" /> Back
        </Button>
      </div>
    );
  }

  const successRate = agent.requests > 0
    ? Math.max(0, Math.round(((agent.requests - agent.guardrails) / agent.requests) * 100))
    : 100;
  const guardrailRate = agent.requests > 0
    ? Math.round((agent.guardrails / agent.requests) * 100)
    : 0;

  const metrics = [
    { label: "Total Requests", value: agent.requests.toLocaleString(), icon: Activity, color: "bg-blue-500/10 text-blue-400", trend: { value: 12, up: true } },
    { label: "Guardrail Blocks", value: agent.guardrails.toLocaleString(), sub: `${guardrailRate}% of traffic`, icon: Shield, color: "bg-amber-500/10 text-amber-400" },
    { label: "Success Rate", value: `${successRate}%`, sub: agent.requests > 0 ? `${agent.requests - agent.guardrails} clean responses` : "No requests yet", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Model", value: agent.model.split("/").pop() || agent.model, sub: agent.model, icon: Brain, color: "bg-violet-500/10 text-violet-400" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/agents" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors mt-0.5 shrink-0">
          <ArrowLeft size={14} className="text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
            {agent.managedByApp && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Zap size={9} /> Managed by {agent.managedByApp}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {agent.description || agent.systemPrompt?.slice(0, 100) || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw size={13} className="mr-1.5" /> Refresh
          </Button>
          <Button variant="neural" size="sm" asChild>
            <Link href={`/agents/${id}/playground`}>
              <Play size={13} className="mr-1.5" /> Playground
            </Link>
          </Button>
        </div>
      </div>

      {/* Agent ID copy + app badge */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button
          onClick={() => { navigator.clipboard.writeText(agent.id); toast.success("Agent ID copied"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:border-primary/30 font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          <Copy size={11} /> ID: {agent.id}
        </button>
        <span className="px-3 py-1.5 rounded-lg border border-border bg-secondary font-mono text-muted-foreground">
          App: {agent.app}
        </span>
        <span className="px-3 py-1.5 rounded-lg border border-border bg-secondary font-mono text-muted-foreground">
          Version: {agent.version || "1.0"}
        </span>
        <span className="px-3 py-1.5 rounded-lg border border-border bg-secondary font-mono text-muted-foreground text-[10px]">
          Created {new Date(agent.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub}
            icon={m.icon} color={m.color} trend={(m as any).trend} />
        ))}
      </div>

      {/* Bottom split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Config overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Configuration</CardTitle>
              {!agent.managedByApp && (
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setSettingsOpen(true)}>
                  <Settings size={11} className="mr-1.5" /> Edit
                </Button>
              )}
              {agent.managedByApp && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Lock size={10} /> Platform-locked
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Brain size={9} /> Intelligence
              </p>
              <div className="px-3 py-2.5 rounded-xl bg-secondary border border-border font-mono text-xs">
                {agent.model}
                {agent.managedByApp && (
                  <span className="ml-2 text-[9px] text-amber-400">(platform-managed)</span>
                )}
              </div>
            </div>

            {/* System prompt */}
            {agent.systemPrompt && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Bot size={9} /> System Prompt
                </p>
                <div className="px-3 py-2.5 rounded-xl bg-secondary border border-border text-xs text-muted-foreground font-mono leading-relaxed max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                  {agent.systemPrompt}
                </div>
              </div>
            )}

            {/* Guardrails */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Shield size={9} /> Guardrails
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Guardrail Engine", enabled: agent.guardrailsEnabled },
                  { label: "PII Masking", enabled: agent.piiMasking },
                ].map(g => (
                  <div key={g.label} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium",
                    g.enabled
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-secondary border-border text-muted-foreground"
                  )}>
                    {g.enabled ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {g.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Topic lists */}
            {(agent.topicWhitelist || agent.topicBlacklist) && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={9} /> Topic Filtering
                </p>
                <div className="space-y-2">
                  {agent.topicWhitelist && (
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                      <span className="text-emerald-400 font-bold">Whitelist: </span>
                      <span className="text-muted-foreground">{agent.topicWhitelist}</span>
                    </div>
                  )}
                  {agent.topicBlacklist && (
                    <div className="px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-xs">
                      <span className="text-red-400 font-bold">Blacklist: </span>
                      <span className="text-muted-foreground">{agent.topicBlacklist}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RAG */}
            {agent.knowledgeBaseId && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <Database size={13} className="text-violet-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-violet-400">RAG Enabled</p>
                  <p className="text-muted-foreground">KB ID: {agent.knowledgeBaseId}</p>
                </div>
                <Link href="/knowledge-base" className="ml-auto text-[10px] text-violet-400 hover:underline flex items-center gap-0.5">
                  View <ExternalLink size={9} />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          {/* Performance bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Performance</CardTitle>
              <CardDescription className="text-xs">Based on lifetime requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Success Rate", pct: successRate, color: "from-emerald-500 to-teal-500" },
                { label: "Guardrail Rate", pct: guardrailRate, color: "from-amber-500 to-orange-500" },
              ].map(bar => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{bar.label}</span>
                    <span className="font-bold">{bar.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-700`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Open Playground", href: `/agents/${id}/playground`, icon: Play },
                { label: "View Analytics", href: "/analytics", icon: BarChart3 },
                { label: "Manage Models", href: "/models", icon: Brain },
                { label: "API Keys", href: "/api-keys", icon: Zap },
              ].map(action => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary transition-colors group cursor-pointer">
                    <action.icon size={13} className="text-primary shrink-0" />
                    <span className="text-xs font-medium flex-1">{action.label}</span>
                    <ChevronRight size={11} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
