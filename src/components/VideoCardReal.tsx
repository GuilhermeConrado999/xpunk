import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoPlayer from './VideoPlayer';

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
  user_id: string;
  allow_download?: boolean;
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

interface VideoCardRealProps {
  video: Video;
}

const VideoCardReal = ({ video }: VideoCardRealProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    fetchRating();
  }, [video.id]);

  const fetchRating = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('video_id', video.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
        setRatingCount(data.length);
      }
    } catch (error) {
      console.error('Erro ao buscar rating:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const handleClick = () => {
    setPlayerOpen(true);
  };

  return (
    <>
      <VideoPlayer
        video={video}
        open={playerOpen}
        onOpenChange={setPlayerOpen}
      />
      
      <div 
        className="retro-box p-2 hover-glow cursor-pointer transition-all"
        onClick={handleClick}
      >
      {/* Thumbnail with scanlines */}
      <div className="relative scanlines mb-2">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-32 object-cover pixel-border"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-32 bg-muted pixel-border flex items-center justify-center">
            <span className="text-terminal text-xs">NO THUMBNAIL</span>
          </div>
        )}
        
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-xs text-terminal px-1">
          {video.duration || '0:00'}
        </div>
        
        {/* Community tag */}
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 text-mono">
          {video.community.toUpperCase()}
        </div>
      </div>

      {/* Video Info */}
      <div className="space-y-1">
        <h3 className="text-sm text-mono font-bold hover-retro truncate">
          {video.title}
        </h3>
        
        <div className="text-xs text-muted-foreground text-terminal">
          por: <span className="hover-retro">{video.profiles?.username || 'Anônimo'}</span>
        </div>
        
        <div className="flex justify-between text-xs text-terminal text-muted-foreground">
          <span>{video.views} views</span>
          <span>{formatDate(video.created_at)}</span>
        </div>
        
        {/* Rating stars */}
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-terminal">
            {ratingCount > 0 ? renderStars(averageRating) : '☆☆☆☆☆'}
          </span>
          <span className="text-muted-foreground">
            ({ratingCount})
          </span>
        </div>
      </div>
    </div>
    </>
  );
};

export default VideoCardReal;