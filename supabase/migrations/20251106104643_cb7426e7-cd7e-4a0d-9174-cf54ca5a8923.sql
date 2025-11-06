-- Adicionar role DEV para o usuário bymo
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'dev'::app_role
FROM profiles
WHERE username = 'bymo'
ON CONFLICT (user_id, role) DO NOTHING;