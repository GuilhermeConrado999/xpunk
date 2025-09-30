import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  friendship_status?: string;
}

const UserSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user) return;

    setLoading(true);
    
    // Buscar usuários pelo username ou display_name
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível buscar usuários",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Verificar status de amizade para cada resultado
    const resultsWithStatus = await Promise.all(
      profiles.map(async (profile) => {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.user_id}),and(user_id.eq.${profile.user_id},friend_id.eq.${user.id})`)
          .single();

        return {
          ...profile,
          friendship_status: friendship?.status
        };
      })
    );

    setResults(resultsWithStatus);
    setLoading(false);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Solicitação de amizade enviada!"
      });
      // Atualizar resultados
      searchUsers();
    }
  };

  return (
    <Card className="retro-box bg-card">
      <CardHeader>
        <CardTitle className="text-pixel text-retro-cyan">BUSCAR USUÁRIOS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            className="input-retro"
          />
          <Button 
            onClick={searchUsers}
            className="btn-retro"
            disabled={loading}
          >
            {loading ? 'BUSCANDO...' : 'BUSCAR'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 mt-4">
            {results.map((result) => (
              <div key={result.user_id} className="flex items-center justify-between p-3 border border-retro-cyan/30 rounded bg-card/50">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => navigate(`/profile/${result.user_id}`)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={result.avatar_url} />
                    <AvatarFallback className="bg-retro-purple text-white">
                      {result.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-terminal font-semibold">
                      {result.display_name || result.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{result.username}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {!result.friendship_status && (
                    <Button
                      onClick={() => sendFriendRequest(result.user_id)}
                      className="btn-retro"
                      size="sm"
                    >
                      ADICIONAR
                    </Button>
                  )}
                  {result.friendship_status === 'pending' && (
                    <Button
                      disabled
                      variant="outline"
                      className="btn-retro"
                      size="sm"
                    >
                      PENDENTE
                    </Button>
                  )}
                  {result.friendship_status === 'accepted' && (
                    <Button
                      disabled
                      variant="outline"
                      className="btn-retro"
                      size="sm"
                    >
                      AMIGOS
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && searchTerm && !loading && (
          <div className="text-center py-8">
            <p className="text-mono text-muted-foreground">
              Nenhum usuário encontrado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearch;