import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Download, Star, MessageSquare, Send, Trash2, Pencil, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  community: string;
  tags: string[];
  views: number;
  duration: string;
  created_at: string;
  allow_download?: boolean;
  user_id: string;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
}

interface VideoPlayerProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VideoPlayer = ({ video, open, onOpenChange }: VideoPlayerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (video && open) {
      fetchVideoData();
    }
  }, [video, open]);

  // Separate effect for incrementing views only once when video opens
  useEffect(() => {
    let viewIncremented = false;
    
    if (video && open && !viewIncremented) {
      incrementViews();
      viewIncremented = true;
    }
  }, [video?.id, open]);

  const fetchVideoData = async () => {
    if (!video) return;

    try {
      // Fetch video owner profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', video.user_id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('rating, user_id')
        .eq('video_id', video.id);

      if (ratingsData) {
        const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length || 0;
        setAverageRating(avg);
        setRatingCount(ratingsData.length);
        
        const userRatingData = ratingsData.find(r => r.user_id === user?.id);
        if (userRatingData) setUserRating(userRatingData.rating);
      }

      // Fetch comments with profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', video.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        setComments([]);
      } else if (commentsData) {
        const userIds = Array.from(new Set(commentsData.map((comment) => comment.user_id)));

        let profilesMap = new Map<string, Profile>();
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .in('user_id', userIds);

          if (profilesError) {
            console.warn('Unable to load profiles for comments:', profilesError.message);
          } else if (profilesData) {
            profilesMap = new Map(
              profilesData.map((profile) => [profile.user_id, profile as Profile])
            );
          }
        }

        const commentsWithProfiles = commentsData.map((comment) => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) ?? null,
        }));

        setComments(commentsWithProfiles as Comment[]);
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
    }
  };

  const incrementViews = async () => {
    if (!video) return;
    
    try {
      await supabase.rpc('increment_video_views', { 
        video_id: video.id 
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user || !video) {
      toast.error('Faça login para avaliar');
      return;
    }

    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          video_id: video.id,
          user_id: user.id,
          rating: rating,
        });

      if (error) throw error;

      setUserRating(rating);
      toast.success('Avaliação enviada!');
      fetchVideoData();
    } catch (error: any) {
      toast.error('Erro ao avaliar: ' + error.message);
    }
  };

  const handleComment = async () => {
    if (!user || !video) {
      toast.error('Faça login para comentar');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    setLoadingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: video.id,
          user_id: user.id,
          content: newComment,
        });

      if (error) throw error;

      setNewComment('');
      toast.success('Comentário enviado!');
      fetchVideoData();
    } catch (error: any) {
      toast.error('Erro ao comentar: ' + error.message);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Comentário deletado!');
      fetchVideoData();
    } catch (error: any) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !editingContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editingContent })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingCommentId(null);
      setEditingContent('');
      toast.success('Comentário editado!');
      fetchVideoData();
    } catch (error: any) {
      toast.error('Erro ao editar: ' + error.message);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDownload = () => {
    if (video?.video_url) {
      window.open(video.video_url, '_blank');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && handleRating(star)}
            disabled={!interactive}
            className={`text-2xl ${interactive ? 'hover:scale-110 transition-transform cursor-pointer' : ''} ${
              star <= (interactive ? userRating : rating) ? 'text-terminal' : 'text-muted-foreground'
            }`}
          >
            {star <= (interactive ? userRating : rating) ? '★' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto retro-box bg-card">
        <DialogHeader>
          <DialogTitle className="text-pixel text-2xl glow-text text-retro-purple">
            {video.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="retro-box bg-background scanlines">
              <div className="relative aspect-video">
                <video
                  src={video.video_url}
                  controls
                  className="absolute inset-0 w-full h-full object-contain pixel-border bg-black"
                  poster={video.thumbnail_url || undefined}
                />
              </div>
            </div>

            {/* Video Info */}
            <div className="retro-box p-4 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mono text-sm text-muted-foreground">
                    por: <span 
                      className="text-terminal hover-retro cursor-pointer hover:text-retro-cyan transition-colors"
                      onClick={() => {
                        if (profile?.user_id) {
                          onOpenChange(false);
                          navigate(`/profile/${profile.user_id}`);
                        }
                      }}
                    >
                      {profile?.username || 'Anônimo'}
                    </span>
                  </p>
                  <p className="text-xs text-terminal text-muted-foreground">
                    {video.views} views • {formatDate(video.created_at)}
                  </p>
                </div>
                
                {video.allow_download && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="text-mono"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    BAIXAR
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-terminal">
                  {video.community.toUpperCase()}
                </Badge>
                {video.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-mono text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {video.description && (
                <p className="text-mono text-sm text-muted-foreground">
                  {video.description}
                </p>
              )}
            </div>

            {/* Comments Section */}
            <div className="retro-box p-4 bg-background space-y-4">
              <h3 className="text-pixel text-lg text-terminal flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                COMENTÁRIOS ({comments.length})
              </h3>

              {user && (
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="text-mono resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleComment}
                    disabled={loadingComment}
                    size="sm"
                    className="btn-retro"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loadingComment ? 'ENVIANDO...' : 'ENVIAR'}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="retro-box p-3 bg-card">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar 
                              className="w-8 h-8 cursor-pointer"
                              onClick={() => {
                                if (comment.profiles?.user_id) {
                                  onOpenChange(false);
                                  navigate(`/profile/${comment.profiles.user_id}`);
                                }
                              }}
                            >
                              <AvatarImage
                                src={comment.profiles?.avatar_url || undefined}
                                alt={comment.profiles?.username ?? 'Avatar'}
                              />
                              <AvatarFallback className="bg-muted text-mono text-sm">
                                {comment.profiles?.username?.charAt(0).toUpperCase() ?? 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <p 
                              className="text-mono text-sm font-bold cursor-pointer hover:text-retro-cyan transition-colors"
                              onClick={() => {
                                if (comment.profiles?.user_id) {
                                  onOpenChange(false);
                                  navigate(`/profile/${comment.profiles.user_id}`);
                                }
                              }}
                            >
                              {comment.profiles?.username ?? 'Usuário'}
                            </p>
                          </div>
                          
                          {user?.id === comment.user_id && editingCommentId !== comment.id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-terminal"
                                onClick={() => startEditing(comment)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-terminal">
                          {formatDate(comment.created_at)}
                        </p>
                        
                        {editingCommentId === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="text-mono resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="btn-retro h-7 text-xs"
                                onClick={() => handleEditComment(comment.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={cancelEditing}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-mono text-sm mt-1">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-center text-mono text-sm text-muted-foreground py-4">
                    Nenhum comentário ainda. Seja o primeiro!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Rating */}
            <div className="retro-box p-4 bg-background space-y-3">
              <h3 className="text-pixel text-lg text-terminal flex items-center">
                <Star className="mr-2 h-5 w-5" />
                AVALIAÇÃO
              </h3>
              
              <div className="text-center space-y-2">
                <div className="text-3xl text-terminal">
                  {averageRating > 0 ? averageRating.toFixed(1) : '---'}
                </div>
                {renderStars(averageRating)}
                <p className="text-xs text-muted-foreground text-mono">
                  {ratingCount} {ratingCount === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              {user && (
                <>
                  <hr className="border-border" />
                  <div className="space-y-2">
                    <p className="text-mono text-sm text-center">
                      Sua avaliação:
                    </p>
                    <div className="flex justify-center">
                      {renderStars(userRating, true)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Video Stats */}
            <div className="retro-box p-4 bg-background">
              <h3 className="text-pixel text-lg text-terminal mb-3">
                ESTATÍSTICAS
              </h3>
              <div className="space-y-2 text-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visualizações:</span>
                  <span className="text-terminal">{video.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comentários:</span>
                  <span className="text-terminal">{comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avaliações:</span>
                  <span className="text-terminal">{ratingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="text-terminal">{video.duration || '0:00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
