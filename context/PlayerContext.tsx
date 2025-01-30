// PlayerContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { YouTubePlayer } from "react-youtube";

interface PlayerRefContextType {
  playerRef: React.MutableRefObject<YouTubePlayer | null>;
}

interface PlayerStateContextType {
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerRefContext = createContext<PlayerRefContextType>({
  playerRef: { current: null },
});

const PlayerStateContext = createContext<PlayerStateContextType>({
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: () => {},
  setIsPlaying: () => {},
});

// Separate hooks for each context
export const usePlayerRef = () => useContext(PlayerRefContext);
export const usePlayerState = () => useContext(PlayerStateContext);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const playerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const refValue = useMemo(
    () => ({
      playerRef,
    }),
    [playerRef]
  );

  const stateValue = useMemo(
    () => ({
      currentTime,
      isPlaying,
      setCurrentTime,
      setIsPlaying,
    }),
    [currentTime, isPlaying]
  );

  return (
    <PlayerRefContext.Provider value={refValue}>
      <PlayerStateContext.Provider value={stateValue}>
        {children}
      </PlayerStateContext.Provider>
    </PlayerRefContext.Provider>
  );
};
