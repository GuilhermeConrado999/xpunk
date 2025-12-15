-- Add favorite_community_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN favorite_community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;