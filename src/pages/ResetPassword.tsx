import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import cyberpunkBg from '@/assets/cyberpunk-bg.jpg';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Sessão inválida",
          description: "O link de recuperação expirou ou é inválido",
          variant: "destructive"
        });
        navigate('/');
      }
    });
  }, [navigate, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso"
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
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

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-pixel glow-text">VERIFICANDO SESSÃO...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${cyberpunkBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/30 via-transparent to-retro-cyan/30"></div>
      <div className="scanlines absolute inset-0 pointer-events-none"></div>

      {/* Main Container */}
      <div className="retro-box p-8 w-full max-w-md bg-card/95 backdrop-blur-md relative z-10 animate-fade-in shadow-2xl border border-retro-cyan/30">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-retro-pink to-retro-cyan rounded-lg flex items-center justify-center mb-4 pixel-border glow-retro">
              <span className="text-pixel text-2xl text-white">🔐</span>
            </div>
            <h1 className="text-pixel text-3xl glow-text mb-2 animate-[glow_2s_ease-in-out_infinite_alternate]">
              REDEFINIR SENHA
            </h1>
            <div className="text-terminal text-xs text-retro-cyan mb-2">
              ━━━ NOVA SENHA ━━━
            </div>
          </div>
          <p className="text-mono text-sm text-muted-foreground bg-retro-dark/50 px-4 py-2 rounded border border-retro-cyan/30">
            {'> DIGITE SUA NOVA SENHA...'}
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-4">
            <div className="group">
              <Label htmlFor="password" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                <span className="text-retro-pink">{'>'}</span> NOVA SENHA:
              </Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••••••" 
                minLength={6}
                className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-zinc-950" 
              />
            </div>

            <div className="group">
              <Label htmlFor="confirmPassword" className="text-terminal text-sm text-retro-cyan flex items-center gap-2">
                <span className="text-retro-pink">{'>'}</span> CONFIRMAR SENHA:
              </Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                placeholder="••••••••••••" 
                minLength={6}
                className="text-mono bg-retro-dark/50 border-retro-cyan/30 focus:border-retro-pink focus:ring-retro-pink/20 transition-all duration-300 bg-zinc-950" 
              />
            </div>

            <p className="text-xs text-muted-foreground text-mono">
              A senha deve ter pelo menos 6 caracteres
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full btn-retro text-lg py-3 bg-gradient-to-r from-retro-pink to-retro-cyan hover:from-retro-cyan hover:to-retro-pink transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-pixel">
              {loading ? '⌛ ATUALIZANDO...' : '✅ ATUALIZAR SENHA'}
            </span>
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-retro-cyan/20 pt-4">
          <div className="text-xs text-muted-foreground text-mono mb-2">
            <span className="text-retro-cyan">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
          </div>
          <div className="text-xs text-retro-pink text-mono">
            © 2006 XPUNK - Powered by nostalgia & cyberpunk dreams
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
