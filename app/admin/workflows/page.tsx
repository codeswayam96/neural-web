"use client";

import { useEffect, useState } from "react";
import { neuralApi } from "@/lib/neural-api";
import { Workflow, RefreshCw, Loader2, Search, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try { setWorkflows(await neuralApi.admin.allWorkflows()); }
    catch { toast.error("Failed to load workflows"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.appName || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    archived: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">All Workflows</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{workflows.length} workflows across all users</p>
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
          <Loader2 className="animate-spin mr-2" size={20} /> Loading workflows…
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(wf => (
            <Card key={wf.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Workflow size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{wf.name}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{wf.appName}</Badge>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[wf.status] || "bg-secondary text-muted-foreground border-border"}`}>
                    {wf.status}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{wf.nodeCount} nodes</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  User #{wf.createdByUserId} · Created {new Date(wf.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link href={`/workflows/${wf.id}`} target="_blank">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                  <ExternalLink size={13} />
                </Button>
              </Link>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Workflow size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No workflows found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
