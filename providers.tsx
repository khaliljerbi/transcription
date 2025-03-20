"use client";

import { LanguageProvider } from "./context/LanguageContext";
import { PlayerProvider } from "./context/PlayerContext";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </LanguageProvider>
  );
}

export default Providers;
