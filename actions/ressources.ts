"use server";

import prisma from "@/lib/db";
import ytdl from "@distube/ytdl-core";

export const fetchResources = async ({
  page,
  pageSize = 10,
}: {
  page: number;
  pageSize: number;
}) => {
  try {
    const skip = (page - 1) * pageSize;

    // Fetch paginated data and total count
    const [list, total] = await Promise.all([
      prisma.transcription.findMany({
        select: { transcriptionId: true, resourceId: true, summary: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transcription.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    // Process all YouTube info requests in parallel
    const updatedList = await Promise.all(
      list.map(async (entry) => {
        try {
          const info = await ytdl.getInfo(
            `https://www.youtube.com/watch?v=${entry.resourceId}`
          );
          return {
            id: entry.resourceId,
            transcriptionId: entry.transcriptionId,
            title: info.videoDetails.title,
            description: entry.summary,
            thumbnail: info.videoDetails.thumbnails,
          };
        } catch (error) {
          console.error(
            `Error fetching YouTube info for ${entry.resourceId}:`,
            error
          );
          // Return a fallback object if YouTube info fetch fails
          return {
            id: entry.resourceId,
            transcriptionId: entry.transcriptionId,
            title: "Unable to fetch video details",
            description: null,
            thumbnail: [],
          };
        }
      })
    );

    return {
      list: updatedList,
      total,
      totalPages,
      page,
      hasMore,
    };
  } catch (error) {
    console.error("Error in fetchResources:", error);
    throw error; // Re-throw to handle in the calling function
  }
};
