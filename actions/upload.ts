"use server";

import ytdl from "@distube/ytdl-core";

export const getYoutubePublicUrl = async (url: string) => {
  try {
    // if (process.env.NODE_ENV === "production") {
    //   const cookies = JSON.parse(process.env.COOKIES_PARAMS as string);
    //   agent = ytdl.createAgent(cookies);
    // }
    const info = await ytdl.getInfo(url, {
      requestOptions: { highWaterMark: 1 << 20 },
    });
    const audioStream = ytdl.downloadFromInfo(info, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 20,
    });
    return { audio: audioStream, id: info.videoDetails.videoId };
  } catch (error) {
    console.error("error", error);
  }
};
