-- Adicionar constraint única para evitar votos duplicados em posts
-- Primeiro remover possíveis duplicatas
DELETE FROM forum_post_votes a USING forum_post_votes b
WHERE a.id > b.id 
  AND a.post_id = b.post_id 
  AND a.user_id = b.user_id;

-- Adicionar constraint única na combinação post_id + user_id (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'forum_post_votes_post_id_user_id_key'
  ) THEN
    ALTER TABLE forum_post_votes 
    ADD CONSTRAINT forum_post_votes_post_id_user_id_key 
    UNIQUE (post_id, user_id);
  END IF;
END $$;