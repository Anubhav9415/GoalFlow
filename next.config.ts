import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Linting runs separately in CI; don't block production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are caught locally; allow Vercel to ship
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
