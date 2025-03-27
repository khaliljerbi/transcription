// Separate client component for the input section
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClientInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  return (
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
  );
}
