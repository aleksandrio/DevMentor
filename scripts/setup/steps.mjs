// @ts-check
// Steps of `npm run setup` (.ai/specs/implemented/2026-10-25-local-setup-command.md).
// Runs before `npm install`, so it imports only Node.js built-ins; every side
// effect goes through the injected `deps`, which keeps the steps unit-testable.
import { join } from "node:path";

/**
 * @typedef {{ status: number | null, stdout: string, stderr: string }} ExecResult
 * @typedef {object} SetupDeps
 * @property {(command: string, args: string[], options?: { inherit?: boolean }) => ExecResult} exec
 *   Runs a command in the repository root; `inherit` streams its output to the terminal.
 * @property {Pick<typeof import("node:fs"), "existsSync" | "readFileSync" | "writeFileSync" | "renameSync" | "statSync" | "chmodSync" | "rmSync">} fs
 * @property {(size: number) => Buffer} randomBytes
 * @property {(message: string) => void} log
 * @property {(message: string) => void} error
 * @property {string} nodeVersion `process.versions.node`
 * @property {string} root Absolute path of the repository root.
 * @typedef {{ name: string, run: (deps: SetupDeps) => string }} SetupStep
 */

/** AGENTS.md: `AUTH_SECRET` has at least 32 bytes. */
const AUTH_SECRET_BYTES = 32;
/** `.env` holds a secret: owner read/write only. */
const SECRET_FILE_MODE = 0o600;
/** Permission bits of `stat().mode`, without the file-type bits. */
const PERMISSION_BITS = 0o777;
/** Printed by the MikroORM CLI (`migration:pending`) when nothing is pending. */
const NO_PENDING_MIGRATIONS = "No pending migrations";
const ENV_FILE = ".env";
const ENV_EXAMPLE_FILE = ".env.example";
const ENV_TEMP_FILE = ".env.setup-tmp";
const SKIPPED = "pominięto";

/**
 * Minimum version from an `engines.node` range of the form `>=X[.Y[.Z]]`.
 * @param {string} range
 * @returns {[number, number, number]}
 */
