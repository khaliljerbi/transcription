// app/api/process-translation/route.ts
import { translateContent, translateUtterances } from "@/actions/translate";
import prisma from "@/lib/db";
import { TranslationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueId, transcriptionId, sourceLanguage, targetLanguage } = body;

    console.log(`Starting background translation job: ${queueId}`);

    // Get the queue entry
    const queueEntry = await prisma.translationQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueEntry || queueEntry.status === TranslationStatus.COMPLETED) {
      console.log(`Queue entry ${queueId} already processed or not found`);
      return NextResponse.json({ status: "already_processed" });
    }

    // Get the transcription
    const transcription = await prisma.transcription.findUnique({
      where: { id: transcriptionId },
    });

    if (!transcription) {
      throw new Error(`Transcription not found: ${transcriptionId}`);
    }

    // Get or create translation record
    let translation = await prisma.translation.findUnique({
      where: {
        transcriptionId_language: {
          transcriptionId,
          language: targetLanguage,
        },
      },
    });

    if (!translation) {
      translation = await prisma.translation.create({
        data: {
          transcriptionId,
          language: targetLanguage,
          status: TranslationStatus.IN_PROGRESS,
          title: transcription.title,
        },
      });
    } else {
      // Update status to in progress
      await prisma.translation.update({
        where: { id: translation.id },
        data: { status: TranslationStatus.IN_PROGRESS, progress: 5 },
      });
    }

    // Update queue entry to in progress
    await prisma.translationQueue.update({
      where: { id: queueId },
      data: {
        status: TranslationStatus.IN_PROGRESS,
        progress: 5,
      },
    });

    // Parse JSON fields
    const parsedData = {
      summary: transcription.summary,
      chapters: transcription.chapters
        ? JSON.parse(transcription.chapters as string)
        : null,
      utterances: transcription.utterances
        ? JSON.parse(transcription.utterances as string)
        : null,
    };

    // Translate each component in sequenc

    await prisma.translationQueue.update({
      where: { id: queueId },
      data: { progress: 25 },
    });

    // 2. Translate summary (50%)
    console.log(`Job ${queueId}: Translating summary...`);

    const translatedSummary = parsedData.summary
      ? await translateContent(
          parsedData.summary,
          sourceLanguage,
          targetLanguage
        )
      : null;

    await prisma.translationQueue.update({
      where: { id: queueId },
      data: { progress: 50 },
    });

    await prisma.translation.update({
      where: { id: translation.id },
      data: { summary: translatedSummary as string, progress: 50 },
    });

    // 3. Translate chapters (75%)
    console.log(`Job ${queueId}: Translating chapters...`);

    const translatedChapters = parsedData.chapters
      ? await translateContent(
          parsedData.chapters,
          sourceLanguage,
          targetLanguage
        )
      : null;

    await prisma.translationQueue.update({
      where: { id: queueId },
      data: { progress: 75 },
    });

    await prisma.translation.update({
      where: { id: translation.id },
      data: {
        chapters: JSON.stringify(translatedChapters),
        progress: 75,
      },
    });

    // 4. Translate utterances (100%)
    console.log(`Job ${queueId}: Translating utterances...`);

    const translatedUtterances = parsedData.utterances
      ? await translateUtterances(
          parsedData.utterances,
          sourceLanguage,
          targetLanguage
        )
      : null;

    // Save all translated content
    await prisma.translation.update({
      where: { id: translation.id },
      data: {
        utterances: JSON.stringify(translatedUtterances),
        status: TranslationStatus.COMPLETED,
        progress: 100,
      },
    });

    // Mark queue entry as completed
    await prisma.translationQueue.update({
      where: { id: queueId },
      data: {
        status: TranslationStatus.COMPLETED,
        progress: 100,
      },
    });

    console.log(`Translation job ${queueId} completed successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing translation:", error);
    const body = await request.json();
    // Update queue entry to failed if possible
    if (body?.queueId) {
      await prisma.translationQueue.update({
        where: { id: body.queueId },
        data: {
          status: TranslationStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to process translation" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
