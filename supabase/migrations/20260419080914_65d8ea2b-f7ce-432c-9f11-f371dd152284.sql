-- Audio tracks library (curated + user uploads)
CREATE TABLE public.audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  artist TEXT,
  mood TEXT NOT NULL DEFAULT 'cinematic',
  duration_seconds INTEGER,
  storage_path TEXT NOT NULL,
  is_curated BOOLEAN NOT NULL DEFAULT false,
  license TEXT DEFAULT 'CC0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audio_tracks_user ON public.audio_tracks(user_id);
CREATE INDEX idx_audio_tracks_mood ON public.audio_tracks(mood);

ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view curated tracks; users can view their own uploads
CREATE POLICY "View curated tracks"
  ON public.audio_tracks FOR SELECT
  TO authenticated
  USING (is_curated = true OR user_id = auth.uid());

CREATE POLICY "Users insert own tracks"
  ON public.audio_tracks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_curated = false);

CREATE POLICY "Users delete own tracks"
  ON public.audio_tracks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_curated = false);

-- Voiceovers per video project
CREATE TABLE public.voiceovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.video_projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'tts', -- 'tts' | 'upload'
  voice_id TEXT,
  script TEXT,
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voiceovers_video ON public.voiceovers(video_id);

ALTER TABLE public.voiceovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own voiceovers"
  ON public.voiceovers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add audio settings to video_projects
ALTER TABLE public.video_projects
  ADD COLUMN IF NOT EXISTS music_track_id UUID REFERENCES public.audio_tracks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS music_volume NUMERIC DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS voiceover_id UUID REFERENCES public.voiceovers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_style TEXT DEFAULT 'kinetic',
  ADD COLUMN IF NOT EXISTS ad_preset TEXT;

-- Storage bucket for audio (public read for curated; user-scoped for uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-assets', 'audio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for everyone (browser <audio> needs URLs)
CREATE POLICY "Public read audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-assets');

-- Authenticated users upload to their own folder: audio-assets/<uid>/...
CREATE POLICY "Users upload own audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Seed curated music library (royalty-free / CC0 from common providers)
INSERT INTO public.audio_tracks (name, artist, mood, duration_seconds, storage_path, is_curated, license) VALUES
  ('Sunset Drive', 'Pixabay', 'upbeat', 142, 'curated/sunset-drive.mp3', true, 'Pixabay'),
  ('Corporate Inspire', 'Pixabay', 'corporate', 156, 'curated/corporate-inspire.mp3', true, 'Pixabay'),
  ('Cinematic Trailer', 'Pixabay', 'cinematic', 138, 'curated/cinematic-trailer.mp3', true, 'Pixabay'),
  ('Lo-Fi Chill', 'Pixabay', 'chill', 165, 'curated/lofi-chill.mp3', true, 'Pixabay'),
  ('Epic Drama', 'Pixabay', 'dramatic', 172, 'curated/epic-drama.mp3', true, 'Pixabay'),
  ('Tech Pulse', 'Pixabay', 'tech', 128, 'curated/tech-pulse.mp3', true, 'Pixabay'),
  ('Acoustic Morning', 'Pixabay', 'acoustic', 145, 'curated/acoustic-morning.mp3', true, 'Pixabay'),
  ('Dance Floor', 'Pixabay', 'upbeat', 134, 'curated/dance-floor.mp3', true, 'Pixabay'),
  ('Ambient Dream', 'Pixabay', 'chill', 188, 'curated/ambient-dream.mp3', true, 'Pixabay'),
  ('Power Anthem', 'Pixabay', 'dramatic', 152, 'curated/power-anthem.mp3', true, 'Pixabay'),
  ('Startup Vibes', 'Pixabay', 'corporate', 140, 'curated/startup-vibes.mp3', true, 'Pixabay'),
  ('Future Bass', 'Pixabay', 'tech', 130, 'curated/future-bass.mp3', true, 'Pixabay'),
  ('Soft Piano', 'Pixabay', 'acoustic', 167, 'curated/soft-piano.mp3', true, 'Pixabay'),
  ('Hip Hop Energy', 'Pixabay', 'upbeat', 125, 'curated/hiphop-energy.mp3', true, 'Pixabay'),
  ('Cinematic Rise', 'Pixabay', 'cinematic', 148, 'curated/cinematic-rise.mp3', true, 'Pixabay'),
  ('Meditation Calm', 'Pixabay', 'chill', 210, 'curated/meditation-calm.mp3', true, 'Pixabay'),
  ('Action Beat', 'Pixabay', 'dramatic', 132, 'curated/action-beat.mp3', true, 'Pixabay'),
  ('Modern Tech', 'Pixabay', 'tech', 144, 'curated/modern-tech.mp3', true, 'Pixabay');
