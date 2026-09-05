-- Without this, a label photo can never be removed: deleting a scan row left
-- its image orphaned in the bucket forever. Owners may delete their own.
CREATE POLICY "Owners delete their label images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'label-images' AND owner_id = auth.uid()::text);
