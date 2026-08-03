DROP POLICY IF EXISTS "verification owner insert" ON storage.objects;
CREATE POLICY "verification owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "verification owner update" ON storage.objects;
CREATE POLICY "verification owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "verification owner or admin read" ON storage.objects;
CREATE POLICY "verification owner or admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "verification owner delete" ON storage.objects;
CREATE POLICY "verification owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
