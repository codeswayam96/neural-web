"use client";
import { motion } from "framer-motion";
import { X, Zap, Cpu, Globe, Code, RefreshCw, Share2, ArrowRight } from "lucide-react";

const NODE_TYPES = [
  {
    type: "trigger",
    emoji: "⚡",
    icon: <Zap size={24} className="text-amber-400" />,
    label: "Start this workflow",
    tagline: "When something happens...",
    description: "Your workflow begins when data arrives from another app, a form, or a schedule.",
    examples: ["New form submission", "Stripe payment received", "Scheduled daily report"],
    color: { bg: "bg-amber-500/10", border: "border-amber-500/30", hover: "hover:border-amber-500/60 hover:bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  },
  {
    type: "agent",
    emoji: "🤖",
    icon: <Cpu size={24} className="text-blue-400" />,
    label: "Process with AI",
    tagline: "Let AI handle the thinking...",
    description: "Send data to an AI agent to generate text, summarize, classify, translate, or analyze content.",
    examples: ["Summarize customer feedback", "Generate a reply email", "Classify as spam or not"],
    color: { bg: "bg-blue-500/10", border: "border-blue-500/30", hover: "hover:border-blue-500/60 hover:bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  },
  {
    type: "http",
    emoji: "🌐",
    icon: <Share2 size={24} className="text-pink-400" />,
    label: "Call another app",
    tagline: "Send data somewhere...",
    description: "Post data to any website, API, or service — like Slack, Notion, your own backend, or any webhook.",
    examples: ["Post to Slack", "Create a Notion page", "Update your database"],
    color: { bg: "bg-pink-500/10", border: "border-pink-500/30", hover: "hover:border-pink-500/60 hover:bg-pink-500/15", text: "text-pink-400", dot: "bg-pink-400" },
  },
  {
    type: "logic",
    emoji: "🔀",
    icon: <Code size={24} className="text-purple-400" />,
    label: "Make a decision",
    tagline: "Route based on conditions...",
    description: "Check a value and take different paths — like 'if score is high, go to success; otherwise, flag for review'.",
    examples: ["Route VIP vs regular users", "Check if email is valid", "Branch on AI sentiment"],
    color: { bg: "bg-purple-500/10", border: "border-purple-500/30", hover: "hover:border-purple-500/60 hover:bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  },
  {
    type: "transform",
    emoji: "🔄",
    icon: <RefreshCw size={24} className="text-emerald-400" />,
    label: "Reshape the data",
    tagline: "Clean up or restructure...",
    description: "Pick only the fields you need, rename them, or reformat data before passing it to the next step.",
    examples: ["Extract name & email only", "Rename 'user_id' to 'id'", "Flatten nested JSON"],
    color: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", hover: "hover:border-emerald-500/60 hover:bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  },
];

interface Props {
  onSelect: (type: string, label: string) => void;
  onClose: () => void;
}

export function NodePickerModal({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-secondary/20 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-base">What should this step do?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pick the action that best describes what you want to happen next</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Node type cards */}
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {NODE_TYPES.map((n, i) => (
            <motion.button
              key={n.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { onSelect(n.type, n.label); onClose(); }}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left group ${n.color.bg} ${n.color.border} ${n.color.hover}`}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-background/60 border border-white/10 flex items-center justify-center shrink-0 text-xl">
                {n.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-bold text-sm ${n.color.text}`}>{n.label}</p>
                  <span className="text-[10px] text-muted-foreground italic">{n.tagline}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{n.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {n.examples.map(ex => (
                    <span key={ex} className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 border border-border text-muted-foreground">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={16} className={`shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 ${n.color.text}`} />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
