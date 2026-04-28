import { useState, useEffect, forwardRef, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Sparkles, Plus, Loader2, ChevronLeft, Trash2, Play, Pause,
  Clock, Film, Monitor, Smartphone, Square, Eye, Check, X, Music,
  Type, Camera, Mic, ImageIcon, Pencil, Send, RotateCcw, Save, Link, ExternalLink, Download,
  FileVideo, Upload, CheckCircle2, AlertCircle, VolumeX, Layers
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { renderVideo, type SceneAnimation, type AnimationPreset, SCENE_ANIMATION_OPTIONS, ANIMATION_PRESETS, resolveSceneAnimation } from "@/lib/render-video";
import { createShareToken, normalizeVideoOverlayText, normalizeVideoScenes } from "@/lib/video-script";
import { NarratorControls } from "./NarratorControls";
import { useNarrator } from "@/hooks/use-narrator";
import { AdTemplateGallery, type AdTemplate, type AdPreset } from "./AdTemplateGallery";
import { RewriteMenu } from "./RewriteMenu";
import { ThumbnailGenerator } from "./ThumbnailGenerator";
import { TranslateMenu } from "./TranslateMenu";
import { BulkAdCreator } from "./BulkAdCreator";
import { MusicLibrary, type AudioTrack } from "./MusicLibrary";
import { VoiceoverStudio, VOICES } from "./VoiceoverStudio";
import { useBrandKit } from "@/hooks/useBrandKit";
import { brandContextBlock } from "@/lib/brand-context";
import { Palette, Volume2 } from "lucide-react";
import { RenderProgressTracker, deriveRenderStage } from "./RenderProgressTracker";
import { VerticalTemplatePicker } from "./VerticalTemplatePicker";
import { AD_PRESETS } from "./AdTemplateGallery";
import type { VerticalTemplate } from "./verticalTemplates";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SCENE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`;

type Scene = {
  scene_number: number;
  duration_seconds: number;
  visual: string;
  text_overlay?: string;
  voiceover?: string;
  transition: string;
  notes?: string;
  image_url?: string;
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
  publishing_links?: Record<string, string>;
  last_render_meta?: {
    voiceover_id?: string | null;
    music_track_id?: string | null;
    music_volume?: number | null;
    scenes_hash?: string;
    rendered_at?: string;
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
  share_token?: string | null;
  template_style?: string | null;
  ad_preset?: string | null;
  voiceover_id?: string | null;
  music_track_id?: string | null;
  music_volume?: number | null;
  thumbnail_url?: string | null;
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

const PUBLISHING_PLATFORMS = [
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@user/video/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/reel/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/watch/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/shorts/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/posts/..." },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/user/status/..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://www.pinterest.com/pin/..." },
  { key: "snapchat", label: "Snapchat", placeholder: "https://www.snapchat.com/..." },
];

const normalizeVideoScript = (value: unknown): VideoData | null => {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;

  const script = value as Partial<VideoData>;
  const rawLinks = script.publishing_links;

  return {
    title: script.title ?? "Untitled Video",
    description: script.description,
    format: script.format ?? "9:16",
    duration_seconds: typeof script.duration_seconds === "number" ? script.duration_seconds : 0,
    duration_type: script.duration_type ?? "short",
    platform: script.platform ?? "general",
    target_audience: script.target_audience,
    hook: script.hook,
    cta: script.cta,
    music_mood: script.music_mood,
    scenes: normalizeVideoScenes(Array.isArray(script.scenes) ? (script.scenes as Scene[]) : []),
    ad_copy: script.ad_copy,
    publishing_links:
      rawLinks && typeof rawLinks === "object" && !Array.isArray(rawLinks)
        ? Object.fromEntries(Object.entries(rawLinks).map(([key, link]) => [key, String(link ?? "")]))
        : {},
    last_render_meta: (script as any).last_render_meta ?? undefined,
  };
};

// Compute a stable hash of scene content (visual + overlay + duration) used for render-sync detection
const computeScenesHash = (scenes: Scene[]): string => {
  const payload = scenes.map((s) => ({
    n: s.scene_number,
    v: s.visual ?? "",
    t: s.text_overlay ?? "",
    d: s.duration_seconds ?? 0,
  }));
  const json = JSON.stringify(payload);
  // Lightweight 32-bit FNV-1a hash — good enough for change detection
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16);
};

const buildRenderMeta = (project: VideoProject) => ({
  voiceover_id: project.voiceover_id ?? null,
  music_track_id: project.music_track_id ?? null,
  music_volume: project.music_volume ?? null,
  scenes_hash: computeScenesHash(project.storyboard || project.script?.scenes || []),
  rendered_at: new Date().toISOString(),
});

const isRenderInSync = (project: VideoProject): boolean => {
  const meta = project.script?.last_render_meta;
  if (!meta) return false;
  const currentHash = computeScenesHash(project.storyboard || project.script?.scenes || []);
  return (
    meta.voiceover_id === (project.voiceover_id ?? null) &&
    meta.music_track_id === (project.music_track_id ?? null) &&
    (meta.music_volume ?? null) === (project.music_volume ?? null) &&
    meta.scenes_hash === currentHash
  );
};

const getStoryboardScenes = (value: unknown): Scene[] => {
  return normalizeVideoScenes(Array.isArray(value) ? (value as Scene[]) : []);
};

const getSceneDuration = (scenes: Scene[]): number => {
  return scenes.reduce((total, scene) => total + (scene.duration_seconds || 0), 0);
};

const mergeVideoScript = (
  project: Pick<VideoProject, "title" | "description" | "format" | "duration_type" | "platform" | "storyboard">,
  currentScript: VideoData | null,
  overrides: Partial<VideoData> = {},
): VideoData => {
  const fallbackScenes = currentScript?.scenes?.length ? currentScript.scenes : project.storyboard || [];
  const nextScenes = normalizeVideoScenes(overrides.scenes ?? fallbackScenes);

  return {
    title: currentScript?.title ?? project.title,
    description: currentScript?.description ?? project.description,
    format: currentScript?.format ?? project.format,
    duration_seconds: currentScript?.duration_seconds ?? getSceneDuration(nextScenes),
    duration_type: currentScript?.duration_type ?? project.duration_type,
    platform: currentScript?.platform ?? project.platform,
    target_audience: currentScript?.target_audience,
    hook: currentScript?.hook,
    cta: currentScript?.cta,
    music_mood: currentScript?.music_mood,
    scenes: nextScenes,
    ad_copy: currentScript?.ad_copy,
    publishing_links: currentScript?.publishing_links ?? {},
    last_render_meta: currentScript?.last_render_meta,
    ...overrides,
  };
};

const mapVideoProject = (row: any): VideoProject => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  format: row.format,
  duration_type: row.duration_type,
  platform: row.platform,
  status: row.status,
  script: normalizeVideoScript(row.script),
  storyboard: getStoryboardScenes(row.storyboard),
  ai_generated: row.ai_generated,
  created_at: row.created_at,
  share_token: row.share_token ?? null,
  template_style: row.template_style ?? null,
  ad_preset: row.ad_preset ?? null,
  voiceover_id: row.voiceover_id ?? null,
  music_track_id: row.music_track_id ?? null,
  music_volume: row.music_volume ?? null,
  thumbnail_url: row.thumbnail_url ?? null,
});

const PublishingLinks = forwardRef<HTMLDivElement, { project: VideoProject; script: VideoData | null; onUpdate: (project: VideoProject) => void }>(
  ({ project, script, onUpdate }, ref) => {
    const { toast } = useToast();
    const links = script?.publishing_links || {};
    const [editingLinks, setEditingLinks] = useState<Record<string, string>>(links);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Record<string, string>>(links);

    useEffect(() => {
      const fresh = script?.publishing_links || {};
      setEditingLinks(fresh);
      setLastSaved(fresh);
    }, [project.id, JSON.stringify(script?.publishing_links)]);

    const saveLinks = async () => {
      setSaving(true);

      const cleanLinks = Object.fromEntries(
        Object.entries(editingLinks)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => Boolean(value)),
      ) as Record<string, string>;

      const updatedScript = mergeVideoScript(project, script, {
        publishing_links: cleanLinks,
      });

      const { data, error } = await supabase
        .from("video_projects")
        .update({ script: updatedScript as any })
        .eq("id", project.id)
        .select("*")
        .single();

      if (error || !data) {
        toast({ title: "Save Failed", description: error?.message || "Unable to save publishing links.", variant: "destructive" });
        setSaving(false);
        return;
      }

      const persistedProject = mapVideoProject(data);
      const persistedLinks = persistedProject.script?.publishing_links || cleanLinks;

      setEditingLinks(persistedLinks);
      setLastSaved(persistedLinks);
      onUpdate(persistedProject);
      toast({ title: "Links Saved", description: "Publishing links updated successfully." });
      setSaving(false);
    };

    const hasChanges = JSON.stringify(editingLinks) !== JSON.stringify(lastSaved);
    const hasSavedLinks = Object.values(lastSaved).some((value) => value.trim());

    return (
      <div ref={ref} className="glass rounded-xl p-4 mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-primary" /> Publishing Links
          </h4>
          <Button type="button" size="sm" onClick={saveLinks} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            {hasChanges ? "Save Links" : "Saved"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Paste the published video URL for each platform.
          {hasSavedLinks && !hasChanges && <span className="text-accent ml-1">✓ {Object.values(lastSaved).filter((value) => value.trim()).length} link(s) saved</span>}
          {hasChanges && <span className="text-primary ml-1">• Unsaved changes</span>}
        </p>
        <div className="space-y-2">
          {PUBLISHING_PLATFORMS.map(({ key, label, placeholder }) => {
            const isSaved = Boolean(lastSaved[key]?.trim()) && lastSaved[key] === editingLinks[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0 capitalize">{label}</span>
                <div className="relative flex-1">
                  <Input
                    placeholder={placeholder}
                    value={editingLinks[key] || ""}
                    onChange={(e) => setEditingLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                    className={`text-xs bg-background/50 ${isSaved ? "border-accent/30" : ""}`}
                  />
                </div>
                {editingLinks[key] && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(editingLinks[key]);
                        toast({ title: "Copied!", description: `${label} link copied to clipboard.` });
                      }}
                    >
                      <Link className="w-3 h-3" />
                    </Button>
                    <a href={editingLinks[key]} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {isSaved && <Check className="w-3 h-3 text-accent" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

PublishingLinks.displayName = "PublishingLinks";

const VideoStudio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { kit: brandKit, logoUrl: brandLogoUrl } = useBrandKit();
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
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
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [generatingPreviewImages, setGeneratingPreviewImages] = useState<Record<number, boolean>>({});
  const [previewImagesRequested, setPreviewImagesRequested] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  // Latest storyboard per project (ref-based) to avoid race conditions when
  // multiple persistSceneImage calls fire concurrently. Each update merges into
  // the latest known storyboard for that project before persisting.
  const latestStoryboardRef = useRef<Record<string, Scene[]>>({});
  const persistQueueRef = useRef<Record<string, Promise<void>>>({});
  // Scene editing state
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Scene>>({});
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Server-side Remotion Lambda export state
  const [isMp4Exporting, setIsMp4Exporting] = useState(false);
  const [mp4Progress, setMp4Progress] = useState<number | null>(null);
  const [mp4Status, setMp4Status] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [includeBranding, setIncludeBranding] = useState(true);
  // Client logo for third-party ads
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  const [clientLogoName, setClientLogoName] = useState<string>("");
  // Animation preset & per-scene overrides
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>("cinematic");
  const [sceneAnimations, setSceneAnimations] = useState<Record<number, SceneAnimation | "auto">>({});
  // Auto-render pipeline state
  const [autoRenderStage, setAutoRenderStage] = useState<"idle" | "generating-images" | "rendering-video" | "done">("idle");
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryFocusIndex, setGalleryFocusIndex] = useState(0);
  // Active detail tab
  const [activeDetailTab, setActiveDetailTab] = useState("storyboard");

  // Pre-generation creative selections (Style / Voice / Music)
  const [preGenStyle, setPreGenStyle] = useState<string>("kinetic");
  const [pickedVerticalId, setPickedVerticalId] = useState<string | null>(null);

  /**
   * Apply an industry starter template: prefill the prompt with the brief,
   * map the suggested preset → format/duration, and set the ad style.
   * Brand kit values (if any) are appended via brandContextBlock at submit.
   */
  const applyVerticalTemplate = (t: VerticalTemplate) => {
    setPickedVerticalId(t.id);
    const cta = t.cta;
    setPrompt(`${t.prompt}\n\nCTA: ${cta}`);
    const preset = AD_PRESETS.find((p) => p.id === t.presetId);
    if (preset) {
      setSelectedFormat(preset.format);
      setSelectedDuration(preset.duration <= 15 ? "short" : preset.duration <= 30 ? "medium" : "long");
    }
    setPreGenStyle(t.styleId);
    toast({
      title: `${t.name} starter applied`,
      description: "Prompt, CTA, format and style are pre-filled. Edit anything you like, then Generate.",
    });
  };
  const [preGenVoiceId, setPreGenVoiceId] = useState<string>("JBFqnCBsd6RMkjVDRZzb");
  const [preGenTrackId, setPreGenTrackId] = useState<string | null>(null);
  const [availableTracks, setAvailableTracks] = useState<AudioTrack[]>([]);

  // ── Preview audio playback ────────────────────────────────────────────────
  // Resolves signed URLs for the active project's voiceover + music tracks
  // and plays them in sync with the storyboard scene timer.
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewVoiceoverUrl, setPreviewVoiceoverUrl] = useState<string | null>(null);
  const [previewMusicUrl, setPreviewMusicUrl] = useState<string | null>(null);
  const [voiceoverMuted, setVoiceoverMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [voiceoverVolume, setVoiceoverVolume] = useState(1);
  // music volume is persisted on the project; we shadow it locally for slider responsiveness

  useEffect(() => {
    let active = true;
    supabase
      .from("audio_tracks")
      .select("*")
      .order("is_curated", { ascending: false })
      .order("name")
      .then(({ data }) => {
        if (active && data) setAvailableTracks(data as AudioTrack[]);
      });
    return () => { active = false; };
  }, []);

  // Narrator for video scenes
  const videoNarratorSlides = useMemo(() => {
    if (!activeProject) return [];
    const scenes = activeProject.storyboard || activeProject.script?.scenes || [];
    return scenes.map((s) => {
      const parts: string[] = [];
      if (s.text_overlay) parts.push(s.text_overlay);
      if (s.voiceover) parts.push(s.voiceover);
      if (s.visual) parts.push(s.visual);
      return { title: `Scene ${s.scene_number || 1}`, body: parts.join(". ") };
    });
  }, [activeProject]);

  const { isNarrating: isVideoNarrating, rate: videoRate, setRate: setVideoRate, startNarration: startVideoNarration, stopNarration: stopVideoNarration } = useNarrator({
    onStepChange: setActiveScene,
    totalSteps: videoNarratorSlides.length,
  });

  useEffect(() => () => { stopVideoNarration(); }, [stopVideoNarration]);

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
      setProjects(data.map(mapVideoProject));
    }

    setLoading(false);
  };

  // Persist a generated scene image into the storyboard JSON so it survives reloads.
  // Uses a per-project ref + serialized queue so concurrent calls (Promise.all) all
  // accumulate into the same storyboard rather than racing with stale React state.
  const persistSceneImage = async (projectId: string, sceneNumber: number, imageUrl: string) => {
    const key = `${projectId}-${sceneNumber}`;
    setSceneImages(prev => ({ ...prev, [key]: imageUrl }));

    // Seed the latest-storyboard ref for this project from current React state if empty
    if (!latestStoryboardRef.current[projectId]) {
      const src =
        (activeProject && activeProject.id === projectId ? activeProject.storyboard : null) ||
        projects.find(p => p.id === projectId)?.storyboard ||
        [];
      latestStoryboardRef.current[projectId] = src.map(s => ({ ...s }));
    }

    // Merge this image into the ref-tracked storyboard
    latestStoryboardRef.current[projectId] = (latestStoryboardRef.current[projectId] || []).map(s =>
      s.scene_number === sceneNumber ? { ...s, image_url: imageUrl } : s
    );

    const applyToProject = (proj: VideoProject | null): VideoProject | null => {
      if (!proj || proj.id !== projectId) return proj;
      const nextStoryboard = (proj.storyboard || []).map(s =>
        s.scene_number === sceneNumber ? { ...s, image_url: imageUrl } : s
      );
      const nextScript = proj.script
        ? { ...proj.script, scenes: (proj.script.scenes || []).map(s =>
            s.scene_number === sceneNumber ? { ...s, image_url: imageUrl } : s
          ) }
        : proj.script;
      return { ...proj, storyboard: nextStoryboard, script: nextScript };
    };

    setActiveProject(prev => applyToProject(prev));
    setProjects(prev => prev.map(p => applyToProject(p) || p));

    // Serialize DB writes per-project so each PATCH includes all accumulated images
    const prevWrite = persistQueueRef.current[projectId] || Promise.resolve();
    const nextWrite = prevWrite.then(async () => {
      const storyboardToSave = latestStoryboardRef.current[projectId];
      if (!storyboardToSave) return;
      try {
        await supabase
          .from("video_projects")
          .update({ storyboard: storyboardToSave as any } as any)
          .eq("id", projectId);
      } catch {
        /* non-fatal — image still in memory for this session */
      }
    });
    persistQueueRef.current[projectId] = nextWrite;
    await nextWrite;
  };

  // Hydrate sceneImages cache from saved storyboard whenever a project is opened
  useEffect(() => {
    if (!activeProject) return;
    const scenes = activeProject.storyboard || activeProject.script?.scenes || [];
    setSceneImages(prev => {
      const next = { ...prev };
      let changed = false;
      for (const scene of scenes) {
        const key = `${activeProject.id}-${scene.scene_number}`;
        if (!next[key] && scene.image_url) {
          next[key] = scene.image_url;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB for reference images.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClientLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB for logo images.", variant: "destructive" });
      return;
    }
    setClientLogoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setClientLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Determine which logo to use in overlays — client logo for third-party, default for Valyarolex
  const overlayLogoSrc = clientLogo || brandLogoUrl || logoImg;

  const generateSceneImage = async (scene: Scene, projectId: string, format: string, platform: string, sceneRole?: "main" | "closing") => {
    const key = `${projectId}-${scene.scene_number}`;
    if (generatingImages[key]) return;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const body: Record<string, any> = {
        visual: scene.visual,
        text_overlay: scene.text_overlay,
        format,
        platform,
        scene_role: sceneRole || "main",
      };
      // Reference image only injected for "main" scenes — the closing card is a clean branded background
      if (referenceImage && sceneRole !== "closing") body.reference_image_url = referenceImage;
      // Auto-include branding logo as base64
      if (includeBranding) {
        try {
          const logoSrc = clientLogo || brandLogoUrl || logoImg;
          const logoResp = await fetch(logoSrc);
          const logoBlob = await logoResp.blob();
          const logoBase64 = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(logoBlob);
          });
          body.brand_logo_url = logoBase64;
        } catch { /* skip branding if logo fetch fails */ }
      }
      const resp = await fetch(SCENE_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Image generation failed" }));
        throw new Error(err.error || "Image generation failed");
      }
      const { image_url } = await resp.json();
      if (image_url) await persistSceneImage(projectId, scene.scene_number, image_url);
    } catch (e: any) {
      toast({ title: "Image Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const generateAllSceneImages = async (scenes: Scene[], projectId: string, format: string, platform: string) => {
    for (const scene of scenes) {
      const key = `${projectId}-${scene.scene_number}`;
      if (!sceneImages[key]) {
        await generateSceneImage(scene, projectId, format, platform);
      }
    }
  };

  // --- Scene editing ---
  const startEditScene = (sceneIndex: number, scene: Scene) => {
    setEditingScene(sceneIndex);
    setEditForm({ ...scene });
    setAiEditPrompt("");
  };

  const cancelEditScene = () => {
    setEditingScene(null);
    setEditForm({});
    setAiEditPrompt("");
  };

  const saveSceneEdit = async () => {
    if (editingScene === null || !activeProject) return;
    const updatedScenes = [...(activeProject.storyboard || [])];
    // Strip the saved image_url so the scene re-generates on next render (content changed)
    const { image_url: _strippedImg, ...prevScene } = updatedScenes[editingScene] as any;
    updatedScenes[editingScene] = { ...prevScene, ...editForm } as Scene;

    const updatedScript = mergeVideoScript(activeProject, activeProject.script, {
      scenes: updatedScenes,
      duration_seconds: getSceneDuration(updatedScenes),
    });

    const { data, error } = await supabase
      .from("video_projects")
      .update({
        storyboard: updatedScenes as any,
        script: updatedScript as any,
      })
      .eq("id", activeProject.id)
      .select("*")
      .single();

    if (error || !data) {
      toast({ title: "Save Failed", description: error?.message || "Unable to save scene updates.", variant: "destructive" });
      return;
    }

    const persistedProject = mapVideoProject(data);

    // Clear the old generated image for this scene since content changed
    const imgKey = `${activeProject.id}-${updatedScenes[editingScene].scene_number}`;
    setSceneImages(prev => {
      const next = { ...prev };
      delete next[imgKey];
      return next;
    });

    setActiveProject(persistedProject);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? persistedProject : p));
    setEditingScene(null);
    setEditForm({});
    toast({ title: "Scene Updated", description: `Re-rendering video with your changes…` });
    // Auto re-render so the final video reflects the edit immediately
    autoRenderPipeline(persistedProject);
  };

  // Generic patch+persist for script-level fields (hook, cta, ad_copy, etc.).
  // Used by RewriteMenu and any other inline script edit. Does NOT touch
  // storyboard scenes or trigger an auto re-render — pure copy edits.
  const applyScriptPatch = async (patch: Partial<VideoData>) => {
    if (!activeProject) return;
    const updatedScript = mergeVideoScript(activeProject, activeProject.script, patch);
    const { data, error } = await supabase
      .from("video_projects")
      .update({ script: updatedScript as any })
      .eq("id", activeProject.id)
      .select("*")
      .single();
    if (error || !data) {
      toast({ title: "Save Failed", description: error?.message || "Unable to save changes.", variant: "destructive" });
      return;
    }
    const persisted = mapVideoProject(data);
    setActiveProject(persisted);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? persisted : p));
  };

  /** Replace the entire script (used by Translate). Also re-syncs storyboard scenes. */
  const replaceScript = async (nextScript: any) => {
    if (!activeProject) return;
    const normalizedScenes = Array.isArray(nextScript?.scenes)
      ? normalizeVideoScenes(nextScript.scenes)
      : activeProject.storyboard;
    const merged = { ...nextScript, scenes: normalizedScenes };
    const { data, error } = await supabase
      .from("video_projects")
      .update({ script: merged as any, storyboard: normalizedScenes as any, title: merged.title || activeProject.title } as any)
      .eq("id", activeProject.id)
      .select("*")
      .single();
    if (error || !data) {
      toast({ title: "Save Failed", description: error?.message || "Unable to save translation.", variant: "destructive" });
      return;
    }
    const persisted = mapVideoProject(data);
    setActiveProject(persisted);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? persisted : p));
  };

  const aiEditScene = async () => {
    if (!aiEditPrompt.trim() || editingScene === null || !activeProject) return;
    setIsAiEditing(true);
    try {
      const scene = activeProject.storyboard[editingScene];
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Here is the current scene data:\n${JSON.stringify(scene, null, 2)}\n\nThe user wants to make this change: "${aiEditPrompt}"\n\nReturn ONLY the updated scene as valid JSON with the same fields (scene_number, duration_seconds, visual, text_overlay, voiceover, transition, notes). Keep unchanged fields the same. Apply the user's instruction precisely.`,
          }],
          mode: "video",
        }),
      });
      if (!resp.ok) throw new Error("AI editing failed");
      const { result } = await resp.json();
      const cleaned = result.replace(/```json\n?|```\n?/g, "").trim();
      const updatedScene: Scene = JSON.parse(cleaned);
      setEditForm(updatedScene);
      setAiEditPrompt("");
      toast({ title: "AI Updated Scene", description: "Review the changes and click Save." });
    } catch (e: any) {
      toast({ title: "AI Edit Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAiEditing(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const enhancedPrompt = `${prompt}\n\nFormat: ${selectedFormat} (${selectedDuration})\nPlatform: ${selectedPlatform}\nDuration type: ${selectedDuration}${brandContextBlock(brandKit)}`;
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
      setPreviewData({
        ...parsed,
        scenes: normalizeVideoScenes(parsed.scenes),
      });
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
      const { data, error } = await supabase.from("video_projects").insert({
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
        template_style: preGenStyle,
        music_track_id: preGenTrackId,
      }).select("*").single();
      if (error || !data) throw error || new Error("Failed to save");
      const newProject = mapVideoProject(data);
      setPreviewData(null);
      setPreviewImages({});
      setGeneratingPreviewImages({});
      setPreviewImagesRequested(false);
      setPrompt("");
      await loadProjects();
      // Auto-navigate to the project and start rendering pipeline
      setActiveProject(newProject);
      setActiveScene(0);
      toast({ title: "Video Approved", description: `Generating video for "${previewData.title}"…` });
      // Kick off auto-render pipeline
      autoRenderPipeline(newProject);
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  /** Extract a website + phone for the persistent footer overlay. */
  const extractBrandFooter = (project: VideoProject): { website?: string; phone?: string; address?: string; companyName?: string } | null => {
    const haystack = `${project.title || ""} ${project.description || ""}`;
    // Auto-attach Xyz Diverse Services contact info to its branded videos
    const isXyz = /xyz\s*diverse|xyzdiverseservices/i.test(haystack);
    if (isXyz) {
      return { companyName: "Xyz Diverse Services", website: "XyzDiverseServices.com", phone: "1-888-839-3469" };
    }
    // Generic extraction from description (URL + phone + simple street/city)
    const urlMatch = haystack.match(/\b((?:https?:\/\/)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i);
    const phoneMatch = haystack.match(/\b(?:1[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b/);
    const addressMatch = haystack.match(/\b\d{1,5}\s+[A-Za-z][A-Za-z0-9.\s]{2,40}(?:Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place)\b[^,\n]*(?:,\s*[A-Za-z\s]{2,30})?(?:,?\s*[A-Z]{2}\s*\d{5})?/i);
    if (urlMatch || phoneMatch || addressMatch) {
      return {
        website: urlMatch?.[1]?.replace(/^https?:\/\//, ""),
        phone: phoneMatch?.[0],
        address: addressMatch?.[0]?.trim(),
      };
    }
    // Fall back to the user's saved Brand Kit so every video carries their identity
    if (brandKit?.business_name || brandKit?.website || brandKit?.phone || brandKit?.address) {
      return {
        companyName: brandKit.business_name || undefined,
        website: brandKit.website?.replace(/^https?:\/\//, "") || undefined,
        phone: brandKit.phone || undefined,
        address: brandKit.address || undefined,
      };
    }
    return null;
  };

  /**
   * Build the closing-card payload for the last scene.
   * - Client logo (uploaded by user, or default Valyarolex logo) is the hero element.
   * - Reference image (if uploaded) is shown small as "Powered by <reference logo>".
   * - Contact info (website / phone / address) is pulled from the project brand footer.
   */
  const buildClosingCard = (project: VideoProject) => {
    const footer = extractBrandFooter(project);
    const hasAnything = clientLogo || brandLogoUrl || referenceImage || footer?.website || footer?.phone || footer?.address || footer?.companyName;
    if (!hasAnything) return null;
    return {
      clientLogoUrl: clientLogo || brandLogoUrl || logoImg,
      referenceLogoUrl: referenceImage || null,
      companyName: footer?.companyName,
      website: footer?.website,
      phone: footer?.phone,
      address: footer?.address,
      poweredByLabel: referenceImage ? "Powered by" : undefined,
    };
  };

  /** Resolve signed audio URLs for a project's voiceover and music tracks. */
  const resolveProjectAudio = async (project: VideoProject): Promise<{ voiceoverUrl: string | null; musicUrl: string | null }> => {
    let voiceoverUrl: string | null = null;
    let musicUrl: string | null = null;
    try {
      if (project.voiceover_id) {
        const { data: vo } = await supabase
          .from("voiceovers")
          .select("storage_path")
          .eq("id", project.voiceover_id)
          .maybeSingle();
        if (vo?.storage_path) {
          const { data } = await supabase.functions.invoke("get-audio-url", { body: { path: vo.storage_path } });
          if (data?.url) voiceoverUrl = data.url;
        }
      }
      if (project.music_track_id) {
        const { data: tr } = await supabase
          .from("audio_tracks")
          .select("storage_path")
          .eq("id", project.music_track_id)
          .maybeSingle();
        if (tr?.storage_path) {
          const { data } = await supabase.functions.invoke("get-audio-url", { body: { path: tr.storage_path } });
          if (data?.url) musicUrl = data.url;
        }
      }
    } catch (e) {
      console.warn("Failed to resolve project audio", e);
    }
    return { voiceoverUrl, musicUrl };
  };

  const autoRenderPipeline = async (project: VideoProject) => {
    const scenes = project.storyboard || project.script?.scenes || [];
    if (scenes.length === 0) return;

    // Stage 1: Generate all scene images
    setAutoRenderStage("generating-images");
    setExportProgress(0);
    const imageMap: Record<string, string> = {};
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const key = `${project.id}-${scene.scene_number || i + 1}`;
      setExportProgress(Math.round((i / scenes.length) * 50));

      // Reuse an already-generated image if we have one cached (memory or persisted in storyboard)
      const cached = sceneImages[key] || scene.image_url;
      if (cached) {
        imageMap[key] = cached;
        if (!sceneImages[key]) setSceneImages(prev => ({ ...prev, [key]: cached }));
        continue;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isLast = i === scenes.length - 1;
        const sceneRole: "main" | "closing" = isLast ? "closing" : "main";
        const body: Record<string, any> = {
          visual: scene.visual,
          text_overlay: scene.text_overlay,
          format: project.format,
          platform: project.platform,
          scene_role: sceneRole,
        };
        if (referenceImage && sceneRole !== "closing") body.reference_image_url = referenceImage;
        if (includeBranding && sceneRole !== "closing") {
          try {
            const logoSrc = clientLogo || brandLogoUrl || logoImg;
            const logoResp = await fetch(logoSrc);
            const logoBlob = await logoResp.blob();
            const logoBase64 = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.readAsDataURL(logoBlob);
            });
            body.brand_logo_url = logoBase64;
          } catch { /* skip */ }
        }
        const resp = await fetch(SCENE_IMAGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify(body),
        });
        if (resp.ok) {
          const { image_url } = await resp.json();
          if (image_url) {
            imageMap[key] = image_url;
            await persistSceneImage(project.id, scene.scene_number || i + 1, image_url);
          }
        }
      } catch { /* continue with remaining scenes */ }
    }

    // Stage 2: Render video from images
    setAutoRenderStage("rendering-video");
    setExportProgress(50);
    const sceneInputs = scenes.map((scene, i) => {
      const key = `${project.id}-${scene.scene_number || i + 1}`;
      return { imageUrl: imageMap[key], durationSeconds: scene.duration_seconds || 3, textOverlay: scene.text_overlay };
    }).filter(s => s.imageUrl);

    if (sceneInputs.length === 0) {
      setAutoRenderStage("idle");
      setExportProgress(null);
      toast({ title: "Rendering Failed", description: "No scene images were generated.", variant: "destructive" });
      return;
    }

    try {
      const { voiceoverUrl, musicUrl } = await resolveProjectAudio(project);
      const blob = await renderVideo({
        format: project.format,
        scenes: sceneInputs.map((s, i) => { const a = sceneAnimations[i]; return { ...s, animation: a && a !== "auto" ? a as SceneAnimation : undefined }; }) as any[],
        onProgress: (p) => setExportProgress(50 + Math.round(p * 0.5)),
        preset: animationPreset,
        voiceoverUrl,
        musicUrl,
        musicVolume: project.music_volume ?? 0.25,
        brandFooter: extractBrandFooter(project),
        closingCard: buildClosingCard(project),
      });

      // Upload to storage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const filePath = `${session.user.id}/${project.id}.webm`;
      await supabase.storage.from("video-exports").upload(filePath, blob, { upsert: true, contentType: "video/webm" });
      const thumbnailUrl = sceneInputs[0]?.imageUrl ?? null;
      const renderMeta = buildRenderMeta(project);
      const updatedScript = mergeVideoScript(project, project.script, { last_render_meta: renderMeta });
      await supabase.from("video_projects").update({
        exported_video_url: filePath,
        status: "completed",
        thumbnail_url: thumbnailUrl,
        script: updatedScript as any,
      } as any).eq("id", project.id);

      const videoObjectUrl = URL.createObjectURL(blob);
      setRenderedVideoUrl(videoObjectUrl);
      setAutoRenderStage("done");
      setExportProgress(null);
      setShowVideoPreview(true);
      // Auto-switch to details tab to show publishing links
      setActiveDetailTab("details");
      // Update project status locally
      setActiveProject(prev => prev ? { ...prev, status: "completed", script: updatedScript } : null);
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: "completed", script: updatedScript } : p));
      toast({ title: "Video Ready!", description: "Your video has been rendered. Review and share it." });
    } catch (e: any) {
      setAutoRenderStage("idle");
      setExportProgress(null);
      toast({ title: "Rendering Failed", description: e.message, variant: "destructive" });
    }
  };

  const rejectVideo = () => {
    setPreviewData(null);
    setPreviewImages({});
    setGeneratingPreviewImages({});
    setPreviewImagesRequested(false);
    toast({ title: "Video Rejected", description: "Draft discarded." });
  };

  // Auto-generate preview images when previewData is set
  useEffect(() => {
    if (!previewData || previewImagesRequested) return;
    setPreviewImagesRequested(true);
    setPreviewImages({});
    setGeneratingPreviewImages({});
    const generateAll = async () => {
      const scenes = previewData.scenes || [];
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        setGeneratingPreviewImages(prev => ({ ...prev, [i]: true }));
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const resp = await fetch(SCENE_IMAGE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              visual: scene.visual,
              text_overlay: scene.text_overlay,
              format: previewData.format,
              platform: previewData.platform,
            }),
          });
          if (resp.ok) {
            const { image_url } = await resp.json();
            if (image_url) {
              setPreviewImages(prev => ({ ...prev, [i]: image_url }));
            }
          }
        } catch {
          // silently skip failed images
        } finally {
          setGeneratingPreviewImages(prev => ({ ...prev, [i]: false }));
        }
      }
    };
    generateAll();
  }, [previewData, previewImagesRequested]);

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

  const shareVideo = async (id: string) => {
    const project = projects.find(p => p.id === id) || activeProject;
    if (project?.share_token) {
      const url = `${window.location.origin}/video/${project.share_token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied!", description: url });
      return;
    }
    let token: string | null = null;
    const { data: rpcToken, error } = await supabase.rpc("generate_video_share_token", { p_video_id: id });

    if (error || !rpcToken) {
      const fallbackToken = createShareToken();
      const { data: fallbackProject, error: fallbackError } = await supabase
        .from("video_projects")
        .update({ share_token: fallbackToken } as any)
        .eq("id", id)
        .select("*")
        .single();

      if (fallbackError || !fallbackProject) {
        toast({
          title: "Share Failed",
          description: error?.message || fallbackError?.message || "Unable to create a share link.",
          variant: "destructive",
        });
        return;
      }

      const persistedProject = mapVideoProject(fallbackProject);
      token = persistedProject.share_token ?? fallbackToken;
      setProjects(prev => prev.map(p => p.id === id ? persistedProject : p));
      if (activeProject?.id === id) setActiveProject(persistedProject);
    } else {
      token = rpcToken;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, share_token: token } : p));
      if (activeProject?.id === id) setActiveProject(prev => prev ? { ...prev, share_token: token } : null);
    }

    const url = `${window.location.origin}/video/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Share Link Created!", description: "Link copied to clipboard." });
  };

  const downloadSceneImage = async (url: string, name: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  const exportVideo = async () => {
    if (!activeProject || isExporting) return;
    const p = activeProject;
    const scenes = p.storyboard || p.script?.scenes || [];
    
    // Check all scenes have images
    const sceneInputs = scenes.map((scene, i) => {
      const key = `${p.id}-${scene.scene_number || i + 1}`;
      return { imageUrl: sceneImages[key], durationSeconds: scene.duration_seconds || 3, textOverlay: scene.text_overlay };
    });
    
    const missingImages = sceneInputs.filter(s => !s.imageUrl);
    if (missingImages.length > 0) {
      toast({ title: "Generate Images First", description: `${missingImages.length} scene(s) still need images. Click "Generate All Images" first.`, variant: "destructive" });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const { voiceoverUrl, musicUrl } = await resolveProjectAudio(p);
      const blob = await renderVideo({
        format: p.format,
        scenes: sceneInputs.map((s, i) => { const a = sceneAnimations[i]; return { ...s, animation: a && a !== "auto" ? a as SceneAnimation : undefined }; }) as any[],
        onProgress: setExportProgress,
        preset: animationPreset,
        voiceoverUrl,
        musicUrl,
        musicVolume: p.music_volume ?? 0.25,
        brandFooter: extractBrandFooter(p),
        closingCard: buildClosingCard(p),
      });

      // Upload to storage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const filePath = `${session.user.id}/${p.id}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("video-exports")
        .upload(filePath, blob, { upsert: true, contentType: "video/webm" });

      if (uploadError) throw uploadError;

      // Store the file path (not public URL since bucket is private)
      // Save path to project so we can generate signed URLs when needed
      const thumbnailUrl = sceneInputs[0]?.imageUrl ?? null;
      const renderMeta = buildRenderMeta(p);
      const updatedScript = mergeVideoScript(p, p.script, { last_render_meta: renderMeta });
      await supabase
        .from("video_projects")
        .update({ exported_video_url: filePath, thumbnail_url: thumbnailUrl, script: updatedScript as any } as any)
        .eq("id", p.id);
      setActiveProject(prev => prev ? { ...prev, script: updatedScript } : null);
      setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, script: updatedScript } : proj));

      // Also trigger download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${p.title}.webm`;
      a.click();
      URL.revokeObjectURL(a.href);

      toast({ title: "Video Exported!", description: "Video rendered and downloaded. Share link will now include the video." });
    } catch (e: any) {
      toast({ title: "Export Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  /**
   * Server-side MP4 export via Remotion Lambda.
   * Submits the project to the `render-video-lambda` edge function, then polls
   * status every 3s until the render completes. The resulting MP4 lands in the
   * private `video-exports` bucket and we open it in the existing preview.
   */
  const exportVideoMp4 = async () => {
    if (!activeProject || isMp4Exporting) return;
    const p = activeProject;
    const scenes = p.storyboard || p.script?.scenes || [];
    const missingImages = scenes.some((s) => !s.image_url);
    if (scenes.length === 0 || missingImages) {
      toast({
        title: "Generate scene images first",
        description: "Every scene needs a generated image before MP4 export. Click 'Render Video' once to generate them.",
        variant: "destructive",
      });
      return;
    }

    setIsMp4Exporting(true);
    setMp4Progress(0);
    setMp4Status("Submitting to renderer…");

    try {
      const animMap: Record<string, string> = {};
      scenes.forEach((_, i) => {
        const a = sceneAnimations[i];
        animMap[String(i)] = a && a !== "auto" ? (a as string) : resolveSceneAnimation(animationPreset, i);
      });

      const startBody = {
        action: "start",
        video_project_id: p.id,
        scene_animations: animMap,
        brand_footer: extractBrandFooter(p),
        closing_card: buildClosingCard(p),
        environment: import.meta.env.MODE === "production" ? "live" : "sandbox",
      };

      const startRes = await supabase.functions.invoke("render-video-lambda", { body: startBody });
      if (startRes.error || !startRes.data?.ok) {
        const msg = startRes.data?.error || startRes.error?.message || "Failed to start render";
        throw new Error(msg);
      }
      const { renderId, bucketName } = startRes.data as { renderId: string; bucketName: string };

      setMp4Status("Rendering on Lambda…");

      // Poll progress every 3s, up to ~5 min
      const MAX_POLLS = 100;
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await supabase.functions.invoke("render-video-lambda", {
          body: { action: "status", renderId, bucketName, video_project_id: p.id },
        });
        if (statusRes.error) throw new Error(statusRes.error.message);
        const data = statusRes.data;
        if (data?.failed) throw new Error(data.error || "Render failed");
        if (typeof data?.progress === "number") setMp4Progress(data.progress);
        if (data?.done) {
          setMp4Progress(100);
          setMp4Status("Done");
          if (data.signed_url) {
            setRenderedVideoUrl(data.signed_url);
            setShowVideoPreview(true);
          }
          // Also reload the project so badges update
          const { data: row } = await supabase
            .from("video_projects").select("*").eq("id", p.id).maybeSingle();
          if (row) {
            const updated = mapVideoProject(row);
            setActiveProject(updated);
            setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          }
          toast({
            title: "MP4 Ready",
            description: `Rendered ${(data.size_bytes / 1024 / 1024).toFixed(1)} MB. Saved to your library.`,
          });
          return;
        }
      }
      throw new Error("Render timed out (5 min)");
    } catch (e: any) {
      toast({ title: "MP4 Export Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsMp4Exporting(false);
      setTimeout(() => { setMp4Progress(null); setMp4Status(""); }, 2000);
    }
  };

  // the attachments change. Stop any in-flight playback first so we don't
  // leak audio elements between projects.
  useEffect(() => {
    let cancelled = false;
    // Tear down current audio
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current.src = "";
      voiceoverAudioRef.current = null;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = "";
      musicAudioRef.current = null;
    }
    setPreviewVoiceoverUrl(null);
    setPreviewMusicUrl(null);

    if (!activeProject) return;
    if (!activeProject.voiceover_id && !activeProject.music_track_id) return;

    (async () => {
      const { voiceoverUrl, musicUrl } = await resolveProjectAudio(activeProject);
      if (cancelled) return;
      setPreviewVoiceoverUrl(voiceoverUrl);
      setPreviewMusicUrl(musicUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeProject?.id, activeProject?.voiceover_id, activeProject?.music_track_id]);

  // Construct/teardown <audio> elements when URLs become available
  useEffect(() => {
    if (previewVoiceoverUrl) {
      const a = new Audio(previewVoiceoverUrl);
      a.preload = "auto";
      a.volume = voiceoverMuted ? 0 : voiceoverVolume;
      voiceoverAudioRef.current = a;
    }
    return () => {
      if (voiceoverAudioRef.current) {
        voiceoverAudioRef.current.pause();
        voiceoverAudioRef.current = null;
      }
    };
  }, [previewVoiceoverUrl]);

  useEffect(() => {
    if (previewMusicUrl) {
      const a = new Audio(previewMusicUrl);
      a.preload = "auto";
      a.loop = true;
      const projVol = activeProject?.music_volume ?? 0.25;
      a.volume = musicMuted ? 0 : projVol;
      musicAudioRef.current = a;
    }
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, [previewMusicUrl]);

  // Keep volume/mute states in sync with live <audio> elements
  useEffect(() => {
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.volume = voiceoverMuted ? 0 : voiceoverVolume;
    }
  }, [voiceoverVolume, voiceoverMuted]);

  useEffect(() => {
    if (musicAudioRef.current) {
      const projVol = activeProject?.music_volume ?? 0.25;
      musicAudioRef.current.volume = musicMuted ? 0 : projVol;
    }
  }, [musicMuted, activeProject?.music_volume]);

  // Storyboard playback simulation — also drives audio playback
  useEffect(() => {
    if (!isPlaying || !activeProject?.storyboard?.length) {
      // Pause any audio when not playing
      voiceoverAudioRef.current?.pause();
      musicAudioRef.current?.pause();
      return;
    }
    const scene = activeProject.storyboard[activeScene];

    // Start audio on the FIRST scene of a play session, and resume on subsequent scenes.
    // We treat scene 0 as a "start from beginning" cue.
    const vo = voiceoverAudioRef.current;
    const mu = musicAudioRef.current;
    if (activeScene === 0) {
      if (vo) { try { vo.currentTime = 0; } catch {} vo.play().catch(() => {}); }
      if (mu) { try { mu.currentTime = 0; } catch {} mu.play().catch(() => {}); }
    } else {
      // Mid-storyboard: ensure audio is still playing (e.g. user pressed pause/play)
      if (vo && vo.paused) vo.play().catch(() => {});
      if (mu && mu.paused) mu.play().catch(() => {});
    }

    const timer = setTimeout(() => {
      if (activeScene < activeProject.storyboard.length - 1) {
        setActiveScene(activeScene + 1);
      } else {
        setIsPlaying(false);
        setActiveScene(0);
        voiceoverAudioRef.current?.pause();
        musicAudioRef.current?.pause();
      }
    }, (scene?.duration_seconds || 3) * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, activeScene, activeProject]);


  // Scene edit dialog — rendered inline (not as a sub-component) to avoid remounting on state change
  const sceneEditDialogJsx = editingScene !== null && activeProject ? (() => {
    const scene = editForm as Scene;
    return (
      <Dialog open={true} onOpenChange={(v) => { if (!v) cancelEditScene(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Edit Scene {scene.scene_number || editingScene + 1}
            </DialogTitle>
            <DialogDescription>Edit manually or use AI instructions below.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-4">
              {/* AI instruction input */}
              <div className="glass rounded-xl p-3 space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">AI Instructions</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. 'Make it more dramatic' or 'Change the background to a beach'"
                    value={aiEditPrompt}
                    onChange={(e) => setAiEditPrompt(e.target.value)}
                    className="text-xs bg-background/50"
                    onKeyDown={(e) => { if (e.key === "Enter" && !isAiEditing) aiEditScene(); }}
                  />
                  <Button size="sm" onClick={aiEditScene} disabled={isAiEditing || !aiEditPrompt.trim()}>
                    {isAiEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Manual fields */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Visual Direction</label>
                <Textarea
                  value={editForm.visual || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, visual: e.target.value }))}
                  className="text-xs min-h-[60px] bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Text Overlay</label>
                <Input
                  value={editForm.text_overlay || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, text_overlay: e.target.value }))}
                  className="text-xs bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Voiceover</label>
                <Textarea
                  value={editForm.voiceover || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, voiceover: e.target.value }))}
                  className="text-xs min-h-[40px] bg-background/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={editForm.duration_seconds || 3}
                    onChange={(e) => setEditForm(prev => ({ ...prev, duration_seconds: Number(e.target.value) }))}
                    className="text-xs bg-background/50"
                    min={1}
                    max={60}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Transition</label>
                  <Select value={editForm.transition || "cut"} onValueChange={(v) => setEditForm(prev => ({ ...prev, transition: v }))}>
                    <SelectTrigger className="text-xs h-8 bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cut">Cut</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="swipe">Swipe</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Notes</label>
                <Input
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="text-xs bg-background/50"
                  placeholder="Production notes..."
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/30">
            <Button variant="outline" size="sm" onClick={cancelEditScene}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveSceneEdit}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save Scene
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  })() : null;

  // Detail view
  // Preview dialog - defined before conditional returns so it's accessible everywhere
  const PreviewDialogComponent = () => {
    const [previewScene, setPreviewScene] = useState(0);

    if (!previewData) return null;
    const scenes = previewData.scenes || [];
    const scene = scenes[previewScene];
    const previewOverlayText = normalizeVideoOverlayText(scene?.text_overlay);
    const currentImage = previewImages[previewScene];
    const isGeneratingCurrent = generatingPreviewImages[previewScene];
    const totalGenerated = Object.keys(previewImages).length;
    const totalGenerating = Object.values(generatingPreviewImages).filter(Boolean).length;

    return (
      <Dialog open={!!previewData} onOpenChange={(v) => { if (!v) rejectVideo(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Review Video — {previewData.title}
            </DialogTitle>
            <DialogDescription>
              Preview your AI-generated video storyboard with visual previews.
              {totalGenerating > 0 && (
                <span className="ml-2 text-primary">
                  Generating images… ({totalGenerated}/{scenes.length})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              <div className={`relative glass rounded-2xl overflow-hidden ${previewData.format === "9:16" ? "max-w-[200px] mx-auto aspect-[9/16]" : previewData.format === "1:1" ? "max-w-[280px] mx-auto aspect-square" : "aspect-video"}`}>
                <AnimatePresence mode="wait">
                  {scene && (
                    <motion.div
                      key={previewScene}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {currentImage ? (
                        <img src={currentImage} alt={`Scene ${previewScene + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--accent) / 0.25) 50%, hsl(210 25% 12%) 100%)` }}
                        >
                          {isGeneratingCurrent ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <span className="text-[10px] text-muted-foreground">Generating visual…</span>
                            </div>
                          ) : (
                            <span className="text-[60px] font-black text-foreground/10">{scene.scene_number || previewScene + 1}</span>
                          )}
                        </div>
                      )}
                      {/* Scene badge + logo overlay */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <Badge className="bg-black/50 text-white border-white/20 text-[10px] backdrop-blur-sm">
                          Scene {scene.scene_number || previewScene + 1} — {scene.duration_seconds}s
                        </Badge>
                        <img src={overlayLogoSrc} alt="Brand Logo" className="h-3.5 w-auto opacity-70 drop-shadow-md" />
                      </div>
                      {/* Text overlay on image */}
                      {previewOverlayText && currentImage && (
                        <div className="absolute bottom-5 left-1/2 z-10 w-[82%] -translate-x-1/2">
                          <div className="rounded-xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-sm">
                            <p className="text-base font-semibold leading-tight tracking-tight text-white text-center break-words">
                              {previewOverlayText}
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Info overlay when no image */}
                      {!currentImage && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1 z-10 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[10px] text-foreground/90">{scene.visual}</p>
                          {scene.voiceover && (
                            <p className="text-[10px] text-foreground/70 flex items-start gap-1"><Mic className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />"{scene.voiceover}"</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scene navigation dots */}
              <div className="flex items-center justify-center gap-1">
                {scenes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewScene(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === previewScene ? "bg-primary w-4" : previewImages[i] ? "bg-accent/60" : "bg-muted-foreground/30"}`}
                  />
                ))}
              </div>

              {/* Scene details below preview */}
              {scene && (
                <div className="glass rounded-lg p-3 space-y-1">
                  <p className="text-xs text-foreground/90"><span className="font-medium">Visual:</span> {scene.visual}</p>
                  {scene.voiceover && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">VO:</span> "{scene.voiceover}"</p>}
                  {previewOverlayText && <p className="text-xs text-primary"><span className="font-medium">Text:</span> {previewOverlayText}</p>}
                </div>
              )}

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

  if (activeProject) {
    const p = activeProject;
    const scenes = p.storyboard || p.script?.scenes || [];
    const script = p.script;
    const FormatIcon = FORMAT_ICONS[p.format] || Monitor;

    return (
      <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => { setActiveProject(null); setIsPlaying(false); setActiveScene(0); setRenderedVideoUrl(null); setAutoRenderStage("idle"); setShowVideoPreview(false); setActiveDetailTab("storyboard"); loadProjects(); }}>
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
            {p.script?.last_render_meta ? (
              isRenderInSync(p) ? (
                <Badge className="bg-green-500/20 text-green-400 border-transparent" title="Exported video matches the currently-attached voice-over, music, and scenes.">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> In sync
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-transparent" title="Voice-over, music, or scenes have changed since the last export. Re-render to update.">
                  <AlertCircle className="w-3 h-3 mr-1" /> Re-render needed
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-muted-foreground" title="No exported video yet.">
                <AlertCircle className="w-3 h-3 mr-1" /> Not rendered
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => shareVideo(p.id)}>
              <Link className="w-4 h-4 mr-1" /> {p.share_token ? "Copy Link" : "Share"}
            </Button>
            <Button
              size="sm"
              variant="hero"
              onClick={() => autoRenderPipeline(p)}
              disabled={isExporting || isMp4Exporting || (autoRenderStage !== "idle" && autoRenderStage !== "done")}
            >
              {autoRenderStage !== "idle" && autoRenderStage !== "done" ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Rendering…</>
              ) : (
                <><FileVideo className="w-4 h-4 mr-1" /> {renderedVideoUrl ? "Re-render with Audio" : "Render Video"}</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportVideoMp4}
              disabled={isMp4Exporting || isExporting || (autoRenderStage !== "idle" && autoRenderStage !== "done")}
              title="Render a real MP4 server-side via Remotion Lambda. Uses credits unless you're subscribed."
            >
              {isMp4Exporting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {mp4Status || "Exporting MP4…"} {mp4Progress !== null ? `(${mp4Progress}%)` : ""}</>
              ) : (
                <><Download className="w-4 h-4 mr-1" /> Export MP4</>
              )}
            </Button>
            {renderedVideoUrl && (
              <Button size="sm" variant="outline" onClick={() => {
                const a = document.createElement("a");
                a.href = renderedVideoUrl;
                a.download = `${p.title}.webm`;
                a.click();
              }}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="style"><Palette className="w-3.5 h-3.5 mr-1.5" />Style</TabsTrigger>
            <TabsTrigger value="voice"><Mic className="w-3.5 h-3.5 mr-1.5" />Voice</TabsTrigger>
            <TabsTrigger value="music"><Music className="w-3.5 h-3.5 mr-1.5" />Music</TabsTrigger>
            <TabsTrigger value="thumbnail"><ImageIcon className="w-3.5 h-3.5 mr-1.5" />Thumbnail</TabsTrigger>
            <TabsTrigger value="details">Ad Details</TabsTrigger>
          </TabsList>

          <TabsContent value="storyboard" className="space-y-4">
            {/* 7-stage render pipeline tracker */}
            {((autoRenderStage !== "idle" && autoRenderStage !== "done") || isMp4Exporting) && (
              <RenderProgressTracker
                stage={deriveRenderStage({
                  autoStage: autoRenderStage,
                  isMp4Exporting,
                  mp4Status,
                  mp4Progress,
                  hasRenderedVideo: !!renderedVideoUrl,
                })}
                progress={isMp4Exporting ? mp4Progress ?? 0 : exportProgress ?? 0}
                message={mp4Status || (autoRenderStage === "generating-images" ? "Generating scene visuals…" : autoRenderStage === "rendering-video" ? "Rendering video…" : undefined)}
              />
            )}

            {/* Rendered video player */}
            {(renderedVideoUrl || autoRenderStage === "done") && (
              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-primary" /> Final Video
                  </h4>
                  <Badge className="bg-green-500/20 text-green-400">Ready</Badge>
                </div>
                {renderedVideoUrl && (
                  <div className={`rounded-xl overflow-hidden ${p.format === "9:16" ? "max-w-xs mx-auto" : p.format === "1:1" ? "max-w-md mx-auto" : ""}`}>
                    <video
                      src={renderedVideoUrl}
                      controls
                      className="w-full rounded-xl"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button onClick={() => {
                    if (!renderedVideoUrl) return;
                    const a = document.createElement("a");
                    a.href = renderedVideoUrl;
                    a.download = `${p.title}.webm`;
                    a.click();
                  }}>
                    <Download className="w-4 h-4 mr-1.5" /> Download Video
                  </Button>
                  <Button variant="outline" onClick={() => shareVideo(p.id)}>
                    <Link className="w-4 h-4 mr-1.5" /> {p.share_token ? "Copy Share Link" : "Share Video"}
                  </Button>
                  {p.status !== "completed" && (
                    <Button variant="hero" onClick={() => updateStatus(p.id, "completed")}>
                      <Check className="w-4 h-4 mr-1.5" /> Approve Video
                    </Button>
                  )}
                </div>
              </div>
            )}
            {/* Generate all images + view gallery */}
            {scenes.length > 0 && (
              <div className="flex justify-end gap-2">
                {scenes.some((s, i) => sceneImages[`${p.id}-${s.scene_number || i + 1}`]) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setGalleryFocusIndex(activeScene); setShowImageGallery(true); }}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" /> View All Images
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateAllSceneImages(scenes, p.id, p.format, p.platform)}
                  disabled={Object.values(generatingImages).some(Boolean)}
                >
                  {Object.values(generatingImages).some(Boolean)
                    ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating…</>
                    : <><ImageIcon className="w-4 h-4 mr-1" /> Generate All Images</>
                  }
                </Button>
              </div>
            )}

            {/* Playback preview — only shows image/placeholder + controls, no repeated text */}
            {scenes.length > 0 && (() => {
              const imageKey = `${p.id}-${scenes[activeScene]?.scene_number || activeScene + 1}`;
              const sceneImg = sceneImages[imageKey];
              const sceneOverlayText = normalizeVideoOverlayText(scenes[activeScene]?.text_overlay);
              return (
                <div className={`relative glass rounded-2xl overflow-hidden ${p.format === "9:16" ? "max-w-xs mx-auto aspect-[9/16]" : p.format === "1:1" ? "max-w-md mx-auto aspect-square" : "aspect-video"}`}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeScene}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {sceneImg ? (
                        <img src={sceneImg} alt={`Scene ${activeScene + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--accent) / 0.25) 50%, hsl(210 25% 12%) 100%)` }}>
                          <div className="text-center space-y-2">
                            <span className="text-[60px] font-black text-foreground/10">{scenes[activeScene]?.scene_number || activeScene + 1}</span>
                            {!generatingImages[imageKey] && (
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-black/30 border-white/20 text-white hover:bg-black/50"
                                  onClick={() => generateSceneImage(scenes[activeScene], p.id, p.format, p.platform)}
                                >
                                  <ImageIcon className="w-3 h-3 mr-1" /> Generate Image
                                </Button>
                              </div>
                            )}
                            {generatingImages[imageKey] && (
                              <div className="flex items-center gap-2 text-white/70">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Generating…</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Minimal overlay: scene badge + logo only */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <Badge className="bg-black/50 text-white border-white/20 text-[10px] backdrop-blur-sm">
                          Scene {scenes[activeScene]?.scene_number || activeScene + 1} — {scenes[activeScene]?.duration_seconds}s
                        </Badge>
                        <img src={overlayLogoSrc} alt="Brand Logo" className="h-4 w-auto opacity-70 drop-shadow-md" />
                      </div>
                      {/* Text overlay shown only if image is present */}
                      {sceneImg && sceneOverlayText && (
                        <div className="absolute bottom-5 left-1/2 z-10 w-[82%] -translate-x-1/2">
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="rounded-xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-sm">
                              <p className="text-base font-semibold leading-tight tracking-tight text-white text-center break-words">
                                {sceneOverlayText}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Playback controls — outside the preview */}
            {scenes.length > 0 && (
              <div className="flex items-center justify-center gap-3 glass rounded-full px-5 py-2 mx-auto w-fit">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (activeScene > 0) setActiveScene(activeScene - 1); }}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setIsPlaying(!isPlaying); }}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-xs text-muted-foreground min-w-[36px] text-center">{activeScene + 1}/{scenes.length}</span>
                <Progress value={((activeScene + 1) / scenes.length) * 100} className="w-24 h-1.5" />

                {/* Voice-over audio control */}
                {previewVoiceoverUrl && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Voice-over volume">
                        {voiceoverMuted || voiceoverVolume === 0 ? (
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mic className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium flex items-center gap-1.5"><Mic className="w-3 h-3" /> Voice-over</span>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setVoiceoverMuted((m) => !m)}>
                          {voiceoverMuted ? "Unmute" : "Mute"}
                        </Button>
                      </div>
                      <Slider value={[voiceoverMuted ? 0 : voiceoverVolume * 100]} min={0} max={100} step={1}
                        onValueChange={(v) => { setVoiceoverMuted(false); setVoiceoverVolume(v[0] / 100); }} />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Music audio control (volume persists to project) */}
                {previewMusicUrl && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Music volume">
                        {musicMuted || (activeProject?.music_volume ?? 0.25) === 0 ? (
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Music className="w-4 h-4 text-accent" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium flex items-center gap-1.5"><Music className="w-3 h-3" /> Music</span>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setMusicMuted((m) => !m)}>
                          {musicMuted ? "Unmute" : "Mute"}
                        </Button>
                      </div>
                      <Slider
                        value={[musicMuted ? 0 : Math.round((activeProject?.music_volume ?? 0.25) * 100)]}
                        min={0} max={100} step={1}
                        onValueChange={async (v) => {
                          setMusicMuted(false);
                          const newVol = v[0] / 100;
                          if (!activeProject) return;
                          // Optimistic local update for snappy slider
                          setActiveProject({ ...activeProject, music_volume: newVol });
                          await supabase
                            .from("video_projects")
                            .update({ music_volume: newVol })
                            .eq("id", activeProject.id);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                <NarratorControls
                  slides={videoNarratorSlides}
                  currentSlide={activeScene}
                  compact
                  isNarrating={isVideoNarrating}
                  rate={videoRate}
                  onStart={startVideoNarration}
                  onStop={stopVideoNarration}
                  onRateChange={setVideoRate}
                />
              </div>
            )}

            {/* Scene cards with thumbnails + edit button */}
            <div className="grid gap-3 sm:grid-cols-2">
              {scenes.map((scene, i) => {
                const imgKey = `${p.id}-${scene.scene_number || i + 1}`;
                const sceneImg = sceneImages[imgKey];
                const isGenImg = generatingImages[imgKey];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setActiveScene(i); setIsPlaying(false); setGalleryFocusIndex(i); setShowImageGallery(true); }}
                    className={`glass rounded-xl overflow-hidden cursor-pointer text-left transition-all ${activeScene === i ? "border-primary/50 shadow-glow" : "hover:border-border"}`}
                  >
                    <div className="relative h-24 overflow-hidden">
                      {sceneImg ? (
                        <img src={sceneImg} alt={`Scene ${scene.scene_number || i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.15))` }}>
                          {isGenImg ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); generateSceneImage(scene, p.id, p.format, p.platform); }}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" />
                              <span>Generate</span>
                            </button>
                          )}
                        </div>
                      )}
                      <Badge variant="outline" className="absolute top-2 left-2 text-[10px] bg-black/50 text-white border-white/20 backdrop-blur-sm">
                        Scene {scene.scene_number || i + 1}
                      </Badge>
                      {/* Download + Edit buttons */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {sceneImg && (
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadSceneImage(sceneImg, `${p.title}-scene-${scene.scene_number || i + 1}.png`); }}
                            className="w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditScene(i, scene); }}
                          className="w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {scene.duration_seconds}s
                        </div>
                        {scene.transition && scene.transition !== "none" && (
                          <Badge variant="outline" className="text-[10px]">{scene.transition}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground/90 line-clamp-2">{scene.visual}</p>
                      {scene.text_overlay && (
                        <div className="flex items-center gap-1 text-[10px] text-primary">
                          <Type className="w-3 h-3" />
                          {scene.text_overlay}
                        </div>
                      )}
                      {/* Per-scene animation selector */}
                      <div className="pt-1">
                        <Select
                          value={sceneAnimations[i] || ""}
                          onValueChange={(v) => setSceneAnimations(prev => ({ ...prev, [i]: v as SceneAnimation | "auto" }))}
                        >
                          <SelectTrigger className="h-6 text-[10px] bg-background/50 w-full">
                            <Film className="w-3 h-3 mr-1 text-primary flex-shrink-0" />
                            <SelectValue placeholder={`Auto (${resolveSceneAnimation(animationPreset, i)})`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">
                              <span className="text-muted-foreground">Auto ({resolveSceneAnimation(animationPreset, i)})</span>
                            </SelectItem>
                            {SCENE_ANIMATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            {script && (
              <div className="flex justify-end">
                <TranslateMenu
                  script={script}
                  onTranslated={(next, lang) => { void replaceScript(next); }}
                />
              </div>
            )}
            {script && (
              <>
                {script.hook && (
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-primary" /> Hook (First 3s)</h4>
                      <RewriteMenu
                        text={script.hook}
                        fieldHint="hook line, max 12 words, attention-grabbing"
                        onRewritten={(next) => applyScriptPatch({ hook: next })}
                      />
                    </div>
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{scene.duration_seconds}s • {scene.transition}</span>
                            <button
                              onClick={() => startEditScene(i, scene)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm flex items-center gap-1.5">Call to Action</h4>
                      <RewriteMenu
                        text={script.cta}
                        fieldHint="short CTA, ideally under 6 words"
                        onRewritten={(next) => applyScriptPatch({ cta: next })}
                      />
                    </div>
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
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] text-muted-foreground">Headline</p>
                      <RewriteMenu
                        text={script.ad_copy.headline}
                        fieldHint="ad headline, max 10 words"
                        onRewritten={(next) =>
                          applyScriptPatch({ ad_copy: { ...(script.ad_copy ?? {}), headline: next } })
                        }
                      />
                    </div>
                    <p className="text-sm font-semibold">{script.ad_copy.headline}</p>
                  </div>
                )}
                {script.ad_copy.description && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] text-muted-foreground">Description</p>
                      <RewriteMenu
                        text={script.ad_copy.description}
                        fieldHint="ad description / supporting copy"
                        onRewritten={(next) =>
                          applyScriptPatch({ ad_copy: { ...(script.ad_copy ?? {}), description: next } })
                        }
                      />
                    </div>
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

            {/* Publishing Links */}
            <PublishingLinks project={p} script={script} onUpdate={(updatedProject) => {
              setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updatedProject : proj)));
              if (activeProject?.id === p.id) setActiveProject(updatedProject);
            }} />
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <AdTemplateGallery
                selectedTemplate={p.template_style ?? undefined}
                selectedPreset={p.ad_preset ?? undefined}
                onTemplateSelect={async (tpl: AdTemplate) => {
                  const { data, error } = await supabase
                    .from("video_projects")
                    .update({ template_style: tpl.id })
                    .eq("id", p.id)
                    .select("*")
                    .single();
                  if (error || !data) {
                    toast({ title: "Save failed", description: error?.message, variant: "destructive" });
                    return;
                  }
                  const updated = mapVideoProject(data);
                  setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updated : proj)));
                  setActiveProject(updated);
                  toast({ title: "Style applied", description: `${tpl.name} attached to this project.` });
                }}
                onPresetSelect={async (preset: AdPreset) => {
                  const { data, error } = await supabase
                    .from("video_projects")
                    .update({ ad_preset: preset.id, format: preset.format })
                    .eq("id", p.id)
                    .select("*")
                    .single();
                  if (error || !data) {
                    toast({ title: "Save failed", description: error?.message, variant: "destructive" });
                    return;
                  }
                  const updated = mapVideoProject(data);
                  setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updated : proj)));
                  setActiveProject(updated);
                  toast({ title: "Preset applied", description: `${preset.name} • ${preset.duration}s • ${preset.format}` });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <div className="glass rounded-2xl p-5 h-[600px]">
              <VoiceoverStudio
                videoId={p.id}
                selectedId={p.voiceover_id}
                initialScript={(() => {
                  const scenes = p.script?.scenes || p.storyboard || [];
                  const lines = scenes
                    .map((s) => s.voiceover || s.text_overlay)
                    .filter((s): s is string => !!s && s.trim().length > 0);
                  if (lines.length > 0) return lines.join(" ");
                  return [p.script?.hook, p.script?.description, p.script?.cta]
                    .filter(Boolean)
                    .join(" ");
                })()}
                onSelect={async (vo) => {
                  const { data, error } = await supabase
                    .from("video_projects")
                    .update({ voiceover_id: vo.id })
                    .eq("id", p.id)
                    .select("*")
                    .single();
                  if (error || !data) {
                    toast({ title: "Save failed", description: error?.message, variant: "destructive" });
                    return;
                  }
                  const updated = mapVideoProject(data);
                  setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updated : proj)));
                  setActiveProject(updated);
                  toast({ title: "Voice-over attached", description: "Re-rendering video with narration…" });
                  autoRenderPipeline(updated);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <div className="glass rounded-2xl p-5 h-[600px]">
              <MusicLibrary
                selectedTrackId={p.music_track_id}
                volume={p.music_volume ?? 0.25}
                onVolumeChange={async (v) => {
                  const { data } = await supabase
                    .from("video_projects")
                    .update({ music_volume: v })
                    .eq("id", p.id)
                    .select("*")
                    .single();
                  if (data) {
                    const updated = mapVideoProject(data);
                    setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updated : proj)));
                    setActiveProject(updated);
                  }
                }}
                onSelect={async (track: AudioTrack | null) => {
                  const { data, error } = await supabase
                    .from("video_projects")
                    .update({ music_track_id: track?.id ?? null })
                    .eq("id", p.id)
                    .select("*")
                    .single();
                  if (error || !data) {
                    toast({ title: "Save failed", description: error?.message, variant: "destructive" });
                    return;
                  }
                  const updated = mapVideoProject(data);
                  setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updated : proj)));
                  setActiveProject(updated);
                  if (track) {
                    toast({ title: "Music attached", description: `${track.name} — re-rendering video…` });
                    autoRenderPipeline(updated);
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="thumbnail" className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <ThumbnailGenerator
                videoId={p.id}
                title={script?.title || p.title}
                description={script?.description || p.description}
                brand={script?.ad_copy?.headline}
                cta={script?.cta}
                format={p.format}
                currentThumbnail={p.thumbnail_url}
                onThumbnailUpdated={(signedUrl) => {
                  setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, thumbnail_url: signedUrl } : proj));
                  setActiveProject((prev) => prev && prev.id === p.id ? { ...prev, thumbnail_url: signedUrl } : prev);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Logo footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          <img src={logoImg} alt="Valyarolex.AI" className="h-6 mx-auto mb-1 opacity-60" />
          Powered by <span className="text-primary font-semibold">Valyarolex.AI</span>
        </div>

        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Bulk Ad Creator</DialogTitle>
              <DialogDescription>Create up to 20 ads at once. Each becomes its own draft project.</DialogDescription>
            </DialogHeader>
            <BulkAdCreator onDone={() => { void loadProjects(); setBulkOpen(false); }} />
          </DialogContent>
        </Dialog>

        {sceneEditDialogJsx}

        {/* All Scene Images Gallery */}
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Scene Images — {p.title}
              </DialogTitle>
              <DialogDescription>
                All visuals generated for this storyboard. Click the download icon to save any image.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-3">
              <div className="grid gap-4 sm:grid-cols-2">
                {scenes.map((scene, i) => {
                  const imgKey = `${p.id}-${scene.scene_number || i + 1}`;
                  const sceneImg = sceneImages[imgKey];
                  const isGen = generatingImages[imgKey];
                  const isFocus = i === galleryFocusIndex;
                  return (
                    <div
                      key={i}
                      className={`glass rounded-xl overflow-hidden border ${isFocus ? "border-primary/60 shadow-glow" : "border-border/50"}`}
                    >
                      <div className={`relative ${p.format === "9:16" ? "aspect-[9/16]" : p.format === "1:1" ? "aspect-square" : "aspect-video"} bg-muted/20`}>
                        {sceneImg ? (
                          <img
                            src={sceneImg}
                            alt={`Scene ${scene.scene_number || i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            {isGen ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-xs">Generating…</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-6 h-6 opacity-50" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateSceneImage(scene, p.id, p.format, p.platform)}
                                >
                                  Generate Image
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white border-white/20 text-[10px] backdrop-blur-sm">
                          Scene {scene.scene_number || i + 1} — {scene.duration_seconds}s
                        </Badge>
                        {sceneImg && (
                          <button
                            onClick={() => downloadSceneImage(sceneImg, `${p.title}-scene-${scene.scene_number || i + 1}.png`)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs text-foreground/90 line-clamp-2">{scene.visual}</p>
                        {scene.text_overlay && (
                          <p className="text-[10px] text-primary line-clamp-1">"{scene.text_overlay}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <PreviewDialogComponent />
      </>
    );
  }

        <VerticalTemplatePicker selectedId={pickedVerticalId} onPick={applyVerticalTemplate} />


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

        {/* Reference image + Client logo upload + branding toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer glass rounded-lg px-3 py-2 text-xs hover:border-primary/30 transition-colors">
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>{referenceImage ? "Change Reference Image" : "Upload Reference Image"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
          </label>
          {referenceImage && (
            <div className="flex items-center gap-2">
              <img src={referenceImage} alt="Reference" className="h-8 w-8 rounded object-cover border border-border/50" />
              <button onClick={() => setReferenceImage(null)} className="text-[10px] text-destructive hover:underline">Remove</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer glass rounded-lg px-3 py-2 text-xs hover:border-primary/30 transition-colors border border-dashed border-primary/20">
            <ImageIcon className="w-3.5 h-3.5 text-accent" />
            <span>{clientLogo ? "Change Client Logo" : "Upload Client Logo"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleClientLogoUpload} />
          </label>
          {clientLogo && (
            <div className="flex items-center gap-2">
              <img src={clientLogo} alt="Client Logo" className="h-8 w-8 rounded object-contain border border-border/50 bg-background/50" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{clientLogoName}</span>
              <button onClick={() => { setClientLogo(null); setClientLogoName(""); }} className="text-[10px] text-destructive hover:underline">Remove</button>
            </div>
          )}
          {!clientLogo && (
            <span className="text-[10px] text-muted-foreground italic">Using default Valyarolex.AI logo</span>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground ml-auto">
            <input
              type="checkbox"
              checked={includeBranding}
              onChange={(e) => setIncludeBranding(e.target.checked)}
              className="rounded border-border"
            />
            Auto-include brand logo
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Animation Style</label>
            <Select value={animationPreset} onValueChange={(v) => setAnimationPreset(v as AnimationPreset)}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANIMATION_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">— {p.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Palette className="w-3 h-3" />Visual Style</label>
            <Select value={preGenStyle} onValueChange={setPreGenStyle}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kinetic">Kinetic Typography</SelectItem>
                <SelectItem value="cinematic">Cinematic Live-Action</SelectItem>
                <SelectItem value="commercial-animated">Commercial Animated</SelectItem>
                <SelectItem value="3d-animated">3D Animated</SelectItem>
                <SelectItem value="2d-animated">2D Cartoon</SelectItem>
                <SelectItem value="minimal">Minimal / Clean</SelectItem>
                <SelectItem value="ugc">UGC / Selfie Style</SelectItem>
                <SelectItem value="motion-graphics">Motion Graphics</SelectItem>
                <SelectItem value="retro">Retro / Vintage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Mic className="w-3 h-3" />Voice</label>
            <Select value={preGenVoiceId} onValueChange={setPreGenVoiceId}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.name} <span className="text-muted-foreground ml-1">— {v.style}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Music className="w-3 h-3" />Music</label>
            <Select value={preGenTrackId ?? "__none"} onValueChange={(v) => setPreGenTrackId(v === "__none" ? null : v)}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No background music</SelectItem>
                {availableTracks.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name} <span className="text-muted-foreground ml-1">— {t.mood}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
          <Button variant="outline" onClick={() => setBulkOpen(true)} title="Generate up to 20 ads at once">
            <Layers className="w-4 h-4 mr-1" /> Bulk Create
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
                className="glass rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                  {p.thumbnail_url ? (
                    <img
                      src={p.thumbnail_url}
                      alt={`Thumbnail for ${p.title}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--accent) / 0.2))` }}>
                      <FormatIcon className="w-10 h-10 text-primary/70" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge className={`${PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.general} text-[9px] px-1.5`}>{p.platform}</Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5">{p.format}</Badge>
                    <Badge className={`${STATUS_COLORS[p.status] || STATUS_COLORS.draft} text-[9px] px-1.5`}>{p.status}</Badge>
                    {p.script?.last_render_meta ? (
                      isRenderInSync(p) ? (
                        <Badge className="bg-green-500/20 text-green-400 border-transparent text-[9px] px-1.5" title="Exported video matches current voice-over, music, and scenes.">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> In sync
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-transparent text-[9px] px-1.5" title="Voice-over, music, or scenes changed since the last export.">
                          <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Stale
                        </Badge>
                      )
                    ) : null}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Film className="w-3 h-3" />
                    {p.storyboard?.length || 0} scenes
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

    <PreviewDialogComponent />
    </>
  );
};

export default VideoStudio;
