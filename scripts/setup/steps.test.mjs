import { describe, expect, it } from "vitest";
import {
  SETUP_STEPS,
  isPostgresHealthy,
  isVersionAtLeast,
  parseComposePs,
  parseMinNodeVersion,
  runSetup,
  upsertAuthSecret,
} from "./steps.mjs";

const ROOT = "/repo";
const SECRET_BYTES = Buffer.alloc(32, 7);
const SECRET = SECRET_BYTES.toString("base64");
const HEALTHY_PS = JSON.stringify({ Service: "postgres", State: "running", Health: "healthy" });
const EXAMPLE = "DATABASE_URL=postgres://x\nAUTH_SECRET=\n";

/**
 * In-memory repository with a scripted `exec`. Commands answer from `responses`
 * (keyed by the joined command line); unknown commands succeed with no output.
 */
function createFakeDeps({ files = {}, mtimes = {}, modes = {}, links = {}, responses = {}, nodeVersion = "24.1.0", failWrite = false } = {}) {
  const store = new Map(Object.entries({
    [`${ROOT}/package.json`]: JSON.stringify({ engines: { node: ">=22.17" } }),
    [`${ROOT}/.env.example`]: EXAMPLE,
    ...files,
  }));
  const fileModes = new Map(Object.entries(modes));
  const calls = [];
  const logs = [];
  const errors = [];
  const fs = {
    existsSync: (path) => store.has(path),
    readFileSync: (path) => {
      if (!store.has(path)) throw new Error(`ENOENT: ${path}`);
      return store.get(path);
    },
    writeFileSync: (path, content, options) => {
      calls.push(`write ${path} ${options.mode.toString(8)}`);
      if (failWrite) throw new Error("EACCES: disk full");
      store.set(path, content);
    },
    chmodSync: (path, mode) => {
      calls.push(`chmod ${path} ${mode.toString(8)}`);
      fileModes.set(path, mode);
    },
    renameSync: (from, to) => {
      calls.push(`rename ${from} ${to}`);
      store.set(to, store.get(from));
      store.delete(from);
    },
    rmSync: (path) => {
      calls.push(`rm ${path}`);
      store.delete(path);
    },
    realpathSync: (path) => links[path] ?? path,
    statSync: (path) => ({ mtimeMs: mtimes[path] ?? 0, mode: 0o100000 | (fileModes.get(path) ?? 0o644) }),
  };
  const deps = {
    exec: (command, args, options = {}) => {
      const line = [command, ...args].join(" ");
      calls.push(`exec ${line}${options.inherit ? " (inherit)" : ""}`);
      return { status: 0, stdout: "", stderr: "", ...responses[line] };
    },
    fs,
    randomBytes: (size) => {
      expect(size).toBe(32);
      return SECRET_BYTES;
    },
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
    nodeVersion,
    root: ROOT,
  };
  return { deps, store, fileModes, calls, logs, errors };
}

/** Everything already done: the second run of `npm run setup`. */
const READY = {
  files: { [`${ROOT}/.env`]: `AUTH_SECRET=existing\n`, [`${ROOT}/node_modules/.package-lock.json`]: "{}", [`${ROOT}/package-lock.json`]: "{}" },
  mtimes: { [`${ROOT}/node_modules/.package-lock.json`]: 2, [`${ROOT}/package-lock.json`]: 1 },
  responses: {
    "docker compose ps --format json postgres": { stdout: HEALTHY_PS },
    "npm run --silent db:migration:pending": { stdout: "No pending migrations\n" },
  },
};

const execCalls = (calls) => calls.filter((call) => call.startsWith("exec "));

describe("parseMinNodeVersion", () => {
  it("reads >=X, >=X.Y and >=X.Y.Z", () => {
    expect(parseMinNodeVersion(">=22")).toEqual([22, 0, 0]);
    expect(parseMinNodeVersion(" >= 22.17 ")).toEqual([22, 17, 0]);
    expect(parseMinNodeVersion(">=22.17.1")).toEqual([22, 17, 1]);
  });

  it("rejects other range syntaxes", () => {
    expect(() => parseMinNodeVersion("^22")).toThrow('nieobsługiwany format engines.node w package.json: "^22"');
  });
});

