import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import { ForumComment } from '@/components/forum/ForumComment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ForumCommentThread = () => {
  const { postId, commentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [parentComment, setParentComment] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId && commentId) {
      fetchCommentThread();
    }
  }, [postId, commentId, user]);

  const fetchCommentThread = async () => {
    if (!postId || !commentId) return;

    // Buscar o comentário pai
    const { data: parentData, error: parentError } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('id', commentId)
      .maybeSingle();

    if (parentError || !parentData) {
      setLoading(false);
      return;
    }

    // Buscar perfil do autor do comentário pai
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', parentData.user_id)
      .maybeSingle();

    // Buscar voto do usuário no comentário pai
    let parentVote = null;
    if (user) {
      const { data: voteData } = await supabase
        .from('forum_comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();
      parentVote = voteData?.vote_type || null;
    }

    setParentComment({
      ...parentData,
      profiles: parentProfile
        ? { username: parentProfile.username, display_name: parentProfile.display_name, avatar_url: parentProfile.avatar_url }
        : undefined,
      userVote: parentVote
    });

    // Buscar TODAS as respostas do comentário
    await fetchReplies();
    setLoading(false);
  };

  const fetchReplies = async () => {
    if (!commentId || !postId) return;

    // Buscar todos os comentários do post
    const { data: allCommentsData, error } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !allCommentsData) return;

    // Buscar perfis de todos os usuários
    const userIds = Array.from(new Set(allCommentsData.map((c: any) => c.user_id).filter(Boolean)));
    const { data: profilesData } = userIds.length
      ? await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds)
      : { data: [] } as any;

    const profilesMap = new Map(
      (profilesData || []).map((p: any) => [
        p.user_id,
        { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
      ])
    );

    // Buscar votos do usuário
    let userVotesMap = new Map<string, string>();
    if (user) {
      const commentIds = allCommentsData.map((c: any) => c.id);
      const { data: votesData } = await supabase
        .from('forum_comment_votes')
        .select('comment_id, vote_type')
        .in('comment_id', commentIds)
        .eq('user_id', user.id);
      
      if (votesData) {
        userVotesMap = new Map(votesData.map((v: any) => [v.comment_id, v.vote_type]));
      }
    }

    // Criar mapa de comentários para pegar username do pai
    const commentsMap = new Map(
      allCommentsData.map((c: any) => [c.id, { ...c, profiles: profilesMap.get(c.user_id) }])
    );

    // Função recursiva para organizar respostas
    const organizeReplies = (parentId: string, parentUsernameArg?: string): any[] => {
      return allCommentsData
        .filter((c: any) => c.parent_comment_id === parentId)
        .map((comment: any) => {
          const profile = profilesMap.get(comment.user_id) as { username?: string } | undefined;
          const replies = organizeReplies(comment.id, profile?.username);
          return {
            ...comment,
            profiles: profilesMap.get(comment.user_id),
            post_id: postId,
            parentUsername: parentUsernameArg,
            userVote: userVotesMap.get(comment.id) || null,
            replies
          };
        });
    };

    // Organizar respostas diretas do comentário pai
    const directReplies = organizeReplies(commentId, parentComment?.profiles?.username);
    setReplies(directReplies);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para responder",
        variant: "destructive"
      });
      return;
    }

    if (!replyContent.trim() || !postId || !commentId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent,
          parent_comment_id: commentId
        });

      if (error) throw error;

      toast({
        title: "Resposta publicada",
        description: "Sua resposta foi adicionada com sucesso"
      });

      setReplyContent('');
      fetchReplies();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível publicar a resposta",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="retro-box bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-terminal text-muted-foreground">
                Carregando thread...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!parentComment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="retro-box bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-terminal text-muted-foreground mb-4">
                Comentário não encontrado
              </p>
              <Button onClick={() => navigate(`/forum/post/${postId}`)} className="btn-retro">
                Voltar ao Post
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(`/forum/post/${postId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Post
        </Button>

        {/* Parent Comment */}
        <Card className="retro-box bg-card/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-pixel text-lg glow-text text-retro-purple">
              THREAD DE COMENTÁRIO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ForumComment
              comment={{
                ...parentComment,
                replies: [] // Don't show replies here, we'll show them separately
              }}
              onReply={fetchReplies}
              level={0}
              showAllReplies={true}
            />
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Card className="retro-box bg-card/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-pixel text-base glow-text text-retro-cyan">
              <MessageCircle className="inline h-4 w-4 mr-2" />
              RESPONDER A {parentComment.profiles?.username?.toUpperCase() || 'USUÁRIO'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="input-retro min-h-[100px]"
                maxLength={5000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-terminal text-muted-foreground">
                  {replyContent.length}/5000
                </p>
                <Button
                  type="submit"
                  className="btn-retro"
                  disabled={!replyContent.trim() || submitting}
                >
                  {submitting ? 'Enviando...' : 'Responder'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Replies */}
        <Card className="retro-box bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-pixel text-lg glow-text text-retro-purple">
              RESPOSTAS ({replies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <ForumComment
                    key={reply.id}
                    comment={reply}
                    onReply={fetchReplies}
                    level={1}
                    showAllReplies={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-terminal text-muted-foreground">
                  Nenhuma resposta ainda. Seja o primeiro!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ForumCommentThread;