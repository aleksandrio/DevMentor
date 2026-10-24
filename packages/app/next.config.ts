import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "../..");

// Shared .env files live in the repository root (also read by the MikroORM
// CLI); Next.js on its own only looks in packages/app.
loadEnvConfig(repoRoot, process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  // The root AGENTS.md already carries the Next.js agent rules; keep `next dev`
  // from generating a second copy in packages/app.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Monorepo root: resolve workspace packages and the hoisted node_modules.
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
