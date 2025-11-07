import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Clock, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

interface Comment {
  id: string;
  user: string;
  timestamp: string;
  videoTime: number;
  videoTimeDisplay: string;
  content: string;
  likes: number;
}

interface CommentsPanelProps {
  currentVideoTime?: number;
  onJumpToTime?: (time: number) => void;
}

const CommentsPanel = ({ currentVideoTime = 0, onJumpToTime }: CommentsPanelProps) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      user: "Sarah Chen",
      timestamp: "2 hours ago",
      videoTime: 225,
      videoTimeDisplay: "03:45",
      content: "Great explanation of the concept! This really helped clarify the main points.",
      likes: 12,
    },
    {
      id: "2",
      user: "Alex Kumar",
      timestamp: "1 hour ago",
      videoTime: 440,
      videoTimeDisplay: "07:20",
      content: "Can someone explain the formula mentioned at this timestamp?",
      likes: 5,
    },
  ]);

  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        user: "You",
        timestamp: "Just now",
        videoTime: currentVideoTime,
        videoTimeDisplay: formatTime(currentVideoTime),
        content: newComment,
        likes: 0,
      };
      setComments([newCommentObj, ...comments]);
      setNewComment("");
    }
  };

  const handleLike = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likes: c.likes - 1 } : c
      ));
    } else {
      newLiked.add(commentId);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      ));
    }
    setLikedComments(newLiked);
  };

  const handleJumpTo = (time: number) => {
    onJumpToTime?.(time);
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Comments & Notes
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
          <Button type="submit" className="gap-2">
            Add Comment
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {comment.user.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 gap-1 ${likedComments.has(comment.id) ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={() => handleLike(comment.id)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-xs">{comment.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-primary hover:text-primary/80"
                      onClick={() => handleJumpTo(comment.videoTime)}
                    >
                      Jump to {comment.videoTimeDisplay}
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
