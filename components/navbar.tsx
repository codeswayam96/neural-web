"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Bot,
  Cpu,
  Key,
  BookOpen,
  Workflow,
  BarChart3,
  Settings,
  Zap,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCSWUser, logout } from "@codeswayam/auth";
import { getNeuralAuthUrls } from "@/lib/auth-url";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Agents", href: "#agents" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

const productLinks = [
  { icon: LayoutDashboard, label: "Dashboard", desc: "Platform overview & metrics", href: "/dashboard" },
  { icon: Bot, label: "AI Agents", desc: "Build & deploy named agents", href: "/agents" },
  { icon: Cpu, label: "Model Registry", desc: "Manage LLM providers & keys", href: "/models" },
  { icon: BookOpen, label: "Knowledge Base", desc: "RAG & document ingestion", href: "/knowledge-base" },
  { icon: Workflow, label: "Workflows", desc: "Multi-step AI automation", href: "/workflows" },
  { icon: BarChart3, label: "Analytics", desc: "Usage, cost & latency insights", href: "/analytics" },
  { icon: Key, label: "API Keys", desc: "Issue & manage app keys", href: "/api-keys" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isSignedIn } = useCSWUser();
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "superadmin";
  const { loginUrl, profileUrl } = getNeuralAuthUrls();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/";
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "glass-strong border-b border-border/60 shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="NeuralHub Home"
        >
          <div className="relative w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:glow-sm transition-all">
            <Brain size={16} className="text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse-ring" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Neural<span className="text-primary">Hub</span>
          </span>
          <Badge variant="neural" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
            v1.0
          </Badge>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Product dropdown */}
          <div className="relative">
            <button
              id="nav-product"
              onClick={() => setProductOpen((p) => !p)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Product
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  productOpen && "rotate-180"
                )}
              />
            </button>
            {productOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProductOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 w-72 glass-strong rounded-xl p-2 shadow-xl shadow-black/40 border border-border z-50">
                  {productLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setProductOpen(false)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <item.icon size={13} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-none mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA — Auth-aware */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Button variant="neural" size="sm" asChild>
                <Link href="/dashboard">
                  <Zap size={13} />
                  Dashboard
                </Link>
              </Button>
              {/* User avatar with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors"
                  title={user?.name || "Account"}
                >
                  {userInitials}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute top-full mt-2 right-0 w-56 glass-strong rounded-xl p-2 shadow-xl shadow-black/40 border border-border z-50">
                      <div className="px-3 py-2.5 border-b border-border mb-1">
                        <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Settings size={14} /> Settings
                      </Link>
                      <a
                        href={profileUrl}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <User size={14} /> Profile & Account
                      </a>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <ShieldCheck size={14} /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href={loginUrl}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Button variant="neural" size="sm" asChild>
                <Link href={loginUrl}>
                  <Zap size={13} />
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          id="nav-mobile-toggle"
          className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-strong border-t border-border">
          <div className="px-4 py-4 space-y-1">
            {productLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <item.icon size={14} className="text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-border my-2 pt-2 flex flex-col gap-2">
              {isSignedIn ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{user?.name || "User"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
                    </div>
                  </div>
                  <Button variant="neural" size="sm" asChild className="w-full">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Zap size={13} />
                      Open Dashboard
                    </Link>
                  </Button>
                  <a
                    href={profileUrl}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <User size={14} /> Profile & Account
                  </a>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <ShieldCheck size={14} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { setOpen(false); handleSignOut(); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={loginUrl}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Button variant="neural" size="sm" asChild className="w-full">
                    <Link href={loginUrl} onClick={() => setOpen(false)}>
                      <Zap size={13} />
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
