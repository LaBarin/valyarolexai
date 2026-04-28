DELETE FROM public.audio_tracks
WHERE is_curated = true
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'audio-assets'
      AND o.name = audio_tracks.storage_path
  );