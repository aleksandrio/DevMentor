import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Package boundaries from AGENTS.md ("Monorepo i pakiety"). Workspace packages
// are imported by name through their public entry point only.
const deepImports = {
  regex: "^(@devmentor/[^/]+/src/|(\\.\\./)+(packages/)?(app|core|db|ui)/src(/|$))",
  message: "Import workspace packages by name through their public entry point.",
};
const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: [deepImports, ...patterns] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: "packages/app/" } },
  },
  {
    files: ["packages/**/*.{ts,tsx,js,jsx,mjs}"],
    rules: restrict(),
  },
  {
    files: ["packages/core/**"],
    rules: restrict({
      group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "@mikro-orm/*", "awilix", "@devmentor/*"],
      message: "@devmentor/core must stay framework-free and depend on no other workspace package.",
    }),
  },
  {
    files: ["packages/db/**"],
    rules: restrict(
      {
        group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "awilix"],
        message: "@devmentor/db is server-side data access only (use \"server-only\", not Next.js APIs).",
      },
      {
        group: ["@devmentor/app", "@devmentor/app/*", "@devmentor/ui", "@devmentor/ui/*"],
        message: "@devmentor/db may depend only on @devmentor/core.",
      },
    ),
  },
  {
    files: ["packages/ui/**"],
    rules: restrict(
      {
        group: ["@mikro-orm/*", "awilix", "server-only"],
        message: "@devmentor/ui components receive data through props; no data access or DI.",
      },
      {
        group: ["@devmentor/app", "@devmentor/app/*", "@devmentor/db", "@devmentor/db/*"],
        message: "@devmentor/ui may depend only on @devmentor/core.",
      },
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
]);

export default eslintConfig;
