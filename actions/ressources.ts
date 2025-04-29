"use server";

import { Language } from "@/context/language-context";
import prisma from "@/lib/db";
import { TranslationStatus } from "@prisma/client";

export const fetchResources = async ({
  page,
  pageSize = 10,
  language = "en",
}: {
  page: number;
  pageSize: number;
  language?: Language;
}) => {
  try {
    const skip = (page - 1) * pageSize;

    // Fetch paginated data and total count
    const [list, total] = await Promise.all([
      prisma.transcription.findMany({
        select: {
          transcriptionId: true,
          resourceId: true,
          summary: true,
          thumbnail: true,
          title: true,
          language: true,
          id: true,
          translations: {
            where: {
              language: language,
              status: TranslationStatus.COMPLETED,
            },
            select: {
              summary: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transcription.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    const updatedList = list.map((l) => {
      // Use translated content if available, otherwise use original
      const translatedSummary = l.translations[0]?.summary || l.summary;
      const translatedTitle = l.translations[0]?.title || l.title;

      return {
        ...l,
        id: l.resourceId,
        title: translatedTitle,
        description: translatedSummary,
        summary: translatedSummary,
        thumbnail: JSON.parse(l.thumbnail) as Array<{
          url: string;
          width: number;
          height: number;
        }>,
        isTranslated: l.translations.length > 0,
        originalLanguage: l.language || "en",
      };
    });

    return {
      list: updatedList,
      total,
      totalPages,
      page,
      hasMore,
    };
  } catch (error) {
    console.error("Error in fetchResources:", error);
    throw error;
  }
};

export const getPreviewRessources = async (language: Language = "en") => {
  try {
    const list = await prisma.transcription.findMany({
      select: {
        transcriptionId: true,
        resourceId: true,
        summary: true,
        thumbnail: true,
        title: true,
        language: true,
        id: true,
        translations: {
          where: {
            language: language,
            status: TranslationStatus.COMPLETED,
          },
          select: {
            summary: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    return list.map((l) => {
      // Use translated content if available
      const translatedSummary = l.translations[0]?.summary || l.summary;
      const translatedTitle = l.translations[0]?.title || l.title;

      return {
        ...l,
        id: l.resourceId,
        title: translatedTitle,
        description: translatedSummary,
        summary: translatedSummary,
        thumbnail: JSON.parse(l.thumbnail) as Array<{
          url: string;
          width: number;
          height: number;
        }>,
        isTranslated: l.translations.length > 0,
        originalLanguage: l.language || "en",
      };
    });
  } catch (error) {
    console.error("error fetching data", error);
  }
};

export const getAllTranscriptions = async (language: Language = "en") => {
  try {
    const list = await prisma.transcription.findMany({
      select: {
        transcriptionId: true,
        resourceId: true,
        summary: true,
        id: true,
        language: true,
        translations: {
          where: {
            language: language,
            status: TranslationStatus.COMPLETED,
          },
          select: {
            summary: true,
            title: true,
          },
        },
      },
    });

    return list.map((l) => {
      // Use translated content if available
      const translatedSummary = l.translations[0]?.summary || l.summary;

      return {
        ...l,
        summary: translatedSummary,
        isTranslated: l.translations.length > 0,
        originalLanguage: l.language || "en",
      };
    });
  } catch (error) {
    console.error("error fetching data", error);
    return [];
  }
};

// New function to get translation status for a resource
export const getResourceTranslationStatus = async (
  resourceId: string,
  language: Language
) => {
  try {
    const transcription = await prisma.transcription.findUnique({
      where: { resourceId },
      select: {
        id: true,
        language: true,
      },
    });

    if (!transcription) {
      throw new Error("Transcription not found");
    }

    // If the requested language is the original language, no translation needed
    if (transcription.language === language) {
      return {
        status: "ORIGINAL_LANGUAGE",
        progress: 100,
      };
    }

    // Check if there's a completed translation
    const translation = await prisma.translation.findUnique({
      where: {
        transcriptionId_language: {
          transcriptionId: transcription.id,
          language,
        },
      },
      select: {
        status: true,
      },
    });

    if (translation && translation.status === TranslationStatus.COMPLETED) {
      return {
        status: TranslationStatus.COMPLETED,
        progress: 100,
      };
    }

    // Check for a queued or in-progress translation
    const queueEntry = await prisma.translationQueue.findFirst({
      where: {
        transcriptionId: transcription.id,
        targetLanguage: language,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
        progress: true,
      },
    });

    if (queueEntry) {
      return {
        status: queueEntry.status,
        progress: queueEntry.progress,
      };
    }

    return {
      status: "NOT_TRANSLATED",
      progress: 0,
    };
  } catch (error) {
    console.error("Error checking translation status:", error);
    throw error;
  }
};
