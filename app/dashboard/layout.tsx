"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, LayoutDashboard, Bot, Cpu, Key,
  BookOpen, Workflow, BarChart3, Settings,
  ChevronRight, Zap, Bell, User, ImageIcon, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@codeswayam/auth";
import { Button } from "@/components/ui/button";
import { useCSWUser, useCSWCredits, AuthGuard } from "@codeswayam/auth";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: Cpu, label: "Models", href: "/models" },
  { icon: ImageIcon, label: "Image Generation", href: "/image-generation" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge-base" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Key, label: "API Keys", href: "/api-keys" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function DashboardShell({ 
  children,
  showSidebar = true,
  showTopBar = true,
}: { 
  children: React.ReactNode;
  showSidebar?: boolean;
  showTopBar?: boolean;
}) {
  const pathname = usePathname();
  const { user, isSignedIn } = useCSWUser();
  const { wallet } = useCSWCredits();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-56 shrink-0 glass-strong border-r border-border flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain size={14} className="text-primary" />
            </div>
            <span className="font-bold text-sm">
              Neural<span className="text-primary">Hub</span>
            </span>
            <Badge variant="neural" className="text-[9px] px-1.5 py-0 ml-auto">v1</Badge>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                    active
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon size={14} className={active ? "text-primary" : ""} />
                  {item.label}
                  {active && <ChevronRight size={10} className="ml-auto text-primary/60" />}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar user footer */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <User size={13} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name || "—"}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email || "—"}</p>
                  {wallet?.balance !== undefined && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1 rounded">
                      <Zap size={8} fill="currentColor" />
                      {wallet.balance.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isSignedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout();
                  window.location.href = "/";
                }}
                className="w-full h-8 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/20"
              >
                Sign Out
              </Button>
            )}
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showTopBar && (
          <header className="h-14 shrink-0 border-b border-border glass-strong flex items-center justify-between px-6">
            <div>
              <h1 className="text-sm font-semibold text-foreground capitalize">
                {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
              </h1>
              <p className="text-[10px] text-muted-foreground">neural.codeswayam.com</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="status-dot active" />
                All systems operational
              </div>
              <ThemeToggle />
              <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors relative">
                <Bell size={14} className="text-muted-foreground" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs text-primary hover:bg-primary/20 transition-colors">
                <Zap size={11} /> Upgrade
              </button>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-6 bg-grid-sm">{children}</main>
      </div>
    </div>
  );
}

/**
 * DashboardLayout — wraps all authenticated dashboard pages.
 * Uses AuthGuard from @codeswayam/auth to enforce SSO session.
 * Unauthenticated users are automatically redirected to the SSO login.
 */
export default function DashboardLayout({ 
  children,
  showSidebar = true,
  showTopBar = true,
}: { 
  children: React.ReactNode;
  showSidebar?: boolean;
  showTopBar?: boolean;
}) {
  return (
    <AuthGuard
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Brain size={32} className="text-primary animate-pulse" />
            <p className="text-sm font-medium">Authenticating via SSO…</p>
          </div>
        </div>
      }
    >
      <DashboardShell showSidebar={showSidebar} showTopBar={showTopBar}>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
