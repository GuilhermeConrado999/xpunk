import { useState, useEffect } from 'react';
import RetroHeader from '@/components/RetroHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Plus, Video, Eye, TrendingUp, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Community {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  created_by: string;
  member_count?: number;
  video_count?: number;
  is_member?: boolean;
}

const Communities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    emoji: '🎮',
    color: '#8B5CF6'
  });

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de membros e vídeos para cada comunidade
      const enrichedCommunities = await Promise.all(
        (communitiesData || []).map(async (community) => {
          // Contar membros
          const { count: memberCount } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id);

          // Contar vídeos
          const { count: videoCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('community', community.name)
            .eq('is_public', true);

          // Verificar se usuário é membro
          let isMember = false;
          if (user) {
            const { data: membership } = await supabase
              .from('community_members')
              .select('id')
              .eq('community_id', community.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            isMember = !!membership;
          }

          return {
            ...community,
            member_count: memberCount || 0,
            video_count: videoCount || 0,
            is_member: isMember
          };
        })
      );

      setCommunities(enrichedCommunities);
    } catch (error) {
      console.error('Erro ao buscar comunidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma comunidade",
        variant: "destructive"
      });
      return;
    }

    if (!newCommunity.name.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a comunidade",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: newCommunity.name,
          description: newCommunity.description,
          emoji: newCommunity.emoji,
          color: newCommunity.color,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar criador como membro automaticamente
      await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          user_id: user.id
        });

      toast({
        title: "Sucesso",
        description: "Comunidade criada com sucesso!"
      });

      setCreateDialogOpen(false);
      setNewCommunity({ name: '', description: '', emoji: '🎮', color: '#8B5CF6' });
      fetchCommunities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a comunidade",
        variant: "destructive"
      });
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
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
          community_id: communityId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Você entrou na comunidade!"
      });

      fetchCommunities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível entrar na comunidade",
        variant: "destructive"
      });
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Você saiu da comunidade"
      });

      fetchCommunities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível sair da comunidade",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCommunity = async (communityId: string, createdBy: string) => {
    if (!user || user.id !== createdBy) {
      toast({
        title: "Erro",
        description: "Apenas o criador pode deletar a comunidade",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comunidade deletada com sucesso"
      });

      fetchCommunities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar a comunidade",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="retro-box bg-card/80 backdrop-blur-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-pixel text-4xl glow-text mb-2">
                COMUNIDADES
              </h1>
              <p className="text-terminal text-muted-foreground">
                Encontre ou crie sua comunidade de jogos favorita
              </p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-retro">
                  <Plus className="w-4 h-4 mr-2" />
                  CRIAR COMUNIDADE
                </Button>
              </DialogTrigger>
              <DialogContent className="retro-box bg-card max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-pixel text-retro-cyan">
                    NOVA COMUNIDADE
                  </DialogTitle>
                  <DialogDescription className="text-terminal">
                    Preencha os dados para criar sua comunidade
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="emoji" className="text-terminal">
                      Emoji / Ícone
                    </Label>
                    <Input
                      id="emoji"
                      value={newCommunity.emoji}
                      onChange={(e) => setNewCommunity({ ...newCommunity, emoji: e.target.value })}
                      className="input-retro text-2xl text-center"
                      maxLength={2}
                      placeholder="🎮"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-terminal">
                      Nome da Comunidade
                    </Label>
                    <Input
                      id="name"
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                      className="input-retro"
                      placeholder="Ex: Retro Gaming"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-terminal">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      value={newCommunity.description}
                      onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                      className="input-retro min-h-[100px]"
                      placeholder="Descreva o propósito da sua comunidade..."
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleCreateCommunity}
                      className="btn-retro flex-1"
                    >
                      CRIAR
                    </Button>
                    <Button
                      onClick={() => setCreateDialogOpen(false)}
                      variant="outline"
                      className="btn-retro flex-1"
                    >
                      CANCELAR
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="retro-box bg-gradient-to-br from-retro-cyan/10 to-retro-cyan/5 border-retro-cyan/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terminal text-sm text-muted-foreground">Total de Comunidades</p>
                  <p className="text-pixel text-3xl glow-text mt-1">{communities.length}</p>
                </div>
                <Users className="w-10 h-10 text-retro-cyan opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="retro-box bg-gradient-to-br from-retro-purple/10 to-retro-purple/5 border-retro-purple/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terminal text-sm text-muted-foreground">Membros Totais</p>
                  <p className="text-pixel text-3xl glow-text mt-1">
                    {communities.reduce((acc, c) => acc + (c.member_count || 0), 0)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-retro-purple opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="retro-box bg-gradient-to-br from-retro-pink/10 to-retro-pink/5 border-retro-pink/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terminal text-sm text-muted-foreground">Vídeos Totais</p>
                  <p className="text-pixel text-3xl glow-text mt-1">
                    {communities.reduce((acc, c) => acc + (c.video_count || 0), 0)}
                  </p>
                </div>
                <Video className="w-10 h-10 text-retro-pink opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-terminal text-muted-foreground">Carregando comunidades...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="retro-box bg-card/60 p-8 text-center">
            <p className="text-terminal text-muted-foreground">
              Nenhuma comunidade encontrada. Seja o primeiro a criar uma!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="retro-box hover-glow transition-all duration-300 overflow-hidden group"
              >
                <div 
                  className="h-24 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${community.color}22, ${community.color}44)` }}
                >
                  <div className="absolute inset-0 scanlines opacity-20"></div>
                  <span className="text-6xl z-10">{community.emoji}</span>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-pixel text-lg glow-text group-hover:text-retro-cyan transition-colors">
                    {community.name}
                  </CardTitle>
                  <CardDescription className="text-terminal text-sm line-clamp-2">
                    {community.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-terminal text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{community.member_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>{community.video_count}</span>
                    </div>
                    {community.is_member && (
                      <span className="text-retro-cyan text-[10px]">✓ MEMBRO</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => navigate(`/community/${community.id}`)}
                      variant="outline"
                      className="w-full btn-retro text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      VER COMUNIDADE
                    </Button>
                    
                    <div className="flex gap-2">
                      {community.is_member ? (
                        <Button 
                          onClick={() => handleLeaveCommunity(community.id)}
                          variant="outline"
                          className="flex-1 btn-retro text-xs"
                        >
                          <UserMinus className="w-3 h-3 mr-1" />
                          SAIR
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleJoinCommunity(community.id)}
                          className="flex-1 btn-retro text-xs"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          ENTRAR
                        </Button>
                      )}
                      
                      {user && user.id === community.created_by && (
                        <Button
                          onClick={() => handleDeleteCommunity(community.id, community.created_by)}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Communities;
