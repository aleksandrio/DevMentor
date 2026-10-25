import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import { repoRoot } from "./paths";

const execFileAsync = promisify(execFile);

const binary = path.join(repoRoot, "node_modules/.bin/agent-browser");

// Chrome puts its singleton socket in TMPDIR and aborts when the path exceeds
// the Unix socket limit (~108 bytes), which agent worktrees easily do.
const SHORT_TMPDIR = process.platform === "win32" ? undefined : "/tmp";

// One command may wait for navigation or a slow first render.
const COMMAND_TIMEOUT_MS = 30_000;

interface CommandResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
}

/**
 * Drives one isolated browser session through the agent-browser CLI, the same
 * tool agents use by hand (`npx agent-browser ...`). Every call runs
 * `agent-browser --session <id> --json <args>` and throws on `success: false`.
 */
export class AgentBrowser {
  readonly session = `devmentor-${randomUUID()}`;

  constructor(private readonly baseUrl: string) {}

  async run(...args: string[]): Promise<Record<string, unknown>> {
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync(binary, ["--session", this.session, "--json", ...args], {
        env: { ...process.env, ...(SHORT_TMPDIR && { TMPDIR: SHORT_TMPDIR }) },
        timeout: COMMAND_TIMEOUT_MS,
      }));
    } catch (error) {
      // A failed command exits non-zero but still prints its JSON result.
      stdout = (error as { stdout?: string }).stdout ?? "";
      if (!stdout) {
        throw error;
      }
    }
    const result = JSON.parse(stdout) as CommandResult;
    if (!result.success) {
      throw new Error(`agent-browser ${args.join(" ")}: ${result.error}`);
    }
    return result.data ?? {};
  }

  /** Opens a path of the app under test (e.g. `/login`). */
  async open(pathname: string): Promise<void> {
    await this.run("open", new URL(pathname, this.baseUrl).href);
  }

  async fillByLabel(label: string, value: string): Promise<void> {
    await this.run("find", "label", label, "fill", value, "--exact");
  }

  async clickButton(name: string): Promise<void> {
    await this.run("find", "role", "button", "click", "--name", name, "--exact");
  }

  async clickLink(name: string): Promise<void> {
    await this.run("find", "role", "link", "click", "--name", name, "--exact");
  }

  /**
   * Waits until path + query are exactly `pathname` (e.g. `/login?next=/admin`).
   * Not `wait --url`: it matches a pattern, so `http://host/` already matches
   * `http://host/register` and the wait returns before the navigation.
   */
  async waitForPath(pathname: string): Promise<void> {
    await this.run("wait", "--fn", `location.pathname + location.search === ${JSON.stringify(pathname)}`);
  }

  async waitForText(text: string): Promise<void> {
    await this.run("wait", "--text", text);
  }

  async path(): Promise<string> {
    const { url } = await this.run("get", "url");
    const current = new URL(String(url));
    return `${current.pathname}${current.search}`;
  }

  async text(selector = "body"): Promise<string> {
    const { text } = await this.run("get", "text", selector);
    return String(text);
  }

  async close(): Promise<void> {
    await this.run("close");
  }
}
