// src/components/ChatPanel.tsx
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/use-auth";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  isOwn: boolean;
}

export default function ChatPanel() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // LOAD PAST MESSAGES (FIXED: "You" + correct username)
  useEffect(() => {
    if (!roomId || !user) return;

    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomId}/messages`);
        const { messages } = await res.json();

        const formatted = messages.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          username: m.user_id === user.id 
            ? user.username 
            : (m.profiles?.username || "User"),
          content: m.content,
          created_at: m.created_at,
          isOwn: m.user_id === user.id
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to load chat:", err);
      }
    };
    load();
  }, [roomId, user]);

  // REALTIME: LIVE MESSAGES (FIXED: "You" + no "User" bug)
  // REALTIME: LIVE + FETCH USERNAME FROM PROFILES (PERFECT)
useEffect(() => {
  if (!roomId || !user) return;

  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${roomId}`
      },
      async (payload: any) => {
        const msg = payload.new;
        const isOwn = msg.user_id === user.id;

        // IF IT'S YOUR MESSAGE → use your username
        if (isOwn) {
          setMessages(prev => [...prev, {
            id: msg.id,
            user_id: msg.user_id,
            username: user.username,
            content: msg.content,
            created_at: msg.created_at,
            isOwn: true
          }]);
          return;
        }

        // IF OTHER USER → FETCH THEIR USERNAME FROM PROFILES
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", msg.user_id)
          .single();

        const username = profile?.username || "Guest";

        setMessages(prev => [...prev, {
          id: msg.id,
          user_id: msg.user_id,
          username,
          content: msg.content,
          created_at: msg.created_at,
          isOwn: false
        }]);
      }
    )
    .subscribe((status) => {
      console.log("Realtime LIVE:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [roomId, user]);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND MESSAGE
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !roomId) return;

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Join a room to chat
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <h3 className="font-bold text-lg">Room Chat</h3>
        <p className="text-xs text-muted-foreground">
          Live • {messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-6 space-y-5">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground">Be the first to say hi!</p>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback className={msg.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                    {msg.isOwn ? "Y" : msg.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-xs ${msg.isOwn ? "text-right" : ""}`}>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">
                    {msg.isOwn ? "You" : msg.username}
                    {" • "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl inline-block shadow-sm ${
                      msg.isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={send} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}