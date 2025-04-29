import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    // Find the transcription
    const transcription = await prisma.transcription.findUnique({
      where: { resourceId },
      select: {
        id: true,
        language: true,
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      );
    }

    // Get all supported languages
    const supportedLanguages = ["en", "fr"];

    // Get statuses for all languages
    const result: Record<string, any> = {};

    for (const lang of supportedLanguages) {
      // Skip the original language
      if (lang === transcription.language) {
        result[lang] = {
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
        result[lang] = {
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
        result[lang] = {
          status: queueEntry.status,
          progress: queueEntry.progress,
          queueId: queueEntry.id,
          updatedAt: queueEntry.updatedAt,
        };
      } else {
        result[lang] = {
          status: "NOT_TRANSLATED",
          progress: 0,
        };
      }
    }

    return NextResponse.json({
      resourceId,
      originalLanguage: transcription.language,
      translations: result,
    });
  } catch (error) {
    console.error("Error getting translation status:", error);
    return NextResponse.json(
      { error: "Failed to get translation status" },
      { status: 500 }
    );
  }
}
