import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/sites/recall/app",
  assetPrefix: "/sites/recall/app",
  // Native module — do not bundle
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // ChatGPT/Claude exports can be large
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
