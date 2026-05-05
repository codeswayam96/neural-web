import Link from "next/link";
import { Brain, Code2, Globe, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "AI Agents", href: "/agents" },
    { label: "Model Registry", href: "/models" },
    { label: "Knowledge Base", href: "/knowledge-base" },
    { label: "Workflows", href: "/workflows" },
    { label: "Analytics", href: "/analytics" },
    { label: "API Keys", href: "/api-keys" },
  ],
  Developers: [
    { label: "Documentation", href: "#docs" },
    { label: "API Reference", href: "#api" },
    { label: "@codeswayam/neural SDK", href: "#sdk" },
    { label: "OpenAI-Compatible API", href: "#openai-compat" },
    { label: "LangChain Integration", href: "#langchain" },
    { label: "Changelog", href: "#changelog" },
  ],
  Platform: [
    { label: "codeswayam-auth", href: "http://localhost:3003", external: true },
    { label: "AuraFlow", href: "#", external: true },
    { label: "EMS", href: "#", external: true },
    { label: "Status", href: "#status" },
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:glow-sm transition-all">
                <Brain size={16} className="text-primary" />
              </div>
              <span className="font-bold text-lg">
                Neural<span className="text-primary">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              The single source of intelligence for your entire SaaS platform.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/codeswayam"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                aria-label="GitHub"
              >
                <Code2 size={14} />
              </a>
              <a
                href="https://codeswayam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                aria-label="Website"
              >
                <Globe size={14} />
              </a>
              <a
                href="mailto:support@codeswayam.com"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                aria-label="Email"
              >
                <Mail size={14} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                      {"external" in link && link.external && (
                        <ExternalLink size={10} className="opacity-50" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Codeswayam. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Part of the{" "}
            <a
              href="https://codeswayam.com"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Codeswayam Platform
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
