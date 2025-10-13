import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import VideoCardReal from '@/components/VideoCardReal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Video, ArrowLeft, UserPlus, UserMinus, Settings } from 'lucide-react';
import CommunityEditDialog from '@/components/CommunityEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  thumbnail_url: string | null;
  created_by: string;
  member_count?: number;
  video_count?: number;
  is_member?: boolean;
}

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
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

const CommunityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [id, user]);

  const fetchCommunityData = async () => {
    if (!id) return;

    try {
      // Fetch community data
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;

      // Count members
      const { count: memberCount } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', id);

      // Check if user is member
      let isMember = false;
      if (user) {
        const { data: membership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        isMember = !!membership;
      }

      // Fetch videos from this community
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('community', communityData.name)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      // Fetch profiles for each video
      const videosWithProfiles = await Promise.all(
        (videosData || []).map(async (video) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', video.user_id)
            .single();

          return {
            ...video,
            profiles: profile
          };
        })
      );

      setCommunity({
        ...communityData,
        member_count: memberCount || 0,
        video_count: videosWithProfiles?.length || 0,
        is_member: isMember
      });
      setVideos(videosWithProfiles || []);
    } catch (error) {
      console.error('Erro ao buscar dados da comunidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a comunidade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para entrar em uma comunidade",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: id,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Você entrou na comunidade!"
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível entrar na comunidade",
        variant: "destructive"
      });
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Você saiu da comunidade"
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível sair da comunidade",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-terminal text-center">Carregando...</p>
        </main>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-terminal text-center">Comunidade não encontrada</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/communities')}
          variant="ghost"
          className="mb-4 text-terminal hover:text-retro-cyan"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          VOLTAR
        </Button>

        {/* Community Header */}
        <div className="p-8 mb-8">
          {community.thumbnail_url ? (
            <div className="relative h-64 md:h-72 lg:h-80 mb-6 rounded-lg overflow-hidden">
              <img 
                src={community.thumbnail_url} 
                alt={community.name}
                className="w-full h-full object-fill relative z-0 brightness-100 bg-transparent"
              />
              <span className="absolute bottom-4 left-4 text-6xl z-10">{community.emoji}</span>
            </div>
          ) : (
            <div 
              className="h-32 flex items-center justify-center relative mb-6 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${community.color}33, ${community.color}66)` }}
            >
              <div className="absolute inset-0 scanlines opacity-20"></div>
              <span className="text-8xl z-10">{community.emoji}</span>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-pixel text-4xl glow-text mb-3">
                {community.name}
              </h1>
              <p className="text-terminal text-muted-foreground mb-4">
                {community.description || 'Sem descrição'}
              </p>

              <div className="flex gap-6 text-terminal text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{community.member_count} membros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span>{community.video_count} vídeos</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {user && user.id === community.created_by && (
                <Button
                  onClick={() => setEditDialogOpen(true)}
                  variant="outline"
                  className="btn-retro"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  EDITAR
                </Button>
              )}
              
              {community.is_member ? (
                <Button
                  onClick={handleLeaveCommunity}
                  variant="outline"
                  className="btn-retro"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  SAIR
                </Button>
              ) : (
                <Button
                  onClick={handleJoinCommunity}
                  className="btn-retro"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  ENTRAR
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="retro-box bg-card/60 p-6">
          <h2 className="text-pixel text-2xl glow-text mb-6">
            VÍDEOS RECENTES
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-terminal text-muted-foreground">
                Nenhum vídeo nesta comunidade ainda. Seja o primeiro a postar!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCardReal
                  key={video.id}
                  video={video}
                  onVideoUpdated={fetchCommunityData}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <CommunityEditDialog
        community={community}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onCommunityUpdated={fetchCommunityData}
      />
    </div>
  );
};

export default CommunityView;
