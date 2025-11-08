// DashboardStats.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, Video, BookOpen } from "lucide-react";

export default function DashboardStats() {
  const [roomsCount, setRoomsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [topicsCount, setTopicsCount] = useState<number>(0);

  async function loadCounts() {
    // total rooms
    const { count: rCount, error: rErr } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true });
    if (rErr) console.error(rErr);
    setRoomsCount(rCount ?? 0);

    // total users (profiles)
    const { count: uCount, error: uErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if (uErr) console.error(uErr);
    setUsersCount(uCount ?? 0);

    // topics = unique subjects across rooms (client-side distinct)
    // (OK for small/medium data; for large data use Option B RPC below)
    const { data: subjects, error: sErr } = await supabase
      .from("rooms")
      .select("subject")
      .not("subject", "is", null);
    if (sErr) console.error(sErr);
    setTopicsCount(new Set(subjects?.map(s => s.subject)).size || 0);
  }

  useEffect(() => {
    loadCounts();

    // Optional: live refresh on INSERT/DELETE/UPDATE
    const ch = supabase
      .channel("dashboard_counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, loadCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadCounts)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="flex gap-8 justify-center mt-8">
      <div className="flex items-center gap-2 text-foreground/80">
        <Users className="w-5 h-5 text-primary" />
        <span className="font-medium">{usersCount} Learners</span>
      </div>
      <div className="flex items-center gap-2 text-foreground/80">
        <Video className="w-5 h-5 text-secondary" />
        <span className="font-medium">{roomsCount} Rooms</span>
      </div>
      <div className="flex items-center gap-2 text-foreground/80">
        <BookOpen className="w-5 h-5 text-accent" />
        <span className="font-medium">{topicsCount}+ Topics</span>
      </div>
    </div>
  );
}
