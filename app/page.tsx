"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain, Zap, Shield, Key, Globe, Bot, Database,
  ArrowRight, Check, Lock, BarChart3, Workflow,
  Code2, BookOpen, Cpu, Layers, RefreshCw, Eye,
  ChevronRight, Star, Activity, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { checkUserAuth } from "@/lib/auth";

// ── Data ────────────────────────────────────────────────────────────

const stats = [
  { value: "10+", label: "LLM Providers" },
  { value: "<50ms", label: "Gateway Latency" },
  { value: "100%", label: "Encrypted Keys" },
  { value: "∞", label: "Connected SaaS Apps" },
];

const features = [
  {
    icon: Cpu,
    title: "Unified LLM Gateway",
    description: "Route to OpenAI, Gemini, Claude, or Ollama through one API. Multi-key pools, fallback chains, and automatic rate-limit rotation.",
    badge: "Gateway",
  },
  {
    icon: Bot,
    title: "AI Agent Builder",
    description: "Create named agents with system prompts, guardrails, and tool access. Deploy auraflow-support-bot that only answers brand questions.",
    badge: "Agents",
  },
  {
    icon: BookOpen,
    title: "RAG Knowledge Base",
    description: "Upload PDFs, docs, and URLs. Agents get context via pgvector hybrid search with citations back to source documents.",
    badge: "RAG",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Chain LLM calls, conditions, and API calls into multi-step pipelines. Runs async via BullMQ — no blocking your SaaS.",
    badge: "Automation",
  },
  {
    icon: Shield,
    title: "Guardrails Engine",
    description: "Topic enforcer, PII masking, jailbreak detection, and output validation. Safety at the infrastructure level.",
    badge: "Safety",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Tokens, cost, latency, and error rates per app and per agent. LangSmith-style full call traces for debugging.",
    badge: "Analytics",
  },
  {
    icon: Key,
    title: "API Key Management",
    description: "Issue nhub_live_xxx keys per app. Scoped permissions, rate limits, IP allowlisting, and one-click rotation.",
    badge: "Security",
  },
  {
    icon: Code2,
    title: "@codeswayam/neural SDK",
    description: "Drop-in NPM package. Add AI to any SaaS in 3 lines. Same pattern as @codeswayam/auth — instant integration.",
    badge: "Developer",
  },
];

const steps = [
  { step: "01", title: "Register Your App", description: "Add your SaaS to NeuralHub and get a nhub_live_xxx API key in seconds." },
  { step: "02", title: "Configure Agents", description: "Build named agents with system prompts, guardrails, and knowledge bases in the dashboard." },
  { step: "03", title: "Install the SDK", description: "npm install @codeswayam/neural and call ai.chat({ agentId, message }) anywhere." },
  { step: "04", title: "Monitor Everything", description: "Track usage, cost, latency, and guardrail violations from the analytics dashboard." },
];

