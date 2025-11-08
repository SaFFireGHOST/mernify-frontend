// src/hooks/useRoomRealtime.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type RoomRow = {
  id: number | string;
  title?: string;
  subject?: string | null;
  video_url?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

export default function useRoomRealtime(roomId?: string | number) {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const rid = String(roomId);
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // initial fetch
        const { data, error: fetchErr } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", rid)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (mounted) setRoom(data ?? null);
      } catch (e: any) {
        console.error("useRoomRealtime initial fetch error", e);
        if (mounted) setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // subscribe to row changes
    channelRef.current = supabase
      .channel(`public:rooms:id=eq.${rid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${rid}` },
        // note: payload typing varies; treat as `any` here and handle possible fields
        (payload: any) => {
          // payload.eventType: 'INSERT'|'UPDATE'|'DELETE'
          // New row may come in payload.new (supabase v2) or payload.record (older)
          // Use safe checks to avoid TS errors.
          try {
            if (payload.eventType === "DELETE") {
              setRoom(null);
              return;
            }

            // prefer payload.new (v2)
            const newRow = (payload && ("new" in payload) && payload.new) ??
                           (payload && ("record" in payload) && payload.record) ??
                           null;

            if (newRow) {
              setRoom(newRow);
            }
          } catch (e) {
            console.warn("Unhandled realtime payload shape", e, payload);
          }
        }
      )
      .subscribe((status) => {
        // optional: console.log("supabase channel status", status);
      });

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId]);

  return { room, loading, error };
}
