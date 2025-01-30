"use client";

import { PlayerProvider } from "./context/PlayerContext";

function Providers({ children }: { children: React.ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}

export default Providers;
