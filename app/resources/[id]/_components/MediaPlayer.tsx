"use client";

import { usePlayerContext } from "@/context/PlayerContext";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { YouTubeEvent, YouTubePlayer } from "react-youtube";
import YouTube from "react-youtube";

interface MediaPlayerProps {
  id: string;
}

export interface MediaPlayerHandle {
  seekTo: (time: number) => void;
}

export const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(
  ({ id }, ref) => {
    const { setCurrentTime, setIsPlaying } = usePlayerContext();
    const playerRef = useRef<YouTubePlayer | null>(null);
    const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(time, true);
          playerRef.current.playVideo();
        }
      },
    }));

    useEffect(() => {
      return () => {
        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current);
        }
      };
    }, []);

    const handleStateChange = useCallback(
      (event: YouTubeEvent) => {
        setIsPlaying(event.data === 1);
      },
      [setIsPlaying]
    );

    const handleReady = useCallback(
      (event: YouTubeEvent) => {
        playerRef.current = event.target;

        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current);
        }

        timeUpdateInterval.current = setInterval(() => {
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            setCurrentTime(currentTime);
          }
        }, 100);
      },
      [setCurrentTime]
    );

    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden">
        <YouTube
          videoId={id}
          onReady={handleReady}
          onStateChange={handleStateChange}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              controls: 1,
              modestbranding: 1,
            },
          }}
          className="w-full h-full"
        />
      </div>
    );
  }
);

MediaPlayer.displayName = "MediaPlayer";