export function parseMinNodeVersion(range) {
  const match = /^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(range.trim());
  if (!match) {
    throw new Error(`nieobsługiwany format engines.node w package.json: "${range}" (oczekiwano ">=X.Y").`);
  }
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

/**
 * @param {string} version e.g. `22.17.0`
 * @param {[number, number, number]} minimum
 */
export function isVersionAtLeast(version, minimum) {
  const parts = version.split(".").map(Number);
  for (const [index, required] of minimum.entries()) {
    const actual = parts[index] ?? 0;
    if (actual !== required) return actual > required;
  }
  return true;
}

/** @param {string} value */
function isBlankValue(value) {
  return value.trim().replace(/^(["'])(.*)\1$/, "$2").trim() === "";
}

/**
 * Fills an empty or missing `AUTH_SECRET` in `.env` content and leaves every
 * other line untouched. With several `AUTH_SECRET` lines the last one wins (as
 * in `process.loadEnvFile`), so only that one is checked and replaced.
 * @param {string} content
 * @param {() => string} generateSecret
 * @returns {{ content: string, isChanged: boolean }}
 */
export function upsertAuthSecret(content, generateSecret) {
  const last = [...content.matchAll(/^(export\s+)?AUTH_SECRET=(.*?)(\r?)$/gm)].at(-1);
  if (last && !isBlankValue(last[2])) return { content, isChanged: false };

  const secret = generateSecret();
  if (!last) {
    const eol = content.includes("\r\n") ? "\r\n" : "\n";
    const separator = content === "" || content.endsWith("\n") ? "" : eol;
    return { content: `${content}${separator}AUTH_SECRET=${secret}${eol}`, isChanged: true };
  }
  const line = `${last[1] ?? ""}AUTH_SECRET=${secret}${last[3]}`;
  const start = /** @type {number} */ (last.index);
  return { content: content.slice(0, start) + line + content.slice(start + last[0].length), isChanged: true };
}

/**
 * Services from `docker compose ps --format json`: a JSON array before Compose
 * 2.21, one JSON object per line since then.
 * @param {string} stdout
 * @returns {unknown[]}
 */
export function parseComposePs(stdout) {
  const text = stdout.trim();
  if (text === "") return [];
  try {
    if (text.startsWith("[")) return JSON.parse(text);
    return text.split(/\r?\n/).filter((line) => line.trim() !== "").map((line) => JSON.parse(line));
  } catch {
    // Unreadable output means "state unknown": the caller runs `up --wait`,
    // which is safe to repeat.
    return [];
  }
}

/** @param {string} stdout */
export function isPostgresHealthy(stdout) {
  return parseComposePs(stdout).some((service) => {
    const { Service, State, Health } = /** @type {Record<string, unknown>} */ (service ?? {});
    return Service === "postgres" && State === "running" && Health === "healthy";
  });
}

/**
 * @param {SetupDeps} deps
 * @param {string} command
 * @param {string[]} args
 */
function runOrThrow(deps, command, args) {
  const commandLine = [command, ...args].join(" ");
  const result = deps.exec(command, args, { inherit: true });
  if (result.status !== 0) {
    throw new Error(`„${commandLine}” zakończyło się kodem ${result.status ?? "nieznanym"}. Popraw błąd powyżej i uruchom „npm run setup” ponownie albo wykonaj to polecenie ręcznie.`);
  }
}

/** @param {SetupDeps} deps */
function checkNode(deps) {
  const manifest = JSON.parse(deps.fs.readFileSync(join(deps.root, "package.json"), "utf8"));
  const range = manifest.engines?.node;
  if (typeof range !== "string") throw new Error("brak pola engines.node w package.json.");
  if (!isVersionAtLeast(deps.nodeVersion, parseMinNodeVersion(range))) {
    throw new Error(`wymagany Node.js ${range}, a uruchomiony jest ${deps.nodeVersion}. Zainstaluj nowszą wersję (https://nodejs.org) i spróbuj ponownie.`);
  }
  return `OK (${deps.nodeVersion})`;
}

/** @param {SetupDeps} deps */
function checkDocker(deps) {
  if (deps.exec("docker", ["compose", "version"]).status !== 0) {
    throw new Error("nie znaleziono Dockera z Compose (polecenie „docker compose”). Zainstaluj Docker (https://docs.docker.com/get-docker/) i spróbuj ponownie.");
  }
  if (deps.exec("docker", ["info"]).status !== 0) {
    throw new Error("Docker nie odpowiada. Uruchom Docker (demon albo Docker Desktop) i spróbuj ponownie.");
  }
  return "OK";
}

/** @param {SetupDeps} deps */
function installDependencies(deps) {
  const installedLock = join(deps.root, "node_modules", ".package-lock.json");
  const lockfile = join(deps.root, "package-lock.json");
  if (deps.fs.existsSync(installedLock) && deps.fs.statSync(installedLock).mtimeMs >= deps.fs.statSync(lockfile).mtimeMs) {
    return `${SKIPPED} (node_modules aktualne względem package-lock.json)`;
  }
  runOrThrow(deps, "npm", ["install"]);
  return "zainstalowano";
}

/**
 * Writes through a temporary file and `rename`, so an interrupted run never
 * leaves a half-written `.env`; the temporary file is removed on failure.
 * @param {SetupDeps} deps
 * @param {string} target
 * @param {string} content
 * @param {number} mode
 */
function writeFileAtomically(deps, target, content, mode) {
  const temp = join(deps.root, ENV_TEMP_FILE);
  deps.fs.rmSync(temp, { force: true });
  try {
    deps.fs.writeFileSync(temp, content, { mode: SECRET_FILE_MODE });
    deps.fs.chmodSync(temp, mode);
    deps.fs.renameSync(temp, target);
  } finally {
    deps.fs.rmSync(temp, { force: true });
  }
}

/** @param {SetupDeps} deps */
function ensureEnvFile(deps) {
  const envPath = join(deps.root, ENV_FILE);
  const hasEnv = deps.fs.existsSync(envPath);
  const source = deps.fs.readFileSync(hasEnv ? envPath : join(deps.root, ENV_EXAMPLE_FILE), "utf8");
  const generateSecret = () => deps.randomBytes(AUTH_SECRET_BYTES).toString("base64");
  const { content, isChanged } = upsertAuthSecret(source, generateSecret);
  if (hasEnv && !isChanged) return `${SKIPPED} (.env istnieje i ma AUTH_SECRET)`;

  const mode = hasEnv ? deps.fs.statSync(envPath).mode & PERMISSION_BITS : SECRET_FILE_MODE;
  writeFileAtomically(deps, envPath, content, mode);
  if (!hasEnv) return `utworzono .env z ${ENV_EXAMPLE_FILE}${isChanged ? " i wygenerowano AUTH_SECRET" : ""}`;
  return "wygenerowano AUTH_SECRET w istniejącym .env";
}

/** @param {SetupDeps} deps */
function startPostgres(deps) {
  const status = deps.exec("docker", ["compose", "ps", "--format", "json", "postgres"]);
  if (status.status === 0 && isPostgresHealthy(status.stdout)) return `${SKIPPED} (kontener postgres działa i jest zdrowy)`;
  runOrThrow(deps, "docker", ["compose", "up", "-d", "--wait", "postgres"]);
  return "uruchomiono";
}

/** @param {SetupDeps} deps */
function runMigrations(deps) {
  const pending = deps.exec("npm", ["run", "--silent", "db:migration:pending"]);
  if (pending.status === 0 && pending.stdout.includes(NO_PENDING_MIGRATIONS)) return `${SKIPPED} (brak oczekujących migracji)`;
  runOrThrow(deps, "npm", ["run", "db:migrate"]);
  return "wykonano";
}

/**
 * Preflight checks come first, so a missing Docker or an old Node.js stops the
 * run before anything is written.
 * @type {SetupStep[]}
 */
export const SETUP_STEPS = [
  { name: "Node.js", run: checkNode },
  { name: "Docker", run: checkDocker },
  { name: "Zależności npm", run: installDependencies },
  { name: "Plik .env", run: ensureEnvFile },
  { name: "PostgreSQL", run: startPostgres },
  { name: "Migracje", run: runMigrations },
];

/**
 * Runs every step in order and stops at the first failure.
 * @param {SetupDeps} deps
 * @returns {0 | 1} process exit code
 */
export function runSetup(deps) {
  for (const step of SETUP_STEPS) {
    try {
      deps.log(`✔ ${step.name}: ${step.run(deps)}`);
    } catch (error) {
      deps.error(`✖ ${step.name}: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  deps.log("Środowisko gotowe. Serwer deweloperski uruchomisz poleceniem „npm run dev”.");
  return 0;
}
