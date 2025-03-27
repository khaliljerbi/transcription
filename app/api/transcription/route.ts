import { fetchResources, getPreviewRessources } from "@/actions/ressources";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const preview = searchParams.get("preview") === "true";

    if (preview) {
      // Return preview data (latest 3 transcriptions)
      const data = await getPreviewRessources();
      return NextResponse.json({ success: true, data });
    } else {
      // Return paginated data
      const data = await fetchResources({ page, pageSize });
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transcriptions" },
      { status: 500 }
    );
  }
}
