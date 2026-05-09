"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Search, Plus, Upload, MoreVertical, 
  FileText, Database, Loader2, Trash2, X, Check, AlertCircle, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { neuralApi, KnowledgeBase } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import Link from "next/link";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Create KB Dialog ──────────────────────────────────────────────────
function CreateKBDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModelId, setEmbeddingModelId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [embeddingModels, setEmbeddingModels] = useState<{ id: number; name: string; modelId: string; provider: string; embeddingDimension?: number }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingModels(true);
      neuralApi.models.list('embedding').then(res => {
        const all = [...res.platform, ...res.user].filter(m => m.supportsEmbedding);
        setEmbeddingModels(all.map(m => ({
          id: m.id,
          name: m.name,
          modelId: m.modelId,
          provider: m.provider,
          embeddingDimension: (m as any).embeddingDimension,
        })));
        // Auto-select first model
        if (all.length > 0 && !embeddingModelId) {
          setEmbeddingModelId(all[0].id);
        }
      }).catch(() => {}).finally(() => setLoadingModels(false));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      await neuralApi.kb.create({ name, description, embeddingModelId: embeddingModelId ?? undefined });
      toast.success("Knowledge Base created successfully");
      onSuccess();
      onClose();
      setName("");
      setDescription("");
      setEmbeddingModelId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to create knowledge base");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const selectedModel = embeddingModels.find(m => m.id === embeddingModelId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <h2 className="font-semibold text-sm">New Knowledge Base</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Documentation"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of information does this store?"
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Embedding Model — Dynamic from registry */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">
              Embedding Model
            </label>
            {loadingModels ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 size={12} className="animate-spin" /> Loading models from registry...
              </div>
            ) : embeddingModels.length === 0 ? (
              <div className="text-xs text-red-400 py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
                No embedding models found. Add a model with embedding support in the Models section first.
              </div>
            ) : (
              <select
                value={embeddingModelId ?? ""}
                onChange={(e) => setEmbeddingModelId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
                required
              >
                <option value="">Select an embedding model...</option>
                {embeddingModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.provider} {m.embeddingDimension ? `(${m.embeddingDimension}-dim)` : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="text-[10px] text-muted-foreground px-1 italic">
                ⚠️ This cannot be changed after documents are indexed. All documents will use{" "}
                <span className="text-primary font-mono">{selectedModel.modelId}</span>.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="neural"
              className="flex-1 text-xs"
              disabled={creating || embeddingModels.length === 0 || !embeddingModelId}
            >
              {creating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
              Create KB
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Edit KB Dialog ───────────────────────────────────────────────────
function EditKBDialog({
  kb,
  onClose,
  onSuccess,
}: {
  kb: KnowledgeBase | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(kb?.name ?? "");
  const [description, setDescription] = useState(kb?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (kb) { 
      setName(kb.name); 
      setDescription(kb.description ?? ""); 
    }
  }, [kb]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kb || !name.trim()) return;
    setSaving(true);
    try {
      await neuralApi.kb.update(kb.id, { name, description });
      toast.success("Knowledge base updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update knowledge base");
    } finally {
      setSaving(false);
    }
  };

  if (!kb) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-primary" />
            <h2 className="font-semibold text-sm">Edit Knowledge Base</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Embedding Model</label>
            <div className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center justify-between">
              <span className="font-mono">{kb.embeddingModelName || kb.embeddingModel || 'text-embedding-004'}</span>
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                {kb.embeddingProviderSlug || 'google'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground px-1 italic mt-1">
              Embedding model cannot be changed after creation.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="neural" className="flex-1 text-xs" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function KnowledgeBasePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editKb, setEditKb] = useState<KnowledgeBase | null>(null);
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { data: kbs, loading, error, refetch } = useNeuralFetch(() => neuralApi.kb.list());

  const handleDeleteKB = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete Knowledge Base",
      description: `Delete "${name}"? All indexed documents will be permanently lost.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    try {
      await neuralApi.kb.delete(id);
      toast.success("Knowledge base deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <CreateKBDialog 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onSuccess={refetch} 
      />
      <EditKBDialog
        kb={editKb}
        onClose={() => setEditKb(null)}
        onSuccess={refetch}
      />
      {ConfirmDialogNode}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Knowledge Bases
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage vector embeddings and document ingestion for RAG
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Database size={14} className="mr-2" />
            External Sync
          </Button>
          <Button variant="neural" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-2" />
            New Knowledge Base
          </Button>
        </div>
      </div>

      {/* Advanced Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-border/60 backdrop-blur-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Search knowledge bases..."
            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="text-[10px] h-8 font-semibold uppercase tracking-wider">
            All Sources
          </Button>
          <Button variant="outline" size="sm" className="text-[10px] h-8 font-semibold uppercase tracking-wider">
            Recently Indexed
          </Button>
          <div className="h-4 w-px bg-border mx-1 hidden md:block" />
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-3 border border-red-500/20 bg-red-500/5 rounded-2xl">
          <AlertCircle size={32} />
          <p className="text-sm font-medium">Failed to connect to NeuralAPI</p>
          <Button variant="outline" size="sm" onClick={refetch}>Retry Connection</Button>
        </div>
      ) : kbs?.length === 0 ? (
        <Card className="border-dashed bg-transparent mt-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Upload size={24} className="text-primary/40" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground/80">No Knowledge Bases Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Start by creating a knowledge base to index your documentation, manuals, or company wikis for AI context.
            </p>
            <Button variant="neural" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> Create First KB
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kbs?.map((kb) => (
            <Link key={kb.id} href={`/knowledge-base/${kb.id}`}>
              <Card className="hover:border-primary/40 transition-all group cursor-pointer h-full relative overflow-hidden bg-card/40 backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditKb(kb); }}
                    className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteKB(kb.id, kb.name, e)}
                    className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BookOpen size={14} className="text-primary" />
                    </div>
                    <CardTitle className="text-sm font-bold truncate pr-6">{kb.name}</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] font-mono opacity-50">ID: {kb.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-6 h-8 italic">
                    {kb.description || "No description provided."}
                  </p>
                  
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                      <FileText size={12} className="text-primary/70" />
                      {kb.docCount || 0} Docs Indexed
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                      RAG Ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
