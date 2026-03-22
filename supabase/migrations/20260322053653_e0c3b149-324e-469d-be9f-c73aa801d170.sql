
-- Server-side share token generation for pitch decks
CREATE OR REPLACE FUNCTION public.generate_deck_share_token(p_deck_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token text;
BEGIN
  -- Verify caller owns the deck
  IF NOT EXISTS (
    SELECT 1 FROM public.pitch_decks WHERE id = p_deck_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Generate token server-side
  v_token := encode(gen_random_bytes(16), 'hex');

  UPDATE public.pitch_decks
  SET share_token = v_token, is_public = true
  WHERE id = p_deck_id AND user_id = auth.uid();

  RETURN v_token;
END;
$$;

-- Server-side share token generation for video projects
CREATE OR REPLACE FUNCTION public.generate_video_share_token(p_video_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token text;
BEGIN
  -- Verify caller owns the video
  IF NOT EXISTS (
    SELECT 1 FROM public.video_projects WHERE id = p_video_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Generate token server-side
  v_token := encode(gen_random_bytes(16), 'hex');

  UPDATE public.video_projects
  SET share_token = v_token
  WHERE id = p_video_id AND user_id = auth.uid();

  RETURN v_token;
END;
$$;
