import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import { ForumPost } from '@/components/forum/ForumPost';
import { CreatePostDialog } from '@/components/forum/CreatePostDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Clock, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Community {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
    fetchPosts();
  }, [selectedCommunity, sortBy, user]);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from('communities')
      .select('id, name, emoji, color')
      .order('name');

    if (data) {
      setCommunities(data);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    
    let query = supabase
      .from('forum_posts')
      .select('*');

    if (selectedCommunity) {
      query = query.eq('community_id', selectedCommunity);
    }

    // Ordenação
    if (sortBy === 'new') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'top') {
      query = query.order('upvotes', { ascending: false });
    } else {
      // 'hot' - combina votos recentes com data
      query = query.order('created_at', { ascending: false });
    }

    const { data: postsData, error } = await query;

    if (!error && postsData) {
      const userIds = Array.from(new Set(postsData.map((p: any) => p.user_id).filter(Boolean)));
      const commIds = Array.from(new Set(postsData.map((p: any) => p.community_id).filter(Boolean)));

      const [{ data: profilesData }, { data: commsData }] = await Promise.all([
        userIds.length
          ? supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .in('user_id', userIds)
          : Promise.resolve({ data: [] as any }),
        commIds.length
          ? supabase
              .from('communities')
              .select('id, name, emoji, color')
              .in('id', commIds)
          : Promise.resolve({ data: [] as any })
      ]);

      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [
          p.user_id,
          { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
        ])
      );
      const commsMap = new Map(
        (commsData || []).map((c: any) => [
          c.id,
          { name: c.name, emoji: c.emoji, color: c.color }
        ])
      );

      const postsWithCounts = await Promise.all(
        postsData.map(async (post: any) => {
          const { count } = await supabase
            .from('forum_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          let userVote = null;
          if (user) {
            const { data: voteData } = await supabase
              .from('forum_post_votes')
              .select('vote_type')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userVote = voteData?.vote_type || null;
          }

          return {
            ...post,
            profiles: profilesMap.get(post.user_id),
            communities: commsMap.get(post.community_id) || null,
            _count: { comments: count || 0 },
            userVote
          };
        })
      );

      setPosts(postsWithCounts);
    }
    
    setLoading(false);
  };

  const handlePostClick = (postId: string) => {
    navigate(`/forum/post/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="retro-box bg-card/80 backdrop-blur-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MessageSquare className="w-12 h-12 text-retro-cyan" />
              <div>
                <h1 className="text-pixel text-4xl glow-text mb-2">
                  FÓRUM
                </h1>
                <p className="text-terminal text-muted-foreground">
                  Participe das discussões da comunidade
                </p>
              </div>
            </div>
            <CreatePostDialog communities={communities} onPostCreated={fetchPosts} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Comunidades */}
          <div className="lg:col-span-1">
            <Card className="retro-box bg-card/80 backdrop-blur-sm sticky top-4">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-pixel text-xl glow-text text-retro-purple">
                  COMUNIDADES
                </h2>
                
                <div className="space-y-2">
                  <Button
                    variant={selectedCommunity === null ? "default" : "outline"}
                    className={selectedCommunity === null ? "btn-retro w-full" : "w-full"}
                    onClick={() => setSelectedCommunity(null)}
                  >
                    🌐 Todas
                  </Button>
                  
                  {communities.map((community) => (
                    <Button
                      key={community.id}
                      variant={selectedCommunity === community.id ? "default" : "outline"}
                      className={selectedCommunity === community.id ? "btn-retro w-full" : "w-full"}
                      onClick={() => setSelectedCommunity(community.id)}
                    >
                      {community.emoji} {community.name}
                    </Button>
                  ))}
                </div>

                <div className="border-t border-dashed border-border pt-4 mt-4">
                  <div className="visitor-counter text-center py-2">
                    POSTS: <span className="blink">{posts.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filtros */}
            <Card className="retro-box bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="hot" className="text-terminal">
                      <Flame className="h-4 w-4 mr-2" />
                      Populares
                    </TabsTrigger>
                    <TabsTrigger value="new" className="text-terminal">
                      <Clock className="h-4 w-4 mr-2" />
                      Novos
                    </TabsTrigger>
                    <TabsTrigger value="top" className="text-terminal">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Top
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Lista de Posts */}
            {loading ? (
              <Card className="retro-box bg-card/60 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-terminal text-muted-foreground">
                    Carregando posts...
                  </p>
                </CardContent>
              </Card>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <ForumPost
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="retro-box bg-card/60 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-terminal text-muted-foreground mb-4">
                    Nenhum post ainda nesta comunidade
                  </p>
                  <CreatePostDialog communities={communities} onPostCreated={fetchPosts} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Forum;