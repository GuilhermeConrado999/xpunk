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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    toast
  } = useToast();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  };

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha"
      });
      
      setIsForgotPassword(false);
      setEmail('');
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
            {isForgotPassword ? '> RECUPERANDO SENHA...' : isLogin ? '> INICIANDO SESSÃO...' : '> REGISTRANDO NOVO USER...'}
          </p>
        </div>

        {isForgotPassword ? (
          /* Password Recovery Form */
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <Label htmlFor="email" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                  <span className="text-retro-pink">{'>'}</span> EMAIL:
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="user@cyberpunk.net" 
                  className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-zinc-950" 
                />
              </div>
              <p className="text-xs text-muted-foreground text-mono">
                Digite seu email para receber as instruções de recuperação de senha
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full btn-retro text-lg py-3 bg-gradient-to-r from-retro-pink to-retro-cyan hover:from-retro-cyan hover:to-retro-pink transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-pixel">
                {loading ? '⌛ ENVIANDO...' : '📧 ENVIAR EMAIL DE RECUPERAÇÃO'}
              </span>
            </Button>

            <button 
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setEmail('');
              }} 
              className="w-full text-terminal text-sm hover-retro transition-all duration-300 px-4 py-2 border border-retro-cyan/30 rounded hover:border-retro-pink hover:bg-retro-pink/10"
            >
              <span className="text-retro-cyan">
                ← Voltar para o login
              </span>
            </button>
          </form>
        ) : (
          /* Login/Register Form */
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
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="xXxCyberGamer2006xXx" className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-gray-950" />
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

          {/* Forgot Password Link - Only show on login */}
          {isLogin && (
            <button 
              type="button"
              onClick={() => setIsForgotPassword(true)} 
              className="w-full text-terminal text-xs hover-retro transition-all duration-300 text-retro-cyan hover:text-retro-pink"
            >
            🔐 Esqueceu sua senha?
            </button>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-retro-cyan/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-4 text-mono text-muted-foreground">ou continue com</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-mono font-medium">
              {googleLoading ? 'Conectando...' : 'Entrar com Google'}
            </span>
          </Button>
        </form>
        )}

        {/* Toggle Login/Register - Only show when not in forgot password mode */}
        {!isForgotPassword && (
          <div className="mt-8 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-retro-cyan/50 to-transparent mb-4"></div>
            <button onClick={() => setIsLogin(!isLogin)} className="text-terminal text-sm hover-retro transition-all duration-300 px-4 py-2 border border-retro-cyan/30 rounded hover:border-retro-pink hover:bg-retro-pink/10">
              <span className="text-retro-cyan">
                {isLogin ? '📝 Não tem conta? Cadastre-se aqui' : '🔑 Já tem conta? Faça login'}
              </span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center border-t border-retro-cyan/20 pt-4">
          <div className="text-xs text-muted-foreground text-mono mb-2">
            <span className="text-retro-cyan">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
          </div>
          <div className="text-xs text-retro-pink text-mono">
            © 2006 XPUNK - Powered by nostalgia & cyberpunk dreams
          </div>
          <div className="text-xs text-retro-cyan text-mono mt-1">🌐 System.Version.2025</div>
        </div>
      </div>
    </div>;
};
export default AuthPage;