import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import cyberpunkBg from '@/assets/cyberpunk-bg.jpg';
interface AuthPageProps {
  onAuthSuccess: () => void;
}
const AuthPage = ({
  onAuthSuccess
}: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao XPUNK"
        });
        onAuthSuccess();
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username || email.split('@')[0],
              display_name: username || email.split('@')[0]
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar a conta"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{
    backgroundImage: `url(${cyberpunkBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/30 via-transparent to-retro-cyan/30"></div>
      <div className="scanlines absolute inset-0 pointer-events-none"></div>
      
      {/* Hero Text - Left Side */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block max-w-md">
        <div className="text-left space-y-4">
          <h2 className="text-pixel text-4xl glow-text text-retro-cyan animate-[glow_3s_ease-in-out_infinite_alternate]">
            XPUNK
          </h2>
          <h3 className="text-terminal text-xl text-retro-pink">
            O FUTURO É AGORA
          </h3>
          <div className="space-y-2 text-mono text-sm text-white/90 leading-relaxed">
            <p className="border-l-2 border-retro-cyan pl-4">
              🌐 Entre na matrix dos vídeos underground
            </p>
            <p className="border-l-2 border-retro-pink pl-4">
              🎮 Descubra conteúdo que não existe em lugar nenhum
            </p>
            <p className="border-l-2 border-retro-cyan pl-4">
              💾 Nostalgia pura dos anos 2000
            </p>
            <p className="border-l-2 border-retro-pink pl-4">
              🚀 Comunidade cyberpunk brasileira
            </p>
          </div>
          <div className="text-terminal text-xs text-retro-cyan/70 mt-6">
            <div className="animate-pulse">
              ► CONECTANDO AO SERVIDOR...
            </div>
            <div className="mt-1">
              ► STATUS: ONLINE
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Auth Container */}
      <div className="retro-box p-8 w-full max-w-md bg-card/95 backdrop-blur-md relative z-10 animate-fade-in shadow-2xl border border-retro-cyan/30">
        {/* Mobile Hero Text */}
        <div className="text-center mb-6 lg:hidden">
          <div className="text-mono text-xs text-retro-cyan space-y-1">
            <p>🌐 O futuro dos vídeos underground</p>
            <p>💾 Nostalgia cyberpunk brasileira</p>
          </div>
        </div>
        
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-retro-pink to-retro-cyan rounded-lg flex items-center justify-center mb-4 pixel-border glow-retro">
              <span className="text-pixel text-2xl text-white">X</span>
            </div>
            <h1 className="text-pixel text-3xl glow-text mb-2 animate-[glow_2s_ease-in-out_infinite_alternate]">
              XPUNK
            </h1>
            <div className="text-terminal text-xs text-retro-cyan mb-2">
              ━━━ SISTEMA DE ACESSO ━━━
            </div>
          </div>
          <p className="text-mono text-sm text-muted-foreground bg-retro-dark/50 px-4 py-2 rounded border border-retro-cyan/30">
            {isLogin ? '> INICIANDO SESSÃO...' : '> REGISTRANDO NOVO USER...'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="group">
              <Label htmlFor="email" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                <span className="text-retro-pink">{'>'}</span> EMAIL:
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@cyberpunk.net" className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-zinc-950" />
            </div>

            {!isLogin && <div className="group animate-fade-in">
                <Label htmlFor="username" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                  <span className="text-retro-pink">{'>'}</span> USERNAME:
                </Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300" placeholder="xXxCyberGamer2006xXx" />
              </div>}

            <div className="group">
              <Label htmlFor="password" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                <span className="text-retro-pink">{'>'}</span> PASSWORD:
              </Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••••" className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-gray-950" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full btn-retro text-lg py-3 bg-gradient-to-r from-retro-pink to-retro-cyan hover:from-retro-cyan hover:to-retro-pink transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="text-pixel">
              {loading ? '⌛ PROCESSANDO...' : isLogin ? '🚀 ENTRAR NO XPUNK' : '✨ CRIAR CONTA'}
            </span>
          </Button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-retro-cyan/50 to-transparent mb-4"></div>
          <button onClick={() => setIsLogin(!isLogin)} className="text-terminal text-sm hover-retro transition-all duration-300 px-4 py-2 border border-retro-cyan/30 rounded hover:border-retro-pink hover:bg-retro-pink/10">
            <span className="text-retro-cyan">
              {isLogin ? '📝 Não tem conta? Cadastre-se aqui' : '🔑 Já tem conta? Faça login'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-retro-cyan/20 pt-4">
          <div className="text-xs text-muted-foreground text-mono mb-2">
            <span className="text-retro-cyan">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
          </div>
          <div className="text-xs text-retro-pink text-mono">
            © 2006 XPUNK - Powered by nostalgia & cyberpunk dreams
          </div>
          <div className="text-xs text-retro-cyan text-mono mt-1">
            🌐 System.Version.2006.Build.1337
          </div>
        </div>
      </div>
    </div>;
};
export default AuthPage;