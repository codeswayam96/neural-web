"use client";

import { useState, useEffect } from "react";
import {
  ImageIcon, Sparkles, Download, RefreshCw, Loader2, AlertCircle,
  Plus, Settings, Trash2, X, Check, Bot, Search, ChevronDown, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { neuralApi, Agent, CreateAgentPayload, ImageGenerationResult, ModelProvider } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import { toast } from "sonner";

// ── Image Agent Form Dialog ──────────────────────────────────────────
function ImageAgentFormDialog({
  open,
  onClose,
  onSuccess,
  editAgent,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAgent?: Agent | null;
}) {
  const [saving, setSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ value: string, label: string }[]>([]);
  const [form, setForm] = useState<CreateAgentPayload>({
    name: editAgent?.name ?? "",
    appName: editAgent?.app ?? "",
    model: editAgent?.model ?? "",
    systemPrompt: editAgent?.systemPrompt ?? "",
    negativePrompt: editAgent?.negativePrompt ?? "",
    description: editAgent?.description ?? "",
    type: 'image',
  });

  useEffect(() => {
    if (open && editAgent) {
      setForm({
        name: editAgent.name ?? "",
        appName: editAgent.app ?? "",
        model: editAgent.model ?? "",
        systemPrompt: editAgent.systemPrompt ?? "",
        negativePrompt: editAgent.negativePrompt ?? "",
        description: editAgent.description ?? "",
        type: 'image',
      });
    } else if (open && !editAgent) {
      setForm({
        name: "",
        appName: "playground",
        model: "",
        systemPrompt: "",
        negativePrompt: "",
        description: "",
        type: 'image',
      });
    }
  }, [open, editAgent]);

  useEffect(() => {
    if (open) {
      neuralApi.models.list('image').then(res => {
        const platform = res.platform.map(m => ({ value: m.modelId, label: `${m.name} (${m.provider})` }));
        const user = res.user.map(m => ({ value: m.modelId, label: `${m.name} (My BYOK)` }));
        const all = [...platform, ...user];
        setAvailableModels(all);
        if (all.length > 0 && !form.model) {
          setForm(f => ({ ...f, model: all[0].value }));
        }
      }).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.appName || !form.model) return;
    setSaving(true);
    try {
      if (editAgent) {
        await neuralApi.agents.update(editAgent.id, form);
        toast.success("Image Agent updated");
      } else {
        await neuralApi.agents.create(form);
        toast.success("Image Agent created");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl glass-strong rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <ImageIcon size={14} className="text-primary" />
            </div>
            <h2 className="font-semibold text-sm">
              {editAgent ? "Configure Image Agent" : "Create Image Generation Agent"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Agent Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="youtube-thumbnail-creator"
                required
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">App Name *</label>
              <input
                value={form.appName}
                onChange={(e) => setForm({ ...form, appName: e.target.value })}
                placeholder="playground"
                required
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Image Model *</label>
            <div className="relative">
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                {availableModels.length === 0 && <option value="">No image models available...</option>}
                {availableModels.map((m) => (
                  <option key={`${m.value}-${m.label}`} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Style / System Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder="Example: Create high-contrast, vibrant YouTube thumbnails with bold text and a tech-focused aesthetic. Use cinematic lighting and shallow depth of field."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              This prompt defines the visual style and instructions for the agent.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Negative Prompt (Agents Only)</label>
            <textarea
              value={form.negativePrompt}
              onChange={(e) => setForm({ ...form, negativePrompt: e.target.value })}
              placeholder="Elements to avoid: blurry, low resolution, distorted faces, messy text..."
              rows={2}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="AI specialized in creating YouTube thumbnails"
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="neural" size="sm" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editAgent ? "Save Changes" : "Create Image Agent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Image Playground Component ───────────────────────────────────────
function ImagePlayground({ 
  agent, 
  onBack 
}: { 
  agent: Agent; 
  onBack: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [history, setHistory] = useState<Array<ImageGenerationResult>>([]);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await neuralApi.gateway.generateImage(
        prompt.trim(),
        undefined, // Negative prompt comes from agent config on backend
        undefined, // Model comes from agent config on backend
        agent.id
      );
      setResult(res);
      if (res.imageUrl || res.imageBase64) {
        setHistory(h => [res, ...h.slice(0, 9)]);
        toast.success("Generated successfully!");
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = (res: ImageGenerationResult) => {
    const link = document.createElement("a");
    link.href = res.imageUrl || `data:${res.mimeType};base64,${res.imageBase64}`;
    link.download = `neuralhub-gen-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <X size={16} />
          </Button>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> {agent.name}
            </h3>
            <p className="text-xs text-muted-foreground">{agent.description || "Image Agent Playground"}</p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {agent.model}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="glass rounded-xl border border-border p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Style Context</Label>
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground italic leading-relaxed">
                {agent.systemPrompt || "No specific style defined."}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Image Subject / Prompt</Label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter what you want to generate. The agent's style will be applied automatically."
                rows={4}
                className="w-full px-4 py-3 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none leading-relaxed transition-all"
              />
            </div>

            <Button
              variant="neural"
              className="w-full h-11"
              onClick={generate}
              disabled={!prompt.trim() || generating}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Creating Magic...</>
              ) : (
                <><Sparkles size={16} className="mr-2" /> Generate with {agent.name}</>
              )}
            </Button>
          </div>

          {/* Mini History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent for this session</h4>
              <div className="grid grid-cols-5 gap-2">
                {history.map((h, i) => (
                  <div 
                    key={i} 
                    className="aspect-square rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setResult(h)}
                  >
                    <img src={h.imageUrl || `data:${h.mimeType};base64,${h.imageBase64}`} className="w-full h-full object-cover" alt="Gen" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="relative aspect-square glass rounded-xl border border-border overflow-hidden flex items-center justify-center bg-black/20">
          {generating ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Neural Engines Working...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full flex flex-col">
               <img 
                src={result.imageUrl || `data:${result.mimeType};base64,${result.imageBase64}`} 
                className="w-full h-full object-contain" 
                alt="Result" 
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button variant="secondary" size="sm" className="glass-strong" onClick={() => downloadImage(result)}>
                  <Download size={14} className="mr-2" /> Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-30">
              <ImageIcon size={64} />
              <p className="text-sm">Your creation will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function ImageGenerationPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: agents, loading, error, refetch } = useNeuralFetch(
    () => neuralApi.agents.list(search, 'image'),
    [search]
  );

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete image agent "${agent.name}"?`)) return;
    setDeletingId(agent.id);
    try {
      await neuralApi.agents.delete(agent.id);
      toast.success("Agent removed");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedAgent) {
    return (
      <div className="max-w-6xl mx-auto py-4">
        <ImagePlayground agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ImageAgentFormDialog
        open={dialogOpen || editAgent !== null}
        onClose={() => { setDialogOpen(false); setEditAgent(null); }}
        onSuccess={refetch}
        editAgent={editAgent}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" /> Image Agents
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create specialized agents for YouTube thumbnails, character design, or brand assets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={13} /> New Image Agent
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your image specialists..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl border border-border bg-muted/20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents ?? []).length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4 border border-dashed border-border rounded-2xl text-muted-foreground bg-muted/5">
              <Sparkles size={40} className="opacity-20" />
              <div className="text-center">
                <p className="font-medium text-sm">No specialized image agents yet</p>
                <p className="text-xs opacity-70">Create an agent with a specific style to get started</p>
              </div>
              <Button variant="neural" size="sm" onClick={() => setDialogOpen(true)}>
                <Plus size={13} /> Create First Agent
              </Button>
            </div>
          ) : (
            (agents ?? []).map((agent) => (
              <Card key={agent.id} glow className="group flex flex-col">
                <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-inner">
                      <Sparkles size={18} className="text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold tracking-tight">{agent.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-70">{agent.model}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                    {agent.app}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed italic">
                    &quot;{agent.description || "No description provided."}&quot;
                  </p>
                  
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button 
                      variant="neural" 
                      size="sm" 
                      className="flex-1 text-xs h-9"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <Play size={12} className="mr-2" /> Launch
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-9 h-9 p-0"
                      onClick={() => setEditAgent(agent)}
                    >
                      <Settings size={12} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-9 h-9 p-0 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                      onClick={() => handleDelete(agent)}
                      disabled={deletingId === agent.id}
                    >
                      {deletingId === agent.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
