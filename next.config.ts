import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  devIndicators: {
    position: "bottom-right",
  },
  serverExternalPackages: [
    "@browserbasehq/stagehand",
    "@browserbasehq/sdk",
    "playwright",
    "playwright-core",
    "dotenv",
    "mammoth",
    "pdf-parse",
  ],
};

export default nextConfig;
