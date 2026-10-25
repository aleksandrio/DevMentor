import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Package boundaries from AGENTS.md ("Monorepo i pakiety"): app → core → db,
// app → ui, ui standalone. Workspace packages are imported by name through
// their public entry point only.
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
    files: ["packages/app/**"],
    rules: restrict({
      group: ["@devmentor/db", "@devmentor/db/*", "@mikro-orm/*", "awilix"],
      message: "@devmentor/app reaches the database and the DI container only through @devmentor/core.",
    }),
  },
  {
    files: ["packages/core/**"],
    rules: restrict(
      {
        group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "@mikro-orm/*"],
        message: "@devmentor/core stays framework-free; ORM types come from @devmentor/db.",
      },
      {
        group: ["@devmentor/app", "@devmentor/app/*", "@devmentor/ui", "@devmentor/ui/*"],
        message: "@devmentor/core may depend only on @devmentor/db.",
      },
    ),
  },
  {
    // Shared Zod schemas are imported by client components too.
    files: ["packages/core/src/validators/**"],
    rules: restrict({
      regex: "^(?!zod$|\\.{1,2}/)",
      message: "Validators are client-safe: import only zod and other validators.",
    }),
  },
  {
    files: ["packages/db/**"],
    rules: restrict({
      group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "awilix", "@devmentor/app", "@devmentor/app/*", "@devmentor/core", "@devmentor/core/*", "@devmentor/ui", "@devmentor/ui/*"],
      message: "@devmentor/db is server-side data access only and depends on no other workspace package.",
    }),
  },
  {
    files: ["packages/ui/**"],
    rules: restrict({
      group: ["@mikro-orm/*", "awilix", "server-only", "@devmentor/app", "@devmentor/app/*", "@devmentor/core", "@devmentor/core/*", "@devmentor/db", "@devmentor/db/*"],
      message: "@devmentor/ui is standalone: components receive data through props; no data access, DI or workspace imports.",
    }),
  },
  {
    // apiCall is the only sanctioned fetch() call site for /api/* in UI code.
    files: ["packages/app/src/**", "packages/ui/src/**"],
    ignores: ["packages/ui/src/backend/api/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Call /api/* through apiCall/apiCallOrThrow from @devmentor/ui/backend/api/api-call." },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // Specs, run logs, lessons and local tool state (e.g. temp files); no code.
    ".ai/**",
    // Playwright artifacts.
    "**/test-results/**",
    "**/playwright-report/**",
  ]),
]);

export default eslintConfig;
