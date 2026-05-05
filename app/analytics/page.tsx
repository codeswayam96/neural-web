"use client";

import { BarChart3, Activity, DollarSign, Clock, Bot, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";

export default function AnalyticsPage() {
  const { data: overview, loading: ovLoading, error, refetch } = useNeuralFetch(() => neuralApi.analytics.overview());
  const { data: timeline, loading: tlLoading } = useNeuralFetch(() => neuralApi.analytics.timeline());
  const { data: modelUsage, loading: muLoading } = useNeuralFetch(() => neuralApi.analytics.modelUsage());
  const { data: recentRequests, loading: rrLoading } = useNeuralFetch(() => neuralApi.analytics.recentRequests());

  const loading = ovLoading || tlLoading;
  const maxBar = timeline ? Math.max(...timeline.map((t) => t.requests), 1) : 1;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tokens, cost, latency, and guardrail metrics across all apps and agents.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          <AlertCircle size={16} />
          Could not connect to NeuralAPI. Showing cached data.
          <Button variant="outline" size="sm" onClick={refetch} className="ml-auto text-xs">Retry</Button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ovLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="h-8 w-8 rounded-lg bg-secondary" />
              <div className="h-6 w-16 bg-secondary rounded" />
              <div className="h-3 w-20 bg-secondary rounded" />
            </div>
          ))
        ) : overview && [
          { label: "Requests Today", value: overview.totalRequestsToday.toLocaleString(), change: `+${overview.changeRequestsPct}%`, icon: Activity, color: "text-blue-400" },
          { label: "Tokens Today", value: `${(overview.tokensUsed / 1_000_000).toFixed(1)}M`, change: `+${overview.changeTokensPct}%`, icon: BarChart3, color: "text-purple-400" },
          { label: "Cost Today", value: `₹${overview.estimatedCostInr}`, change: `${overview.changeCostPct}%`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Avg Latency", value: `${overview.avgLatencyMs}ms`, change: `+${overview.changeLatencyMs}ms`, icon: Clock, color: "text-orange-400" },
        ].map((m) => (
          <Card key={m.label} glow className="p-4">
            <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-2 ${m.color}`}>
              <m.icon size={14} />
            </div>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <Badge variant="secondary" className="text-[9px] mt-1">{m.change}</Badge>
          </Card>
        ))}
      </div>

      {/* Requests timeline chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Requests per Hour (Today)</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Last 24h</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tlLoading ? (
            <div className="h-32 bg-secondary/30 rounded animate-pulse" />
          ) : (
            <>
              <div className="flex items-end gap-1 h-32">
                {(timeline ?? []).map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-sm bg-primary/50 group-hover:bg-primary transition-colors cursor-pointer"
                      style={{ height: `${(point.requests / maxBar) * 100}%`, minHeight: "2px" }}
                    />
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-card border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10">
                      {point.hour}: {point.requests.toLocaleString()} reqs
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">00:00</span>
                <span className="text-[10px] text-muted-foreground">12:00</span>
                <span className="text-[10px] text-muted-foreground">23:00</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Model Usage Today</CardTitle>
            <CardDescription className="text-xs">Share of total requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {muLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1 animate-pulse">
                  <div className="h-3 w-32 bg-secondary rounded" />
                  <div className="h-1.5 w-full bg-secondary rounded-full" />
                </div>
              ))
            ) : (modelUsage ?? []).map((m) => (
              <div key={m.model} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono">{m.model}</span>
                  <span className="text-muted-foreground">{m.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-700"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Requests</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {rrLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-secondary/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(recentRequests ?? []).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border">
                    <Bot size={11} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{r.app}/{r.agent}</p>
                      <p className="text-[10px] text-muted-foreground">{r.model} · {r.tokens} tkn · {r.latencyMs}ms</p>
                    </div>
                    <span className={`status-dot shrink-0 ${r.status === "success" ? "active" : "error"}`} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
