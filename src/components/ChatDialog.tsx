import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      markMessagesAsRead();

      // Configurar realtime para novas mensagens
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new.sender_id === friendId) {
              setMessages((prev) => [...prev, payload.new as Message]);
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, user, friendId]);

  useEffect(() => {
    // Auto scroll para o fim quando novas mensagens chegam
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return;

    setLoading(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage('');
      fetchMessages();
    }

    setLoading(false);
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
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t border-border">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="input-retro"
            disabled={loading}
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