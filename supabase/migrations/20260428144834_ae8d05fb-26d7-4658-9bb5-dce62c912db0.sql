CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid,
  campaign_id uuid,
  channel text NOT NULL,
  caption text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  publisher text NOT NULL DEFAULT 'simulated',
  publisher_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error text,
  attempts int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scheduled posts" ON public.scheduled_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled posts" ON public.scheduled_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scheduled posts" ON public.scheduled_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scheduled posts" ON public.scheduled_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages scheduled posts" ON public.scheduled_posts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_scheduled_posts_due ON public.scheduled_posts (status, scheduled_at);
CREATE INDEX idx_scheduled_posts_user ON public.scheduled_posts (user_id, scheduled_at DESC);

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();