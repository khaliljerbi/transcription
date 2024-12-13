"use client";

import { UploadCloud } from "lucide-react";
import Link from "next/link";

export default function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mx-4"
        >
          <UploadCloud className="h-6 w-6" />
          <h1 className="font-bold text-xl hidden sm:block">Transcription</h1>
        </Link>
      </div>
    </header>
  );
}
