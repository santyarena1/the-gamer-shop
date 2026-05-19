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
};

export default nextConfig;
