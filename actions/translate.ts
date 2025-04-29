"use server";

import { Language } from "@/context/language-context";
import { DEFAULT_MODEL, FALLBACK_MODEL } from "@/lib/constants";
import prisma from "@/lib/db";
import groq from "@/lib/groq";
import {
  EFFICIENT_TRANSLATION_PROMPT,
  JSON_TRANSLATION_PROMPT,
} from "@/lib/prompts";
import { TranscriptionResult } from "@/types/transcription";
import { TranslationStatus } from "@prisma/client";
import { Client } from "@upstash/qstash";
import { TranscriptUtterance } from "assemblyai";

// Original utility functions (kept as-is)
function extractCleanJson(response: string): string {
  if (!response) return "[]";

  // 1. Look for common prefixes and remove them
  const commonPrefixes = [
    "Here is the translated JSON data in French:",
    "Here is the translated JSON in French:",
    "Here's the translated JSON data in French:",
    "Here is the translated JSON:",
    "Here's the translated JSON:",
    "Voici les données JSON traduites:",
    "Translated JSON data:",
    "The translation:",
    "Translated content:",
    "Translation:",
  ];

  let cleanedContent = response;
  for (const prefix of commonPrefixes) {
    if (cleanedContent.includes(prefix)) {
      cleanedContent = cleanedContent
        .substring(cleanedContent.indexOf(prefix) + prefix.length)
        .trim();
    }
  }

  // 2. Look for the first { or [ character to start the JSON
  const firstBrace = cleanedContent.indexOf("{");
  const firstBracket = cleanedContent.indexOf("[");

  let jsonStart = -1;
  if (firstBrace >= 0 && firstBracket >= 0) {
    jsonStart = Math.min(firstBrace, firstBracket);
  } else if (firstBrace >= 0) {
    jsonStart = firstBrace;
  } else if (firstBracket >= 0) {
    jsonStart = firstBracket;
  }

  if (jsonStart >= 0) {
    cleanedContent = cleanedContent.substring(jsonStart);
  }

  // 3. Find the matching closing bracket/brace
  if (cleanedContent.startsWith("[")) {
    // Count brackets to find the proper closing one
    let openBrackets = 0;
    let closePosition = -1;

    for (let i = 0; i < cleanedContent.length; i++) {
      if (cleanedContent[i] === "[") openBrackets++;
      if (cleanedContent[i] === "]") {
        openBrackets--;
        if (openBrackets === 0) {
          closePosition = i;
          break;
        }
      }
    }

    if (closePosition >= 0) {
      cleanedContent = cleanedContent.substring(0, closePosition + 1);
    } else {
      // Fallback: just find the last bracket
      const lastBracket = cleanedContent.lastIndexOf("]");
      if (lastBracket >= 0) {
        cleanedContent = cleanedContent.substring(0, lastBracket + 1);
      }
    }
  } else if (cleanedContent.startsWith("{")) {
    // Count braces to find the proper closing one
    let openBraces = 0;
    let closePosition = -1;

    for (let i = 0; i < cleanedContent.length; i++) {
      if (cleanedContent[i] === "{") openBraces++;
      if (cleanedContent[i] === "}") {
        openBraces--;
        if (openBraces === 0) {
          closePosition = i;
          break;
        }
      }
    }

    if (closePosition >= 0) {
      cleanedContent = cleanedContent.substring(0, closePosition + 1);
    } else {
      // Fallback: just find the last brace
      const lastBrace = cleanedContent.lastIndexOf("}");
      if (lastBrace >= 0) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }
    }
  }

  // 4. Remove any trailing text
  if (cleanedContent.endsWith("]") || cleanedContent.endsWith("}")) {
    return cleanedContent;
  } else {
    // Try to find the end of the JSON
    const lastBracket = cleanedContent.lastIndexOf("]");
    const lastBrace = cleanedContent.lastIndexOf("}");
    const jsonEnd = Math.max(lastBracket, lastBrace);

    if (jsonEnd >= 0) {
      return cleanedContent.substring(0, jsonEnd + 1);
    }
  }

  // If we couldn't clean it properly, return the original
  return cleanedContent;
}

// Use a smaller model for basic translations to save on token usage
const getTranslationModel = (contentLength: number) => {
  // For very short content, use a smaller, more efficient model
  if (contentLength < 500) {
    return DEFAULT_MODEL;
  }
  // For medium content
  else if (contentLength < 2000) {
    return FALLBACK_MODEL;
  }
  // For larger content, use the more capable model
  return "llama-guard-3-8b";
};

