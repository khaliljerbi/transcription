import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.ytimg.com", "img.youtube.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
