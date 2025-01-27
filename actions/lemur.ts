"use server";
import assembleyClient from "@/lib/assembly-ai";
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
    temperature: 0.5,
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
    final_model: "anthropic/claude-3-opus",
  });

  return response;
};
