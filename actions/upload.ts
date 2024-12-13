"use server";

import ytdl from "ytdl-core";

export const getYoutubePublicUrl = async (url: string) => {
  try {
    const info = await ytdl.getInfo(url);
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    });
    return { audio: audioStream, id: info.videoDetails.videoId };
  } catch (error) {
    console.error("error", error);
  }
};
