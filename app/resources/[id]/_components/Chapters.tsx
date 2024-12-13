import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Chapter } from "assemblyai";

// New Chapter component
export const ChapterSection = ({
  chapters,
  currentTime,
  onChapterClick,
}: {
  chapters: Chapter[];
  currentTime: number;
  onChapterClick: (time: number) => void;
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold border-b pb-2">Chapters</h3>
      <div className="space-y-3">
        {chapters?.map((chapter, index) => (
          <Card
            key={index}
            className={cn(
              "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
              currentTime * 1000 >= chapter.start &&
                currentTime * 1000 <= chapter.end &&
                "border-blue-500 bg-blue-50"
            )}
            onClick={() => onChapterClick(chapter.start / 1000)}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-medium">{chapter.headline}</h4>
              <span className="text-sm text-muted-foreground">
                {formatTime(chapter.start)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {chapter.summary}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
};
