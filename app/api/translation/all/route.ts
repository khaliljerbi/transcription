import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get all transcriptions
    const transcriptions = await prisma.transcription.findMany({
      select: {
        id: true,
        resourceId: true,
        title: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // For each transcription, get its translation status
    const result = await Promise.all(
      transcriptions.map(async (transcription) => {
        // Get translation status for each supported language
        const supportedLanguages = ["en", "fr"];
        const translations: Record<string, any> = {};

        for (const lang of supportedLanguages) {
          // Skip the original language
          if (lang === transcription.language) {
            translations[lang] = {
              status: "ORIGINAL_LANGUAGE",
              progress: 100,
              isOriginal: true,
            };
            continue;
          }

          // Check if there's a completed translation
          const translation = await prisma.translation.findUnique({
            where: {
              transcriptionId_language: {
                transcriptionId: transcription.id,
                language: lang,
              },
            },
            select: {
              status: true,
              progress: true,
              updatedAt: true,
            },
          });

          if (translation) {
            translations[lang] = {
              status: translation.status,
              progress: translation.progress,
              updatedAt: translation.updatedAt,
            };
            continue;
          }

          // Check for queued translation
          const queueEntry = await prisma.translationQueue.findFirst({
            where: {
              transcriptionId: transcription.id,
              targetLanguage: lang,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              status: true,
              progress: true,
              id: true,
              updatedAt: true,
            },
          });

          if (queueEntry) {
            translations[lang] = {
              status: queueEntry.status,
              progress: queueEntry.progress,
              queueId: queueEntry.id,
              updatedAt: queueEntry.updatedAt,
            };
          } else {
            translations[lang] = {
              status: "NOT_TRANSLATED",
              progress: 0,
            };
          }
        }

        return {
          resourceId: transcription.resourceId,
          title: transcription.title,
          originalLanguage: transcription.language || "en",
          translations,
          updatedAt: transcription.updatedAt,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching translations:", error);
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    );
  }
}
