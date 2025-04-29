import prisma from "@/lib/db";
import { TranslationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const resourceId = searchParams.get("resourceId");
    const language = searchParams.get("language");

    if (!resourceId || !language) {
      return NextResponse.json(
        { error: "resourceId and language are required" },
        { status: 400 }
      );
    }

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

    // Find any queued or in-progress translation
    const queueEntry = await prisma.translationQueue.findFirst({
      where: {
        transcriptionId: transcription.id,
        targetLanguage: language,
        status: {
          in: [
            TranslationStatus.PENDING,
            TranslationStatus.IN_PROGRESS,
            TranslationStatus.COMPLETED,
            TranslationStatus.FAILED,
          ],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!queueEntry) {
      // Check if we already have a completed translation
      const existingTranslation = await prisma.translation.findUnique({
        where: {
          transcriptionId_language: {
            transcriptionId: transcription.id,
            language: language as string,
          },
        },
      });

      if (
        existingTranslation &&
        existingTranslation.status === TranslationStatus.COMPLETED
      ) {
        return NextResponse.json({
          status: TranslationStatus.COMPLETED,
          progress: 100,
          queueId: null,
        });
      }

      // No translation found
      return NextResponse.json({
        status: "NOT_FOUND",
        progress: 0,
        queueId: null,
      });
    }

    // Return the translation progress
    return NextResponse.json({
      status: queueEntry.status,
      progress: queueEntry.progress,
      queueId: queueEntry.id,
      error: queueEntry.error,
    });
  } catch (error) {
    console.error("Error getting translation progress:", error);
    return NextResponse.json(
      { error: "Failed to get translation progress" },
      { status: 500 }
    );
  }
}
