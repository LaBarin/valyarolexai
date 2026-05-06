-- Replace the broad "direct path" read policy with an owner-scoped policy
DROP POLICY IF EXISTS "Brand assets readable by direct path" ON storage.objects;

CREATE POLICY "Owners can read own brand assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
