import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTopic = (str: string) => {
  return str
    .split(">")
    .pop()
    ?.replace(/([A-Z])/g, " $1");
};

export const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export const formatResponse = (text: string) => {
  return text
    .replace(/<p>/g, '<p class="text-gray-700 mb-4">')
    .replace(/<a /g, '<a class="text-blue-500 hover:text-blue-700 underline" ')
    .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
    .replace(/<li>/g, '<li class="mb-2">')
    .replace(/<h3>/g, '<h3 class="text-xl font-bold mb-3">');
};

// Get the best thumbnail for display
export const getBestThumbnail = (
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[]
) => {
  const sortedThumbnails = [...thumbnails].sort((a, b) => a.width - b.width);
  const mediumIndex = Math.floor(sortedThumbnails.length / 2);
  return sortedThumbnails[mediumIndex] || sortedThumbnails[0];
};

// Function to extract a JSON object from a text string
export function extractJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const objectMatch = text.match(/({[\s\S]*?})/);

    if (objectMatch && objectMatch[1]) {
      try {
        return JSON.parse(objectMatch[1]);
      } catch (parseError) {
        console.error("Found object-like text but couldn't parse:", parseError);

        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
          const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(jsonCandidate);
          } catch (error) {
            console.error("Failed to parse extracted JSON candidate:", error);
          }
        }
      }
    }

    throw new Error("Couldn't extract a valid JSON object from the string");
  }
}
