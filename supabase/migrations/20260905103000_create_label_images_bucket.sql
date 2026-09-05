-- Private bucket for label photographs. Objects are read through short-lived
-- signed URLs only; the access policies live in the previous migration.
INSERT INTO storage.buckets (id, name, public)
VALUES ('label-images', 'label-images', false)
ON CONFLICT (id) DO NOTHING;
