"use server";

import prisma from "@/lib/db";

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
        select: {
          transcriptionId: true,
          resourceId: true,
          summary: true,
          thumbnail: true,
          title: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transcription.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    const updatedList = list.map((l) => ({
      ...l,
      id: l.resourceId,
      description: l.summary,
      thumbnail: JSON.parse(l.thumbnail) as Array<{
        url: string;
        width: number;
        height: number;
      }>,
    }));

    return {
      list: updatedList,
      total,
      totalPages,
      page,
      hasMore,
    };
  } catch (error) {
    console.error("Error in fetchResources:", error);
    throw error;
  }
};

export const getPreviewRessources = async () => {
  try {
    const list = await prisma.transcription.findMany({
      select: {
        transcriptionId: true,
        resourceId: true,
        summary: true,
        thumbnail: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return list.map((l) => ({
      ...l,
      id: l.resourceId,
      description: l.summary,
      thumbnail: JSON.parse(l.thumbnail) as Array<{
        url: string;
        width: number;
        height: number;
      }>,
    }));
  } catch (error) {
    console.error("error fetching data", error);
  }
};
