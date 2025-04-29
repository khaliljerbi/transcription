import { translateTranscription } from "@/actions/translate";
import prisma from "@/lib/db";
import { TranslationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = params.id;
    const language = request.nextUrl.searchParams.get("language") || "en";

    // Find the transcription
    const transcription = await prisma.transcription.findUnique({
      where: { resourceId },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      );
    }

    // If the requested language matches the original language, return as-is
    if (transcription.language === language) {
      return NextResponse.json({
        ...transcription,
        chapters: JSON.parse((transcription.chapters as string) || "null"),
        topics: JSON.parse(transcription.topics as string),
        words: JSON.parse((transcription.words as string) || "null"),
        utterances: JSON.parse((transcription.utterances as string) || "null"),
        thumbnail: JSON.parse(transcription.thumbnail),
      });
    }

    // Check if we have a cached translation
    const translation = await prisma.translation.findUnique({
      where: {
        transcriptionId_language: {
          transcriptionId: transcription.id,
          language,
        },
      },
    });

    // If we have a completed translation, return it
    if (translation && translation.status === TranslationStatus.COMPLETED) {
      return NextResponse.json({
        ...transcription,
        text: translation.text || transcription.text,
        summary: translation.summary || transcription.summary,
        chapters: translation.chapters
          ? JSON.parse(translation.chapters as string)
          : JSON.parse((transcription.chapters as string) || "null"),
        utterances: translation.utterances
          ? JSON.parse(translation.utterances as string)
          : JSON.parse((transcription.utterances as string) || "null"),
        topics: JSON.parse(transcription.topics as string),
        words: JSON.parse((transcription.words as string) || "null"),
        thumbnail: JSON.parse(transcription.thumbnail),
        language_code: language,
      });
    }

    // Find any queued or in-progress translation
    const queueEntry = await prisma.translationQueue.findFirst({
      where: {
        transcriptionId: transcription.id,
        targetLanguage: language,
        status: {
          in: [TranslationStatus.PENDING, TranslationStatus.IN_PROGRESS],
        },
      },
    });

    // Convert to TranscriptionResult format
    const transcriptionResult = {
      resourceId: transcription.resourceId,
      id: transcription.id,
      text: transcription.text,
      summary: transcription.summary,
      chapters: JSON.parse((transcription.chapters as string) || "null"),
      utterances: JSON.parse((transcription.utterances as string) || "null"),
      words: JSON.parse((transcription.words as string) || "null"),
      topics: JSON.parse(transcription.topics as string),
      language_code: transcription.language,
      thumbnail: JSON.parse(transcription.thumbnail),
      title: transcription.title,
      transcriptionId: transcription.transcriptionId,
    };

    // If we have a partial translation, include it
    if (translation) {
      if (translation.text) transcriptionResult.text = translation.text;
      if (translation.summary)
        transcriptionResult.summary = translation.summary;
      if (translation.chapters) {
        transcriptionResult.chapters = JSON.parse(
          translation.chapters as string
        );
      }
      if (translation.utterances) {
        transcriptionResult.utterances = JSON.parse(
          translation.utterances as string
        );
      }

      // Add translation status
      if (queueEntry) {
        (transcriptionResult as any).translationStatus = {
          status: queueEntry.status,
          progress: queueEntry.progress,
          queueId: queueEntry.id,
        };
      }

      return NextResponse.json(transcriptionResult);
    }

    // No cached translation, do on-the-fly translation
    const translatedResult = await translateTranscription(
      transcriptionResult,
      language as any
    );

    // Add translation status if available
    if (queueEntry) {
      translatedResult.translationStatus = {
        status: queueEntry.status,
        progress: queueEntry.progress,
        queueId: queueEntry.id,
      };
    }

    return NextResponse.json(translatedResult);
  } catch (error) {
    console.error("Error getting transcription:", error);
    return NextResponse.json(
      { error: "Failed to get transcription" },
      { status: 500 }
    );
  }
}
