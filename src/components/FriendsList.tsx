import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface FriendsListProps {
  onOpenChat: (friendId: string, friendName: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    // Buscar amigos aceitos com seus perfis
    const { data: friendshipsData, error: friendsError } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (!friendsError && friendshipsData) {
      // Buscar perfis dos amigos
      const friendIds = friendshipsData.map(f => f.friend_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendIds);

      // Combinar dados
      const friendsWithProfiles = friendshipsData.map(friendship => {
        const profile = profilesData?.find(p => p.user_id === friendship.friend_id);
        return {
          ...friendship,
          profiles: {
            username: profile?.username || '',
            display_name: profile?.display_name || '',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });

      setFriends(friendsWithProfiles);
    }

    // Buscar solicitações pendentes recebidas
    const { data: pendingData, error: pendingError } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (!pendingError && pendingData) {
      // Buscar perfis dos remetentes
      const senderIds = pendingData.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      // Combinar dados
      const pendingWithProfiles = pendingData.map(request => {
        const profile = profilesData?.find(p => p.user_id === request.user_id);
        return {
          ...request,
          profiles: {
            username: profile?.username || '',
            display_name: profile?.display_name || '',
            avatar_url: profile?.avatar_url || ''
          }
        };
      });

      setPendingRequests(pendingWithProfiles);
    }

    setLoading(false);
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a solicitação",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Amigo adicionado!"
      });
      fetchFriends();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o amigo",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Amigo removido"
      });
      fetchFriends();
    }
  };

  if (loading) {
    return <div className="text-mono">Carregando amigos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Solicitações Pendentes */}
      {pendingRequests.length > 0 && (
        <Card className="retro-box bg-card">
          <CardHeader>
            <CardTitle className="text-pixel text-retro-cyan">
              SOLICITAÇÕES PENDENTES ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-retro-cyan/30 rounded bg-card/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.profiles.avatar_url} />
                      <AvatarFallback className="bg-retro-purple text-white">
                        {request.profiles.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-terminal font-semibold">
                        {request.profiles.display_name || request.profiles.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{request.profiles.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="btn-retro"
                      size="sm"
                    >
                      ACEITAR
                    </Button>
                    <Button
                      onClick={() => removeFriend(request.id)}
                      variant="outline"
                      className="btn-retro"
                      size="sm"
                    >
                      RECUSAR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Amigos */}
      <Card className="retro-box bg-card">
        <CardHeader>
          <CardTitle className="text-pixel text-retro-cyan">
            AMIGOS ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border border-retro-cyan/30 rounded bg-card/50 hover:border-retro-cyan/60 transition-colors">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(`/profile/${friend.friend_id}`)}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={friend.profiles.avatar_url} />
                      <AvatarFallback className="bg-retro-purple text-white">
                        {friend.profiles.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-terminal font-semibold">
                        {friend.profiles.display_name || friend.profiles.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{friend.profiles.username}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-auto text-terminal border-retro-cyan">
                      AMIGO
                    </Badge>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => onOpenChat(friend.friend_id, friend.profiles.display_name || friend.profiles.username)}
                      className="btn-retro"
                      size="sm"
                    >
                      MENSAGEM
                    </Button>
                    <Button
                      onClick={() => removeFriend(friend.id)}
                      variant="outline"
                      className="btn-retro"
                      size="sm"
                    >
                      REMOVER
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-mono text-muted-foreground">
                Nenhum amigo ainda. Adicione amigos para começar!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsList;