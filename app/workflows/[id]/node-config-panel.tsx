"use client";
import { useState } from "react";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { Agent, neuralApi } from "@/lib/neural-api";
import { toast } from "sonner";

const inp = "w-full bg-secondary/30 border border-border/80 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 shadow-sm";
const label = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2";
const req = <span className="ml-1.5 text-[9px] font-black px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">REQUIRED</span>;
const opt = <span className="ml-1.5 text-[9px] font-black px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border uppercase tracking-wider">OPTIONAL</span>;
const auto = <span className="ml-1.5 text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">AUTO</span>;

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 py-5 border-b border-border/50 last:border-0 first:pt-0">
      {title && <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 -mb-1">{title}</p>}
      {children}
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div className={`grid gap-4 ${cols === 3 ? "grid-cols-3" : cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>{children}</div>;
}

function Field({ label: l, hint, className = "", children }: { label: React.ReactNode; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className={label as any}>{l}</div>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground italic mt-1">{hint}</p>}
    </div>
  );
}

interface Props {
  node: any;
  agents: Agent[];
  hasPlatformModel: boolean;
  onUpdate: (c: any) => void;
  onRename: (n: string) => void;
  onDelete?: () => void;
  onSave?: () => void;
  canDelete?: boolean;
  workflow?: any;
  onWorkflowUpdate?: (updates: any) => void;
}

export function NodeConfigPanel({ node, agents, hasPlatformModel, onUpdate, onRename, workflow, onWorkflowUpdate }: Props) {
  if (!node) return <SandboxPanel workflow={workflow} onUpdate={onWorkflowUpdate} />;
  const shared = { node, agents, hasPlatformModel, onUpdate, onRename };
  return (
    <div className="space-y-0">
      {node.type === "trigger"   && <TriggerPanel   {...shared} />}
      {node.type === "agent"     && <AgentPanel     {...shared} />}
      {node.type === "http"      && <HttpPanel      {...shared} />}
      {node.type === "logic"     && <LogicPanel     {...shared} />}
      {node.type === "transform" && <TransformPanel {...shared} />}
    </div>
  );
}

function SandboxPanel({ workflow, onUpdate }: { workflow: any; onUpdate?: (u: any) => void }) {
  if (!workflow) return null;
  const config = workflow.config || {};
  const updateConfig = (updates: any) => onUpdate?.({ config: { ...config, ...updates } });

  return <>
    <Section title="Sandbox Identity">
      <Grid cols={1}>
        <Field label="ENVIRONMENT NAME" hint="Internal name for this pipeline">
          <input className={inp} value={workflow.name || ""} onChange={e => onUpdate?.({ name: e.target.value })} />
        </Field>
        <Field label="PIPELINE DESCRIPTION" hint="Purpose of this automation">
          <textarea className={`${inp} min-h-[80px] resize-none`} value={workflow.description || ""} onChange={e => onUpdate?.({ description: e.target.value })} />
        </Field>
      </Grid>
    </Section>

    <Section title="Environment Details">
      <Grid cols={1}>
        <Field label="BASE API URL" hint="Prefix for all HTTP nodes">
          <input className={inp} value={config.baseUrl || ""} onChange={e => updateConfig({ baseUrl: e.target.value })} placeholder="https://api.production.com" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ENV STAGE">
            <select className={inp} value={config.stage || "Development"} onChange={e => updateConfig({ stage: e.target.value })}>
              <option>Development</option>
              <option>Staging</option>
              <option>Production</option>
            </select>
          </Field>
          <Field label="DEBUG MODE">
            <div className="flex items-center h-full pt-1">
              <button 
                onClick={() => updateConfig({ debug: !config.debug })}
                className={`w-10 h-5 rounded-full transition-all relative ${config.debug ? "bg-primary" : "bg-secondary"}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.debug ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </Field>
        </div>
      </Grid>
    </Section>

    <Section title="Global Security">
      <Grid cols={1}>
        <Field label="GLOBAL HEADERS (JSON)" hint="Injected into every HTTP request">
          <textarea 
            className={`${inp} min-h-[120px] font-mono text-xs`} 
            value={config.globalHeaders || ""} 
            onChange={e => updateConfig({ globalHeaders: e.target.value })} 
            placeholder={'{\n  "X-App-ID": "neural-hub",\n  "Authorization": "Bearer {{GLOBAL_TOKEN}}"\n}'} 
          />
        </Field>
      </Grid>
    </Section>

    <Section title="Pipeline Resonance">
      <Grid cols={1}>
        <Field label="GLOBAL TIMEOUT (MS)" hint="Applied if node timeout is missing">
          <input className={inp} type="number" value={config.globalTimeout || 30000} onChange={e => updateConfig({ globalTimeout: +e.target.value })} />
        </Field>
      </Grid>
    </Section>
  </>;
}

function TriggerPanel({ node, hasPlatformModel, onUpdate, onRename }: any) {
  const [generating, setGenerating] = useState(false);
  const [intent, setIntent] = useState("");
  const [showHelper, setShowHelper] = useState(false);

  const generateSchema = async () => {
    if (!intent.trim()) return;
    setGenerating(true);
    const r = await neuralApi.gateway.generatePrompt(`Generate a highly readable JSON schema example for this intent. Return ONLY the raw JSON object, without markdown blocks or explanation. Intent: ${intent}`);
    setGenerating(false);
    if (r) { onUpdate({ schema: r }); setShowHelper(false); setIntent(""); toast.success("✨ Schema generated!"); }
    else toast.error("No platform model available. Ask admin to configure one.");
  };

  return <>
    <Section title="Identity">
      <Grid cols={1}>
        <Field label={<>NODE IDENTIFIER{req}</>} hint="Display name for this node in the canvas">
          <input className={inp} value={node.name || ""} onChange={e => onRename(e.target.value)} />
        </Field>
        <Field label={<>WEBHOOK ENDPOINT PATH{req}</>} hint="Dynamic route that triggers this workflow">
          <input className={inp} value={node.config?.path || ""} onChange={e => onUpdate({ path: e.target.value })} placeholder="v1/execute/webhook" />
        </Field>
      </Grid>
    </Section>

    <Section title="Request config">
      <Grid cols={1}>
        <Field label="HTTP METHOD" hint="Use POST for receiving data">
          <select className={inp} value={node.config?.method || "POST"} onChange={e => onUpdate({ method: e.target.value })}>
            <option value="POST">POST</option>
            <option value="GET">GET</option>
          </select>
        </Field>
        <Field label="INPUT DATA FORMAT" hint="Expected body format">
          <select className={inp} value={node.config?.dataFormat || "JSON"} onChange={e => onUpdate({ dataFormat: e.target.value })}>
            <option value="JSON">JSON</option>
            <option value="Form Data">Form Data</option>
            <option value="Plain Text">Plain Text</option>
          </select>
        </Field>
        <Field label="RESPONSE TYPE" hint="Wait for pipeline result">
          <select className={inp} value={node.config?.responseType || "Synchronous"} onChange={e => onUpdate({ responseType: e.target.value })}>
            <option>Synchronous</option><option>Async</option><option>Fire and forget</option>
          </select>
        </Field>
      </Grid>
    </Section>

    <Section title="Security">
      <Grid cols={1}>
        <Field label={<>AUTHENTICATION</>} hint="Header name: x-api-key">
          <select className={inp} value={node.config?.authType || "none"} onChange={e => onUpdate({ authType: e.target.value })}>
            <option value="none">No Authentication</option>
            <option value="apiKey">API Key (Header)</option>
            <option value="bearer">Bearer Token</option>
          </select>
        </Field>
        {node.config?.authType && node.config.authType !== "none" && (
          <Field label="SECRET KEY / TOKEN" hint="Store in .env — never hardcode">
            <input className={inp} type="password" value={node.config?.token || ""} onChange={e => onUpdate({ token: e.target.value })} placeholder="your_strong_secret_here" />
          </Field>
        )}
      </Grid>
    </Section>

    <Section title="Payload schema">
      <div className="flex items-start justify-between mb-3 gap-2 flex-col xl:flex-row xl:items-center">
        <p className="text-xs text-muted-foreground whitespace-nowrap">Expected JSON schema</p>
        <button disabled={!hasPlatformModel} onClick={() => setShowHelper(v => !v)}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${hasPlatformModel ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" : "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground border-border"}`}
          title={!hasPlatformModel ? "Admin must configure a platform model first" : ""}>
          <Sparkles size={11} /> ✨ Auto-Generate
        </button>
      </div>
      {showHelper && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
          <input value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => e.key === "Enter" && generateSchema()}
            placeholder="e.g. Generate schema for user signup"
            className={`${inp} text-xs`} />
          <button onClick={generateSchema} disabled={generating || !intent.trim()}
            className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Schema</>}
          </button>
        </div>
      )}
      <textarea className={`${inp} min-h-[160px] resize-none font-mono text-xs leading-relaxed`} value={node.config?.schema || ""} onChange={e => onUpdate({ schema: e.target.value })}
        placeholder={'{\n  "to": "user@example.com",\n  "name": "Alice"\n}'} />
    </Section>

    <Section title="Resilience">
      <Grid cols={1}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="MAX RETRIES">
            <input className={inp} type="number" value={node.config?.maxRetries ?? 3} onChange={e => onUpdate({ maxRetries: +e.target.value })} />
          </Field>
          <Field label="RETRY INT. (S)">
            <input className={inp} type="number" value={node.config?.retryInterval ?? 5} onChange={e => onUpdate({ retryInterval: +e.target.value })} />
          </Field>
        </div>
        <Field label="TIMEOUT (MS)" hint="Max wait before timeout">
          <input className={inp} type="number" value={node.config?.timeout ?? 5000} onChange={e => onUpdate({ timeout: +e.target.value })} />
        </Field>
      </Grid>
    </Section>
  </>;
}

