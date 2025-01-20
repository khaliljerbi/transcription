import { cn, formatTime } from "@/lib/utils";
import { Word } from "assemblyai";
import { useMemo } from "react";

interface TranscriptTextProps {
  words?: Word[] | null;
  text?: string | null;
  currentTime: number;
  isPlaying: boolean;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onChapterClick: (time: number) => void;
}

export const TranscriptText = ({
  words,
  text,
  currentTime,
  isPlaying,
  isExpanded,
  onExpandToggle,
  onChapterClick,
}: TranscriptTextProps) => {
  const updatedText: { start: number; words: Word[] }[] = useMemo(() => {
    if (words) {
      if (words.length === 0) return [];
      const res = [];
      for (let i = 0; i < words.length; i += 30) {
        const chunk = words.slice(i, i + 30);
        res.push({ start: chunk[0].start, words: [...chunk] });
      }
      return res;
    }
    return [];
  }, [words]);

  const truncatedContent = !isExpanded ? updatedText.slice(0, 6) : updatedText;

  if (truncatedContent) {
    return (
      <div>
        <div className={cn("flex flex-col gap-4")}>
          {truncatedContent.map((text, index) => (
            <div key={index} className="flex gap-4 overflow-hidden text-wrap">
              <span
                className="text-sm text-blue-500 cursor-pointer hover:underline hover:text-blue-500/60"
                onClick={() => onChapterClick(text.start / 1000)}
              >
                {formatTime(text.start)}
              </span>
              <div className="flex flex-wrap">
                {text.words.map((word, index) => (
                  <span
                    key={index}
                    className={cn(
                      "mx-0.5 transition-colors duration-200 inline-block",
                      isPlaying &&
                        currentTime >= word.start / 1000 &&
                        currentTime <= word.end / 1000 &&
                        "bg-yellow-200"
                    )}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onExpandToggle}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium mt-2"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      </div>
    );
  }

  return (
    <div className="break-words">
      <p
        className={cn("transition-all duration-300", {
          "line-clamp-4": !isExpanded,
        })}
      >
        {text || "No transcription available"}
      </p>
      {text && (
        <button
          onClick={onExpandToggle}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium mt-2"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
