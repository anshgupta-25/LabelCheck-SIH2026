CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT,
  extracted_text TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'eng',
  verdict TEXT NOT NULL DEFAULT 'non_compliant',
  product_name TEXT,
  source TEXT NOT NULL DEFAULT 'upload',
  field_results JSONB NOT NULL DEFAULT '[]'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scans" ON public.scans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create scans" ON public.scans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update scans" ON public.scans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete scans" ON public.scans FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX scans_created_at_idx ON public.scans (created_at DESC);