// Bulk Ad Creator — generate multiple ad scripts in one batch.
// Each row is independently sent to the same /functions/v1/chat endpoint the
// VideoStudio uses, then persisted as a draft video_projects row. Concurrency
// is capped to keep AI gateway rate limits predictable.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Sparkles, Loader2, CheckCircle2, AlertCircle,
  Layers, Zap, ArrowRight, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandKit } from "@/hooks/useBrandKit";
import { brandContextBlock } from "@/lib/brand-context";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const CONCURRENCY = 3;
const MAX_ROWS = 20;

type Status = "queued" | "running" | "done" | "failed";
type Row = {
  id: string;
  title: string;
  status: Status;
  error?: string;
  projectId?: string;
};

const FORMATS = [
  { value: "9:16", label: "Vertical 9:16 (Reels / Shorts / TikTok)" },
  { value: "16:9", label: "Horizontal 16:9 (YouTube / Web)" },
  { value: "1:1", label: "Square 1:1 (Feed / Carousel)" },
];
const DURATIONS = [
  { value: "15s", label: "15 seconds" },
  { value: "30s", label: "30 seconds" },
  { value: "60s", label: "60 seconds" },
];
const PLATFORMS = [
  "tiktok", "instagram", "facebook", "youtube", "linkedin", "general",
];
const STYLES = [
  "kinetic", "corporate", "luxury", "fun", "cinematic", "bold", "minimalist",
];

interface Props {
  onDone?: () => void;
}

