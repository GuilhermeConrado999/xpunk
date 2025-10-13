-- Add an additional UPDATE policy to allow senders to update their own messages
CREATE POLICY "Users can update their sent messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);