// Utility function to handle API calls with fallback
async function callGroqWithFallback(
  content: string,
  promptFn: (content: string, lang: string) => string,
  targetLanguage: string
) {
  const preferredModel = getTranslationModel(content.length);

  try {
    // Try with the preferred model first
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: promptFn(content, targetLanguage),
        },
      ],
      model: preferredModel,
      temperature: 0.2,
    });

    return response;
  } catch (error: any) {
    // If we hit a rate limit or token limit issue
    if (
      error?.message?.includes("rate_limit_exceeded") ||
      error?.message?.includes("too large")
    ) {
      console.warn(
        `Rate limit exceeded with ${preferredModel}, falling back to simpler model`
      );

      // If we were already using the small model, reduce content size further
      if (preferredModel === DEFAULT_MODEL) {
        // For text content, take the first 1000 characters
        const truncatedContent =
          content.length > 1000 ? content.substring(0, 1000) + "..." : content;

        const response = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: promptFn(truncatedContent, targetLanguage),
            },
          ],
          model: FALLBACK_MODEL,
          temperature: 0.2,
        });

        return response;
      }

      // Try with a smaller model
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: promptFn(content, targetLanguage),
          },
        ],
        model: FALLBACK_MODEL,
        temperature: 0.2,
      });

      return response;
    }

    // Re-throw other errors
    throw error;
  }
}

// Modified translate content - now checks for cached translations first
export async function translateContent(
  content: string | object | null | undefined,
  sourceLanguage: string,
  targetLanguage: string
) {
  if (!content) return content;

  try {
    if (sourceLanguage === targetLanguage) {
      return content; // No translation needed
    }

    // If content is JSON, handle it separately
    if (typeof content === "object") {
      return await translateJsonContent(content, targetLanguage, 0);
    }

    // Handle string content
    const contentStr = String(content);

    // If content is small enough, translate directly
    if (contentStr.length < 1500) {
      try {
        const finalResponse = await callGroqWithFallback(
          contentStr,
          EFFICIENT_TRANSLATION_PROMPT,
          targetLanguage
        );

        return finalResponse.choices[0].message.content || "";
      } catch (error) {
        console.error("Translation failed even with fallback:", error);
        return contentStr; // Return original on complete failure
      }
    }

    // For larger content, split into chunks and translate each chunk
    return await translateLargeText(contentStr, targetLanguage);
  } catch (error) {
    console.error("Translation error:", error);
    return content; // Return original on error
  }
}

// Function to translate large text by splitting into chunks
async function translateLargeText(text: string, targetLanguage: string) {
  // Split at sentence boundaries to maintain context
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  // Create chunks of approximately 1000 characters
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 1000) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Translate each chunk
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    try {
      const response = await callGroqWithFallback(
        chunk,
        EFFICIENT_TRANSLATION_PROMPT,
        targetLanguage
      );

      translatedChunks.push(response.choices[0].message.content || "");
    } catch (error) {
      console.error("Error translating chunk:", error);
      translatedChunks.push(chunk); // Use original on error
    }
  }

  // Join translated chunks
  return translatedChunks.join(" ");
}

