import RetroHeader from '@/components/RetroHeader';
import CommunitySection from '@/components/CommunitySection';
import VideoFeed from '@/components/VideoFeed';
import SidebarStats from '@/components/SidebarStats';
import emoGamerHero from '@/assets/emo-gamer-hero.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <RetroHeader />
      
      <div className="container mx-auto px-4">
        {/* Hero Banner */}
        <section className="retro-box p-6 mb-6 bg-card scanlines relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-4">
              <h1 className="text-pixel text-2xl lg:text-3xl glow-text">
                RETROGAMESHARE
              </h1>
              <p className="text-mono text-sm lg:text-base text-muted-foreground max-w-2xl">
                Bem-vindo ao RetroGameShare — um lugar para comunidades que compartilham 
                a paixão por videogames, mods e aquelas cenas emo que marcaram os anos 2000. 
                Faça upload, junte-se a uma comunidade e compartilhe suas recordações pixeladas.
              </p>
              <div className="flex space-x-3">
                <button className="btn-retro">FAZER UPLOAD</button>
                <button className="btn-retro">EXPLORAR VÍDEOS</button>
              </div>
            </div>
            
            <div className="hidden lg:block flex-shrink-0 ml-6">
              <img 
                src={emoGamerHero} 
                alt="Emo Gamer 2006" 
                className="w-64 h-48 object-cover pixel-border scanlines"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
          
          {/* Scrolling text overlay */}
          <div className="absolute bottom-2 left-0 right-0 overflow-hidden">
            <div className="marquee-text text-xs text-terminal text-primary">
              ★ Nostalgia dos anos 2000 ★ Mods clássicos ★ Speedruns épicos ★ 
              Let's Plays nostálgicos ★ Machinima underground ★
            </div>
          </div>
        </section>

        {/* Communities Section */}
        <CommunitySection />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Feed - Main Content */}
          <div className="lg:col-span-3">
            <VideoFeed />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarStats />
          </div>
        </div>

        {/* Footer */}
        <footer className="retro-box p-4 mt-8 bg-secondary text-center">
          <div className="space-y-2">
            <div className="flex justify-center space-x-4 text-xs text-terminal">
              <a href="#" className="hover-retro">SOBRE</a>
              <a href="#" className="hover-retro">FAQ</a>
              <a href="#" className="hover-retro">GUESTBOOK</a>
              <a href="#" className="hover-retro">CONTATO</a>
              <a href="#" className="hover-retro">RSS</a>
            </div>
            
            <div className="text-xs text-muted-foreground text-mono">
              © 2006 RetroGameShare - Powered by nostalgia and emo vibes
            </div>
            
            <div className="text-xs text-terminal">
              <span className="blink">★</span> Site otimizado para Internet Explorer 6.0 
              <span className="blink">★</span>
            </div>
            
            {/* Web rings style links */}
            <div className="flex justify-center space-x-2 text-xs pt-2">
              <div className="visitor-counter">
                <span className="text-terminal-green">WEB RING</span>
              </div>
              <div className="visitor-counter">
                <span className="text-accent">MEMBER SITE</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
