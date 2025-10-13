-- Adicionar campos para deletar mensagens localmente e responder mensagens
ALTER TABLE public.messages 
ADD COLUMN deleted_for uuid[] DEFAULT '{}',
ADD COLUMN reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL;