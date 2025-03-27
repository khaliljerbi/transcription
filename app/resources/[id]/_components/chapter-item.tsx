import { Card } from "@/components/ui/card";

import { cn, formatTime } from "@/lib/utils";
import { Chapter } from "assemblyai";
import React from "react";

export const ChapterItem = React.memo(
  ({
    chapter,
    onChapterClick,
    isActive,
  }: {
    chapter: Chapter;
    onChapterClick: (time: number) => void;
    isActive: boolean;
  }) => {
    return (
      <Card
        className={cn(
          "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
          isActive && "border-blue-500 bg-blue-50"
        )}
        onClick={() => onChapterClick(chapter.start / 1000)}
      >
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{chapter.headline}</h4>
          <span className="text-sm text-muted-foreground">
            {formatTime(chapter.start)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{chapter.summary}</p>
      </Card>
    );
  },
  (prev, next) =>
    prev.isActive === next.isActive && prev.chapter.start === next.chapter.start
);

ChapterItem.displayName = "ChapterItem";
