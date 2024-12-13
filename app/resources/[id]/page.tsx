"use client";
import { getOrCreateTranscription } from "@/actions/assembley";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTopic } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { YouTubePlayer } from "react-youtube";
import { MediaPlayer } from "./_components/MediaPlayer";
import { TranscriptText } from "./_components/TranscriptText";
import { Chapter, Word } from "assemblyai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChapterSection } from "./_components/Chapters";

interface TranscriptionResult {
  topics: Record<string, number>;
  text: string | null | undefined;
  summary: string | null | undefined;
  words: Word[] | null | undefined;
  chapters: Chapter[] | null | undefined;
}

export default function TranscriptionPage() {
  const [transcriptionData, setTranscriptionData] = useState<
    TranscriptionResult | null | undefined
  >(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
  console.log("https://www.youtube.com/watch?v=${id}`", id);
  return (
    <div className="container mx-auto px-4 py-6">
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

        {/* Right side - Topics */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold border-b pb-2 mb-4">Topics</h3>
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
        </div>
      </div>

      <Tabs defaultValue="transcript" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="mt-6">
          <Card className="p-6">
            <TranscriptText
              words={transcriptionData?.words}
              text={transcriptionData?.text}
              currentTime={currentTime}
              isPlaying={isPlaying}
              isExpanded={isExpanded}
              onExpandToggle={() => setIsExpanded(!isExpanded)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="mt-6">
          <ChapterSection
            chapters={transcriptionData?.chapters as Chapter[]}
            currentTime={currentTime}
            onChapterClick={handleChapterClick}
          />
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      {/* <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-xl font-semibold border-b pb-2 mb-4">Summary</h3>
          <p className="text-muted-foreground">
            {transcriptionData?.summary || "No summary available"}
          </p>
        </Card>
      </div> */}
    </div>
  );
}
