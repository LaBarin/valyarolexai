CREATE TABLE public.video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Video',
  description text,
  format text NOT NULL DEFAULT '16:9',
  duration_type text NOT NULL DEFAULT 'short',
  platform text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'draft',
  script jsonb DEFAULT '[]'::jsonb,
  storyboard jsonb DEFAULT '[]'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos" ON public.video_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own videos" ON public.video_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.video_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.video_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON public.video_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();