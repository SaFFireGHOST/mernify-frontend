import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
}

const ChatPanel = () => {
  const [messages] = useState<Message[]>([
    {
      id: "1",
      user: "Sarah Miller",
      content: "Hey everyone! Ready to tackle calculus?",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      user: "You",
      content: "Yes! Let's do this 🚀",
      timestamp: "10:31 AM",
      isOwn: true,
    },
    {
      id: "3",
      user: "Alex Kim",
      content: "Can we review derivatives first?",
      timestamp: "10:32 AM",
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // In real app, send message
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: message.isOwn ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className={`text-xs ${message.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {message.user.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 space-y-1 ${message.isOwn ? "items-end" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{message.user}</span>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <div className={`inline-block p-3 rounded-lg ${message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