describe("isVersionAtLeast", () => {
  it("compares major, minor and patch in order", () => {
    expect(isVersionAtLeast("22.17.0", [22, 17, 0])).toBe(true);
    expect(isVersionAtLeast("24.0.0", [22, 17, 0])).toBe(true);
    expect(isVersionAtLeast("22.16.9", [22, 17, 0])).toBe(false);
    expect(isVersionAtLeast("22.17.1", [22, 17, 2])).toBe(false);
  });

  it("treats missing version parts as zero", () => {
    expect(isVersionAtLeast("22", [22, 0, 0])).toBe(true);
    expect(isVersionAtLeast("22", [22, 1, 0])).toBe(false);
  });
});

describe("upsertAuthSecret", () => {
  const generate = () => "NEW";

  it("keeps a non-empty secret untouched", () => {
    const content = "A=1\nAUTH_SECRET=keep\n";
    expect(upsertAuthSecret(content, generate)).toEqual({ content, isChanged: false });
  });

  it("fills an empty secret and keeps the other lines", () => {
    expect(upsertAuthSecret("A=1\nAUTH_SECRET=\nB=2\n", generate)).toEqual({ content: "A=1\nAUTH_SECRET=NEW\nB=2\n", isChanged: true });
  });

  it("treats whitespace and empty quotes as empty", () => {
    expect(upsertAuthSecret('AUTH_SECRET=  ""  \n', generate).content).toBe("AUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("AUTH_SECRET=''", generate).content).toBe("AUTH_SECRET=NEW");
  });

  it("treats a quoted value as set", () => {
    expect(upsertAuthSecret('AUTH_SECRET="x"\n', generate).isChanged).toBe(false);
  });

  it("keeps the export prefix and CRLF line endings", () => {
    expect(upsertAuthSecret("A=1\r\nexport AUTH_SECRET=\r\nB=2\r\n", generate).content).toBe("A=1\r\nexport AUTH_SECRET=NEW\r\nB=2\r\n");
  });

  it("checks and replaces only the last of several lines", () => {
    expect(upsertAuthSecret("AUTH_SECRET=old\nAUTH_SECRET=\n", generate).content).toBe("AUTH_SECRET=old\nAUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("AUTH_SECRET=\nAUTH_SECRET=set\n", generate).isChanged).toBe(false);
  });

  it("appends a missing line with the file's line ending", () => {
    expect(upsertAuthSecret("", generate).content).toBe("AUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("A=1\n", generate).content).toBe("A=1\nAUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("A=1", generate).content).toBe("A=1\nAUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("A=1\r\nB=2", generate).content).toBe("A=1\r\nB=2\r\nAUTH_SECRET=NEW\r\n");
  });

  it("reads spacing and comments like Node's .env parser", () => {
    expect(upsertAuthSecret("AUTH_SECRET = x\n", generate).isChanged).toBe(false);
    expect(upsertAuthSecret("  AUTH_SECRET=y\n", generate).isChanged).toBe(false);
    expect(upsertAuthSecret("AUTH_SECRET=a#b\n", generate).isChanged).toBe(false);
    expect(upsertAuthSecret('AUTH_SECRET="#q"\n', generate).isChanged).toBe(false);
    expect(upsertAuthSecret("AUTH_SECRET= # todo\n", generate).content).toBe("AUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("  AUTH_SECRET = \n", generate).content).toBe("AUTH_SECRET=NEW\n");
    expect(upsertAuthSecret("export\tAUTH_SECRET=\n", generate).content).toBe("export\tAUTH_SECRET=NEW\n");
  });

  it("ignores lines that only contain the name", () => {
    expect(upsertAuthSecret("MY_AUTH_SECRET=x\n# AUTH_SECRET=y\n", generate).content).toBe("MY_AUTH_SECRET=x\n# AUTH_SECRET=y\nAUTH_SECRET=NEW\n");
  });
});

describe("parseComposePs", () => {
  it("reads a JSON array (Compose < 2.21)", () => {
    expect(parseComposePs(`[${HEALTHY_PS}]`)).toEqual([JSON.parse(HEALTHY_PS)]);
  });

  it("reads one object per line (Compose >= 2.21)", () => {
    expect(parseComposePs(`${HEALTHY_PS}\r\n\n{"Service":"other"}\n`)).toEqual([JSON.parse(HEALTHY_PS), { Service: "other" }]);
  });

  it("returns no services for empty or unreadable output", () => {
    expect(parseComposePs("  \n")).toEqual([]);
    expect(parseComposePs("no configuration file provided")).toEqual([]);
  });
});

describe("isPostgresHealthy", () => {
  it("needs the postgres service running and healthy", () => {
    expect(isPostgresHealthy(HEALTHY_PS)).toBe(true);
    expect(isPostgresHealthy(JSON.stringify({ Service: "postgres", State: "running", Health: "starting" }))).toBe(false);
    expect(isPostgresHealthy(JSON.stringify({ Service: "postgres", State: "exited", Health: "healthy" }))).toBe(false);
    expect(isPostgresHealthy(JSON.stringify({ Service: "redis", State: "running", Health: "healthy" }))).toBe(false);
    expect(isPostgresHealthy("null")).toBe(false);
    expect(isPostgresHealthy("")).toBe(false);
  });
});

describe("runSetup", () => {
  it("runs the preflight checks before any write or install", () => {
    expect(SETUP_STEPS.map((step) => step.name)).toEqual(["Node.js", "Docker", "Zależności npm", "Plik .env", "PostgreSQL", "Migracje"]);
  });

  it("sets up a fresh clone", () => {
    const { deps, store, fileModes, calls, logs, errors } = createFakeDeps({ files: { [`${ROOT}/package-lock.json`]: "{}" } });

    expect(runSetup(deps)).toBe(0);

    expect(execCalls(calls)).toEqual([
      "exec docker compose version",
      "exec docker info",
      "exec npm install (inherit)",
      "exec docker compose ps --format json postgres",
      "exec docker compose up -d --wait postgres (inherit)",
      "exec npm run --silent db:migration:pending",
      "exec npm run db:migrate (inherit)",
    ]);
    expect(store.get(`${ROOT}/.env`)).toBe(`DATABASE_URL=postgres://x\nAUTH_SECRET=${SECRET}\n`);
    expect(Buffer.from(SECRET, "base64")).toHaveLength(32);
    expect(fileModes.get(`${ROOT}/.env.setup-tmp`)).toBe(0o600);
    expect(store.has(`${ROOT}/.env.setup-tmp`)).toBe(false);
    expect(logs).toEqual([
      "✔ Node.js: OK (24.1.0)",
      "✔ Docker: OK",
      "✔ Zależności npm: zainstalowano",
      "✔ Plik .env: utworzono .env z .env.example i wygenerowano AUTH_SECRET",
      "✔ PostgreSQL: uruchomiono",
      "✔ Migracje: wykonano",
      "Środowisko gotowe. Serwer deweloperski uruchomisz poleceniem „npm run dev”.",
    ]);
    expect(errors).toEqual([]);
    expect([...logs, ...errors].join("\n")).not.toContain(SECRET);
  });

  it("skips every step on the second run without touching .env", () => {
    const { deps, store, calls, logs } = createFakeDeps(READY);

    expect(runSetup(deps)).toBe(0);

    expect(execCalls(calls)).toEqual([
      "exec docker compose version",
      "exec docker info",
      "exec docker compose ps --format json postgres",
      "exec npm run --silent db:migration:pending",
    ]);
    expect(calls.filter((call) => !call.startsWith("exec "))).toEqual([]);
    expect(store.get(`${ROOT}/.env`)).toBe("AUTH_SECRET=existing\n");
    expect(logs.slice(2, 6)).toEqual([
      "✔ Zależności npm: pominięto (node_modules aktualne względem package-lock.json)",
      "✔ Plik .env: pominięto (.env istnieje i ma AUTH_SECRET)",
      "✔ PostgreSQL: pominięto (kontener postgres działa i jest zdrowy)",
      "✔ Migracje: pominięto (brak oczekujących migracji)",
    ]);
  });

  it("reinstalls when package-lock.json is newer than the installed tree", () => {
    const { deps, calls } = createFakeDeps({ ...READY, mtimes: { [`${ROOT}/node_modules/.package-lock.json`]: 1, [`${ROOT}/package-lock.json`]: 2 } });

    expect(runSetup(deps)).toBe(0);
    expect(execCalls(calls)).toContain("exec npm install (inherit)");
  });

  it("fills an empty AUTH_SECRET in an existing .env and keeps its mode", () => {
    const env = `${ROOT}/.env`;
    const { deps, store, fileModes, calls, logs } = createFakeDeps({ ...READY, files: { ...READY.files, [env]: "A=1\nAUTH_SECRET=\n" }, modes: { [env]: 0o640 } });

    expect(runSetup(deps)).toBe(0);

    expect(store.get(env)).toBe(`A=1\nAUTH_SECRET=${SECRET}\n`);
    expect(fileModes.get(`${ROOT}/.env.setup-tmp`)).toBe(0o640);
    expect(calls.filter((call) => !call.startsWith("exec "))).toEqual([
      `rm ${ROOT}/.env.setup-tmp`,
      `write ${ROOT}/.env.setup-tmp 600`,
      `chmod ${ROOT}/.env.setup-tmp 640`,
      `rename ${ROOT}/.env.setup-tmp ${env}`,
      `rm ${ROOT}/.env.setup-tmp`,
    ]);
    expect(logs[3]).toBe("✔ Plik .env: wygenerowano AUTH_SECRET w istniejącym .env");
    expect(logs.join("\n")).not.toContain(SECRET);
  });

  it("updates the target of a symlinked .env instead of replacing the link", () => {
    const env = `${ROOT}/.env`;
    const shared = "/shared/devmentor.env";
    const { deps, store, calls } = createFakeDeps({ ...READY, files: { ...READY.files, [env]: "AUTH_SECRET=\n" }, links: { [env]: shared }, modes: { [shared]: 0o600 } });
    store.set(shared, "AUTH_SECRET=\n");

    expect(runSetup(deps)).toBe(0);

    expect(store.get(shared)).toBe(`AUTH_SECRET=${SECRET}\n`);
    expect(calls).toContain(`rename /shared/.env.setup-tmp ${shared}`);
  });

  it("installs when package-lock.json is missing", () => {
    const { deps, store, calls } = createFakeDeps(READY);
    store.delete(`${ROOT}/package-lock.json`);

    expect(runSetup(deps)).toBe(0);
    expect(execCalls(calls)).toContain("exec npm install (inherit)");
  });

  it("copies an example that already has a secret without generating one", () => {
    const { deps, store, logs } = createFakeDeps({ ...READY, files: { ...READY.files, [`${ROOT}/.env.example`]: "AUTH_SECRET=from-example\n" } });
    store.delete(`${ROOT}/.env`);

    expect(runSetup(deps)).toBe(0);
    expect(store.get(`${ROOT}/.env`)).toBe("AUTH_SECRET=from-example\n");
    expect(logs[3]).toBe("✔ Plik .env: utworzono .env z .env.example");
  });

  it("removes the temporary file when writing .env fails", () => {
    const { deps, store, calls, errors } = createFakeDeps({ failWrite: true, files: { [`${ROOT}/package-lock.json`]: "{}" } });

    expect(runSetup(deps)).toBe(1);

    expect(calls.at(-1)).toBe(`rm ${ROOT}/.env.setup-tmp`);
    expect(store.has(`${ROOT}/.env`)).toBe(false);
    expect(errors).toEqual(["✖ Plik .env: EACCES: disk full"]);
    expect(execCalls(calls)).not.toContain("exec docker compose up -d --wait postgres (inherit)");
  });

  it("stops on an old Node.js before running anything", () => {
    const { deps, calls, errors } = createFakeDeps({ nodeVersion: "20.11.0" });

    expect(runSetup(deps)).toBe(1);

    expect(calls).toEqual([]);
    expect(errors).toEqual(["✖ Node.js: wymagany Node.js >=22.17, a uruchomiony jest 20.11.0. Zainstaluj nowszą wersję (https://nodejs.org) i spróbuj ponownie."]);
  });

  it("stops when package.json has no engines.node", () => {
    const { deps, errors } = createFakeDeps({ files: { [`${ROOT}/package.json`]: "{}" } });

    expect(runSetup(deps)).toBe(1);
    expect(errors).toEqual(["✖ Node.js: brak pola engines.node w package.json."]);
  });

  it("stops without Docker Compose before writing .env", () => {
    const { deps, store, calls, errors } = createFakeDeps({ responses: { "docker compose version": { status: null } } });

    expect(runSetup(deps)).toBe(1);

    expect(execCalls(calls)).toEqual(["exec docker compose version"]);
    expect(store.has(`${ROOT}/.env`)).toBe(false);
    expect(errors[0]).toMatch(/^✖ Docker: nie znaleziono Dockera z Compose/);
  });

  it("stops when the Docker daemon does not respond", () => {
    const { deps, calls, errors } = createFakeDeps({ responses: { "docker info": { status: 1 } } });

    expect(runSetup(deps)).toBe(1);

    expect(execCalls(calls)).toEqual(["exec docker compose version", "exec docker info"]);
    expect(errors[0]).toMatch(/^✖ Docker: Docker nie odpowiada/);
  });

  it("stops at a failing command and names it", () => {
    const { deps, calls, errors } = createFakeDeps({ files: { [`${ROOT}/package-lock.json`]: "{}" }, responses: { "npm install": { status: 1 } } });

    expect(runSetup(deps)).toBe(1);

    expect(execCalls(calls).at(-1)).toBe("exec npm install (inherit)");
    expect(errors).toEqual(["✖ Zależności npm: „npm install” zakończyło się kodem 1. Popraw błąd powyżej i uruchom „npm run setup” ponownie albo wykonaj to polecenie ręcznie."]);
  });

  it("reports a command killed by a signal", () => {
    const { deps, errors } = createFakeDeps({ ...READY, responses: { ...READY.responses, "docker compose ps --format json postgres": { status: 1 }, "docker compose up -d --wait postgres": { status: null } } });

    expect(runSetup(deps)).toBe(1);
    expect(errors[0]).toMatch(/^✖ PostgreSQL: „docker compose up -d --wait postgres” zakończyło się kodem nieznanym\./);
  });

  it("migrates when the pending check fails or lists migrations", () => {
    for (const pending of [{ status: 1, stdout: "No pending migrations" }, { status: 0, stdout: "Migration20261025" }]) {
      const { deps, calls } = createFakeDeps({ ...READY, responses: { ...READY.responses, "npm run --silent db:migration:pending": pending } });
      expect(runSetup(deps)).toBe(0);
      expect(execCalls(calls).at(-1)).toBe("exec npm run db:migrate (inherit)");
    }
  });

  it("reports a non-Error throw", () => {
    const { deps, errors } = createFakeDeps();
    deps.fs.readFileSync = () => {
      throw "boom";
    };

    expect(runSetup(deps)).toBe(1);
    expect(errors).toEqual(["✖ Node.js: boom"]);
  });
});
