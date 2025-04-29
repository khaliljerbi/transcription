import { Chapter, TranscriptUtterance, Word } from "assemblyai";

export interface TranscriptionResult {
  // Original fields
  transcriptionId: string;
  topics: Record<string, number>;
  text: string | null | undefined;
  summary: string | null | undefined;
  words: Word[] | null | undefined;
  chapters: Chapter[] | null | undefined;
  utterances: TranscriptUtterance[];
  language_code?: string;

  // Additional fields needed for the translation system
  resourceId?: string;
  id?: string; // Database ID
  title?: string;
  thumbnail?: unknown;
  originalLanguage?: string;
  isTranslated?: boolean;

  // Translation status information
  translationStatus?: {
    status: string; // Can be TranslationStatus enum or "NOT_FOUND"
    progress: number;
    queueId?: string;
  } | null;
}
