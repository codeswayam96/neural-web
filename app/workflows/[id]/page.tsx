"use client";
import React, { useState, useEffect } from "react";
import { Play, Settings, Activity, ChevronLeft, ChevronRight, Plus, Save, Layout, Clock, CheckCircle2, AlertCircle, Loader2, Globe, Copy, RefreshCw, Trash2, X, Zap, Cpu, Code, Share2, Layers, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { neuralApi, Workflow, WorkflowExecution, Agent } from "@/lib/neural-api";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";
import { NodePickerModal } from "./node-picker-modal";
import { NodeConfigPanel } from "./node-config-panel";

function getNodeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    trigger: <Zap size={20} className="text-amber-500" />,
    agent: <Cpu size={20} className="text-blue-500" />,
    transform: <RefreshCw size={20} className="text-emerald-500" />,
    logic: <Code size={20} className="text-purple-500" />,
    http: <Share2 size={20} className="text-pink-500" />,
  };
  return icons[type] || <Layers size={20} className="text-primary" />;
}

const NODE_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  trigger:   { border: "border-amber-500/20",   bg: "bg-amber-500/10",   text: "text-amber-600",   badge: "bg-amber-100 text-amber-600 border border-amber-200" },
  agent:     { border: "border-blue-500/20",     bg: "bg-blue-500/10",    text: "text-blue-600",    badge: "bg-blue-100 text-blue-600 border border-blue-200" },
  transform: { border: "border-emerald-500/20",  bg: "bg-emerald-500/10", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-600 border border-emerald-200" },
  logic:     { border: "border-purple-500/20",   bg: "bg-purple-500/10",  text: "text-purple-600",  badge: "bg-purple-100 text-purple-600 border border-purple-200" },
  http:      { border: "border-pink-500/20",     bg: "bg-pink-500/10",    text: "text-pink-600",    badge: "bg-pink-100 text-pink-600 border border-pink-200" },
};

