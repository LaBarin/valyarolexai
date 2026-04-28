
-- 1) Harden SECURITY DEFINER function execute permissions

-- Internal queue ops: service_role only
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Owner-scoped share-token generators: authenticated only (already check auth.uid() inside)
REVOKE ALL ON FUNCTION public.generate_deck_share_token(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_video_share_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_deck_share_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_video_share_token(uuid) TO authenticated;

-- Subscription check: only useful for logged-in users
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;

-- Trigger function: not invokable by clients
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Public share lookups: keep anon access (intentional public read by token)
-- get_shared_campaign / get_shared_video / get_shared_deck remain anon+authenticated.
-- Reload PostgREST so the exposed API schema reflects new privileges.
NOTIFY pgrst, 'reload schema';

-- 2) Constrain brand-assets bucket: keep public uploads accessible by direct path,
--    but block directory listing and broad anonymous enumeration.
DROP POLICY IF EXISTS "Brand assets are publicly viewable" ON storage.objects;

-- Allow read of a specific object only when the request includes the exact object name
-- (i.e. direct GET by path). storage.foldername(name) is non-null for any real object,
-- so we restrict SELECT to known paths and disallow LIST (which queries without a name).
CREATE POLICY "Brand assets readable by direct path"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'brand-assets'
  AND name IS NOT NULL
  AND name <> ''
  AND position('/' in name) > 0  -- must be inside a user folder, not bucket root
);

-- Owners (authenticated) may list/read everything in their own folder
CREATE POLICY "Owners can list own brand folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Flip bucket to private at the bucket level so the Storage API enforces RLS
-- (objects remain reachable via signed URLs and direct authenticated GETs).
UPDATE storage.buckets SET public = false WHERE id = 'brand-assets';
