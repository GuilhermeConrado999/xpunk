-- Fix user_roles: Only allow users to see their own roles
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix ratings: Only allow users to see their own ratings (aggregated data accessed via app logic)
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;

CREATE POLICY "Users can view their own ratings"
ON public.ratings
FOR SELECT
USING (auth.uid() = user_id);