import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  user_id: string;
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  is_creator: boolean;
}

interface CommunityMembersListProps {
  communityId: string;
  creatorId: string;
}

const CommunityMembersList = ({ communityId, creatorId }: CommunityMembersListProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('community_members')
        .select('user_id, joined_at')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url, bio')
            .eq('user_id', member.user_id)
            .single();

          return {
            ...member,
            profile,
            is_creator: member.user_id === creatorId
          };
        })
      );

      // Sort: creator first, then by join date
      const sorted = membersWithProfiles.sort((a, b) => {
        if (a.is_creator) return -1;
        if (b.is_creator) return 1;
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      });

      setMembers(sorted);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="retro-box bg-card/80 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-retro-purple" />
          <h3 className="text-pixel text-sm">MEMBROS</h3>
        </div>
        <p className="text-terminal text-xs text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="retro-box bg-card/80 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-retro-purple" />
        <h3 className="text-pixel text-sm">MEMBROS — {members.length}</h3>
      </div>

      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.user_id}
              onClick={() => handleMemberClick(member.user_id)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors group"
            >
              <div className="relative">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={member.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-retro-purple/20 text-retro-purple text-xs">
                    {member.profile?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator (decorative) */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-terminal text-sm truncate group-hover:text-retro-cyan transition-colors">
                    {member.profile?.display_name || member.profile?.username || 'Anônimo'}
                  </span>
                  {member.is_creator && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                {member.profile?.bio && (
                  <p className="text-xs text-muted-foreground truncate">
                    {member.profile.bio}
                  </p>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-terminal text-xs text-muted-foreground text-center py-4">
              Nenhum membro ainda
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunityMembersList;
