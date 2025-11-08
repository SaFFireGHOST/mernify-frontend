// src/hooks/useRoomPlayback.ts
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth'; //  Import useAuth
type PlaybackRow = {
  room_id: number;
  video_url?: string | null;
  is_playing: boolean;
  playback_time: number;
  client_ts: number;
  updated_by?: string | null;
  updated_at?: string;
};

export default function useRoomPlayback(roomId: number | string, onRemoteUpdate: (row: PlaybackRow) => void) {
  const [latest, setLatest] = useState<PlaybackRow | null>(null);
  const channelRef = useRef<any>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!roomId) return;
    const rid = Number(roomId);

    // 1) fetch current playback row once
    (async () => {
      const { data, error } = await supabase
        .from('room_playback')
        .select('*')
        .eq('room_id', rid)
        .maybeSingle();
      if (error) {
        console.warn('Initial playback fetch error', error);
      } else if (data) {
        setLatest(data);
        onRemoteUpdate?.(data);
      }
    })();

    // 2) subscribe to realtime changes on room_playback table for this room
    channelRef.current = supabase
      .channel(`room_playback_room_${rid}`) // reusable channel name
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_playback', filter: `room_id=eq.${rid}` },
        (payload) => {
          // payload has shape { eventType, new, old }
          const newRow = payload.new as PlaybackRow | null;
          if (newRow) {
            setLatest(newRow);
            onRemoteUpdate?.(newRow);
          }
        }
      )
      .subscribe((status) => {
        // optional: handle status
        // console.log('supabase channel status', status);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId]);

  // returns the most recent row for quick access
  return { latest, sendLocalUpdate: async (payload: Partial<PlaybackRow>) => {
    // send update to your server, not supabase anon
    // call your backend route /api/room-playback which upserts with service key
    try {
      const res = await fetch('/api/room-playback', {
        method: 'POST',
        headers: {
              'Content-Type': 'application/json',
              // Add the 'token' to the Authorization header
              Authorization: `Bearer ${token}`,
            },
        body: JSON.stringify({ room_id: roomId, ...payload }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('Failed to post playback', res.status, body);
      }
    } catch (e) {
      console.error('Failed to send playback update', e);
    }
  }};
}
