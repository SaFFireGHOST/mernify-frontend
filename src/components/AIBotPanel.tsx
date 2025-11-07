import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const AIBotPanel = () => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI study assistant. I can help explain concepts, answer questions, and provide additional resources. What would you like to know?",
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "user",
        content: newQuestion,
      }]);

      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I understand your question. Let me explain that in detail...",
        }]);
      }, 1000);

      setNewQuestion("");
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">AI Study Assistant Active</span>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === "assistant" ? "bg-gradient-to-br from-primary to-secondary" : "bg-accent"}`}>
                {message.role === "assistant" ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs text-white font-bold">You</span>
                )}
              </div>
              <div className={`flex-1 p-3 rounded-lg ${message.role === "user" ? "bg-accent/20" : "bg-muted/50"}`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          placeholder="Ask AI a question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" className="bg-gradient-to-br from-primary to-secondary">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default AIBotPanel;
