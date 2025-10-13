import VideoCard from './VideoCard';
import retroThumb1 from '@/assets/retro-game-thumb-1.png';
import retroThumb2 from '@/assets/retro-game-thumb-2.png';

// Mock data with 2000s gaming vibe
const mockVideos = [
  {
    title: "Half-Life 2 - Speedrun any% em 37:42 [WR]",
    author: "xXxGamer2006xXx",
    views: "1,337",
    duration: "37:42",
    thumbnail: retroThumb1,
    community: "Speedrun",
    uploadDate: "2 dias"
  },
  {
    title: "Counter-Strike 1.6 - AWP Ace Montage #3",
    author: "pr0_sniper_br",
    views: "666",
    duration: "4:20",
    thumbnail: retroThumb2,
    community: "Montagens",
    uploadDate: "1 semana"
  },
  {
    title: "Silent Hill 2 - Let's Play Episode 1: The Fog",
    author: "DarkEmoGamer",
    views: "2,001",
    duration: "15:30",
    thumbnail: retroThumb1,
    community: "Let's Plays",
    uploadDate: "3 dias"
  },
  {
    title: "Doom 3 - Scary Mod: Resurrection of Evil",
    author: "ModMaster666",
    views: "420",
    duration: "8:15",
    thumbnail: retroThumb2,
    community: "Mods",
    uploadDate: "5 dias"
  },
  {
    title: "Halo 2 - Machinima: Red vs Blue Tribute",
    author: "MachinimaMaker07",
    views: "3,141",
    duration: "6:66",
    thumbnail: retroThumb1,
    community: "Machinima",
    uploadDate: "1 dia"
  },
  {
    title: "World of Warcraft - Epic PvP Moments",
    author: "WoWNoob2006",
    views: "1,999",
    duration: "12:34",
    thumbnail: retroThumb2,
    community: "Let's Plays",
    uploadDate: "4 dias"
  }
];

const VideoFeed = () => {
  return (
    <section>
      {/* Feed Header */}
      <div className="retro-box p-3 mb-4 bg-secondary">
        <div className="flex items-center justify-between">
          <h2 className="text-pixel text-sm glow-text">
            ► VÍDEOS RECENTES
          </h2>
          
          <div className="flex space-x-2 text-xs">
            <button className="btn-retro">MAIS RECENTES</button>
            <button className="btn-retro">MAIS VISTOS</button>
            <button className="btn-retro">MELHOR RATED</button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {mockVideos.map((video, index) => (
          <VideoCard key={index} {...video} />
        ))}
      </div>
      
      {/* Pagination - 2000s style */}
      <div className="retro-box p-3 bg-card text-center">
        <div className="flex justify-center items-center space-x-2 text-terminal text-sm">
          <button className="btn-retro">« ANTERIOR</button>
          <span className="text-muted-foreground">
            Página <strong>1</strong> de <strong>42</strong>
          </span>
          <button className="btn-retro">PRÓXIMA »</button>
        </div>
      </div>
    </section>
  );
};

export default VideoFeed;