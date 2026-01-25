import { useNavigate } from 'react-router-dom';
import RetroHeader from '@/components/RetroHeader';
import CommunitySection from '@/components/CommunitySection';
import VideoFeedReal from '@/components/VideoFeedReal';
import SidebarStatsReal from '@/components/SidebarStatsReal';
import emoGamerHero from '@/assets/emo-gamer-hero.png';
const Index = () => {
  const navigate = useNavigate();
  
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <RetroHeader />
      
      <div className="container mx-auto px-4">
        {/* Hero Banner */}
        <section className="retro-box p-6 mb-6 bg-card scanlines relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-4">
              <h1 className="text-pixel text-2xl lg:text-3xl glow-text text-retro-purple">
                XPUNK
              </h1>
              <p className="text-mono text-sm lg:text-base text-muted-foreground max-w-2xl">Bem-vindo ao XPUNK — um lugar para comunidades que compartilham a paixão por videogames, mods e aquelas cenas underground que marcaram uma geração de pessoas e ainda não tem seu lugar guardadinho! Faça upload, junte-se a uma comunidade e compartilhe suas recordações pixeladas.</p>
              <div className="flex space-x-3">
                <button className="btn-retro" onClick={() => navigate('/upload')}>FAZER UPLOAD</button>
                <button className="btn-retro" onClick={() => document.getElementById('video-feed')?.scrollIntoView({ behavior: 'smooth' })}>EXPLORAR VÍDEOS</button>
              </div>
            </div>
            
            <div className="hidden lg:block flex-shrink-0 ml-6">
              <img src={emoGamerHero} alt="Emo Gamer 2006" className="w-64 h-48 object-cover pixel-border scanlines" style={{
              imageRendering: 'pixelated'
            }} />
            </div>
          </div>
          
          {/* Scrolling text overlay */}
          <div className="absolute bottom-2 left-0 right-0 overflow-hidden">
            <div className="marquee-text text-xs text-terminal text-primary">★ Mods clássicos ★ Speedruns épicos ★ Let's Plays nostálgicos ★ Machinima underground ★</div>
          </div>
        </section>

        {/* Communities Section */}
        <CommunitySection />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Feed - Main Content */}
          <div className="lg:col-span-3">
            <VideoFeedReal />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarStatsReal />
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
            
            <div className="text-xs text-muted-foreground text-mono">© 2025 XPUNK - Powered by Los Conrados</div>
            
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
    </div>;
};
export default Index;