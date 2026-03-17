import { useState, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Sparkles, Plus, Loader2, ChevronLeft, Trash2, Play, Pause,
  Clock, Film, Monitor, Smartphone, Square, Eye, Check, X, Music,
  Type, Camera, Mic, ImageIcon, Pencil, Send, RotateCcw, Save, Link, ExternalLink, Download,
  FileVideo
} from "lucide-react";
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
import { renderVideo } from "@/lib/render-video";

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
    scenes: Array.isArray(script.scenes) ? (script.scenes as Scene[]) : [],
    ad_copy: script.ad_copy,
    publishing_links:
      rawLinks && typeof rawLinks === "object" && !Array.isArray(rawLinks)
        ? Object.fromEntries(Object.entries(rawLinks).map(([key, link]) => [key, String(link ?? "")]))
        : {},
  };
};

const getStoryboardScenes = (value: unknown): Scene[] => {
  return Array.isArray(value) ? (value as Scene[]) : [];
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
  const nextScenes = overrides.scenes ?? fallbackScenes;

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
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [generatingPreviewImages, setGeneratingPreviewImages] = useState<Record<number, boolean>>({});
  const [previewImagesRequested, setPreviewImagesRequested] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  // Scene editing state
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Scene>>({});
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const generateSceneImage = async (scene: Scene, projectId: string, format: string, platform: string) => {
    const key = `${projectId}-${scene.scene_number}`;
    if (generatingImages[key]) return;
    setGeneratingImages(prev => ({ ...prev, [key]: true }));
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
          format,
          platform,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Image generation failed" }));
        throw new Error(err.error || "Image generation failed");
      }
      const { image_url } = await resp.json();
      setSceneImages(prev => ({ ...prev, [key]: image_url }));
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
    updatedScenes[editingScene] = { ...updatedScenes[editingScene], ...editForm } as Scene;

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
    toast({ title: "Scene Updated", description: `Scene ${updatedScenes[editingScene].scene_number} saved.` });
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
      setPreviewImages({});
      setGeneratingPreviewImages({});
      setPreviewImagesRequested(false);
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
    // Generate 128-bit token (32 hex chars) to match campaign token strength
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    const token = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("video_projects").update({ share_token: token } as any).eq("id", id);
    if (error) {
      toast({ title: "Share Failed", description: error.message, variant: "destructive" });
      return;
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, share_token: token } : p));
    if (activeProject?.id === id) setActiveProject(prev => prev ? { ...prev, share_token: token } : null);
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
      const blob = await renderVideo({
        format: p.format,
        scenes: sceneInputs as { imageUrl: string; durationSeconds: number; textOverlay?: string }[],
        onProgress: setExportProgress,
      });

      // Upload to storage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const filePath = `${session.user.id}/${p.id}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("video-exports")
        .upload(filePath, blob, { upsert: true, contentType: "video/webm" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("video-exports")
        .getPublicUrl(filePath);

      // Save URL to project
      await supabase
        .from("video_projects")
        .update({ exported_video_url: publicUrl } as any)
        .eq("id", p.id);

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

  // Scene edit dialog
  const SceneEditDialog = () => {
    if (editingScene === null || !activeProject) return null;
    const scene = editForm as Scene;

    return (
      <Dialog open={editingScene !== null} onOpenChange={(v) => { if (!v) cancelEditScene(); }}>
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
  };

  // Detail view
  // Preview dialog - defined before conditional returns so it's accessible everywhere
  const PreviewDialogComponent = () => {
    const [previewScene, setPreviewScene] = useState(0);

    if (!previewData) return null;
    const scenes = previewData.scenes || [];
    const scene = scenes[previewScene];
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
                        <img src={logoImg} alt="Valyarolex.AI" className="h-3.5 w-auto opacity-70 drop-shadow-md" />
                      </div>
                      {/* Text overlay on image */}
                      {scene.text_overlay && currentImage && (
                        <div className="absolute bottom-14 left-0 right-0 px-4 z-10">
                          <p className="text-lg font-bold text-white drop-shadow-lg text-center">{scene.text_overlay}</p>
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
                  {scene.text_overlay && <p className="text-xs text-primary"><span className="font-medium">Text:</span> {scene.text_overlay}</p>}
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
            <Button size="sm" variant="outline" onClick={() => shareVideo(p.id)}>
              <Link className="w-4 h-4 mr-1" /> {p.share_token ? "Copy Link" : "Share"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportVideo} disabled={isExporting}>
              {isExporting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {exportProgress !== null ? `${exportProgress}%` : "Exporting…"}</>
              ) : (
                <><FileVideo className="w-4 h-4 mr-1" /> Export Video</>
              )}
            </Button>
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
            {/* Generate all images button */}
            {scenes.length > 0 && (
              <div className="flex justify-end">
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
                        <img src={logoImg} alt="Valyarolex.AI" className="h-4 w-auto opacity-70 drop-shadow-md" />
                      </div>
                      {/* Text overlay shown only if image is present */}
                      {sceneImg && scenes[activeScene]?.text_overlay && (
                        <div className="absolute bottom-14 left-0 right-0 px-4 z-10">
                          <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg font-bold text-white drop-shadow-lg text-center"
                          >
                            {scenes[activeScene].text_overlay}
                          </motion.p>
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
                    onClick={() => { setActiveScene(i); setIsPlaying(false); }}
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
                    </div>
                  </motion.div>
                );
              })}
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

            {/* Publishing Links */}
            <PublishingLinks project={p} script={script} onUpdate={(updatedProject) => {
              setProjects((prev) => prev.map((proj) => (proj.id === p.id ? updatedProject : proj)));
              if (activeProject?.id === p.id) setActiveProject(updatedProject);
            }} />
          </TabsContent>
        </Tabs>

        <SceneEditDialog />
      </div>
      <PreviewDialogComponent />
      </>
    );
  }


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
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))` }}>
                      <FormatIcon className="w-5 h-5 text-primary relative z-10" />
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

    <PreviewDialogComponent />
    </>
  );
};

export default VideoStudio;
