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
