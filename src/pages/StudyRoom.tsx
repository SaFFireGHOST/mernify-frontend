import { useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer";
import CollaborationPanel from "@/components/CollaborationPanel";
import PauseOverlay from "@/components/PauseOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const youtubeUrlSchema = z.string().trim().regex(
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]{11}(\S*)?$/,
  { message: "Please enter a valid YouTube URL" }
);

const StudyRoom = () => {
  const { roomId } = useParams();
  const { toast } = useToast();
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "chat" | "ai" | "whiteboard">("comments");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

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

  const handleLoadVideo = () => {
    try {
      youtubeUrlSchema.parse(urlInput);
      setYoutubeUrl(urlInput);
      toast({
        title: "Video loaded",
        description: "YouTube video has been loaded successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid URL",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
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
          <h1 className="text-2xl font-bold">Advanced Calculus</h1>
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
                <VideoPlayer 
                  onMenuToggle={handleMenuToggle} 
                  youtubeUrl={youtubeUrl}
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
