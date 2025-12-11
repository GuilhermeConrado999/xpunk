-- Add media columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-media bucket
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

-- Allow anyone to view chat media
CREATE POLICY "Chat media is publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Allow users to delete their own chat media
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);