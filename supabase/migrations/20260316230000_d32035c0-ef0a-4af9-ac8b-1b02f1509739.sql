DROP FUNCTION IF EXISTS public.get_shared_campaign(text);
DROP FUNCTION IF EXISTS public.get_shared_video(text);

CREATE FUNCTION public.get_shared_campaign(p_share_token text)
RETURNS TABLE (
  id uuid, name text, description text, status text,
  campaign_type text, target_audience text,
  goals jsonb, channels jsonb, content_plan jsonb,
  assets jsonb, schedule jsonb, ai_generated boolean,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, description, status, campaign_type,
    target_audience, goals, channels, content_plan, assets,
    schedule, ai_generated, created_at, updated_at
  FROM public.marketing_campaigns
  WHERE share_token = p_share_token LIMIT 1;
$$;

CREATE FUNCTION public.get_shared_video(p_share_token text)
RETURNS TABLE (
  id uuid, title text, description text, status text,
  format text, duration_type text, platform text,
  script jsonb, storyboard jsonb,
  ai_generated boolean, campaign_id uuid,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, title, description, status,
    format, duration_type, platform,
    script, storyboard,
    ai_generated, campaign_id,
    created_at, updated_at
  FROM public.video_projects
  WHERE share_token = p_share_token LIMIT 1;
$$;