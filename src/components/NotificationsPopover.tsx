import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface FriendRequest {
  id: string;
  user_id: string;
  profiles: {
    user_id?: string;
    username: string;
    avatar_url: string | null;
  };
}

interface UnreadMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    user_id?: string;
    username: string;
    avatar_url: string | null;
  };
}

interface NotificationsPopoverProps {
  notificationCount: number;
  onNotificationChange: () => void;
  onOpenChat?: (userId: string) => void;
}

export const NotificationsPopover = ({ 
  notificationCount, 
  onNotificationChange,
  onOpenChat 
}: NotificationsPopoverProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    // Fetch friend requests
    const { data: requests } = await supabase
      .from('friendships')
      .select('id, user_id')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (requests && requests.length > 0) {
      const userIds = requests.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const requestsWithProfiles = requests.map(request => ({
        ...request,
        profiles: profiles?.find(p => p.user_id === request.user_id) || {
          username: 'Unknown',
          avatar_url: null
        }
      }));

      setFriendRequests(requestsWithProfiles);
    } else {
      setFriendRequests([]);
    }

    // Fetch unread messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('receiver_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messages && messages.length > 0) {
      const senderIds = messages.map(m => m.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', senderIds);

      const messagesWithProfiles = messages.map(message => ({
        ...message,
        profiles: profiles?.find(p => p.user_id === message.sender_id) || {
          username: 'Unknown',
          avatar_url: null
        }
      }));

      setUnreadMessages(messagesWithProfiles);
    } else {
      setUnreadMessages([]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, user]);

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o pedido de amizade",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Amizade aceita!",
      description: "Você agora é amigo deste usuário"
    });

    fetchNotifications();
    onNotificationChange();
  };

  const declineFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível recusar o pedido de amizade",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Pedido recusado",
      description: "O pedido de amizade foi removido"
    });

    fetchNotifications();
    onNotificationChange();
  };

  const markMessageAsRead = async (messageId: string, senderId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    fetchNotifications();
    onNotificationChange();
    
    if (onOpenChat) {
      onOpenChat(senderId);
      setOpen(false);
    }
  };

  const hasNotifications = friendRequests.length > 0 || unreadMessages.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative ml-2">
          <Button variant="ghost" className="btn-retro text-xs relative">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 retro-box p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="text-terminal font-bold text-sm">NOTIFICAÇÕES</h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          {!hasNotifications ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-terminal text-muted-foreground text-sm">
                nenhuma atividade por aqui
              </p>
            </div>
          ) : (
            <div className="p-2">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs text-terminal text-muted-foreground font-bold">
                    PEDIDOS DE AMIZADE
                  </div>
                  {friendRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="p-3 bg-secondary/50 rounded mb-2 retro-box"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <span className="text-terminal text-sm font-bold">
                          {request.profiles.username}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptFriendRequest(request.id)}
                          className="btn-retro text-xs flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          ACEITAR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineFriendRequest(request.id)}
                          className="btn-retro text-xs flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          RECUSAR
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {friendRequests.length > 0 && unreadMessages.length > 0 && (
                <Separator className="my-2" />
              )}

              {/* Unread Messages */}
              {unreadMessages.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs text-terminal text-muted-foreground font-bold">
                    MENSAGENS NÃO LIDAS
                  </div>
                  {unreadMessages.map((message) => (
                    <div 
                      key={message.id}
                      className="p-3 bg-secondary/50 rounded mb-2 retro-box cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => markMessageAsRead(message.id, message.sender_id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-terminal text-sm font-bold">
                          {message.profiles.username}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
