import { cn } from "@/lib/utils";
import { Word } from "assemblyai";

interface TranscriptTextProps {
  words?: Word[] | null;
  text?: string | null;
  currentTime: number;
  isPlaying: boolean;
  isExpanded: boolean;
  onExpandToggle: () => void;
}

export const TranscriptText = ({
  words,
  text,
  currentTime,
  isPlaying,
  isExpanded,
  onExpandToggle,
}: TranscriptTextProps) => {
  if (words) {
    return (
      <div>
        <p
          className={cn("break-words max-w-full whitespace-pre-wrap", {
            "line-clamp-4": !isExpanded,
          })}
        >
          {words.map((word, index) => (
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
        </p>
        <button
          onClick={onExpandToggle}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium mt-2"
        >
          {isExpanded ? "Show less" : "Read more"}
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
