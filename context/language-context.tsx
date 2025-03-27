"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Basic translations for UI elements
const translations: Record<string, Record<string, string>> = {
  en: {
    summary: "Summary",
    chapters: "Chapters",
    topics: "Topics",
    transcript: "Transcript with Speaker",
    noSummary: "No summary available",
    noTopics: "No relevant topics found",
    showMore: "Show more",
    showLess: "Show less",
    readMore: "Read more",
    loading: "Loading...",
    noData: "No data...",
    pleaseWait: "Please wait...",
    previous: "Previous",
    next: "Next",
    tryAgain: "Try Again",
    failedToLoad: "Failed to load resources. Please try again later.",
    noDescription: "No description available",
    noThumbnail: "No thumbnail",
  },
  fr: {
    summary: "Résumé",
    chapters: "Chapitres",
    topics: "Sujets",
    transcript: "Transcription avec Intervenant",
    noSummary: "Aucun résumé disponible",
    noTopics: "Aucun sujet pertinent trouvé",
    showMore: "Voir plus",
    showLess: "Voir moins",
    readMore: "Lire plus",
    loading: "Chargement...",
    noData: "Pas de données...",
    pleaseWait: "Veuillez patienter...",
    previous: "Précédent",
    next: "Suivant",
    tryAgain: "Réessayer",
    failedToLoad:
      "Échec du chargement des ressources. Veuillez réessayer plus tard.",
    noDescription: "Aucune description disponible",
    noThumbnail: "Pas de miniature",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language preference from localStorage on client side
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Simple translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
