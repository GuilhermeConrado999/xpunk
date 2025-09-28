import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="retro-box p-8 text-center bg-card">
        <div className="space-y-4">
          <h1 className="text-pixel text-4xl text-primary glow-text">404</h1>
          <div className="text-terminal text-lg">PAGE NOT FOUND</div>
          <p className="text-mono text-muted-foreground">
            Esta página não existe ou foi movida para o MySpace.
          </p>
          <div className="text-xs text-terminal text-muted-foreground">
            ERROR_CODE: 0x80004005
          </div>
          <a 
            href="/" 
            className="btn-retro inline-block mt-4"
          >
            « VOLTAR PARA HOME
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
