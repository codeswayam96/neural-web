"use client";

import { useEffect, useState } from "react";
import { neuralApi } from "@/lib/neural-api";
import { Bot, Cpu, Workflow, Globe, Activity, ShieldAlert, Zap, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await neuralApi.admin.stats();
      setStats(data);
    } catch {
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kpis = stats ? [
    { label: "Total Agents", value: stats.agents, icon: Bot, color: "text-blue-400", bg: "bg-blue-500/10", href: "/admin/agents" },
    { label: "Platform Models", value: stats.platformModels, icon: Cpu, color: "text-purple-400", bg: "bg-purple-500/10", href: "/admin/models" },
    { label: "Active API Keys", value: stats.activeApiKeys, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/admin/logs" },
    { label: "Workflows", value: stats.workflows, icon: Workflow, color: "text-amber-400", bg: "bg-amber-500/10", href: "/admin/workflows" },
    { label: "Requests Today", value: stats.requestsToday.toLocaleString(), icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10", href: "/admin/logs" },
    { label: "Blocked Today", value: stats.blockedToday, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", href: "/admin/logs" },
    { label: "Tokens Today", value: stats.tokensToday > 1_000_000 ? `${(stats.tokensToday / 1_000_000).toFixed(1)}M` : stats.tokensToday > 1000 ? `${(stats.tokensToday / 1000).toFixed(0)}K` : String(stats.tokensToday), icon: Globe, color: "text-pink-400", bg: "bg-pink-500/10", href: "/admin/logs" },
    { label: "Avg Latency", value: `${stats.avgLatencyMs}ms`, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10", href: "/admin/logs" },
  ] : [];

  const quickLinks = [
    { href: "/admin/agents", label: "Manage Agents", desc: "View, edit, delete all user agents", icon: Bot },
    { href: "/admin/models", label: "Platform Models", desc: "Toggle model status, manage key pools", icon: Cpu },
    { href: "/admin/domains", label: "Trusted Domains", desc: "CORS whitelist for external apps", icon: Globe },
    { href: "/admin/prompt-config", label: "Auto-Generate Config", desc: "Configure the workflow-helper AI agent", icon: Zap },
    { href: "/admin/logs", label: "Request Logs", desc: "Live audit trail of all API calls", icon: Activity },
    { href: "/admin/workflows", label: "All Workflows", desc: "Inspect every user's pipelines", icon: Workflow },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time stats across all NeuralHub resources</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-secondary mb-2" />
                <div className="h-6 w-16 bg-secondary rounded mb-1" />
                <div className="h-3 w-20 bg-secondary rounded" />
              </Card>
            ))
          : kpis.map((k) => (
              <Link key={k.label} href={k.href}>
                <Card className="p-4 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.bg} ${k.color}`}>
                    <k.icon size={16} />
                  </div>
                  <p className="text-xl font-bold">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">Admin Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="p-4 hover:border-primary/30 transition-all cursor-pointer group flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <l.icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{l.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.desc}</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
