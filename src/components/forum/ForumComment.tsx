import { useState } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

interface ForumCommentProps {
  comment: {
    id: string;
    content: string;
    upvotes: number;
    downvotes: number;
    created_at: string;
    user_id: string;
    parent_comment_id: string | null;
    post_id: string;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    userVote?: 'up' | 'down' | null;
    replies?: any[];
  };
  onReply?: (commentId: string) => void;
  level?: number;
}

export const ForumComment = ({ comment, onReply, level = 0 }: ForumCommentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentVote, setCurrentVote] = useState(comment.userVote);
  const [voteCount, setVoteCount] = useState(comment.upvotes - comment.downvotes);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      // Buscar o comentário atual do banco para ter os valores reais
      const { data: currentComment } = await supabase
        .from('forum_comments')
        .select('upvotes, downvotes')
        .eq('id', comment.id)
        .single();

      if (!currentComment) return;

      let newUpvotes = currentComment.upvotes;
      let newDownvotes = currentComment.downvotes;

      if (currentVote === voteType) {
        // Remover voto
        await supabase
          .from('forum_comment_votes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);

        if (voteType === 'up') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
        setCurrentVote(null);
      } else {
        // Adicionar ou mudar voto
        await supabase
          .from('forum_comment_votes')
          .upsert({
            comment_id: comment.id,
            user_id: user.id,
            vote_type: voteType
          }, {
            onConflict: 'comment_id,user_id'
          });

        // Se estava com voto oposto, remove do contador antigo
        if (currentVote === 'up') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else if (currentVote === 'down') {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }

        // Adiciona no novo contador
        if (voteType === 'up') {
          newUpvotes += 1;
        } else {
          newDownvotes += 1;
        }
        setCurrentVote(voteType);
      }

      // Atualizar os contadores no banco
      await supabase
        .from('forum_comments')
        .update({
          upvotes: newUpvotes,
          downvotes: newDownvotes
        })
        .eq('id', comment.id);

      // Atualizar o estado local
      setVoteCount(newUpvotes - newDownvotes);
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Erro ao votar",
        description: "Não foi possível registrar seu voto",
        variant: "destructive"
      });
    }
  };

  const handleReplySubmit = async (postId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_comment_id: comment.id,
          content: replyContent
        });

      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi publicada com sucesso"
      });

      setReplyContent('');
      setShowReplyBox(false);
      onReply?.(comment.id);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível publicar sua resposta",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== comment.user_id) return;

    try {
      await supabase
        .from('forum_comments')
        .delete()
        .eq('id', comment.id);

      toast({
        title: "Comentário deletado",
        description: "Seu comentário foi removido com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o comentário",
        variant: "destructive"
      });
    }
  };

  const voteColor = currentVote === 'up' ? 'text-retro-cyan' : currentVote === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const marginLeft = level > 0 ? 'ml-8' : '';

  return (
    <div className={`${marginLeft} border-l-2 border-border/30 pl-4 py-2`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote('up')}
            className={`h-6 w-6 p-0 hover:bg-retro-cyan/20 ${currentVote === 'up' ? 'text-retro-cyan' : 'text-muted-foreground'}`}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className={`text-pixel text-xs font-bold ${voteColor}`}>
            {voteCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote('down')}
            className={`h-6 w-6 p-0 hover:bg-red-500/20 ${currentVote === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-terminal text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-retro-purple text-white text-xs">
                  {comment.profiles?.username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">u/{comment.profiles?.username}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
            {user?.id === comment.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
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

          <p className="text-terminal text-sm">
            {comment.content}
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="h-7 text-xs text-muted-foreground hover:text-retro-cyan"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Responder
            </Button>
          </div>

          {showReplyBox && (
            <div className="space-y-2 pt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="input-retro min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReplySubmit(comment.post_id)}
                  disabled={!replyContent.trim() || submitting}
                  className="btn-retro"
                  size="sm"
                >
                  {submitting ? 'Enviando...' : 'Responder'}
                </Button>
                <Button
                  onClick={() => setShowReplyBox(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 mt-4">
              {comment.replies.map((reply) => (
                <ForumComment
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};