import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { appDir } from "./paths";

// `next start` runs in production mode, where AUTH_SECRET is required.
export const TEST_AUTH_SECRET = "integration-only-secret-not-for-real-use-0123456789";

// A cold production server answers in a few seconds; more means it is stuck.
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 250;

const nextBin = path.join(path.dirname(createRequire(path.join(appDir, "package.json")).resolve("next/package.json")), "dist/bin/next");

export interface RunningApp {
  baseUrl: string;
  stop(): Promise<void>;
}

function appEnv(databaseUrl: string): NodeJS.ProcessEnv {
  return { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET: TEST_AUTH_SECRET };
}

function waitForExit(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve(child.exitCode);
      return;
    }
    child.once("exit", (code) => resolve(code));
  });
}

/** Builds the app exactly like `npm run build` (output streamed to this process). */
export async function buildApp(databaseUrl: string): Promise<void> {
  const child = spawn(process.execPath, [nextBin, "build"], {
    cwd: appDir,
    env: appEnv(databaseUrl),
    stdio: "inherit",
  });
  const code = await waitForExit(child);
  if (code !== 0) {
    throw new Error(`next build failed with exit code ${code}`);
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (typeof address === "object" && address ? resolve(address.port) : reject(new Error("no port"))));
    });
  });
}

async function waitUntilReady(baseUrl: string, child: ChildProcess, output: () => string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited with code ${child.exitCode}:\n${output()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Not listening yet; poll again.
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  throw new Error(`next start did not answer ${baseUrl}/api/health within ${READY_TIMEOUT_MS} ms:\n${output()}`);
}

/** Starts the built app (`next start`) on a free port against `databaseUrl`. */
export async function startApp(databaseUrl: string): Promise<RunningApp> {
  const port = await freePort();
  const baseUrl = `http://localhost:${port}`;
  // Own process group, so stop() also ends anything next start spawns.
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: appDir,
    env: appEnv(databaseUrl),
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => (output += chunk.toString()));

  const stop = async () => {
    if (child.exitCode === null && child.pid !== undefined) {
      process.kill(-child.pid, "SIGTERM");
      await waitForExit(child);
    }
  };
  try {
    await waitUntilReady(baseUrl, child, () => output);
  } catch (error) {
    await stop();
    throw error;
  }
  return { baseUrl, stop };
}
