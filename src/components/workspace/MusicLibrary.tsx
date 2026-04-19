import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music, Play, Pause, Upload, Loader2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AudioTrack = {
  id: string;
  name: string;
  artist: string | null;
  mood: string;
  duration_seconds: number | null;
  storage_path: string;
  is_curated: boolean;
};

const MOODS = ["all", "upbeat", "cinematic", "corporate", "chill", "dramatic", "tech", "acoustic"] as const;

interface MusicLibraryProps {
  selectedTrackId?: string | null;
  onSelect?: (track: AudioTrack | null) => void;
  volume?: number;
  onVolumeChange?: (v: number) => void;
}

export function MusicLibrary({ selectedTrackId, onSelect, volume = 0.25, onVolumeChange }: MusicLibraryProps) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    loadTracks();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audio_tracks")
      .select("*")
      .order("is_curated", { ascending: false })
      .order("name");
    if (error) {
      toast.error("Could not load tracks");
    } else {
      setTracks((data ?? []) as AudioTrack[]);
    }
    setLoading(false);
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    const cached = urlCacheRef.current.get(path);
    if (cached) return cached;
    const { data, error } = await supabase.functions.invoke("get-audio-url", { body: { path } });
    if (error || !data?.url) return null;
    urlCacheRef.current.set(path, data.url);
    return data.url;
  };

  const togglePlay = async (track: AudioTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const url = await getSignedUrl(track.storage_path);
    if (!url) {
      toast.error("Could not load track preview. The curated audio file may not be uploaded yet.");
      return;
    }
    const audio = new Audio(url);
    audio.volume = volume;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      toast.error("Playback failed");
      setPlayingId(null);
    };
    audioRef.current = audio;
    setPlayingId(track.id);
    audio.play().catch(() => {
      toast.error("Browser blocked playback");
      setPlayingId(null);
    });
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
      const path = `${user.id}/uploads/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("audio-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("audio_tracks").insert({
        user_id: user.id,
        name: file.name.replace(/\.[^.]+$/, ""),
        artist: "You",
        mood: "custom",
        storage_path: path,
        is_curated: false,
      });
      if (insErr) throw insErr;
      toast.success("Track uploaded");
      loadTracks();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filtered = tracks.filter((t) => {
    if (moodFilter !== "all" && t.mood !== moodFilter) return false;
    if (search && !`${t.name} ${t.artist}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const curated = filtered.filter((t) => t.is_curated);
  const userTracks = filtered.filter((t) => !t.is_curated);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Music className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Music Library</h3>
          <p className="text-xs text-muted-foreground">Royalty-free background tracks</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://pixabay.com/music/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-primary hover:underline whitespace-nowrap"
            title="Browse free, royalty-free music on Pixabay then upload your picks here"
          >
            Browse Pixabay ↗
          </a>
          <input
            type="file"
            id="track-upload"
            accept="audio/mpeg,audio/mp3,audio/wav"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="track-upload">
            <Button asChild size="sm" variant="outline" disabled={uploading}>
              <span className="cursor-pointer">
                {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                Upload
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-3 pb-1">
        {MOODS.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={moodFilter === m ? "default" : "outline"}
            onClick={() => setMoodFilter(m)}
            className="h-7 text-[10px] capitalize px-2"
          >
            {m}
          </Button>
        ))}
      </div>

      {onVolumeChange && (
        <div className="mb-3 px-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Background music volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => {
              onVolumeChange(v / 100);
              if (audioRef.current) audioRef.current.volume = v / 100;
            }}
            max={100}
            step={5}
          />
        </div>
      )}

      <ScrollArea className="flex-1 pr-2">
        <Tabs defaultValue="curated">
          <TabsList className="grid grid-cols-2 h-8 mb-2">
            <TabsTrigger value="curated" className="text-xs">Library ({curated.length})</TabsTrigger>
            <TabsTrigger value="mine" className="text-xs">My uploads ({userTracks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="curated">
            <TrackList
              tracks={curated}
              loading={loading}
              playingId={playingId}
              selectedId={selectedTrackId}
              onPlay={togglePlay}
              onSelect={onSelect}
            />
          </TabsContent>
          <TabsContent value="mine">
            <TrackList
              tracks={userTracks}
              loading={loading}
              playingId={playingId}
              selectedId={selectedTrackId}
              onPlay={togglePlay}
              onSelect={onSelect}
              emptyText="Upload your own MP3/WAV tracks to use them here."
            />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

function TrackList({
  tracks,
  loading,
  playingId,
  selectedId,
  onPlay,
  onSelect,
  emptyText = "No tracks match your filter.",
}: {
  tracks: AudioTrack[];
  loading: boolean;
  playingId: string | null;
  selectedId?: string | null;
  onPlay: (t: AudioTrack) => void;
  onSelect?: (t: AudioTrack | null) => void;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (tracks.length === 0) {
    return <p className="text-center text-xs text-muted-foreground py-8">{emptyText}</p>;
  }
  return (
    <div className="space-y-1.5">
      {tracks.map((track) => {
        const isSelected = selectedId === track.id;
        const isPlaying = playingId === track.id;
        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
              isSelected ? "border-primary/50 bg-primary/5" : "border-border/30 hover:border-border/60 bg-muted/20"
            }`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 flex-shrink-0"
              onClick={() => onPlay(track)}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{track.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {track.artist} · {track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, "0")}` : "--:--"}
              </p>
            </div>
            <Badge variant="outline" className="text-[9px] capitalize">{track.mood}</Badge>
            {onSelect && (
              <Button
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="h-7 text-[10px] px-2"
                onClick={() => onSelect(isSelected ? null : track)}
              >
                {isSelected ? <><Check className="w-3 h-3 mr-1" />Selected</> : "Select"}
              </Button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
