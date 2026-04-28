// Unified Media Library — single browse/download surface for every asset
// the user has produced or uploaded:
//  • Brand assets (logos)         → public bucket "brand-assets"
//  • Voice-overs                  → private "audio-assets" via signed URL
//  • Music tracks (own + curated) → private "audio-assets" via signed URL
//  • Video exports                → row.exported_video_url
//  • Thumbnails                   → row.thumbnail_url
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Image as ImageIcon, Music, Mic, Film, Download,
  Search, RefreshCw, ExternalLink, FolderOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type MediaKind = "image" | "audio" | "video";

interface MediaItem {
  id: string;
  kind: MediaKind;
  category: "logo" | "voiceover" | "music" | "video" | "thumbnail";
  name: string;
  subtitle?: string;
  url: string;            // playable / displayable URL (may be signed)
  downloadUrl: string;    // same as url for now
  createdAt?: string;
  meta?: Record<string, any>;
}

const CATEGORY_LABEL: Record<MediaItem["category"], string> = {
  logo: "Logos",
  voiceover: "Voice-overs",
  music: "Music",
  video: "Video Exports",
  thumbnail: "Thumbnails",
};

const CATEGORY_ICON: Record<MediaItem["category"], any> = {
  logo: ImageIcon,
  voiceover: Mic,
  music: Music,
  video: Film,
  thumbnail: ImageIcon,
};

async function signedUrl(bucket: string, path: string, ttl = 60 * 60): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export default function MediaLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | MediaItem["category"]>("all");

  const load = async () => {
    if (!user) return;
    const collected: MediaItem[] = [];

    // 1) Logos in public brand-assets bucket — list user's folder
    try {
      const { data: files } = await supabase.storage
        .from("brand-assets")
        .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      (files ?? []).forEach((f) => {
        if (f.name.startsWith(".")) return;
        const path = `${user.id}/${f.name}`;
        const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
        collected.push({
          id: `logo:${path}`,
          kind: "image",
          category: "logo",
          name: f.name,
          subtitle: "Brand asset",
          url: pub.publicUrl,
          downloadUrl: pub.publicUrl,
          createdAt: (f as any).created_at,
        });
      });
    } catch (e) {
      console.warn("media-library: logo listing failed", e);
    }

    // 2) Voice-overs (DB row → signed URL)
    const { data: vos } = await supabase
      .from("voiceovers")
      .select("id,storage_path,script,voice_id,duration_seconds,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    for (const v of vos ?? []) {
      const url = await signedUrl("audio-assets", v.storage_path);
      if (!url) continue;
      collected.push({
        id: `vo:${v.id}`,
        kind: "audio",
        category: "voiceover",
        name: (v.script || "Voice-over").slice(0, 60),
        subtitle: v.voice_id ? `Voice ${v.voice_id}` : "Voice-over",
        url,
        downloadUrl: url,
        createdAt: v.created_at,
        meta: { duration: v.duration_seconds },
      });
    }

    // 3) Music tracks (own + curated) — RLS already filters
    const { data: tracks } = await supabase
      .from("audio_tracks")
      .select("id,name,artist,mood,duration_seconds,storage_path,is_curated,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    for (const t of tracks ?? []) {
      const url = await signedUrl("audio-assets", t.storage_path);
      if (!url) continue;
      collected.push({
        id: `music:${t.id}`,
        kind: "audio",
        category: "music",
        name: t.name,
        subtitle: `${t.is_curated ? "Curated" : "Yours"} · ${t.mood}${t.artist ? ` · ${t.artist}` : ""}`,
        url,
        downloadUrl: url,
        createdAt: t.created_at,
        meta: { duration: t.duration_seconds },
      });
    }

    // 4) Video exports + thumbnails
    const { data: vids } = await supabase
      .from("video_projects")
      .select("id,title,exported_video_url,thumbnail_url,format,duration_type,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    (vids ?? []).forEach((v) => {
      if (v.exported_video_url) {
        collected.push({
          id: `vid:${v.id}`,
          kind: "video",
          category: "video",
          name: v.title || "Untitled video",
          subtitle: `${v.format} · ${v.duration_type}`,
          url: v.exported_video_url,
          downloadUrl: v.exported_video_url,
          createdAt: v.created_at,
        });
      }
      if (v.thumbnail_url) {
        collected.push({
          id: `thumb:${v.id}`,
          kind: "image",
          category: "thumbnail",
          name: `${v.title || "Untitled"} — thumbnail`,
          subtitle: "Generated thumbnail",
          url: v.thumbnail_url,
          downloadUrl: v.thumbnail_url,
          createdAt: v.created_at,
        });
      }
    });

    // Sort newest first overall
    collected.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    setItems(collected);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.category] = (c[i.category] || 0) + 1));
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== "all" && i.category !== tab) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.subtitle || "").toLowerCase().includes(q)
      );
    });
  }, [items, search, tab]);

  const handleDownload = async (item: MediaItem) => {
    try {
      // Same-origin? simple <a download>. Cross-origin signed URLs may ignore
      // the download attribute; fall back to opening in a new tab.
      const a = document.createElement("a");
      a.href = item.downloadUrl;
      a.download = item.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Media Library
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            One place for every logo, voice-over, music track, video export, and thumbnail you've created.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all" className="text-xs">All <span className="ml-1.5 opacity-60">{counts.all ?? 0}</span></TabsTrigger>
          {(Object.keys(CATEGORY_LABEL) as MediaItem["category"][]).map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                <Icon className="w-3 h-3 mr-1" />
                {CATEGORY_LABEL[cat]}
                <span className="ml-1.5 opacity-60">{counts[cat] ?? 0}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Loading your media…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No media yet. Generate a video, voice-over, or upload a brand asset to populate this library.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[640px] pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((item) => (
                  <MediaCard key={item.id} item={item} onDownload={handleDownload} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MediaCard({
  item,
  onDownload,
}: {
  item: MediaItem;
  onDownload: (i: MediaItem) => void;
}) {
  const Icon = CATEGORY_ICON[item.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl overflow-hidden flex flex-col"
    >
      <div className="aspect-video bg-muted/30 flex items-center justify-center relative overflow-hidden">
        {item.kind === "image" ? (
          <img
            src={item.url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        ) : item.kind === "video" ? (
          <video
            src={item.url}
            controls
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-3 w-full">
            <Icon className="w-6 h-6 text-primary" />
            <audio src={item.url} controls className="w-full h-8" preload="none" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[9px] uppercase tracking-wider"
        >
          {item.category}
        </Badge>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold truncate" title={item.name}>{item.name}</h4>
          {item.subtitle && (
            <p className="text-[10px] text-muted-foreground truncate" title={item.subtitle}>{item.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] flex-1"
            onClick={() => onDownload(item)}
          >
            <Download className="w-3 h-3 mr-1" /> Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            asChild
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
