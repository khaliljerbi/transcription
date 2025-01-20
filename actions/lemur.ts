"use server";
import assembleyClient from "@/lib/assembly-ai";

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
