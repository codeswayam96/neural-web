"use client";

import { useState, useEffect } from "react";
import {
  Bot, Plus, Play, Settings, Search, RefreshCw, AlertCircle,
  Trash2, X, Check, Loader2, ChevronDown, Brain, Database, Shield, Zap, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi, Agent, CreateAgentPayload, KnowledgeBase } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import Link from "next/link";
import { toast } from "sonner";

const MODEL_COLORS: Record<string, string> = {
  gemini: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  gpt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  claude: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  llama: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  deepseek: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

function getModelColor(model: string) {
  const key = Object.keys(MODEL_COLORS).find(k => model.toLowerCase().includes(k));
  return key ? MODEL_COLORS[key] : "bg-muted/30 text-muted-foreground border-border";
}

const APP_ACCENT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
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
    name: "", appName: "", model: "gemini-2.0-flash", systemPrompt: "",
    description: "", guardrailsEnabled: true, piiMasking: false,
    topicWhitelist: "", topicBlacklist: "", knowledgeBaseId: undefined, embeddingModel: undefined,
  });

  useEffect(() => {
    if (open && editAgent) {
      setForm({
        name: editAgent.name ?? "", appName: editAgent.app ?? "",
        model: editAgent.model ?? "gemini-2.0-flash",
        systemPrompt: editAgent.systemPrompt ?? "", description: editAgent.description ?? "",
        guardrailsEnabled: editAgent.guardrailsEnabled ?? true, piiMasking: editAgent.piiMasking ?? false,
        topicWhitelist: editAgent.topicWhitelist ?? "", topicBlacklist: editAgent.topicBlacklist ?? "",
        knowledgeBaseId: editAgent.knowledgeBaseId ?? undefined, embeddingModel: editAgent.embeddingModel ?? undefined,
      });
    } else if (open && !editAgent) {
      setForm({ name: "", appName: "", model: "gemini-2.0-flash", systemPrompt: "", description: "",
        guardrailsEnabled: true, piiMasking: false, topicWhitelist: "", topicBlacklist: "",
        knowledgeBaseId: undefined, embeddingModel: undefined });
    }
  }, [open, editAgent]);

  useEffect(() => {
    if (open) {
      neuralApi.kb.list().then(setKbs).catch(() => {});
      neuralApi.models.list('chat').then(res => {
        const all = [
          ...res.platform.map(m => ({ value: m.modelId, label: `${m.name} (${m.provider})` })),
          ...res.user.map(m => ({ value: m.modelId, label: `${m.name} (My BYOK)` })),
        ];
        setAvailableModels(all);
      }).catch(() => {});
    }
  }, [open]);

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
            <div className="grid grid-cols-2 gap-3">
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

          {/* Model */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Brain size={10} className="text-primary" /> Intelligence</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">AI Model</label>
              <div className="relative">
                <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer">
                  {availableModels.length === 0 && <option value="">Loading models...</option>}
                  {availableModels.map((m) => <option key={`${m.value}-${m.label}`} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
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

  const { data: agents, loading, error, refetch } = useNeuralFetch(() => neuralApi.agents.list(search, 'chat'), [search]);
  const { data: stats, refetch: refetchStats } = useNeuralFetch(() => neuralApi.agents.stats());

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
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
    <div className="space-y-6 max-w-6xl">
      <AgentFormDialog open={dialogOpen || editAgent !== null}
        onClose={() => { setDialogOpen(false); setEditAgent(null); }}
        onSuccess={handleSuccess} editAgent={editAgent} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deploy and manage autonomous AI agents for your SaaS applications.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="h-9">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setDialogOpen(true)} className="h-9 px-4">
            <Plus size={13} className="mr-1.5" /> Deploy Agent
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents ?? []).length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-24 gap-5 border border-dashed border-border rounded-2xl text-muted-foreground">
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
          ) : (agents ?? []).map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-primary" />
                  <CardTitle className="text-base font-bold">{agent.name}</CardTitle>
                </div>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                  {agent.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-secondary/50">
                      {agent.app}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {agent.model}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {agent.description || "No description provided."}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditAgent(agent)}>
                      <Settings size={14} className="mr-2" /> Configure
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/agents/${agent.id}/playground`}>
                        <Play size={14} className="mr-2" /> Playground
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="px-3 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(agent)} disabled={deletingId === agent.id}>
                      {deletingId === agent.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
