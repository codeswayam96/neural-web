"use client";

import { useEffect, useState } from "react";
import { neuralApi, CreateModelPayload } from "@/lib/neural-api";
import { Cpu, RefreshCw, Loader2, CheckCircle, XCircle, Key, Settings, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const inp = "w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all";

const PROVIDER_COLORS: Record<string, string> = {
  google: "text-blue-400", openai: "text-emerald-400", anthropic: "text-orange-400",
  groq: "text-orange-500", openrouter: "text-fuchsia-400", custom: "text-pink-400",
};

const PROVIDERS = ["google", "openai", "anthropic", "groq", "openrouter", "custom"];

function AddModelModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateModelPayload>({
    name: "", provider: "google", modelId: "", tier: "internal",
    supportsChat: true, supportsEmbedding: false, supportsImageGeneration: false,
    contextWindow: 8192, pointsPerRequest: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.modelId) return;
    setSaving(true);
    try {
      await neuralApi.models.createPlatform(form);
      toast.success("Platform model created");
      onSuccess();
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Cpu size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Add Platform Model</h2>
              <p className="text-[11px] text-muted-foreground">Register a new model in the platform registry</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Display Name *</label>
              <input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Gemini 2.0 Flash" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Provider *</label>
              <select className={inp} value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Model ID *</label>
              <input className={`${inp} font-mono text-xs`} value={form.modelId} onChange={e => setForm({ ...form, modelId: e.target.value })} placeholder="gemini-2.0-flash" required />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Tier</label>
              <select className={inp} value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as any })}>
                <option value="free">Free</option>
                <option value="points">Points</option>
                <option value="premium">Premium</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Context Window</label>
              <input className={inp} type="number" value={form.contextWindow} onChange={e => setForm({ ...form, contextWindow: +e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Points / Request</label>
              <input className={inp} type="number" value={form.pointsPerRequest} onChange={e => setForm({ ...form, pointsPerRequest: +e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">Capabilities</label>
            <div className="flex gap-3">
              {(["supportsChat", "supportsEmbedding", "supportsImageGeneration"] as const).map(cap => (
                <label key={cap} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={!!form[cap]} onChange={e => setForm({ ...form, [cap]: e.target.checked })} className="accent-primary" />
                  {cap === "supportsChat" ? "Chat" : cap === "supportsEmbedding" ? "Embedding" : "Image Gen"}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="neural" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Plus size={13} className="mr-1.5" />} Add Model
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [keyPanelId, setKeyPanelId] = useState<number | null>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({ apiKey: "", label: "", weight: 1 });
  const [addingKey, setAddingKey] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setModels(await neuralApi.admin.allModels()); }
    catch { toast.error("Failed to load models"); }
    finally { setLoading(false); }
  };

  const loadKeys = async (modelId: number) => {
    try { setKeys(await neuralApi.models.listKeys(modelId)); }
    catch { setKeys([]); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (model: any) => {
    const newStatus = model.status === "active" ? "inactive" : "active";
    try { await neuralApi.admin.toggleModelStatus(model.id, newStatus); toast.success(`Model ${newStatus}`); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try { await neuralApi.models.update(editId, editForm); toast.success("Model updated"); setEditId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleAddKey = async (modelId: number) => {
    if (!newKey.apiKey) return;
    setAddingKey(true);
    try {
      await neuralApi.models.addKey(modelId, newKey);
      toast.success("Key added to pool");
      setNewKey({ apiKey: "", label: "", weight: 1 });
      loadKeys(modelId);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setAddingKey(false); }
  };

  const handleToggleKey = async (keyId: number, currentStatus: string, modelId: number) => {
    const newStatus = currentStatus === "active" ? "revoked" : "active";
    try { await neuralApi.models.updateKeyStatus(keyId, newStatus as any); loadKeys(modelId); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {addOpen && <AddModelModal onClose={() => setAddOpen(false)} onSuccess={load} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Platform Models</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{models.length} platform-managed models</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={13} className="mr-1.5" /> Add Model
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading models…
        </div>
      ) : (
        <div className="space-y-3">
          {models.map(model => (
            <Card key={model.id} className="p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Cpu size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{model.name}</span>
                    <span className={`text-[10px] font-mono uppercase ${PROVIDER_COLORS[model.provider] || "text-muted-foreground"}`}>{model.provider}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{model.modelId}</Badge>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${model.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                      {model.status}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{model.tier}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    {model.supportsChat && <span>💬 Chat</span>}
                    {model.supportsEmbedding && <span>🔢 Embedding</span>}
                    {model.supportsImageGeneration && <span>🖼 Image</span>}
                    <span>· {model.requestsToday} req today · {model.keysCount ?? 0} keys pooled</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditId(editId === model.id ? null : model.id); setEditForm({ name: model.name, tier: model.tier, pointsPerRequest: model.pointsPerRequest, monthlyTokenLimitPerUser: model.monthlyTokenLimitPerUser }); }}>
                    <Settings size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-400"
                    onClick={() => { const next = keyPanelId === model.id ? null : model.id; setKeyPanelId(next); if (next) loadKeys(model.id); }}>
                    <Key size={13} />
                  </Button>
                  <Button variant="ghost" size="sm"
                    className={`h-8 w-8 p-0 ${model.status === "active" ? "text-muted-foreground hover:text-amber-400" : "text-emerald-400 hover:text-emerald-300"}`}
                    onClick={() => handleToggle(model)}>
                    {model.status === "active" ? <XCircle size={13} /> : <CheckCircle size={13} />}
                  </Button>
                </div>
              </div>

              {/* Edit form */}
              {editId === model.id && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Display Name</label>
                      <input className={inp} value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Tier</label>
                      <select className={inp} value={editForm.tier || "free"} onChange={e => setEditForm({ ...editForm, tier: e.target.value })}>
                        <option value="free">Free</option>
                        <option value="points">Points</option>
                        <option value="premium">Premium</option>
                        <option value="internal">Internal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Points / Request</label>
                      <input className={inp} type="number" value={editForm.pointsPerRequest ?? 0} onChange={e => setEditForm({ ...editForm, pointsPerRequest: +e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="neural" onClick={handleSaveEdit} disabled={saving}>
                      {saving && <Loader2 size={13} className="animate-spin mr-1" />} Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Key pool panel */}
              {keyPanelId === model.id && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Key size={11} /> API Key Pool ({keys.length} keys)
                  </p>
                  <div className="flex gap-2">
                    <input className={`${inp} flex-1 font-mono text-xs`} type="password" placeholder="sk-… new key" value={newKey.apiKey} onChange={e => setNewKey({ ...newKey, apiKey: e.target.value })} />
                    <input className={`${inp} w-32`} placeholder="Label" value={newKey.label} onChange={e => setNewKey({ ...newKey, label: e.target.value })} />
                    <input className={`${inp} w-20`} type="number" placeholder="Weight" value={newKey.weight} onChange={e => setNewKey({ ...newKey, weight: +e.target.value })} />
                    <Button size="sm" variant="neural" onClick={() => handleAddKey(model.id)} disabled={addingKey || !newKey.apiKey}>
                      {addingKey ? <Loader2 size={13} className="animate-spin" /> : "Add"}
                    </Button>
                  </div>
                  {keys.length > 0 && (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary/50 border-b border-border">
                          <tr>
                            <th className="text-left p-2.5 font-semibold text-muted-foreground">Key Preview</th>
                            <th className="text-left p-2.5 font-semibold text-muted-foreground">Label</th>
                            <th className="text-center p-2.5 font-semibold text-muted-foreground">Usage</th>
                            <th className="text-center p-2.5 font-semibold text-muted-foreground">Status</th>
                            <th className="text-right p-2.5 font-semibold text-muted-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {keys.map((k: any) => (
                            <tr key={k.id} className="hover:bg-secondary/20">
                              <td className="p-2.5 font-mono text-[11px]">{k.keyPreview}</td>
                              <td className="p-2.5 text-muted-foreground">{k.label || `Key #${k.id}`}</td>
                              <td className="p-2.5 text-center">{k.usageToday} today / {k.usageCount} total</td>
                              <td className="p-2.5 text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${k.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                  {k.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 ${k.status === "active" ? "text-muted-foreground hover:text-red-400" : "text-emerald-400 hover:text-emerald-300"}`}
                                  onClick={() => handleToggleKey(k.id, k.status, model.id)}>
                                  {k.status === "active" ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
          {models.length === 0 && (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Cpu size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No platform models configured</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
