"use client";
import { getOrCreateTranscription } from "@/actions/assembley";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTopic } from "@/lib/utils";
import { Chapter, Word } from "assemblyai";
import { Loader2, Menu } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { YouTubePlayer } from "react-youtube";
import { ChapterSection } from "./_components/Chapters";
import ChatWidget from "./_components/ChatWidget";
import { MediaPlayer } from "./_components/MediaPlayer";
import { TranscriptText } from "./_components/TranscriptText";

interface TranscriptionResult {
  transcriptionId: string;
  topics: Record<string, number>;
  text: string | null | undefined;
  summary: string | null | undefined;
  words: Word[] | null | undefined;
  chapters: Chapter[] | null | undefined;
}

enum MenuDetails {
  TRANSCRIPT = "TRANSCRIPT",
  TOPICS = "TOPICS",
}

export const maxDuration = 60;

export default function TranscriptionPage() {
  const [transcriptionData, setTranscriptionData] = useState<
    TranscriptionResult | null | undefined
  >(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menu, setMenu] = useState<MenuDetails>(MenuDetails.TRANSCRIPT);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const { id } = useParams();

  useEffect(() => {
    const processTranscription = async () => {
      setIsLoading(true);
      try {
        const result = await getOrCreateTranscription(id as string);
        setTranscriptionData(result);
      } catch (error) {
        console.error("Transcription failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    processTranscription();
  }, [id]);

  const handleChapterClick = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin mx-2" />
        Please wait...
      </div>
    );
  }

  const relevantTopics = transcriptionData?.topics
    ? Object.entries(transcriptionData.topics)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, score]) => score > 10)
        .sort(([, a], [, b]) => b - a)
        .map(([topic]) => topic)
    : [];

  const renderMenuContent = (content: MenuDetails) => {
    switch (content) {
      case MenuDetails.TRANSCRIPT:
        return (
          <TranscriptText
            words={transcriptionData?.words}
            text={transcriptionData?.text}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isExpanded={isExpanded}
            onExpandToggle={() => setIsExpanded(!isExpanded)}
            onChapterClick={handleChapterClick}
          />
        );
      case MenuDetails.TOPICS:
        return (
          <div className="flex flex-wrap gap-2">
            {relevantTopics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-sm">
                {formatTopic(topic)}
              </Badge>
            ))}
            {relevantTopics.length === 0 && (
              <p className="text-gray-500">No relevant topics found</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 relative">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Left side - Player */}
        <div className="md:col-span-2">
          {id && (
            <MediaPlayer
              id={id as string}
              onTimeUpdate={setCurrentTime}
              onPlayingChange={setIsPlaying}
              ref={playerRef}
            />
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="text-xl font-semibold ">{menu}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Menu className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setMenu(MenuDetails.TRANSCRIPT)}
                >
                  Transcript
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMenu(MenuDetails.TOPICS)}>
                  Topics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {renderMenuContent(menu)}
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <p className="text-muted-foreground">
            {transcriptionData?.summary || "No summary available"}
          </p>
        </TabsContent>

        <TabsContent value="chapters" className="mt-6">
          <ChapterSection
            chapters={transcriptionData?.chapters as Chapter[]}
            currentTime={currentTime}
            onChapterClick={handleChapterClick}
          />
        </TabsContent>
      </Tabs>

      {transcriptionData ? (
        <ChatWidget transcriptionId={transcriptionData.transcriptionId} />
      ) : null}
    </div>
  );
}
