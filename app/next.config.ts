import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/sites/recall/app",
  assetPrefix: "/sites/recall/app",
  // Native module — do not bundle
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
