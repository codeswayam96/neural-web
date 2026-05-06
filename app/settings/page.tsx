"use client";

import { 
  Shield, 
  User, Lock, 
  Trash2,
  BellRing, Laptop, Zap, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useCSWUser } from "@codeswayam/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAuthUrl } from "@/lib/auth";

export default function SettingsPage() {
  const { user } = useCSWUser();

  const openSSOSettings = (path = "") => {
    window.open(`${getAuthUrl()}${path}`, "_blank");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your NeuralHub AI defaults. Account and security settings are managed via your SSO profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 relative group">
                  <User size={32} className="text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] shadow-sm">
                    ✨
                  </div>
                </div>
                <h2 className="font-bold">{user?.name || "—"}</h2>
                <p className="text-xs text-muted-foreground mt-1">{user?.email || "—"}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">{(user as any)?.role || "Member"}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase border-emerald-500/30 text-emerald-500 bg-emerald-500/5">Verified</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full text-xs gap-1.5"
                  onClick={() => openSSOSettings()}
                >
                  <ExternalLink size={11} />
                  Manage Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings nav */}
          <nav className="space-y-1">
            {[
              { label: "AI Defaults", icon: Zap, active: true, local: true },
              { label: "Security & Access", icon: Lock, local: false, url: "/account/profile" },
              { label: "Notifications", icon: BellRing, local: false, url: "/account/preferences" },
              { label: "Devices & Sessions", icon: Laptop, local: false, url: "/account/security" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { if (!item.local) openSSOSettings(item.url); }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                  item.active
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon size={16} />
                  {item.label}
                </span>
                {!item.local && <ExternalLink size={11} className="opacity-50" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* SSO Account Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <Shield size={16} className="text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Account managed by Codeswayam SSO</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your profile, password, 2FA, and active sessions are managed centrally via the Codeswayam identity platform.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs gap-1.5"
              onClick={() => openSSOSettings()}
            >
              <ExternalLink size={11} />
              Open SSO Settings
            </Button>
          </div>

          {/* AI Defaults */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Global AI Defaults
              </CardTitle>
              <CardDescription className="text-xs">
                Standard behavior for agents when specific overrides are missing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Automatic Model Fallback</p>
                    <p className="text-[10px] text-muted-foreground">Switch to Gemini 1.5 Flash if primary model fails.</p>
                  </div>
                  <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Strict Content Filtering</p>
                    <p className="text-[10px] text-muted-foreground">Block all potentially harmful AI generations.</p>
                  </div>
                  <div className="w-10 h-5 bg-secondary rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Max Context Tokens</Label>
                <select className="w-full h-9 bg-secondary/30 border border-border px-3 rounded-lg text-sm outline-none">
                  <option>Standard (4,096 tokens)</option>
                  <option>Extended (32,768 tokens)</option>
                  <option>Full (128,000 tokens)</option>
                </select>
              </div>

              <Button
                variant="neural"
                size="sm"
                onClick={() => toast.success("AI defaults saved")}
              >
                <Shield size={13} className="mr-1.5" />
                Save AI Defaults
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-base text-red-500 flex items-center gap-2">
                <Trash2 size={18} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Permanently delete all your AI configurations, knowledge bases, and API keys. This action cannot be undone.
              </p>
              <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 h-9 text-xs">
                Purge All AI Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
