ALTER TABLE public.video_projects ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

CREATE OR REPLACE FUNCTION public.get_shared_video(p_share_token text)
RETURNS SETOF video_projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.video_projects
  WHERE share_token = p_share_token
  LIMIT 1;
$$;