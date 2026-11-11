DROP POLICY IF EXISTS "Read curated or own audio" ON storage.objects;
CREATE POLICY "Users read own audio" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'audio-assets' AND (storage.foldername(name))[1] = (select auth.uid())::text);