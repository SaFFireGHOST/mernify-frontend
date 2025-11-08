import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/RoomCard";
import CreateRoomDialog from "@/components/CreateRoomDialog";
import heroImage from "@/assets/hero-study.jpg";
import thumbMath from "@/assets/thumb-math.jpg";
import thumbPhysics from "@/assets/thumb-physics.jpg";
import thumbBiology from "@/assets/thumb-biology.jpg";
import { useAuth } from "@/hooks/use-auth"; // Import the useAuth hook

import DashboardStats from "@/components/DashboardStats";

const Dashboard = () => {
  // state for rooms + loading/error
  const [studyRooms, setStudyRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const THUMBS = [thumbMath, thumbPhysics, thumbBiology];

  // Fast, stable 32-bit hash (FNV-1a)
  function hashFNV1a(str: string) {
    let h = 0x811c9dc5; // 2166136261
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193); // 16777619
    }
    console.log("[hashFNV1a]", { input: str, hash: h >>> 0 });
    return h >>> 0; // unsigned
  }

  function pickThumbById(id: string | number) {
    const h = hashFNV1a(String(id));
    const idx = h % THUMBS.length;
    return THUMBS[idx];
  }

  // (optional) subject override if you want specific thumbs for known subjects
  const SUBJECT_THUMBS: Record<string, string> = {
    math: thumbMath,
    physics: thumbPhysics,
    biology: thumbBiology,
  };

  function pickThumb(room: { id: string | number; subject?: string | null }) {
    const sub = room.subject?.toLowerCase().trim();
    if (sub && SUBJECT_THUMBS[sub]) return SUBJECT_THUMBS[sub];
    return pickThumbById(room.id);
  }

  const { user, signOut } = useAuth(); // Get user and signOut from context

  // helper to fetch rooms from backend
  const getRoomsApi = async ({ limit = 50, offset = 0 } = {}) => {
    const url = `/api/rooms?limit=${limit}&offset=${offset}`; // uses Vite proxy in dev
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      // throw friendly message (body may contain { error })
      const serverMsg = body ? (body.error || JSON.stringify(body)) : `${res.status} ${res.statusText}`;
      throw new Error(serverMsg);
    }
    return body.rooms || [];
  };

  // fetch rooms on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRooms(true);
      setRoomsError(null);
      try {
        const rooms = await getRoomsApi({ limit: 50, offset: 0 });
        if (!mounted) return;

        // normalize DB rows to your RoomCard props
        const normalized = rooms.map((r, idx) => {
          console.log("room:", r.id, r.title, r.subject);  // ✅ check data shape
          return {
            id: String(r.id),
            title: r.title,
            subject: r.subject,
            thumbnail: pickThumb(r),     // or pickThumbSafe(r, idx)
            activeMembers: r.active_members ?? 0,
            totalDuration: "0h 0m",
            created_at: r.created_at,
            created_by: r.created_by,
            video_url: r.video_url ?? null,
          };
        });


        setStudyRooms(normalized);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to fetch rooms:", err);
        setRoomsError(err.message || "Failed to fetch rooms");
      } finally {
        if (mounted) setLoadingRooms(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // run once on mount



  const createRoomApi = async (payload: {
    title: string;
    subject?: string | null;
    video_url?: string | null;
    thumbnail?: string | null;
  }) => {
    const token = localStorage.getItem('token'); // or get from context
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'unknown' }));
      throw new Error(err?.error || 'Failed to create room');
    }
    const body = await res.json();
    return body.room; // Supabase row object
  };

  // Replace your existing handler with this
  const handleCreateRoom = async (room: { title: string; subject: string }) => {
    try {
      // optional: show spinner / disable button in UI
      const payload = {
        title: room.title,
        subject: room.subject || null,
        // video_url and thumbnail optional. Keep thumbnail generated client-side if you want
        // video_url: null,
        // thumbnail: thumbMath,
      };

      const createdRoom = await createRoomApi(payload);

      // createdRoom is the row returned by Supabase. Example fields: id, created_at, created_by, title, subject, video_url
      // Normalize to your UI shape:
      const uiRoom = {
        id: String(createdRoom.id), // supabase id (bigint) -> string for consistency
        title: createdRoom.title,
        subject: createdRoom.subject,
        thumbnail: pickThumb(createdRoom),         // keep your default thumbnail if Supabase doesn't store it
        activeMembers: 0,
        totalDuration: "0h 0m",
        // optionally add created_at, created_by, video_url ...
        created_at: createdRoom.created_at,
        created_by: createdRoom.created_by,
        video_url: createdRoom.video_url,
      };

      // update state
      setStudyRooms(prev => [...prev, uiRoom]);
    } catch (err) {
      console.error('create room failed', err);
      // show user-friendly error (toast/modal)
      alert((err as Error).message || 'Failed to create room');
    } finally {
      // optional: hide spinner / re-enable button
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            StudySync
          </h1>

          {/* Conditional Auth Button */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {user.username}
                </span>
                <Button variant="destructive" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[400px] overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>

        <div className="relative container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Collaborate & Learn
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Join real-time study sessions with peers around the world
            </p>

            <DashboardStats />

          </motion.div>
        </div>
      </motion.section>

      {/* Study Rooms Section */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold">Active Study Rooms</h2>
              <p className="text-muted-foreground mt-1">Join a session and start learning</p>
            </div>
            <CreateRoomDialog onCreateRoom={handleCreateRoom} />
          </div>

          {/* Loading / Error / Empty / Data states */}
          {loadingRooms ? (
            // skeleton grid while loading
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-lg overflow-hidden bg-gray-200/60 dark:bg-gray-700/40 animate-pulse"
                  role="status"
                  aria-label="loading room placeholder"
                >
                  <div className="h-36 w-full bg-gray-300/60 dark:bg-gray-600/40" />
                  <div className="p-4">
                    <div className="h-4 w-2/3 bg-gray-300/60 dark:bg-gray-600/40 mb-2" />
                    <div className="h-3 w-1/3 bg-gray-300/60 dark:bg-gray-600/40" />
                  </div>
                </div>
              ))}
            </div>
          ) : roomsError ? (
            // show error
            <div className="py-8 text-center">
              <p className="text-destructive">Error loading rooms: {roomsError}</p>
            </div>
          ) : studyRooms.length === 0 ? (
            // empty state
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No rooms yet — create the first one!</p>
            </div>
          ) : (
            // normal rooms grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <RoomCard {...room} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

    </div>
  );
};

export default Dashboard;