import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2, deleteFromR2, extractPathFromUrl } from '@/lib/r2-upload';
import { useToast } from '@/hooks/use-toast';

interface VideoEditDialogProps {
  videoId: string;
  currentTitle: string;
  currentDescription: string | null;
  currentCommunity: string;
  currentTags: string[];
  currentThumbnailUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoUpdated: () => void;
}

const VideoEditDialog = ({
  videoId,
  currentTitle,
  currentDescription,
  currentCommunity,
  currentTags,
  currentThumbnailUrl,
  open,
  onOpenChange,
  onVideoUpdated
}: VideoEditDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || '');
  const [community, setCommunity] = useState(currentCommunity);
  const [tags, setTags] = useState(currentTags.join(', '));
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [communities, setCommunities] = useState<{ name: string }[]>([]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from('communities')
      .select('name')
      .order('name');

    if (data) {
      setCommunities(data);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Apenas imagens são permitidas",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5242880) { // 5MB
        toast({
          title: "Erro",
          description: "A thumbnail deve ter no máximo 5MB",
          variant: "destructive"
        });
        return;
      }

      setThumbnailFile(file);
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "O título não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let thumbnailUrl = currentThumbnailUrl;

      // Upload nova thumbnail se selecionada
      if (thumbnailFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const fileExt = thumbnailFile.name.split('.').pop();
        const filePath = `${user.id}/${videoId}-thumb-${Date.now()}.${fileExt}`;

        // Remove thumbnail antiga se existir
        if (currentThumbnailUrl) {
          const oldPath = extractPathFromUrl(currentThumbnailUrl, 'thumbnails');
          if (oldPath) {
            await deleteFromR2(oldPath, 'thumbnails');
          }
        }

        // Upload to R2
        const { publicUrl } = await uploadToR2(thumbnailFile, filePath, 'thumbnails');

        thumbnailUrl = publicUrl;
      }

      // Atualizar vídeo
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('videos')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          community,
          tags: tagsArray,
          thumbnail_url: thumbnailUrl
        })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vídeo atualizado com sucesso!"
      });

      onVideoUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o vídeo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-box bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pixel text-retro-cyan">
            EDITAR VÍDEO
          </DialogTitle>
          <DialogDescription className="text-terminal">
            Atualize as informações do seu vídeo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-terminal">
              Título *
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-retro"
              placeholder="Digite o título do vídeo"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-terminal">
              Descrição
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-retro min-h-[100px]"
              placeholder="Descreva seu vídeo..."
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-community" className="text-terminal">
              Comunidade *
            </Label>
            <Select value={community} onValueChange={setCommunity}>
              <SelectTrigger className="input-retro">
                <SelectValue placeholder="Selecione uma comunidade" />
              </SelectTrigger>
              <SelectContent className="retro-box bg-card">
                {communities.map((comm) => (
                  <SelectItem key={comm.name} value={comm.name}>
                    {comm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags" className="text-terminal">
              Tags
            </Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-retro"
              placeholder="gameplay, tutorial, speedrun (separadas por vírgula)"
            />
            <p className="text-xs text-muted-foreground">
              Separe as tags por vírgula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-thumbnail" className="text-terminal">
              Nova Thumbnail (opcional)
            </Label>
            <Input
              id="edit-thumbnail"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="input-retro"
            />
            <p className="text-xs text-muted-foreground">
              Imagens até 5MB • Deixe em branco para manter a atual
            </p>
            {thumbnailFile && (
              <p className="text-xs text-retro-cyan">
                ✓ Nova thumbnail selecionada: {thumbnailFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpdate}
              disabled={uploading}
              className="btn-retro flex-1"
            >
              {uploading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              variant="outline"
              className="btn-retro flex-1"
            >
              CANCELAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditDialog;
