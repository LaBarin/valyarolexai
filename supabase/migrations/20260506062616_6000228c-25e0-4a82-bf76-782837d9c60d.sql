-- Switch authenticated-callable SECURITY DEFINER functions to SECURITY INVOKER.
-- They already enforce ownership via WHERE user_id = auth.uid() and rely on RLS,
-- so the elevated execution context is unnecessary.

CREATE OR REPLACE FUNCTION public.generate_deck_share_token(p_deck_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.pitch_decks WHERE id = p_deck_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_token := encode(extensions.gen_random_bytes(16), 'hex');

  UPDATE public.pitch_decks
  SET share_token = v_token, is_public = true
  WHERE id = p_deck_id AND user_id = auth.uid();

  RETURN v_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_video_share_token(p_video_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.video_projects WHERE id = p_video_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_token := encode(extensions.gen_random_bytes(16), 'hex');

  UPDATE public.video_projects
  SET share_token = v_token
  WHERE id = p_video_id AND user_id = auth.uid();

  RETURN v_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND status IN ('active', 'trialing')
      AND COALESCE(cancel_at_period_end, false) = false
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$function$;

NOTIFY pgrst, 'reload schema';
