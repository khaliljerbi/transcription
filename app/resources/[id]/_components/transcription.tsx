"use client";
import { getOrCreateTranscription } from "@/actions/assembley";
import { translateTranscription } from "@/actions/translate";
import { TranslationIndicator } from "@/components/custom/translation-indicator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/context/language-context";
import { usePlayerRef } from "@/context/player-context";
import { formatTopic } from "@/lib/utils";
import { TranscriptionResult } from "@/types/transcription";
import { Loader2, Menu } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChapterSection } from "./chapters";
import { MediaPlayer } from "./media-player";
import Utterances from "./utterances";

enum MenuDetails {
  TOPICS = "TOPICS",
  SPEAKER = "TRANSCRIPT WITH SPEAKER",
}

const MenuContent = React.memo(
  ({
    content,
    transcriptionData,
    onChapterClick,
  }: {
    content: MenuDetails;
    transcriptionData: TranscriptionResult;
    onChapterClick: (time: number) => void;
  }) => {
    const { t } = useLanguage();

    const relevantTopics = useMemo(
      () =>
        Object.entries(transcriptionData.topics)
          .filter(([, score]) => score > 10)
          .sort(([, a], [, b]) => b - a)
          .map(([topic]) => topic),
      [transcriptionData.topics]
    );

    switch (content) {
      case MenuDetails.SPEAKER:
        return transcriptionData ? (
          <Utterances
            utterances={transcriptionData.utterances}
            onTimestampClick={onChapterClick}
          />
        ) : null;

      case MenuDetails.TOPICS:
        return (
          <div className="flex flex-wrap gap-2">
            {relevantTopics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-sm">
                {formatTopic(topic)}
              </Badge>
            ))}
            {relevantTopics.length === 0 && (
              <p className="text-gray-500">{t("noTopics")}</p>
            )}
          </div>
        );
    }
  }
);

MenuContent.displayName = "MenuContent";

const TabContent = React.memo(
  ({
    transcriptionData,
    onChapterClick,
  }: {
    transcriptionData: TranscriptionResult;
    onChapterClick: (time: number) => void;
  }) => {
    const { t } = useLanguage();

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">{t("summary")}</TabsTrigger>
          <TabsTrigger value="chapters">{t("chapters")}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <p className="text-muted-foreground">
            {transcriptionData?.summary || t("noSummary")}
          </p>
        </TabsContent>

        <TabsContent value="chapters" className="mt-6">
          {transcriptionData?.chapters &&
          transcriptionData.chapters.length > 0 ? (
            <ChapterSection
              chapters={transcriptionData.chapters}
              onChapterClick={onChapterClick}
            />
          ) : (
            <p className="text-muted-foreground p-4">{t("noSummary")}</p>
          )}
        </TabsContent>
      </Tabs>
    );
  }
);

TabContent.displayName = "TabContent";

export default function TranscriptionPageContent() {
  const [transcriptionData, setTranscriptionData] = useState<
    TranscriptionResult | null | undefined
  >(null);
  const [originalData, setOriginalData] = useState<
    TranscriptionResult | null | undefined
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [menu, setMenu] = useState<MenuDetails>(MenuDetails.SPEAKER);
  const { playerRef } = usePlayerRef();
  const { language, t } = useLanguage();

  const { id } = useParams();

  // Load original transcription data once
  useEffect(() => {
    const loadTranscription = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const result = await getOrCreateTranscription(id as string, language);
        if (result) {
          setOriginalData(result);

          // If language matches original, use it directly
          if (result.language_code === language) {
            setTranscriptionData(result);
          }
        } else {
          setOriginalData(null);
          setTranscriptionData(null);
        }
      } catch (error) {
        console.error("Transcription failed:", error);
        setOriginalData(null);
        setTranscriptionData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranscription();
  }, [id]); // Only depend on ID, not language

  // Handle language changes separately
  useEffect(() => {
    if (originalData) {
      handleLanguageChange(originalData);
    }
  }, [language]); // Re-run when language changes

  // Separate function to handle language changes
  const handleLanguageChange = async (data: TranscriptionResult) => {
    // If original language matches requested language, use original
    if (data.language_code === language) {
      setTranscriptionData(data);
      setIsTranslating(false);
      return;
    }

    // Otherwise, show translation is in progress
    setIsTranslating(true);

    try {
      // First display existing data to avoid blank screen
      if (!transcriptionData) {
        setTranscriptionData(data);
      }

      // Then translate in the background
      const translatedResult = await translateTranscription(data, language);

      setTranscriptionData(translatedResult);
    } catch (error) {
      console.error("Translation failed:", error);
      // Keep showing original data in case of error
      if (!transcriptionData) {
        setTranscriptionData(data);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleChapterClick = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time);
      }
    },
    [playerRef]
  );

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={32} className="animate-spin mx-2" />
          {t("pleaseWait")}
        </div>
      </>
    );
  }

  if (!transcriptionData) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <span>{t("noData")}</span>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <div className="container mx-auto px-4 py-6 relative">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Left side - Player */}
          <div className="md:col-span-2">
            {id && <MediaPlayer id={id as string} ref={playerRef} />}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xl font-semibold">
                {menu === MenuDetails.SPEAKER ? t("transcript") : t("topics")}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Menu className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setMenu(MenuDetails.SPEAKER)}
                  >
                    {t("transcript")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMenu(MenuDetails.TOPICS)}>
                    {t("topics")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <MenuContent
              content={menu}
              transcriptionData={transcriptionData}
              onChapterClick={handleChapterClick}
            />
          </div>
        </div>

        <TabContent
          transcriptionData={transcriptionData}
          onChapterClick={handleChapterClick}
        />
      </div>
      {/* Add the TranslationIndicator here */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <TranslationIndicator
          resourceId={transcriptionData?.resourceId || (id as string)}
          originalLanguage={originalData?.language_code || "en"}
          isTranslating={isTranslating}
          translationStatus={transcriptionData?.translationStatus}
        />
      </div>
    </div>
  );
}
