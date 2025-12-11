import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, X, Reply, MoreVertical, Image, Mic, Square, Play, Pause } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  deleted_for?: string[];
  reply_to?: string | null;
  media_url?: string | null;
  media_type?: string | null;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  friendId,
  friendName,
  friendAvatar
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      markMessagesAsRead();

      const messagesChannel = supabase
        .channel(`chat-messages-${user.id}-${friendId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as Message;
            
            const isRelevant = 
              (newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
              (newMessage.sender_id === friendId && newMessage.receiver_id === user.id);
            
            if (isRelevant && !newMessage.deleted_for?.includes(user.id)) {
              setMessages((prev) => {
                if (prev.some(m => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
              
              if (newMessage.sender_id === friendId) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe();

      const presenceChannel = supabase
        .channel(`chat-presence-${user.id}-${friendId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const presences = Object.values(state).flat() as any[];
          const friendPresence = presences.find((p: any) => p.user_id === friendId);
          setIsTyping(friendPresence?.typing || false);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              typing: false,
              online_at: new Date().toISOString()
            });
          }
        });

      channelRef.current = presenceChannel;

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(presenceChannel);
      };
    }
  }, [open, user, friendId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const filteredMessages = data.filter(msg => {
        const deletedFor = msg.deleted_for || [];
        return !deletedFor.includes(user.id);
      });
      setMessages(filteredMessages);
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const deletedFor = message.deleted_for || [];
    if (!deletedFor.includes(user.id)) {
      deletedFor.push(user.id);
    }

    const { error } = await supabase
      .from('messages')
      .update({ deleted_for: deletedFor })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  const deleteAllMessagesForMe = async () => {
    if (!user) return;

    const messageIds = messages.map(m => m.id);
    
    if (messageIds.length === 0) return;

    for (const messageId of messageIds) {
      const { data: currentMessage } = await supabase
        .from('messages')
        .select('deleted_for')
        .eq('id', messageId)
        .single();

      if (currentMessage) {
        const deletedFor = currentMessage.deleted_for || [];
        if (!deletedFor.includes(user.id)) {
          deletedFor.push(user.id);
          
          await supabase
            .from('messages')
            .update({ deleted_for: deletedFor })
            .eq('id', messageId);
        }
      }
    }

    setMessages([]);
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const handleTyping = async () => {
    if (!channelRef.current || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      user_id: user.id,
      typing: true,
      online_at: new Date().toISOString()
    });

    typingTimeoutRef.current = setTimeout(async () => {
      await channelRef.current?.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString()
      });
    }, 2000);
  };

  const uploadMedia = async (file: File): Promise<{ url: string; type: string } | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Erro ao enviar arquivo');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    let mediaType = 'file';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.type.startsWith('audio/')) {
      mediaType = 'audio';
    }

    return { url: publicUrl, type: mediaType };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 50MB)');
      return;
    }

    setUploadingMedia(true);

    const mediaResult = await uploadMedia(file);
    if (mediaResult) {
      await sendMediaMessage(mediaResult.url, mediaResult.type);
    }

    setUploadingMedia(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setUploadingMedia(true);
        const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        const mediaResult = await uploadMedia(file);
        
        if (mediaResult) {
          await sendMediaMessage(mediaResult.url, 'audio');
        }
        
        setUploadingMedia(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendMediaMessage = async (mediaUrl: string, mediaType: string) => {
    if (!user) return;

    if (channelRef.current) {
      await channelRef.current.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: mediaType === 'audio' ? '🎤 Mensagem de voz' : mediaType === 'image' ? '📷 Imagem' : '🎬 Vídeo',
        media_url: mediaUrl,
        media_type: mediaType,
        reply_to: replyingTo?.id || null
      });

    if (!error) {
      setReplyingTo(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return;

    setLoading(true);

    if (channelRef.current) {
      await channelRef.current.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: newMessage.trim(),
        reply_to: replyingTo?.id || null
      });

    if (!error) {
      setNewMessage('');
      setReplyingTo(null);
    }

    setLoading(false);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-box bg-card max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-pixel text-retro-cyan flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={friendAvatar} />
                <AvatarFallback className="bg-retro-purple text-white">
                  {friendName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              CHAT COM {friendName.toUpperCase()}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 hover:bg-retro-cyan/20"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-retro-cyan/50">
                <DropdownMenuItem 
                  onClick={deleteAllMessagesForMe}
                  className="text-destructive hover:bg-destructive/20 cursor-pointer"
                >
                  Apagar todas as mensagens
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isSentByMe = message.sender_id === user?.id;
              const repliedMessage = message.reply_to 
                ? messages.find(m => m.id === message.reply_to)
                : null;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg relative ${
                      isSentByMe
                        ? 'bg-retro-cyan/20 border border-retro-cyan/50'
                        : 'bg-retro-purple/20 border border-retro-purple/50'
                    }`}
                  >
                    {repliedMessage && (
                      <div className="mb-2 p-2 rounded bg-background/30 border-l-2 border-retro-cyan">
                        <p className="text-xs text-muted-foreground">
                          Respondendo a:
                        </p>
                        <p className="text-xs text-mono opacity-70 truncate">
                          {repliedMessage.content}
                        </p>
                      </div>
                    )}
                    
                    {/* Media content */}
                    {message.media_url && message.media_type === 'image' && (
                      <img 
                        src={message.media_url} 
                        alt="Imagem" 
                        className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.media_url!, '_blank')}
                      />
                    )}
                    
                    {message.media_url && message.media_type === 'video' && (
                      <video 
                        src={message.media_url} 
                        controls 
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    
                    {message.media_url && message.media_type === 'audio' && (
                      <AudioPlayer src={message.media_url} />
                    )}
                    
                    {/* Text content - hide default text for media messages */}
                    {(!message.media_url || (message.media_type !== 'image' && message.media_type !== 'video' && message.media_type !== 'audio')) && (
                      <p className="text-mono text-sm">{message.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </p>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 hover:bg-retro-cyan/30 rounded transition-colors"
                          title="Responder"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteMessageForMe(message.id)}
                          className="p-1 hover:bg-destructive/30 rounded transition-colors"
                          title="Deletar para mim"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start items-center gap-2">
                <div className="max-w-[70%] p-3 rounded-lg bg-retro-purple/20 border border-retro-purple/50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-retro-purple" />
                  <p className="text-mono text-sm text-muted-foreground">
                    {friendName} está digitando...
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border">
          {replyingTo && (
            <div className="p-3 bg-retro-cyan/10 border-b border-retro-cyan/30 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Respondendo a:</p>
                <p className="text-sm text-mono truncate">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-retro-cyan/30 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Recording UI */}
          {isRecording ? (
            <div className="flex items-center gap-3 p-4 bg-red-500/10">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-mono text-red-500 font-semibold">
                  {formatRecordingTime(recordingTime)}
                </span>
                <span className="text-muted-foreground text-sm">Gravando...</span>
              </div>
              <Button
                onClick={cancelRecording}
                variant="ghost"
                size="icon"
                className="hover:bg-red-500/20 text-red-500"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="icon"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia || loading}
                className="hover:bg-retro-cyan/20"
                title="Enviar imagem ou vídeo"
              >
                {uploadingMedia ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={startRecording}
                disabled={uploadingMedia || loading}
                className="hover:bg-retro-cyan/20"
                title="Gravar mensagem de voz"
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="input-retro"
                disabled={loading || uploadingMedia}
                autoFocus
              />
              <Button
                onClick={sendMessage}
                className="btn-retro"
                disabled={loading || !newMessage.trim() || uploadingMedia}
              >
                ENVIAR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Audio Player Component
const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-background/30 rounded-lg min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-retro-cyan/30 hover:bg-retro-cyan/50 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-retro-cyan"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;