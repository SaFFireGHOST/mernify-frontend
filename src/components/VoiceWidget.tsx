// src/components/VoiceWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Participant,
} from "livekit-client";

type Props = {
  roomId: string | number;
  identity: string;                 // your app user id / username
  apiBase?: string;                 // defaults to VITE_API_BASE
  livekitUrl?: string;              // override if you want; else VITE_LIVEKIT_URL
  autoJoin?: boolean;               // join on mount
};

type Speaker = { identity: string; level: number };

export default function VoiceWidget({
  roomId,
  identity,
  apiBase = import.meta.env.VITE_API_BASE || "",
  livekitUrl = import.meta.env.VITE_LIVEKIT_URL || "",
  autoJoin = false,
}: Props) {
  const roomRef = useRef<Room | null>(null);

  // hidden bucket for remote <audio> elements
  const audioBucketRef = useRef<HTMLDivElement | null>(null);
  // map (participantIdentity:trackSid) -> <audio>
  const audioEls = useRef(new Map<string, HTMLAudioElement>());

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micMuted, setMicMuted] = useState(false);      // ⬅ mic (publish) mute
  const [speakerMuted, setSpeakerMuted] = useState(false); // ⬅ speaker (playback) mute
  const [showStartAudio, setShowStartAudio] = useState(false); // NEW: Track if audio is blocked
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  const label = useMemo(() => `lk:${roomId}`, [roomId]);

  async function fetchToken() {
    console.log(`[${label}] Fetching token for room=${roomId}, identity=${identity}`);
    const params = new URLSearchParams({ room: String(roomId), identity });
    const r = await fetch(`${apiBase}/api/livekit/token?${params.toString()}`);
    if (!r.ok) throw new Error(`Token error ${r.status}`);
    const { url, token } = (await r.json()) as { url: string; token: string };
    console.log(`[${label}] Token fetched successfully, url=${url}`);
    return { url: livekitUrl || url, token };
  }

  const refreshParticipants = () => {
    const room = roomRef.current;
    if (!room) return;
    const remotes = Array.from(room.remoteParticipants.values());
    const list = remotes.map((p: RemoteParticipant) => p.identity);
    const fullList = [room.localParticipant.identity, ...list];
    console.log(`[${label}] Participants updated:`, fullList);
    setParticipants(fullList);
  };

  async function join() {
    if (joined || joining) return;
    setError(null);
    setJoining(true);
    console.log(`[${label}] Starting join process`);
    try {
      const { url, token } = await fetchToken();

      // Connect per docs: new Room() then room.connect(wsUrl, token)
      console.log(`[${label}] Connecting to room at ${url}`);
      const room = new Room();
      await room.connect(url, token);
      roomRef.current = room;
      console.log(`[${label}] Connected successfully`);

      // Enable + publish microphone (prompts permission on first use)
      console.log(`[${label}] Enabling microphone`);
      await room.localParticipant.setMicrophoneEnabled(true);
      setMicMuted(false);
      console.log(`[${label}] Microphone enabled`);

      // --- Remote audio subscribe / unsubscribe ---

      room.on(
        RoomEvent.TrackSubscribed,
        (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          console.log(`[${label}] TrackSubscribed:`, { kind: track.kind, participant: participant.identity, sid: pub.trackSid });
          if (track.kind !== "audio") return;
          const el = track.attach() as HTMLAudioElement; // <audio autoplay>
          el.dataset.lkParticipant = participant.identity;
          el.dataset.lkTrackSid = pub.trackSid || "";
          el.autoplay = true;
          el.muted = speakerMuted; // reflect speaker state (not mic)
          el.volume = 1; // Ensure full volume
          audioEls.current.set(`${participant.identity}:${pub.trackSid}`, el);
          audioBucketRef.current?.appendChild(el);

          // Debug log to confirm pause state and other audio props
          console.log(`[${label}] Attached audio element:`, {
            participant: participant.identity,
            paused: el.paused,
            volume: el.volume,
            muted: el.muted,
            error: el.error ? el.error.message : null,
            currentTime: el.currentTime,
            duration: el.duration,
          });
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          console.log(`[${label}] TrackUnsubscribed:`, { kind: track.kind, participant: participant.identity, sid: pub.trackSid });
          const key = `${participant.identity}:${pub.trackSid}`;
          const el = audioEls.current.get(key);
          if (el) {
            track.detach(el);
            el.remove();
            audioEls.current.delete(key);
          } else {
            track.detach().forEach((n) => n.remove());
          }
        }
      );

      // --- Presence & speakers ---

      room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        console.log(`[${label}] ParticipantConnected:`, p.identity);
        refreshParticipants();
      });
      room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        console.log(`[${label}] ParticipantDisconnected:`, p.identity);
        // cleanup any dangling audio elements for that participant
        [...audioEls.current.entries()]
          .filter(([key]) => key.startsWith(`${p.identity}:`))
          .forEach(([key, el]) => {
            el.remove();
            audioEls.current.delete(key);
          });
        refreshParticipants();
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (active: Participant[]) => {
        console.log(`[${label}] ActiveSpeakersChanged:`, active.map(p => ({ identity: p.identity, level: p.audioLevel })));
        setSpeakers(
          active.map((p) => ({
            identity: p.identity,
            level: p.audioLevel ?? 0,
          }))
        );
      });

      // NEW: Listen for playback failures (triggers if autoplay blocked)
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        const canPlay = room.canPlaybackAudio;
        console.log(`[${label}] AudioPlaybackStatusChanged:`, { canPlay });
        setShowStartAudio(!canPlay);
      });

      // NEW: Initial check after connect
      console.log(`[${label}] Initial audio playback check: canPlaybackAudio=${room.canPlaybackAudio}`);
      if (!room.canPlaybackAudio) {
        setShowStartAudio(true);
      }

      refreshParticipants();
      setJoined(true);
      console.log(`[${label}] Join completed successfully`);
    } catch (e: any) {
      console.error(`[${label}] join failed`, e);
      setError(e?.message || "Failed to join voice");
      setJoined(false);
    } finally {
      setJoining(false);
    }
  }

  async function leave() {
    console.log(`[${label}] Leaving room`);
    try {
      const room = roomRef.current;
      if (room) {
        // detach & remove any <audio> we created
        [...audioEls.current.values()].forEach((el) => {
          console.log(`[${label}] Removing audio element for cleanup`);
          el.remove();
        });
        audioEls.current.clear();
        room.disconnect();
        console.log(`[${label}] Disconnected`);
      }
    } catch (e) {
      console.error(`[${label}] leave error`, e);
    } finally {
      roomRef.current = null;
      setJoined(false);
      setMicMuted(false);
      setSpeakerMuted(false);
      setShowStartAudio(false);
      setParticipants([]);
      setSpeakers([]);
      console.log(`[${label}] Leave completed`);
    }
  }

  // Toggle MIC (publish) mute — should NOT affect remote playback
  async function toggleMic() {
    const room = roomRef.current;
    if (!room) return;
    const next = !micMuted;
    console.log(`[${label}] Toggling mic to ${next ? 'muted' : 'unmuted'}`);
    try {
      await room.localParticipant.setMicrophoneEnabled(!next); // enabled=false => muted
      setMicMuted(next);
    } catch (e) {
      console.error(`[${label}] mic toggle failed`, e);
    }
  }

  // Toggle SPEAKER (playback) mute — mutes all remote <audio> elements locally
  function toggleSpeaker() {
    const next = !speakerMuted;
    console.log(`[${label}] Toggling speaker to ${next ? 'muted' : 'unmuted'}`);
    setSpeakerMuted(next);
    for (const [key, el] of audioEls.current.entries()) {
      el.muted = next;
      console.log(`[${label}] Updated audio mute for ${key}: ${next}`);
    }
  }

  // NEW: Handler for explicit audio start (call on button click)
  async function startPlayback() {
    const room = roomRef.current;
    if (!room) return;
    console.log(`[${label}] Starting audio playback (user gesture)`);
    try {
      await room.startAudio(); // This MUST be in user gesture (button click)
      setShowStartAudio(false);
      console.log(`[${label}] Audio playback started successfully`);
    } catch (e) {
      console.error(`[${label}] startAudio failed:`, e);
      setError('Failed to start audio playback');
    }
  }

  // auto-join on mount (optional)
  useEffect(() => {
    if (autoJoin) {
      console.log(`[${label}] Auto-joining on mount`);
      void join();
    }
    return () => {
      void leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoin, roomId, identity]);

  // helpful env hint
  useEffect(() => {
    if (!livekitUrl && !import.meta.env.VITE_LIVEKIT_URL) {
      const err = "VITE_LIVEKIT_URL not set and no livekitUrl prop supplied.";
      console.error(`[${label}] ${err}`);
      setError(err);
    }
  }, [livekitUrl]);

  return (
    <div className="relative">
      {/* Hidden bucket for remote <audio> elements */}
      <div
        ref={audioBucketRef}
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-800/70 text-white rounded-md px-3 py-2">
        {!joined ? (
          <button
            onClick={join}
            disabled={joining}
            className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60"
            title="Join voice"
          >
            {joining ? "Joining…" : "Join Voice"}
          </button>
        ) : (
          <>
            {/* NEW: "Start Audio" button if blocked (hides after click) */}
            {showStartAudio && (
              <button
                onClick={startPlayback}
                className="px-3 py-1.5 rounded bg-yellow-700 hover:bg-yellow-600"
                title="Click to enable audio playback (browser policy)"
              >
                Start Audio
              </button>
            )}

            <button
              onClick={toggleMic}
              className={`px-3 py-1.5 rounded ${
                micMuted ? "bg-amber-700 hover:bg-amber-600" : "bg-green-700 hover:bg-green-600"
              }`}
              title={micMuted ? "Unmute mic" : "Mute mic"}
            >
              {micMuted ? "Unmute Mic" : "Mute Mic"}
            </button>

            <button
              onClick={toggleSpeaker}
              className={`px-3 py-1.5 rounded ${
                speakerMuted ? "bg-sky-700 hover:bg-sky-600" : "bg-indigo-700 hover:bg-indigo-600"
              }`}
              title={speakerMuted ? "Unmute speakers" : "Mute speakers"}
            >
              {speakerMuted ? "Unmute Speakers" : "Mute Speakers"}
            </button>

            <button
              onClick={leave}
              className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600"
              title="Leave voice"
            >
              Leave
            </button>
          </>
        )}

        {/* Presence & speakers */}
        <div className="ml-2 text-xs text-neutral-300 space-y-0.5">
          <div>
            <span className="opacity-70">Participants:</span>{" "}
            {participants.length ? participants.join(", ") : "—"}
          </div>
          <div>
            <span className="opacity-70">Speaking:</span>{" "}
            {speakers.length ? speakers.map((s) => s.identity).join(", ") : "—"}
          </div>
        </div>

        {error && <div className="ml-2 text-xs text-red-400">{error}</div>}
      </div>
    </div>
  );
}