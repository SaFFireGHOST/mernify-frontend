import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient"; // <-- you said this exists
import { useParams } from "react-router-dom";
interface AIMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
}

type Props = {
  userId?: string | null;  // <-- pass your auth user id if available
  apiBase?: string;        // optional (default localhost)
};

const AIBotPanel = ({ userId = null, apiBase = "http://localhost:4000" }: Props) => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 1) Initial history load
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/ai/history?room_id=${roomId}&limit=500`);
        const data = await res.json();
        if (!isCancelled && Array.isArray(data?.messages)) {
          // Map DB rows to UI shape
          const mapped = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })) as AIMessage[];
          setMessages(mapped);
        }
      } catch (e) {
        console.error("History load failed", e);
      }
    })();
    return () => { isCancelled = true; };
  }, [roomId, apiBase]);

  // 2) Realtime subscription to new inserts for this room
  useEffect(() => {
    const channel = supabase
      .channel(`ai_messages_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const next: AIMessage = { id: row.id, role: row.role, content: row.content };
          setMessages((prev) => [...prev, next]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isLoading) return;

    // Optimistic append (optional)
    const tempId = `local-${Date.now()}`;
    // setMessages((prev) => [...prev, { id: tempId, role: "user", content: newQuestion }]);

    const promptToSend = newQuestion;
    setNewQuestion("");
    setIsLoading(true);

    try {
      // Backend will insert both user and assistant messages
      const res = await fetch(`${apiBase}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          room_id: roomId,
          user_id: userId ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ask failed: ${res.status}`);
      }

      // No need to manually push; realtime INSERT events will add both rows.
      // (You can still reconcile the optimistic temp message if you want.)
    } catch (error) {
      console.error(error);
      // Replace optimistic message with an error bubble
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: tempId,
                role: "assistant",
                content: "Sorry, something went wrong while fetching the AI response.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4">
      {/* Header */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">AI Study Assistant Active</span>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-primary to-secondary"
                      : "bg-accent"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-white font-bold">You</span>
                  )}
                </div>

                <div
                  className={`p-3 rounded-lg max-w-xl ${
                    message.role === "user" ? "bg-accent/20" : "bg-muted/50"
                  } prose prose-sm dark:prose-invert`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          placeholder="Ask AI a question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="bg-gradient-to-br from-primary to-secondary"
          disabled={isLoading || !newQuestion.trim()}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};

export default AIBotPanel;
