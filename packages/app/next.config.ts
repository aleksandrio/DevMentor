import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The root AGENTS.md already carries the Next.js agent rules; keep `next dev`
  // from generating a second copy in packages/app.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Monorepo root: resolve workspace packages and the hoisted node_modules.
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
