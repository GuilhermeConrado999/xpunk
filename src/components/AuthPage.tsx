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
      
      {/* Minimal Side Branding - Desktop Only */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <h2 className="text-pixel text-5xl glow-text text-retro-cyan">
          XPUNK
        </h2>
      </div>
      
      {/* Main Auth Container */}
      <div className="retro-box p-8 w-full max-w-md bg-card/95 backdrop-blur-md relative z-10 border border-retro-cyan/30">
        
        {/* Minimal Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-retro-pink/80 to-retro-cyan/80 flex items-center justify-center mb-6">
            <span className="text-pixel text-xl text-white">X</span>
          </div>
          <h1 className="text-pixel text-2xl text-white/90 mb-1">
            XPUNK
          </h1>
          <div className="text-terminal text-[10px] text-white/30 tracking-widest">
            {isForgotPassword ? 'RECUPERAR ACESSO' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
          </div>
        </div>

        {isForgotPassword ? (
          /* Password Recovery Form */
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-terminal text-xs text-white/50 uppercase tracking-wider">
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="seu@email.com" 
                  className="text-mono bg-black/50 border-white/10 focus:border-retro-pink/50 focus:ring-0 text-white/90 placeholder:text-white/20" 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-retro-pink/80 to-retro-cyan/80 hover:from-retro-pink hover:to-retro-cyan text-white border-0 py-2.5"
            >
              <span className="text-mono text-sm uppercase tracking-wider">
                {loading ? 'Enviando...' : 'Enviar Email'}
              </span>
            </Button>

            <button 
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setEmail('');
              }} 
              className="w-full text-terminal text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              ← Voltar
            </button>
          </form>
        ) : (
          /* Login/Register Form - Minimal & Dark */
          <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-terminal text-xs text-white/50 uppercase tracking-wider">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="text-mono bg-black/50 border-white/10 focus:border-retro-pink/50 focus:ring-0 text-white/90 placeholder:text-white/20" />
            </div>

            {!isLogin && <div className="animate-fade-in">
                <Label htmlFor="username" className="text-terminal text-xs text-white/50 uppercase tracking-wider">
                  Username
                </Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="seu_username" className="text-mono bg-black/50 border-white/10 focus:border-retro-pink/50 focus:ring-0 text-white/90 placeholder:text-white/20" />
              </div>}

            <div>
              <Label htmlFor="password" className="text-terminal text-xs text-white/50 uppercase tracking-wider">
                Senha
              </Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="text-mono bg-black/50 border-white/10 focus:border-retro-pink/50 focus:ring-0 text-white/90 placeholder:text-white/20" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-retro-pink/80 to-retro-cyan/80 hover:from-retro-pink hover:to-retro-cyan text-white border-0 py-2.5">
            <span className="text-mono text-sm uppercase tracking-wider">
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </span>
          </Button>

          {/* Forgot Password Link */}
          {isLogin && (
            <button 
              type="button"
              onClick={() => setIsForgotPassword(true)} 
              className="w-full text-terminal text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Esqueceu a senha?
            </button>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black/80 px-4 text-white/30">ou</span>
            </div>
          </div>

          {/* Google Login Button - Darker Style */}
          <Button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-white/10 hover:bg-white/20 text-white/80 border border-white/10 flex items-center justify-center gap-3 py-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#fff" fillOpacity="0.8" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" fillOpacity="0.6" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" fillOpacity="0.4" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" fillOpacity="0.7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-mono text-sm">
              {googleLoading ? 'Conectando...' : 'Google'}
            </span>
          </Button>
        </form>
        )}

        {/* Toggle Login/Register - Minimal */}
        {!isForgotPassword && (
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-terminal text-xs text-white/40 hover:text-white/60 transition-colors">
              {isLogin ? 'Criar conta' : 'Já tenho conta'}
            </button>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="mt-8 text-center">
          <div className="text-[10px] text-white/20 text-mono">
            © 2006 XPUNK
          </div>
        </div>
      </div>
    </div>;
};
export default AuthPage;