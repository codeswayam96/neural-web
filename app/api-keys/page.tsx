"use client";

import { useState } from "react";
import {
  Key, Plus, RotateCcw, AlertCircle, RefreshCw,
  Shield, Clock, Copy, Check, X, Loader2, Terminal,
  BookOpen, Zap, Code2, Package, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neuralApi, ApiKey, CreateApiKeyPayload, CreatedApiKey } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import { toast } from "sonner";

const PERMISSIONS = ["chat", "agents", "analytics", "admin", "images"];

// ── Code Block ─────────────────────────────────────────────────────────
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-xl bg-zinc-950 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{language}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors">
          {copied ? <><Check size={10} className="text-emerald-400" /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-[11px] font-mono text-blue-100 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}

// ── Create Key Dialog ──────────────────────────────────────────────────
function CreateKeyDialog({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: (k: CreatedApiKey) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateApiKeyPayload>({ name: "", appName: "", permissions: ["chat"], rateLimit: 1000 });

  if (!open) return null;

  const togglePerm = (p: string) => {
    const curr = form.permissions ?? [];
    setForm({ ...form, permissions: curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.appName) return;
    setSaving(true);
    try {
      const result = await neuralApi.apiKeys.create(form);
      onSuccess(result); onClose();
    } catch (err: any) { toast.error(err.message || "Failed to create API key"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Key size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Issue API Key</h2>
              <p className="text-xs text-muted-foreground">Connect your SaaS app to NeuralHub</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Key Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AuraFlow Production" required
                className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">App Name *</label>
              <input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="auraflow" required
                className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Rate Limit (requests/day)</label>
            <input type="number" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: Number(e.target.value) })} min={1} max={100000}
              className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map((p) => {
                const active = (form.permissions ?? []).includes(p);
                return (
                  <button key={p} type="button" onClick={() => togglePerm(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all font-medium ${active ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {active && <Check size={9} className="inline mr-1" />}{p}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="neural" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin mr-2" /> : <Key size={13} className="mr-2" />} Issue Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Key Reveal Dialog ──────────────────────────────────────────────────
function KeyRevealDialog({ apiKey, onClose }: { apiKey: CreatedApiKey; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(apiKey.key); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const installCode = `npm install @codeswayam/neural`;
  const usageCode = `import NeuralClient from "@codeswayam/neural";

const neural = new NeuralClient({
  apiKey: "${apiKey.key}",
});

// Chat with your AI agent
const reply = await neural.agents.chat("YOUR_AGENT_ID", "Hello!");
console.log(reply.text);

// Generate an image
const img = await neural.images.generate("A futuristic city");

// Run an automation workflow
const result = await neural.workflows.run("YOUR_WORKFLOW_ID", {
  input: "process this data",
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-background rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Check size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-base">API Key Created!</h2>
            <p className="text-xs text-muted-foreground">Copy this key now — it will never be shown again.</p>
          </div>
        </div>
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Key reveal */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-widest">Your Secret API Key</p>
            <p className="text-sm font-mono text-primary break-all leading-relaxed">{apiKey.key}</p>
            <Button variant="neural" className="w-full mt-3 h-9" onClick={handleCopy}>
              {copied ? <><Check size={13} className="mr-2" /> Copied to Clipboard!</> : <><Copy size={13} className="mr-2" /> Copy Key</>}
            </Button>
          </div>

          {/* Quick Start */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Zap size={10} className="text-primary" /> Quick Start — 2 Steps
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold shrink-0">1</span>
                  Install the SDK
                </p>
                <CodeBlock code={installCode} language="terminal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold shrink-0">2</span>
                  Use in your app
                </p>
                <CodeBlock code={usageCode} language="typescript" />
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>I've saved my key — Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── Integration Guide ──────────────────────────────────────────────────
function IntegrationGuide() {
  const [activeTab, setActiveTab] = useState<"install" | "chat" | "image" | "workflow">("install");

  const tabs = [
    { id: "install", label: "Install", icon: <Package size={12} /> },
    { id: "chat", label: "Chat", icon: <Terminal size={12} /> },
    { id: "image", label: "Images", icon: <Zap size={12} /> },
    { id: "workflow", label: "Workflows", icon: <Code2 size={12} /> },
  ] as const;

  const snippets: Record<string, string> = {
    install: `# Install the official NeuralHub SDK
npm install @codeswayam/neural

# Or with yarn
yarn add @codeswayam/neural`,
    chat: `import NeuralClient from "@codeswayam/neural";

const neural = new NeuralClient({
  apiKey: process.env.NEURAL_API_KEY,
});

// Single message
const reply = await neural.agents.chat(
  "YOUR_AGENT_ID",
  "What are your features?"
);
console.log(reply.text);
console.log(\`Responded in \${reply.latencyMs}ms\`);

// Stateful multi-turn conversation
const sessionId = "user-123-session";
await neural.agents.chat("YOUR_AGENT_ID", "Remember my name is Alice", { sessionId });
await neural.agents.chat("YOUR_AGENT_ID", "What's my name?", { sessionId });`,
    image: `import NeuralClient from "@codeswayam/neural";

const neural = new NeuralClient({
  apiKey: process.env.NEURAL_API_KEY,
});

const img = await neural.images.generate(
  "A futuristic smart city at golden hour",
  { negativePrompt: "blurry, low quality" }
);

// Convert base64 to file
const buffer = Buffer.from(img.imageBase64!, "base64");
require("fs").writeFileSync("output.png", buffer);`,
    workflow: `import NeuralClient from "@codeswayam/neural";

const neural = new NeuralClient({
  apiKey: process.env.NEURAL_API_KEY,
});

// Trigger a workflow with custom input data
const result = await neural.workflows.run(
  "YOUR_WORKFLOW_ID",
  {
    email: "user@example.com",
    subject: "Need help with billing",
    body: "I was charged twice this month.",
  }
);

console.log(result.output);   // Final step output
console.log(result.status);   // "completed" | "failed"`,
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-secondary/20 flex items-center gap-2.5">
        <BookOpen size={16} className="text-primary" />
        <div>
          <p className="font-bold text-sm">Integration Guide</p>
          <p className="text-[10px] text-muted-foreground">Connect your app using the @codeswayam/neural SDK</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Tabs */}
        <div className="flex bg-secondary/50 rounded-xl p-1 gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-1 justify-center transition-all ${activeTab === t.id ? "bg-background shadow-sm text-primary border border-border/50" : "text-muted-foreground hover:text-foreground"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <CodeBlock code={snippets[activeTab]} language={activeTab === "install" ? "terminal" : "typescript"} />
        <p className="text-[10px] text-muted-foreground text-center">
          Replace <code className="text-primary font-mono">YOUR_AGENT_ID</code> with the numeric ID from the Agents page.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [revealKey, setRevealKey] = useState<CreatedApiKey | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: keys, loading, error, refetch } = useNeuralFetch(() => neuralApi.apiKeys.list());
  const { data: stats, refetch: refetchStats } = useNeuralFetch(() => neuralApi.apiKeys.stats());

  const handleRevoke = async (key: ApiKey) => {
    if (!confirm(`Revoke key "${key.name}"? Apps using it will immediately lose access.`)) return;
    setRevokingId(key.id);
    try {
      await neuralApi.apiKeys.revoke(key.id);
      toast.success("API key revoked");
      refetch(); refetchStats();
    } catch (err: any) { toast.error(err.message || "Failed to revoke key"); }
    finally { setRevokingId(null); }
  };

  const handleDelete = async (key: ApiKey) => {
    if (!confirm(`Delete key "${key.name}"? This action cannot be undone.`)) return;
    setDeletingId(key.id);
    try {
      await neuralApi.apiKeys.delete(key.id);
      toast.success("API key deleted");
      refetch(); refetchStats();
    } catch (err: any) { toast.error(err.message || "Failed to delete key"); }
    finally { setDeletingId(null); }
  };

  const handleCreated = (created: CreatedApiKey) => { setRevealKey(created); refetch(); refetchStats(); };

  return (
    <div className="space-y-6 max-w-6xl">
      <CreateKeyDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={handleCreated} />
      {revealKey && <KeyRevealDialog apiKey={revealKey} onClose={() => setRevealKey(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Issue <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">nhub_live_xxx</code> keys to connect your SaaS apps.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="h-9">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" size="sm" onClick={() => setCreateOpen(true)} className="h-9 px-4">
            <Plus size={13} className="mr-1.5" /> Issue Key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys list — takes 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Keys", val: stats.total, color: "text-primary" },
                { label: "Active", val: stats.active, color: "text-emerald-400" },
                { label: "Req Today", val: stats.totalRequestsToday.toLocaleString(), color: "text-violet-400" },
              ].map((s) => (
                <Card key={s.label} className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
              <AlertCircle size={16} /> Could not connect to NeuralAPI.
              <Button variant="outline" size="sm" onClick={refetch} className="ml-auto text-xs">Retry</Button>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-5 animate-pulse">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-secondary" /><div className="space-y-2 flex-1"><div className="h-4 w-36 bg-secondary rounded" /><div className="h-3 w-48 bg-secondary rounded" /></div></div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-3">
              {(keys ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-border rounded-2xl text-muted-foreground">
                  <Key size={32} className="opacity-20" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground mb-1">No API keys yet</p>
                    <p className="text-xs">Issue your first key to start integrating</p>
                  </div>
                  <Button variant="neural" size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} className="mr-1.5" /> Issue First Key</Button>
                </div>
              ) : (keys ?? []).map((k) => (
                <Card key={k.id} className="group hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${k.status === "active" ? "bg-primary/10 border-primary/20" : "bg-secondary border-border"}`}>
                        <Key size={15} className={k.status === "active" ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{k.name}</span>
                          <code className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 rounded">{k.app}</code>
                          <Badge variant={k.status === "active" ? "success" : "destructive"} className="text-[9px] ml-auto uppercase">{k.status}</Badge>
                        </div>
                        <code className="text-xs font-mono text-muted-foreground">{k.keyPreview}</code>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Shield size={9} />{k.permissions.join(", ")}</div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={9} />Last used: {k.lastUsed === "Never" ? "Never" : new Date(k.lastUsed).toLocaleDateString()}</div>
                          <span className="text-[10px] text-muted-foreground">{k.requestsToday} req today · {k.rateLimit.toLocaleString()}/day limit</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {k.status === "active" && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleRevoke(k)} disabled={revokingId === k.id || deletingId === k.id}>
                            {revokingId === k.id ? <Loader2 size={11} className="animate-spin" /> : <><RotateCcw size={11} className="mr-1" />Revoke</>}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => handleDelete(k)} disabled={deletingId === k.id || revokingId === k.id}>
                          {deletingId === k.id ? <Loader2 size={11} className="animate-spin" /> : <><Trash2 size={11} className="mr-1" />Delete</>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Integration Guide — 1/3 */}
        <div className="lg:col-span-1">
          <IntegrationGuide />
        </div>
      </div>
    </div>
  );
}
