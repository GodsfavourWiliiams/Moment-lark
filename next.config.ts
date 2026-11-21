import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function configureNext(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    output: undefined,
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8787/api/:path*",
        },
      ];
    },
  };
}
