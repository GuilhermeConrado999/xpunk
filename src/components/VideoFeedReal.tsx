import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoCardReal from './VideoCardReal';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  community: string;
  tags: string[];
  views: number;
  duration: string;
  created_at: string;
  user_id: string;
  allow_download?: boolean;
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

const VideoFeedReal = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // Buscar vídeos com join manual para perfis
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          community,
          tags,
          views,
          duration,
          created_at,
          user_id,
          allow_download
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar perfis dos usuários
      const userIds = [...new Set(videosData?.map(video => video.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);

      // Combinar dados
      const videosWithProfiles = videosData?.map(video => ({
        ...video,
        profiles: profilesData?.find(profile => profile.user_id === video.user_id) || null
      }));
      
      setVideos(videosWithProfiles || []);
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <div className="retro-box p-3 mb-4 bg-secondary">
          <h2 className="text-pixel text-sm glow-text">
            ► CARREGANDO VÍDEOS...
          </h2>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section>
        <div className="retro-box p-3 mb-4 bg-secondary">
          <h2 className="text-pixel text-sm glow-text">
            ► VÍDEOS RECENTES
          </h2>
        </div>

        <div className="retro-box p-6 bg-card text-center">
          <div className="space-y-4">
            <div className="text-terminal text-lg">
              ¯\_(ツ)_/¯
            </div>
            <h3 className="text-pixel text-base glow-text">
              NENHUM VÍDEO ENCONTRADO
            </h3>
            <p className="text-mono text-sm text-muted-foreground">
              Seja o primeiro a fazer upload de um vídeo nostálgico!
            </p>
            <button className="btn-retro">
              FAZER PRIMEIRO UPLOAD
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Feed Header */}
      <div className="retro-box p-3 mb-4 bg-secondary">
        <div className="flex items-center justify-between">
          <h2 className="text-pixel text-sm glow-text">
            ► VÍDEOS RECENTES ({videos.length})
          </h2>
          
          <div className="flex space-x-2 text-xs">
            <button className="btn-retro">MAIS RECENTES</button>
            <button className="btn-retro">MAIS VISTOS</button>
            <button className="btn-retro">MELHOR RATED</button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {videos.map((video) => (
          <VideoCardReal key={video.id} video={video} />
        ))}
      </div>
      
      {/* Pagination - 2000s style */}
      <div className="retro-box p-3 bg-card text-center">
        <div className="flex justify-center items-center space-x-2 text-terminal text-sm">
          <button className="btn-retro">« ANTERIOR</button>
          <span className="text-muted-foreground">
            Página <strong>1</strong> de <strong>1</strong>
          </span>
          <button className="btn-retro">PRÓXIMA »</button>
        </div>
      </div>
    </section>
  );
};

export default VideoFeedReal;