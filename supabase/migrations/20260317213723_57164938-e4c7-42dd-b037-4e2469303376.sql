
-- Add exported_video_url column to video_projects
ALTER TABLE public.video_projects ADD COLUMN IF NOT EXISTS exported_video_url text;

-- Create video-exports storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-exports', 'video-exports', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: authenticated users can update their own files
CREATE POLICY "Users can update own video exports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'video-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read for shared videos
CREATE POLICY "Public can read video exports"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'video-exports');

-- Update get_shared_video to include exported_video_url
DROP FUNCTION IF EXISTS public.get_shared_video(text);
CREATE FUNCTION public.get_shared_video(p_share_token text)
RETURNS TABLE (
  id uuid, title text, description text, status text,
  format text, duration_type text, platform text,
  script jsonb, storyboard jsonb,
  ai_generated boolean, campaign_id uuid,
  exported_video_url text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, title, description, status,
    format, duration_type, platform,
    script, storyboard,
    ai_generated, campaign_id,
    exported_video_url,
    created_at, updated_at
  FROM public.video_projects
  WHERE share_token = p_share_token LIMIT 1;
$$;
