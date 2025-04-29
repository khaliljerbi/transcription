"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/language-context";
import { useEffect } from "react";

interface LanguageSwitcherProps {
  resourceId?: string;
  sourceLanguage?: string;
}

export function LanguageSwitcher({
  resourceId,
  sourceLanguage,
}: LanguageSwitcherProps) {
  const { language, setLanguage, isChangingLanguage } = useLanguage();

  // When the language changes or a new resource is viewed, queue a background translation
  useEffect(() => {
    if (!resourceId || language === sourceLanguage) return;

    // Queue the translation in the background
    const queueTranslation = async () => {
      try {
        await fetch("/api/translation/queue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resourceId,
            sourceLanguage: sourceLanguage || "en",
            targetLanguage: language,
            priority: 5, // Medium priority
          }),
        });
      } catch (error) {
        console.error("Error queueing translation:", error);
      }
    };

    queueTranslation();
  }, [language, resourceId, sourceLanguage]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-8 h-8"
          disabled={isChangingLanguage}
        >
          <span className="font-medium text-sm">
            {isChangingLanguage ? "..." : language.toUpperCase()}
          </span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={language === "en" ? "bg-blue-50" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("fr")}
          className={language === "fr" ? "bg-blue-50" : ""}
        >
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
