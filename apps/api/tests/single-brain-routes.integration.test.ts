import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";

describe("single brain HTTP routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let dir = "";
  const auth = { authorization: "Bearer dev:user-a:user@example.com" };
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "comma-single-brain-routes-"));
    const model = { baseUrl: undefined, apiKey: undefined, model: "gpt-5.4", wireApi: "responses" as const, reasoningEffort: "xhigh" as const, disableResponseStorage: true };
    const env: AppEnv = { apiPort: 3001, dataFile: join(dir, "store.json"), personalCoreSqliteFile: join(dir, "core.sqlite"), agentMode: "stub", authDevBypassEnabled: true, defaultModelConfig: model, agentModelConfigs: Object.fromEntries(OPENCLAW_AGENT_NAMES.map((name) => [name, model])) };
    app = await buildApp(env);
  });
  afterEach(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });

  it("requires bearer authentication", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/core/conversations" })).statusCode).toBe(401);
  });

  it("creates, lists, reads, sends idempotently, archives and deletes an owned conversation", async () => {
    const created = await app.inject({ method: "POST", url: "/v1/core/conversations", headers: auth, payload: { title: "我的会话", userId: "attacker", profileId: "attacker-profile" } });
    expect(created.statusCode).toBe(201);
    const conversation = created.json();
    expect(conversation.userId).toBe("user-a");
    expect(conversation.profileId).toBe("profile:user-a");
    const listed = await app.inject({ method: "GET", url: "/v1/core/conversations", headers: auth });
    expect(listed.statusCode).toBe(200); expect(listed.json().conversations).toHaveLength(1);
    const sent = await app.inject({ method: "POST", url: `/v1/core/conversations/${conversation.id}/messages`, headers: { ...auth, "idempotency-key": "turn-1" }, payload: { content: "你好", userId: "other" } });
    expect(sent.statusCode).toBe(201); expect(sent.json().assistantMessage.status).toBe("completed");
    const replay = await app.inject({ method: "POST", url: `/v1/core/conversations/${conversation.id}/messages`, headers: { ...auth, "idempotency-key": "turn-1" }, payload: { content: "你好" } });
    expect(replay.statusCode).toBe(200);
    const archived = await app.inject({ method: "POST", url: `/v1/core/conversations/${conversation.id}/archive`, headers: auth });
    expect(archived.statusCode).toBe(200); expect(archived.json().status).toBe("archived");
    const blocked = await app.inject({ method: "POST", url: `/v1/core/conversations/${conversation.id}/messages`, headers: auth, payload: { content: "再说一句" } });
    expect(blocked.statusCode).toBe(404);
    const deleted = await app.inject({ method: "DELETE", url: `/v1/core/conversations/${conversation.id}`, headers: auth });
    expect(deleted.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: `/v1/core/conversations/${conversation.id}`, headers: auth })).statusCode).toBe(404);
  });

  it("does not reveal another user's conversation", async () => {
    const own = await app.inject({ method: "POST", url: "/v1/core/conversations", headers: auth, payload: {} });
    const id = own.json().id;
    const other = await app.inject({ method: "GET", url: `/v1/core/conversations/${id}`, headers: { authorization: "Bearer dev:user-b" } });
    expect(other.statusCode).toBe(404);
  });
});
