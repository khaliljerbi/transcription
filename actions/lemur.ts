"use server";
import assembleyClient from "@/lib/assembly-ai";
import prisma from "@/lib/db";
import {
  GENERAL_PROMPT,
  LEMUR_GLOBAL_CONTEXT,
  UTTERANCE_PROMPT,
} from "@/lib/prompts";
import { LemurTaskParams, TranscriptUtterance } from "assemblyai";

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
  let params: LemurTaskParams = {
    final_model: "anthropic/claude-3-5-sonnet",
    temperature: 0.7,
    prompt: "",
  };

  if (typeof transcriptions === "string") {
    const transcript = await assembleyClient.transcripts.get(transcriptions);
    params = {
      ...params,
      transcript_ids: [transcriptions],
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
    };
  } else {
    params = {
      ...params,
      input_text: JSON.stringify(transcriptions),
      prompt: GENERAL_PROMPT(JSON.stringify(transcriptions), prompt),
    };
  }
  const { response } = await assembleyClient.lemur.task(params);

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
