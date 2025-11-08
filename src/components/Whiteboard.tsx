// # Whiteboard
// A collaborative whiteboard that uses Supabase Realtime's broadcast channel to synchronize drawing strokes and cursor positions between multiple users in real-time.
// Persistence is handled via backend API with MongoDB.

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
// import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Save } from "lucide-react";

// Initialize Supabase client using environment variables (for realtime only)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Backend API base URL (adjust to your backend, e.g., http://localhost:5000 or deployed URL)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Whiteboard background color (must match CSS for save function)
const WHITEBOARD_BG_COLOR = '#171717';

export default function Whiteboard() {
  const { roomId = 'default' } = useParams();
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#3ecf8e');

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const isInitialSetup = useRef(true);
  const pointsBuffer = useRef([]);
  const batchTimerRef = useRef(null);
  const channelRef = useRef(null);
  const currentPathRef = useRef([]);
  // at top with other refs
  // const strokesStoreRef = useRef<Array<{ points: any[]; color: string }>>([]);

  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [penSize, setPenSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(18); // tweak to taste

  type StrokePoint = { type: 'start' | 'move'; x: number; y: number };
  type StoredStroke = { points: StrokePoint[]; color: string; tool?: 'pen' | 'eraser'; size?: number };

  const strokesStoreRef = useRef<StoredStroke[]>([]);


  function repaintAll() {
    const ctx = contextRef.current;
    if (!ctx) return;
    for (const s of strokesStoreRef.current) {
      drawStroke(s.points, s.color, s.tool ?? 'pen', s.size);
    }
  }



  // Dynamic channel name based on roomId
  const CHANNEL = `whiteboard-${roomId}`;

  // Initialize canvas and context (runs only on mount/unmount/resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      // Setting width/height resets the bitmap (clears canvas)
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      // setTransform is better than scale() because it resets the transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-apply stroke defaults every time we re-init
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = currentColor;
      contextRef.current = ctx;

      // ✅ Repaint everything we had
      repaintAll();
    };

    setupCanvas();

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });

    const container = canvas.parentElement;
    if (container) resizeObserver.observe(container);

    window.addEventListener('resize', setupCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', setupCanvas);
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);


  // Update stroke color when currentColor changes (Runs after initial setup)
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentColor;
    }
  }, [currentColor]);

  // Function to draw a stroke (used for both realtime and initial load)
  const drawStroke = (points: StrokePoint[], color: string, tool: 'pen' | 'eraser' = 'pen', size?: number) => {
    const ctx = contextRef.current;
    if (!ctx || points.length === 0) return;

    // save current settings
    const prevComposite = ctx.globalCompositeOperation;
    const prevStroke = ctx.strokeStyle;
    const prevWidth = ctx.lineWidth;

    // apply tool
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size ?? eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size ?? penSize;
    }

    let isNewPath = true;
    for (const p of points) {
      if (p.type === 'start' || isNewPath) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        isNewPath = false;
      } else if (p.type === 'move') {
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    // restore
    ctx.globalCompositeOperation = prevComposite;
    ctx.strokeStyle = prevStroke as string;
    ctx.lineWidth = prevWidth;
  };


  // Function to send batched points
  const sendBatchedPoints = () => {
    if (pointsBuffer.current.length === 0) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'draw_batch',
      payload: {
        userId: userId.current,
        points: [...pointsBuffer.current],
        color: currentColor,
        tool: currentTool,
        size: currentTool === 'eraser' ? eraserSize : penSize,
      }
    });

    pointsBuffer.current = [];
  };


  // Set up Supabase channel and load initial strokes from backend
  useEffect(() => {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]
      }${Math.floor(Math.random() * 100)}`;
    setUsername(randomName);

    const channel = supabase.channel(CHANNEL);
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = [];

      Object.keys(state).forEach(key => {
        const presences = state[key];
        users.push(...presences);
      });

      setActiveUsers(users);
    });

    channel.on('broadcast', { event: 'draw_batch' }, (payload) => {
      if (payload.payload.userId === userId.current) return;
      const { points, color, tool = 'pen', size } = payload.payload;
      drawStroke(points, color, tool, size);
      strokesStoreRef.current.push({ points, color, tool, size });
    });

    channel.on('broadcast', { event: 'draw' }, (payload) => {
      if (payload.payload.userId === userId.current) return;
      const { x, y, type, color, tool = 'pen', size } = payload.payload;
      const ctx = contextRef.current;
      if (!ctx) return;

      const prevComposite = ctx.globalCompositeOperation;
      const prevStroke = ctx.strokeStyle;
      const prevWidth = ctx.lineWidth;

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size ?? eraserSize;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = size ?? penSize;
      }

      if (type === 'start') {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else if (type === 'move') {
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = prevComposite;
      ctx.strokeStyle = prevStroke as string;
      ctx.lineWidth = prevWidth;
    });


    channel.on('broadcast', { event: 'clear' }, () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;

      if (!context || !canvas) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId.current,
          username: randomName,
          online_at: new Date().getTime()
        });

        setIsConnected(true);

        // Load initial strokes from backend API
        try {
          const response = await fetch(`${API_BASE_URL}/strokes/${roomId}`);
          if (!response.ok) throw new Error('Failed to fetch strokes');
          const data = await response.json();
          data.forEach(stroke => {
            // stroke.tool / stroke.size might be missing for old data
            drawStroke(stroke.strokes, stroke.color, stroke.tool ?? 'pen', stroke.size);
            strokesStoreRef.current.push({
              points: stroke.strokes,
              color: stroke.color,
              tool: stroke.tool ?? 'pen',
              size: stroke.size,
            });
          });


          // --- FIX APPLIED HERE ---
          // Set current color to the last stroke color if strokes were loaded.
          if (data.length > 0) {
            setCurrentColor(data[data.length - 1].color);
          }

        } catch (error) {
          console.error('Error loading strokes:', error);
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  // Drawing handlers (omitted for brevity, they are unchanged from previous working version)
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = contextRef.current;
    if (!ctx) return;

    // apply tool for local drawing
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = penSize;
    }

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    currentPathRef.current = [{ type: 'start', x: offsetX, y: offsetY }];
    pointsBuffer.current.push({ type: 'start', x: offsetX, y: offsetY });

    if (!batchTimerRef.current) {
      batchTimerRef.current = setInterval(sendBatchedPoints, 10);
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: {
        userId: userId.current,
        type: 'start',
        x: offsetX, y: offsetY,
        color: currentColor,
        tool: currentTool,                        // 👈
        size: currentTool === 'eraser' ? eraserSize : penSize,
      }
    });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = contextRef.current;
    if (!ctx) return;

    // ensure tool settings persist mid-stroke (safe)
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = penSize;
    }

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    pointsBuffer.current.push({ type: 'move', x: offsetX, y: offsetY });
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: {
        userId: userId.current,
        type: 'move',
        x: offsetX, y: offsetY,
        color: currentColor,
        tool: currentTool,                        // 👈
        size: currentTool === 'eraser' ? eraserSize : penSize,
      }
    });

    currentPathRef.current.push({ type: 'move', x: offsetX, y: offsetY });
  };

  const stopDrawing = async () => {
    const ctx = contextRef.current;
    if (ctx) ctx.closePath();
    setIsDrawing(false);

    // flush any remaining batched points
    sendBatchedPoints();

    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    // --------- PERSIST TO BACKEND (ADD THIS) ----------
    if (currentPathRef.current.length > 0) {
      // snapshot before we clear
      const path = [...currentPathRef.current];
      const stroke = {
        room_id: Number(roomId), // or String(roomId) if your model uses string
        strokes: path,           // [{type:'start'|'move', x, y}, ...]
        color: currentColor,
        tool: currentTool,                               // 'pen' | 'eraser'
        size: currentTool === 'eraser' ? eraserSize : penSize,
        // created_by: session?.user?.id, // if you have auth
      };

      // keep local store in sync so repaint/save works instantly
      strokesStoreRef.current.push({
        points: path, color: currentColor, tool: currentTool, size: stroke.size
      });

      try {
        const resp = await fetch(`${API_BASE_URL}/strokes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stroke),
        });
        if (!resp.ok) {
          const e = await resp.text().catch(() => '');
          console.error('Failed to save stroke:', resp.status, e);
        }
      } catch (err) {
        console.error('POST /strokes error:', err);
      }
    }
    // ---------------------------------------------------

    // reset for next stroke
    currentPathRef.current = [];

    // return to normal drawing mode after an eraser stroke
    if (ctx) ctx.globalCompositeOperation = 'source-over';
  };



  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    // Clear the entire canvas locally
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Delete all strokes for this room via backend API
    try {
      const response = await fetch(`${API_BASE_URL}/strokes/${roomId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear strokes');
    } catch (error) {
      console.error('Error clearing strokes:', error);
    }

    // Broadcast clear event
    channelRef.current.send({
      type: 'broadcast',
      event: 'clear',
      payload: {
        userId: userId.current
      }
    });
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');

    tempCanvas.width = canvas.width / 2;
    tempCanvas.height = canvas.height / 2;

    tempContext.fillStyle = WHITEBOARD_BG_COLOR;
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    const image = tempCanvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color selection
  const colors = ['#3ecf8e', '#f43f5e', '#60a5fa', '#a78bfa', '#ffffff'];

  const selectColor = (color) => {
    setCurrentColor(color);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased relative">
      {/* Toolbar - Positioned at top-right */}
      {/* Toolbar – responsive */}
      <div
        className="
    absolute
    top-2 left-1/2 -translate-x-1/2
    md:top-4 md:right-4 md:left-auto md:translate-x-0
    z-10
  "
      >
        <div
          className="
      flex flex-wrap md:flex-nowrap items-center
      gap-2 md:gap-4
      p-2 md:p-3
      bg-neutral-800/70 backdrop-blur-sm rounded-lg shadow-xl
      max-w-[calc(100vw-1rem)]  /* prevent overflow off-screen on mobile */
      overflow-x-auto            /* allow sideways scroll if needed */
    "
        >
          {/* Tools */}
          <button
            onClick={() => setCurrentTool('pen')}
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-sm md:text-base ${currentTool === 'pen'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-300 hover:bg-neutral-700'
              }`}
            title="Pen"
          >
            Pen
          </button>

          <button
            onClick={() => setCurrentTool('eraser')}
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-sm md:text-base ${currentTool === 'eraser'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-300 hover:bg-neutral-700'
              }`}
            title="Eraser"
          >
            Eraser
          </button>

          {/* Size slider */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-neutral-400 whitespace-nowrap">Size</span>
            <input
              type="range"
              min={1}
              max={40}
              value={currentTool === 'eraser' ? eraserSize : penSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (currentTool === 'eraser') setEraserSize(v);
                else setPenSize(v);
              }}
              className="accent-neutral-300 w-28 md:w-40"
            />
          </div>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            className="p-2 md:p-2.5 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full transition-colors shrink-0"
            title="Clear Canvas"
          >
            <Trash2 strokeWidth={1.5} size={16} />
          </button>

          {/* Colors */}
          <div className="flex items-center gap-2 overflow-x-auto pr-1">
            {colors.map((color) => (
              <div
                key={color}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full cursor-pointer border-2 ${color === currentColor ? 'border-neutral-300' : 'border-transparent'
                  } hover:scale-110 transition-transform shrink-0`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setCurrentTool('pen'); // ensure pen when picking a color
                  selectColor(color);
                }}
                title={color}
              />
            ))}
          </div>

          {/* Save */}
          <button
            onClick={saveImage}
            className="p-2 md:p-2.5 text-neutral-400 hover:bg-neutral-700 hover:text-white rounded-full transition-colors shrink-0"
            title="Save Image (PNG)"
          >
            <Save strokeWidth={1.5} size={16} />
          </button>
        </div>
      </div>



      {/* Main content (Canvas) */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="w-full h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none bg-neutral-900 shrink-0"
          />
        </div>
      </div>
    </div>
  );
}