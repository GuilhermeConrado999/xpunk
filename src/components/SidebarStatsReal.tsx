import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalVideos: number;
  totalUsers: number;
  totalViews: number;
}

interface CommunityStats {
  name: string;
  videoCount: number;
}

interface Quote {
  text: string;
  author: string;
}

const RETRO_QUOTES: Quote[] = [
  { text: "It's dangerous to go alone! Take this.", author: "Old Man (Zelda)" },
  { text: "The cake is a lie.", author: "Portal" },
  { text: "War. War never changes.", author: "Fallout" },
  { text: "Do a barrel roll!", author: "Peppy (Star Fox 64)" },
  { text: "Stay awhile and listen.", author: "Deckard Cain (Diablo)" },
  { text: "Would you kindly?", author: "Atlas (BioShock)" },
  { text: "I used to be an adventurer like you, then I took an arrow in the knee.", author: "Guard (Skyrim)" },
  { text: "!?", author: "Snake (Metal Gear Solid)" },
  { text: "All your base are belong to us.", author: "Zero Wing" },
  { text: "Hey! Listen!", author: "Navi (Zelda OoT)" },
  { text: "Finish him!", author: "Mortal Kombat" },
  { text: "Hadouken!", author: "Ryu (Street Fighter)" },
  { text: "It's super effective!", author: "Pokémon" },
  { text: "You died.", author: "Dark Souls" },
  { text: "Rise and shine, Mr. Freeman.", author: "G-Man (Half-Life 2)" },
  { text: "A man chooses, a slave obeys.", author: "Andrew Ryan (BioShock)" },
  { text: "Thank you Mario! But our princess is in another castle!", author: "Toad (Super Mario)" },
  { text: "GET OVER HERE!", author: "Scorpion (Mortal Kombat)" },
  { text: "Praise the sun!", author: "Solaire (Dark Souls)" },
  { text: "Nothing is true, everything is permitted.", author: "Assassin's Creed" },
  { text: "Boy!", author: "Kratos (God of War)" },
  { text: "You must construct additional pylons.", author: "StarCraft" },
  { text: "In Soviet Russia, game plays you!", author: "xXx_N00bSlayer_xXx" },
  { text: "GG EZ", author: "Every online player ever" },
  { text: "I need healing!", author: "Genji (Overwatch)" },
  { text: "The right man in the wrong place can make all the difference in the world.", author: "G-Man (Half-Life 2)" },
  { text: "Snake? Snake?! SNAAAAKE!", author: "Colonel (Metal Gear Solid)" },
  { text: "Wind's howling.", author: "Geralt (The Witcher 3)" },
  { text: "Protocol 3: Protect the Pilot.", author: "BT-7274 (Titanfall 2)" },
  { text: "I'm Commander Shepard, and this is my favorite store on the Citadel.", author: "Mass Effect" },
  { text: "You have died of dysentery.", author: "Oregon Trail" },
];

const SidebarStatsReal = () => {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [communities, setCommunities] = useState<CommunityStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote do dia baseada na data atual
  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return RETRO_QUOTES[dayOfYear % RETRO_QUOTES.length];
  }, []);

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

      // Buscar vídeos com views e community
      const { data: videosData } = await supabase
        .from('videos')
        .select('views, community')
        .eq('is_public', true);

      const totalViews = videosData?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

      // Contar vídeos por comunidade
      const communityMap = new Map<string, number>();
      videosData?.forEach(video => {
        const community = video.community || 'Outros';
        communityMap.set(community, (communityMap.get(community) || 0) + 1);
      });

      // Converter para array e ordenar por contagem
      const communityStats: CommunityStats[] = Array.from(communityMap.entries())
        .map(([name, videoCount]) => ({ name, videoCount }))
        .sort((a, b) => b.videoCount - a.videoCount)
        .slice(0, 5); // Top 5 comunidades

      setCommunities(communityStats);
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
            <span>Membros: {Math.max(1, Math.floor(stats.totalUsers * 0.1))}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>Visitantes: {Math.floor(stats.totalViews * 0.01) + 5}</span>
          </div>
        </div>
      </div>

      {/* Top Communities */}
      <div className="retro-box p-4 bg-card">
        <div className="text-pixel text-sm glow-text mb-3">
          ► COMUNIDADES ATIVAS
        </div>
        
        <div className="text-terminal text-xs space-y-1">
          {communities.length > 0 ? (
            communities.map((community) => (
              <div key={community.name} className="flex justify-between">
                <span>{community.name}</span>
                <span className="text-accent">{community.videoCount}</span>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">Nenhuma comunidade ativa</div>
          )}
        </div>
      </div>

      {/* Visitor Counter - Classic 2000s style */}
      <div className="retro-box p-3 bg-secondary text-center">
        <div className="text-pixel text-xs glow-text mb-2">
          CONTADOR DE VISITAS
        </div>
        <div className="visitor-counter text-terminal-green text-lg font-mono">
          {stats.totalViews.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          total de visualizações
        </div>
      </div>

      {/* Quote do Dia */}
      <div className="retro-box p-3 bg-card">
        <div className="text-pixel text-xs glow-text mb-2">
          ► QUOTE DO DIA
        </div>
        <div className="text-terminal text-xs italic">
          "{dailyQuote.text}"
        </div>
        <div className="text-right text-muted-foreground text-xs mt-1">
          - {dailyQuote.author}
        </div>
      </div>
    </aside>
  );
};

export default SidebarStatsReal;