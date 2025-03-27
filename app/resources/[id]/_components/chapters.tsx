import { usePlayerState } from "@/context/player-context";
import { Chapter } from "assemblyai";
import { useMemo } from "react";
import { ChapterItem } from "./chapter-item";

// New Chapter component
export const ChapterSection = ({
  chapters,
  onChapterClick,
}: {
  chapters: Chapter[];
  onChapterClick: (time: number) => void;
}) => {
  const { currentTime } = usePlayerState();
  const activeChapterIndex = useMemo(() => {
    if (!chapters) return -1;
    return chapters.findIndex(
      (chapter) =>
        currentTime >= chapter.start / 1000 && currentTime < chapter.end / 1000
    );
  }, [currentTime, chapters]);

  return (
    <section className="space-y-4 p-4  max-h-[600px] overflow-scroll">
      <div className="space-y-3">
        {chapters?.map((chapter, index) => {
          return (
            <ChapterItem
              key={chapter.start}
              chapter={chapter}
              onChapterClick={onChapterClick}
              isActive={activeChapterIndex === index}
            />
          );
        })}
      </div>
    </section>
  );
};
