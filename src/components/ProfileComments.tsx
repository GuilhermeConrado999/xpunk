import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ProfileComment {
  id: string;
  profile_user_id: string;
  commenter_user_id: string;
  content: string;
  created_at: string;
  commenter?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ProfileCommentsProps {
  profileUserId: string;
  isOwnProfile: boolean;
}

export const ProfileComments = ({ profileUserId, isOwnProfile }: ProfileCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [profileUserId]);

  const fetchComments = async () => {
    setLoading(true);
    
    // Buscar comentários
    const { data: commentsData, error: commentsError } = await supabase
      .from('profile_comments')
      .select('*')
      .eq('profile_user_id', profileUserId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Erro ao buscar comentários:', commentsError);
      setLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Buscar perfis dos comentadores
    const commenterIds = commentsData.map(c => c.commenter_user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', commenterIds);

    // Combinar dados
    const commentsWithProfiles = commentsData.map(comment => {
      const profile = profilesData?.find(p => p.user_id === comment.commenter_user_id);
      return {
        ...comment,
        commenter: profile ? {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        } : undefined
      };
    });

    setComments(commentsWithProfiles);
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_user_id: profileUserId,
          commenter_user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário publicado!"
      });

      setNewComment('');
      fetchComments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível publicar o comentário",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário deletado"
      });

      fetchComments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o comentário",
        variant: "destructive"
      });
    }
  };

  const canDeleteComment = (comment: ProfileComment) => {
    if (!user) return false;
    return comment.commenter_user_id === user.id || isOwnProfile;
  };

  return (
    <Card className="retro-box bg-card">
      <CardHeader>
        <CardTitle className="text-pixel text-retro-cyan">
          COMENTÁRIOS ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para adicionar comentário */}
        {user && (
          <div className="space-y-3 p-4 border border-retro-cyan/30 rounded bg-card/50">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Deixe um comentário no perfil..."
              className="input-retro min-h-[100px]"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground text-mono">
                {newComment.length}/500 caracteres
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="btn-retro"
                size="sm"
              >
                {submitting ? 'PUBLICANDO...' : 'PUBLICAR'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de comentários */}
        {loading ? (
          <div className="text-center text-mono text-muted-foreground py-8">
            Carregando comentários...
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 border border-border/30 rounded bg-card/30 hover:border-retro-cyan/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar 
                    className="w-10 h-10 cursor-pointer"
                    onClick={() => navigate(`/profile/${comment.commenter_user_id}`)}
                  >
                    <AvatarImage src={comment.commenter?.avatar_url || undefined} />
                    <AvatarFallback className="bg-retro-purple text-white text-sm">
                      {comment.commenter?.username?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span 
                          className="text-terminal font-semibold cursor-pointer hover:text-retro-cyan transition-colors"
                          onClick={() => navigate(`/profile/${comment.commenter_user_id}`)}
                        >
                          {comment.commenter?.display_name || comment.commenter?.username}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      {canDeleteComment(comment) && (
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-terminal text-sm whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-mono text-muted-foreground py-8">
            {isOwnProfile 
              ? 'Nenhum comentário ainda. Compartilhe seu perfil para receber comentários!'
              : 'Seja o primeiro a comentar!'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
