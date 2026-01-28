import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useResumableUpload } from '@/hooks/useResumableUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload as UploadIcon, ArrowLeft, Video, Image as ImageIcon } from 'lucide-react';
import RetroHeader from '@/components/RetroHeader';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading-video' | 'uploading-thumb' | 'saving'>('idle');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    community: '',
    tags: '',
    isPublic: true,
    allowDownload: false,
  });

  const videoUploader = useResumableUpload({
    bucket: 'videos',
    onProgress: (progress) => {
      setUploadProgress(progress.percentage);
    },
    onError: (error) => {
      console.error('Video upload error:', error);
      toast.error('Erro ao fazer upload do vídeo: ' + error.message);
    }
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 52428800) { // 50MB - Supabase Free Plan limit
        toast.error('O vídeo deve ter no máximo 50MB (limite do plano Free do Supabase)');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) { // 5MB
        toast.error('A thumbnail deve ter no máximo 5MB');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para fazer upload');
      return;
    }

    if (!videoFile) {
      toast.error('Selecione um vídeo para fazer upload');
      return;
    }

    if (!formData.title || !formData.community) {
      toast.error('Preencha o título e a comunidade');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video with progress
      setUploadStatus('uploading-video');
      const videoFileName = `${user.id}/video-${Date.now()}.${videoFile.name.split('.').pop()}`;

      const videoResult = await videoUploader.upload(videoFile, videoFileName);

      if (!videoResult) {
        throw new Error('Falha no upload do vídeo');
      }

      const videoUrl = videoResult.publicUrl;

      // Upload thumbnail if exists
      let thumbnailUrl = null;
      if (thumbnailFile) {
        setUploadStatus('uploading-thumb');
        setUploadProgress(0);

        const thumbnailFileName = `${user.id}/thumb-${Date.now()}.${thumbnailFile.name.split('.').pop()}`;
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbError) throw thumbError;

        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      }

      // Get video duration
      setUploadStatus('saving');
      const video = document.createElement('video');
      video.src = videoPreview!;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      const duration = `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`;

      // Create video record
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          community: formData.community,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          duration: duration,
          is_public: formData.isPublic,
          allow_download: formData.allowDownload,
        });

      if (dbError) throw dbError;

      toast.success('Vídeo enviado com sucesso!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <RetroHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="retro-box p-6 mb-6 bg-card">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-terminal hover-retro"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              VOLTAR
            </Button>

            <h1 className="text-pixel text-3xl glow-text text-retro-purple mb-2">
              FAZER UPLOAD DE VÍDEO
            </h1>
            <p className="text-mono text-sm text-muted-foreground">
              Compartilhe seus vídeos com a comunidade XPUNK
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Upload */}
                <div className="retro-box p-6 bg-card">
                  <h2 className="text-pixel text-xl mb-4 text-terminal">
                    ARQUIVO DE VÍDEO
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="video" className="text-mono">
                        Vídeo * (Max: 50MB)
                      </Label>
                      <div className="mt-2">
                        <label htmlFor="video" className="cursor-pointer block">
                          <div className="retro-box p-8 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors text-center">
                            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-mono text-sm">
                              {videoFile ? videoFile.name : 'Clique para selecionar vídeo'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              MP4, WebM, OGG
                            </p>
                          </div>
                        </label>
                        <Input
                          id="video"
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {videoPreview && (
                      <div className="retro-box p-4 bg-background">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full pixel-border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="retro-box p-6 bg-card space-y-4">
                  <h2 className="text-pixel text-xl mb-4 text-terminal">
                    INFORMAÇÕES DO VÍDEO
                  </h2>

                  <div>
                    <Label htmlFor="title" className="text-mono">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Digite o título do vídeo"
                      className="mt-2 text-mono"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-mono">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva seu vídeo..."
                      className="mt-2 text-mono min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="community" className="text-mono">Comunidade *</Label>
                    <Select
                      value={formData.community}
                      onValueChange={(value) => setFormData({ ...formData, community: value })}
                    >
                      <SelectTrigger className="mt-2 text-mono">
                        <SelectValue placeholder="Selecione uma comunidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mods">Mods Clássicos</SelectItem>
                        <SelectItem value="speedruns">Speedruns</SelectItem>
                        <SelectItem value="lets-plays">Let's Plays</SelectItem>
                        <SelectItem value="machinima">Machinima</SelectItem>
                        <SelectItem value="tutoriais">Tutoriais</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-mono">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                      className="mt-2 text-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separe as tags por vírgula
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Thumbnail */}
                <div className="retro-box p-6 bg-card">
                  <h2 className="text-pixel text-xl mb-4 text-terminal">
                    THUMBNAIL
                  </h2>

                  <div>
                    <Label htmlFor="thumbnail" className="text-mono">
                      Imagem (Opcional)
                    </Label>
                    <div className="mt-2">
                      <label htmlFor="thumbnail" className="cursor-pointer block">
                        {thumbnailPreview ? (
                          <img
                            src={thumbnailPreview}
                            alt="Preview"
                            className="w-full pixel-border aspect-video object-cover"
                          />
                        ) : (
                          <div className="retro-box p-8 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors text-center aspect-video flex flex-col items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-mono text-xs">
                              Clique para adicionar
                            </p>
                          </div>
                        )}
                      </label>
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="retro-box p-6 bg-card space-y-4">
                  <h2 className="text-pixel text-xl mb-4 text-terminal">
                    CONFIGURAÇÕES
                  </h2>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="pixel-checkbox"
                    />
                    <Label htmlFor="isPublic" className="text-mono text-sm">
                      Vídeo público
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowDownload"
                      checked={formData.allowDownload}
                      onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                      className="pixel-checkbox"
                    />
                    <Label htmlFor="allowDownload" className="text-mono text-sm">
                      Permitir download
                    </Label>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="retro-box p-4 bg-card space-y-2">
                    <div className="flex items-center justify-between text-mono text-sm">
                      <span className="text-terminal">
                        {uploadStatus === 'uploading-video' && 'Enviando vídeo (TUS)...'}
                        {uploadStatus === 'uploading-thumb' && 'Enviando thumbnail...'}
                        {uploadStatus === 'saving' && 'Salvando...'}
                      </span>
                      <span className="text-retro-cyan">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-3" />
                    {videoFile && uploadStatus === 'uploading-video' && (
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)}MB • Upload resumível em chunks de 6MB
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={uploading || !videoFile}
                  className="btn-retro w-full"
                >
                  {uploading ? (
                    <>ENVIANDO... {uploadProgress}%</>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      FAZER UPLOAD
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
