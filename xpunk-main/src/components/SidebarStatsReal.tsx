import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalVideos: number;
  totalUsers: number;
  totalViews: number;
}

const SidebarStatsReal = () => {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar total de vídeos
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      // Buscar total de usuários
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Buscar total de views
      const { data: viewsData } = await supabase
        .from('videos')
        .select('views')
        .eq('is_public', true);

      const totalViews = viewsData?.reduce((sum, video) => sum + video.views, 0) || 0;

      setStats({
        totalVideos: videoCount || 0,
        totalUsers: userCount || 0,
        totalViews
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <aside className="space-y-4">
        <div className="retro-box p-4 bg-card">
          <div className="text-pixel text-sm glow-text mb-3">
            ► CARREGANDO STATS...
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      {/* Site Stats */}
      <div className="retro-box p-4 bg-card">
        <div className="text-pixel text-sm glow-text mb-3">
          ► ESTATÍSTICAS DO SITE
        </div>
        
        <div className="space-y-2 text-terminal text-xs">
          <div className="flex justify-between">
            <span>Total de Vídeos:</span>
            <span className="text-accent">{stats.totalVideos.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Usuários:</span>
            <span className="text-accent">{stats.totalUsers.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Views:</span>
            <span className="text-accent">{stats.totalViews.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Uptime:</span>
            <span className="text-terminal-green">99.9%</span>
          </div>
        </div>
      </div>

      {/* Online Users */}
      <div className="retro-box p-4 bg-card">
        <div className="text-pixel text-sm glow-text mb-3">
          ► USUÁRIOS ONLINE
        </div>
        
        <div className="text-terminal text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-terminal-green rounded-full blink"></div>
            <span>Membros: {Math.floor(Math.random() * 50) + 10}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>Visitantes: {Math.floor(Math.random() * 100) + 20}</span>
          </div>
        </div>
      </div>

      {/* Top Communities */}
      <div className="retro-box p-4 bg-card">
        <div className="text-pixel text-sm glow-text mb-3">
          ► COMUNIDADES ATIVAS
        </div>
        
        <div className="text-terminal text-xs space-y-1">
          <div className="flex justify-between">
            <span>Speedrun</span>
            <span className="text-accent">{Math.floor(stats.totalVideos * 0.3)}</span>
          </div>
          <div className="flex justify-between">
            <span>Let's Plays</span>
            <span className="text-accent">{Math.floor(stats.totalVideos * 0.25)}</span>
          </div>
          <div className="flex justify-between">
            <span>Montagens</span>
            <span className="text-accent">{Math.floor(stats.totalVideos * 0.2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Mods</span>
            <span className="text-accent">{Math.floor(stats.totalVideos * 0.15)}</span>
          </div>
          <div className="flex justify-between">
            <span>Machinima</span>
            <span className="text-accent">{Math.floor(stats.totalVideos * 0.1)}</span>
          </div>
        </div>
      </div>

      {/* Visitor Counter - Classic 2000s style */}
      <div className="retro-box p-3 bg-secondary text-center">
        <div className="text-pixel text-xs glow-text mb-2">
          CONTADOR DE VISITAS
        </div>
        <div className="visitor-counter text-terminal-green text-lg font-mono">
          {(1337420 + stats.totalViews).toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          desde junho/2006
        </div>
      </div>

      {/* Random Quote */}
      <div className="retro-box p-3 bg-card">
        <div className="text-pixel text-xs glow-text mb-2">
          ► QUOTE DO DIA
        </div>
        <div className="text-terminal text-xs italic">
          "In Soviet Russia, game plays you!"
        </div>
        <div className="text-right text-muted-foreground text-xs mt-1">
          - xXx_N00bSlayer_xXx
        </div>
      </div>
    </aside>
  );
};

export default SidebarStatsReal;