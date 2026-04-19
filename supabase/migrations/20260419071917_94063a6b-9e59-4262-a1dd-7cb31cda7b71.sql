-- Revoke any direct table privileges from authenticated/anon on user_credits
-- so credit balances can only be modified via the service role (server-side).
REVOKE INSERT, UPDATE, DELETE ON public.user_credits FROM anon, authenticated;

-- Remove duplicate INSERT policy on video-exports storage bucket.
DROP POLICY IF EXISTS "Owners can upload video exports" ON storage.objects;
