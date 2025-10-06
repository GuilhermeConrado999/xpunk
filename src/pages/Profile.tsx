import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import VideoCardReal from '@/components/VideoCardReal';
import FriendsList from '@/components/FriendsList';
import UserSearch from '@/components/UserSearch';
import ChatDialog from '@/components/ChatDialog';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  background_url: string | null;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  community: string;
  tags: string[];
  description: string;
  duration: string;
  user_id: string;
  allow_download?: boolean;
  profiles: Profile;
}

interface UserStats {
  totalVideos: number;
  totalViews: number;
  totalRatings: number;
  avgRating: number;
  joinDate: string;
  level: number;
  xp: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    username: ''
  });
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFriendId, setChatFriendId] = useState('');
  const [chatFriendName, setChatFriendName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const isOwnProfile = !userId || userId === user?.id;
  const profileUserId = userId || user?.id;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      fetchUserVideos();
      fetchUserStats();
      if (!isOwnProfile && user) {
        checkFriendshipStatus();
      }
    }
  }, [profileUserId, user, userId]);

  const fetchProfile = async () => {
    if (!profileUserId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profileUserId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
    } else {
      setProfile(data);
      if (isOwnProfile) {
        setEditData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          username: data.username || ''
        });
      }
    }
    setLoading(false);
  };

  const fetchUserVideos = async () => {
    if (!profileUserId) return;

    // Buscar vídeos do usuário
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', profileUserId)
      .order('created_at', { ascending: false });

    if (videosError) {
      console.error('Erro ao buscar vídeos:', videosError);
      return;
    }

    // Buscar perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profileUserId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil para vídeos:', profileError);
      return;
    }

    // Combinar dados
    const videosWithProfile = videosData?.map(video => ({
      ...video,
      profiles: profileData
    })) || [];

    setUserVideos(videosWithProfile);
  };

  const fetchUserStats = async () => {
    if (!profileUserId) return;

    // Buscar estatísticas do usuário
    const { data: videos } = await supabase
      .from('videos')
      .select('views, created_at')
      .eq('user_id', profileUserId);

    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', profileUserId);

    const totalVideos = videos?.length || 0;
    const totalViews = videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
    const totalRatings = ratings?.length || 0;
    const avgRating = ratings?.length 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    // Calcular nível baseado na atividade
    const xp = totalVideos * 100 + totalViews * 2 + totalRatings * 50;
    const level = Math.floor(xp / 1000) + 1;

    setUserStats({
      totalVideos,
      totalViews,
      totalRatings,
      avgRating,
      joinDate: profile?.created_at || '',
      level,
      xp: xp % 1000
    });
  };

  const checkFriendshipStatus = async () => {
    if (!user || !profileUserId) return;

    const { data } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${profileUserId}),and(user_id.eq.${profileUserId},friend_id.eq.${user.id})`)
      .maybeSingle();

    setFriendshipStatus(data?.status || null);
  };

  const sendFriendRequest = async () => {
    if (!user || !profileUserId) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: profileUserId,
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
      checkFriendshipStatus();
    }
  };

  const openChat = (friendId: string, friendName: string) => {
    setChatFriendId(friendId);
    setChatFriendName(friendName);
    setChatOpen(true);
  };

  const validateGifDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const isValid = img.width >= 1920 && img.height >= 1080;
        resolve(isValid);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    // Validar tipo de arquivo
    if (file.type !== 'image/gif') {
      toast({
        title: "Erro",
        description: "Apenas arquivos GIF são permitidos!",
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10485760) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 10MB!",
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    setUploadingBackground(true);

    try {
      // Validar dimensões
      const isValidSize = await validateGifDimensions(file);
      if (!isValidSize) {
        throw new Error("O GIF deve ter resolução mínima de 1920x1080!");
      }

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/background-${timestamp}.${fileExt}`;

      // Remove old background if exists
      if (profile?.background_url) {
        const oldPath = profile.background_url.split('/backgrounds/')[1];
        if (oldPath) {
          await supabase.storage
            .from('backgrounds')
            .remove([oldPath]);
        }
      }

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('backgrounds')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(filePath);

      // Update profile with new background URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ background_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Background atualizado com sucesso!"
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o background",
        variant: "destructive"
      });
    } finally {
      setUploadingBackground(false);
      event.target.value = '';
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    setUploadingAvatar(true);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!"
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o avatar",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editData.display_name,
        bio: editData.bio,
        username: editData.username
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
      setIsEditing(false);
      fetchProfile();
    }
  };

  const getProgressToNextLevel = () => {
    return userStats ? (userStats.xp / 1000) * 100 : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RetroHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-pixel glow-text">CARREGANDO PERFIL...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <RetroHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-pixel text-destructive">PERFIL NÃO ENCONTRADO</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RetroHeader />
      
      <div className="container mx-auto px-4 py-6">
        {/* Profile Header - Steam Style */}
        <div className="retro-box bg-card p-6 mb-6 scanlines relative overflow-hidden">
          {/* Custom Background */}
          {profile.background_url && (
            <>
              <div className="absolute inset-0 z-0">
                <img 
                  src={profile.background_url} 
                  alt="Profile background"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background/90 z-0"></div>
            </>
          )}
          {!profile.background_url && (
            <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/10 to-retro-cyan/10 z-0"></div>
          )}
          
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 pixel-border">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-retro-purple text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  >
                    <span className="text-white text-xs text-center px-2">
                      {uploadingAvatar ? 'ENVIANDO...' : 'ALTERAR FOTO'}
                    </span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              {userStats && (
                <div className="text-center space-y-1">
                  <div className="text-pixel text-retro-cyan text-xl">
                    LEVEL {userStats.level}
                  </div>
                  <Progress 
                    value={getProgressToNextLevel()} 
                    className="w-24 h-2 bg-retro-bg border border-retro-cyan/50"
                  />
                  <div className="text-xs text-mono text-muted-foreground">
                    {userStats.xp}/1000 XP
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-pixel text-3xl glow-text text-retro-cyan">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-mono text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
                
                {isOwnProfile ? (
                  <Button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-retro"
                  >
                    {isEditing ? 'CANCELAR' : 'EDITAR PERFIL'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {friendshipStatus === 'accepted' && (
                      <Button 
                        onClick={() => openChat(profileUserId!, profile.display_name || profile.username)}
                        className="btn-retro"
                      >
                        ENVIAR MENSAGEM
                      </Button>
                    )}
                    {!friendshipStatus && (
                      <Button 
                        onClick={sendFriendRequest}
                        className="btn-retro"
                      >
                        ADICIONAR AMIGO
                      </Button>
                    )}
                    {friendshipStatus === 'pending' && (
                      <Button 
                        disabled
                        variant="outline"
                        className="btn-retro"
                      >
                        SOLICITAÇÃO PENDENTE
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-mono text-sm leading-relaxed max-w-2xl">
                {profile.bio || 'Nenhuma biografia adicionada ainda...'}
              </p>

              {/* Quick Stats */}
              {userStats && (
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="text-terminal border-retro-cyan">
                    📹 {userStats.totalVideos} vídeos
                  </Badge>
                  <Badge variant="outline" className="text-terminal border-retro-pink">
                    👁️ {userStats.totalViews.toLocaleString()} visualizações
                  </Badge>
                  <Badge variant="outline" className="text-terminal border-retro-purple">
                    ⭐ {userStats.avgRating.toFixed(1)} rating médio
                  </Badge>
                  <Badge variant="outline" className="text-terminal border-retro-cyan">
                    📅 Membro desde {formatDate(userStats.joinDate)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <Card className="retro-box bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-pixel text-retro-cyan">EDITAR PERFIL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-terminal">Username</Label>
                <Input
                  id="username"
                  value={editData.username}
                  onChange={(e) => setEditData({...editData, username: e.target.value})}
                  className="input-retro"
                />
              </div>
              
              <div>
                <Label htmlFor="display_name" className="text-terminal">Nome de Exibição</Label>
                <Input
                  id="display_name"
                  value={editData.display_name}
                  onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                  className="input-retro"
                />
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-terminal">Biografia</Label>
                <textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full p-3 bg-background border border-border rounded text-mono text-sm min-h-24"
                  placeholder="Conte sobre você, seus jogos favoritos, etc..."
                />
              </div>

              <div>
                <Label htmlFor="background-upload" className="text-terminal">
                  Background Customizado (GIF - Mínimo 1920x1080)
                </Label>
                <div className="space-y-2">
                  {profile.background_url && (
                    <div className="relative w-full h-32 rounded overflow-hidden border border-border">
                      <img 
                        src={profile.background_url} 
                        alt="Background atual" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label 
                      htmlFor="background-upload"
                      className="btn-retro cursor-pointer inline-flex items-center justify-center"
                    >
                      {uploadingBackground ? 'ENVIANDO...' : 'ESCOLHER GIF'}
                    </label>
                    <input
                      id="background-upload"
                      type="file"
                      accept="image/gif"
                      onChange={handleBackgroundUpload}
                      disabled={uploadingBackground}
                      className="hidden"
                    />
                    {profile.background_url && (
                      <Button
                        onClick={async () => {
                          await supabase
                            .from('profiles')
                            .update({ background_url: null })
                            .eq('user_id', user!.id);
                          fetchProfile();
                          toast({
                            title: "Sucesso",
                            description: "Background removido!"
                          });
                        }}
                        variant="outline"
                        className="btn-retro"
                      >
                        REMOVER
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-mono">
                    Apenas GIF • Resolução mínima: 1920x1080 • Máximo: 10MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={updateProfile} className="btn-retro">
                  SALVAR ALTERAÇÕES
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)} 
                  variant="outline" 
                  className="btn-retro"
                >
                  CANCELAR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Content in Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Videos Section */}
            <Card className="retro-box bg-card">
              <CardHeader>
                <CardTitle className="text-pixel text-retro-cyan">
                  {isOwnProfile ? 'MEUS VÍDEOS' : 'VÍDEOS'} ({userVideos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userVideos.map((video) => (
                      <VideoCardReal key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-mono text-muted-foreground">
                      Nenhum vídeo foi feito o upload ainda...
                    </p>
                    {isOwnProfile && (
                      <Button className="btn-retro mt-4">FAZER PRIMEIRO UPLOAD</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Section */}
            <Card className="retro-box bg-card">
              <CardHeader>
                <CardTitle className="text-pixel text-retro-cyan">CONQUISTAS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-retro-cyan/30 rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎬</div>
                      <div>
                        <div className="text-terminal font-semibold">Primeiro Upload</div>
                        <div className="text-xs text-muted-foreground">Faça seu primeiro upload de vídeo</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-retro-pink/30 rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👁️</div>
                      <div>
                        <div className="text-terminal font-semibold">Viral</div>
                        <div className="text-xs text-muted-foreground">Atinja 1000 visualizações</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-retro-purple/30 rounded bg-card/50 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">⭐</div>
                      <div>
                        <div className="text-terminal font-semibold">Estrela</div>
                        <div className="text-xs text-muted-foreground">Mantenha rating 4.5+ em 10 vídeos</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-retro-cyan/30 rounded bg-card/50 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="text-terminal font-semibold">Lenda</div>
                        <div className="text-xs text-muted-foreground">Alcance nível 10</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="space-y-6">
            {/* Stats Section */}
            {userStats && (
              <div className="space-y-4">
                <h2 className="text-pixel text-retro-cyan text-xl">ESTATÍSTICAS</h2>
                
                <Card className="retro-box bg-card text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl text-pixel text-retro-cyan mb-2">
                      {userStats.totalVideos}
                    </div>
                    <div className="text-terminal text-sm">VÍDEOS PUBLICADOS</div>
                  </CardContent>
                </Card>
                
                <Card className="retro-box bg-card text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl text-pixel text-retro-pink mb-2">
                      {userStats.totalViews.toLocaleString()}
                    </div>
                    <div className="text-terminal text-sm">VISUALIZAÇÕES TOTAIS</div>
                  </CardContent>
                </Card>
                
                <Card className="retro-box bg-card text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl text-pixel text-retro-purple mb-2">
                      {userStats.avgRating.toFixed(1)}⭐
                    </div>
                    <div className="text-terminal text-sm">RATING MÉDIO</div>
                  </CardContent>
                </Card>
                
                <Card className="retro-box bg-card text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl text-pixel text-retro-cyan mb-2">
                      {userStats.level}
                    </div>
                    <div className="text-terminal text-sm">NÍVEL ATUAL</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Activity Section */}
            <Card className="retro-box bg-card">
              <CardHeader>
                <CardTitle className="text-pixel text-retro-cyan">ATIVIDADE RECENTE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-mono text-muted-foreground">
                      Nenhuma atividade recente para mostrar...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Friends Section - Only for own profile */}
            {isOwnProfile && (
              <div className="space-y-6">
                <h2 className="text-pixel text-retro-cyan text-xl">AMIGOS</h2>
                <UserSearch />
                <FriendsList onOpenChat={openChat} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Dialog */}
      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        friendId={chatFriendId}
        friendName={chatFriendName}
      />
    </div>
  );
};

export default Profile;