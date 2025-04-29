"use server";
import assembleyClient from "@/lib/assembly-ai";
import { DEFAULT_MODEL } from "@/lib/constants";
import prisma from "@/lib/db";
import groq from "@/lib/groq";
import {
  GENERAL_PROMPT,
  LEMUR_GLOBAL_CONTEXT,
  TRANSLATION_PROMPT,
  UTTERANCE_PROMPT,
} from "@/lib/prompts";
import { extractJsonObject } from "@/lib/utils";
import { TranscriptUtterance } from "assemblyai";

interface Transcriptions {
  summary: string | null;
  resourceId: string;
  transcriptionId: string;
}

export const handleRequest = async (
  transcriptions: Transcriptions[] | string,
  videoId: string,
  prompt: string
) => {
  if (typeof transcriptions === "string") {
    const transcript = await assembleyClient.transcripts.get(transcriptions);
    const finalResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: LEMUR_GLOBAL_CONTEXT(
            videoId,
            prompt,
            JSON.stringify(
              transcript.chapters?.map((c) => ({
                text: c.summary,
                start: c.start,
                end: c.end,
              }))
            )
          ),
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.2,
    });

    return finalResponse.choices[0].message.content || "";
  }

  const infoResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a search assistant. Analyze the query and extract key search terms and concepts.",
      },
      {
        role: "user",
        content: `Analyze this query for searching a transcript database.
                    If the query is not in English:
                    1. First translate it to English
                    2. Use the translated version for search terms
                          
                    Query: "${prompt}"
                          
                    Return JSON with:
                    {
                      "originalQuery": "the original query as provided",
                      "translatedQuery": "English translation (if original was not English, otherwise null)",
                      "searchTerms": ["array", "of", "search terms", "in English"],
                      "relevanceContext": "brief description of what makes a result relevant (in English)"
                    }
                          
                    Always return searchTerms in English regardless of input language.`,
      },
    ],
    model: DEFAULT_MODEL,
    response_format: { type: "json_object" },
    stream: false,
    temperature: 0.2,
  });

  const infos = JSON.parse(infoResponse.choices[0].message.content as string);
  const formatPhrase = (phrase: string) => {
    // Clean and format each individual word in the phrase
    const words = phrase
      .trim()
      .replace(/[&|!:*()]/g, "") // Remove special characters
      .split(/\s+/) // Split on whitespace
      .filter(Boolean); // Remove empty strings

    return words.join(" | ");
  };
  const searchQuery = infos.searchTerms
    .map((term: string) => formatPhrase(term))
    .filter(Boolean)
    .join(" | ");

  const searchResults = await prisma.transcription.findMany({
    where: {
      OR: [
        {
          text: {
            search: searchQuery,
          },
        },
        {
          title: {
            search: searchQuery,
          },
        },
        {
          summary: {
            search: searchQuery,
          },
        },
      ],
    },
    select: {
      resourceId: true,
      transcriptionId: true,
      title: true,
      summary: true,
      text: true,
      chapters: true,
    },
    take: 2,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!searchResults.length) {
    return '<div class="space-y-6"><p class="text-gray-600">No relevant results found for your query.</p></div>';
  }

  const relevantContent = searchResults.map((r) => ({
    chapters: r.chapters,
    resourceId: r.resourceId,
    transcriptionId: r.transcriptionId,
  }));

  const finalResponse = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: GENERAL_PROMPT(
          JSON.stringify(relevantContent, null, 2),
          prompt
        ),
      },
    ],
    model: DEFAULT_MODEL,
  });

  return finalResponse.choices[0].message.content || "";
};

export const getUtterancesApi = async (
  transcriptionId: string,
  utterances: TranscriptUtterance[]
) => {
  const { response } = await assembleyClient.lemur.task({
    transcript_ids: [transcriptionId],
    prompt:
      UTTERANCE_PROMPT +
      `\n uttrances=${JSON.stringify(
        utterances?.map(({ words, channel, confidence, ...rest }) => rest)
      )}`,
    final_model: "anthropic/claude-3-5-sonnet",
  });

  return response;
};

export async function updateUtterancesData(
  transcriptionId: string,
  utterances: TranscriptUtterance[],
  resourceId: string
) {
  try {
    const response = await getUtterancesApi(transcriptionId, utterances);

    const parsedData = JSON.parse(response);
    const updatedUtterances = utterances.map((ut) => ({
      ...ut,
      speaker: parsedData[ut.start as number],
    }));

    await prisma.transcription.update({
      where: { resourceId },
      data: {
        utterances: JSON.stringify(updatedUtterances),
      },
    });

    return updatedUtterances;
  } catch (error) {
    console.error("Error updating utterances:", error);
    throw error;
  }
}

export const handleTranslation = async (
  transcriptionId: string,
  language: string
) => {
  const data = [];
  const chunkSize = 1;
  const transcription = await assembleyClient.transcripts.get(transcriptionId);
  const utterances = transcription.utterances?.map(
    ({ channel, confidence, ...rest }) => rest
  );

  if (!utterances || utterances.length === 0) {
    return "";
  }

  while (data.length < utterances.length) {
    const startIdx = data.length;
    const endIdx = Math.min(startIdx + chunkSize, utterances.length);

    const currentChunk = utterances.slice(startIdx, endIdx);

    try {
      const finalResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: TRANSLATION_PROMPT(
              JSON.stringify(currentChunk, null, 2),
              language
            ),
          },
        ],
        model: DEFAULT_MODEL,
        temperature: 0.3,
      });

      const translatedChunk = JSON.parse(
        extractJsonObject(finalResponse.choices[0].message.content || "[]")
      );

      console.log("translatedChunk", translatedChunk);

      if (Array.isArray(translatedChunk)) {
        data.push(...translatedChunk);
      } else {
        throw new Error("API response format was not as expected");
      }
    } catch (error) {
      console.error(`Error translating chunk ${startIdx}-${endIdx}:`, error);

      throw error;
    }
  }

  return JSON.stringify(data);
};
