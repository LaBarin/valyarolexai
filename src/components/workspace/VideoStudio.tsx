import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Sparkles, Plus, Loader2, ChevronLeft, Trash2, Play, Pause,
  Clock, Film, Monitor, Smartphone, Square, Eye, Check, X, Music,
  Type, Camera, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/valyarolex-logo.png";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Scene = {
  scene_number: number;
  duration_seconds: number;
  visual: string;
  text_overlay?: string;
  voiceover?: string;
  transition: string;
  notes?: string;
};

type VideoData = {
  title: string;
  description?: string;
  format: string;
  duration_seconds: number;
  duration_type: string;
  platform: string;
  target_audience?: string;
  hook?: string;
  cta?: string;
  music_mood?: string;
  scenes: Scene[];
  ad_copy?: {
    headline?: string;
    description?: string;
    hashtags?: string[];
  };
};

type VideoProject = {
  id: string;
  title: string;
  description?: string;
  format: string;
  duration_type: string;
  platform: string;
  status: string;
  script: VideoData | null;
  storyboard: Scene[];
  ai_generated: boolean;
  created_at: string;
};

const FORMAT_ICONS: Record<string, typeof Monitor> = {
  "9:16": Smartphone,
  "1:1": Square,
  "16:9": Monitor,
  "4:3": Monitor,
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-foreground/20 text-foreground",
  instagram: "bg-pink-500/20 text-pink-400",
  youtube: "bg-red-500/20 text-red-400",
  facebook: "bg-blue-600/20 text-blue-400",
  linkedin: "bg-blue-500/20 text-blue-300",
  twitter: "bg-sky-500/20 text-sky-400",
  snapchat: "bg-yellow-400/20 text-yellow-300",
  pinterest: "bg-red-400/20 text-red-300",
  general: "bg-primary/20 text-primary",
};

const DURATION_LABELS: Record<string, string> = {
  short: "Short (5-15s)",
  square: "Square (5-15s)",
  landscape: "Landscape (5-15s)",
  commercial: "Commercial (30-60s)",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-accent/20 text-accent",
  production: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-400",
};

