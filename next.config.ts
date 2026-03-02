import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.larson.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
