import RetroHeader from '@/components/RetroHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Bug, Wrench, Plus } from 'lucide-react';

interface Update {
  id: string;
  date: string;
  version: string;
  title: string;
  type: 'feature' | 'fix' | 'improvement' | 'new';
  description: string;
  items?: string[];
}

const updates: Update[] = [
  {
    id: '0',
    date: '06/01/2025',
    version: '1.7.0',
    title: 'Chat em Tempo Real nas Comunidades',
    type: 'feature',
    description: 'Agora cada comunidade tem seu próprio chat ao vivo estilo Discord!',
    items: [
      'Chat em tempo real para membros',
      'Mensagens com avatares dos usuários',
      'Botão flutuante para abrir o chat',
      'Deletar suas próprias mensagens',
      'Atualização automática de novas mensagens'
    ]
  },
  {
    id: '0.5',
    date: '06/01/2025',
    version: '1.6.0',
    title: 'Comunidade Favorita no Perfil',
    type: 'feature',
    description: 'Escolha sua comunidade favorita e exiba no seu perfil como na Steam!',
    items: [
      'Seletor de comunidade favorita',
      'Card destacado no perfil',
      'Link direto para a comunidade'
    ]
  },
  {
    id: '1',
    date: '11/12/2024',
    version: '1.5.0',
    title: 'Sistema de Mídia no Chat',
    type: 'feature',
    description: 'Agora você pode enviar imagens, vídeos e mensagens de áudio nas conversas!',
    items: [
      'Envio de imagens e vídeos',
      'Gravação e envio de áudios',
      'Player de áudio personalizado',
      'Preview de mídia nas mensagens'
    ]
  },
  {
    id: '2',
    date: '10/12/2024',
    version: '1.4.0',
    title: 'Thread de Comentários no Fórum',
    type: 'feature',
    description: 'Sistema de respostas estilo Reddit com botão "Ver mais respostas"',
    items: [
      'Visualização de threads individuais',
      'Botão para expandir respostas',
      'Navegação entre comentários'
    ]
  },
  {
    id: '3',
    date: '09/12/2024',
    version: '1.3.0',
    title: 'Sistema de Fórum',
    type: 'new',
    description: 'Novo fórum para discussões da comunidade',
    items: [
      'Criação de posts',
      'Sistema de votos (upvote/downvote)',
      'Comentários e respostas',
      'Posts fixados'
    ]
  },
  {
    id: '4',
    date: '08/12/2024',
    version: '1.2.0',
    title: 'Comunidades',
    type: 'feature',
    description: 'Sistema de comunidades para organizar conteúdo',
    items: [
      'Criação de comunidades',
      'Personalização com cores e emojis',
      'Lista de membros',
      'Vídeos por comunidade'
    ]
  },
  {
    id: '5',
    date: '07/12/2024',
    version: '1.1.0',
    title: 'Sistema de Amizades e Chat',
    type: 'feature',
    description: 'Conecte-se com outros usuários',
    items: [
      'Adicionar amigos',
      'Chat em tempo real',
      'Notificações de mensagens',
      'Lista de amigos'
    ]
  },
  {
    id: '6',
    date: '06/12/2024',
    version: '1.0.0',
    title: 'Lançamento do XPUNK',
    type: 'new',
    description: 'Versão inicial da plataforma!',
    items: [
      'Upload de vídeos',
      'Perfis de usuário',
      'Sistema de autenticação',
      'Design retrô cyberpunk'
    ]
  }
];

const getTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'feature':
      return <Sparkles className="h-4 w-4" />;
    case 'fix':
      return <Bug className="h-4 w-4" />;
    case 'improvement':
      return <Wrench className="h-4 w-4" />;
    case 'new':
      return <Plus className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: Update['type']) => {
  switch (type) {
    case 'feature':
      return <Badge className="bg-primary text-primary-foreground">Feature</Badge>;
    case 'fix':
      return <Badge className="bg-destructive text-destructive-foreground">Bug Fix</Badge>;
    case 'improvement':
      return <Badge className="bg-accent text-accent-foreground">Melhoria</Badge>;
    case 'new':
      return <Badge className="bg-chart-2 text-primary-foreground">Novo</Badge>;
  }
};

const Updates = () => {
  return (
    <div className="min-h-screen bg-background">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="retro-box p-6 mb-6">
          <h1 className="text-2xl text-terminal glow-text mb-2">📋 ATUALIZAÇÕES</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe todas as novidades e mudanças no XPUNK
          </p>
        </div>

        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id} className="retro-box border-primary/30 hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      {getTypeIcon(update.type)}
                    </div>
                    <div>
                      <CardTitle className="text-terminal text-lg">{update.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">v{update.version}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{update.date}</span>
                      </div>
                    </div>
                  </div>
                  {getTypeBadge(update.type)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground mb-3">{update.description}</p>
                {update.items && (
                  <ul className="space-y-1">
                    {update.items.map((item, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-primary">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Updates;
