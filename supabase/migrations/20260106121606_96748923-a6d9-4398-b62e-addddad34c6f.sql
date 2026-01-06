-- Create community messages table
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages
CREATE POLICY "Community members can view messages"
ON public.community_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = community_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Members can send messages
CREATE POLICY "Community members can send messages"
ON public.community_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = community_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.community_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;