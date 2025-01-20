"use server";

import ytdl from "@distube/ytdl-core";

export const getYoutubePublicUrl = async (url: string) => {
  try {
    let agent = undefined;
    if (process.env.NODE_ENV === "production") {
      agent = ytdl.createProxyAgent(
        { uri: process.env.PROXY_URL as string },
        JSON.parse(process.env.COOKIES_PARAMS as string)
      );
    }
    const info = await ytdl.getInfo(url, { agent });
    const audioStream = ytdl.downloadFromInfo(info, {
      quality: "lowest",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      agent,
    });
    return { audio: audioStream, id: info.videoDetails.videoId };
  } catch (error) {
    console.error("error", error);
  }
};