const RECIPES = [
  { icon: "🤖", title: "AI Analyzer", desc: "Receive data → analyze with AI", nodes: [{ type: "trigger", name: "Receive Data", config: { path: "analyze" } }, { type: "agent", name: "AI Analyzer", config: {} }] },
  { icon: "📡", title: "API Router", desc: "Receive data → send to another app", nodes: [{ type: "trigger", name: "Receive Data", config: { path: "route" } }, { type: "http", name: "Send to App", config: { method: "POST" } }] },
  { icon: "🧠", title: "Smart Decision", desc: "AI analysis → conditional routing", nodes: [{ type: "trigger", name: "Receive Data", config: { path: "decide" } }, { type: "agent", name: "AI Step", config: {} }, { type: "logic", name: "Decision", config: {} }] },
  { icon: "✨", title: "Start blank", desc: "Build your own from scratch", nodes: [] },
];

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [hasPlatformModel, setHasPlatformModel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "history" | "settings">("builder");
  const [localNodes, setLocalNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | undefined>(undefined);
  const [showRecipes, setShowRecipes] = useState(false);

  const selectedNode = localNodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    Promise.all([loadWorkflow(), loadExecutions(), loadAgents(), checkPlatformModel()]);
    socket.on("neural-request", (ev: any) => {
      if (ev.type === "workflow" && ev.workflowId === Number(id)) {
        if (ev.event === "node_started") setNodeStatuses(p => ({ ...p, [ev.nodeId]: "running" }));
        if (ev.event === "node_completed") setNodeStatuses(p => ({ ...p, [ev.nodeId]: "completed" }));
        if (ev.event === "node_failed") { setNodeStatuses(p => ({ ...p, [ev.nodeId]: "failed" })); toast.error(`Step failed: ${ev.error}`); }
        if (ev.event === "completed") { setRunning(false); toast.success("Workflow completed!"); loadExecutions(); }
        if (ev.event === "failed") { setRunning(false); toast.error(`Failed: ${ev.error}`); loadExecutions(); }
      }
    });
    return () => { socket.off("neural-request"); };
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const data = await neuralApi.workflows.get(id as string);
      setWorkflow(data);
      const mapped = (data.nodes || []).map((n: any) => ({ id: String(n.id), type: n.type, name: n.name, config: typeof n.config === "string" ? JSON.parse(n.config) : (n.config || {}), positionX: n.positionX, positionY: n.positionY }));
      setLocalNodes(mapped.length > 0 ? mapped : [{ id: "1", type: "trigger", name: "Start Here", config: { path: "webhook" } }]);
      if (mapped.length === 0) setShowRecipes(true);
    } catch { toast.error("Failed to load workflow"); }
    finally { setLoading(false); }
  };

  const loadExecutions = async () => {
    try { setExecutions(await neuralApi.workflows.getExecutions(id as string)); } catch {}
  };

  const loadAgents = async () => {
    try { setAgents(await neuralApi.agents.list()); } catch {}
  };

  const checkPlatformModel = async () => {
    try {
      const data = await neuralApi.models.list("chat");
      setHasPlatformModel((data.platform || []).some((m: any) => m.status === "active" && m.supportsChat));
    } catch { setHasPlatformModel(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await neuralApi.workflows.updateStructure(id as string, localNodes.map(n => ({ id: n.id, type: n.type, name: n.name, config: n.config, positionX: n.positionX || 0, positionY: n.positionY || 0 })), []);
      if (workflow) {
        await neuralApi.workflows.update(id as string, {
          name: workflow.name,
          description: workflow.description,
          config: workflow.config,
          envs: workflow.envs,
        });
      }
      toast.success("Workflow saved!");
      loadWorkflow();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleRun = async () => {
    setRunning(true);
    setNodeStatuses({});
    try {
      const triggerNode = localNodes.find(n => n.type === 'trigger');
      let payload = { test: true };
      if (triggerNode?.config?.testPayload) {
        try {
          payload = JSON.parse(triggerNode.config.testPayload);
        } catch (e) {
          toast.error("Test payload is invalid JSON. Using default {test: true}.");
        }
      }
      await neuralApi.workflows.execute(id as string, payload);
      setRunning(false);
      toast.success("Execution finished");
      loadExecutions();
    } catch (e: any) { toast.error(e.message); setRunning(false); }
  };

  const addNode = (type: string, label: string, idx?: number) => {
    const node = { id: `new-${Math.random().toString(36).slice(2, 7)}`, type: type.toLowerCase(), name: label, config: {}, positionX: 0, positionY: 0 };
    if (typeof idx === "number") { const arr = [...localNodes]; arr.splice(idx + 1, 0, node); setLocalNodes(arr); }
    else setLocalNodes(p => [...p, node]);
    setSelectedNodeId(node.id);
    setShowRecipes(false);
  };

  const applyRecipe = (recipe: typeof RECIPES[0]) => {
    if (recipe.nodes.length === 0) { setShowRecipes(false); return; }
    const nodes = recipe.nodes.map((n, i) => ({ id: `r-${i}-${Math.random().toString(36).slice(2, 6)}`, ...n }));
    setLocalNodes(nodes);
    setShowRecipes(false);
    toast.success(`"${recipe.title}" recipe loaded!`);
  };

  const updateNodeConfig = (nodeId: string, updates: any) => setLocalNodes(p => p.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...updates } } : n));
  const updateNodeName = (nodeId: string, name: string) => setLocalNodes(p => p.map(n => n.id === nodeId ? { ...n, name } : n));
  const removeNode = (nodeId: string) => { setLocalNodes(p => p.filter(n => n.id !== nodeId)); if (selectedNodeId === nodeId) setSelectedNodeId(null); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!workflow) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><AlertCircle size={32} className="text-destructive" /><p className="text-muted-foreground">Workflow not found</p><Link href="/workflows"><Button variant="neural">Back to Workflows</Button></Link></div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col -m-6 overflow-hidden bg-background">
      {showNodePicker && (
        <NodePickerModal
          onSelect={(type, label) => { addNode(type, label, insertAfterIndex); setInsertAfterIndex(undefined); }}
          onClose={() => { setShowNodePicker(false); setInsertAfterIndex(undefined); }}
        />
      )}

      {/* Header */}
      <header className="h-14 border-b border-border bg-background/90 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/workflows"><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><ChevronLeft size={18} /></Button></Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{workflow.name}</span>
              <button
                onClick={async () => {
                  const newStatus = workflow.status === "active" ? "draft" : "active";
                  const updated = await neuralApi.workflows.update(id as string, { status: newStatus }).catch(() => null);
                  if (updated) { setWorkflow(updated); toast.success(newStatus === "active" ? "🚀 Published!" : "Set to Draft"); }
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${workflow.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${workflow.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {workflow.status}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">{localNodes.length} steps · {workflow.appName}</p>
          </div>
        </div>

        <nav className="flex bg-secondary/50 border border-border/50 p-0.5 rounded-xl">
          {(["builder", "history", "settings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${activeTab === tab ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl border-border/80" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Save size={13} className="mr-1.5" />} Save Pipeline
          </Button>
          <Button variant="neural" size="sm" className="h-9 text-xs rounded-xl" onClick={handleRun} disabled={running}>
            {running ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Play size={13} className="mr-1.5 fill-current" />} Execute Run
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex">
        {activeTab === "builder" ? (
          <>
            {/* Left Palette Sidebar */}
            <aside className="w-72 border-r border-border bg-background/90 backdrop-blur-xl flex flex-col shrink-0 z-20 overflow-y-auto">
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Layers size={12} className="text-primary" /> NODE PALETTE
                </p>
                <div className="space-y-3">
                  {[
                    { type: "trigger", name: "API WEBHOOK", desc: "HTTP Entry Point", icon: <Zap size={18} className="text-amber-500" />, color: "bg-amber-500/10 border-amber-500/20" },
                    { type: "agent", name: "AI AGENT", desc: "LLM Decision Layer", icon: <Cpu size={18} className="text-blue-500" />, color: "bg-blue-500/10 border-blue-500/20" },
                    { type: "transform", name: "JSON MAPPER", desc: "Structure your data", icon: <RefreshCw size={18} className="text-emerald-500" />, color: "bg-emerald-500/10 border-emerald-500/20" },
                    { type: "logic", name: "LOGIC HOOK", desc: "Conditional routing", icon: <Code size={18} className="text-purple-500" />, color: "bg-purple-500/10 border-purple-500/20" },
                    { type: "http", name: "HTTP REQUEST", desc: "External API Call", icon: <Share2 size={18} className="text-pink-500" />, color: "bg-pink-500/10 border-pink-500/20" },
                  ].map(n => (
                    <button key={n.name} onClick={() => { setInsertAfterIndex(undefined); addNode(n.type, n.name); }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 hover:border-border/80 transition-all text-left group">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${n.color}`}>
                        {n.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{n.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 mt-auto border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">PIPELINE METRICS</p>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      SYSTEM LATENCY <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[9px] uppercase tracking-wider font-bold">STABLE</span>
                    </div>
                    <p className="text-2xl font-black">1.2s</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      NODE THROUGHPUT <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] uppercase tracking-wider font-bold">UP</span>
                    </div>
                    <p className="text-2xl font-black">120/min</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      ERROR THRESHOLD <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[9px] uppercase tracking-wider font-bold">DOWN</span>
                    </div>
                    <p className="text-2xl font-black text-muted-foreground">---</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Canvas */}
            <div className="flex-1 relative overflow-auto bg-slate-50/30 bg-[radial-gradient(hsl(var(--foreground)/0.15)_1.5px,transparent_1.5px)] [background-size:40px_40px] flex flex-col items-center p-8"
              onClick={() => setSelectedNodeId(null)}>

              {/* Recipe picker overlay */}
              {showRecipes && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xl mx-auto mb-10">
                  <p className="text-center text-sm font-semibold mb-1">What would you like to automate?</p>
                  <p className="text-center text-xs text-muted-foreground mb-5">Pick a starting template or build from scratch</p>
                  <div className="grid grid-cols-2 gap-3">
                    {RECIPES.map(r => (
                      <button key={r.title} onClick={() => applyRecipe(r)}
                        className="p-4 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-primary/5 text-left transition-all group">
                        <div className="text-2xl mb-2">{r.icon}</div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Node pipeline */}
              <div className="flex flex-col items-center gap-0 w-full max-w-sm mt-10">
                <AnimatePresence mode="popLayout">
                  {localNodes.map((node, i) => {
                    const colors = NODE_COLORS[node.type] || NODE_COLORS.trigger;
                    const status = nodeStatuses[node.id] || "pending";
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <motion.div key={node.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="w-full flex flex-col items-center">
                        {/* Node card */}
                        <div
                          onClick={e => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                          className={`w-72 rounded-3xl border-2 cursor-pointer transition-all duration-200 relative group bg-card shadow-sm ${isSelected ? `border-primary ring-4 ring-primary/10 shadow-xl` : "border-border/50 hover:border-primary/50 hover:shadow-lg"} ${status === "running" ? "animate-pulse ring-2 ring-primary/40" : ""}`}
                        >
                          {/* Type badge */}
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl shadow-sm ${colors.badge}`}>{node.type}</span>
                          </div>

                          <div className="p-5 pt-7">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.bg} border ${colors.border}`}>
                                  {getNodeIcon(node.type)}
                                </div>
                                <div>
                                  <p className="font-bold text-sm uppercase tracking-wide text-foreground">{node.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${status === "completed" ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : status === "running" ? "bg-amber-400 animate-pulse" : "bg-emerald-400/50"}`} />
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{status === "pending" ? "READY" : status}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-secondary/40 rounded-xl p-3 border border-border/50 font-mono text-[11px] text-center truncate text-muted-foreground/80 flex items-center justify-center">
                                {node.type === "trigger" ? node.config?.path || "v1/execute/webhook" : node.type === "http" ? node.config?.url || "Endpoint URL" : "Data Processing"}
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5"><Cpu size={12}/> {node.type === "agent" ? "AI ENGINE" : "RUNTIME"}</span>
                                <span className="text-[10px] font-bold text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">CONFIGURE <ChevronRight size={14}/></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Connector + insert button */}
                        {i < localNodes.length - 1 && (
                          <div className="group/c relative flex flex-col items-center py-2">
                            <div className="w-px h-10 border-l-2 border-dashed border-border/60" />
                            <button
                              onClick={e => { e.stopPropagation(); setInsertAfterIndex(i); setShowNodePicker(true); }}
                              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 hover:scale-110 transition-all shadow-md shadow-primary/20 z-10 opacity-0 group-hover/c:opacity-100"
                            ><Plus size={16} /></button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add step button */}
                <div className="mt-5 mb-10">
                  <button onClick={() => { setInsertAfterIndex(undefined); setShowNodePicker(true); }}
                    className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right config panel */}
            <aside className="w-80 border-l border-border bg-background flex flex-col shrink-0 z-20 overflow-y-auto">
              <div className="px-6 py-5 border-b border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Settings size={14} className="text-primary" /> CONFIGURATION
                </p>
                {selectedNode ? (
                  <p className="text-sm font-semibold text-foreground">Editing Node: <span className="text-foreground font-bold">{selectedNode.name}</span></p>
                ) : (
                  <p className="text-sm font-semibold text-foreground">Sandbox Environment</p>
                )}
              </div>

              <div className="p-6">
                <NodeConfigPanel
                  node={selectedNode}
                  agents={agents}
                  hasPlatformModel={hasPlatformModel}
                  onUpdate={updates => updateNodeConfig(selectedNode.id, updates)}
                  onRename={name => updateNodeName(selectedNode.id, name)}
                  onDelete={() => removeNode(selectedNode.id)}
                  onSave={handleSave}
                  canDelete={localNodes.length > 1}
                  workflow={workflow}
                  onWorkflowUpdate={updates => setWorkflow({ ...workflow, ...updates })}
                />
                {selectedNode && localNodes.length > 1 && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <button onClick={() => removeNode(selectedNode.id)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} /> Terminate Component
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </>
        ) : activeTab === "history" ? (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-bold">Run History</h2><p className="text-xs text-muted-foreground mt-0.5">{executions.length} total executions</p></div>
                <Button variant="outline" size="sm" onClick={loadExecutions}><RefreshCw size={13} className="mr-1.5" /> Refresh</Button>
              </div>
              {executions.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground">
                  <Activity size={28} className="opacity-20" />
                  <p className="text-sm font-medium">No runs yet</p>
                  <Button variant="neural" size="sm" onClick={handleRun}>Run Now</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map(exe => (
                    <div key={exe.id} className="p-4 rounded-xl border border-border bg-card flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exe.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : exe.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                        {exe.status === "completed" ? <CheckCircle2 size={20} /> : exe.status === "failed" ? <AlertCircle size={20} /> : <Loader2 size={20} className="animate-spin" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono font-bold">RUN-{String(exe.id).slice(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${exe.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : exe.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>{exe.status}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <Clock size={10} /> {new Date(exe.createdAt).toLocaleString()}
                          <span>·</span><span className="font-mono text-primary/80">{exe.latencyMs}ms</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-lg font-bold">Settings</h2>
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><Globe size={15} className="text-primary" /> Webhook URL</p>
                <div className="flex items-center gap-2 bg-secondary/40 p-3 rounded-lg border border-border/60 font-mono text-xs break-all text-primary/80">
                  {`http://localhost:3006/workflows/trigger/${id}`}
                  <button onClick={() => { navigator.clipboard.writeText(`http://localhost:3006/workflows/trigger/${id}`); toast.success("Copied!"); }} className="shrink-0 ml-auto text-muted-foreground hover:text-foreground">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <p className="font-semibold text-sm">Pipeline Status</p>
                <div className="flex gap-2">
                  {(["draft", "active"] as const).map(s => (
                    <Button key={s} variant={workflow.status === s ? "neural" : "outline"} size="sm"
                      onClick={async () => { const u = await neuralApi.workflows.update(id as string, { status: s }).catch(() => null); if (u) { setWorkflow(u); toast.success(`Workflow set to ${s}`); } }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm flex items-center gap-2"><Lock size={15} className="text-primary" /> Environment Variables</p>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg border border-border/50" onClick={() => setWorkflow({ ...workflow, envs: [...(workflow.envs || []), { key: "", value: "" }] })}>
                    <Plus size={12} className="mr-1" /> Add Variable
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(workflow.envs || []).map((env: any, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        className="flex-1 bg-secondary/30 border border-border/80 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-all" 
                        placeholder="KEY" 
                        value={env.key}
                        onChange={e => setWorkflow({ ...workflow, envs: (workflow.envs || []).map((v: any, idx: number) => idx === i ? { ...v, key: e.target.value } : v) })}
                      />
                      <input 
                        className="flex-1 bg-secondary/30 border border-border/80 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-all" 
                        type="password" 
                        placeholder="VALUE" 
                        value={env.value}
                        onChange={e => setWorkflow({ ...workflow, envs: (workflow.envs || []).map((v: any, idx: number) => idx === i ? { ...v, value: e.target.value } : v) })}
                      />
                      <Button 
                        variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => setWorkflow({ ...workflow, envs: (workflow.envs || []).filter((_: any, idx: number) => idx !== i) })}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  {(workflow.envs || []).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-border/50 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No Environment Variables</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1">Global keys available across all nodes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
