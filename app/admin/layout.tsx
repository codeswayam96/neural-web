"use client";

import { useEffect, useState } from "react";
import { useCSWUser } from "@codeswayam/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, LayoutDashboard, Bot, Cpu, Workflow,
  Globe, FileText, Sparkles, ChevronRight, Brain, Loader2, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/agents", label: "All Agents", icon: Bot },
  { href: "/admin/models", label: "Platform Models", icon: Cpu },
  { href: "/admin/workflows", label: "All Workflows", icon: Workflow },
  { href: "/admin/domains", label: "Trusted Domains", icon: Globe },
  { href: "/admin/logs", label: "Request Logs", icon: FileText },
  { href: "/admin/prompt-config", label: "Auto-Generate Config", icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useCSWUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    const role = (user as any)?.role;
    if (!isSignedIn || (role !== "admin" && role !== "superadmin")) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [isLoaded, isSignedIn, user]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Brain size={32} className="text-primary animate-pulse" />
          <p className="text-sm font-medium">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 border-r border-border flex flex-col bg-background/95 backdrop-blur transition-transform duration-300 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <ShieldCheck size={14} className="text-red-400" />
          </div>
          <div>
            <span className="font-bold text-sm">Neural<span className="text-red-400">Admin</span></span>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {adminNav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/admin";
            const exactActive = item.exact && pathname === item.href;
            const isActive = active || exactActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon size={14} />
                {item.label}
                {isActive && <ChevronRight size={10} className="ml-auto text-red-400/60" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <LayoutDashboard size={13} />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/95">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={16} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-sm font-semibold capitalize">
                {adminNav.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label || "Admin"}
              </h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">NeuralHub Platform Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 sm:px-3 py-1.5 rounded-lg">
            <ShieldCheck size={12} />
            <span className="hidden sm:inline">{(user as any)?.role?.toUpperCase()} ACCESS</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
