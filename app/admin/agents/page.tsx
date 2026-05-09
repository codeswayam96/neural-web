"use client";

import { useEffect, useState } from "react";
import { neuralApi } from "@/lib/neural-api";
import { Bot, RefreshCw, Trash2, Settings, Loader2, Search, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

const inp = "w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmDialogNode } = useConfirm();

  const load = async () => {
    setLoading(true);
    try { setAgents(await neuralApi.admin.allAgents()); }
    catch { toast.error("Failed to load agents"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: "Delete Agent", description: `Delete "${name}"? Cannot be undone.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try { await neuralApi.admin.deleteAgent(id); toast.success("Agent deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleToggleStatus = async (agent: any) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    try { await neuralApi.admin.updateAgent(agent.id, { status: newStatus }); toast.success(`Agent ${newStatus}`); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try { await neuralApi.admin.updateAgent(editId, editForm); toast.success("Agent updated"); setEditId(null); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.appName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl">
      {ConfirmDialogNode}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">All Agents</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{agents.length} agents across all users</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or app…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading agents…
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(agent => (
            <Card key={agent.id} className="p-4">
              {editId === agent.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Name</label>
                      <input className={inp} value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Model</label>
                      <input className={inp} value={editForm.model || ""} onChange={e => setEditForm({ ...editForm, model: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">System Prompt</label>
                    <textarea className={`${inp} min-h-[100px] resize-none font-mono text-xs`}
                      value={editForm.systemPrompt || ""} onChange={e => setEditForm({ ...editForm, systemPrompt: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Description</label>
                    <input className={inp} value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="neural" onClick={handleSaveEdit} disabled={saving}>
                      {saving && <Loader2 size={13} className="animate-spin mr-1" />} Save Changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{agent.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{agent.appName}</Badge>
                      <Badge variant="outline" className="text-[9px]">{agent.model}</Badge>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${agent.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-xl">
                      {agent.description || agent.systemPrompt?.slice(0, 100) || "No description"}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                      {agent.guardrailsEnabled ? "🛡 Guardrails ON" : "⚠ Guardrails OFF"} · {agent.totalRequests} requests · User #{agent.createdByUserId}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => { setEditId(agent.id); setEditForm({ name: agent.name, model: agent.model, systemPrompt: agent.systemPrompt, description: agent.description }); }}>
                      <Settings size={13} />
                    </Button>
                    <Button variant="ghost" size="sm"
                      className={`h-8 w-8 p-0 ${agent.status === "active" ? "text-muted-foreground hover:text-amber-400" : "text-emerald-400 hover:text-emerald-300"}`}
                      onClick={() => handleToggleStatus(agent)} title={agent.status === "active" ? "Deactivate" : "Activate"}>
                      {agent.status === "active" ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(agent.id, agent.name)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Bot size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No agents found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
