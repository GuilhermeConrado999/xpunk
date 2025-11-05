-- Update delete policy so either side of a friendship can delete it
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;

CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);