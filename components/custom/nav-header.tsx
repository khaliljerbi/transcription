"use client";
import { UploadCloud } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";

export default function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center justify-around">
        <Link
          href="/"
          className="flex items-center gap-2 mx-2 hover:opacity-80 transition-opacity"
        >
          <UploadCloud className="h-6 w-6" />
          <h1 className="font-bold text-xl hidden sm:block">Transcription</h1>
        </Link>
        <Link
          href="/resources"
          className="ml-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Resources
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
