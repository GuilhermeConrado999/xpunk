import { useState } from 'react';
import RetroHeader from '@/components/RetroHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { MessageSquare, User, Clock } from 'lucide-react';

// Mensagens mockadas para visualização
const mockMessages = [
  {
    id: '1',
    username: 'xXGamerProXx',
    message: 'Site muito massa! Lembra os tempos de ouro da internet brasileira 🔥',
    timestamp: '2025-10-01 14:30',
    avatar: null
  },
  {
    id: '2',
    username: 'RetroFan2000',
    message: 'Adorei o design retro! Me fez lembrar do Orkut e MSN. Parabéns!!!',
    timestamp: '2025-10-01 13:15',
    avatar: null
  },
  {
    id: '3',
    username: 'SpeedRunner99',
    message: 'Quando vai ter a seção de speedruns? To ansioso pra compartilhar meus records!',
    timestamp: '2025-10-01 12:45',
    avatar: null
  },
  {
    id: '4',
    username: 'CyberpunkFã',
    message: 'O esquema de cores neon tá perfeito! Vibes cyberpunk demais 💜💙',
    timestamp: '2025-10-01 11:20',
    avatar: null
  },
  {
    id: '5',
    username: 'OldSchoolGamer',
    message: 'Finalmente um site de games com cara de 2000s! Saudades dessa época...',
    timestamp: '2025-10-01 10:00',
    avatar: null
  }
];

const Guestbook = () => {
  const [formData, setFormData] = useState({
    name: '',
    message: ''
  });
  const [messages, setMessages] = useState(mockMessages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      return;
    }

    // Adicionar mensagem mockada (sem backend)
    const newMessage = {
      id: String(Date.now()),
      username: formData.name,
      message: formData.message,
      timestamp: new Date().toLocaleString('pt-BR'),
      avatar: null
    };

    setMessages([newMessage, ...messages]);
    setFormData({ name: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="retro-box bg-card/80 backdrop-blur-sm p-8 mb-8">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-12 h-12 text-retro-cyan" />
            <div>
              <h1 className="text-pixel text-4xl glow-text mb-2">
                GUESTBOOK
              </h1>
              <p className="text-terminal text-muted-foreground">
                Deixe sua mensagem e faça parte da nossa história!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="retro-box bg-card/80 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <h2 className="text-pixel text-xl glow-text text-retro-purple">
                  ASSINAR GUESTBOOK
                </h2>
                <p className="text-terminal text-xs text-muted-foreground">
                  Compartilhe seus pensamentos conosco
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-terminal flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Seu Nome/Nick
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-retro"
                      placeholder="Digite seu nome..."
                      maxLength={50}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-terminal flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Mensagem
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input-retro min-h-[120px]"
                      placeholder="Escreva sua mensagem..."
                      maxLength={500}
                      required
                    />
                    <p className="text-xs text-terminal text-muted-foreground text-right">
                      {formData.message.length}/500
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full btn-retro"
                    disabled={!formData.name.trim() || !formData.message.trim()}
                  >
                    ENVIAR MENSAGEM
                  </Button>
                </form>

                {/* Retro Divider */}
                <div className="my-6 border-t-2 border-dashed border-border"></div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-terminal text-sm">
                    <span className="text-muted-foreground">Total de Assinaturas:</span>
                    <span className="text-pixel glow-text">{messages.length}</span>
                  </div>
                  <div className="visitor-counter text-center py-2">
                    MENSAGENS: <span className="blink">{messages.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Section */}
          <div className="lg:col-span-2 space-y-4">
            {messages.map((msg, index) => (
              <Card
                key={msg.id}
                className="retro-box bg-card/60 backdrop-blur-sm hover-glow transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 pixel-border">
                      <AvatarImage src={msg.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-retro-cyan to-retro-purple text-white text-pixel">
                        {msg.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-pixel text-retro-cyan glow-text">
                          {msg.username}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-terminal text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {msg.timestamp}
                        </div>
                      </div>
                      
                      <p className="text-terminal text-sm leading-relaxed">
                        {msg.message}
                      </p>
                      
                      {/* Retro signature line */}
                      <div className="pt-2 mt-2 border-t border-dashed border-border/50">
                        <p className="text-xs text-terminal text-muted-foreground italic">
                          ~ {msg.username} esteve aqui ~
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {messages.length === 0 && (
              <Card className="retro-box bg-card/60 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-terminal text-muted-foreground">
                    Nenhuma mensagem ainda. Seja o primeiro a assinar!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="retro-box bg-card/60 p-6 mt-8 text-center">
          <p className="text-terminal text-muted-foreground text-sm">
            ⚠️ Esta página está em desenvolvimento. As mensagens são apenas para visualização e não serão salvas permanentemente.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Guestbook;
