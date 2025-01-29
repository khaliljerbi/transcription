"use server";
import assembleyClient from "@/lib/assembly-ai";
import prisma from "@/lib/db";
import { LEMUR_GLOBAL_CONTEXT, UTTERANCE_PROMPT } from "@/lib/prompts";
import { TranscriptUtterance } from "assemblyai";

export const handleRequest = async (
  transcriptionId: string,
  videoId: string,
  prompt: string
) => {
  const transcript = await assembleyClient.transcripts.get(transcriptionId);
  const { response } = await assembleyClient.lemur.task({
    transcript_ids: [transcriptionId],
    prompt: LEMUR_GLOBAL_CONTEXT(
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
    final_model: "anthropic/claude-3-5-sonnet",
    temperature: 0.3,
  });

  return response;
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
