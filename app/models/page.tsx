"use client";

import { useState } from "react";
import {
  AlertCircle,
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
  Settings2,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  Trash2,
  Key as KeyIcon,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { neuralApi, ModelProvider, ModelKey } from "@/lib/neural-api";
import { useNeuralFetch } from "@/lib/hooks";
import { toast } from "sonner";
import { cn, formatNumber, formatLatency } from "@/lib/utils";
import { fetchProfile } from "@/lib/api";
import { useEffect } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";


const PROVIDER_COLORS: Record<string, string> = {
  google: "text-blue-400",
  openai: "text-emerald-400",
  anthropic: "text-orange-400",
  ollama: "text-purple-400",
  huggingface: "text-yellow-400",
  groq: "text-orange-500",
  openrouter: "text-fuchsia-400",
  together: "text-blue-500",
  deepseek: "text-cyan-400",
  custom: "text-pink-400",
};


export default function ModelsPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'superadmin';

  useEffect(() => {
    fetchProfile().then(res => {
      setAuthUser(res?.data || res);
    }).catch(() => {
      // Handle auth error if needed
    });
  }, []);

  const { data, loading, error, refetch } = useNeuralFetch(() => neuralApi.models.list());
  const { data: stats, loading: loadingStats, refetch: refetchStats } = useNeuralFetch(() => neuralApi.models.stats());

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [isAdminAdding, setIsAdminAdding] = useState(false);
  const [activeModelForKeys, setActiveModelForKeys] = useState<ModelProvider | null>(null);
  const { confirm, ConfirmDialogNode } = useConfirm();

  const [newModel, setNewModel] = useState({
    name: "",
    provider: "openai",
    modelId: "",
    apiKey: "",
    baseUrl: "",
    pointsPerRequest: 0,
    monthlyTokenLimitPerUser: 0,
    tier: "free" as any,
    supportsImageGeneration: false,
    supportsChat: true,
    supportsEmbedding: false,
  });

  const [fetchedModels, setFetchedModels] = useState<any[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFetchModels = async () => {
    if (!newModel.apiKey) {
      toast.error("Please provide an API Key first to fetch models");
      return;
    }
    setFetchingModels(true);
    try {
      const result = await neuralApi.models.fetchProviderModels(newModel.provider, newModel.apiKey, newModel.baseUrl);
      setFetchedModels(result);
      if (result.length > 0) {
        toast.success(`Fetched ${result.length} models`);
      } else {
        if (newModel.provider === 'custom' || newModel.provider === 'ollama') {
          toast.info("Discovery endpoint not found or empty. Please enter model ID manually.");
        } else {
          toast.error("No models found for the selected capabilities.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch models");
    } finally {
      setFetchingModels(false);
    }
  };

  const filteredFetchedModels = fetchedModels.filter(m => {
    if (!newModel.supportsChat && !newModel.supportsEmbedding && !newModel.supportsImageGeneration) return true;
    if (newModel.supportsChat && m.capabilities.chat) return true;
    if (newModel.supportsEmbedding && m.capabilities.embedding) return true;
    if (newModel.supportsImageGeneration && m.capabilities.image) return true;
    return false;
  });

  const getDimensionText = (modelId: string) => {
    if (!newModel.supportsEmbedding || !modelId) return null;
    // Confirmed working via diagnostic (v1beta, generativelanguage.googleapis.com)
    if (modelId.includes('gemini-embedding-2')) return '✅ ' + modelId + ' → 3072 dims (recommended)';
    if (modelId.includes('gemini-embedding-001')) return '✅ gemini-embedding-001 → 3072 dims (legacy, works)';
    if (modelId.includes('text-embedding-004')) return '❌ text-embedding-004 → not available on standard AI Studio keys';
    if (modelId.includes('text-embedding-3-small') || modelId.includes('text-embedding-ada-002')) return '⚠️ 1536 dims — OpenAI key required';
    if (modelId.includes('text-embedding-3-large')) return '⚠️ 3072 dims — OpenAI key required';
    return null;
  };

  const handleAddModel = async (type: 'byok' | 'platform') => {
    setIsSaving(true);
    try {
      if (type === 'platform') {
        await neuralApi.models.createPlatform(newModel);
        toast.success("Platform model created.");
        setIsAdminAdding(false);
      } else {
        await neuralApi.models.createByok(newModel);
        toast.success("Model registered successfully!");
        setIsAddingModel(false);
      }
      refetch();
      refetchStats();
      setNewModel({
        name: "",
        provider: "openai",
        modelId: "",
        apiKey: "",
        baseUrl: "",
        pointsPerRequest: 0,
        monthlyTokenLimitPerUser: 0,
        tier: "free",
        supportsImageGeneration: false,
        supportsChat: true,
        supportsEmbedding: false,
      });
      setFetchedModels([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to add model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = async (id: number) => {
    const ok = await confirm({
      title: "Delete Model",
      description: "Delete this model configuration? This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await neuralApi.models.delete(id);
      toast.success("Model removed.");
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Model Registry</h2>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
            Orchestrate platform-managed LLMs and your own personal providers.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchStats(); }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>

          {isAdmin && (
            <Dialog open={isAdminAdding} onOpenChange={(open) => { setIsAdminAdding(open); if(!open) setFetchedModels([]); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/5">
                  <ShieldCheck size={14} /> Add Platform Model
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Add Platform-Managed Model</DialogTitle>
                  <DialogDescription>
                    Configure a globally available model. An initial working API key is required to verify capabilities.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input placeholder="GPT-4o" value={newModel.name} onChange={e => setNewModel({...newModel, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Provider</Label>
                      <Select value={newModel.provider} onValueChange={v => { setNewModel({...newModel, provider: v, modelId: ""}); setFetchedModels([]); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="openrouter">OpenRouter</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="together">Together AI</SelectItem>
                          <SelectItem value="ollama">Ollama</SelectItem>
                          <SelectItem value="custom">Custom (OpenAI-Compat)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Seed API Key (Required for verification)</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        placeholder="sk-..." 
                        value={newModel.apiKey} 
                        onChange={e => setNewModel({...newModel, apiKey: e.target.value})} 
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={handleFetchModels} disabled={fetchingModels || !newModel.apiKey}>
                        {fetchingModels ? <Loader2 size={14} className="animate-spin mr-2" /> : <Zap size={14} className="mr-2" />}
                        Fetch
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">This key will be the first entry in the platform's key pool.</p>
                  </div>

                  {(newModel.provider === 'custom' || newModel.provider === 'ollama') && (
                    <div className="grid gap-3 border-l-2 border-primary/20 pl-3 py-2 bg-primary/5 rounded-r-md">
                      <div className="grid gap-1.5">
                        <Label htmlFor="baseUrl" className="text-[10px] uppercase tracking-wider font-bold text-primary/70">
                          {newModel.provider === 'ollama' ? 'Ollama URL' : 'Manual Endpoint URL'}
                        </Label>
                        <Input
                          id="baseUrl"
                          placeholder={newModel.provider === 'ollama' ? "http://localhost:11434" : "https://api.your-provider.com/v1"}
                          value={newModel.baseUrl}
                          onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
                          className="bg-background border-border h-8 text-xs"
                        />
                      </div>
                      
                      <p className="text-[9px] text-muted-foreground italic">
                        {newModel.provider === 'custom' 
                          ? "Tip: Use {modelId} in the URL if the endpoint requires the model name dynamically (e.g. /models/{modelId}/v1)." 
                          : "Required for local Ollama instances."}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Capabilities (Filters model list & triggers tests)</Label>
                    <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 gap-1">
                      <Button 
                        variant={newModel.supportsChat ? "neural" : "ghost"} 
                        size="sm" 
                        className="flex-1 h-8 text-[11px]"
                        onClick={() => setNewModel({...newModel, supportsChat: true, supportsImageGeneration: false, supportsEmbedding: false, modelId: ""})}
                      >Chat</Button>
                      <Button 
                        variant={newModel.supportsImageGeneration ? "neural" : "ghost"} 
                        size="sm" 
                        className="flex-1 h-8 text-[11px]"
                        onClick={() => setNewModel({...newModel, supportsChat: false, supportsImageGeneration: true, supportsEmbedding: false, modelId: ""})}
                      >Image</Button>
                      <Button 
                        variant={newModel.supportsEmbedding ? "neural" : "ghost"} 
                        size="sm" 
                        className="flex-1 h-8 text-[11px]"
                        onClick={() => setNewModel({...newModel, supportsChat: false, supportsImageGeneration: false, supportsEmbedding: true, modelId: ""})}
                      >Embedding</Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Model ID</Label>
                    {fetchedModels.length > 0 ? (
                      <div className="space-y-1">
                        <Select value={newModel.modelId} onValueChange={v => setNewModel({...newModel, modelId: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select from fetched models..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {filteredFetchedModels.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newModel.supportsEmbedding && newModel.modelId && (
                          <p className="text-[10px] text-emerald-500 font-medium">
                            {getDimensionText(newModel.modelId) ? `✅ ${getDimensionText(newModel.modelId)}` : 'Dimensions may vary'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Input placeholder="Fetch models or type manually..." value={newModel.modelId} onChange={e => setNewModel({...newModel, modelId: e.target.value})} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Tier</Label>
                      <Select value={newModel.tier} onValueChange={v => setNewModel({...newModel, tier: v as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="points">Points-Based</SelectItem>
                          <SelectItem value="premium">Premium Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newModel.tier === 'points' && (
                      <div className="grid gap-2">
                        <Label>Point Cost</Label>
                        <Input type="number" value={newModel.pointsPerRequest} onChange={e => setNewModel({...newModel, pointsPerRequest: parseInt(e.target.value) || 0})} />
                      </div>
                    )}
                    {newModel.tier === 'free' && (
                      <div className="grid gap-2">
                        <Label>Monthly Limit (Tokens)</Label>
                        <Input type="number" placeholder="0 for unlimited" value={newModel.monthlyTokenLimitPerUser} onChange={e => setNewModel({...newModel, monthlyTokenLimitPerUser: parseInt(e.target.value) || 0})} />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="neural" 
                    className="w-full" 
                    disabled={!newModel.apiKey || !newModel.name || !newModel.modelId || isSaving}
                    onClick={() => handleAddModel('platform')}
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <ShieldCheck size={14} className="mr-2" />}
                    Verify & Create Platform Model
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isAddingModel} onOpenChange={setIsAddingModel}>
            <DialogTrigger asChild>
              <Button variant="neural" size="sm">
                <Plus size={14} /> Add Your Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Bring Your Own Key (BYOK)</DialogTitle>
                <DialogDescription>
                  Configure a personal LLM provider. All selected capabilities will be tested before saving.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="My GPT-4o"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={newModel.provider}
                      onValueChange={(v) => { setNewModel({ ...newModel, provider: v, modelId: "" }); setFetchedModels([]); }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="together">Together AI</SelectItem>
                        <SelectItem value="custom">Custom (OpenAI-Compat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-..."
                      value={newModel.apiKey}
                      onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={handleFetchModels} disabled={fetchingModels || !newModel.apiKey}>
                      {fetchingModels ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Zap size={14} className="mr-2" />}
                      Fetch
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Required Capabilities (Filters list & triggers tests)</Label>
                  <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 gap-1">
                    <Button 
                      variant={newModel.supportsChat ? "neural" : "ghost"} 
                      size="sm" 
                      className="flex-1 h-8 text-[11px]"
                      onClick={() => setNewModel({...newModel, supportsChat: true, supportsImageGeneration: false, supportsEmbedding: false, modelId: ""})}
                    >Chat</Button>
                    <Button 
                      variant={newModel.supportsImageGeneration ? "neural" : "ghost"} 
                      size="sm" 
                      className="flex-1 h-8 text-[11px]"
                      onClick={() => setNewModel({...newModel, supportsChat: false, supportsImageGeneration: true, supportsEmbedding: false, modelId: ""})}
                    >Image</Button>
                    <Button 
                      variant={newModel.supportsEmbedding ? "neural" : "ghost"} 
                      size="sm" 
                      className="flex-1 h-8 text-[11px]"
                      onClick={() => setNewModel({...newModel, supportsChat: false, supportsImageGeneration: false, supportsEmbedding: true, modelId: ""})}
                    >Embedding</Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="modelId">Model ID</Label>
                  {fetchedModels.length > 0 ? (
                    <div className="space-y-1">
                      <Select value={newModel.modelId} onValueChange={v => setNewModel({...newModel, modelId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from fetched models..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {filteredFetchedModels.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newModel.supportsEmbedding && newModel.modelId && (
                        <p className={`text-[10px] font-medium ${getDimensionText(newModel.modelId)?.includes('⚠️') ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {getDimensionText(newModel.modelId) || 'Dimensions may vary'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      id="modelId"
                      placeholder="gpt-4o, gemini-1.5-pro..."
                      value={newModel.modelId}
                      onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    />
                  )}
                </div>

                {(newModel.provider === 'custom' || newModel.provider === 'ollama') && (
                  <div className="grid gap-3 border-l-2 border-border pl-3 py-2 bg-secondary/20 rounded-r-md">
                    <div className="grid gap-1.5">
                      <Label htmlFor="baseUrl" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {newModel.provider === 'ollama' ? 'Ollama URL' : 'Manual Endpoint URL'}
                      </Label>
                      <Input
                        id="baseUrl"
                        placeholder={newModel.provider === 'ollama' ? "http://localhost:11434" : "https://api.your-provider.com/v1"}
                        value={newModel.baseUrl}
                        onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
                        className="bg-background border-border h-8 text-xs"
                      />
                    </div>
                    
                    <p className="text-[9px] text-muted-foreground italic">
                      {newModel.provider === 'custom' 
                        ? "Tip: Use {modelId} in the URL if the endpoint requires the model name dynamically (e.g. /models/{modelId}/v1)." 
                        : "Required for local Ollama instances."}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="neural" 
                  className="w-full" 
                  disabled={!newModel.apiKey || (!newModel.supportsChat && !newModel.supportsImageGeneration && !newModel.supportsEmbedding) || isSaving}
                  onClick={() => handleAddModel('byok')}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <ShieldCheck size={14} className="mr-2" />}
                  Verify & Securely Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Management Dialog */}
      <KeyManagementDialog 
        model={activeModelForKeys} 
        onClose={() => setActiveModelForKeys(null)} 
        onUpdate={() => { refetch(); refetchStats(); }}
      />
      {ConfirmDialogNode}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
          <Button variant="outline" size="sm" onClick={refetch} className="ml-auto text-xs">Retry</Button>
        </div>
      )}

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 border-border/50">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Models", val: stats.totalModels, icon: Database },
            { label: "Active", val: stats.activeModels, icon: Zap },
            { label: "Req Today", val: stats.totalRequestsToday.toLocaleString(), icon: RefreshCw },
            { label: "User Models", val: stats.userModels, icon: Cpu },
          ].map((s) => (
            <Card key={s.label} className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon size={12} className="text-primary/60" />
              </div>
              <p className="text-xl font-bold">{s.val}</p>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
          <TabsTrigger value="platform">Platform Models</TabsTrigger>
          <TabsTrigger value="user">My BYOK Models</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <ModelCardSkeleton key={i} />)
            ) : (
              data?.platform.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isPlatform
                  isAdmin={isAdmin}
                  onManageKeys={() => setActiveModelForKeys(model)}
                  onDelete={() => handleDeleteModel(model.id)}
                />
              ))
            )}
            {data?.platform.length === 0 && !loading && (
              <div className="col-span-2 py-12 text-center border rounded-xl border-dashed">
                <p className="text-sm text-muted-foreground">No platform models configured by admin.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map(i => <ModelCardSkeleton key={i} />)
            ) : (
              data?.user.map((model) => (
                <ModelCard key={model.id} model={model} onDelete={() => handleDeleteModel(model.id)} />
              ))
            )}
            {data?.user.length === 0 && !loading && (
              <div className="col-span-2 py-12 text-center border rounded-xl border-dashed">
                <KeyIcon size={24} className="mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm font-medium">No personal models yet.</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                  Add your own API keys to bypass platform point deductions and use models directly.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddingModel(true)}>
                  Register First Model
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModelCard({ 
  model, 
  isPlatform, 
  isAdmin,
  onDelete, 
  onManageKeys 
}: { 
  model: ModelProvider; 
  isPlatform?: boolean; 
  isAdmin?: boolean;
  onDelete?: () => void;
  onManageKeys?: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30">
      {/* Background glow for platform models */}
      {isPlatform && model.tier !== 'free' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
              isPlatform ? "bg-primary/10 border-primary/20 group-hover:bg-primary/20" : "bg-muted/50 border-border"
            )}>
              <Cpu size={18} className={isPlatform ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">{model.name}</CardTitle>
                {model.tier === 'premium' && <ShieldCheck size={12} className="text-amber-500" />}
              </div>
              <p className={cn("text-[10px] mt-0.5 font-mono uppercase tracking-wider", PROVIDER_COLORS[model.provider.toLowerCase()] ?? "text-muted-foreground")}>
                {model.provider} · {model.modelId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={model.status === "active" ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
              {model.status}
            </Badge>
            <div className="flex gap-1.5 ml-2">
              {model.supportsChat && (
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-primary/10 text-primary border-primary/20 flex gap-1 items-center">
                  <div className="w-1 h-1 rounded-full bg-primary" /> Chat
                </Badge>
              )}
              {model.supportsImageGeneration && (
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex gap-1 items-center">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" /> Image
                </Badge>
              )}
              {model.supportsEmbedding && (
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20 flex gap-1 items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-500" /> Embedding
                </Badge>
              )}
            </div>
            {isAdmin && isPlatform && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/60 hover:text-primary" onClick={onManageKeys}>
                <Settings2 size={13} />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={onDelete}>
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Context", val: formatNumber(model.contextWindow) },
            { label: "Req Today", val: model.requestsToday.toLocaleString() },
            { label: "Latency", val: model.avgLatencyMs > 0 ? formatLatency(model.avgLatencyMs) : "—" },
            { label: isPlatform ? "Points" : "Mode", val: isPlatform ? (model.pointsPerRequest > 0 ? `${model.pointsPerRequest} pts` : "Free") : "BYOK" },
          ].map((m) => (
            <div key={m.label} className="bg-muted/20 rounded-lg p-2 border border-border/50 text-center">
              <p className="text-[11px] font-bold">{m.val}</p>
              <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Visibility/Usage Info */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              {model.usageType === 'managed' ? <Database size={10} /> : <Zap size={10} />}
              {model.usageType.toUpperCase()}
            </span>
            {isPlatform && (
              <span className="flex items-center gap-1 text-primary/80">
                <KeyIcon size={10} />
                {model.keysCount} KEY{model.keysCount !== 1 ? 'S' : ''} POOLED
              </span>
            )}
            {model.supportsEmbedding && (() => {
              const mid = model.modelId;
              const dim = mid.includes('3-large') || mid.includes('gemini-embedding-001') ? 3072
                : mid.includes('3-small') || mid.includes('ada-002') ? 1536
                : mid.includes('gemini-embedding-2') ? 3072
                : 768;
              const ok = dim === 3072; // gemini-embedding-001 is the confirmed working model
              return (
                <span className={`flex items-center gap-1 font-mono ${ok ? 'text-blue-400/80' : 'text-amber-400/80'}`}>
                  {ok ? '✓' : '⚠'} {dim}-dim
                </span>
              );
            })()}
            {model.tier === 'free' && model.monthlyTokenLimitPerUser > 0 && (
              <span className="flex items-center gap-1 text-amber-500/80">
                <Settings2 size={10} />
                {model.monthlyTokenLimitPerUser.toLocaleString()} TOKENS/MO LIMIT
              </span>
            )}
          </div>
          {model.baseUrl && (
            <span className="text-muted-foreground flex items-center gap-1">
              Custom Endpoint <ExternalLink size={10} />
            </span>
          )}
        </div>

        {/* Progress Bar for traffic share */}
        {model.totalRequests > 0 && (
          <div className="space-y-1">
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/40 transition-all duration-700"
                style={{ width: `${(model.requestsToday / (model.totalRequests || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KeyManagementDialog({ model, onClose, onUpdate }: { model: ModelProvider | null; onClose: () => void; onUpdate: () => void }) {
  const { data: keys, loading, refetch } = useNeuralFetch(() => model ? neuralApi.models.listKeys(model.id) : Promise.resolve([]), [model?.id]);
  const [newKey, setNewKey] = useState({ apiKey: "", label: "", weight: 1 });
  const [testing, setTesting] = useState<number | 'new' | null>(null);

  const handleTestKey = async (id: number | 'new', key?: string) => {
    if (!model) return;
    
    setTesting(id);
    try {
      let res;
      if (id === 'new') {
        if (!newKey.apiKey) {
          setTesting(null);
          return toast.error("Please enter an API key first");
        }
        res = await neuralApi.models.testKey({
          provider: model.provider,
          modelId: model.modelId,
          apiKey: newKey.apiKey,
          baseUrl: model.baseUrl,
        });
      } else {
        res = await neuralApi.models.testKeyById(id as number); // Note: testKeyById would need model override support too, or we just test new keys
      }

      if (res.success) {
        toast.success(`Connection verified! Latency: ${res.latency}ms`);
      } else {
        toast.error(`Verification failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleAddKey = async () => {
    if (!model) return;
    try {
      await neuralApi.models.addKey(model.id, newKey);
      toast.success("API Key added to pool.");
      setNewKey({ apiKey: "", label: "", weight: 1 });
      refetch();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to add key");
    }
  };

  const handleToggleKeyStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'revoked' : 'active';
      await neuralApi.models.updateKeyStatus(id, newStatus);
      toast.success(`Key ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      refetch();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Toggle failed");
    }
  };

  return (
    <Dialog open={!!model} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 size={18} />
            Manage Key Pool: {model?.name}
          </DialogTitle>
          <DialogDescription>
            Traffic is automatically distributed across all active keys in this pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-end">
            <div className="grid gap-1.5">
              <Label className="text-[10px] uppercase">New API Key</Label>
              <Input placeholder="sk-..." value={newKey.apiKey} onChange={e => setNewKey({...newKey, apiKey: e.target.value})} className="h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] uppercase">Weight</Label>
              <Input type="number" value={newKey.weight} onChange={e => setNewKey({...newKey, weight: parseInt(e.target.value)})} className="h-8 text-xs" />
            </div>
            <div className="flex gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleTestKey('new')} 
                disabled={testing === 'new'}
                title="Test Connection"
              >
                <Zap size={16} className={testing === 'new' ? "animate-pulse text-yellow-400" : ""} />
              </Button>
              <Button variant="neural" size="icon" onClick={handleAddKey}>
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-2 font-medium">Label/Key</th>
                  <th className="text-center p-2 font-medium">Usage</th>
                  <th className="text-center p-2 font-medium">Status</th>
                  <th className="text-right p-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys?.map((k: ModelKey) => (
                  <tr key={k.id} className="hover:bg-muted/30">
                    <td className="p-2">
                      <div className="font-mono">{k.keyPreview}</div>
                      <div className="text-[10px] text-muted-foreground">{k.label || `Key #${k.id}`}</div>
                    </td>
                    <td className="p-2 text-center">
                      <div>{k.usageToday} today</div>
                      <div className="text-[10px] text-muted-foreground">{k.usageCount} total</div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={k.status === 'active' ? 'success' : 'secondary'} className="text-[8px] px-1 py-0">
                        {k.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-yellow-400" 
                          onClick={() => handleTestKey(k.id)}
                          disabled={testing === k.id}
                        >
                          <Zap size={12} className={testing === k.id ? "animate-pulse" : ""} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-6 w-6",
                            k.status === 'active' ? "text-muted-foreground hover:text-red-400" : "text-emerald-500 hover:text-emerald-400"
                          )}
                          onClick={() => handleToggleKeyStatus(k.id, k.status)}
                          title={k.status === 'active' ? "Deactivate Key" : "Activate Key"}
                        >
                          {k.status === 'active' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!keys || keys.length === 0) && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No keys in pool. Model will use fallback environment key.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModelCardSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  );
}
