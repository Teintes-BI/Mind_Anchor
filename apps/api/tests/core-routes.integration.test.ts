import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildApp } from "../src/app.js";
import { getEnv } from "../src/env.js";

describe("Personal Core HTTP API", () => {
  it("initializes personal core and enforces bearer auth", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-core-route-"));
    const app = await buildApp({ ...getEnv(), dataFile: join(directory, "legacy.json"), personalCoreSqliteFile: join(directory, "core.sqlite"), authDevBypassEnabled: true });
    await app.ready();
    expect((await app.inject({ method: "GET", url: "/v1/core/state/current" })).statusCode).toBe(401);
    const state = await app.inject({ method: "GET", url: "/v1/core/state/current", headers: { authorization: "Bearer dev:u-1" } });
    expect(state.statusCode).toBe(200);
    expect(JSON.parse(state.body).state).toBeNull();
    const event = await app.inject({ method: "POST", url: "/v1/core/events", headers: { authorization: "Bearer dev:u-1", "idempotency-key": "route-1" }, payload: { eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { summary: "editor" }, privacyLevel: "P1", confidence: 1 } });
    expect(event.statusCode).toBe(201);
    const retry = await app.inject({ method: "POST", url: "/v1/core/events", headers: { authorization: "Bearer dev:u-1", "idempotency-key": "route-1" }, payload: { eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { summary: "editor" }, privacyLevel: "P1", confidence: 1 } });
    expect(JSON.parse(retry.body).id).toBe(JSON.parse(event.body).id);
    const otherUser = await app.inject({ method: "GET", url: "/v1/core/events", headers: { authorization: "Bearer dev:u-2" } });
    expect(JSON.parse(otherUser.body).events).toHaveLength(0);
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });

  it("supports state, compass, export and delete", async () => {
    const directory = mkdtempSync(join(tmpdir(), "comma-core-route-"));
    const app = await buildApp({ ...getEnv(), dataFile: join(directory, "legacy.json"), personalCoreSqliteFile: join(directory, "core.sqlite"), authDevBypassEnabled: true });
    await app.ready();
    const headers = { authorization: "Bearer dev:u-1" };
    const report = await app.inject({ method: "POST", url: "/v1/core/state/reports", headers, payload: { energy: 70, emotion: 60, cognitiveLoad: 30, mentalNoise: 20, focusReadiness: 80, physicalFatigue: 25, recoveryNeed: 15, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: "2026-08-24T10:00:00.000Z" } });
    expect(report.statusCode).toBe(201);
    const candidate = await app.inject({ method: "POST", url: "/v1/core/life-compass/candidates", headers, payload: { content: "Protect sustainable meaningful work" } });
    expect(candidate.statusCode).toBe(201);
    const candidateId = JSON.parse(candidate.body).id;
    const confirm = await app.inject({ method: "POST", url: `/v1/core/life-compass/candidates/${candidateId}/confirm`, headers, payload: { expectedVersion: null } });
    expect(JSON.parse(confirm.body).version).toBe(1);
    expect((await app.inject({ method: "GET", url: "/v1/core/export", headers })).statusCode).toBe(200);
    expect((await app.inject({ method: "DELETE", url: "/v1/core/data", headers })).statusCode).toBe(200);
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(directory, { recursive: true, force: true });
  });
});
