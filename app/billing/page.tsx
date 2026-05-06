"use client";

import { useState } from "react";
import { 
  CreditCard, Zap, History, TrendingUp, 
  ArrowUpRight, ShoppingBag, ShieldCheck, 
  RefreshCw, Plus, Clock, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useCSWCredits, 
  useCSWSubscriptions,
  CreditBadge,
  BuyCreditsModal,
} from "@codeswayam/auth";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function BillingPage() {
  const { wallet, transactions, isLoading: walletLoading, refresh: refetchWallet } = useCSWCredits();
  const { subscriptions } = useCSWSubscriptions();
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const stats = [
    { 
      label: "Current Balance", 
      value: wallet?.balance?.toLocaleString() || "0", 
      suffix: "pts",
      icon: Zap, 
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    { 
      label: "Lifetime Earned", 
      value: wallet?.lifetimeEarned?.toLocaleString() || "0", 
      suffix: "pts",
      icon: TrendingUp, 
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    { 
      label: "Lifetime Spent", 
      value: wallet?.lifetimeSpent?.toLocaleString() || "0", 
      suffix: "pts",
      icon: ShoppingBag, 
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      label: "Active Plan", 
      value: subscriptions?.[0]?.bundleName || subscriptions?.[0]?.productName || "Free", 
      suffix: "",
      icon: ShieldCheck, 
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <BuyCreditsModal 
        open={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
        onSuccess={() => refetchWallet()}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your AI points, track spending, and upgrade your subscription.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchWallet()}>
            <RefreshCw size={14} className={walletLoading ? "animate-spin" : ""} />
          </Button>
          <Button variant="neural" onClick={() => setIsBuyModalOpen(true)}>
            <Plus size={16} /> Buy Points
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono tracking-tighter">
                    SYNCED
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <h3 className="text-2xl font-bold">
                    {s.value}<span className="text-xs ml-1 text-muted-foreground font-normal">{s.suffix}</span>
                  </h3>
                </div>
              </CardContent>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Transaction History */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <History size={18} className="text-primary" />
                Usage History
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed log of your point consumption and top-ups.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="divide-y divide-border/50">
              {walletLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-secondary rounded" />
                      <div className="h-2 w-1/4 bg-secondary rounded" />
                    </div>
                    <div className="h-4 w-12 bg-secondary rounded" />
                  </div>
                ))
              ) : transactions?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Clock size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No transactions found yet.</p>
                </div>
              ) : (
                transactions?.map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg border border-border flex items-center justify-center shrink-0 ${
                        t.points > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                      }`}>
                        {t.points > 0 ? <Plus size={14} /> : <Zap size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {t.createdAt ? format(new Date(t.createdAt), "MMM d, yyyy · HH:mm") : 'N/A'}
                          {t.saasId && <span className="bg-muted px-1 rounded uppercase tracking-tighter text-[8px] font-bold ml-2">{t.saasId}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${t.points > 0 ? "text-emerald-400" : "text-foreground"}`}>
                        {t.points > 0 ? "+" : ""}{t.points.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Plan & Credits Card */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <CardHeader className="pb-3">
              <Badge variant="neural" className="w-fit mb-2">CURRENT PLAN</Badge>
              <CardTitle className="text-xl">{subscriptions?.[0]?.bundleName || subscriptions?.[0]?.productName || "Free Explorer"}</CardTitle>
              <CardDescription className="text-xs">
                Perfect for developers building AI-powered SaaS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Monthly Quota Usage</span>
                  <span className="font-bold">75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-primary to-fuchsia-500 rounded-full" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Resets in <span className="text-foreground font-medium">12 days</span>.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck size={14} className="text-primary" />
                  <span>5 Registered Apps</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap size={14} className="text-primary" />
                  <span>Priority Model Access</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                  <ArrowUpRight size={14} />
                  <span>Unlimited Managed Models</span>
                </div>
              </div>

              <Button variant="neural" className="w-full">Manage Subscription</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                Quick Top-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "1K Points", price: "₹99", pts: 1000 },
                { label: "5K Points", price: "₹399", pts: 5000, hot: true },
                { label: "15K Points", price: "₹999", pts: 15000 },
              ].map((pack) => (
                <button
                  key={pack.pts}
                  onClick={() => setIsBuyModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="text-left">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      {pack.label}
                      {pack.hot && <Badge variant="neural" className="text-[8px] h-3 px-1">BEST VALUE</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{pack.price}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:text-primary transition-all">
                    <Plus size={14} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
