-- Criar tabela de comunidades
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  emoji text NOT NULL DEFAULT '🎮',
  color text NOT NULL DEFAULT '#8B5CF6',
  thumbnail_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de membros das comunidades
CREATE TABLE public.community_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Políticas para communities
CREATE POLICY "Communities são visíveis para todos"
  ON public.communities FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar comunidades"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem deletar suas comunidades"
  ON public.communities FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Criadores podem atualizar suas comunidades"
  ON public.communities FOR UPDATE
  USING (auth.uid() = created_by);

-- Políticas para community_members
CREATE POLICY "Membros são visíveis para todos"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem entrar em comunidades"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem sair de comunidades"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();