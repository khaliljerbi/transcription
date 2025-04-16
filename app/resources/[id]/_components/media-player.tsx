"use client";

import { usePlayerState } from "@/context/player-context";
import { useSearchParams } from "next/navigation";
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
    const { setCurrentTime, setIsPlaying } = usePlayerState();
    const playerRef = useRef<YouTubePlayer | null>(null);
    const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const initialSeekPendingRef = useRef(false);

    // Get timestamp from URL if available
    const searchParams = useSearchParams();
    const timestampParam = searchParams.get("t");
    const initialTimestamp = useRef<number | null>(
      timestampParam ? parseInt(timestampParam, 10) : null
    );

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

        // If we have a pending seek and the player is ready (state 1 = playing or -1 = unstarted)
        if (
          (event.data === 1 || event.data === -1) &&
          initialTimestamp.current !== null &&
          !initialSeekPendingRef.current
        ) {
          initialSeekPendingRef.current = true;

          // Small delay to ensure player is fully ready
          setTimeout(() => {
            if (playerRef.current && initialTimestamp.current !== null) {
              playerRef.current.seekTo(initialTimestamp.current, true);
              // Optionally start playing after seeking
              playerRef.current.playVideo();
              // Clear the initial timestamp to prevent seeking again
              initialTimestamp.current = null;
            }
          }, 300);
        }
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

        if (
          initialTimestamp.current !== null &&
          !initialSeekPendingRef.current
        ) {
          initialSeekPendingRef.current = true;

          // Small delay to ensure player is fully ready
          setTimeout(() => {
            if (playerRef.current && initialTimestamp.current !== null) {
              playerRef.current.seekTo(initialTimestamp.current, true);
              playerRef.current.playVideo();
              initialTimestamp.current = null;
            }
          }, 300);
        }
      },
      [setCurrentTime]
    );

    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden">
        <YouTube
          id={"player-youtube"}
          videoId={id}
          onReady={handleReady}
          onStateChange={handleStateChange}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              controls: 1,
              modestbranding: 1,
              // You can also set the start time here as a backup approach
              ...(initialTimestamp.current !== null && {
                start: initialTimestamp.current,
              }),
            },
          }}
          className="w-full h-full"
        />
      </div>
    );
  }
);

MediaPlayer.displayName = "MediaPlayer";
