import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Play, Pause, ChevronLeft, ChevronRight, Film, Clock, Monitor, Smartphone, Square, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/valyarolex-logo.png";
import { normalizeVideoOverlayText } from "@/lib/video-script";

const SCENE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scene-image`;

type Scene = {
  scene_number: number;
  duration_seconds: number;
  visual: string;
  text_overlay?: string;
  voiceover?: string;
  transition: string;
};

type VideoData = {
  title: string;
  description?: string;
  format: string;
  duration_seconds: number;
  platform: string;
  hook?: string;
  cta?: string;
  scenes: Scene[];
  ad_copy?: { headline?: string; description?: string };
};

const SharedVideo = () => {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeScene, setActiveScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [generatingImages, setGeneratingImages] = useState(false);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const SIGNED_URL_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-video-url`;

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_shared_video", { p_share_token: token });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setError("Video not found or link has expired.");
      } else {
        const video = Array.isArray(data) ? data[0] : data;
        setProject(video);
        // Generate images for scenes
        generateImages(video);
        // Fetch signed URL for exported video via edge function
        try {
          const resp = await fetch(SIGNED_URL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ share_token: token }),
          });
          if (resp.ok) {
            const { signed_url } = await resp.json();
            if (signed_url) setSignedVideoUrl(signed_url);
          }
        } catch { /* fall back to slideshow */ }
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const generateImages = async (video: any) => {
    const script: VideoData | null = video.script;
    const scenes = script?.scenes || video.storyboard || [];
    if (scenes.length === 0) return;
    setGeneratingImages(true);
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      try {
        const resp = await fetch(SCENE_IMAGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || "anon"}`,
          },
          body: JSON.stringify({
            visual: scene.visual,
            text_overlay: scene.text_overlay,
            format: video.format,
            platform: video.platform,
          }),
        });
        if (resp.ok) {
          const { image_url } = await resp.json();
          if (image_url) setSceneImages(prev => ({ ...prev, [i]: image_url }));
        }
      } catch { /* skip */ }
    }
    setGeneratingImages(false);
  };

  // Auto-play
  useEffect(() => {
    if (!isPlaying || !project) return;
    const script: VideoData | null = project.script;
    const scenes = script?.scenes || project.storyboard || [];
    const scene = scenes[activeScene];
    const dur = (scene?.duration_seconds || 3) * 1000;
    intervalRef.current = setInterval(() => {
      setActiveScene(prev => {
        if (prev >= scenes.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, dur);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, activeScene, project]);

  const downloadImage = async (url: string, name: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Film className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-lg text-muted-foreground">{error || "Video not found"}</p>
        </div>
      </div>
    );
  }

  const script: VideoData | null = project.script;
  const scenes: Scene[] = script?.scenes || project.storyboard || [];
  const scene = scenes[activeScene];
  const overlayText = normalizeVideoOverlayText(scene?.text_overlay);
  const FormatIcon = project.format === "9:16" ? Smartphone : project.format === "1:1" ? Square : Monitor;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Valyarolex.AI" className="h-6 w-auto" />
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium truncate">{project.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{project.platform}</Badge>
            <Badge variant="outline"><FormatIcon className="w-3 h-3 mr-1" />{project.format}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Native video player if exported */}
        {signedVideoUrl && (
          <div className="space-y-4">
            <div className={`relative rounded-2xl overflow-hidden mx-auto ${
              project.format === "9:16" ? "max-w-[320px] aspect-[9/16]" :
              project.format === "1:1" ? "max-w-[480px] aspect-square" :
              "aspect-video"
            }`}>
              <video
                src={signedVideoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" onClick={() => {
                const a = document.createElement("a");
                a.href = signedVideoUrl;
                a.download = `${project.title}.webm`;
                a.click();
              }}>
                <Download className="w-4 h-4 mr-1" /> Download Video
              </Button>
            </div>
          </div>
        )}

        {/* Slideshow fallback when no exported video */}
        {!signedVideoUrl && (
        <div className="space-y-4">
          <div className={`relative glass rounded-2xl overflow-hidden mx-auto ${
            project.format === "9:16" ? "max-w-[320px] aspect-[9/16]" :
            project.format === "1:1" ? "max-w-[480px] aspect-square" :
            "aspect-video"
          }`}>
            <AnimatePresence mode="wait">
              {scene && (
                <motion.div
                  key={activeScene}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  {sceneImages[activeScene] ? (
                    <img src={sceneImages[activeScene]} alt={`Scene ${activeScene + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25), hsl(210 25% 12%))" }}
                    >
                      {generatingImages ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-muted-foreground">Generating visuals…</span>
                        </div>
                      ) : (
                        <span className="text-[80px] font-black text-foreground/10">{(scene.scene_number || activeScene + 1)}</span>
                      )}
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <Badge className="bg-black/50 text-white border-white/20 text-[10px] backdrop-blur-sm">
                      Scene {scene.scene_number || activeScene + 1} — {scene.duration_seconds}s
                    </Badge>
                    <img src={logoImg} alt="Valyarolex.AI" className="h-3.5 w-auto opacity-70 drop-shadow-md" />
                  </div>

                  {overlayText && (
                    <div className="absolute bottom-5 left-1/2 z-10 w-[82%] -translate-x-1/2">
                      <div className="rounded-xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-sm">
                        <p className="text-base font-semibold leading-tight tracking-tight text-white text-center break-words">{overlayText}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => setActiveScene(Math.max(0, activeScene - 1))} disabled={activeScene === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setActiveScene(Math.min(scenes.length - 1, activeScene + 1))} disabled={activeScene >= scenes.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Scene dots */}
          <div className="flex items-center justify-center gap-1.5">
            {scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveScene(i); setIsPlaying(false); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeScene ? "bg-primary w-5" : sceneImages[i] ? "bg-accent/60" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </div>
        )}

        {/* Scene details */}
        {scene && (
          <div className="glass rounded-xl p-5 space-y-2">
            <p className="text-sm"><span className="font-medium text-foreground">Visual:</span> <span className="text-muted-foreground">{scene.visual}</span></p>
            {scene.voiceover && <p className="text-sm"><span className="font-medium text-foreground">Voiceover:</span> <span className="text-muted-foreground">"{scene.voiceover}"</span></p>}
            {overlayText && <p className="text-sm text-primary"><span className="font-medium">Text:</span> {overlayText}</p>}
          </div>
        )}

        {/* Ad copy */}
        {script?.ad_copy && (
          <div className="glass rounded-xl p-5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ad Copy</p>
            {script.ad_copy.headline && <p className="text-lg font-semibold">{script.ad_copy.headline}</p>}
            {script.ad_copy.description && <p className="text-sm text-muted-foreground">{script.ad_copy.description}</p>}
          </div>
        )}

        {/* Download section */}
        {Object.keys(sceneImages).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" /> Download Scene Images
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {scenes.map((s, i) => (
                sceneImages[i] && (
                  <div key={i} className="glass rounded-lg overflow-hidden group relative">
                    <img src={sceneImages[i]} alt={`Scene ${i + 1}`} className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => downloadImage(sceneImages[i], `${project.title}-scene-${i + 1}.png`)}
                      >
                        <Download className="w-3 h-3 mr-1" /> Scene {i + 1}
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border/20">
          <p className="text-xs text-muted-foreground">
            Created with <img src={logoImg} alt="Valyarolex.AI" className="inline h-3 w-auto mx-1 opacity-70" /> Valyarolex.AI
          </p>
        </div>
      </main>
    </div>
  );
};

export default SharedVideo;
