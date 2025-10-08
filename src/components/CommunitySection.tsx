import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Community {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  member_count?: number;
}

const CommunitySection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    try {
      let query = supabase.from('communities').select('*');

      // Se usuário está logado, buscar apenas comunidades que ele é membro
      if (user) {
        const { data: memberships } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (memberships && memberships.length > 0) {
          const communityIds = memberships.map(m => m.community_id);
          query = query.in('id', communityIds);
        } else {
          // Se usuário não é membro de nenhuma comunidade, mostrar as 4 primeiras
          query = query.limit(4);
        }
      } else {
        // Se não está logado, mostrar as 4 primeiras comunidades
        query = query.limit(4);
      }

      const { data: communitiesData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de membros
      const enrichedCommunities = await Promise.all(
        (communitiesData || []).map(async (community) => {
          const { count } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id);

          return {
            ...community,
            member_count: count || 0
          };
        })
      );

      setCommunities(enrichedCommunities);

      // Buscar total de vídeos
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      setTotalVideos(videoCount || 0);
    } catch (error) {
      console.error('Erro ao buscar comunidades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="retro-box p-4 mb-6">
        <p className="text-terminal text-center">Carregando comunidades...</p>
      </section>
    );
  }

  return (
    <section className="retro-box p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-pixel text-lg glow-text">
          ► {user ? 'SUAS COMUNIDADES' : 'COMUNIDADES ATIVAS'}
        </h2>
        <Button
          onClick={() => navigate('/communities')}
          variant="ghost"
          className="text-terminal hover:text-retro-cyan text-xs"
        >
          VER TODAS →
        </Button>
      </div>
      
      {communities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-terminal text-muted-foreground mb-4">
            {user ? 'Você ainda não entrou em nenhuma comunidade.' : 'Nenhuma comunidade encontrada.'}
          </p>
          <Button onClick={() => navigate('/communities')} className="btn-retro">
            EXPLORAR COMUNIDADES
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {communities.map((community) => (
              <div 
                key={community.id}
                className="retro-box p-3 bg-secondary hover-glow cursor-pointer transition-all"
                onClick={() => navigate(`/community/${community.id}`)}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl">{community.emoji}</div>
                  
                  <h3 className="text-terminal text-sm font-bold">
                    {community.name}
                  </h3>
                  
                  <div className="text-xs text-muted-foreground text-mono line-clamp-2">
                    {community.description || 'Sem descrição'}
                  </div>
                  
                  <div className="text-xs text-terminal font-bold text-retro-cyan">
                    {community.member_count} MEMBROS
                  </div>
                  
                  <Button className="btn-retro w-full text-xs mt-2">
                    VER COMUNIDADE
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Old school forum-style stats */}
          <div className="mt-4 p-2 bg-card border-t border-border">
            <div className="flex justify-between text-xs text-terminal text-muted-foreground">
              <span>TOTAL DE VÍDEOS: <strong>{totalVideos}</strong></span>
              <span>COMUNIDADES: <strong className="text-terminal-green">{communities.length}</strong></span>
              <span className="cursor-pointer hover:text-retro-cyan" onClick={() => navigate('/communities')}>
                <strong>EXPLORAR TODAS →</strong>
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CommunitySection;