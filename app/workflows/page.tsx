"use client";

import { useState, useEffect } from "react";
import {
  Workflow as WorkflowIcon, Plus, Play, Brain, Loader2, Trash2,
  ChevronRight, Activity, History, StopCircle, RefreshCw, X,
  Check, Clock, CheckCircle2, XCircle, AlertCircle, Zap, Webhook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { neuralApi, Workflow } from "@/lib/neural-api";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Create Workflow Dialog ─────────────────────────────────────────────
function CreateWorkflowDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [appName, setAppName] = useState("playground");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) { setName(""); setAppName("playground"); setDescription(""); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !appName.trim()) return;
    setCreating(true);
    try {
      await neuralApi.workflows.create({ name, appName, description });
      toast.success("Workflow created");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <WorkflowIcon size={16} className="text-primary" />
            <h2 className="font-semibold text-sm">Create Workflow</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Workflow Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Support Ticket Triage"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">App Name *</label>
            <input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="e.g. auraflow"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
              required
            />
            <p className="text-[10px] text-muted-foreground ml-1">The app this workflow belongs to.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this workflow automate?"
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="neural" className="flex-1 text-xs" disabled={creating}>
              {creating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
              Create Workflow
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Execution Status Badge ─────────────────────────────────────────────
function ExecutionBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    completed: { icon: <CheckCircle2 size={10} />, label: "Completed", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    failed:    { icon: <XCircle size={10} />,      label: "Failed",    cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    running:   { icon: <Loader2 size={10} className="animate-spin" />, label: "Running", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    pending:   { icon: <Clock size={10} />,         label: "Pending",   cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  };
  const config = map[status] || { icon: <AlertCircle size={10} />, label: status, cls: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

// ── Workflow Card ──────────────────────────────────────────────────────
function WorkflowCard({
  wf,
  onRun,
  onDelete,
  onViewHistory,
  running,
}: {
  wf: Workflow;
  onRun: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onViewHistory: (id: string) => void;
  running: boolean;
}) {
  return (
    <Card className="hover:border-primary/30 transition-all group border-border/60 bg-secondary/20">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <WorkflowIcon size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{wf.name}</h3>
              <Badge variant={wf.status === "active" ? "secondary" : "outline"} className="text-[9px] uppercase tracking-wider h-4 shrink-0">
                {wf.status}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded uppercase shrink-0">{wf.appName}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity size={10} />
                {(wf as any).nodeCount ? `${(wf as any).nodeCount} nodes` : "Draft"}
              </div>
              <div>•</div>
              <div>Created: {new Date(wf.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* History */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            title="View execution history"
            onClick={() => onViewHistory(wf.id)}
          >
            <History size={14} />
          </Button>

          {/* Run */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary"
            onClick={() => onRun(wf.id)}
            disabled={running}
          >
            {running ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Play size={12} className="mr-1 fill-current" />}
            Run
          </Button>

          {/* Builder */}
          <Link href={`/workflows/${wf.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-semibold">
              Builder <ChevronRight size={12} />
            </Button>
          </Link>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
            onClick={() => onDelete(wf.id, wf.name)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Execution result modal
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [testPayload, setTestPayload] = useState("{}");

  // History modal
  const [historyWorkflowId, setHistoryWorkflowId] = useState<string | null>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { loadWorkflows(); }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await neuralApi.workflows.list();
      setWorkflows(data);
    } catch {
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    const toastId = toast.loading("Executing workflow...");
    try {
      let payload = {};
      try { payload = testPayload ? JSON.parse(testPayload) : {}; } catch { }
      const result = await neuralApi.workflows.execute(id, { test: true, ...payload });
      setExecutionResult(result);
      setShowResultModal(true);
      toast.success("Workflow executed", { id: toastId });
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`, { id: toastId });
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) return;
    try {
      await neuralApi.workflows.delete(id);
      toast.success("Workflow deleted");
      loadWorkflows();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleViewHistory = async (id: string) => {
    setHistoryWorkflowId(id);
    setLoadingHistory(true);
    try {
      const data = await neuralApi.workflows.executions(id);
      setExecutions(Array.isArray(data) ? data : []);
    } catch {
      setExecutions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <WorkflowIcon size={20} className="text-primary" />
            Automated Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Chain LLMs, agents, and APIs into event-driven pipelines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadWorkflows}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1" /> Create Workflow
          </Button>
        </div>
      </div>

      {/* Test payload input (compact, always visible) */}
      <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/60 text-xs">
        <span className="text-muted-foreground whitespace-nowrap font-medium">Test payload:</span>
        <input
          value={testPayload}
          onChange={e => setTestPayload(e.target.value)}
          placeholder='{ "key": "value" }'
          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Used when clicking Run</span>
      </div>

      {/* Create Dialog */}
      <CreateWorkflowDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadWorkflows}
      />

      {/* Workflow List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading your pipelines...</p>
        </div>
      ) : workflows.length === 0 ? (
        <Card className="border-dashed bg-transparent mt-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <WorkflowIcon size={20} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Workflows Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Create your first multi-agent workflow to automate complex tasks.
            </p>
            <Button variant="neural" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1" /> Create Workflow
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              wf={wf}
              onRun={handleRun}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
              running={runningId === wf.id}
            />
          ))}
        </div>
      )}

      {/* Templates */}
      <h3 className="text-sm font-semibold mt-10 mb-4 flex items-center gap-2">
        <Brain size={16} className="text-primary" />
        Recommended Templates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Brain size={14} className="text-primary" />,
            iconBg: "bg-primary/5 border-primary/10 group-hover:bg-primary/10",
            title: "Support Ticket Triage",
            desc: "Classifies incoming tickets, checks Knowledge Base, and drafts a human-like reply.",
          },
          {
            icon: <Webhook size={14} className="text-emerald-400" />,
            iconBg: "bg-emerald-500/5 border-emerald-500/10 group-hover:bg-emerald-500/10",
            title: "Lead Qualification",
            desc: "Enriches lead data via external API, scores it using LLM, and alerts Slack if high-value.",
          },
          {
            icon: <Zap size={14} className="text-amber-400" />,
            iconBg: "bg-amber-500/5 border-amber-500/10 group-hover:bg-amber-500/10",
            title: "Document Summarizer",
            desc: "Watches for new uploads, extracts text, and generates structured summaries with LLM.",
          },
        ].map(t => (
          <Card
            key={t.title}
            className="cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10 group"
            onClick={() => setCreateOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2 transition-colors ${t.iconBg}`}>
                {t.icon}
              </div>
              <CardTitle className="text-sm">{t.title}</CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">{t.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Execution Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Execution Result
            </DialogTitle>
            <DialogDescription>Output from the last step of your workflow.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] w-full rounded-md border bg-zinc-950 p-4">
            <pre className="text-[12px] font-mono text-emerald-400">
              {JSON.stringify(executionResult, null, 2)}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowResultModal(false)}>Close</Button>
            <Button variant="neural" onClick={() => {
              if (executionResult) {
                navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
                toast.success("Copied to clipboard");
              }
            }}>Copy Result</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Execution History Modal */}
      <Dialog open={!!historyWorkflowId} onOpenChange={(o) => { if (!o) setHistoryWorkflowId(null); }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={18} className="text-primary" />
              Execution History
            </DialogTitle>
            <DialogDescription>Past runs for this workflow.</DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={18} /> Loading history...
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No executions yet. Run this workflow to see history here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {executions.map((ex: any) => (
                  <div key={ex.id} className="p-3 rounded-xl border border-border bg-card/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <ExecutionBadge status={ex.status} />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(ex.createdAt).toLocaleString()} · {ex.latencyMs ?? '—'}ms
                      </span>
                    </div>
                    {ex.error && (
                      <p className="text-xs text-red-400 font-mono bg-red-500/10 rounded-lg px-3 py-2">
                        {ex.error}
                      </p>
                    )}
                    {ex.outputData && (
                      <details className="text-[11px]">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                          View output
                        </summary>
                        <pre className="mt-2 font-mono text-emerald-400 bg-zinc-950 rounded-lg p-3 overflow-x-auto">
                          {typeof ex.outputData === 'string' ? ex.outputData : JSON.stringify(ex.outputData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => historyWorkflowId && handleRun(historyWorkflowId)} className="gap-1.5">
              <Play size={13} className="fill-current" /> Re-run
            </Button>
            <Button variant="ghost" onClick={() => setHistoryWorkflowId(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