// Modified function to prevent infinite recursion
async function translateJsonContent(
  content: object,
  targetLanguage: string,
  depth: number = 0
) {
  // Add a depth limit to prevent infinite recursion
  if (depth > 5) {
    console.warn(
      "Maximum translation depth reached, returning original content"
    );
    return content;
  }

  // Convert to string for easier processing
  const contentStr = JSON.stringify(content);

  // For small JSON objects, translate directly
  if (contentStr.length < 1500) {
    try {
      const finalResponse = await callGroqWithFallback(
        contentStr,
        JSON_TRANSLATION_PROMPT,
        targetLanguage
      );

      const translatedContent = finalResponse.choices[0].message.content || "";
      const cleanedJsonContent = extractCleanJson(translatedContent);

      try {
        return JSON.parse(cleanedJsonContent);
      } catch (e) {
        console.error("Failed to parse translated JSON:", e);
        return content;
      }
    } catch (e) {
      console.error("Failed to translate JSON content:", e);
      return content;
    }
  }

  // For larger JSON objects, process them by key
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    // Handle arrays
    if (Array.isArray(parsed)) {
      const results = [];
      for (let i = 0; i < parsed.length; i += 5) {
        const chunk = parsed.slice(i, i + 5);
        // Pass translationJsonContent directly for object types
        const translatedChunk = await Promise.all(
          chunk.map(async (item) => {
            if (typeof item === "string") {
              return await translateContent(item, "auto", targetLanguage);
            } else if (typeof item === "object" && item !== null) {
              // Increment depth when translating nested objects
              return await translateJsonContent(
                item,
                targetLanguage,
                depth + 1
              );
            }
            return item;
          })
        );
        results.push(...translatedChunk);
      }
      return results;
    }

    // Handle objects by translating each value appropriately
    const translatedObj = { ...parsed };
    for (const key in translatedObj) {
      if (
        typeof translatedObj[key] === "string" &&
        translatedObj[key].length > 0
      ) {
        // Translate string values directly
        translatedObj[key] = await translateContent(
          translatedObj[key],
          "auto",
          targetLanguage
        );
      } else if (
        typeof translatedObj[key] === "object" &&
        translatedObj[key] !== null
      ) {
        // Process nested objects with incremented depth
        translatedObj[key] = await translateJsonContent(
          translatedObj[key],
          targetLanguage,
          depth + 1
        );
      }
    }
    return translatedObj;
  } catch (error) {
    console.error(
      `Error processing JSON for translation (depth ${depth}):`,
      error
    );
    return content;
  }
}
// Map translated text to original words with timing
function mapTranslatedTextToWords(
  originalWords: any[],
  translatedText: string
): any[] {
  if (!originalWords || originalWords.length === 0 || !translatedText) {
    return originalWords;
  }

  // Split the translated text into words
  const translatedWords = translatedText
    .split(/\s+/)
    .filter((w) => w.trim().length > 0);

  // If no translated words were found, return original
  if (translatedWords.length === 0) {
    return originalWords;
  }

  // Create new word objects with the translated text but original timing
  const result = [];

  if (translatedWords.length <= originalWords.length) {
    // If we have fewer or equal translated words, map them directly
    for (let i = 0; i < originalWords.length; i++) {
      result.push({
        ...originalWords[i],
        text:
          i < translatedWords.length
            ? translatedWords[i]
            : originalWords[i].text,
      });
    }
  } else {
    // If we have more translated words than original, we need to combine some
    const ratio = translatedWords.length / originalWords.length;

    for (let i = 0; i < originalWords.length; i++) {
      const startIdx = Math.floor(i * ratio);
      const endIdx = Math.floor((i + 1) * ratio);

      if (startIdx === endIdx) {
        // Just one translated word maps to this original word
        result.push({
          ...originalWords[i],
          text: translatedWords[startIdx],
        });
      } else {
        // Multiple translated words map to this original word, combine them
        const combinedText = translatedWords.slice(startIdx, endIdx).join(" ");
        result.push({
          ...originalWords[i],
          text: combinedText,
        });
      }
    }
  }

  return result;
}

// Translate utterances by first translating the text, then mapping to words
export async function translateUtterances(
  utterances: TranscriptUtterance[],
  sourceLanguage: string,
  targetLanguage: string
) {
  if (!utterances || utterances.length === 0) {
    return utterances;
  }

  // If already in target language, return as is
  if (sourceLanguage === targetLanguage) {
    return utterances;
  }

  try {
    const translatedUtterances = [];

    // Process in batches of 5 utterances at a time to avoid token limits
    const batchSize = 5;

    for (let i = 0; i < utterances.length; i += batchSize) {
      const batch = utterances.slice(i, i + batchSize);

      // Extract just the text content from each utterance
      const textPromises = batch.map((utterance) =>
        translateContent(utterance.text, sourceLanguage, targetLanguage)
      );

      // Translate all texts in the batch in parallel
      const translatedTexts = await Promise.all(textPromises);

      // Map translated texts back to utterances and derive words
      for (let j = 0; j < batch.length; j++) {
        const utterance = batch[j];
        const translatedText = translatedTexts[j] || utterance.text;

        // If this utterance has words, map the translated text to words
        const translatedWords =
          utterance.words && utterance.words.length > 0
            ? mapTranslatedTextToWords(utterance.words, translatedText)
            : utterance.words;

        // Add the translated utterance to our results
        translatedUtterances.push({
          ...utterance,
          text: translatedText,
          words: translatedWords,
        });
      }
    }

    return translatedUtterances;
  } catch (error) {
    console.error("Error translating utterances:", error);

    // If batch translation fails, try one by one as fallback
    try {
      return await Promise.all(
        utterances.map(async (utterance) => {
          try {
            const translatedText = (await translateContent(
              utterance.text,
              sourceLanguage,
              targetLanguage
            )) as string;

            // Map translated text to words
            const translatedWords =
              utterance.words && utterance.words.length > 0
                ? mapTranslatedTextToWords(utterance.words, translatedText)
                : utterance.words;

            return {
              ...utterance,
              text: translatedText,
              words: translatedWords,
            };
          } catch (e) {
            console.error("Individual utterance translation failed:", e);
            return utterance; // Return original on error
          }
        })
      );
    } catch (fallbackError) {
      console.error(
        "All utterance translation approaches failed:",
        fallbackError
      );
      return utterances; // Return all originals on complete failure
    }
  }
}

