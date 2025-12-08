import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import retroLogoBanner from '@/assets/retro-logo-banner.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { NotificationsPopover } from './NotificationsPopover';

// Gera ou recupera um ID único para o visitante
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('xpunk_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('xpunk_visitor_id', visitorId);
  }
  return visitorId;
};

const RetroHeader = () => {
  const {
    user,
    signOut
  } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [notificationCount, setNotificationCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  // Update time every second for that authentic 2000s feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Registrar visita e buscar contagem total
  useEffect(() => {
    const trackVisit = async () => {
      const visitorId = getVisitorId();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const sessionKey = `xpunk_visited_${today}`;

      // Só registra uma visita por dia por visitante
      if (!sessionStorage.getItem(sessionKey)) {
        await supabase
          .from('site_visits')
          .insert({ visitor_id: visitorId, page_path: window.location.pathname });
        sessionStorage.setItem(sessionKey, 'true');
      }

      // Buscar contagem total de visitantes únicos
      const { count } = await supabase
        .from('site_visits')
        .select('visitor_id', { count: 'exact', head: true });

      setVisitorCount(count || 0);
    };

    trackVisit();
  }, []);

  // Fetch and listen to notifications
  const fetchNotifications = async () => {
    if (!user) return;

    // Count pending friend requests
    const {
      data: friendRequests
    } = await supabase.from('friendships').select('id').eq('friend_id', user.id).eq('status', 'pending');

    // Count unread messages
    const {
      data: unreadMessages
    } = await supabase.from('messages').select('id').eq('receiver_id', user.id).eq('read', false);
    const total = (friendRequests?.length || 0) + (unreadMessages?.length || 0);
    setNotificationCount(total);
  };
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Listen to new friend requests
    const friendshipsChannel = supabase.channel('friendships-notifications').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friendships',
      filter: `friend_id=eq.${user.id}`
    }, () => fetchNotifications()).subscribe();

    // Listen to new messages
    const messagesChannel = supabase.channel('messages-notifications').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${user.id}`
    }, () => fetchNotifications()).subscribe();
    return () => {
      supabase.removeChannel(friendshipsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);
  return <header className="retro-box border-b-2 border-primary mb-4">
      {/* Top Banner with Logo */}
      <div className="bg-card p-4 scanlines">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={retroLogoBanner} alt="RetroGameShare Logo" className="h-12" />
            <div className="text-terminal">
              <div className="text-lg glow-text">XPUNK</div>
              <div className="text-xs text-muted-foreground">Venha conhecer algo novo!</div>
            </div>
          </div>
          
          {/* Old school visitor counter */}
          <div className="text-right space-y-1">
            <div className="visitor-counter">
              VISITORS: <span className="blink">{visitorCount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-terminal text-muted-foreground">
              {currentTime}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-secondary p-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 items-center">
            <Link to="/">
              <Button variant="ghost" className="btn-retro text-xs">
                HOME
              </Button>
            </Link>
            {user && <>
                <Link to="/upload">
                  <Button variant="ghost" className="btn-retro text-xs">
                    UPLOAD
                  </Button>
                </Link>
                <Link to="/communities">
                  <Button variant="ghost" className="btn-retro text-xs">
                    COMUNIDADES
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="btn-retro text-xs">
                    PERFIL
                  </Button>
                </Link>
                <Link to="/forum">
                  <Button variant="ghost" className="btn-retro text-xs">
                    FÓRUM
                  </Button>
                </Link>
                
                {/* Notifications Popover */}
                <NotificationsPopover notificationCount={notificationCount} onNotificationChange={fetchNotifications} />
              </>}
            {!user && <Link to="/forum">
                <Button variant="ghost" className="btn-retro text-xs">
                  FÓRUM
                </Button>
              </Link>}
          </div>
          
          <div className="flex space-x-2">
            {user ? <Button onClick={signOut} className="btn-retro text-xs">
                LOGOUT
              </Button> : <Link to="/auth">
                <Button className="btn-retro text-xs">
                  LOGIN / CADASTRO
                </Button>
              </Link>}
          </div>
        </div>
      </nav>

      {/* Marquee News Ticker */}
      <div className="bg-primary text-primary-foreground p-1 overflow-hidden">
        <div className="marquee-text text-xs text-terminal">
          ★ NOVO: Site já disponivel e configurado para uso! CRIE SUA COMUNIDADE ★
        </div>
      </div>
    </header>;
};
export default RetroHeader;