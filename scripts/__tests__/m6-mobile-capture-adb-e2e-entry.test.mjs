import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "run-m6-mobile-capture-adb-e2e.mjs");

test("M6 mobile capture ADB e2e dry-run exposes endpoint plan and paths", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-24T15-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.apiHost, "0.0.0.0");
  assert.equal(payload.options.preferredApiPort, 3011);
  assert.equal(payload.options.userId, "m6-mobile-user");
  assert.equal(payload.options.deviceId, "android-m6-capture");
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "test-results", "m6-mobile-capture-adb-e2e-2026-04-24T15-00-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "test-results", "m6-mobile-capture-adb-e2e-2026-04-24T15-00-00Z.md"));
  assert.deepEqual(
    payload.endpointPlan.map((step) => `${step.method} ${step.endpoint}`),
    [
      "POST /mobile/devices/register",
      "POST /devices/register",
      "POST /devices/heartbeat",
      "POST /mobile/capture/sessions/start",
      "POST /mobile/call-events",
      "POST /emotion/assessments",
      "POST /media/upload-sessions",
      "POST /media/upload-sessions/:sessionId/parts",
      "POST /media/upload-sessions/:sessionId/complete",
      "POST /video/assessments",
      "POST /health/snapshots",
      "POST /mobile/capture/sessions/end",
      "POST /recovery/plan",
      "GET /recovery/history",
      "GET /health/latest",
      "GET /client/inbox",
      "POST /client/inbox/:messageId/ack",
      "GET /dashboard/summary",
      "GET /client/inbox/overview",
    ],
  );
});

test("M6 mobile capture ADB e2e dry-run accepts out-dir and device overrides", () => {
  const result = spawnSync(
    process.execPath,
    [ENTRY_FILE, "--dry-run", "--out-dir", "tmp/m6", "--device-id", "phone-1", "--user-id", "user-1"],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-24T15-01-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.userId, "user-1");
  assert.equal(payload.options.deviceId, "phone-1");
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "tmp", "m6", "m6-mobile-capture-adb-e2e-2026-04-24T15-01-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "tmp", "m6", "m6-mobile-capture-adb-e2e-2026-04-24T15-01-00Z.md"));
});

test("M6 mobile capture ADB e2e dry-run exposes the cadenced scenario phase plan", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--scenario", "cadenced"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-25T10-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.scenario, "cadenced");
  assert.deepEqual(
    payload.phasePlan.map((phase) => phase.name),
    ["baseline", "stress-build-up-1", "stress-build-up-2", "recovery-trigger", "post-recovery"],
  );
});

test("M6 mobile capture ADB e2e dry-run exposes authenticated client-session metadata", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--scenario", "cadenced", "--with-client-session"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-25T10-30-00Z",
      MINDANCHOR_M6_CLIENT_SESSION_EMAIL: "m6-client@example.com",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.withClientSession, true);
  assert.equal(payload.clientSession.authEmail, "m6-client@example.com");
  assert.deepEqual(payload.clientSession.plan, [
    "POST /auth/login",
    "POST /auth/register (if needed)",
    "GET /me",
    "GET /client/bootstrap",
    "GET /client/inbox",
    "POST /client/inbox/:messageId/ack (if needed)",
    "GET /client/inbox/overview",
  ]);
});

test("M6 mobile capture ADB e2e dry-run exposes fixed-duration client polling metadata", () => {
  const result = spawnSync(
    process.execPath,
    [ENTRY_FILE, "--dry-run", "--scenario", "cadenced", "--with-client-polling"],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-25T14-30-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.withClientSession, true);
  assert.equal(payload.options.withClientPolling, true);
  assert.deepEqual(payload.clientPolling, {
    enabled: true,
    durationMs: 30000,
    intervalMs: 5000,
    minPollCount: 2,
    plan: ["GET /client/bootstrap", "GET /client/inbox", "GET /client/inbox/overview"],
  });
});

test("M6 mobile capture ADB e2e dry-run exposes session recovery metadata", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--scenario", "cadenced", "--with-session-recovery"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-25T15-10-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.withClientSession, true);
  assert.equal(payload.options.withSessionRecovery, true);
  assert.deepEqual(payload.sessionRecovery, {
    enabled: true,
    tokenStorage: "android-temp-file",
    plan: [
      "persist access token to Android temp file",
      "reload access token from Android temp file",
      "GET /me with reloaded token",
      "GET /client/bootstrap with reloaded token",
      "GET /client/inbox with reloaded token",
      "GET /client/inbox/overview with reloaded token",
      "delete Android temp token file",
    ],
  });
});

test("M6 mobile capture ADB e2e dry-run exposes refresh-token recovery metadata", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--scenario", "cadenced", "--with-refresh-token-recovery"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP: "2026-04-25T16-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.withClientSession, true);
  assert.equal(payload.options.withRefreshTokenRecovery, true);
  assert.deepEqual(payload.refreshTokenRecovery, {
    enabled: true,
    tokenStorage: "android-temp-file",
    plan: [
      "persist refresh token to Android temp file",
      "reload refresh token from Android temp file",
      "POST /auth/refresh with reloaded refresh token",
      "POST /auth/refresh with old refresh token expects 401",
      "GET /me with rotated access token",
      "GET /client/bootstrap with rotated access token",
      "POST /auth/logout with rotated refresh token",
      "POST /auth/refresh after logout expects 401",
      "delete Android temp refresh token file",
    ],
  });
});
