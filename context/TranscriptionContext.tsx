import { createContext, useContext, useState } from "react";

interface TranscriptionContextType {
  transcriptions: string[];
  setTranscriptions: (transcriptions: string[]) => void;
}

export const TranscriptionContext = createContext<TranscriptionContextType>({
  transcriptions: [],
  setTranscriptions: () => {},
});

export const useTranscriptionContext = () => useContext(TranscriptionContext);

export const TranscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [transcriptions, setTranscriptions] = useState<string[]>([]);

  return (
    <TranscriptionContext.Provider
      value={{ transcriptions, setTranscriptions }}
    >
      {children}
    </TranscriptionContext.Provider>
  );
};