function AgentPanel({ node, agents, hasPlatformModel, onUpdate, onRename }: any) {
  const [generating, setGenerating] = useState(false);
  const [intent, setIntent] = useState("");
  const [showHelper, setShowHelper] = useState(false);

  const generate = async () => {
    if (!intent.trim()) return;
    setGenerating(true);
    const r = await neuralApi.gateway.generatePrompt(intent);
    setGenerating(false);
    if (r) { onUpdate({ userMessage: r }); setShowHelper(false); setIntent(""); toast.success("✨ Prompt generated!"); }
    else toast.error("No platform model available. Ask admin to configure one.");
  };

  return <>
    <Section>
      <Grid cols={1}>
        <Field label={<>NODE IDENTIFIER</>}>
          <input className={inp} value={node.name || ""} onChange={e => onRename(e.target.value)} />
        </Field>
        <Field label="AGENT SELECTION" hint="Select an AI agent to execute this step">
          <select className={inp} value={node.config?.agentId || ""} onChange={e => onUpdate({ agentId: e.target.value })}>
            <option value="">Select Agent...</option>
            {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      </Grid>
    </Section>

    <Section title="Prompt instructions">
      <div className="flex items-start justify-between mb-3 gap-2 flex-col xl:flex-row xl:items-center">
        <p className="text-xs text-muted-foreground">What should the AI do with the input data?</p>
        <button disabled={!hasPlatformModel} onClick={() => setShowHelper(v => !v)}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${hasPlatformModel ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" : "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground border-border"}`}
          title={!hasPlatformModel ? "Admin must configure a platform model first" : ""}>
          <Sparkles size={11} /> ✨ Auto-Generate
        </button>
      </div>
      {showHelper && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
          <input value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
            placeholder="e.g. Write a professional email based on the topic and recipient name"
            className={`${inp} text-xs`} />
          <button onClick={generate} disabled={generating || !intent.trim()}
            className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Prompt</>}
          </button>
        </div>
      )}
      <textarea className={`${inp} min-h-[200px] resize-none font-mono text-xs leading-relaxed`}
        value={node.config?.userMessage || node.config?.prompt || ""}
        onChange={e => onUpdate({ userMessage: e.target.value })}
        placeholder={"You are a professional email writer.\nGenerate a well-crafted email based on:\n\nRecipient: {{input.recipientName}}\nTopic: {{input.topic}}\nTone: {{input.tone}}"} />
      <p className="text-[10px] text-muted-foreground italic mt-2">
        Tip: Reference data from upstream nodes using <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono">{"{{nodeName.fieldName}}"}</code> or <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono">{"{{input.fieldName}}"}</code>
      </p>
    </Section>
    
    <Section title="Output schema (Zod)">
      <Grid cols={1}>
        <Field label="OUTPUT FORMAT">
          <select className={inp} value={node.config?.format || "Structured JSON"} onChange={e => onUpdate({ format: e.target.value })}>
            <option>Structured JSON</option><option>Plain Text</option><option>Markdown</option>
          </select>
        </Field>
      </Grid>
    </Section>
  </>;
}

