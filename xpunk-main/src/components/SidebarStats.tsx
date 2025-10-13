import { useState, useEffect } from 'react';

const SidebarStats = () => {
  const [onlineUsers, setOnlineUsers] = useState(42);
  
  // Simulate fluctuating online count (very 2000s)
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="space-y-4">
      {/* Online Users */}
      <div className="retro-box p-3 bg-secondary">
        <h3 className="text-pixel text-xs mb-2 text-terminal-green">
          ► USUÁRIOS ONLINE
        </h3>
        <div className="space-y-1 text-xs text-terminal">
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="text-terminal-green blink">{onlineUsers}</span>
          </div>
          <div className="flex justify-between">
            <span>Membros:</span>
            <span>{Math.floor(onlineUsers * 0.7)}</span>
          </div>
          <div className="flex justify-between">
            <span>Visitantes:</span>
            <span>{Math.floor(onlineUsers * 0.3)}</span>
          </div>
        </div>
      </div>

      {/* Top Uploaders */}
      <div className="retro-box p-3 bg-secondary">
        <h3 className="text-pixel text-xs mb-2 text-primary">
          ► TOP UPLOADERS
        </h3>
        <div className="space-y-1 text-xs text-terminal">
          <div className="flex justify-between">
            <span className="hover-retro">xXxGamer2006xXx</span>
            <span className="text-terminal-green">1337</span>
          </div>
          <div className="flex justify-between">
            <span className="hover-retro">pr0_sniper_br</span>
            <span className="text-terminal-green">666</span>
          </div>
          <div className="flex justify-between">
            <span className="hover-retro">DarkEmoGamer</span>
            <span className="text-terminal-green">420</span>
          </div>
          <div className="flex justify-between">
            <span className="hover-retro">ModMaster666</span>
            <span className="text-terminal-green">222</span>
          </div>
        </div>
      </div>

      {/* Site Stats */}
      <div className="retro-box p-3 bg-secondary">
        <h3 className="text-pixel text-xs mb-2 text-accent">
          ► ESTATÍSTICAS
        </h3>
        <div className="space-y-1 text-xs text-terminal">
          <div>Vídeos: <strong>13,370</strong></div>
          <div>Usuários: <strong>2,006</strong></div> 
          <div>Downloads: <strong>666,420</strong></div>
          <div>Comentários: <strong>80,085</strong></div>
        </div>
      </div>

      {/* Featured Community */}
      <div className="retro-box p-3 bg-card border-primary border-2">
        <h3 className="text-pixel text-xs mb-2 glow-text">
          ► DESTAQUE DO MÊS
        </h3>
        <div className="text-center space-y-2">
          <div className="text-2xl">🏆</div>
          <div className="text-xs text-terminal">
            <strong>SPEEDRUN CHALLENGE</strong>
          </div>
          <div className="text-xs text-muted-foreground">
            Bata o recorde mundial de Half-Life 2 e ganhe um perfil destacado!
          </div>
          <button className="btn-retro w-full text-xs mt-2">
            PARTICIPAR
          </button>
        </div>
      </div>

      {/* Retro Advertisement */}
      <div className="retro-box p-3 bg-accent text-accent-foreground text-center">
        <div className="text-xs text-terminal space-y-1">
          <div className="blink">░▒▓ FREE HOSTING ▓▒░</div>
          <div>GeoCities Alternative</div>
          <div>www.retro-host.tk</div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarStats;