"use client";

import { useEffect, useState } from "react";
import { neuralApi } from "@/lib/neural-api";
import { Sparkles, Loader2, Save, RefreshCw, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const inp = "w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all";

const MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
];

const DEFAULT_SYSTEM_PROMPT = `You are a workflow automation assistant for NeuralHub.
When asked to generate a prompt, produce a concise, professional instruction for an AI agent.
The prompt should clearly describe what the agent should do with the input data.
Reference input fields using {{input.fieldName}} syntax.
Return ONLY the prompt text — no markdown, no explanation, no preamble.`;

const DEFAULT_SCHEMA_PROMPT = `You are a JSON schema generator.
When given a description of data, return a clean, readable JSON example object.
Use realistic placeholder values. Return ONLY the raw JSON object — no markdown blocks, no explanation.`;

export default function AdminPromptConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ model: "gemini-2.0-flash", systemPrompt: DEFAULT_SYSTEM_PROMPT });
  const [availableModels, setAvailableModels] = useState<{ value: string; label: string }[]>(MODELS);

  const load = async () => {
    setLoading(true);
    try {
      const [cfg, modelsRes] = await Promise.all([
        neuralApi.admin.getPromptConfig().catch(() => null),
        neuralApi.models.list("chat").catch(() => ({ platform: [], user: [] })),
      ]);
      // cfg is either a real agent row, { exists: false }, or null (network error)
      if (cfg && cfg.model) {
        setConfig(cfg);
        setForm({ model: cfg.model, systemPrompt: cfg.systemPrompt || DEFAULT_SYSTEM_PROMPT });
      } else {
        // Not configured yet — keep defaults, no error
        setConfig(null);
      }
      const all = [
        ...(modelsRes.platform || []).map((m: any) => ({ value: m.modelId, label: `${m.name} (${m.provider}) — Platform` })),
        ...(modelsRes.user || []).map((m: any) => ({ value: m.modelId, label: `${m.name} — BYOK` })),
      ];
      if (all.length > 0) setAvailableModels(all);
    } catch {
      toast.error("Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await neuralApi.admin.upsertPromptConfig(form.model, form.systemPrompt);
      setConfig(updated);
      toast.success("Auto-generate config saved! The ✨ button in workflows will now use this agent.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Auto-Generate Config
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure the AI model and system prompt used by the ✨ Auto-Generate button in workflow node configs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${config ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
        <Info size={15} className={`mt-0.5 shrink-0 ${config ? "text-emerald-400" : "text-amber-400"}`} />
        <div>
          <p className={`text-sm font-medium ${config ? "text-emerald-400" : "text-amber-400"}`}>
            {config ? "workflow-helper agent is configured" : "workflow-helper agent not found"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config
              ? `Currently using model: ${config.model}. Save below to update.`
              : "The ✨ Auto-Generate button will show as disabled until you save a config here."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading…
        </div>
      ) : (
        <Card className="p-6 space-y-5">
          {/* Model selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              AI Model for Auto-Generation
            </label>
            <select className={inp} value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
              {availableModels.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              This model must be active and have a working key in the pool. Gemini 2.0 Flash is recommended for speed.
            </p>
          </div>

          {/* System prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                System Prompt
              </label>
              <button
                className="text-[10px] text-primary hover:text-primary/80 font-semibold transition-colors"
                onClick={() => setForm({ ...form, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
              >
                Reset to default
              </button>
            </div>
            <textarea
              className={`${inp} min-h-[200px] resize-y font-mono text-xs leading-relaxed`}
              value={form.systemPrompt}
              onChange={e => setForm({ ...form, systemPrompt: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              This is the system instruction given to the model when a user clicks ✨ Auto-Generate in the Agent or Trigger node config panels.
            </p>
          </div>

          {/* How it works */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How it works</p>
            <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>User clicks ✨ Auto-Generate in a workflow node config panel</li>
              <li>They type their intent (e.g. "Write a professional email based on topic and recipient")</li>
              <li>NeuralHub calls <code className="bg-secondary px-1 rounded font-mono">POST /v1/chat</code> with <code className="bg-secondary px-1 rounded font-mono">agentId: "workflow-helper"</code></li>
              <li>The response is injected directly into the node's prompt or schema field</li>
              <li>If this agent doesn't exist or has no active model, the button is disabled for all users</li>
            </ul>
          </div>

          <Button variant="neural" onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
            Save Auto-Generate Config
          </Button>
        </Card>
      )}
    </div>
  );
}
