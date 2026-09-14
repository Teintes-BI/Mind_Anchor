import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildApp } from "../src/app.js";
import { getEnv } from "../src/env.js";

/**
 * Contract test for the T2 desktop upload path.
 *
 * The Rust client (`apps/desktop-tauri/src-tauri/src/upload/payload.rs`) emits a
 * body for `POST /v1/core/events`. This test feeds a *verbatim* copy of that
 * body — captured from the Rust serialiser, so a field rename on either side
 * breaks this test — into the real Fastify app via `inject()`.
 *
 * Using `inject()` is deliberate: it exercises the full route, auth, Zod
 * validation and repository stack without binding a port or starting a server.
 */

/** Captured from `to_core_event(...)` + `serde_json::to_string`. */
const RUST_BODY = {
  clientEventId: "desktop-activity-0000000000000000",
  eventType: "activity",
  occurredAt: "2026-09-14T12:00:00.000Z",
  source: "desktop",
  privacyLevel: "P1",
  confidence: 0.34,
  payload: {
    schema: "comma.desktop.activity.v1",
    sampleCount: 42,
    decisionCount: 42,
    eligibleCount: 3,
    totalIdleSeconds: 900,
    hourlyActivity: [
      [472222, 42],
    ],
  },
};

describe("desktop T2 upload contract", () => {
  it("accepts the Rust-generated body and honours idempotency", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-desktop-upload-"));
    const app = await buildApp({
      ...getEnv(),
      dataFile: join(directory, "legacy.json"),
      personalCoreSqliteFile: join(directory, "core.sqlite"),
      authDevBypassEnabled: true,
    });
    await app.ready();

    const headers = { authorization: "Bearer dev:u-1" };

    const first = await app.inject({
      method: "POST",
      url: "/v1/core/events",
      headers,
      payload: RUST_BODY,
    });
    expect(first.statusCode, `body: ${first.body}`).toBe(201);

    const stored = JSON.parse(first.body);
    expect(stored.eventType).toBe("activity");
    expect(stored.source).toBe("desktop");
    expect(stored.privacyLevel).toBe("P1");
    expect(stored.clientEventId).toBe(RUST_BODY.clientEventId);
    expect(stored.payload.sampleCount).toBe(42);

    // Re-sending the same aggregate must resolve to the same row, which is what
    // makes the Rust retry loop safe.
    const retry = await app.inject({
      method: "POST",
      url: "/v1/core/events",
      headers,
      payload: RUST_BODY,
    });
    expect(retry.statusCode).toBe(201);
    expect(JSON.parse(retry.body).id).toBe(stored.id);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });

  it("keeps per-user isolation for desktop events", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-desktop-upload-"));
    const app = await buildApp({
      ...getEnv(),
      dataFile: join(directory, "legacy.json"),
      personalCoreSqliteFile: join(directory, "core.sqlite"),
      authDevBypassEnabled: true,
    });
    await app.ready();

    await app.inject({
      method: "POST",
      url: "/v1/core/events",
      headers: { authorization: "Bearer dev:u-1" },
      payload: RUST_BODY,
    });

    const otherUser = await app.inject({
      method: "GET",
      url: "/v1/core/events",
      headers: { authorization: "Bearer dev:u-2" },
    });
    expect(JSON.parse(otherUser.body).events).toHaveLength(0);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });

  it("rejects an event that claims P3, the egress-forbidden grade", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-desktop-upload-"));
    const app = await buildApp({
      ...getEnv(),
      dataFile: join(directory, "legacy.json"),
      personalCoreSqliteFile: join(directory, "core.sqlite"),
      authDevBypassEnabled: true,
    });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/v1/core/events",
      headers: { authorization: "Bearer dev:u-1" },
      payload: { ...RUST_BODY, privacyLevel: "P3" },
    });
    // The P3 egress guard must reject this regardless of who sends it.
    expect(response.statusCode).not.toBe(201);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });

  it("requires authentication", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-desktop-upload-"));
    const app = await buildApp({
      ...getEnv(),
      dataFile: join(directory, "legacy.json"),
      personalCoreSqliteFile: join(directory, "core.sqlite"),
      authDevBypassEnabled: true,
    });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/v1/core/events",
      payload: RUST_BODY,
    });
    expect(response.statusCode).toBe(401);

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });
});
