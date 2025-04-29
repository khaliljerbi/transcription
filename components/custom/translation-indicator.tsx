"use client";

import { useLanguage } from "@/context/language-context";
import { TranslationStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface TranslationIndicatorProps {
  resourceId?: string;
  originalLanguage?: string;
  currentLanguage?: string;
  isTranslating?: boolean;
  translationStatus?: {
    status: string;
    progress: number;
    queueId?: string;
  };
}

// Updated TranslationIndicator component to prevent infinite API calls
export const TranslationIndicator: React.FC<TranslationIndicatorProps> = ({
  resourceId,
  originalLanguage = "en",
  currentLanguage,
  isTranslating = false,
  translationStatus: initialStatus,
}) => {
  const { language } = useLanguage();
  const [translationStatus, setTranslationStatus] = useState<{
    status: string;
    progress: number;
  } | null>(initialStatus || null);
  const [visible, setVisible] = useState(false);

  // Add a ref to track if we should stop polling
  const shouldPoll = useRef(true);

  // Use the language from context if not explicitly provided
  const targetLanguage = currentLanguage || language;

  // Update local state if initialStatus is provided or changes
  useEffect(() => {
    if (initialStatus) {
      setTranslationStatus(initialStatus);
      setVisible(true);

      // If status is completed, don't need to poll
      if (initialStatus.status === TranslationStatus.COMPLETED) {
        shouldPoll.current = false;
        setTimeout(() => setVisible(false), 3000);
      }
    }
  }, [initialStatus]);

  useEffect(() => {
    // Skip if original language matches target language
    if (originalLanguage === targetLanguage) {
      setVisible(false);
      shouldPoll.current = false;
      return;
    }

    // Show indicator when actively translating
    if (isTranslating) {
      setVisible(true);
    }

    if (!resourceId) {
      shouldPoll.current = false;
      return;
    }

    let mounted = true;
    shouldPoll.current = true;

    const checkStatus = async () => {
      // Only check if we should be polling
      if (!shouldPoll.current) return;

      try {
        const response = await fetch(
          `/api/translation/status?resourceId=${resourceId}&language=${targetLanguage}`
        );

        if (response.ok && mounted) {
          const data = await response.json();
          const langStatus = data.translations[targetLanguage];

          if (langStatus) {
            setTranslationStatus(langStatus);

            // Show indicator for active translations
            if (
              langStatus.status === TranslationStatus.IN_PROGRESS ||
              langStatus.status === TranslationStatus.PENDING
            ) {
              setVisible(true);
            }

            // Hide indicator when complete after a delay
            if (langStatus.status === TranslationStatus.COMPLETED) {
              setVisible(true); // Keep visible briefly
              shouldPoll.current = false; // Stop polling when complete
              setTimeout(() => {
                if (mounted) setVisible(false);
              }, 3000);
            }

            // Stop polling if failed
            if (langStatus.status === TranslationStatus.FAILED) {
              shouldPoll.current = false;
            }
          }
        }
      } catch (error) {
        console.error("Error checking translation status:", error);
      }
    };

    // Initial check
    checkStatus();

    // Set up polling with a ref-based check
    const interval = setInterval(() => {
      if (shouldPoll.current) {
        checkStatus();
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [resourceId, targetLanguage, originalLanguage, isTranslating]);

  if (!visible) return null;

  // Calculate progress percentage
  const progress = translationStatus?.progress || 0;

  // Determine status message
  let statusMessage = "Translating...";
  if (translationStatus) {
    if (translationStatus.status === TranslationStatus.COMPLETED) {
      statusMessage = "Translation complete!";
    } else if (translationStatus.status === TranslationStatus.FAILED) {
      statusMessage = "Translation failed";
    } else if (translationStatus.status === TranslationStatus.PENDING) {
      statusMessage = "Translation queued";
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 max-w-xs z-50 flex items-center gap-3">
      {translationStatus?.status !== TranslationStatus.COMPLETED && (
        <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
      )}
      <div>
        <div className="text-sm font-medium">{statusMessage}</div>
        {(translationStatus?.status === TranslationStatus.IN_PROGRESS ||
          translationStatus?.status === TranslationStatus.PENDING) && (
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
