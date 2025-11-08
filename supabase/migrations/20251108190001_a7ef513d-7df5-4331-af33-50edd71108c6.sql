-- Criar tabela de comentários de perfil (guestbook)
CREATE TABLE public.profile_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  commenter_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_profile_comments_profile_user ON public.profile_comments(profile_user_id);
CREATE INDEX idx_profile_comments_commenter ON public.profile_comments(commenter_user_id);

-- Enable RLS
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Comentários são visíveis para todos
CREATE POLICY "Comentários de perfil são visíveis para todos"
ON public.profile_comments
FOR SELECT
USING (true);

-- Usuários autenticados podem criar comentários
CREATE POLICY "Usuários autenticados podem comentar em perfis"
ON public.profile_comments
FOR INSERT
WITH CHECK (auth.uid() = commenter_user_id);

-- Usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários de perfil"
ON public.profile_comments
FOR DELETE
USING (auth.uid() = commenter_user_id);

-- Donos do perfil podem deletar comentários no seu perfil
CREATE POLICY "Donos do perfil podem deletar comentários"
ON public.profile_comments
FOR DELETE
USING (auth.uid() = profile_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profile_comments_updated_at
BEFORE UPDATE ON public.profile_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();