"use server";
import assembleyClient from "@/lib/assembly-ai";
import prisma from "@/lib/db";
import {
  CHAPTERS_PROMPT,
  SUMMARY_PROMPT,
  UTTERANCE_PROMPT,
} from "@/lib/prompts";
import { queueNewTranslations } from "@/lib/refresh-translation";
import { TranslationStatus } from "@prisma/client";
import { Chapter, TranscribeParams } from "assemblyai";
import { Readable } from "stream";
import { getYoutubePublicUrl } from "./upload";

export const transcribeFile = async (fileUrl: string) => {
  try {
    const topics: Record<string, number> = {};
    let chapters: Chapter[] = [];

    const config: TranscribeParams = {
      audio_url: fileUrl,
      speech_model: "best",
      iab_categories: true,
      language_detection: true,
      auto_chapters: true,
      speaker_labels: true,
    };

    const transcript = await assembleyClient.transcripts.transcribe(config);
    const summaryPromise = assembleyClient.lemur.task({
      transcript_ids: [transcript.id],
      final_model: "anthropic/claude-3-5-sonnet",
      prompt: SUMMARY_PROMPT(transcript.language_code || "en"),
    });
    const utterancesPromise = assembleyClient.lemur.task({
      transcript_ids: [transcript.id],
      prompt:
        UTTERANCE_PROMPT +
        `\n uttrances=${JSON.stringify(
          transcript.utterances?.map(
            ({ words, channel, confidence, ...rest }) => rest
          )
        )}`,
      final_model: "anthropic/claude-3-5-sonnet",
    });

    const [{ response: summary }, { response: utterances }] = await Promise.all(
      [summaryPromise, utterancesPromise]
    );

    for (const [topic, relevance] of Object.entries(
      transcript.iab_categories_result!.summary
    )) {
      topics[topic] = relevance * 100;
    }

    const parsedData = JSON.parse(utterances);

    const updatedUtterances =
      transcript.utterances?.map(({ channel, confidence, ...ut }) => ({
        ...ut,
        speaker: parsedData[ut.start as number],
      })) ?? [];

    if (transcript.language_code === "fr") {
      const chaptersPromise = assembleyClient.lemur.task({
        transcript_ids: [transcript.id],
        prompt: CHAPTERS_PROMPT(
          JSON.stringify(
            transcript.utterances?.map(
              ({ words, channel, confidence, ...rest }) => rest
            )
          ),
          transcript.language_code
        ),
        final_model: "anthropic/claude-3-5-sonnet",
      });

      // const topicsPromise = assembleyClient.lemur.task({
      //   transcript_ids: [transcript.id],
      //   prompt: TRANSLATION_DATA_PROMPT(topics, "fr"),
      //   final_model: "anthropic/claude-3-5-sonnet",
      // });

      const [{ response: translatedChapters }] = await Promise.all([
        chaptersPromise,
      ]);

      chapters = JSON.parse(translatedChapters);
    }

    return {
      text: transcript.text,
      summary: summary,
      topics,
      words: transcript.words,
      chapters: chapters.length > 0 ? chapters : transcript.chapters,
      transcriptionId: transcript.id,
      utterances: updatedUtterances,
      language_code: transcript.language_code || "en",
    };
  } catch (error) {
    console.error("Transcription failed:", error);
  }
};

/**
 * Try to find existing transcription or create new one.
 *
 * @param {string} resourceId the resourceId to find or create the transcription.
 * @returns {Promise<TranscriptionResult>} the transcription result.
 */
// Inside assembley.ts, modify getOrCreateTranscription function
export async function getOrCreateTranscription(
  resourceId: string,
  language?: string
) {
  try {
    // Use the requested language or default to "en"
    const targetLanguage = language || "en";

    // Try to find existing transcription
    const existing = await prisma.transcription.findUnique({
      where: { resourceId },
      include: {
        translations: {
          where: {
            language: targetLanguage,
            status: TranslationStatus.COMPLETED,
          },
        },
      },
    });

    if (existing) {
      // Format base transcription data
      const result = {
        ...existing,
        chapters: JSON.parse(existing.chapters as string),
        topics: JSON.parse(existing.topics as string),
        words: JSON.parse(existing.words as string),
        utterances: JSON.parse(existing.utterances as string),
        thumbnail: JSON.parse(existing.thumbnail as string),
        language_code: existing.language || "en",
      };

      // If requested language is different from original language,
      // check for translations
      if (targetLanguage !== existing.language) {
        // If we have a completed translation, use it
        if (existing.translations.length > 0) {
          const translation = existing.translations[0];

          if (translation.text) result.text = translation.text;
          if (translation.summary) result.summary = translation.summary;
          if (translation.chapters) {
            result.chapters = JSON.parse(translation.chapters as string);
          }
          if (translation.utterances) {
            result.utterances = JSON.parse(translation.utterances as string);
          }

          result.language_code = targetLanguage;
        } else {
          // Check for translation in progress
          const queueEntry = await prisma.translationQueue.findFirst({
            where: {
              transcriptionId: existing.id,
              targetLanguage,
              status: {
                in: [TranslationStatus.PENDING, TranslationStatus.IN_PROGRESS],
              },
            },
            select: {
              id: true,
              status: true,
              progress: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          });

          // Add translation status if available
          if (queueEntry) {
            result.translationStatus = {
              status: queueEntry.status,
              progress: queueEntry.progress,
              queueId: queueEntry.id,
            };
          }
        }
      }

      return result;
    }

    // YouTube processing for a new transcription
    const data = await getYoutubePublicUrl(
      `https://www.youtube.com/watch?v=${resourceId}`
    );

    if (!data) {
      throw new Error("could not process the request");
    }

    const { audio, title, thumbnail } = data;

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
        transcriptionId: transcription.transcriptionId,
        text: transcription.text || "",
        summary: transcription.summary,
        topics: JSON.stringify(transcription.topics),
        chapters: JSON.stringify(transcription.chapters),
        words: JSON.stringify(transcription.words),
        utterances: JSON.stringify(transcription.utterances),
        title,
        thumbnail: JSON.stringify(thumbnail),
        language: transcription.language_code,
      },
    });

    const result = {
      ...saved,
      chapters: JSON.parse(saved.chapters as string),
      topics: JSON.parse(saved.topics as string),
      words: JSON.parse(saved.words as string),
      utterances: JSON.parse(saved.utterances as string),
      summary: saved.summary,
      title,
      thumbnail: JSON.parse(saved.thumbnail as string),
      language_code: saved.language,
    };

    // Queue translations for all supported languages in the background
    queueNewTranslations(resourceId).catch(console.error);

    return result;
  } catch (error) {
    console.error("****************error", error);
  }
}
