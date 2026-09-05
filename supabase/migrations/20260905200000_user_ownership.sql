-- Scans belong to the signed-in inspector who created them.
ALTER TABLE public.scans
  ADD COLUMN owner_id UUID REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid();

CREATE INDEX scans_owner_created_idx ON public.scans (owner_id, created_at DESC);

-- Reads stay public: report links and the QR code on the PDF must open for
-- anyone who holds the (unguessable) id. Writes are owner-only.
DROP POLICY IF EXISTS "Anyone can create scans" ON public.scans;
DROP POLICY IF EXISTS "Anyone can update scans" ON public.scans;
DROP POLICY IF EXISTS "Anyone can delete scans" ON public.scans;

CREATE POLICY "Signed-in users create their own scans" ON public.scans
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their scans" ON public.scans
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their scans" ON public.scans
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.scans FROM anon;

-- Label photos: only signed-in users may upload; reads via signed URLs stay open.
DROP POLICY IF EXISTS "Anyone can upload label images" ON storage.objects;
CREATE POLICY "Signed-in users upload label images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'label-images');