export const BulkAdCreator = ({ onDone }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { kit: brandKit } = useBrandKit();

  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [cta, setCta] = useState("Learn more");
  const [format, setFormat] = useState("9:16");
  const [duration, setDuration] = useState("30s");
  const [platform, setPlatform] = useState("tiktok");
  const [style, setStyle] = useState("kinetic");
  const [bulkInput, setBulkInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  // Auto-apply brand kit defaults the first time it loads
  useEffect(() => {
    if (!brandKit) return;
    setBrand((b) => b || brandKit.business_name || "");
    setCta((c) => (c === "Learn more" && brandKit.default_cta ? brandKit.default_cta : c));
  }, [brandKit]);

  const parsedTitles = bulkInput
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_ROWS);

  const addBlank = () => {
    if (parsedTitles.length >= MAX_ROWS) return;
    setBulkInput((s) => (s ? `${s}\n` : "") + "New ad");
  };

  const generateOne = async (
    row: Row,
    accessToken: string,
  ): Promise<Row> => {
    const promptParts = [
      `Create a ${duration} ${format} ad script for: ${row.title}.`,
      brand ? `Brand: ${brand}.` : "",
      industry ? `Industry: ${industry}.` : "",
      `Platform: ${platform}.`,
      `Visual style: ${style}.`,
      `Required CTA: "${cta}".`,
      `Format: ${format}, duration ${duration}.`,
    ].filter(Boolean).join(" ") + brandContextBlock(brandKit);

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        messages: [{ role: "user", content: promptParts }],
        mode: "video",
      }),
    });
    if (!resp.ok) {
      const status = resp.status;
      let msg = `AI gateway ${status}`;
      try { const t = await resp.text(); msg = t.slice(0, 200) || msg; } catch { /* ignore */ }
      if (status === 402) msg = "Out of AI credits";
      if (status === 429) msg = "Rate limited — try fewer rows";
      throw new Error(msg);
    }
    const { result } = await resp.json();
    const cleaned = (result || "").replace(/```json\n?|```\n?/g, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch { throw new Error("AI response wasn't valid JSON"); }

    if (!user) throw new Error("Not signed in");

    const insertRow = {
      user_id: user.id,
      title: parsed.title || row.title,
      description: parsed.description || null,
      format: parsed.format || format,
      duration_type: parsed.duration_type || duration,
      platform: parsed.platform || platform,
      script: parsed,
      storyboard: parsed.scenes ?? [],
      ai_generated: true,
      status: "draft",
      template_style: style,
    };
    const { data, error } = await supabase
      .from("video_projects")
      .insert(insertRow as any)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message || "Save failed");

    return { ...row, status: "done", projectId: data.id };
  };

  const start = async () => {
    if (running) return;
    if (parsedTitles.length === 0) {
      toast({ title: "Add at least one ad title", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    const initial: Row[] = parsedTitles.map((title, i) => ({
      id: `row-${Date.now()}-${i}`,
      title,
      status: "queued",
    }));
    setRows(initial);
    setRunning(true);

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast({ title: "Session expired", variant: "destructive" });
      setRunning(false);
      return;
    }

    // Pool: up to CONCURRENCY in flight at any time.
    const queue = [...initial];
    let successCount = 0;
    let failCount = 0;

    const worker = async () => {
      while (queue.length) {
        const row = queue.shift();
        if (!row) break;
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "running" } : r));
        try {
          const finished = await generateOne(row, accessToken);
          successCount++;
          setRows((prev) => prev.map((r) => r.id === row.id ? finished : r));
        } catch (e: any) {
          failCount++;
          setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "failed", error: e?.message || "Failed" } : r));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, initial.length) }, worker));

    setRunning(false);
    if (successCount > 0) {
      toast({
        title: `Created ${successCount} draft${successCount === 1 ? "" : "s"}`,
        description: failCount ? `${failCount} failed — check the list.` : "Find them in your Creative Studio.",
      });
      onDone?.();
    } else {
      toast({ title: "All generations failed", description: "Check the rows below.", variant: "destructive" });
    }
  };

  const reset = () => {
    if (running) return;
    setRows([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Bulk Ad Creator</h2>
          <p className="text-xs text-muted-foreground">
            Paste a list — one ad title per line. Each becomes its own video project draft.
            Up to {MAX_ROWS} per batch, generated {CONCURRENCY} at a time.
          </p>
        </div>
      </div>

      {/* Shared brand settings */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shared brand settings</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Brand name</label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Acme Coffee" disabled={running} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Industry</label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Food & beverage" disabled={running} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">CTA button text</label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Shop now" disabled={running} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Visual style</label>
            <Select value={style} onValueChange={setStyle} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Format</label>
            <Select value={format} onValueChange={setFormat} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duration</label>
            <Select value={duration} onValueChange={setDuration} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Platform</label>
            <Select value={platform} onValueChange={setPlatform} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk list */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ads to create ({parsedTitles.length}/{MAX_ROWS})
          </div>
          <Button size="sm" variant="outline" onClick={addBlank} disabled={running || parsedTitles.length >= MAX_ROWS}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add row
          </Button>
        </div>
        <Textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          rows={8}
          placeholder={"Espresso machine launch sale\nNew Pumpkin Spice Latte\nWeekend buy-one-get-one promo\nFree shipping over $30"}
          disabled={running}
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          One title per line. Each will inherit the shared brand settings above.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={start} disabled={running || parsedTitles.length === 0} variant="hero">
          {running ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {parsedTitles.length}…</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Generate {parsedTitles.length || ""} {parsedTitles.length === 1 ? "ad" : "ads"}</>
          )}
        </Button>
        {rows.length > 0 && !running && (
          <Button variant="ghost" onClick={reset}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear results
          </Button>
        )}
        <Badge variant="outline" className="text-[10px]">~1–2 AI credits per ad (chat-mode)</Badge>
      </div>

      {/* Progress / results */}
      {rows.length > 0 && (
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch results</div>
          {rows.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                {r.status === "queued" && <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />}
                {r.status === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />}
                {r.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                {r.status === "failed" && <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                <span className="text-sm truncate">{r.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.status === "failed" && r.error && (
                  <span className="text-[11px] text-destructive truncate max-w-[200px]">{r.error}</span>
                )}
                {r.status === "done" && r.projectId && (
                  <Badge variant="outline" className="text-[10px]"><Video className="w-3 h-3 mr-1" />Draft saved</Badge>
                )}
              </div>
            </motion.div>
          ))}
          {!running && rows.some((r) => r.status === "done") && (
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={onDone}>
                Open Creative Studio <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkAdCreator;
