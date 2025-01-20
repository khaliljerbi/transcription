import { Card } from "@/components/ui/card";
import { cn, formatTime } from "@/lib/utils";
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
  return (
    <section className="space-y-4 p-4  max-h-[600px] overflow-scroll">
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
