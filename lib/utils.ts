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
