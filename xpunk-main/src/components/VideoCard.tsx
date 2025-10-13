interface VideoCardProps {
  title: string;
  author: string;
  views: string;
  duration: string;
  thumbnail: string;
  community: string;
  uploadDate: string;
}

const VideoCard = ({ 
  title, 
  author, 
  views, 
  duration, 
  thumbnail, 
  community, 
  uploadDate 
}: VideoCardProps) => {
  return (
    <div className="retro-box p-2 hover-glow cursor-pointer transition-all">
      {/* Thumbnail with scanlines */}
      <div className="relative scanlines mb-2">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-32 object-cover pixel-border"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-xs text-terminal px-1">
          {duration}
        </div>
        
        {/* Community tag */}
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 text-mono">
          {community.toUpperCase()}
        </div>
      </div>

      {/* Video Info */}
      <div className="space-y-1">
        <h3 className="text-sm text-mono font-bold hover-retro truncate">
          {title}
        </h3>
        
        <div className="text-xs text-muted-foreground text-terminal">
          por: <span className="hover-retro">{author}</span>
        </div>
        
        <div className="flex justify-between text-xs text-terminal text-muted-foreground">
          <span>{views} views</span>
          <span>{uploadDate}</span>
        </div>
        
        {/* Retro rating stars */}
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-terminal">★★★★☆</span>
          <span className="text-muted-foreground">(42)</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;