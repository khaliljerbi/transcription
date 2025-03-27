"use client";

import { LanguageProvider } from "./context/language-context";
import { PlayerProvider } from "./context/player-context";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </LanguageProvider>
  );
}

export default Providers;
