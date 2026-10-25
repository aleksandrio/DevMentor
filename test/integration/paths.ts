import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
export const appDir = fileURLToPath(new URL("../../packages/app", import.meta.url));
