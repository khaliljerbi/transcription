"use server";

import { Language } from "@/context/language-context";
import prisma from "@/lib/db";
import { queueTranslation } from "./translation-queue";

/**
 * When a new transcription is created, queue translations for all supported languages
 */
export async function queueNewTranslations(resourceId: string) {
  try {
    // Find the transcription
    const transcription = await prisma.transcription.findUnique({
      where: { resourceId },
    });

    if (!transcription) {
      console.error(`Transcription not found: ${resourceId}`);
      return;
    }

    const sourceLanguage = transcription.language || "en";

    // Queue translations for all supported languages except the source
    const languages: Language[] = ["en", "fr"];

    for (const lang of languages) {
      if (lang !== sourceLanguage) {
        await queueTranslation(resourceId, sourceLanguage, lang, 7); // Medium-high priority (7/10)
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error queueing new translations:", error);
    throw error;
  }
}
