import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  onMenuToggle: () => void;
  youtubeUrl?: string;
  onTimeUpdate?: (time: number) => void;
  seekToTime?: number | null;
  onSeekComplete?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoPlayer = ({ onMenuToggle, youtubeUrl, onTimeUpdate, seekToTime, onSeekComplete }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState([70]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
    if (videoRef.current) {
      videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
    }
  };

  const getYoutubeVideoId = (url: string) => {
    return url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
  };

  const videoId = youtubeUrl ? getYoutubeVideoId(youtubeUrl) : null;

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        events: {
          onReady: () => {
            // Start tracking time
            intervalRef.current = setInterval(() => {
              if (playerRef.current && onTimeUpdate) {
                const currentTime = playerRef.current.getCurrentTime();
                onTimeUpdate(currentTime);
              }
            }, 1000);
          },
        },
      });
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onTimeUpdate]);

  // Handle seek to time
  useEffect(() => {
    if (seekToTime !== null && playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seekToTime, true);
      onSeekComplete?.();
    }
  }, [seekToTime, onSeekComplete]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 aspect-video">
        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-black/40 hover:bg-black/60 text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {videoId ? (
          <div id="youtube-player" className="w-full h-full" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setProgress((video.currentTime / video.duration) * 100);
            }}
          >
            {/* Add video source when available */}
          </video>
        )}

        {/* Play overlay when paused - only for non-YouTube videos */}
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

      {/* Controls - only show for non-YouTube videos */}
      {!videoId && (
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="hover:bg-primary/10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="hover:bg-primary/10"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">0:00 / 0:00</span>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10"
              >
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
