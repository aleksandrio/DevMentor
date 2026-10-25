import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "../..");

// The shared .env lives in the repository root (the MikroORM CLI reads the
// same file). Next.js only loads .env files from packages/app, and calling
// @next/env's loadEnvConfig here is a no-op: it caches the first load.
// Variables already set in the environment take precedence.
const rootEnvFile = path.join(repoRoot, ".env");
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

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
