import type { Options } from "@mikro-orm/postgresql";

// Every entity (defineEntity) is registered here; discovery is explicit, not
// folder-based, so the same list works in the Next.js bundle and in the CLI.
export const entities: NonNullable<Options["entities"]> = [];
