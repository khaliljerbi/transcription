"use server";
import { SpeechModel } from "assemblyai";
import assembleyClient from "@/lib/assembly-ai";
import prisma from "@/lib/db";
import { getYoutubePublicUrl } from "./upload";
import { Readable } from "stream";

export const transcribeFile = async (fileUrl: string) => {
  try {
    const topics: Record<string, number> = {};

    const speech_model: SpeechModel = "best";

    const config = {
      audio_url: fileUrl,
      speech_model,
      iab_categories: true,
      language_detection: true,
      auto_chapters: true,
    };

    const transcript = await assembleyClient.transcripts.transcribe(config);

    for (const [topic, relevance] of Object.entries(
      transcript.iab_categories_result!.summary
    )) {
      topics[topic] = relevance * 100;
    }

    return {
      text: transcript.text,
      summary: transcript.summary,
      topics,
      words: transcript.words,
      chapters: transcript.chapters,
    };
  } catch (error) {
    console.error("Transcription failed:", error);
  }
};

export async function getOrCreateTranscription(resourceId: string) {
  // Try to find existing transcription
  const existing = await prisma.transcription.findUnique({
    where: { resourceId },
  });

  if (existing) {
    return {
      ...existing,
      chapters: JSON.parse(existing.chapters as string),
      topics: JSON.parse(existing.topics as string),
      words: JSON.parse(existing.words as string),
    };
  }

  // youtube processing
  const data = await getYoutubePublicUrl(
    `https://www.youtube.com/watch?v=${resourceId}`
  );

  if (!data) {
    throw new Error("could not process the request");
  }

  const { audio } = data;
  // If not found, create new transcription
  const uploadResponse = await assembleyClient.files.upload(
    audio as unknown as Readable
  );

  const transcription = await transcribeFile(uploadResponse);

  if (!transcription) {
    throw new Error("Cant create new transcription");
  }

  // Save to database
  const saved = await prisma.transcription.create({
    data: {
      resourceId,
      text: transcription.text || "",
      summary: transcription.summary,
      topics: JSON.stringify(transcription.topics),
      chapters: JSON.stringify(transcription.chapters),
      words: JSON.stringify(transcription.words),
    },
  });

  return {
    ...saved,
    chapters: JSON.parse(saved.chapters as string),
    topics: JSON.parse(saved.topics as string),
    words: JSON.parse(saved.words as string),
  };
}
