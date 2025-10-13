-- Add background_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Create a storage bucket for profile backgrounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backgrounds', 'backgrounds', true, 10485760, ARRAY['image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/gif'];

-- Create policies for background uploads
CREATE POLICY "Users can upload their own background"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backgrounds' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own background"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own background"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'backgrounds' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Background images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'backgrounds');