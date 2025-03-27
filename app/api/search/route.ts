import { handleRequest } from "@/actions/lemur";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/search
 * Endpoint for searching and answering questions from transcriptions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, videoId, transcriptionId } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    let response;

    if (videoId && transcriptionId) {
      // Search within a specific transcription
      response = await handleRequest(transcriptionId, videoId, query);
    } else {
      // Search across all transcriptions
      response = await handleRequest([], "", query);
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
