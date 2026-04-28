
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own thumbnails"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