function HttpPanel({ node, onUpdate, onRename }: any) {
  const isSmtp = node.config?.serviceType === "SMTP via Nodemailer";

  return <>
    <Section title="Identity">
      <Grid cols={1}>
        <Field label={<>NODE IDENTIFIER{req}</>}>
          <input className={inp} value={node.name || ""} onChange={e => onRename(e.target.value)} placeholder="Send Email" />
        </Field>
        <Field label="SERVICE TYPE">
          <select className={inp} value={node.config?.serviceType || "REST API"} onChange={e => onUpdate({ serviceType: e.target.value })}>
            <option>REST API</option>
            <option>GraphQL</option>
            <option>SMTP via Nodemailer</option>
          </select>
        </Field>
      </Grid>
    </Section>

    <Section title="Request config">
      <Grid cols={1}>
        <Field label={<>METHOD{req}</>}>
          <select className={inp} value={node.config?.method || "POST"} onChange={e => onUpdate({ method: e.target.value })}>
            <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
          </select>
        </Field>
        <Field label={<>URL / ENDPOINT{req}</>} hint={isSmtp ? "Your Express server endpoint" : "Target API URL"}>
          <input className={inp} value={node.config?.url || ""} onChange={e => onUpdate({ url: e.target.value })} placeholder="http://localhost:3000/send" />
        </Field>
        <Field label="CONTENT-TYPE">
          <input className={inp} value={node.config?.contentType || "application/json"} onChange={e => onUpdate({ contentType: e.target.value })} />
        </Field>
        <Field label="AUTH HEADER">
          <input className={inp} value={node.config?.authHeader || "x-api-key: {{WEBHOOK_SECRET}}"} onChange={e => onUpdate({ authHeader: e.target.value })} />
        </Field>
      </Grid>
    </Section>

    {isSmtp && (
      <Section title="SMTP config">
        <Grid cols={1}>
          <Field label="SMTP HOST">
            <input className={inp} value={node.config?.smtpHost || "smtp.gmail.com"} onChange={e => onUpdate({ smtpHost: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SMTP PORT">
              <input className={inp} value={node.config?.smtpPort || "587"} onChange={e => onUpdate({ smtpPort: e.target.value })} />
            </Field>
            <Field label="SECURE" hint="STARTTLS / port 587">
              <select className={inp} value={node.config?.smtpSecure || "false"} onChange={e => onUpdate({ smtpSecure: e.target.value })}>
                <option>true</option><option>false</option>
              </select>
            </Field>
          </div>
          <Field label="SMTP USER">
            <input className={inp} value={node.config?.smtpUser || "{{SMTP_USER}}"} onChange={e => onUpdate({ smtpUser: e.target.value })} />
          </Field>
          <Field label="SMTP PASS" hint="Gmail App Password">
            <input className={inp} type="password" value={node.config?.smtpPass || "{{SMTP_PASS}}"} onChange={e => onUpdate({ smtpPass: e.target.value })} />
          </Field>
          <Field label="SENDER NAME">
            <input className={inp} value={node.config?.senderName || "{{SENDER_NAME}}"} onChange={e => onUpdate({ senderName: e.target.value })} />
          </Field>
        </Grid>
      </Section>
    )}

    {!isSmtp && (
      <Section title="Custom Headers">
        <Grid cols={1}>
          <Field label="HEADERS (JSON)">
            <textarea className={`${inp} min-h-[80px] font-mono text-xs`} value={node.config?.headers || ""} onChange={e => onUpdate({ headers: e.target.value })} placeholder={'{\n  "Authorization": "Bearer {{token}}"\n}'} />
          </Field>
        </Grid>
      </Section>
    )}

    <Section title="Request body — uses pipeline output">
      <textarea className={`${inp} min-h-[160px] resize-none font-mono text-xs leading-relaxed`} value={node.config?.body || ""} onChange={e => onUpdate({ body: e.target.value })}
        placeholder={'{\n  "from": "{{SENDER_NAME}} <{{SMTP_USER}}>",\n  "to": "{{mapper.to}}",\n  "subject": "{{agent.subject}}",\n  "html": "{{agent.htmlBody}}"\n}'} />
    </Section>

    <Section title="Resilience">
      <Grid cols={1}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="TIMEOUT (MS)">
            <input className={inp} type="number" value={node.config?.timeout || 8000} onChange={e => onUpdate({ timeout: +e.target.value })} />
          </Field>
          <Field label="MAX RETRIES">
            <input className={inp} type="number" value={node.config?.maxRetries || 2} onChange={e => onUpdate({ maxRetries: +e.target.value })} />
          </Field>
        </div>
        <Field label="RETRY POLICY">
          <select className={inp} value={node.config?.retryPolicy || "Exponential backoff"} onChange={e => onUpdate({ retryPolicy: e.target.value })}>
            <option>Exponential backoff</option>
            <option>Linear</option>
            <option>Immediate</option>
          </select>
        </Field>
      </Grid>
      {isSmtp && (
        <div className="flex justify-end mt-4">
          <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Use SendGrid instead ↗
          </button>
        </div>
      )}
    </Section>
  </>;
}

function LogicPanel({ node, onUpdate, onRename }: any) {
  return <>
    <Section title="Identity">
      <Grid cols={1}>
        <Field label={<>NODE IDENTIFIER{req}</>} hint="Name shown on canvas">
          <input className={inp} value={node.name || ""} onChange={e => onRename(e.target.value)} placeholder="Process Data" />
        </Field>
      </Grid>
    </Section>

    <Section title="Environment Context">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-500/90 leading-relaxed font-mono">
        <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Available Context Variables:</p>
        <ul className="list-disc pl-4 space-y-1 opacity-80">
          <li><code>env.trigger.body</code> (Webhook payload)</li>
          <li><code>env.agent.output</code> (AI response)</li>
          <li><code>env.mapper.data</code> (Mapped fields)</li>
          <li><code>env.http.response</code> (API response)</li>
        </ul>
      </div>
    </Section>

    <Section title="Javascript Sandbox">
      <Field label={<>CUSTOM LOGIC (Node.js){req}</>} hint="Write vanilla JavaScript. Must return an object.">
        <textarea 
          className={`${inp} min-h-[250px] resize-y font-mono text-xs leading-relaxed bg-[#1e1e1e] text-[#d4d4d4] border-[#333] focus:border-blue-500`} 
          value={node.config?.jsCode || ""} 
          onChange={e => onUpdate({ jsCode: e.target.value })}
          placeholder={`// Extract data from upstream nodes
const email = env.trigger.body.email;
const spamScore = env.agent.output.score;

// Custom processing
let action = "PROCESS";
if (spamScore > 0.8) {
  action = "DROP";
}

// Return state to pass to downstream nodes
return {
  action: action,
  processedEmail: email.toLowerCase(),
  timestamp: new Date().toISOString()
};`} 
          spellCheck={false}
        />
      </Field>
      <div className="flex justify-end mt-2">
        <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          View Sandbox API ↗
        </button>
      </div>
    </Section>

    <Section title="Execution">
      <Grid cols={1}>
        <Field label="TIMEOUT (MS)">
          <input className={inp} type="number" value={node.config?.timeout || 5000} onChange={e => onUpdate({ timeout: +e.target.value })} />
        </Field>
      </Grid>
    </Section>
  </>;
}

function TransformPanel({ node, onUpdate, onRename }: any) {
  const fields: any[] = node.config?.fieldMappings || [
    { name: "to", required: true, source: "$.body.to" },
    { name: "recipientName", required: false, source: "$.body.recipientName" },
    { name: "topic", required: true, source: "$.body.topic" },
    { name: "tone", required: false, source: "$.body.tone" },
    { name: "context", required: false, source: "$.body.context" }
  ];
  const addField = () => onUpdate({ fieldMappings: [...fields, { name: "newField", required: false, source: "$.body.newField" }] });
  const updateField = (i: number, key: string, val: any) => onUpdate({ fieldMappings: fields.map((f, idx) => idx === i ? { ...f, [key]: val } : f) });
  const removeField = (i: number) => onUpdate({ fieldMappings: fields.filter((_, idx) => idx !== i) });
  const toggleReq = (i: number) => onUpdate({ fieldMappings: fields.map((f, idx) => idx === i ? { ...f, required: !f.required } : f) });

  const defaultVals: any[] = node.config?.defaultValuesList || [{ key: "tone", value: "professional" }];
  const addDefaultValue = () => onUpdate({ defaultValuesList: [...defaultVals, { key: "", value: "" }] });
  const updateDefaultValue = (i: number, field: string, val: any) => onUpdate({ defaultValuesList: defaultVals.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  const removeDefaultValue = (i: number) => onUpdate({ defaultValuesList: defaultVals.filter((_, idx) => idx !== i) });

  const typeVals: any[] = node.config?.typeValidationsList || [{ field: "to", type: "email" }];
  const addTypeVal = () => onUpdate({ typeValidationsList: [...typeVals, { field: "", type: "string" }] });
  const updateTypeVal = (i: number, key: string, val: any) => onUpdate({ typeValidationsList: typeVals.map((d, idx) => idx === i ? { ...d, [key]: val } : d) });
  const removeTypeVal = (i: number) => onUpdate({ typeValidationsList: typeVals.filter((_, idx) => idx !== i) });

  return <>
    <Section title="Identity">
      <Grid cols={1}>
        <Field label={<>NODE IDENTIFIER{req}</>} hint="Name shown on canvas">
          <input className={inp} value={node.name || ""} onChange={e => onRename(e.target.value)} placeholder="Validate Input" />
        </Field>
        <Field label={<>INPUT SOURCE{auto}</>} hint="Root of incoming request data">
          <input className={inp} value={node.config?.inputSource || "$.body"} onChange={e => onUpdate({ inputSource: e.target.value })} />
        </Field>
      </Grid>
    </Section>

    <Section title="Field mapping">
      <div className="space-y-5">
        {fields.map((f, i) => (
          <div key={i} className="relative group">
            <Field 
              label={
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-1">MAP:</span>
                    <input 
                      value={f.name} 
                      onChange={e => updateField(i, "name", e.target.value)} 
                      className="bg-transparent border-none outline-none w-28 text-[10px] font-bold uppercase tracking-widest text-muted-foreground focus:text-foreground transition-colors placeholder:text-muted-foreground/50" 
                      placeholder="FIELD_NAME" 
                    />
                  </div>
                  <button onClick={() => toggleReq(i)} className="hover:opacity-80 transition-opacity shrink-0" title="Toggle Required/Optional">
                    {f.required ? req : opt}
                  </button>
                </div>
              } 
              hint={f.description || "Source JSON path"}
            >
              <input className={inp} value={f.source} onChange={e => updateField(i, "source", e.target.value)} placeholder="$.body.field" />
            </Field>
            <button onClick={() => removeField(i)} className="absolute -right-2 top-6 w-6 h-6 rounded-full bg-background border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"><X size={12} /></button>
          </div>
        ))}
      </div>
      <button onClick={addField} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold mt-4"><Plus size={14} /> Add Mapping</button>
    </Section>

    <Section title="Validation rules">
      <Grid cols={1}>
        <Field label="REQUIRED FIELDS" hint="Return 400 if missing">
          <input className={inp} value={node.config?.requiredFields !== undefined ? node.config.requiredFields : "to, topic"} onChange={e => onUpdate({ requiredFields: e.target.value })} placeholder="e.g. to, topic" />
        </Field>
        <Field label="DEFAULT VALUES" hint="Applied when absent">
          <div className="space-y-3">
            {defaultVals.map((d, i) => (
              <div key={i} className="flex gap-2 relative group bg-secondary/10 p-2 rounded-xl border border-border/50 items-center">
                <input className={`${inp} py-1.5 px-3 flex-1 min-w-0`} value={d.key} onChange={e => updateDefaultValue(i, "key", e.target.value)} placeholder="Field (e.g. tone)" />
                <span className="text-muted-foreground font-mono text-xs opacity-50 shrink-0">→</span>
                <input className={`${inp} py-1.5 px-3 flex-1 min-w-0`} value={d.value} onChange={e => updateDefaultValue(i, "value", e.target.value)} placeholder="Value" />
                <button onClick={() => removeDefaultValue(i)} className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-background border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"><X size={10} /></button>
              </div>
            ))}
            <button onClick={addDefaultValue} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold"><Plus size={12} /> Add Default</button>
          </div>
        </Field>
        <Field label="TYPE VALIDATION" hint="Enforce data formats">
          <div className="space-y-3">
            {typeVals.map((t, i) => (
              <div key={i} className="flex gap-2 relative group bg-secondary/10 p-2 rounded-xl border border-border/50 items-center">
                <input className={`${inp} py-1.5 px-3 flex-1 min-w-0`} value={t.field} onChange={e => updateTypeVal(i, "field", e.target.value)} placeholder="Field" />
                <span className="text-muted-foreground font-mono text-xs opacity-50 shrink-0">→</span>
                <select className={`${inp} py-1.5 px-2 flex-1 min-w-0`} value={t.type} onChange={e => updateTypeVal(i, "type", e.target.value)}>
                  <option value="string">String</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="url">URL</option>
                  <option value="custom">Custom</option>
                </select>
                {t.type === "custom" && (
                  <input className={`${inp} py-1.5 px-3 flex-1 min-w-0`} value={t.customType || ""} onChange={e => updateTypeVal(i, "customType", e.target.value)} placeholder="Regex / rule" />
                )}
                <button onClick={() => removeTypeVal(i)} className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-background border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"><X size={10} /></button>
              </div>
            ))}
            <button onClick={addTypeVal} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold"><Plus size={12} /> Add Type Rule</button>
          </div>
        </Field>
        <Field label="ON VALIDATION FAIL">
          <select className={inp} value={node.config?.onValidationFail || "Stop + return error"} onChange={e => onUpdate({ onValidationFail: e.target.value })}>
            <option>Stop + return error</option>
            <option>Skip node + continue</option>
            <option>Use defaults + warn</option>
          </select>
        </Field>
      </Grid>
    </Section>

    <Section title="Output schema">
      <textarea className={`${inp} min-h-[140px] resize-none font-mono text-xs leading-relaxed bg-secondary/10`} 
        readOnly
        value={node.config?.outputSchema || `{\n  "to": string,\n  "recipientName": string | "recipient",\n  "topic": string,\n  "tone": string | "professional",\n  "context": string | ""\n}`} 
      />
      <div className="flex justify-end mt-2">
        <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Learn JSONPath syntax ↗
        </button>
      </div>
    </Section>
  </>;
}
