import { getOrCreateTranscription } from "@/actions/assembley";
import { handleTranslation } from "@/actions/lemur";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const data = await getOrCreateTranscription(id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Failed to get or create transcription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching transcription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transcription" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, language } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === "translate") {
      if (!language) {
        return NextResponse.json(
          { success: false, error: "Language is required for translation" },
          { status: 400 }
        );
      }

      // Get the transcription
      const transcription = await getOrCreateTranscription(id);

      if (!transcription) {
        return NextResponse.json(
          { success: false, error: "Transcription not found" },
          { status: 404 }
        );
      }

      // Translate the utterances
      const translatedData = await handleTranslation(
        transcription.transcriptionId,
        language
      );

      return NextResponse.json({
        success: true,
        data: JSON.parse(translatedData),
      });
    }

    // Handle other actions in the future

    return NextResponse.json(
      { success: false, error: "Unsupported action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing transcription action:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
