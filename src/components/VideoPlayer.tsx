import { useState, useRef, useEffect, useId, useMemo, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerControls {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setPlaying: (play: boolean) => void;
  isReady?: () => boolean;
  getPlayerState?: () => number; // Added for checking playing state
}

interface VideoPlayerProps {
  onMenuToggle: () => void;
  youtubeUrl?: string;
  onTimeUpdate?: (time: number) => void;
  seekToTime?: number | null;
  onSeekComplete?: () => void;
  registerControls?: (controls: VideoPlayerControls) => void;
  onLocalPlay?: (currentTime: number) => void;
  onLocalPause?: (currentTime: number) => void;
  onLocalSeek?: (seekToTime: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/* -------------------------
   1) Load YT API ONCE
-------------------------- */
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeAPIOnce() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    // if already present somehow
    if (window.YT?.Player) resolve();
  });
  return ytApiPromise;
}

const getYoutubeVideoId = (url: string) =>
  url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  )?.[1];

const VideoPlayer = ({
  onMenuToggle,
  youtubeUrl,
  onTimeUpdate,
  seekToTime,
  onSeekComplete,
  registerControls,
  onLocalPlay,
  onLocalPause,
  onLocalSeek,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState([70]);

  const html5Ref = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const suppressLocalRef = useRef(false); // prevent echo when we programmatically seek/play

  // 2) unique container id per instance
  const rid = useId();
  const ytContainerId = useMemo(() => `ytp-${rid}`, [rid]);

  const videoId = youtubeUrl ? getYoutubeVideoId(youtubeUrl) : null;

  /* -------------------------
     3) Expose controls to parent (added getPlayerState for sync)
  -------------------------- */
  const exposeControls = useCallback(() => {
    const controls: VideoPlayerControls = {
      seekTo: (t: number) => {
        suppressLocalRef.current = true;
        if (playerRef.current?.seekTo) playerRef.current.seekTo(t, true);
        else if (html5Ref.current) html5Ref.current.currentTime = t;
        setTimeout(() => (suppressLocalRef.current = false), 500);
      },
      getCurrentTime: () => {
        if (playerRef.current?.getCurrentTime) return playerRef.current.getCurrentTime();
        return html5Ref.current?.currentTime || 0;
      },
      setPlaying: (play: boolean) => {
        suppressLocalRef.current = true;
        if (playerRef.current) {
          if (play) playerRef.current.playVideo?.();
          else playerRef.current.pauseVideo?.();
        } else if (html5Ref.current) {
          if (play) html5Ref.current.play();
          else html5Ref.current.pause();
        }
        setIsPlaying(!!play);
        setTimeout(() => (suppressLocalRef.current = false), 500);
      },
      isReady: () => Boolean(playerRef.current || html5Ref.current),
      getPlayerState: () => playerRef.current?.getPlayerState?.() ?? (html5Ref.current?.paused ? 2 : 1), // 1=playing, 2=paused
    };
    registerControls?.(controls);
  }, [registerControls]);

  useEffect(() => {
    exposeControls();
  }, [exposeControls]);

  /* -------------------------
     4) Init YT once; reuse player; loadVideoById on URL change
  -------------------------- */
  useEffect(() => {
    if (!videoId) return; // HTML5 branch handles itself

    let cancelled = false;

    (async () => {
      await loadYouTubeAPIOnce();
      if (cancelled) return;

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(ytContainerId, {
          videoId,
          playerVars: { modestbranding: 1, rel: 0 },
          events: {
            onReady: () => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                if (playerRef.current && onTimeUpdate) {
                  // Add this check: only update/send when PLAYING (YT state 1)
                  const state = playerRef.current.getPlayerState?.();
                  if (state === window.YT.PlayerState.PLAYING) {
                    onTimeUpdate(playerRef.current.getCurrentTime());
                  }
                }
              }, 1000);
              exposeControls();
            },
            onStateChange: (e: any) => {
              if (suppressLocalRef.current) return;
              const t = playerRef.current?.getCurrentTime?.() ?? 0;
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                onLocalPlay?.(t);
              } else if (
                e.data === window.YT.PlayerState.PAUSED ||
                e.data === window.YT.PlayerState.ENDED
              ) {
                setIsPlaying(false);
                onLocalPause?.(t);
              }
            },
            onError: (e: any) => console.warn("YouTube error", e?.data),
          },
        });
      } else {
        // re-use player; just load new video id
        try {
          playerRef.current.loadVideoById({ videoId });
        } catch {
          playerRef.current.cueVideoById?.({ videoId });
        }
      }
    })();

    return () => {
      cancelled = true; // do NOT destroy on every URL change; only on unmount
    };
  }, [videoId, ytContainerId, onTimeUpdate, exposeControls]);

  /* -------------------------
     5) External seek prop
  -------------------------- */
  useEffect(() => {
    if (seekToTime == null) return;
    suppressLocalRef.current = true;
    if (playerRef.current?.seekTo) playerRef.current.seekTo(seekToTime, true);
    else if (html5Ref.current) html5Ref.current.currentTime = seekToTime;
    setTimeout(() => (suppressLocalRef.current = false), 500);
    onSeekComplete?.();
  }, [seekToTime, onSeekComplete]);

  /* -------------------------
     6) Cleanup on unmount only
  -------------------------- */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch { }
        playerRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
        onLocalPause?.(playerRef.current.getCurrentTime?.() ?? 0);
      } else {
        playerRef.current.playVideo?.();
        onLocalPlay?.(playerRef.current.getCurrentTime?.() ?? 0);
      }
      setIsPlaying(!isPlaying);
    } else if (html5Ref.current) {
      if (isPlaying) {
        html5Ref.current.pause();
        onLocalPause?.(html5Ref.current.currentTime);
      } else {
        html5Ref.current.play();
        onLocalPlay?.(html5Ref.current.currentTime);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.unMute?.();
      else playerRef.current.mute?.();
      setIsMuted(!isMuted);
    } else if (html5Ref.current) {
      html5Ref.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
    if (playerRef.current?.seekTo) {
      const dur = playerRef.current.getDuration?.() || 0;
      const newTime = (value[0] / 100) * dur;
      playerRef.current.seekTo(newTime, true);
      onLocalSeek?.(newTime);
    } else if (html5Ref.current) {
      const newTime = (value[0] / 100) * (html5Ref.current.duration || 0);
      html5Ref.current.currentTime = newTime;
      onLocalSeek?.(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (html5Ref.current) {
      html5Ref.current.volume = value[0] / 100;
    } else if (playerRef.current) {
      try {
        // YouTube volume: 0..100
        playerRef.current.setVolume?.(value[0]);
      } catch { }
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 aspect-video">
        {videoId ? (
          // IMPORTANT: unique id per instance; do not use "youtube-player"
          <div id={ytContainerId} className="w-full h-full" />
        ) : (
          <video
            ref={html5Ref}
            className="w-full h-full object-cover"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
              setProgress(pct);
              onTimeUpdate?.(v.currentTime);
            }}
          />
        )}

        {!isPlaying && !videoId && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Hide custom controls for YouTube (its own chrome handles it) */}
      {!videoId && (
        <div className="p-4 space-y-3">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="hover:bg-primary/10">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="hover:bg-primary/10">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Slider value={volume} onValueChange={handleVolumeChange} max={100} className="w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">0:00 / 0:00</span>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;