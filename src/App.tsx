import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/AuthPage";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Communities from "./pages/Communities";
import CommunityView from "./pages/CommunityView";
import Forum from "./pages/Forum";
import ForumPost from "./pages/ForumPost";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-pixel glow-text">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes */}
        {user ? (
          <>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/community/:id" element={<CommunityView />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/post/:postId" element={<ForumPost />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="*" element={<NotFound />} />
          </>
        ) : (
          <Route path="*" element={<AuthPage onAuthSuccess={() => window.location.reload()} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