const providers = [
  { name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"], color: "text-emerald-400" },
  { name: "Google Gemini", models: ["gemini-1.5-pro", "gemini-2.0-flash"], color: "text-blue-400" },
  { name: "Anthropic", models: ["claude-3.5-sonnet", "claude-3-haiku"], color: "text-orange-400" },
  { name: "Ollama (Local)", models: ["llama3", "mistral", "phi3"], color: "text-purple-400" },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Perfect for exploration",
    features: ["1 registered app", "1 AI agent", "10K tokens/day", "3 providers", "Basic analytics"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/mo",
    description: "For growing SaaS products",
    features: ["5 apps", "20 agents", "2M tokens/day", "All providers", "Knowledge base (5 KBs)", "Workflow builder", "Full analytics"],
    cta: "Get Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Unlimited scale",
    features: ["Unlimited apps & agents", "Unlimited tokens", "Dedicated key pools", "SLA guarantee", "Priority support", "Custom model hosting"],
    cta: "Contact Us",
    highlight: false,
  },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    checkUserAuth(apiUrl).then(({ authenticated }) => setAuthed(authenticated));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-32 pb-24 px-6">
          {/* Background */}
          <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[300px] opacity-8 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(280 80% 50%) 0%, transparent 70%)" }} />

          <div className="relative max-w-5xl mx-auto text-center">
            <Badge variant="neural" className="mb-6 px-4 py-1.5 text-xs gap-1.5">
              <Sparkles size={11} /> Centralized AI Management for Codeswayam SaaS
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              One Gateway.{" "}
              <span className="text-gradient">Every AI.</span>
              <br />
              Every SaaS.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              NeuralHub is the single source of intelligence for your platform.
              Manage AI models, agents, knowledge bases, and automations from one
              dashboard — integrate any SaaS in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button variant="neural" size="lg" asChild>
                <Link href={authed ? "/dashboard" : `${process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003"}/login?redirect=http%3A%2F%2Flocalhost%3A3008%2Fdashboard`}>
                  <Zap size={16} />
                  Open Dashboard <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              {[
                { icon: Lock, text: "Encrypted Key Storage" },
                { icon: Shield, text: "Guardrails Engine" },
                { icon: Globe, text: "Multi-Provider Gateway" },
                { icon: Activity, text: "Real-time Analytics" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-primary" /> {text}
                </div>
              ))}
            </div>

            {/* Hero terminal card */}
            <div className="mt-16 max-w-2xl mx-auto glass rounded-xl border border-border/60 p-6 text-left glow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">auraflow/lib/ai.ts</span>
              </div>
              <pre className="text-sm font-mono text-left overflow-x-auto leading-7">
                <span className="text-muted-foreground">{"// Before: scattered OpenAI calls everywhere\n"}</span>
                <span className="text-red-400/70">{"// const reply = await openai.chat.completions.create({...})\n\n"}</span>
                <span className="text-muted-foreground">{"// After: NeuralHub handles everything\n"}</span>
                <span className="text-blue-400">{"import"}</span>
                <span className="text-foreground">{" { NeuralClient } "}</span>
                <span className="text-blue-400">{"from"}</span>
                <span className="text-emerald-400">{" '@codeswayam/neural';\n"}</span>
                <span className="text-foreground">{"const ai = "}</span>
                <span className="text-blue-400">{"new"}</span>
                <span className="text-yellow-400">{" NeuralClient"}</span>
                <span className="text-foreground">{"({ apiKey: process.env.NEURAL_KEY });\n\n"}</span>
                <span className="text-foreground">{"export const reply = "}</span>
                <span className="text-blue-400">{"await"}</span>
                <span className="text-foreground">{" ai."}</span>
                <span className="text-yellow-400">{"chat"}</span>
                <span className="text-foreground">{"({\n"}</span>
                <span className="text-foreground">{"  agentId: "}</span>
                <span className="text-emerald-400">{"'auraflow-support-bot'"}</span>
                <span className="text-foreground">{",\n"}</span>
                <span className="text-foreground">{"  message,\n"}</span>
                <span className="text-foreground">{"  userId,\n"}</span>
                <span className="text-foreground">{"});\n"}</span>
                <span className="text-muted-foreground">{"// Guardrails, cost tracking, fallbacks — all handled."}</span>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-4xl font-extrabold text-gradient mb-1">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-20 max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything AI. <span className="text-gradient">One Platform.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop managing AI scattered across every SaaS. NeuralHub centralizes models, agents, knowledge, and automation into one command center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <Card key={f.title} glow className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <f.icon size={18} className="text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] w-fit mb-1">{f.badge}</Badge>
                  <CardTitle className="text-sm">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Providers ── */}
        <section className="bg-card/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Model Registry</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Multi-key pool per provider
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Add multiple API keys per provider. NeuralHub round-robins across them — if one hits rate limit, traffic auto-routes to the next.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {providers.map((p) => (
                <div key={p.name} className="glass rounded-xl p-5 border border-border hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-semibold ${p.color}`}>{p.name}</span>
                    <span className="status-dot active" />
                  </div>
                  <div className="space-y-1.5">
                    {p.models.map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <ChevronRight size={10} className="text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-primary/60" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">2 keys active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="scroll-mt-20 max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How it Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Live in <span className="text-gradient">four steps</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              From zero to production AI in minutes, not days.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px border-t-2 border-dashed border-border/60 z-0" />
                )}
                <div className="relative z-10 glass rounded-xl p-6 border border-border h-full hover:border-primary/30 transition-all">
                  <span className="text-4xl font-extrabold text-primary/20 block mb-4 leading-none">{s.step}</span>
                  <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Agent showcase ── */}
        <section id="agents" className="scroll-mt-20 bg-card/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">AI Agents</Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
                  Build agents that stay <span className="text-gradient">on-brand</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-5">
                  The guardrails engine uses LLM-judged topic classification to enforce scope. Your AuraFlow support bot will never answer competitor questions or go off-topic.
                </p>
                <ul className="space-y-3">
                  {["System prompt vault with versioning", "Topic whitelist & blacklist", "PII masking before LLM call", "Output JSON schema validation", "A/B test prompt versions with traffic split"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <Check size={14} className="text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Mock agent card */}
              <div className="glass rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">auraflow-support-bot</p>
                      <p className="text-xs text-muted-foreground">gemini-1.5-pro · v2.1</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-mono">System Prompt</p>
                  <p className="text-xs text-foreground leading-relaxed">
                    You are AuraFlow&apos;s support assistant. Answer ONLY questions about AuraFlow features, pricing, and usage. Politely decline all other topics.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[{ label: "Requests today", val: "1,284" }, { label: "Avg latency", val: "420ms" }, { label: "Guardrail blocks", val: "17" }].map((m) => (
                    <div key={m.label} className="rounded-lg bg-muted/30 p-2.5 border border-border">
                      <p className="text-base font-bold text-foreground">{m.val}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-mono">Guardrails</p>
                  {[
                    { label: "Topic Enforcer", status: "active" },
                    { label: "PII Masking", status: "active" },
                    { label: "Jailbreak Guard", status: "active" },
                  ].map((g) => (
                    <div key={g.label} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/20 border border-border">
                      <span className="text-xs">{g.label}</span>
                      <span className="status-dot active" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="scroll-mt-20 max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Start free, scale as you grow. All plans include the full SDK and codeswayam-auth integration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-xl p-6 border transition-all ${plan.highlight ? "border-primary/50 bg-primary/5 glow-sm" : "border-border glass"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="neural" className="px-3 py-1 gap-1">
                      <Star size={10} /> Most Popular
                    </Badge>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gradient">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlight ? "neural" : "outline"} size="sm" className="w-full">
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="relative rounded-2xl overflow-hidden border border-primary/25 bg-primary/5 p-12 text-center">
            <div className="absolute inset-0 bg-grid-sm opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] opacity-15 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)" }} />
            <div className="relative">
              <Badge variant="neural" className="mb-4 gap-1"><Brain size={11} /> Ready to Build</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Your AI infrastructure,<br />
                <span className="text-gradient">centralized in minutes</span>
              </h2>
              <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto leading-relaxed">
                Connect your first SaaS app to NeuralHub and ship AI features 10x faster. No scattered API keys, no duplicated agent logic.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="neural" size="lg" asChild>
                  <Link href={authed ? "/dashboard" : `${process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003"}/login?redirect=http%3A%2F%2Flocalhost%3A3008%2Fdashboard`}>
                    <Zap size={15} /> Open Dashboard <ArrowRight size={14} />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#docs">
                    <Code2 size={14} /> View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
