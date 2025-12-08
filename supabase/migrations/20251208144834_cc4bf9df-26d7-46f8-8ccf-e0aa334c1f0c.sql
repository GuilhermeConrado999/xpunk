-- Tabela para rastrear visitas únicas do site
CREATE TABLE public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_path TEXT DEFAULT '/'
);

-- Index para buscar por visitor_id rapidamente
CREATE INDEX idx_site_visits_visitor_id ON public.site_visits(visitor_id);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer pessoa insira visitas (anônimo ou logado)
CREATE POLICY "Anyone can insert visits"
ON public.site_visits
FOR INSERT
WITH CHECK (true);

-- Permitir que qualquer pessoa leia a contagem de visitas
CREATE POLICY "Anyone can read visits"
ON public.site_visits
FOR SELECT
USING (true);