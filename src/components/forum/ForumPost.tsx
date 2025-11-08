import { useState } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, Pin, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ForumPostProps {
  post: {
    id: string;
    title: string;
    content: string | null;
    upvotes: number;
    downvotes: number;
    created_at: string;
    is_pinned: boolean;
    user_id: string;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    communities?: {
      name: string;
      emoji: string;
      color: string;
    } | null;
    _count?: {
      comments: number;
    };
    userVote?: 'up' | 'down' | null;
  };
  onClick?: () => void;
}

export const ForumPost = ({ post, onClick }: ForumPostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentVote, setCurrentVote] = useState(post.userVote);
  const [voteCount, setVoteCount] = useState(post.upvotes - post.downvotes);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para votar",
        variant: "destructive"
      });
      return;
    }

    try {
      if (currentVote === voteType) {
        // Remover voto
        await supabase
          .from('forum_post_votes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        // Atualizar contador no banco
        const newUpvotes = voteType === 'up' ? Math.max(0, post.upvotes - 1) : post.upvotes;
        const newDownvotes = voteType === 'down' ? Math.max(0, post.downvotes - 1) : post.downvotes;
        
        await supabase
          .from('forum_posts')
          .update({ upvotes: newUpvotes, downvotes: newDownvotes })
          .eq('id', post.id);

        setVoteCount(newUpvotes - newDownvotes);
        setCurrentVote(null);
      } else {
        // Adicionar ou mudar voto
        await supabase
          .from('forum_post_votes')
          .upsert({
            post_id: post.id,
            user_id: user.id,
            vote_type: voteType
          }, {
            onConflict: 'post_id,user_id'
          });

        // Calcular novos valores
        let newUpvotes = post.upvotes;
        let newDownvotes = post.downvotes;

        if (currentVote === 'up') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else if (currentVote === 'down') {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }

        if (voteType === 'up') {
          newUpvotes += 1;
        } else {
          newDownvotes += 1;
        }

        // Atualizar contador no banco
        await supabase
          .from('forum_posts')
          .update({ upvotes: newUpvotes, downvotes: newDownvotes })
          .eq('id', post.id);

        setVoteCount(newUpvotes - newDownvotes);
        setCurrentVote(voteType);
        
        // Atualizar o objeto post para futuras operações
        post.upvotes = newUpvotes;
        post.downvotes = newDownvotes;
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return;

    try {
      await supabase
        .from('forum_posts')
        .delete()
        .eq('id', post.id);

      toast({
        title: "Post deletado",
        description: "Seu post foi removido com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o post",
        variant: "destructive"
      });
    }
  };

  const score = voteCount;
  const voteColor = currentVote === 'up' ? 'text-retro-cyan' : currentVote === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="retro-box bg-card/60 backdrop-blur-sm hover:border-retro-cyan/60 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote Section */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('up')}
              className={`h-8 w-8 p-0 hover:bg-retro-cyan/20 ${currentVote === 'up' ? 'text-retro-cyan' : 'text-muted-foreground'}`}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className={`text-pixel text-sm font-bold ${voteColor}`}>
              {score}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('down')}
              className={`h-8 w-8 p-0 hover:bg-red-500/20 ${currentVote === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Content Section */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_pinned && (
                  <Badge variant="outline" className="border-retro-purple text-retro-purple">
                    <Pin className="h-3 w-3 mr-1" />
                    FIXADO
                  </Badge>
                )}
                {post.communities && (
                  <Badge 
                    variant="outline" 
                    className="border-retro-cyan"
                    style={{ borderColor: post.communities.color }}
                  >
                    {post.communities.emoji} {post.communities.name}
                  </Badge>
                )}
              </div>
              {user?.id === post.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div 
              className="cursor-pointer" 
              onClick={onClick}
            >
              <h3 className="text-pixel text-lg hover:text-retro-cyan transition-colors">
                {post.title}
              </h3>
              {post.content && (
                <p className="text-terminal text-sm text-muted-foreground line-clamp-3 mt-2">
                  {post.content}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-terminal text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar 
                  className="h-6 w-6 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.user_id) navigate(`/profile/${post.user_id}`);
                  }}
                >
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-retro-purple text-white text-xs">
                    {post.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="cursor-pointer hover:text-retro-cyan transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.user_id) navigate(`/profile/${post.user_id}`);
                  }}
                >
                  u/{post.profiles?.username}
                </span>
              </div>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{post._count?.comments || 0} comentários</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};