"use server";
import assembleyClient from "@/lib/assembly-ai";
import { UTTERANCE_PROMPT } from "@/lib/prompts";
import { TranscriptUtterance } from "assemblyai";

export const handleRequest = async (
  transcriptionId: string,
  prompt: string
) => {
  const { response } = await assembleyClient.lemur.task({
    transcript_ids: [transcriptionId],
    prompt,
    final_model: "anthropic/claude-3-5-sonnet",
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
