import { exec, execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

describe("API production bundle", () => {
  it("stages the OpenClaw runtime next to the compiled API imports", async () => {
    if (process.platform === "win32") {
      await execFileAsync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "corepack pnpm --filter @mindanchor/api build"], {
        cwd: process.cwd(),
      });
    } else {
      await execAsync("corepack pnpm --filter @mindanchor/api build", { cwd: process.cwd() });
    }

    expect(existsSync("../openclaw/runtime/agent-registry.mjs")).toBe(true);
    expect(existsSync("../packages/domain/dist/index.js")).toBe(true);
  }, 90_000);
});
