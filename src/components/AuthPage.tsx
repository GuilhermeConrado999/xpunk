import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao XPUNK",
        });
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
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
          description: "Verifique seu email para confirmar a conta",
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="retro-box p-6 w-full max-w-md bg-card">
        <div className="text-center mb-6">
          <h1 className="text-pixel text-2xl glow-text mb-2">
            XPUNK
          </h1>
          <p className="text-mono text-sm text-muted-foreground">
            {isLogin ? 'LOGIN NO SISTEMA' : 'CRIAR NOVA CONTA'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-terminal text-sm">
              EMAIL:
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-mono"
              placeholder="seu@email.com"
            />
          </div>

          {!isLogin && (
            <div>
              <Label htmlFor="username" className="text-terminal text-sm">
                USERNAME:
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-mono"
                placeholder="xXxGamer2006xXx"
              />
            </div>
          )}

          <div>
            <Label htmlFor="password" className="text-terminal text-sm">
              PASSWORD:
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-mono"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full btn-retro"
          >
            {loading ? 'PROCESSANDO...' : (isLogin ? 'ENTRAR' : 'CADASTRAR')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-terminal text-sm hover-retro"
          >
            {isLogin ? 'Não tem conta? Cadastre-se aqui' : 'Já tem conta? Faça login'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="text-xs text-muted-foreground text-mono">
            © 2006 XPUNK - Powered by nostalgia
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;