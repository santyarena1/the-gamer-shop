import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint corre como paso separado en CI; no duplicar en next build
    ignoreDuringBuilds: true,
  },
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
