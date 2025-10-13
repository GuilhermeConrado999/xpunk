-- Add background_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Update storage bucket for profile backgrounds to accept GIFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backgrounds', 'backgrounds', true, 10485760, ARRAY['image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/gif'];