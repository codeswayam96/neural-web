"use client";

import { useState, useEffect } from "react";
import {
  Bot, Plus, Play, Settings, Search, RefreshCw, AlertCircle,
  Trash2, X, Check, Loader2, ChevronDown, ChevronRight, Brain, Database, Shield, Zap, Users, Copy,
  Lock, ExternalLink, AlertTriangle, MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { neuralApi, Agent, CreateAgentPayload, KnowledgeBase } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import Link from "next/link";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

const MODEL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  gemini:   { bg: "bg-blue-500/10",     text: "text-blue-400",     border: "border-blue-500/20",     dot: "bg-blue-400" },
  gpt:      { bg: "bg-emerald-500/10",  text: "text-emerald-400",  border: "border-emerald-500/20",  dot: "bg-emerald-400" },
  claude:   { bg: "bg-orange-500/10",   text: "text-orange-400",   border: "border-orange-500/20",   dot: "bg-orange-400" },
  llama:    { bg: "bg-purple-500/10",   text: "text-purple-400",   border: "border-purple-500/20",   dot: "bg-purple-400" },
  deepseek: { bg: "bg-cyan-500/10",     text: "text-cyan-400",     border: "border-cyan-500/20",     dot: "bg-cyan-400" },
  mistral:  { bg: "bg-rose-500/10",     text: "text-rose-400",     border: "border-rose-500/20",     dot: "bg-rose-400" },
  ollama:   { bg: "bg-violet-500/10",   text: "text-violet-400",   border: "border-violet-500/20",   dot: "bg-violet-400" },
};

function getModelColors(model: string) {
  const key = Object.keys(MODEL_COLORS).find(k => model.toLowerCase().includes(k));
  return key ? MODEL_COLORS[key] : { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" };
}

function ModelBadge({ model, resolvedName }: { model: string; resolvedName?: string }) {
  const displayName = resolvedName || model;
  const c = getModelColors(displayName);
  const label = displayName.length > 22 ? displayName.slice(0, 20) + "…" : displayName;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {label}
    </span>
  );
}

function AppBadge({ app }: { app: string }) {
  const label = app.charAt(0).toUpperCase() + app.slice(1);
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary/70 text-muted-foreground border border-border">
      {label}
    </span>
  );
}

// All gradients anchored to NeuralHub's violet–purple brand palette
const APP_ACCENT_COLORS = [
  "from-violet-600 to-purple-700",
  "from-purple-600 to-fuchsia-700",
  "from-indigo-600 to-violet-700",
  "from-violet-500 to-indigo-600",
  "from-fuchsia-600 to-violet-700",
];

function getAppColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return APP_ACCENT_COLORS[Math.abs(hash) % APP_ACCENT_COLORS.length];
}

