-- Drop the insecure policy
DROP POLICY "Anyone can view shared campaigns" ON public.marketing_campaigns;

-- Create a secure RPC function that requires knowing the actual token
CREATE OR REPLACE FUNCTION public.get_shared_campaign(p_share_token text)
RETURNS SETOF public.marketing_campaigns
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.marketing_campaigns
  WHERE share_token = p_share_token
  LIMIT 1;
$$;