import { queueTranslation } from "@/lib/translation-queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, sourceLanguage, targetLanguage, priority } = body;

    if (!resourceId || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        {
          error: "resourceId, sourceLanguage, and targetLanguage are required",
        },
        { status: 400 }
      );
    }

    // Queue the translation
    const queueId = await queueTranslation(
      resourceId,
      sourceLanguage,
      targetLanguage,
      priority || 5
    );

    return NextResponse.json({
      success: true,
      queueId,
    });
  } catch (error) {
    console.error("Error queueing translation:", error);
    return NextResponse.json(
      { error: "Failed to queue translation" },
      { status: 500 }
    );
  }
}
