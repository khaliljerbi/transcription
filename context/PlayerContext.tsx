import React, { createContext, useContext, useMemo, useState } from "react";

interface PlayerContextType {
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const PlayerContext = createContext<PlayerContextType>({
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: () => {},
  setIsPlaying: () => {},
});

export const usePlayerContext = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const value = useMemo(
    () => ({
      currentTime,
      isPlaying,
      setCurrentTime,
      setIsPlaying,
    }),
    [currentTime, isPlaying]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
