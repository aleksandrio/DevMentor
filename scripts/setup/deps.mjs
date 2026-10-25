// @ts-check
// Real side effects for `npm run setup`; scripts/setup/steps.mjs receives them injected.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

/** @returns {import("./steps.mjs").SetupDeps} */
export function createDeps() {
  const root = fileURLToPath(new URL("../..", import.meta.url));
  return {
    exec(command, args, options = {}) {
      const result = spawnSync(command, args, {
        cwd: root,
        encoding: "utf8",
        stdio: options.inherit ? "inherit" : "pipe",
        // npm is `npm.cmd` on Windows, which spawnSync finds only through a shell.
        // Every command and argument is a constant from steps.mjs, so nothing
        // user-supplied reaches the shell.
        shell: process.platform === "win32",
      });
      return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
    },
    fs,
    randomBytes,
    log: (message) => process.stdout.write(`${message}\n`),
    error: (message) => process.stderr.write(`${message}\n`),
    nodeVersion: process.versions.node,
    root,
  };
}
