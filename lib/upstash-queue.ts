import { Queue } from "@upstash/queue";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL as string,
  token: process.env.UPSTASH_REDIS_TOKEN as string,
});
// Create the translation queue
export const translationQueue = new Queue({
  queueName: "translation-queue",
  //@ts-ignore - Force type compatibility
  redis,
  concurrencyLimit: 5,
});

export interface TranslationJob {
  resourceId: string;
  transcriptionId: string;
  sourceLanguage: string;
  targetLanguage: string;
  priority: number;
}
