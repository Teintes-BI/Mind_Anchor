import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "with-openclaw-real-env.mjs");

const writeProfile = async (homeDir) => {
  const profileHome = join(homeDir, ".openclaw-dev");
  await mkdir(profileHome, { recursive: true });
  await writeFile(
    join(profileHome, "openclaw.json"),
    JSON.stringify({
      models: {
        providers: {
          default: {
            baseUrl: "https://provider.example.com",
            api: "openai-responses",
            apiKey: "profile-token",
            models: [{ id: "gpt-5.4" }],
          },
        },
      },
    }),
    "utf8",
  );
  return profileHome;
};

test("with-openclaw-real-env dry-run prints non-secret aligned env summary", async () => {
  const homeDir = await mkdir(join(tmpdir(), `mindanchor-openclaw-env-${Date.now()}-`), { recursive: true });
  await writeProfile(homeDir);

  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--", "node", "-e", "console.log(process.env.MINDANCHOR_DEFAULT_MODEL_NAME)"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      HOME: homeDir,
      MINDANCHOR_DEFAULT_MODEL_BASE_URL: "https://drift.example.com",
      MINDANCHOR_DEFAULT_MODEL_NAME: "other-model",
      MINDANCHOR_DEFAULT_MODEL_WIRE_API: "chat-completions",
      MINDANCHOR_DEFAULT_MODEL_API_KEY: "shell-token",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.profileName, "dev");
  assert.deepEqual(payload.command, ["node", "-e", "console.log(process.env.MINDANCHOR_DEFAULT_MODEL_NAME)"]);
  assert.deepEqual(payload.envSummary, {
    MINDANCHOR_DEFAULT_MODEL_BASE_URL: "https://provider.example.com",
    MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
    MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
    MINDANCHOR_DEFAULT_MODEL_API_KEY_PRESENT: true,
  });
  assert.deepEqual(payload.driftCodes, [
    "provider_base_url_drift",
    "provider_model_drift",
    "provider_wire_api_drift",
    "provider_api_key_drift",
  ]);
  assert.equal(result.stdout.includes("profile-token"), false);
  assert.equal(result.stdout.includes("shell-token"), false);
});

test("with-openclaw-real-env executes command with OpenClaw profile env overrides", async () => {
  const homeDir = await mkdir(join(tmpdir(), `mindanchor-openclaw-env-run-${Date.now()}-`), { recursive: true });
  await writeProfile(homeDir);

  const result = spawnSync(
    process.execPath,
    [
      ENTRY_FILE,
      "--",
      process.execPath,
      "-e",
      "console.log([process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL, process.env.MINDANCHOR_DEFAULT_MODEL_NAME, process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API, process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY].join('|'))",
    ],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        HOME: homeDir,
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "https://provider.example.com|gpt-5.4|responses|profile-token");
});

test("with-openclaw-real-env accepts pnpm-style leading separator before options", async () => {
  const homeDir = await mkdir(join(tmpdir(), `mindanchor-openclaw-env-pnpm-${Date.now()}-`), { recursive: true });
  await writeProfile(homeDir);

  const result = spawnSync(process.execPath, [ENTRY_FILE, "--", "--dry-run", "--", "node", "-e", "console.log('ok')"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      HOME: homeDir,
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.deepEqual(payload.command, ["node", "-e", "console.log('ok')"]);
  assert.equal(payload.envSummary.MINDANCHOR_DEFAULT_MODEL_NAME, "gpt-5.4");
});
