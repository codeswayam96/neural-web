"use client";

import { useState, useEffect } from "react";
import { BarChart3, Activity, DollarSign, Clock, Bot, AlertCircle, RefreshCw, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { TraceInspectorDrawer } from "@/components/trace-inspector-drawer";

export default function AnalyticsPage() {
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('1d');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: overview, loading: ovLoading, error, refetch } = useNeuralFetch(() => neuralApi.analytics.overview(), [range]);
  const { data: timeline, loading: tlLoading } = useNeuralFetch(() => neuralApi.analytics.timeline(), [range]);
  const { data: modelUsage, loading: muLoading } = useNeuralFetch(() => neuralApi.analytics.modelUsage(), [range]);
  const { data: recentRequests, loading: rrLoading } = useNeuralFetch(() => neuralApi.analytics.recentRequests(), [range]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { csv } = await neuralApi.analytics.export();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neural-analytics-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail — export is non-critical
    } finally {
      setExporting(false);
    }
  };

  const loading = ovLoading || tlLoading;
  const maxBar = timeline ? Math.max(...timeline.map((t) => t.requests), 1) : 1;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Tokens, cost, latency, and guardrail metrics across all apps and agents.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl border border-border">
            {([['1d', 'Today'], ['7d', '7 Days'], ['30d', '30 Days']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === val ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
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
            <CardTitle className="text-sm">Requests &amp; Token Ingress Volume</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Interactive Timeline</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tlLoading || !isMounted ? (
            <div className="h-64 bg-secondary/20 border border-border/50 rounded-xl flex items-center justify-center animate-pulse text-xs text-muted-foreground">
              Initializing Recharts interactive session...
            </div>
          ) : (
            <div className="h-64 w-full mt-2 font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline ?? []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(263.4 70% 50.4%)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(263.4 70% 50.4%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" stroke="#888" tickLine={false} />
                  <YAxis stroke="#888" tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10, 10, 10, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelClassName="text-white font-bold"
                  />
                  <Area type="monotone" dataKey="requests" stroke="hsl(263.4 70% 50.4%)" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" name="Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Model Share Breakdown</CardTitle>
            <CardDescription className="text-xs">Visualizing distribution across model providers</CardDescription>
          </CardHeader>
          <CardContent>
            {muLoading || !isMounted ? (
              <div className="h-56 bg-secondary/20 border border-border/50 rounded-xl flex items-center justify-center animate-pulse text-xs text-muted-foreground">
                Calculating registry share...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-36 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelUsage ?? []} layout="vertical" margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#888" tickLine={false} />
                      <YAxis type="category" dataKey="model" stroke="#888" tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: "rgba(10, 10, 10, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelClassName="text-white font-bold font-mono"
                      />
                      <Bar dataKey="pct" fill="hsl(263.4 70% 50.4%)" radius={[0, 4, 4, 0]} name="Percentage (%)">
                        {(modelUsage ?? []).map((entry, index) => {
                          const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {(modelUsage ?? []).map((m) => (
                    <div key={m.model} className="flex items-center justify-between text-xs gap-3">
                      <span className="font-mono truncate flex-1 min-w-0">{m.model}</span>
                      <span className="text-muted-foreground font-bold shrink-0">{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <div 
                    key={i} 
                    onClick={() => { setSelectedLog(r); setDrawerOpen(true); }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer transition-all group"
                  >
                    <Bot size={11} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
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
      <TraceInspectorDrawer log={selectedLog} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