// ── Agent Form Dialog ─────────────────────────────────────────────────
function AgentFormDialog({ open, onClose, onSuccess, editAgent }: {
  open: boolean; onClose: () => void; onSuccess: () => void; editAgent?: Agent | null;
}) {
  const [saving, setSaving] = useState(false);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [availableModels, setAvailableModels] = useState<{ value: string, label: string }[]>([]);
  const [form, setForm] = useState<CreateAgentPayload>({
    name: "", appName: "", model: "", systemPrompt: "",
    description: "", guardrailsEnabled: true, piiMasking: false,
    topicWhitelist: "", topicBlacklist: "", knowledgeBaseId: undefined, embeddingModel: undefined,
  });

  const [modelRegistry, setModelRegistry] = useState<{
    platform: { value: string, label: string }[],
    user: { value: string, label: string }[],
    rawPlatform: any[],
    rawUser: any[]
  } | null>(null);

  useEffect(() => {
    if (open && editAgent) {
      // Find the database ID for the agent's current model string if necessary
      let initialModel = editAgent.model ?? "";
      if (modelRegistry) {
        if (isNaN(parseInt(initialModel))) {
          const allowedString = editAgent.allowedModels || "";
          const allowedList = allowedString ? allowedString.split(",") : [];
          
          const matchedUser = modelRegistry.rawUser.find(u => u.modelId === initialModel);
          const matchedPlat = modelRegistry.rawPlatform.find(p => p.modelId === initialModel);
          
          if (editAgent.managedByApp) {
            if (matchedUser && allowedList.includes(initialModel)) {
              initialModel = String(matchedUser.id);
            } else if (matchedPlat) {
              initialModel = String(matchedPlat.id);
            } else if (matchedUser) {
              initialModel = String(matchedUser.id);
            }
          } else {
            if (matchedUser) {
              initialModel = String(matchedUser.id);
            } else if (matchedPlat) {
              initialModel = String(matchedPlat.id);
            }
          }
        }
      }

      setForm({
        name: editAgent.name ?? "", appName: editAgent.app ?? "",
        model: initialModel,
        systemPrompt: editAgent.systemPrompt ?? "", description: editAgent.description ?? "",
        guardrailsEnabled: editAgent.guardrailsEnabled ?? true, piiMasking: editAgent.piiMasking ?? false,
        topicWhitelist: editAgent.topicWhitelist ?? "", topicBlacklist: editAgent.topicBlacklist ?? "",
        knowledgeBaseId: editAgent.knowledgeBaseId ?? undefined, embeddingModel: editAgent.embeddingModel ?? undefined,
      });
    } else if (open && !editAgent) {
      setForm({ name: "", appName: "", model: "", systemPrompt: "", description: "",
        guardrailsEnabled: true, piiMasking: false, topicWhitelist: "", topicBlacklist: "",
        knowledgeBaseId: undefined, embeddingModel: undefined });
    }
  }, [open, editAgent, modelRegistry]);

  useEffect(() => {
    if (open) {
      neuralApi.kb.list().then(setKbs).catch(() => {});
      neuralApi.models.list('chat').then(res => {
        setModelRegistry({
          platform: res.platform.map(m => ({ value: String(m.id), label: `${m.name} (${m.provider})` })),
          user: res.user.map(m => ({ value: String(m.id), label: `${m.name} (My BYOK)` })),
          rawPlatform: res.platform,
          rawUser: res.user
        });
      }).catch(() => {});
    } else {
      setModelRegistry(null);
    }
  }, [open]);

  useEffect(() => {
    if (!modelRegistry) return;

    const platform = modelRegistry.platform;
    const user = modelRegistry.user;
    const appName = editAgent?.managedByApp?.toLowerCase();
    
    let all: { value: string; label: string }[] = [];
    if (appName) {
      // ── Platform-managed agents (e.g. Auraflow) ──────────────────────────
      // STRICT ALLOWLIST — only two categories are ever shown:
      //
      //  1. The ONE platform model that is explicitly restricted to this app
      //     (visibility === 'platform-private' && restrictedToApp === appName)
      //
      //  2. BYOK models that the admin has approved for this specific agent
      //     (listed in editAgent.allowedModels comma-separated string)
      //
      // Everything else (public Gemini Flash, Llama 3, other users' BYOK, etc.)
      // is intentionally excluded regardless of what the registry returns.

      // Step 1: the dedicated platform model for this app
      const appPlatformModel = platform.find(m => {
        const raw = modelRegistry.rawPlatform.find(rp => String(rp.id) === m.value);
        return raw?.restrictedToApp?.toLowerCase() === appName;
      });
      if (appPlatformModel) all.push(appPlatformModel);

      // Step 2: approved BYOK models
      const allowedString = editAgent?.allowedModels || "";
      const allowedIds = allowedString ? allowedString.split(",").filter(Boolean) : [];

      // Also treat the agent's current active model as approved (safety net)
      if (editAgent?.model && !allowedIds.includes(editAgent.model)) {
        allowedIds.push(editAgent.model);
      }

      for (const allowedId of allowedIds) {
        // Match by DB id OR by modelId string — whichever was stored
        for (const m of user) {
          const raw = modelRegistry.rawUser.find(ru => String(ru.id) === m.value);
          if (raw && (String(raw.id) === allowedId || raw.modelId === allowedId)) {
            if (!all.some(x => x.value === m.value)) all.push(m);
          }
        }
        for (const m of platform) {
          if (all.some(x => x.value === m.value)) continue; // already added
          const raw = modelRegistry.rawPlatform.find(rp => String(rp.id) === m.value);
          if (raw && (String(raw.id) === allowedId || raw.modelId === allowedId)) {
            all.push(m);
          }
        }
      }
    } else {
      // User-owned agents — show all platform + all their own BYOK models
      all = [...platform, ...user];
    }

    setAvailableModels(all);

    const isValidModel = all.some(m => m.value === form.model);
    if (!isValidModel && all.length > 0) {
      // Default to the app-specific platform model, or the first available
      const appModel = appName
        ? all.find(m => {
            const raw = modelRegistry.rawPlatform.find(rp => String(rp.id) === m.value);
            return raw?.restrictedToApp?.toLowerCase() === appName;
          })
        : undefined;
      setForm(f => ({ ...f, model: (appModel ?? all[0]).value }));
    }
  }, [modelRegistry, form.appName, editAgent]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.appName) return;
    setSaving(true);
    try {
      const payload = { ...form, knowledgeBaseId: form.knowledgeBaseId ?? null, embeddingModel: form.embeddingModel ?? null };
      if (editAgent) { await neuralApi.agents.update(editAgent.id, payload as any); toast.success("Agent updated"); }
      else { await neuralApi.agents.create(payload as any); toast.success("Agent created"); }
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message || "Failed to save agent"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">{editAgent ? "Configure Agent" : "Deploy New Agent"}</h2>
              <p className="text-xs text-muted-foreground">Customize your AI agent's behavior and capabilities</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Identity */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Zap size={10} className="text-primary" /> Identity</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Agent Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="auraflow-support-bot" required
                  className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground font-mono" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">App Name *</label>
                <input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="auraflow" required
                  className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground font-mono" />
              </div>
            </div>
          </div>

          {/* Model — LOCKED for managed agents */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Brain size={10} className="text-primary" /> Intelligence</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">AI Model</label>
              <div className="relative">
                <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                  {availableModels.length === 0 && <option value="">Loading models...</option>}
                  {availableModels.length > 0 && !form.model && <option value="">Select a model...</option>}
                  {availableModels.map((m) => <option key={`${m.value}-${m.label}`} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {editAgent?.managedByApp && (
                <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle size={11} /> Managed by {editAgent.managedByApp}. Ensure your selected model is approved if using BYOK.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block mt-3">System Prompt</label>
              <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="You are a helpful AI assistant for [App]. Answer only questions about [topic]. Politely decline all other topics."
                rows={4} className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none font-mono leading-relaxed" />
            </div>
          </div>

          {/* RAG */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Database size={10} className="text-primary" /> Knowledge Base (RAG)</p>
            <div className="relative">
              <select value={form.knowledgeBaseId || ""} onChange={(e) => {
                const val = e.target.value;
                if (!val) { setForm(prev => ({ ...prev, knowledgeBaseId: undefined, embeddingModel: undefined })); }
                else {
                  const id = parseInt(val);
                  const kb = kbs.find(k => String(k.id) === String(id));
                  setForm(prev => ({ ...prev, knowledgeBaseId: id, embeddingModel: kb?.embeddingModel ?? prev.embeddingModel }));
                }
              }} className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer font-mono">
                <option value="">None — RAG Disabled</option>
                {kbs.map((kb) => <option key={kb.id} value={kb.id}>{kb.name} ({kb.docCount ?? 0} docs)</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {form.knowledgeBaseId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                <Database size={12} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">RAG Enabled — agent will retrieve from knowledge base</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of what this agent does" 
              className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
          </div>

          {/* Guardrails */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Shield size={10} className="text-primary" /> Guardrails</p>
            {[
              { key: "guardrailsEnabled", label: "Enable guardrails engine", sub: "Blocks off-topic, harmful, or policy-violating requests" },
              { key: "piiMasking", label: "PII Masking", sub: "Redacts emails, phone numbers, and IDs before sending to LLM" },
            ].map(({ key, label, sub }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-9 h-5 rounded-full mt-0.5 transition-colors relative shrink-0 ${(form as any)[key] ? "bg-primary" : "bg-secondary border border-border"}`}
                  onClick={() => setForm(prev => ({ ...prev, [key]: !(prev as any)[key] }))}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${(form as any)[key] ? "translate-x-4" : ""}`} />
                </div>
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="neural" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
              {editAgent ? "Save Changes" : "Deploy Agent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="relative overflow-hidden group hover:border-primary/30 transition-all">
      <CardContent className="p-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  // Map from raw model id/slug → friendly display name
  const [modelNameMap, setModelNameMap] = useState<Record<string, string>>({});
  const { confirm, ConfirmDialogNode } = useConfirm();

  const { data: agents, loading, error, refetch } = useNeuralFetch(() => neuralApi.agents.list(search, 'chat'), [search]);
  const { data: stats, refetch: refetchStats } = useNeuralFetch(() => neuralApi.agents.stats('chat'));

  // Build model id→actual-modelId lookup once
  // We show the underlying modelId (e.g. "gemini-2.5-flash") not the
  // wrapper name (e.g. "self" / "auraflow platform modal").
  useEffect(() => {
    neuralApi.models.list('chat').then(res => {
      const map: Record<string, string> = {};
      [...res.platform, ...res.user].forEach(m => {
        const display = m.modelId;       // actual underlying model slug
        map[String(m.id)] = display;     // DB id → modelId
        map[m.modelId]    = display;     // slug  → modelId (identity, kept for consistency)
      });
      setModelNameMap(map);
    }).catch(() => {});
  }, []);

  const handleDuplicate = async (agent: Agent) => {
    setDuplicatingId(agent.id);
    try {
      await neuralApi.agents.duplicate(agent.id);
      toast.success(`"${agent.name}" duplicated`);
      refetch(); refetchStats();
    } catch (err: any) { toast.error(err.message || "Failed to duplicate"); }
    finally { setDuplicatingId(null); }
  };

  const handleDelete = async (agent: Agent) => {
    const ok = await confirm({
      title: "Delete Agent",
      description: `Delete "${agent.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(agent.id);
    try {
      await neuralApi.agents.delete(agent.id);
      toast.success("Agent deleted");
      refetch(); refetchStats();
    } catch (err: any) { toast.error(err.message || "Failed to delete agent"); }
    finally { setDeletingId(null); }
  };

  const handleSuccess = () => { refetch(); refetchStats(); setEditAgent(null); };

  return (
    <div className="space-y-6 w-full">
      <AgentFormDialog open={dialogOpen || editAgent !== null}
        onClose={() => { setDialogOpen(false); setEditAgent(null); }}
        onSuccess={handleSuccess} editAgent={editAgent} />
      {ConfirmDialogNode}

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Deploy and manage autonomous AI agents for your SaaS applications.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={refetch} className="h-9">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setDialogOpen(true)} className="h-9 px-3 sm:px-4">
            <Plus size={13} className="sm:mr-1.5" /><span className="hidden sm:inline">Deploy Agent</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Agents" value={stats?.total ?? "—"} icon={<Bot size={18} className="text-primary" />} color="bg-primary/10" />
        <StatCard label="Active" value={stats?.active ?? "—"} icon={<Zap size={18} className="text-emerald-400" />} color="bg-emerald-500/10" />
        <StatCard label="Inactive" value={stats?.inactive ?? "—"} icon={<Users size={18} className="text-amber-400" />} color="bg-amber-500/10" />
        <StatCard label="Total Requests" value={stats ? stats.totalRequests.toLocaleString() : "—"} icon={<Brain size={18} className="text-violet-400" />} color="bg-violet-500/10" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>Could not connect to NeuralAPI on port 3006.</span>
          <Button variant="outline" size="sm" onClick={refetch} className="ml-auto text-xs">Retry</Button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-6 space-y-4 animate-pulse">
              <div className="flex gap-3"><div className="w-12 h-12 rounded-xl bg-secondary" /><div className="space-y-2 flex-1"><div className="h-4 w-36 bg-secondary rounded" /><div className="h-3 w-24 bg-secondary rounded" /></div></div>
              <div className="h-3 w-full bg-secondary rounded" /><div className="h-3 w-3/4 bg-secondary rounded" />
              <div className="flex gap-2">{[1,2,3].map(j => <div key={j} className="h-8 flex-1 bg-secondary rounded-lg" />)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agents Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(agents ?? []).length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-5 border border-dashed border-border rounded-2xl text-muted-foreground">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                <Bot size={36} className="text-primary/40" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground mb-1">No agents deployed yet</p>
                <p className="text-sm">Create your first AI agent to start serving customers</p>
              </div>
              <Button variant="neural" onClick={() => setDialogOpen(true)}>
                <Plus size={14} className="mr-2" /> Deploy First Agent
              </Button>
            </div>
          ) : (agents ?? []).map((agent) => {
            const isPlatform = Boolean(agent.managedByApp);
            const platformApp = agent.managedByApp
              ? (agent.managedByApp.charAt(0).toUpperCase() + agent.managedByApp.slice(1))
              : null;
            const initials = agent.name
              .split(/[\s\-_]+/)
              .map((w: string) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const appColor = getAppColor(agent.app || agent.name);

            return isPlatform ? (
              /* ── Platform-Managed Agent Card ─────────────────────────── */
              <div key={agent.id} className="group relative rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-500/[0.07] to-transparent overflow-hidden transition-all hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5">
                {/* Top accent stripe */}
                <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

                <div className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar with platform badge */}
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${appColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {initials || <Bot size={16} />}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-background flex items-center justify-center">
                          <Zap size={7} className="text-white" />
                        </div>
                      </div>
                      {/* Name & subtitle */}
                      <div className="min-w-0">
                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {agent.name}
                        </Link>
                        <p className="text-[11px] text-violet-400/80 font-medium mt-0.5">Platform · {platformApp}</p>
                      </div>
                    </div>
                    {/* Status + copy */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { navigator.clipboard.writeText(agent.id); toast.success(`ID copied`); }}
                        title="Copy Agent ID"
                        className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:border-violet-500/40 hover:bg-violet-500/10 transition-colors"
                      >
                        <Copy size={10} className="text-muted-foreground" />
                      </button>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        agent.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted/30 text-muted-foreground border-border'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Platform banner */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15">
                    <Zap size={12} className="text-primary shrink-0" />
                    <span className="text-[11px] text-primary/90 font-medium flex-1 leading-tight">
                      Managed by <span className="font-bold text-primary">{platformApp}</span>
                    </span>
                    <a
                      href={`${process.env.NEXT_PUBLIC_AURAFLOW_URL || 'http://localhost:3004'}/automations`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary transition-colors font-medium shrink-0"
                    >
                      Open <ExternalLink size={9} />
                    </a>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AppBadge app={agent.app} />
                    <ModelBadge model={agent.model} resolvedName={modelNameMap[agent.model]} />
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                    {agent.description || agent.systemPrompt?.slice(0, 90) || (
                      <span className="italic opacity-60">No description provided.</span>
                    )}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setEditAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/35 transition-all"
                    >
                      <Settings size={13} /> Configure
                    </button>
                    <Link
                      href={`/agents/${agent.id}/playground`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all"
                    >
                      <Play size={13} /> Playground
                    </Link>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="w-9 flex items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                      title="View Details"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

            ) : (
              /* ── User-Owned Agent Card ──────────────────────────────── */
              <div key={agent.id} className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className={`h-0.5 w-full bg-gradient-to-r ${appColor}`} />

                <div className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${appColor} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                        {initials || <Bot size={16} />}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-sm font-bold text-foreground leading-tight hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {agent.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">User agent · {agent.app}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { navigator.clipboard.writeText(agent.id); toast.success(`ID copied`); }}
                        title="Copy Agent ID"
                        className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <Copy size={10} className="text-muted-foreground" />
                      </button>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        agent.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted/30 text-muted-foreground border-border'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AppBadge app={agent.app} />
                    <ModelBadge model={agent.model} resolvedName={modelNameMap[agent.model]} />
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                    {agent.description || agent.systemPrompt?.slice(0, 90) || (
                      <span className="italic opacity-60">No description provided.</span>
                    )}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setEditAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/35 transition-all"
                    >
                      <Settings size={13} /> Configure
                    </button>
                    <Link
                      href={`/agents/${agent.id}/playground`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all"
                    >
                      <Play size={13} /> Playground
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="w-9 flex items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                          title="More Actions"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-popover border border-border">
                        <DropdownMenuItem asChild>
                          <Link href={`/agents/${agent.id}`} className="flex items-center gap-2 cursor-pointer w-full text-foreground hover:bg-secondary">
                            <ChevronRight size={14} /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(agent)}
                          disabled={duplicatingId === agent.id}
                          className="flex items-center gap-2 cursor-pointer w-full text-foreground hover:bg-secondary"
                        >
                          {duplicatingId === agent.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />} Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(agent)}
                          disabled={deletingId === agent.id}
                          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === agent.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