const VideoStudio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("9:16");
  const [selectedDuration, setSelectedDuration] = useState("short");
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<VideoData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("video_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setProjects(data.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description ?? undefined,
        format: v.format,
        duration_type: v.duration_type,
        platform: v.platform,
        status: v.status,
        script: v.script as VideoData | null,
        storyboard: ((v.storyboard as any) || []) as Scene[],
        ai_generated: v.ai_generated,
        created_at: v.created_at,
      })));
    }
    setLoading(false);
  };

  const generateVideo = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const enhancedPrompt = `${prompt}\n\nFormat: ${selectedFormat} (${selectedDuration})\nPlatform: ${selectedPlatform}\nDuration type: ${selectedDuration}`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: enhancedPrompt }],
          mode: "video",
        }),
      });
      if (!resp.ok) throw new Error("AI generation failed");
      const { result } = await resp.json();
      let parsed: VideoData;
      try {
        const cleaned = result.replace(/```json\n?|```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Failed to parse AI response");
      }
      setPreviewData(parsed);
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const approveVideo = async () => {
    if (!previewData || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("video_projects").insert({
        user_id: user.id,
        title: previewData.title || "AI Video",
        description: previewData.description,
        format: previewData.format || selectedFormat,
        duration_type: previewData.duration_type || selectedDuration,
        platform: previewData.platform || selectedPlatform,
        script: previewData as any,
        storyboard: previewData.scenes as any,
        ai_generated: true,
        status: "approved",
      });
      if (error) throw error;
      setPreviewData(null);
      setPrompt("");
      await loadProjects();
      toast({ title: "Video Approved", description: `"${previewData.title}" saved to your projects.` });
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const rejectVideo = () => {
    setPreviewData(null);
    toast({ title: "Video Rejected", description: "Draft discarded." });
  };

  const deleteProject = async (id: string) => {
    await supabase.from("video_projects").delete().eq("id", id);
    if (activeProject?.id === id) setActiveProject(null);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("video_projects").update({ status }).eq("id", id);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (activeProject?.id === id) setActiveProject((prev) => prev ? { ...prev, status } : null);
  };

  // Storyboard playback simulation
  useEffect(() => {
    if (!isPlaying || !activeProject?.storyboard?.length) return;
    const scene = activeProject.storyboard[activeScene];
    const timer = setTimeout(() => {
      if (activeScene < activeProject.storyboard.length - 1) {
        setActiveScene(activeScene + 1);
      } else {
        setIsPlaying(false);
        setActiveScene(0);
      }
    }, (scene?.duration_seconds || 3) * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, activeScene, activeProject]);

  // Detail view
  if (activeProject) {
    const p = activeProject;
    const scenes = p.storyboard || p.script?.scenes || [];
    const script = p.script;
    const FormatIcon = FORMAT_ICONS[p.format] || Monitor;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => { setActiveProject(null); setIsPlaying(false); setActiveScene(0); loadProjects(); }}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={STATUS_COLORS[p.status] || STATUS_COLORS.draft}>{p.status}</Badge>
            <Badge className={PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.general}>{p.platform}</Badge>
            <Badge variant="outline"><FormatIcon className="w-3 h-3 mr-1" />{p.format}</Badge>
            {p.status === "approved" && (
              <Button size="sm" onClick={() => updateStatus(p.id, "production")}>
                <Film className="w-4 h-4 mr-1" /> Send to Production
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="storyboard" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="details">Ad Details</TabsTrigger>
          </TabsList>

          <TabsContent value="storyboard" className="space-y-4">
            {/* Playback preview */}
            {scenes.length > 0 && (
              <div className={`relative glass rounded-2xl overflow-hidden ${p.format === "9:16" ? "max-w-xs mx-auto aspect-[9/16]" : p.format === "1:1" ? "max-w-md mx-auto aspect-square" : "aspect-video"}`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScene}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col justify-between"
                    style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--accent) / 0.25) 50%, hsl(210 25% 12%) 100%)` }}
                  >
                    {/* Scene number watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                      <span className="text-[80px] font-black text-foreground">{scenes[activeScene]?.scene_number || activeScene + 1}</span>
                    </div>

                    <div className="p-4 space-y-2 relative z-10">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/30 text-primary border-primary/40 text-[10px]">Scene {scenes[activeScene]?.scene_number || activeScene + 1}</Badge>
                        <img src={logoImg} alt="Valyarolex.AI" className="h-4 w-auto opacity-70" />
                      </div>
                      {scenes[activeScene]?.text_overlay && (
                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg font-bold text-foreground drop-shadow-md"
                        >
                          {scenes[activeScene].text_overlay}
                        </motion.p>
                      )}
                    </div>

                    <div className="p-4 space-y-2 relative z-10 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Visual Direction</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">{scenes[activeScene]?.visual}</p>
                      {scenes[activeScene]?.voiceover && (
                        <div className="flex items-start gap-1.5 bg-background/30 backdrop-blur-sm rounded-lg p-2 border border-foreground/10">
                          <Mic className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-foreground/90">"{scenes[activeScene].voiceover}"</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{scenes[activeScene]?.duration_seconds}s</span>
                        {scenes[activeScene]?.transition && scenes[activeScene].transition !== "none" && (
                          <><span>•</span><span className="capitalize">{scenes[activeScene].transition} transition</span></>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Playback controls */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 glass rounded-full px-4 py-1.5 z-10">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsPlaying(!isPlaying); }}>
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <span className="text-[10px] text-muted-foreground">{activeScene + 1}/{scenes.length}</span>
                  <Progress value={((activeScene + 1) / scenes.length) * 100} className="w-20 h-1" />
                </div>
              </div>
            )}

            {/* Scene cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {scenes.map((scene, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { setActiveScene(i); setIsPlaying(false); }}
                  className={`glass rounded-xl p-4 text-left space-y-2 transition-all ${activeScene === i ? "border-primary/50 shadow-glow" : "hover:border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">Scene {scene.scene_number || i + 1}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {scene.duration_seconds}s
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 line-clamp-2">{scene.visual}</p>
                  {scene.text_overlay && (
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <Type className="w-3 h-3" />
                      {scene.text_overlay}
                    </div>
                  )}
                  {scene.transition && scene.transition !== "none" && (
                    <Badge variant="outline" className="text-[10px]">{scene.transition}</Badge>
                  )}
                </motion.button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            {script && (
              <>
                {script.hook && (
                  <div className="glass rounded-xl p-4">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-2"><Camera className="w-3.5 h-3.5 text-primary" /> Hook (First 3s)</h4>
                    <p className="text-sm text-foreground/90">"{script.hook}"</p>
                  </div>
                )}
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold text-sm mb-3">Full Script</h4>
                  <div className="space-y-3">
                    {scenes.map((scene, i) => (
                      <div key={i} className="bg-background/50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Scene {scene.scene_number || i + 1}</span>
                          <span className="text-[10px] text-muted-foreground">{scene.duration_seconds}s • {scene.transition}</span>
                        </div>
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Visual:</span> {scene.visual}</p>
                        {scene.voiceover && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">VO:</span> "{scene.voiceover}"</p>}
                        {scene.text_overlay && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Text:</span> {scene.text_overlay}</p>}
                        {scene.notes && <p className="text-[10px] text-muted-foreground/60 italic">{scene.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                {script.cta && (
                  <div className="glass rounded-xl p-4">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-2">Call to Action</h4>
                    <p className="text-sm text-primary font-medium">"{script.cta}"</p>
                  </div>
                )}
                {script.music_mood && (
                  <div className="glass rounded-xl p-4 flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <span className="text-sm">Music mood: <span className="font-medium capitalize">{script.music_mood}</span></span>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="details">
            {script?.ad_copy && (
              <div className="glass rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-sm">Ad Copy</h4>
                {script.ad_copy.headline && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Headline</p>
                    <p className="text-sm font-semibold">{script.ad_copy.headline}</p>
                  </div>
                )}
                {script.ad_copy.description && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Description</p>
                    <p className="text-sm">{script.ad_copy.description}</p>
                  </div>
                )}
                {script.ad_copy.hashtags && script.ad_copy.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {script.ad_copy.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-primary">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="glass rounded-xl p-4 mt-4">
              <h4 className="font-semibold text-sm mb-2">Specs</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background/50 rounded-lg p-2"><span className="text-muted-foreground">Format:</span> <span className="font-medium">{p.format}</span></div>
                <div className="bg-background/50 rounded-lg p-2"><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{script?.duration_seconds || "—"}s</span></div>
                <div className="bg-background/50 rounded-lg p-2"><span className="text-muted-foreground">Platform:</span> <span className="font-medium capitalize">{p.platform}</span></div>
                <div className="bg-background/50 rounded-lg p-2"><span className="text-muted-foreground">Scenes:</span> <span className="font-medium">{scenes.length}</span></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Preview dialog
  const PreviewDialog = () => {
    const [previewScene, setPreviewScene] = useState(0);
    if (!previewData) return null;
    const scenes = previewData.scenes || [];
    const scene = scenes[previewScene];

    return (
      <Dialog open={!!previewData} onOpenChange={(v) => { if (!v) rejectVideo(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Review Video — {previewData.title}
            </DialogTitle>
            <DialogDescription>Preview your AI-generated video storyboard. Approve to save or reject to discard.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {/* Video preview */}
              <div className={`relative glass rounded-2xl overflow-hidden ${previewData.format === "9:16" ? "max-w-[200px] mx-auto aspect-[9/16]" : previewData.format === "1:1" ? "max-w-[280px] mx-auto aspect-square" : "aspect-video"}`}>
                <AnimatePresence mode="wait">
                  {scene && (
                    <motion.div
                      key={previewScene}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col justify-between"
                      style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--accent) / 0.25) 50%, hsl(210 25% 12%) 100%)` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                        <span className="text-[60px] font-black text-foreground">{scene.scene_number || previewScene + 1}</span>
                      </div>
                      <div className="p-3 space-y-1 relative z-10">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/30 text-primary border-primary/40 text-[10px]">Scene {scene.scene_number || previewScene + 1} — {scene.duration_seconds}s</Badge>
                          <img src={logoImg} alt="Valyarolex.AI" className="h-3.5 w-auto opacity-70" />
                        </div>
                        {scene.text_overlay && <p className="text-sm font-bold drop-shadow-md">{scene.text_overlay}</p>}
                      </div>
                      <div className="p-3 space-y-1 relative z-10 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-[10px] text-foreground/90">{scene.visual}</p>
                        {scene.voiceover && (
                          <p className="text-[10px] text-foreground/70 flex items-start gap-1"><Mic className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />"{scene.voiceover}"</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scene navigation */}
              <div className="flex items-center justify-center gap-1">
                {scenes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewScene(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === previewScene ? "bg-primary w-4" : "bg-muted-foreground/30"}`}
                  />
                ))}
              </div>

              {/* Info cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Format</p>
                  <p className="text-sm font-semibold">{previewData.format}</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">{previewData.duration_seconds}s</p>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Platform</p>
                  <p className="text-sm font-semibold capitalize">{previewData.platform}</p>
                </div>
              </div>

              {previewData.hook && (
                <div className="glass rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Hook</p>
                  <p className="text-sm font-medium">"{previewData.hook}"</p>
                </div>
              )}

              {previewData.ad_copy && (
                <div className="glass rounded-lg p-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">Ad Copy</p>
                  {previewData.ad_copy.headline && <p className="text-sm font-semibold">{previewData.ad_copy.headline}</p>}
                  {previewData.ad_copy.description && <p className="text-xs text-muted-foreground">{previewData.ad_copy.description}</p>}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
            <Button variant="outline" onClick={rejectVideo} disabled={isSaving}>
              <X className="w-4 h-4 mr-1.5" /> Reject
            </Button>
            <Button onClick={approveVideo} disabled={isSaving}>
              <Check className="w-4 h-4 mr-1.5" /> {isSaving ? "Saving…" : "Approve & Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // List view
  return (
    <>
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Video Creator</h3>
            <p className="text-xs text-muted-foreground">Generate video ads, shorts, and commercials with AI</p>
          </div>
        </div>

        <Textarea
          placeholder="Describe your video ad... e.g. 'Create a 15-second TikTok ad for a new AI productivity app targeting Gen Z professionals'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px] bg-background/50"
        />

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">9:16 Vertical</SelectItem>
                <SelectItem value="1:1">1:1 Square</SelectItem>
                <SelectItem value="16:9">16:9 Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (5-15s)</SelectItem>
                <SelectItem value="commercial">Commercial (30-60s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Platform</label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="snapchat">Snapchat</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateVideo} disabled={isGenerating || !prompt.trim()} className="ml-auto">
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate Video</>}
          </Button>
        </div>
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No video projects yet. Generate your first one above!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const FormatIcon = FORMAT_ICONS[p.format] || Monitor;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setActiveProject(p); setActiveScene(0); }}
                className="glass rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                      <FormatIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{p.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`${PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.general} text-[9px] px-1.5`}>{p.platform}</Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5">{p.format}</Badge>
                        <Badge className={`${STATUS_COLORS[p.status] || STATUS_COLORS.draft} text-[9px] px-1.5`}>{p.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Film className="w-3 h-3" />
                  {p.storyboard?.length || 0} scenes
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

    <PreviewDialog />
    </>
  );
};

export default VideoStudio;
