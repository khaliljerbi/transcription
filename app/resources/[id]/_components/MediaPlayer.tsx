"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import YouTube from "react-youtube";
import type { YouTubePlayer, YouTubeEvent } from "react-youtube";

interface MediaPlayerProps {
  id: string;
  onTimeUpdate: (time: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

export interface MediaPlayerHandle {
  seekTo: (time: number) => void;
}

export const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(
  ({ id, onTimeUpdate, onPlayingChange }, ref) => {
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

    const handleStateChange = (event: YouTubeEvent) => {
      onPlayingChange(event.data === 1);
    };

    const handleReady = (event: YouTubeEvent) => {
      playerRef.current = event.target;

      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }

      timeUpdateInterval.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          onTimeUpdate(currentTime);
        }
      }, 100);
    };

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
