import { useState, useRef, useEffect } from "react";
import { Pencil, Eraser, Undo, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#3b82f6");
  const [lineWidth, setLineWidth] = useState([3]);

  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // yellow
    "#000000", // black
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight - 80; // Account for toolbar height
    }

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? lineWidth[0] * 3 : lineWidth[0];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = url;
    link.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-3">
        <Button
          variant={tool === "pen" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("pen")}
        >
          <Pencil className="w-4 h-4" />
        </Button>

        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("eraser")}
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <div className="h-8 w-px bg-border" />

        {/* Color Picker */}
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? "border-foreground scale-110" : "border-border"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Line Width */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Width</span>
          <Slider
            value={lineWidth}
            onValueChange={setLineWidth}
            min={1}
            max={20}
            className="w-24"
          />
        </div>

        <div className="h-8 w-px bg-border" />

        <Button variant="outline" size="icon" onClick={clearCanvas}>
          <Undo className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={downloadCanvas}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair w-full h-full"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
