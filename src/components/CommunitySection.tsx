import { Button } from '@/components/ui/button';

interface Community {
  name: string;
  icon: string;
  memberCount: number;
  description: string;
  color: string;
}

const communities: Community[] = [
  {
    name: "SPEEDRUN",
    icon: "⚡",
    memberCount: 1337,
    description: "records e glitches épicos",
    color: "terminal-green"
  },
  {
    name: "MACHINIMA", 
    icon: "🎬",
    memberCount: 666,
    description: "filmes feitos em games",
    color: "burgundy"
  },
  {
    name: "MODS",
    icon: "⚙️", 
    memberCount: 2001,
    description: "modificações e total conversions",
    color: "purple"
  },
  {
    name: "LET'S PLAYS",
    icon: "🎮",
    memberCount: 420,
    description: "gameplay com comentários",
    color: "warning-red"
  }
];

const CommunitySection = () => {
  return (
    <section className="retro-box p-4 mb-6">
      <h2 className="text-pixel text-lg mb-4 glow-text">
        ► COMUNIDADES
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {communities.map((community) => (
          <div 
            key={community.name}
            className="retro-box p-3 bg-secondary hover-glow cursor-pointer transition-all"
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">{community.icon}</div>
              
              <h3 className="text-terminal text-sm font-bold">
                {community.name}
              </h3>
              
              <div className="text-xs text-muted-foreground text-mono">
                {community.description}
              </div>
              
              <div className={`text-xs text-terminal font-bold ${
                community.color === 'terminal-green' ? 'text-green-400' :
                community.color === 'burgundy' ? 'text-red-600' :
                community.color === 'purple' ? 'text-purple-400' :
                'text-red-500'
              }`}>
                {community.memberCount} MEMBROS
              </div>
              
              <Button className="btn-retro w-full text-xs mt-2">
                ENTRAR
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Old school forum-style stats */}
      <div className="mt-4 p-2 bg-card border-t border-border">
        <div className="flex justify-between text-xs text-terminal text-muted-foreground">
          <span>TOTAL DE VÍDEOS: <strong>13,370</strong></span>
          <span>USUÁRIOS ONLINE: <strong className="text-terminal-green">42</strong></span>
          <span>ÚLTIMO UPLOAD: <strong>2 min atrás</strong></span>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;