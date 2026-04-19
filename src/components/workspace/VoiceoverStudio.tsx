import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Sparkles, Upload, Play, Pause, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "Male", style: "Warm, narrator" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Female", style: "Clear, friendly" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "Female", style: "Conversational" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "Male", style: "Confident, ad" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "Female", style: "Bright, energetic" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", gender: "Male", style: "Casual, podcast" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "Male", style: "Deep, dramatic" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "Female", style: "Youthful, upbeat" },
];

type Voiceover = {
  id: string;
  source: string;
  voice_id: string | null;
  script: string | null;
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
};

interface VoiceoverStudioProps {
  videoId?: string | null;
  onSelect?: (vo: Voiceover & { url: string }) => void;
  selectedId?: string | null;
  initialScript?: string | null;
}

export function VoiceoverStudio({ videoId, onSelect, selectedId, initialScript }: VoiceoverStudioProps) {
  const { user } = useAuth();
  const [voiceovers, setVoiceovers] = useState<Voiceover[]>([]);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState(initialScript ?? "");

  // Auto-populate when an initial script becomes available (e.g., after video generation)
  useEffect(() => {
    if (initialScript && !script.trim()) {
      setScript(initialScript.slice(0, 5000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScript]);
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    loadVoiceovers();
    return () => {
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const loadVoiceovers = async () => {
    setLoading(true);
    let q = supabase.from("voiceovers").select("*").order("created_at", { ascending: false }).limit(20);
    if (videoId) q = q.eq("video_id", videoId);
    const { data, error } = await q;
    if (!error) setVoiceovers((data ?? []) as Voiceover[]);
    setLoading(false);
  };

  const getUrl = async (path: string): Promise<string | null> => {
    const cached = urlCacheRef.current.get(path);
    if (cached) return cached;
    const { data, error } = await supabase.functions.invoke("get-audio-url", { body: { path } });
    if (error || !data?.url) return null;
    urlCacheRef.current.set(path, data.url);
    return data.url;
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error("Enter a script first");
      return;
    }
    if (script.length > 5000) {
      toast.error("Script too long (max 5000 chars)");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-voiceover", {
        body: { script: script.trim(), voiceId, videoId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Voice-over generated! (-2 credits)");
      setScript("");
      if (data?.url && data?.voiceover) {
        urlCacheRef.current.set(data.voiceover.storage_path, data.url);
      }
      loadVoiceovers();
    } catch (err: any) {
      toast.error(err?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File too large (max 15 MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${user.id}/voiceovers/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("audio-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("voiceovers").insert({
        user_id: user.id,
        video_id: videoId,
        source: "upload",
        script: file.name.replace(/\.[^.]+$/, ""),
        storage_path: path,
      });
      if (insErr) throw insErr;
      toast.success("Voice-over uploaded");
      loadVoiceovers();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const togglePlay = async (vo: Voiceover) => {
    if (playingId === vo.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const url = await getUrl(vo.storage_path);
    if (!url) {
      toast.error("Could not load audio");
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(vo.id);
    audio.play().catch(() => setPlayingId(null));
  };

  const handleSelect = async (vo: Voiceover) => {
    const url = await getUrl(vo.storage_path);
    if (!url) {
      toast.error("Could not load audio");
      return;
    }
    onSelect?.({ ...vo, url });
  };

  const handleDelete = async (vo: Voiceover) => {
    if (!confirm("Delete this voice-over?")) return;
    await supabase.storage.from("audio-assets").remove([vo.storage_path]);
    await supabase.from("voiceovers").delete().eq("id", vo.id);
    loadVoiceovers();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mic className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Voice-overs</h3>
          <p className="text-xs text-muted-foreground">AI narration or upload your own</p>
        </div>
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="grid grid-cols-2 h-8 mb-3">
          <TabsTrigger value="generate" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Generate</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs"><Upload className="w-3 h-3 mr-1" />Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Voice</label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.name} <span className="text-muted-foreground ml-1">— {v.style}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Script</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Type or paste your script... (e.g. 'Introducing the future of productivity. Built for teams who move fast.')"
              className="text-xs min-h-[100px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>~{Math.max(1, Math.round((script.length / 5 / 150) * 60))}s estimated</span>
              <span>{script.length}/5000</span>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating || !script.trim()} className="w-full" size="sm">
            {generating ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate (2 credits)</>}
          </Button>
        </TabsContent>

        <TabsContent value="upload">
          <input type="file" id="vo-upload" accept="audio/mpeg,audio/mp3,audio/wav" className="hidden" onChange={handleUpload} disabled={uploading} />
          <label htmlFor="vo-upload">
            <div className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-medium">Drop or click to upload</p>
                  <p className="text-[10px] text-muted-foreground mt-1">MP3 or WAV · max 15 MB</p>
                </>
              )}
            </div>
          </label>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex-1 min-h-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Recent voice-overs</p>
        <ScrollArea className="h-full pr-2">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : voiceovers.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No voice-overs yet.</p>
          ) : (
            <div className="space-y-1.5">
              {voiceovers.map((vo) => {
                const isPlaying = playingId === vo.id;
                const isSelected = selectedId === vo.id;
                return (
                  <motion.div
                    key={vo.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${isSelected ? "border-primary/50 bg-primary/5" : "border-border/30 bg-muted/20"}`}
                  >
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => togglePlay(vo)}>
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{vo.script || "Voice-over"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[9px]">{vo.source === "tts" ? "AI" : "Upload"}</Badge>
                        <span className="text-[9px] text-muted-foreground">{vo.duration_seconds ? `${vo.duration_seconds}s` : ""}</span>
                      </div>
                    </div>
                    {onSelect && (
                      <Button size="sm" variant={isSelected ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => handleSelect(vo)}>
                        {isSelected ? "Selected" : "Use"}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(vo)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
