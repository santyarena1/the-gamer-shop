import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thegamershop.acustock.app",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Default 1 MB — insuficiente para fotos de gabinete en Server Actions
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
