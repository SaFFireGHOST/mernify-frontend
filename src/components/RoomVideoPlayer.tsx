// src/components/RoomVideoPlayer.tsx
import React, { useRef, useCallback, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import io from "socket.io-client"; // Added for Socket.io
import type { RoomRow } from "@/hooks/useRoomRealtime"; // Keep if needed, else remove

const SEEK_THRESHOLD = 0.6; // seconds
const UPDATE_THROTTLE_MS = 1500; // ms
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"; // Adjust as needed

type Props = {
    roomId: number | string;
    // accept both names (prefer youtubeUrl if parent passes it)
    youtubeUrl?: string | null;
    initialYoutubeUrl?: string | null;
    userId?: string | null;
    // optional forwarded callbacks (keeps compatibility with StudyRoom usage)
    onMenuToggle?: () => void;
    onTimeUpdate?: (t: number) => void;
    seekToTime?: number | null;
    onSeekComplete?: () => void;
};

export default function RoomVideoPlayer({
    roomId,
    youtubeUrl = undefined,
    initialYoutubeUrl = null,
    userId = null,
    onMenuToggle,
    onTimeUpdate,
    seekToTime = null,
    onSeekComplete,
}: Props) {
    const lastSentRef = useRef<number>(0);
    const pendingSeekRef = useRef<number | null>(null);
    const playerControlRef = useRef<any | null>(null);
    const socketRef = useRef<any>(null); // Socket.io ref

    // Connect to Socket.io and handle remote updates
    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.emit("join-room", roomId);

        // Listen for remote playback updates
        socketRef.current.on("playback-update", (update: any) => {
            const { is_playing, playback_time, video_url } = update;
            const expectedTime = playback_time; // Simplified; add elapsed time calc if needed

            const getCurrentTime = playerControlRef.current?.getCurrentTime;
            const seekTo = playerControlRef.current?.seekTo;
            const setPlaying = playerControlRef.current?.setPlaying;

            const localTime = typeof getCurrentTime === "function" ? getCurrentTime() : null;
            if (localTime !== null) {
                const diff = Math.abs(localTime - expectedTime);
                if (diff > SEEK_THRESHOLD && typeof seekTo === "function") {
                    seekTo(expectedTime);
                }
            } else {
                pendingSeekRef.current = expectedTime;
            }

            if (typeof setPlaying === "function") setPlaying(!!is_playing);
        });

        // Handle state requests from new joiners
        socketRef.current.on("request-state", () => {
            const currentTime = playerControlRef.current?.getCurrentTime() ?? 0;
            const isPlaying = playerControlRef.current?.getPlayerState?.() === 1; // 1 = playing for YT
            socketRef.current.emit("send-state", {
                roomId,
                video_url: effectiveUrl ?? null,
                is_playing: isPlaying,
                playback_time: currentTime,
            });
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId]);

    // Determine the effective URL to give to VideoPlayer
    const effectiveUrl = (youtubeUrl || initialYoutubeUrl) ?? undefined; // Removed dependency on hook's latest

    useEffect(() => {
        console.log(`[RoomVideoPlayer] room=${roomId} effectiveUrl=`, effectiveUrl);
    }, [roomId, effectiveUrl]);

    // Periodic time update from VideoPlayer
    const handleLocalTimeUpdate = useCallback(
        (time: number) => {
            onTimeUpdate?.(time);
            const now = Date.now();
            if (now - lastSentRef.current < UPDATE_THROTTLE_MS) return;
            lastSentRef.current = now;

            socketRef.current.emit("playback-update", {
                roomId,
                video_url: effectiveUrl ?? null,
                is_playing: true,
                playback_time: time,
            });
        },
        [onTimeUpdate, effectiveUrl, roomId]
    );

    const handleLocalPlayPause = useCallback(
        (isPlaying: boolean, currentTime: number) => {
            socketRef.current.emit("playback-update", {
                roomId,
                video_url: effectiveUrl ?? null,
                is_playing: isPlaying,
                playback_time: currentTime,
            });
        },
        [effectiveUrl, roomId]
    );

    const handleLocalSeek = useCallback(
        (seekTo: number) => {
            onTimeUpdate?.(seekTo);
            socketRef.current.emit("playback-update", {
                roomId,
                video_url: effectiveUrl ?? null,
                is_playing: true,
                playback_time: seekTo,
            });
        },
        [effectiveUrl, roomId, onTimeUpdate]
    );

    const setPlayerControls = useCallback((controls: any) => {
        playerControlRef.current = controls;
        if (pendingSeekRef.current != null && controls?.seekTo) {
            controls.seekTo(pendingSeekRef.current);
            pendingSeekRef.current = null;
        }
    }, []);

    // If parent asks to seek externally
    useEffect(() => {
        if (seekToTime == null) return;
        const controls = playerControlRef.current;
        if (controls?.seekTo) {
            controls.seekTo(seekToTime);
            onSeekComplete?.();
        } else {
            pendingSeekRef.current = seekToTime;
        }
    }, [seekToTime, onSeekComplete]);

    return (
        <VideoPlayer
            youtubeUrl={effectiveUrl}
            onTimeUpdate={handleLocalTimeUpdate}
            registerControls={setPlayerControls}
            onLocalPlay={(t: number) => handleLocalPlayPause(true, t)}
            onLocalPause={(t: number) => handleLocalPlayPause(false, t)}
            onLocalSeek={(t: number) => handleLocalSeek(t)}
            onMenuToggle={onMenuToggle}
            seekToTime={seekToTime ?? null}
            onSeekComplete={onSeekComplete}
        />
    );
}