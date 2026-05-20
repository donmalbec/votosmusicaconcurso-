import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "globalpizza.party" },
      { protocol: "https", hostname: "www.musicaw3.com" },
      { protocol: "https", hostname: "www.metapool.app" },
    ],
  },
};

export default nextConfig;
