"use client";

import { useEffect, useState } from "react";
import {
  Brain, Bot, Cpu, Key, BarChart3, TrendingUp,
  TrendingDown, Activity, Zap, AlertTriangle,
  Clock, DollarSign, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { neuralApi, AnalyticsOverview, AppBreakdown, RecentRequest } from "@/lib/neural-api";
import { useNeuralFetch, useNeuralEvents } from "@/lib/hooks";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardPage() {
  const { events: liveEvents, connected } = useNeuralEvents();
  const { data: overview, loading: ovLoading, refetch: refetchOv } = useNeuralFetch(
    () => neuralApi.analytics.overview()
  );
  const { data: apps, loading: appsLoading } = useNeuralFetch(
    () => neuralApi.analytics.apps()
  );
  const { data: recent, loading: recentLoading } = useNeuralFetch(
    () => neuralApi.analytics.recentRequests()
  );

  const kpis = overview
    ? [
        { label: "Total Requests Today", value: overview.totalRequestsToday.toLocaleString(), change: `+${overview.changeRequestsPct}%`, up: overview.changeRequestsPct > 0, icon: Activity, color: "text-blue-400" },
        { label: "Tokens Used", value: (overview.tokensUsed / 1_000_000).toFixed(1) + "M", change: `+${overview.changeTokensPct}%`, up: overview.changeTokensPct > 0, icon: Brain, color: "text-purple-400" },
        { label: "Est. Cost Today", value: `₹${overview.estimatedCostInr}`, change: `${overview.changeCostPct}%`, up: overview.changeCostPct > 0, icon: DollarSign, color: "text-emerald-400" },
        { label: "Avg Latency", value: `${overview.avgLatencyMs}ms`, change: `+${overview.changeLatencyMs}ms`, up: false, icon: Clock, color: "text-orange-400" },
        { label: "Active Agents", value: String(overview.activeAgents), change: "+2", up: true, icon: Bot, color: "text-cyan-400" },
        { label: "Guardrail Blocks", value: String(overview.guardrailBlocks), change: "-14%", up: false, icon: AlertTriangle, color: "text-yellow-400" },
      ]
    : [];

  const loading = ovLoading || appsLoading || recentLoading;
  const maxRequests = apps ? Math.max(...apps.map((a) => a.requests), 1) : 1;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live data from NeuralAPI · All systems operational
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetchOv}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/agents"><Bot size={13} /> New Agent</Link>
          </Button>
          <Button variant="neural" size="sm" asChild>
            <Link href="/api-keys"><Key size={13} /> Issue API Key</Link>
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {ovLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-secondary mb-2" />
                <div className="h-6 w-16 bg-secondary rounded mb-1" />
                <div className="h-3 w-20 bg-secondary rounded" />
              </Card>
            ))
          : kpis.map((k) => (
              <Card key={k.label} glow className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${k.color}`}>
                    <k.icon size={15} />
                  </div>
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                    {k.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {k.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{k.label}</p>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Stream */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Live Telemetry</CardTitle>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} title={connected ? "Connected" : "Disconnected"} />
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary border-none">
                {liveEvents.length > 0 ? "Receiving Data" : "Waiting for Events"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[300px]">
              {liveEvents.length === 0 && !recentLoading && (recent ?? []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Activity size={32} className="opacity-20 mb-3" />
                  <p className="text-xs">No activity detected yet.</p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {(liveEvents.length > 0 ? liveEvents : (recent ?? [])).map((r, i) => (
                  <motion.div
                    key={r.timestamp || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border hover:border-primary/20 hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border/50 group-hover:border-primary/30">
                      {r.type === 'image' ? <Zap size={12} className="text-emerald-400" /> : <Bot size={12} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold truncate">
                          {r.app ? r.app.toUpperCase() : 'APP'}/{r.agent || 'SYSTEM'}
                        </span>
                        <span className={`status-dot shrink-0 ${r.status === "success" ? "active" : "error"}`} />
                        {r.type === 'chat' && <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/20 text-primary/70">LLM</Badge>}
                        {r.type === 'image' && <Badge variant="outline" className="text-[8px] h-3 px-1 border-emerald-500/20 text-emerald-500/70">IMG</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-foreground/70">{r.model || 'imagen-3'}</span>
                        <span>·</span>
                        <span>{r.tokens || 0} tkn</span>
                        <span>·</span>
                        <span className={r.latencyMs > 2000 ? "text-orange-400" : ""}>{r.latencyMs || 0}ms</span>
                      </p>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono tabular-nums opacity-60">
                      {r.timeAgo || new Date(r.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Apps by usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Apps by Usage</CardTitle>
            <CardDescription className="text-xs">Today&apos;s breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5 animate-pulse">
                    <div className="h-3 w-24 bg-secondary rounded" />
                    <div className="h-1.5 w-full bg-secondary rounded-full" />
                  </div>
                ))
              : (apps ?? []).map((app) => (
                  <div key={app.app} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium">{app.app}</span>
                      <span className="text-muted-foreground">₹{app.cost}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-700"
                        style={{ width: `${(app.requests / maxRequests) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{app.requests.toLocaleString()} requests · {app.agents} agents</p>
                  </div>
                ))}

            <div className="pt-3 border-t border-border">
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <Link href="/analytics">View Full Analytics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Bot, label: "Create Agent", desc: "Build a new AI agent", href: "/agents", color: "text-blue-400" },
          { icon: Cpu, label: "Add Model Key", desc: "Register LLM API keys", href: "/models", color: "text-purple-400" },
          { icon: Key, label: "Issue SDK Key", desc: "Create app API key", href: "/api-keys", color: "text-emerald-400" },
          { icon: Zap, label: "New Workflow", desc: "Build automation pipeline", href: "/workflows", color: "text-orange-400" },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <Card glow className="p-4 cursor-pointer hover:border-primary/30 transition-all group">
              <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-2.5 group-hover:bg-primary/10 transition-colors ${a.color}`}>
                <a.icon size={15} />
              </div>
              <p className="text-xs font-semibold mb-0.5">{a.label}</p>
              <p className="text-[10px] text-muted-foreground">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
