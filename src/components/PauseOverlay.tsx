import { motion } from "framer-motion";
import { MessageCircle, Bot, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PauseOverlayProps {
  onAskDoubt: () => void;
  onAskAI: () => void;
  onOpenBoard: () => void;
  onClose: () => void;
}

const PauseOverlay = ({ onAskDoubt, onAskAI, onOpenBoard, onClose }: PauseOverlayProps) => {
  const menuVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.8 },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      x: 50,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-1/2 -translate-y-1/2 right-0 z-10"
      style={{
        width: "280px",
        height: "280px",
      }}
    >
      {/* Semicircle shape */}
      <div className="relative w-full h-full">
        <div 
          className="absolute right-0 top-0 h-full glass-card border-2 border-primary/20 overflow-hidden"
          style={{
            width: "140px",
            borderRadius: "280px 0 0 280px",
            boxShadow: "-8px 0 32px 0 hsl(var(--glass-shadow))"
          }}
        >
          <div className="flex flex-col items-start justify-center h-full pl-6 pr-3 gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 absolute top-3 right-3 hover:bg-primary/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex flex-col gap-2 w-full mt-8">
              <Button
                onClick={onAskDoubt}
                variant="ghost"
                size="icon"
                className="h-12 w-12 hover:bg-primary/10 hover:scale-110 transition-all"
                title="Ask a Doubt"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>

              <Button
                onClick={onAskAI}
                variant="ghost"
                size="icon"
                className="h-12 w-12 hover:bg-primary/10 hover:scale-110 transition-all"
                title="Ask AI Bot"
              >
                <Bot className="w-5 h-5" />
              </Button>

              <Button
                onClick={onOpenBoard}
                variant="ghost"
                size="icon"
                className="h-12 w-12 hover:bg-primary/10 hover:scale-110 transition-all"
                title="Open Board"
              >
                <Pencil className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PauseOverlay;
