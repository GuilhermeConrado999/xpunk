import { useState } from 'react';
import RetroHeader from '@/components/RetroHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Plus, Video, Eye, TrendingUp } from 'lucide-react';

// Dados mockados para visualização
const mockCommunities = [
  {
    id: '1',
    name: 'Retro Gaming',
    description: 'Compartilhe seus jogos clássicos favoritos e gameplay nostálgico',
    members: 1337,
    videos: 420,
    thumbnail: '🎮',
    color: 'from-retro-cyan to-retro-purple'
  },
  {
    id: '2',
    name: 'Speedrun Masters',
    description: 'Para os amantes de speedruns e records mundiais',
    members: 892,
    videos: 256,
    thumbnail: '⚡',
    color: 'from-retro-purple to-retro-pink'
  },
  {
    id: '3',
    name: 'Let\'s Play Brasil',
    description: 'A maior comunidade brasileira de Let\'s Plays',
    members: 2048,
    videos: 789,
    thumbnail: '🎬',
    color: 'from-retro-pink to-retro-cyan'
  },
  {
    id: '4',
    name: 'Indie Games',
    description: 'Descubra e compartilhe jogos indie incríveis',
    members: 654,
    videos: 198,
    thumbnail: '💎',
    color: 'from-retro-cyan to-retro-purple'
  }
];

const Communities = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    emoji: '🎮'
  });

  const handleCreateCommunity = () => {
    // Apenas fechar o dialog por enquanto (sem funcionalidade)
    setCreateDialogOpen(false);
    setNewCommunity({ name: '', description: '', emoji: '🎮' });
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
                  <p className="text-pixel text-3xl glow-text mt-1">{mockCommunities.length}</p>
                </div>
                <Users className="w-10 h-10 text-retro-cyan opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="retro-box bg-gradient-to-br from-retro-purple/10 to-retro-purple/5 border-retro-purple/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-terminal text-sm text-muted-foreground">Membros Ativos</p>
                  <p className="text-pixel text-3xl glow-text mt-1">
                    {mockCommunities.reduce((acc, c) => acc + c.members, 0)}
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
                    {mockCommunities.reduce((acc, c) => acc + c.videos, 0)}
                  </p>
                </div>
                <Video className="w-10 h-10 text-retro-pink opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockCommunities.map((community) => (
            <Card
              key={community.id}
              className="retro-box hover-glow cursor-pointer transition-all duration-300 overflow-hidden group"
            >
              <div className={`h-24 bg-gradient-to-br ${community.color} flex items-center justify-center relative`}>
                <div className="absolute inset-0 scanlines opacity-20"></div>
                <span className="text-6xl z-10">{community.thumbnail}</span>
              </div>
              
              <CardHeader>
                <CardTitle className="text-pixel text-lg glow-text group-hover:text-retro-cyan transition-colors">
                  {community.name}
                </CardTitle>
                <CardDescription className="text-terminal text-sm">
                  {community.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-xs text-terminal text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{community.members}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>{community.videos}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Online</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4 btn-retro text-xs">
                  ENTRAR
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State Message */}
        <div className="retro-box bg-card/60 p-8 mt-8 text-center">
          <p className="text-terminal text-muted-foreground">
            ⚠️ Esta página está em desenvolvimento. A funcionalidade completa será implementada em breve!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Communities;
