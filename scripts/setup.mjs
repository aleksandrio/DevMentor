// @ts-check
// `npm run setup`: prepares the local environment (.ai/specs/implemented/2026-10-25-local-setup-command.md).
import { createDeps } from "./setup/deps.mjs";
import { runSetup } from "./setup/steps.mjs";

process.exitCode = runSetup(createDeps());
