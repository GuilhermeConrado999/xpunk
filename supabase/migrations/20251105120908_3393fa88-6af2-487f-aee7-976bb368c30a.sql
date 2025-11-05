-- Criar tabela de posts do fórum
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false
);

-- Criar tabela de comentários do fórum
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de votos em posts
CREATE TABLE public.forum_post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Criar tabela de votos em comentários
CREATE TABLE public.forum_comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comment_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para forum_posts
CREATE POLICY "Posts são visíveis para todos"
ON public.forum_posts
FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar posts"
ON public.forum_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios posts"
ON public.forum_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios posts"
ON public.forum_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para forum_comments
CREATE POLICY "Comentários são visíveis para todos"
ON public.forum_comments
FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem comentar"
ON public.forum_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios comentários"
ON public.forum_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
ON public.forum_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para forum_post_votes
CREATE POLICY "Votos em posts são visíveis para todos"
ON public.forum_post_votes
FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem votar em posts"
ON public.forum_post_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios votos em posts"
ON public.forum_post_votes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus votos em posts"
ON public.forum_post_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para forum_comment_votes
CREATE POLICY "Votos em comentários são visíveis para todos"
ON public.forum_comment_votes
FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem votar em comentários"
ON public.forum_comment_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios votos em comentários"
ON public.forum_comment_votes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus votos em comentários"
ON public.forum_comment_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_comments_updated_at
BEFORE UPDATE ON public.forum_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_forum_posts_community ON public.forum_posts(community_id);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id);
CREATE INDEX idx_forum_comments_parent ON public.forum_comments(parent_comment_id);
CREATE INDEX idx_forum_comments_user ON public.forum_comments(user_id);
CREATE INDEX idx_forum_post_votes_post ON public.forum_post_votes(post_id);
CREATE INDEX idx_forum_comment_votes_comment ON public.forum_comment_votes(comment_id);