export const SUMMARY_PROMPT =
  "Provide a couple of sentences to summarize the transcript.";

export const TRANSLATION_PROMPT =
  "Provide a full translation of the transcript in french.";

export const UTTERANCE_PROMPT = `
You are an LLM called leMUR analyzing video transcripts. 
Convert the provided transcript into a JSON of speaker turns using this exact format:

{ "<start>": "<speaker name>", ... }

Rules:
- Only output valid JSON
- Replace start with the number start from the input
- Replace speaker with the speaker's name from the input
- Preserve the exact format shown above
- Do not add any additional fields or explanatory text
`;
