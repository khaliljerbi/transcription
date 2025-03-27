import { Chapter, TranscriptUtterance, Word } from "assemblyai";

export interface TranscriptionResult {
  transcriptionId: string;
  topics: Record<string, number>;
  text: string | null | undefined;
  summary: string | null | undefined;
  words: Word[] | null | undefined;
  chapters: Chapter[] | null | undefined;
  utterances: TranscriptUtterance[];
  language_code?: string;
}
