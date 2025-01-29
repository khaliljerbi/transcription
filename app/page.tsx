import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

import { getPreviewRessources } from "@/actions/ressources";
import { getBestThumbnail } from "@/lib/utils";
import { ClientInput } from "./resources/_components/ClientButton";

export default async function Home() {
  const previews = await getPreviewRessources();

  if (!previews || previews?.length === 0) return <p>no data...</p>;

  return (
    <main className="flex justify-center items-center min-h-screen flex-col space-y-8 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-semibold">Audio transcription</h1>
        <p className="text-muted-foreground">
          The only audio transcription you need
        </p>
      </div>

      {process.env.NODE_ENV === "development" && <ClientInput />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl px-4">
        {previews.map((preview) => (
          <Link
            key={preview.resourceId}
            href={`/resources/${preview.resourceId}?transcription=${preview.transcriptionId}`}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative w-full aspect-video">
                  <Image
                    src={getBestThumbnail(preview.thumbnail).url}
                    alt={preview.title}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <CardTitle className="line-clamp-2">
                    {preview.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {preview.summary}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Link href="/resources">
        <Button variant="outline" size="lg" className="mt-8">
          View All Resources
        </Button>
      </Link>
    </main>
  );
}
