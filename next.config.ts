import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cnvlrpwxhuhwzzhfuzbq.supabase.co",
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.208"],
};

export default nextConfig;
