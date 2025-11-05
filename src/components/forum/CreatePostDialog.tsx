import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  emoji: string;
}

interface CreatePostDialogProps {
  communities: Community[];
  onPostCreated: (newPost: any) => void; // recebe o novo post
}

export const CreatePostDialog = ({ communities, onPostCreated }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    community_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para criar um post",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim() || !formData.community_id) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: user.id,
          title: formData.title,
          content: formData.content || null,
          community_id: formData.community_id
        })
        .select(`
          *,
          profiles!forum_posts_user_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          communities (
            name,
            emoji,
            color
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Post criado!",
        description: "Seu post foi publicado com sucesso"
      });

      setFormData({ title: '', content: '', community_id: '' });
      setOpen(false);

      // Atualiza a lista imediatamente
      onPostCreated(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o post",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-retro">
          <Plus className="h-4 w-4 mr-2" />
          CRIAR POST
        </Button>
      </DialogTrigger>
      <DialogContent className="retro-box bg-card">
        <DialogHeader>
          <DialogTitle className="text-pixel text-xl glow-text text-retro-cyan">
            CRIAR NOVO POST
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="community" className="text-terminal">
              Comunidade
            </Label>
            <Select
              value={formData.community_id}
              onValueChange={(value) => setFormData({ ...formData, community_id: value })}
            >
              <SelectTrigger className="input-retro">
                <SelectValue placeholder="Selecione uma comunidade" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.emoji} {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-terminal">
              Título
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-retro"
              placeholder="Digite o título do post..."
              maxLength={300}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-terminal">
              Conteúdo (opcional)
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-retro min-h-[150px]"
              placeholder="Escreva o conteúdo do seu post..."
              maxLength={10000}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-retro"
              disabled={!formData.title.trim() || !formData.community_id || submitting}
            >
              {submitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
