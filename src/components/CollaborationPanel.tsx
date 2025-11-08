// src/components/CollaborationPanel.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommentsPanel from "./CommentsPanel";
import ChatPanel from "./ChatPanel";
import AIBotPanel from "./AIBotPanel";
import Whiteboard from "./Whiteboard";

import { MessageSquare, Users, Bot, Pencil, Mic } from "lucide-react";

interface CollaborationPanelProps {
  activeTab: "comments" | "chat" | "ai" | "whiteboard" ;
  onTabChange: (tab: "comments" | "chat" | "ai" | "whiteboard") => void;
  /** NEW */
  /** NEW – optional, only needed for comments */
  currentVideoTime?: number;
  onJumpToTime?: (time: number) => void;
}

const CollaborationPanel = ({
  activeTab,
  onTabChange,
  currentVideoTime,
  onJumpToTime,
}: CollaborationPanelProps) => {
  return (
    <div className="glass-card h-[600px] flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="w-4 h-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bot className="w-4 h-4" />
            AI Bot
          </TabsTrigger>
          <TabsTrigger value="whiteboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Pencil className="w-4 h-4" />
            Board
          </TabsTrigger>
          
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* ---------- COMMENTS ---------- */}
          <TabsContent value="comments" className="h-full mt-0 min-h-0">
            <div className="h-full min-h-0 overflow-hidden">
              <CommentsPanel
        
                currentVideoTime={currentVideoTime}
                onJumpToTime={onJumpToTime}
              />
            </div>
          </TabsContent>

          {/* ---------- OTHER TABS (unchanged) ---------- */}
          <TabsContent value="chat" className="h-full mt-0 min-h-0">
            <div className="h-full min-h-0 overflow-hidden"><ChatPanel /></div>
          </TabsContent>
          <TabsContent value="ai" className="h-full mt-0 min-h-0">
            <div className="h-full min-h-0 overflow-hidden"><AIBotPanel /></div>
          </TabsContent>
          <TabsContent value="whiteboard" className="h-full mt-0 min-h-0">
            <div className="h-full min-h-0 overflow-hidden"><Whiteboard /></div>
          </TabsContent>
          
        </div>
      </Tabs>
    </div>
  );
};

export default CollaborationPanel;