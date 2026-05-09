"use client";

import { useEffect, useState } from "react";
import { neuralApi } from "@/lib/neural-api";
import { Globe, RefreshCw, Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

const inp = "bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all";

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [newApp, setNewApp] = useState("");
  const [adding, setAdding] = useState(false);
  const { confirm, ConfirmDialogNode } = useConfirm();

  const load = async () => {
    setLoading(true);
    try { setDomains(await neuralApi.admin.domains()); }
    catch { toast.error("Failed to load domains"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      await neuralApi.admin.addDomain(newDomain.trim(), newApp.trim() || undefined);
      toast.success("Domain added");
      setNewDomain(""); setNewApp("");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try { await neuralApi.admin.toggleDomain(id, !isActive); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: number, domain: string) => {
    const ok = await confirm({ title: "Remove Domain", description: `Remove "${domain}" from trusted domains?`, confirmLabel: "Remove", destructive: true });
    if (!ok) return;
    try { await neuralApi.admin.deleteDomain(id); toast.success("Domain removed"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {ConfirmDialogNode}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trusted Domains</h2>
          <p className="text-sm text-muted-foreground mt-0.5">CORS whitelist — only these origins can call the NeuralAPI</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Add form */}
      <Card className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Add New Domain</p>
        <div className="flex gap-2">
          <input
            className={`${inp} flex-1`}
            placeholder="e.g. auraflow.com or localhost:3008"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <input
            className={`${inp} w-40`}
            placeholder="App name (opt)"
            value={newApp}
            onChange={e => setNewApp(e.target.value)}
          />
          <Button variant="neural" size="sm" onClick={handleAdd} disabled={adding || !newDomain.trim()}>
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Add
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Supports exact domains and localhost ports. Subdomains are allowed by default.
        </p>
      </Card>

      {/* Domain list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {domains.map(d => (
            <Card key={d.id} className="p-3 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.isActive ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-secondary border border-border"}`}>
                <Globe size={14} className={d.isActive ? "text-emerald-400" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{d.domain}</span>
                  {d.appName && <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{d.appName}</span>}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${d.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                    {d.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Added {new Date(d.createdAt).toLocaleDateString()} · {d.allowSubdomains ? "Subdomains allowed" : "Exact match only"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${d.isActive ? "text-muted-foreground hover:text-amber-400" : "text-emerald-400 hover:text-emerald-300"}`}
                  onClick={() => handleToggle(d.id, d.isActive)} title={d.isActive ? "Disable" : "Enable"}>
                  {d.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                  onClick={() => handleDelete(d.id, d.domain)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
          {domains.length === 0 && (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Globe size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No trusted domains configured</p>
              <p className="text-xs mt-1">All cross-origin requests will be blocked until you add domains here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
