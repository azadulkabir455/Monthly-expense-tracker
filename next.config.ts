import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: true, // Workaround: .next/dev/types/routes.d.ts has JSDoc parse bug in Next 16
  },
};

export default nextConfig;
