// StudyRoom.tsx (modified)
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
// replace VideoPlayer import with RoomVideoPlayer
// import VideoPlayer from "@/components/VideoPlayer";
import RoomVideoPlayer from "@/components/RoomVideoPlayer";
import CollaborationPanel from "@/components/CollaborationPanel";
import PauseOverlay from "@/components/PauseOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useAuth } from "@/hooks/use-auth"; // add this import to get current user
import useRoomRealtime from "@/hooks/useRoomRealtime";
import { supabase } from '@/lib/supabaseClient';
import VoiceWidget from "@/components/VoiceWidget";

const youtubeUrlSchema = z.string().trim().regex(
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]{11}(\S*)?$/,
  { message: "Please enter a valid YouTube URL" }
);

const StudyRoom = () => {
  const { roomId } = useParams();
  const numericRoomId = Number(roomId);
  const { toast } = useToast();
  const { user } = useAuth(); // get user (so we can tell server who updated playback)
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "chat" | "ai" | "whiteboard">("comments");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);
  const { room: realtimeRoom, loading: roomLoading, error: roomError } = useRoomRealtime(roomId);
  const [roomTitle, setRoomTitle] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadRoomTitle() {
      if (!numericRoomId || Number.isNaN(numericRoomId)) return;

      const { data, error } = await supabase
        .from("rooms")
        .select("title")
        .eq("id", numericRoomId)
        .single();

      if (error) {
        console.error("loadRoomTitle error:", error);
        if (!cancelled) {
          toast({
            title: "Could not load room",
            description: error.message ?? "Failed to fetch room title",
            variant: "destructive",
          });
        }
        return;
      }

      if (!cancelled) setRoomTitle(data?.title ?? "");
    }

    loadRoomTitle();
    return () => { cancelled = true; };
  }, [numericRoomId, toast]);

  // update youtubeUrl when rooms.video_url changes
  useEffect(() => {
    if (!realtimeRoom) {
      // optional: clear youtubeUrl if room deleted / no video
      // setYoutubeUrl("");
      return;
    }
    const v = realtimeRoom.video_url;
    if (v && String(v).trim().length > 0) {
      const trimmed = String(v).trim();
      // only update if changed (avoid useless re-renders)
      setYoutubeUrl((prev) => (prev !== trimmed ? trimmed : prev));
      setUrlInput(trimmed); // optional: keep input in sync
    } else {
      // if you want to clear when db has null:
      // setYoutubeUrl("");
    }
  }, [realtimeRoom?.video_url]);

  const handleMenuToggle = () => {
    setShowPauseMenu(!showPauseMenu);
  };

  const handleAskDoubt = () => {
    setActiveTab("chat");
    setShowPauseMenu(false);
  };

  const handleAskAI = () => {
    setActiveTab("ai");
    setShowPauseMenu(false);
  };

  const handleOpenBoard = () => {
    setActiveTab("whiteboard");
    setShowPauseMenu(false);
  };

  // POST/ PATCH room video_url to backend and update local state
  const handleLoadVideo = async () => {
    try {
      youtubeUrlSchema.parse(urlInput);

      if (!roomId) {
        toast({ title: 'Missing room id', description: 'Cannot associate video with room', variant: 'destructive' });
        return;
      }

      // call backend to update room.video_url
      const token = localStorage.getItem('token'); // or pull from context if you have it
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ video_url: urlInput.trim() }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const errMsg = body?.error || body?.message || `Failed to update room (${res.status})`;
        toast({ title: 'Could not load video', description: errMsg, variant: 'destructive' });
        return;
      }

      // success: backend returns updated room (room.video_url) — set state so player loads it
      const updatedRoom = body?.room;
      setYoutubeUrl(updatedRoom?.video_url ?? urlInput.trim());

      // also reset playback seek (optional) — when you change video, it's sensible to reset playback
      setSeekToTime(0);

      toast({
        title: 'Video loaded',
        description: 'YouTube video has been saved to this room and loaded.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid URL",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
      console.error("handleLoadVideo error", error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rooms
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{roomTitle || "Study Room"}</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <ResizablePanelGroup direction="horizontal" className="gap-6">
          {/* Video Player Section */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col gap-4"
            >
              <div className="relative">
                {/* --- REPLACED: use RoomVideoPlayer here --- */}
                <RoomVideoPlayer
                  roomId={roomId}
                  youtubeUrl={youtubeUrl}                // <- pass the live value (not only initial)
                  userId={user?.id ?? null}
                  onMenuToggle={handleMenuToggle}
                  onTimeUpdate={setCurrentVideoTime}
                  seekToTime={seekToTime}
                  onSeekComplete={() => setSeekToTime(null)}
                />


                <AnimatePresence>
                  {showPauseMenu && (
                    <PauseOverlay
                      onAskDoubt={handleAskDoubt}
                      onAskAI={handleAskAI}
                      onOpenBoard={handleOpenBoard}
                      onClose={() => setShowPauseMenu(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
              <VoiceWidget
                roomId={roomId!}
                identity={user?.id || user?.username || `guest-${Date.now()}`}
              />

              {/* YouTube URL Input */}
              <div className="glass-card p-4">
                <label className="block text-sm font-medium mb-2">
                  Load YouTube Video
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                  />
                  <Button onClick={handleLoadVideo}>
                    Load Video
                  </Button>
                </div>
              </div>
            </motion.div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Collaboration Panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <CollaborationPanel
                activeTab={activeTab}
                onTabChange={setActiveTab}
                currentVideoTime={currentVideoTime}
                onJumpToTime={setSeekToTime}
              />
            </motion.div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default StudyRoom;
