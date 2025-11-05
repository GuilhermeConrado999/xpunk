import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import { ForumPost as ForumPostCard } from '@/components/forum/ForumPost';
import { ForumComment } from '@/components/forum/ForumComment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ForumPostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        profiles!forum_posts_user_id_fkey (
          username,
          display_name,
          avatar_url
        ),
        communities (
          name,
          emoji,
          color
        )
      `)
      .eq('id', postId)
      .single();

    if (!error && data) {
      // Buscar contagem de comentários
      const { count } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', data.id);

      // Buscar voto do usuário
      let userVote = null;
      if (user) {
        const { data: voteData } = await supabase
          .from('forum_post_votes')
          .select('vote_type')
          .eq('post_id', data.id)
          .eq('user_id', user.id)
          .single();
        
        userVote = voteData?.vote_type || null;
      }

      setPost({
        ...data,
        _count: { comments: count || 0 },
        userVote
      });
    }
    
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from('forum_comments')
      .select(`
        *,
        profiles!forum_comments_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Buscar respostas e votos para cada comentário
      const commentsWithData = await Promise.all(
        data.map(async (comment) => {
          // Buscar respostas
          const { data: replies } = await supabase
            .from('forum_comments')
            .select(`
              *,
              profiles!forum_comments_user_id_fkey (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          // Buscar voto do usuário
          let userVote = null;
          if (user) {
            const { data: voteData } = await supabase
              .from('forum_comment_votes')
              .select('vote_type')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .single();
            
            userVote = voteData?.vote_type || null;
          }

          return {
            ...comment,
            replies: replies || [],
            userVote
          };
        })
      );

      setComments(commentsWithData);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      return;
    }

    if (!commentContent.trim() || !postId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentContent,
          parent_comment_id: null
        });

      if (error) throw error;

      toast({
        title: "Comentário publicado",
        description: "Seu comentário foi adicionado com sucesso"
      });

      setCommentContent('');
      fetchComments();
      fetchPost();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="retro-box bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-terminal text-muted-foreground">
                Carregando post...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <RetroHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="retro-box bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-terminal text-muted-foreground mb-4">
                Post não encontrado
              </p>
              <Button onClick={() => navigate('/forum')} className="btn-retro">
                Voltar ao Fórum
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
          onClick={() => navigate('/forum')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Post */}
        <div className="mb-8">
          <ForumPostCard post={post} />
        </div>

        {/* Comment Form */}
        <Card className="retro-box bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-pixel text-xl glow-text text-retro-cyan">
              <MessageCircle className="inline h-5 w-5 mr-2" />
              ADICIONAR COMENTÁRIO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Escreva seu comentário..."
                className="input-retro min-h-[120px]"
                maxLength={5000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-terminal text-muted-foreground">
                  {commentContent.length}/5000
                </p>
                <Button
                  type="submit"
                  className="btn-retro"
                  disabled={!commentContent.trim() || submitting}
                >
                  {submitting ? 'Publicando...' : 'Comentar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="retro-box bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-pixel text-xl glow-text text-retro-purple">
              COMENTÁRIOS ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <ForumComment
                    key={comment.id}
                    comment={comment}
                    onReply={fetchComments}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-terminal text-muted-foreground">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ForumPostPage;