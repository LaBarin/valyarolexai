
DROP FUNCTION IF EXISTS public.get_shared_video(text);

CREATE OR REPLACE FUNCTION public.get_shared_video(p_share_token text)
 RETURNS TABLE(id uuid, title text, description text, status text, format text, duration_type text, platform text, script jsonb, storyboard jsonb, ai_generated boolean, campaign_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id, title, description, status,
    format, duration_type, platform,
    script, storyboard,
    ai_generated, campaign_id,
    created_at, updated_at
  FROM public.video_projects
  WHERE share_token = p_share_token LIMIT 1;
$$;
