import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  thumbnail_url: string | null;
  created_by: string;
}

interface CommunityEditDialogProps {
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommunityUpdated: () => void;
}

const CommunityEditDialog = ({ community, open, onOpenChange, onCommunityUpdated }: CommunityEditDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎮');
  const [color, setColor] = useState('#8B5CF6');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (community && open) {
      setName(community.name);
      setDescription(community.description || '');
      setEmoji(community.emoji);
      setColor(community.color);
      setThumbnailPreview(community.thumbnail_url);
    }
  }, [community, open]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        });
        return;
      }

      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!community) return;

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a comunidade",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let thumbnailUrl = community.thumbnail_url;

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const fileExt = thumbnailFile.name.split('.').pop();
        const filePath = `${user.id}/communities/${community.id}-${Date.now()}.${fileExt}`;

        // Delete old thumbnail if exists
        if (community.thumbnail_url) {
          const oldPath = community.thumbnail_url.split('/thumbnails/')[1];
          if (oldPath) {
            await supabase.storage.from('thumbnails').remove([oldPath]);
          }
        }

        // Upload new thumbnail (user-scoped path to satisfy RLS)
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrl;
      }

      // Update community
      const { error } = await supabase
        .from('communities')
        .update({
          name,
          description,
          emoji,
          color,
          thumbnail_url: thumbnailUrl
        })
        .eq('id', community.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comunidade atualizada com sucesso!"
      });

      onCommunityUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a comunidade",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (!community) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-box bg-card max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pixel text-retro-cyan">
            EDITAR COMUNIDADE
          </DialogTitle>
          <DialogDescription className="text-terminal">
            Atualize as informações da sua comunidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-terminal">
              Imagem da Comunidade
            </Label>
            <div className="space-y-2">
              {thumbnailPreview && (
                <div className="relative">
                  <img 
                    src={thumbnailPreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg pixel-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="input-retro"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji" className="text-terminal">
              Emoji / Ícone
            </Label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="input-retro text-2xl text-center"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-terminal">
              Nome da Comunidade
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-retro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-terminal">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-retro min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-terminal">
              Cor de Destaque
            </Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 p-1 input-retro"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 input-retro"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpdate}
              disabled={uploading}
              className="btn-retro flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  SALVANDO...
                </>
              ) : (
                'SALVAR'
              )}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="btn-retro flex-1"
              disabled={uploading}
            >
              CANCELAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityEditDialog;
