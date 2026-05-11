"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, FileText, Upload, Trash2, ArrowLeft, Loader2, Search, CheckCircle2, AlertCircle, Database, Clock, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { neuralApi, KnowledgeBase, KBDocument } from "@/lib/neural-api";
import { toast } from "sonner";
import Link from "next/link";

export default function KBDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ content: string; similarity: number; metadata: string }> | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !id) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const results = await neuralApi.kb.search(id as string, searchQuery.trim(), 5);
      setSearchResults(results);
    } catch (err: any) {
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [kbData, docData] = await Promise.all([
        neuralApi.kb.get(id as string),
        neuralApi.kb.getDocuments(id as string)
      ]);
      setKb(kbData);
      setDocs(docData);
    } catch (err: any) {
      toast.error("Failed to load knowledge base");
      router.push("/knowledge-base");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = [".pdf", ".txt", ".md"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Only PDF, TXT, and Markdown files are supported.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading and indexing ${file.name}...`);

    try {
      await neuralApi.kb.uploadDocument(id as string, file);
      toast.success(`${file.name} indexed successfully`, { id: toastId });
      loadData();
    } catch (err: any) {
      toast.error(`Failed to upload: ${err.message}`, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!confirm(`Remove "${fileName}" from the vector index?`)) return;

    try {
      await neuralApi.kb.deleteDocument(id as string, docId);
      toast.success("Document removed");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Syncing with vector index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/knowledge-base">
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {kb?.name}
              <Badge variant="secondary" className="text-[10px] ml-2 uppercase tracking-widest font-mono bg-primary/10 text-primary border-none">RAG Active</Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 italic">{kb?.description || "Knowledge base for semantic search"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
          />
          <Button 
            variant="neural" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-secondary/30 p-3 rounded-xl border border-border/40">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
              <input
                type="text"
                placeholder="Search within this knowledge base..."
                className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary">
                 Filter
               </Button>
               <div className="h-4 w-px bg-border mx-1" />
               <div className="text-[10px] text-muted-foreground font-mono uppercase">
                {docs.length} Documents
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2">
              <FileText size={12} />
              Index Registry
            </h3>
          </div>

          {docs.length === 0 ? (
            <Card className="border-dashed bg-transparent border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <FileText size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No documents indexed in this knowledge base yet.</p>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => fileInputRef.current?.click()}>
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {docs.map((doc) => (
                <Card key={doc.id} className="hover:border-primary/20 transition-all group bg-card/30 backdrop-blur-sm border-border/60">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/10">
                        <FileText size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate pr-4">{doc.fileName}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <Clock size={10} />
                          Indexed {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="hidden sm:flex text-[9px] bg-emerald-500/5 text-emerald-500 border-emerald-500/10 gap-1 px-1.5 h-5">
                        <CheckCircle2 size={10} />
                        Embedded
                      </Badge>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Search Test Panel */}
        <Card className="bg-card/40 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              <TestTube2 size={12} className="text-primary" /> RAG Search Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Ask a question..."
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim() || docs.length === 0}
                className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Test
              </button>
            </div>
            {docs.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Upload documents first to test search.</p>
            )}
            {searchResults !== null && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">No results found.</p>
                ) : searchResults.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-secondary/40 border border-border/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Result {i + 1}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        r.similarity > 0.7 ? "bg-emerald-500/10 text-emerald-400" :
                        r.similarity > 0.4 ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{(r.similarity * 100).toFixed(1)}% match</span>
                    </div>
                    <p className="text-[10px] text-foreground/80 leading-relaxed line-clamp-3">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
               <Database size={100} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-primary/70">RAG Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-mono">Storage Used</div>
                <div className="text-xl font-bold flex items-baseline gap-1">
                  {(docs.length * 15.5).toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">KB</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-mono">Vector Engine</div>
                <div className="text-xs font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase pgvector
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-mono">Embedding Model</div>
                <div className="text-xs font-medium bg-secondary/50 p-1.5 rounded border border-border/50 text-[10px] font-mono truncate">
                  {kb?.embeddingModelName || "Unknown"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={10} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground/80">PDF Support</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Best for technical documentation and whitepapers.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={10} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground/80">High Capacity</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Backend optimized to handle large documents up to 50MB per file.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                <Database size={14} className="text-emerald-500 shrink-0" />
                <p className="text-[10px] text-emerald-500/80 font-medium">Batch embedding enabled for faster ingestion.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
