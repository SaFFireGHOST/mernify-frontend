// src/components/CommentsPanel.tsx
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Clock, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { useParams } from "react-router-dom";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Comment {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  video_timestamp: number;
  username?: string;
  likes?: number;
}

interface CommentsPanelProps {
  currentVideoTime?: number;
  onJumpToTime?: (time: number) => void;
}

const CommentsPanel = ({
  currentVideoTime = 0,
  onJumpToTime,
}: CommentsPanelProps) => {
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  let realtimeChannel: RealtimeChannel | null = null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { comments } = await res.json();
      setComments(comments ?? []);
    } catch (err) {
      console.error("fetchComments error:", err);
    }
  };

  useEffect(() => {
    fetchComments();

    realtimeChannel = supabase
      .channel(`room_comments:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_comments",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchComments();
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c))
            );
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: newComment,
          video_timestamp: currentVideoTime,
        }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
    } catch (err) {
      console.error("handleSubmit error:", err);
    }
  };

  const handleLike = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
      setComments((c) =>
        c.map((x) =>
          x.id === commentId ? { ...x, likes: (x.likes ?? 0) - 1 } : x
        )
      );
    } else {
      newLiked.add(commentId);
      setComments((c) =>
        c.map((x) =>
          x.id === commentId ? { ...x, likes: (x.likes ?? 0) + 1 } : x
        )
      );
    }
    setLikedComments(newLiked);
  };

  const handleJumpTo = (time: number) => onJumpToTime?.(time);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Comments &amp; Notes
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
        <Textarea
          placeholder="Add a timestamped comment or note..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Current time: {formatTime(currentVideoTime)}</span>
          </div>
          <Button type="submit" className="gap-2" disabled={!user?.id}>
            Add Comment
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {comments.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {c.username?.split(" ").map((n) => n[0]).join("") ?? "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      {c.username ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm">{c.content}</p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 gap-1 ${
                        likedComments.has(c.id) ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => handleLike(c.id)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-xs">{c.likes ?? 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-primary hover:text-primary/80"
                      onClick={() => handleJumpTo(c.video_timestamp)}
                    >
                      Jump to {formatTime(c.video_timestamp)}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentsPanel;