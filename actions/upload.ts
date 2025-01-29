"use server";

import ytdl from "@distube/ytdl-core";

export const getYoutubePublicUrl = async (url: string) => {
  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: { highWaterMark: 1 << 20 },
    });
    const audioStream = ytdl.downloadFromInfo(info, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 20,
    });
    return {
      audio: audioStream,
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails,
    };
  } catch (error) {
    console.error("error", error);
  }
};
