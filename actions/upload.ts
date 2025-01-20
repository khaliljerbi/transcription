"use server";

import ytdl from "@distube/ytdl-core";

export const getYoutubePublicUrl = async (url: string) => {
  try {
    const info = await ytdl.getInfo(url);
    const audioStream = ytdl.downloadFromInfo(info, {
      quality: "lowest",
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });
    return { audio: audioStream, id: info.videoDetails.videoId };
  } catch (error) {
    console.error("error", error);
  }
};
