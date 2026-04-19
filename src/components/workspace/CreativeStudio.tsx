import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Mic, Layers, Sparkles, Info, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MusicLibrary, type AudioTrack } from "./MusicLibrary";
import { VoiceoverStudio } from "./VoiceoverStudio";
import { AdTemplateGallery, type AdTemplate, type AdPreset } from "./AdTemplateGallery";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerEmail } from "@/lib/owner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreativeStudio() {
  const { user } = useAuth();
  const isOwner = isOwnerEmail(user?.email);
  const [seeding, setSeeding] = useState(false);
  const [seedKey, setSeedKey] = useState(0); // bump to force MusicLibrary refresh

  const handleSeed = async () => {
    setSeeding(true);
    const t = toast.loading("Downloading royalty-free tracks…");
    try {
      const { data, error } = await supabase.functions.invoke("seed-curated-music", { body: {} });
      if (error) throw error;
      const s = data?.summary;
      toast.success(
        `Seeded ${s?.uploaded ?? 0} new tracks (${s?.skipped ?? 0} already present, ${s?.failed ?? 0} failed)`,
        { id: t },
      );
      setSeedKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e?.message || "Seeding failed", { id: t });
    } finally {
      setSeeding(false);
    }
  };

  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [selectedVO, setSelectedVO] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<AdPreset | null>(null);

  const hasSelections = selectedTrack || selectedVO || selectedTemplate || selectedPreset;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Creative Studio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Voice-overs, background music, and ad-style templates for your videos and commercials.
          </p>
        </div>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            Seed music library
          </Button>
        )}
      </div>

      {/* Selection summary */}
      {hasSelections && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-3 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Current selection:</span>
              {selectedPreset && (
                <Badge variant="secondary" className="text-[10px]">{selectedPreset.name} · {selectedPreset.duration}s · {selectedPreset.format}</Badge>
              )}
              {selectedTemplate && (
                <Badge variant="secondary" className="text-[10px]">Style: {selectedTemplate.name}</Badge>
              )}
              {selectedTrack && (
                <Badge variant="secondary" className="text-[10px]">🎵 {selectedTrack.name} ({Math.round(musicVolume * 100)}%)</Badge>
              )}
              {selectedVO && (
                <Badge variant="secondary" className="text-[10px]">🎤 Voice-over selected</Badge>
              )}
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => {
                setSelectedTrack(null); setSelectedVO(null); setSelectedTemplate(null); setSelectedPreset(null);
              }}>Clear</Button>
            </div>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="templates" className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />Ad Styles
          </TabsTrigger>
          <TabsTrigger value="voiceover" className="text-xs">
            <Mic className="w-3.5 h-3.5 mr-1.5" />Voice-overs
          </TabsTrigger>
          <TabsTrigger value="music" className="text-xs">
            <Music className="w-3.5 h-3.5 mr-1.5" />Music
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <Card className="p-4">
            <AdTemplateGallery
              selectedTemplate={selectedTemplate?.id}
              selectedPreset={selectedPreset?.id}
              onTemplateSelect={setSelectedTemplate}
              onPresetSelect={setSelectedPreset}
            />
          </Card>
        </TabsContent>

        <TabsContent value="voiceover" className="mt-4">
          <Card className="p-4 h-[600px]">
            <VoiceoverStudio
              selectedId={selectedVO}
              onSelect={(vo) => setSelectedVO(vo.id)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="music" className="mt-4">
          <Card className="p-4 h-[600px]">
            <MusicLibrary
              key={seedKey}
              selectedTrackId={selectedTrack?.id}
              onSelect={setSelectedTrack}
              volume={musicVolume}
              onVolumeChange={setMusicVolume}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {isOwner && (
        <Card className="p-3 bg-muted/20 border-dashed">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Owner tip:</strong> Click <em>Seed music library</em> once to download all 18 royalty-free curated tracks into storage. Tracks are sourced from Pixabay's free CDN (Pixabay Content License — free for commercial use, no attribution required). Re-running is safe; existing files are skipped.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
