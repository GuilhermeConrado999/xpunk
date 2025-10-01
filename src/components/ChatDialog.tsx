import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  friendId,
  friendName,
  friendAvatar
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      markMessagesAsRead();

      // Canal único para mensagens - sem filtros complexos
      const messagesChannel = supabase
        .channel(`chat-messages-${user.id}-${friendId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('Nova mensagem recebida:', payload);
            const newMessage = payload.new as Message;
            
            // Verificar se a mensagem é relevante para esta conversa
            const isRelevant = 
              (newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
              (newMessage.sender_id === friendId && newMessage.receiver_id === user.id);
            
            if (isRelevant) {
              setMessages((prev) => {
                // Evitar duplicatas
                if (prev.some(m => m.id === newMessage.id)) {
                  console.log('Mensagem duplicada ignorada');
                  return prev;
                }
                console.log('Adicionando nova mensagem ao estado');
                return [...prev, newMessage];
              });
              
              // Marcar como lida se foi enviada pelo amigo
              if (newMessage.sender_id === friendId) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Status do canal de mensagens:', status);
        });

      // Canal separado para presença (digitando)
      const presenceChannel = supabase
        .channel(`chat-presence-${user.id}-${friendId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const presences = Object.values(state).flat() as any[];
          const friendPresence = presences.find((p: any) => p.user_id === friendId);
          setIsTyping(friendPresence?.typing || false);
        })
        .subscribe(async (status) => {
          console.log('Status do canal de presença:', status);
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              typing: false,
              online_at: new Date().toISOString()
            });
          }
        });

      channelRef.current = presenceChannel;

      return () => {
        console.log('Limpando canais...');
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [open, user, friendId]);

  useEffect(() => {
    // Auto scroll para o fim quando novas mensagens chegam
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const handleTyping = async () => {
    if (!channelRef.current || !user) return;

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Notificar que está digitando
    await channelRef.current.track({
      user_id: user.id,
      typing: true,
      online_at: new Date().toISOString()
    });

    // Após 2 segundos sem digitar, marcar como não digitando
    typingTimeoutRef.current = setTimeout(async () => {
      await channelRef.current?.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString()
      });
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return;

    setLoading(true);

    // Parar de mostrar "digitando" antes de enviar
    if (channelRef.current) {
      await channelRef.current.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
    }

    setLoading(false);
    
    // Manter foco no input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-box bg-card max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pixel text-retro-cyan flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={friendAvatar} />
              <AvatarFallback className="bg-retro-purple text-white">
                {friendName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            CHAT COM {friendName.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isSentByMe = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isSentByMe
                        ? 'bg-retro-cyan/20 border border-retro-cyan/50'
                        : 'bg-retro-purple/20 border border-retro-purple/50'
                    }`}
                  >
                    <p className="text-mono text-sm">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start items-center gap-2">
                <div className="max-w-[70%] p-3 rounded-lg bg-retro-purple/20 border border-retro-purple/50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-retro-purple" />
                  <p className="text-mono text-sm text-muted-foreground">
                    {friendName} está digitando...
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t border-border">
          <Input
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="input-retro"
            disabled={loading}
            autoFocus
          />
          <Button
            onClick={sendMessage}
            className="btn-retro"
            disabled={loading || !newMessage.trim()}
          >
            ENVIAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;