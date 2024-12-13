"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();
  return (
    <main className="flex justify-center items-center min-h-screen flex-col space-y-4">
      <h1 className="text-5xl font-semibold">Audio transcription</h1>
      <p className="text-muted-foreground">
        The only audio transcription you need
      </p>
      <div className="flex flex-col gap-2 md:flex-row md:w-1/3">
        <Input
          name="url"
          onChange={(e) => setUrl(e.target.value)}
          placeholder="video link..."
        />
        <Button
          className="md:w-1/2"
          onClick={() => router.push(`/resources/${url.split("?v=")[1]}`)}
        >
          Transcript
        </Button>
      </div>
    </main>
  );
}