export async function translateTranscription(
  transcription: TranscriptionResult,
  targetLanguage: Language
) {
  if (!transcription) return null;

  // Get the detected language from the transcription
  const sourceLanguage = transcription.language_code || "en";

  // If already in target language, no translation needed
  if (sourceLanguage === targetLanguage) {
    return transcription;
  }

  try {
    // Look up the resource in our database
    const dbTranscription = await prisma.transcription.findUnique({
      where: { resourceId: transcription.resourceId },
    });

    if (!dbTranscription) {
      console.error("Transcription not found in database");
      return transcription; // Return original if not found in DB
    }

    // Check if we have a completed translation
    const translation = await prisma.translation.findUnique({
      where: {
        transcriptionId_language: {
          transcriptionId: dbTranscription.id,
          language: targetLanguage,
        },
      },
    });

    // If we have a completed translation, use it
    if (translation && translation.status === TranslationStatus.COMPLETED) {
      const translatedResult = { ...transcription };

      if (translation.text) translatedResult.text = translation.text;
      if (translation.summary) translatedResult.summary = translation.summary;
      if (translation.chapters) {
        translatedResult.chapters = JSON.parse(translation.chapters as string);
      }
      if (translation.utterances) {
        translatedResult.utterances = JSON.parse(
          translation.utterances as string
        );
      }

      return translatedResult;
    }

    // Check for a translation in progress
    const queueEntry = await prisma.translationQueue.findFirst({
      where: {
        transcriptionId: dbTranscription.id,
        targetLanguage,
        status: {
          in: [TranslationStatus.PENDING, TranslationStatus.IN_PROGRESS],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If no job is in progress, queue one
    if (!queueEntry) {
      // Create a queue entry in our database
      const newQueueEntry = await prisma.translationQueue.create({
        data: {
          transcriptionId: dbTranscription.id,
          sourceLanguage,
          targetLanguage,
          status: TranslationStatus.PENDING,
          progress: 0,
        },
      });

      // Queue the background job using QStash
      const qstash = new Client({ token: process.env.QSTASH_TOKEN || "" });
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-translation`,
        body: {
          queueId: newQueueEntry.id,
          transcriptionId: dbTranscription.id,
          sourceLanguage,
          targetLanguage,
        },
      });

      // Set for return value
      const translatedResult = { ...transcription };

      // Do minimal translation for immediate display (just summary)
      if (transcription.summary) {
        translatedResult.summary = await translateContent(
          transcription.summary,
          sourceLanguage,
          targetLanguage
        );
      }

      // Add the translation status
      translatedResult.translationStatus = {
        status: TranslationStatus.PENDING,
        progress: 0,
        queueId: newQueueEntry.id,
      };

      return translatedResult;
    }

    // If a job is already in progress, return current state with status
    const translatedResult = { ...transcription };

    // If we have a partial translation, use what we have
    if (translation) {
      if (translation.summary) translatedResult.summary = translation.summary;
      if (translation.text) translatedResult.text = translation.text;
      if (translation.chapters) {
        translatedResult.chapters = JSON.parse(translation.chapters as string);
      }
      if (translation.utterances) {
        translatedResult.utterances = JSON.parse(
          translation.utterances as string
        );
      }
    } else {
      // If no partial translation exists, do quick summary translation
      if (transcription.summary) {
        translatedResult.summary = await translateContent(
          transcription.summary,
          sourceLanguage,
          targetLanguage
        );
      }
    }

    // Add the translation status for progress tracking
    translatedResult.translationStatus = {
      status: queueEntry.status,
      progress: queueEntry.progress,
      queueId: queueEntry.id,
    };

    return translatedResult;
  } catch (error) {
    console.error("Error in translateTranscription:", error);
    return transcription; // Return original on error
  }
}
