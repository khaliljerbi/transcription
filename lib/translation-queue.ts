// lib/translation-queue.ts
import { Language } from "@/context/language-context";
import prisma from "@/lib/db";
import { TranslationStatus } from "@prisma/client";
import { Client } from "@upstash/qstash";

// Create QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Queue a translation job
export async function queueTranslation(
  resourceId: string,
  sourceLanguage: string,
  targetLanguage: Language,
  priority: number = 5
) {
  try {
    // Get the transcription
    const transcription = await prisma.transcription.findUnique({
      where: { resourceId },
    });

    if (!transcription) {
      throw new Error(`Transcription not found: ${resourceId}`);
    }

    // Check if there's already a queued or in-progress translation
    const existingQueue = await prisma.translationQueue.findFirst({
      where: {
        transcriptionId: transcription.id,
        targetLanguage,
        status: {
          in: [TranslationStatus.PENDING, TranslationStatus.IN_PROGRESS],
        },
      },
    });

    if (existingQueue) {
      // Update the priority if needed
      if (existingQueue.priority < priority) {
        await prisma.translationQueue.update({
          where: { id: existingQueue.id },
          data: { priority, updatedAt: new Date() },
        });
      }
      return existingQueue.id;
    }

    // Create a new queue entry
    const queueEntry = await prisma.translationQueue.create({
      data: {
        transcriptionId: transcription.id,
        sourceLanguage,
        targetLanguage,
        priority,
        status: TranslationStatus.PENDING,
        progress: 0,
      },
    });

    // Calculate delay based on priority (higher priority = less delay)
    const delaySeconds = Math.max(0, 10 - priority) * 10;

    // Send to QStash
    const endpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/process-translation`;

    await qstash.publishJSON({
      url: endpoint,
      body: {
        queueId: queueEntry.id,
        transcriptionId: transcription.id,
        sourceLanguage,
        targetLanguage,
        priority,
      },
      delay: delaySeconds,
    });

    return queueEntry.id;
  } catch (error) {
    console.error("Error queueing translation:", error);
    throw error;
  }
}

// Get translation progress - keep this function as is
export async function getTranslationProgress(queueId: string) {
  try {
    const queueEntry = await prisma.translationQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueEntry) {
      return { status: "NOT_FOUND", progress: 0 };
    }

    return {
      status: queueEntry.status,
      progress: queueEntry.progress,
      error: queueEntry.error,
    };
  } catch (error) {
    console.error("Error getting translation progress:", error);
    throw error;
  }
}
