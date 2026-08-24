# Comma V0.1-B Single Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已验收的 Personal Core Skeleton 上实现一条可审计、可回退、隐私受控的持续文字聊天闭环：`用户消息 -> bounded Context Packet -> 一个模型 adapter -> 助手回复`。

**Architecture:** 新增独立的 `CommaSingleBrainService`，它依次调用 `CoreRepository`、`ContextBuilder` 和一个 `SingleBrainModelAdapter`。聊天 session/message 存入 Personal Core 的 P1 表；Life Compass、当前 State 和近期 Event 由 Context Builder 生成两个投影：本地完整投影与云端安全投影。任何模型调用都只能接收其中一个投影，并将 context hash、数据边界、模型层级和结果状态写入 `core_system_traces`，不把 prompt、route、agent 名或原始模型响应写入 Personal Memory。

**Tech Stack:** Node 22, TypeScript, Fastify 5, Zod 3, SQLite/better-sqlite3, Vitest, React/Vite Web client, existing `ModelBridge` OpenAI-compatible/OpenClaw adapter。

---

## 目标、边界与退出条件

### 本阶段必须交付

1. 用户可创建、查看、继续和删除聊天 session。
2. 每条用户消息先持久化，再构造有界 Context Packet。
3. Context Packet 至少支持 active Life Compass、current State、近期 Core Events 和本轮用户消息；没有 Memory 表时不伪造 Memory。
4. 同一个 `SingleBrainModelAdapter` 产生助手回复；stub 模式不依赖网络，OpenAI-compatible 模式使用现有 `ModelBridge`。
5. 请求失败、模型不可用、隐私边界不允许时返回明确的 `failed`/`blocked` 状态，不伪造成功回复。
6. 每条消息支持 `Idempotency-Key`，重复请求不生成第二条用户消息或第二条 assistant message。
7. P3 Life Compass 在云端模型请求中绝不发送；若没有本地模型，回复中明确标记 `redactions`。
8. Web 至少有一个可用的 Single Brain 页面；旧 Coach 页面和 Wayfinder 页面继续工作。

### 明确不做

- 不做七 Agent routing、Skill routing、专家 consult、Choice Engine、Intervention、Memory candidate/retrieval、Voice、TTS、ASR、桌面主动打断。
- 不让模型直接创建 Task、改 Life Compass、写 State、发通知或调用外部工具。
- 不把现有 `ConversationCoachService` 改造成 Single Brain；Coach 作为兼容旧产品能力继续存在。
- 不把完整 chat prompt、内部 system prompt、原始模型响应、Agent 名、OpenClaw route 写入长期 Memory。
- 不在本阶段引入向量数据库、Redis、Postgres、队列服务或多用户云同步。

### 阶段退出条件

Core 单测、Single Brain 服务单测、API contract、Web smoke、API build、Web build 和旧 API/Wayfinder 回归全部通过；10 个固定 Context fixture 中 P3 外泄率为 0；stub 模式完全离线可用；模型失败和重复请求都有自动化证据。

## 文件地图

- Create: `packages/domain/src/single-brain.ts`：聊天、Context Packet、模型结果的 Zod contracts。
- Modify: `packages/domain/src/index.ts`：导出 Single Brain contracts。
- Modify: `apps/api/src/core/sqlite-schema.ts`：增加 migration 3，建立 conversations/messages 及索引。
- Modify: `apps/api/src/core/core-types.ts`：扩展 conversation repository methods 和 input types。
- Modify: `apps/api/src/core/sqlite-core-repository.ts`：实现 session/message 生命周期和导出/删除级联。
- Create: `apps/api/src/core/context-builder.ts`：从 Core 构造 bounded local/cloud Context Packet。
- Create: `apps/api/src/core/context-redaction.ts`：敏感字段过滤、长度预算和 hash。
- Create: `apps/api/src/services/single-brain-model.ts`：模型 adapter interface、stub adapter、ModelBridge adapter。
- Create: `apps/api/src/services/single-brain-service.ts`：聊天编排、状态机、trace 记录。
- Create: `apps/api/src/routes/single-brain.ts`：`/v1/core/conversations` HTTP API。
- Modify: `apps/api/src/app.ts`：注册 service/routes，复用已初始化 Core repository。
- Modify: `apps/api/src/env.ts`：增加 `MINDANCHOR_SINGLE_BRAIN_DATA_BOUNDARY` 和单脑目标配置。
- Create: `apps/api/tests/single-brain-domain.test.ts`。
- Create: `apps/api/tests/context-builder.test.ts`。
- Create: `apps/api/tests/single-brain-repository.test.ts`。
- Create: `apps/api/tests/single-brain-model.test.ts`。
- Create: `apps/api/tests/single-brain-service.test.ts`。
- Create: `apps/api/tests/single-brain-routes.integration.test.ts`。
- Modify: `apps/api/tests/core-privacy-export-delete.test.ts`：验证 chat export/delete。
- Modify: `apps/web/src/api.ts`：增加 typed conversation client。
- Create: `apps/web/src/pages/SingleBrainPage.tsx`。
- Create: `apps/web/src/pages/__tests__/single-brain-smoke.test.tsx`。
- Modify: `apps/web/src/App.tsx`：增加 `/single-brain` 导航。
- Modify: `apps/web/src/styles.css`：仅增加聊天页面所需状态样式。
- Create: `docs/architecture/comma-v0.1-single-brain-runbook.md`：运行、隐私和故障排查。

---

### Task 1: 定义 Single Brain domain contracts

**Files:**
- Create: `packages/domain/src/single-brain.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/single-brain-domain.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import {
  conversationMessageSchema,
  contextPacketSchema,
  singleBrainGenerationSchema,
} from "@mindanchor/domain";

describe("Single Brain contracts", () => {
  it("requires a bounded context packet and an explicit data boundary", () => {
    expect(() => contextPacketSchema.parse({
      conversationId: "conv-1",
      profileId: "profile:u-1",
      userId: "u-1",
      userMessage: "我今天不知道先做什么",
      dataBoundary: "cloud_allowed",
      lifeCompass: null,
      currentState: null,
      recentEvents: [],
      redactions: ["P3_life_compass_omitted"],
      sourceEventIds: [],
      characterCount: 18,
      contextHash: "hash-1",
      createdAt: "2026-08-24T10:00:00.000Z",
    })).not.toThrow();
  });

  it("does not accept an assistant message without a terminal status", () => {
    expect(() => conversationMessageSchema.parse({
      id: "msg-1", conversationId: "conv-1", profileId: "profile:u-1", userId: "u-1",
      role: "assistant", content: "回复", status: "pending",
      createdAt: "2026-08-24T10:00:00.000Z",
    })).toThrow();
  });

  it("requires response text in a completed generation", () => {
    expect(() => singleBrainGenerationSchema.parse({ status: "completed" })).toThrow();
    expect(singleBrainGenerationSchema.parse({ status: "completed", response: "先做一个最小步骤。" }).status).toBe("completed");
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-domain.test.ts` from `apps/api`.

Expected: FAIL because the new contracts are not exported.

- [ ] **Step 3: 实现最小 contracts**

`single-brain.ts` 定义以下固定枚举和 schema：

```ts
export const conversationRoleSchema = z.enum(["user", "assistant", "system"]);
export const conversationMessageStatusSchema = z.enum(["pending", "completed", "failed", "blocked"]);
export const conversationStatusSchema = z.enum(["active", "archived", "deleted"]);
export const contextDataBoundarySchema = z.enum(["local_only", "cloud_allowed"]);
export const singleBrainGenerationStatusSchema = z.enum(["completed", "failed", "blocked"]);

export const conversationMessageSchema = z.object({
  id: z.string().min(1), conversationId: z.string().min(1), profileId: z.string().min(1),
  userId: z.string().min(1), role: conversationRoleSchema,
  content: z.string().min(1).max(12000), status: z.enum(["completed", "failed", "blocked"]),
  clientMessageId: z.string().min(1).optional(),
  modelTier: z.string().nullable().default(null),
  contextHash: z.string().nullable().default(null),
  redactions: z.array(z.string()).default([]),
  failureCode: z.string().nullable().default(null),
  createdAt: z.string().datetime({ offset: true }),
});

export const contextPacketSchema = z.object({
  conversationId: z.string().min(1), profileId: z.string().min(1), userId: z.string().min(1),
  userMessage: z.string().min(1).max(12000), dataBoundary: contextDataBoundarySchema,
  lifeCompass: z.string().max(5000).nullable(),
  currentState: z.record(z.unknown()).nullable(),
  recentEvents: z.array(z.object({ id: z.string(), occurredAt: z.string(), type: z.string(), summary: z.string().max(500) })).max(12),
  redactions: z.array(z.string()), sourceEventIds: z.array(z.string()),
  characterCount: z.number().int().nonnegative().max(24000), contextHash: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});

export const singleBrainGenerationSchema = z.object({
  status: z.literal("completed"), response: z.string().min(1).max(12000),
  userFacingNote: z.string().max(500).optional(),
});
```

Also export `ConversationMessage`, `ContextPacket`, and `SingleBrainGeneration` types. The domain schema must reject raw `prompt`, `route`, `agent`, `rawAudio`, and `screenshot` keys in `recentEvents` summaries by constructing that object from an exact allowlist rather than accepting arbitrary records.

- [ ] **Step 4: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-domain.test.ts`.

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add packages/domain/src/single-brain.ts packages/domain/src/index.ts apps/api/tests/single-brain-domain.test.ts
git commit -m "feat: define single brain contracts"
```

### Task 2: SQLite migration 3 for conversations and messages

**Files:**
- Modify: `apps/api/src/core/sqlite-schema.ts`
- Test: `apps/api/tests/single-brain-repository.test.ts`

- [ ] **Step 1: 写失败测试**

用 `:memory:` 数据库调用 `applyCoreMigrations` 两次，断言新表存在且 migration 3 只出现一次：

```ts
expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'core_conversations'").get()).toBeTruthy();
expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'core_conversation_messages'").get()).toBeTruthy();
expect(db.prepare("SELECT COUNT(*) AS count FROM core_schema_migrations").get().count).toBe(3);
```

断言删除 `core_profiles` 后，相关 conversation 和 messages 由 foreign-key cascade 删除。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-repository.test.ts` from `apps/api`.

Expected: FAIL because migration 3 and tables do not exist.

- [ ] **Step 3: 实现 migration 3**

在 `CORE_MIGRATIONS` 末尾增加：

```sql
CREATE TABLE IF NOT EXISTS core_conversations (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS core_conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES core_conversations(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  client_message_id TEXT,
  model_tier TEXT,
  context_hash TEXT,
  redactions_json TEXT NOT NULL,
  failure_code TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS core_conversation_client_message_key
  ON core_conversation_messages(conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS core_conversation_messages_order
  ON core_conversation_messages(conversation_id, created_at, id);
```

`applyCoreMigrations` 的 checksum 机制继续保护已应用 migration；不能修改 migration 1/2 SQL。

- [ ] **Step 4: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-repository.test.ts`.

Expected: migration idempotency/cascade assertions pass; repository behavior tests may still fail until Task 3 完成，这是预期的下一层 RED 状态。

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/core/sqlite-schema.ts apps/api/tests/single-brain-repository.test.ts
git commit -m "feat: add single brain conversation tables"
```

### Task 3: 扩展 Core repository 的 conversation/message 生命周期

**Files:**
- Modify: `apps/api/src/core/core-types.ts`
- Modify: `apps/api/src/core/sqlite-core-repository.ts`
- Modify: `apps/api/src/core/core-export.ts`
- Test: `apps/api/tests/single-brain-repository.test.ts`
- Modify: `apps/api/tests/core-privacy-export-delete.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖以下行为：

```ts
const conversation = await repo.createConversation({ profileId: "p", userId: "u", title: "今天的对话" });
const user = await repo.appendConversationMessage({
  profileId: "p", userId: "u", conversationId: conversation.id,
  role: "user", content: "我现在有点混乱", clientMessageId: "m-1",
});
const retry = await repo.appendConversationMessage({ ...sameInput });
expect(retry.id).toBe(user.id);
await expect(repo.appendConversationMessage({ ...sameInput, content: "另一段话" })).rejects.toMatchObject({ code: "core_idempotency_conflict" });
const assistant = await repo.completeConversationMessage(user.id, { content: "先只选一个最小步骤。", modelTier: "stub", contextHash: "h1", redactions: [] });
expect((await repo.listConversationMessages("p", "u", conversation.id)).map((item) => item.status)).toEqual(["completed", "completed"]);
```

还要覆盖：跨用户不能读取/完成消息；失败消息可写入 `failed`；同一 conversation 的 `clientMessageId` 只产生一条 user message；导出包含 conversations/messages；`deleteProfile` 后二者都不可读。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-repository.test.ts`。

Expected: FAIL because repository methods are not defined.

- [ ] **Step 3: 扩展 repository interface**

在 `core-types.ts` 增加：

```ts
export type CreateConversationInput = { profileId: string; userId: string; title?: string };
export type AppendConversationMessageInput = {
  profileId: string; userId: string; conversationId: string; role: "user";
  content: string; clientMessageId?: string;
};
export type CompleteConversationMessageInput = {
  content: string; modelTier: string; contextHash: string; redactions: string[];
};
export type FailConversationMessageInput = { status: "failed" | "blocked"; failureCode: string; redactions: string[] };
```

`CoreRepository` 增加 `createConversation`、`getConversation`、`listConversations`、`appendConversationMessage`、`completeConversationMessage`、`failConversationMessage`、`listConversationMessages`、`archiveConversation`。

- [ ] **Step 4: 实现最小事务行为**

所有方法先通过 `profile(profileId, userId)` 验证 scope，再通过 conversation/profile/user 三重条件验证 ownership。`appendConversationMessage` 只接受 role=`user`，将 P1 chat permission 绑定到 purpose=`conversation`, scope=`chat_input`; 同 key 同 canonical content 返回既有记录，不同 content 抛 `core_idempotency_conflict`。助手完成或失败由 service 通过受限的 repository 方法写入对应 terminal assistant row，不允许客户端直接写 completed assistant message。

`createConversation` 自动生成标题为空时使用“新对话”，创建时 status=`active`。`listConversationMessages` 按 `created_at ASC, id ASC` 返回，并限制最近 100 条；上下文需要更早消息时由 `ContextBuilder` 只取最近 12 条摘要，不允许把全历史直接传给模型。用户消息在 append 时直接为 `completed`；助手消息由 service 在模型返回后一次性写入 `completed`、`failed` 或 `blocked`，不向客户端暴露 pending assistant row。

扩展 `exportProfile` 返回 `conversations` 和 `conversationMessages`；扩展 `coreExportSchema`。`deleteProfile` 仍然只删目标 profile，依赖 cascade 删除 chat 数据，不删除 legacy JSON。

- [ ] **Step 5: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-repository.test.ts tests/core-privacy-export-delete.test.ts`。

Expected: conversation lifecycle、idempotency、scope、export、cascade deletion 全部通过。

- [ ] **Step 6: Commit**

```powershell
git add packages/domain/src/single-brain.ts apps/api/src/core apps/api/tests/single-brain-repository.test.ts apps/api/tests/core-privacy-export-delete.test.ts
git commit -m "feat: persist single brain conversations"
```

### Task 4: 实现 bounded Context Builder 和 P3 redaction

**Files:**
- Create: `apps/api/src/core/context-redaction.ts`
- Create: `apps/api/src/core/context-builder.ts`
- Test: `apps/api/tests/context-builder.test.ts`

- [ ] **Step 1: 写失败测试**

构造一条含有 active Life Compass、State 和 20 条 events 的 fixture，断言：

1. local projection 包含 Life Compass，但最多保留 12 条近期事件。
2. cloud projection 的 `lifeCompass` 为 `null`，`redactions` 包含 `P3_life_compass_omitted`。
3. Event payload 中的 `prompt`、`agent`、`route`、`rawAudio`、`screenshot`、`modelResponse` 永不出现在 recentEvents。
4. 总字符数不超过 24,000；单条 event summary 不超过 500；超出部分通过 `omittedCount` 或 redaction 记录。
5. 同样输入生成相同 `contextHash`；改变用户消息后 hash 改变。
6. 没有 Compass/State/Events 时仍生成合法 packet，不伪造数据。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/context-builder.test.ts`。

Expected: FAIL because Context Builder does not exist.

- [ ] **Step 3: 实现 redaction allowlist**

`context-redaction.ts` 只允许 event 输出 `{id, occurredAt, type, summary}`。summary 取 payload 的优先顺序：`summary`、`text`、`title`，否则使用 `${eventType} event`；统一空白、截断 500 字符。键名匹配下列集合时直接丢弃：`prompt`, `systemPrompt`, `userPrompt`, `agent`, `route`, `runtimeAgentId`, `rawAudio`, `audioBase64`, `screenshot`, `image`, `modelResponse`, `debug`, `trace`。

`buildContextHash` 使用稳定 key 排序 JSON + SHA-256；禁止把 API key、bearer token 或原始 prompt 放入 hash 以外的返回字段。

- [ ] **Step 4: 实现 Context Builder**

`ContextBuilder` 构造函数接收 `CoreRepository` 和 clock，方法为：

```ts
build(input: {
  profileId: string; userId: string; conversationId: string;
  userMessage: string; dataBoundary: "local_only" | "cloud_allowed";
}): Promise<ContextPacket>
```

读取 active Life Compass、current State、最近 12 条 Core Events 和最近 12 条 conversation messages。State 只输出七个数值字段、source、confidence、userConfirmed；conversation history 只输出最近 6 个已完成 turn，且每条 content 截断 1200 字符。`cloud_allowed` 时完全省略 P3 Life Compass，且只有具有 `conversation/context_state` granted permission 的 State 才能进入；`local_only` 允许完整本地 Compass。构建结束后校验 `contextPacketSchema`，超过 24,000 字符时按顺序删减最旧 history、再删减 event summaries，不能删本轮 userMessage。

- [ ] **Step 5: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/context-builder.test.ts`。

Expected: 至少 8 个测试通过，P3 泄漏测试为 0。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/core/context-redaction.ts apps/api/src/core/context-builder.ts apps/api/tests/context-builder.test.ts packages/domain/src/single-brain.ts
git commit -m "feat: build bounded privacy-safe context packets"
```

### Task 5: 定义一个模型 adapter，并接入现有 ModelBridge

**Files:**
- Create: `apps/api/src/services/single-brain-model.ts`
- Modify: `apps/api/src/env.ts`
- Test: `apps/api/tests/single-brain-model.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖：stub adapter 在离线环境返回稳定回复；ModelBridge adapter 只接收 `ContextPacket`，不接收 `MindAnchorStore`/raw event；invalid JSON 被转换为 failed；缺少 baseUrl/model 时返回 failed；`dataBoundary=cloud_allowed` 的调用 payload 不含 P3 Compass；adapter result 始终满足 `{status, modelTier, response|failureCode, adapterDecision}`。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-model.test.ts`。

Expected: FAIL because adapter types/implementations do not exist.

- [ ] **Step 3: 定义 adapter contract**

```ts
export type SingleBrainModelInput = {
  packet: ContextPacket;
  systemPromptVersion: string;
  traceContext: GatewayTraceContext;
};
export type SingleBrainModelResult =
  | { status: "completed"; response: string; modelTier: string; adapterDecision: Record<string, unknown> }
  | { status: "failed"; failureCode: "model_unavailable" | "invalid_model_response" | "provider_error"; modelTier: string; adapterDecision: Record<string, unknown> }
  | { status: "blocked"; failureCode: "p3_local_only_unavailable"; modelTier: string; adapterDecision: Record<string, unknown> };
export interface SingleBrainModelAdapter {
  readonly locality: "local" | "remote" | "stub";
  generate(input: SingleBrainModelInput): Promise<SingleBrainModelResult>;
}
```

`StubSingleBrainModelAdapter` 返回固定、非命令式的中文回复，并将 `modelTier="stub"`。`ModelBridgeSingleBrainAdapter` 调用 `ModelBridge.generateJson`，target 固定为 `comma-single-brain`，schema 固定为 `{response: string}`，system prompt 版本固定写入 `systemPromptVersion`。不能暴露 route、agent、provider raw response 到用户 response；adapter decision 只用于 trace。

- [ ] **Step 4: 接入 privacy boundary**

当 packet.dataBoundary=`local_only` 且 adapter.locality=`remote` 时直接返回 `blocked`，不调用 `ModelBridge`。当 packet.dataBoundary=`cloud_allowed` 时只发送 Context Builder 已生成的 cloud-safe packet。模型调用必须通过现有 `ModelBridge.generateJson`，复用其 API key、wire API、OpenClaw cluster/provider fallback 和 disable response storage 配置。

- [ ] **Step 5: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-model.test.ts`。

Expected: 至少 7 个测试通过；stub 不发网络请求，P3 local-only blocked 不产生 provider call。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/services/single-brain-model.ts apps/api/src/env.ts apps/api/tests/single-brain-model.test.ts
git commit -m "feat: add single brain model adapter"
```

### Task 6: 实现 SingleBrainService 状态机和 trace

**Files:**
- Create: `apps/api/src/services/single-brain-service.ts`
- Test: `apps/api/tests/single-brain-service.test.ts`

- [ ] **Step 1: 写失败测试**

测试 `sendMessage` 的完整状态机：

1. 没有 conversation 时返回 `core_not_found`。
2. 用户消息先写入 repository，再调用 Context Builder 和 model adapter。
3. completed 生成写入 assistant message，返回 user+assistant。
4. failed/blocked 只写入带 failureCode 的 assistant terminal message，不伪造 response。
5. model adapter 抛异常时转换为 `provider_error` 并写 trace。
6. trace 只包含 `decisionId/traceId`, `contextHash`, `dataBoundary`, `modelTier`, `status`, `redactions` 和时间，不包含 user prompt 或 assistant 原文。
7. 同一个 clientMessageId 重试只返回同一对消息。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-service.test.ts`。

Expected: FAIL because `SingleBrainService` does not exist.

- [ ] **Step 3: 实现编排方法**

```ts
sendMessage(input: {
  profileId: string; userId: string; conversationId: string;
  content: string; clientMessageId?: string; dataBoundary: "local_only" | "cloud_allowed";
}): Promise<{ userMessage: ConversationMessage; assistantMessage: ConversationMessage; packetMeta: Pick<ContextPacket, "contextHash" | "redactions" | "dataBoundary"> }>
```

流程固定为：验证 conversation -> `appendConversationMessage(role=user)` -> `ContextBuilder.build` -> `adapter.generate` -> repository 写 assistant terminal message -> `addSystemTrace`。trace payload 用 `contextHash`、消息 ID、adapter decision 的安全字段和 `failureCode`，不存文本。所有异常必须在 assistant 侧落一个 `failed`/`blocked` 记录后再返回 HTTP 可映射错误；如果 user append 已成功而 context 构建失败，用户消息不得删除。

- [ ] **Step 4: 实现 system prompt**

版本 `single-brain-v0.1-b-1` 的 system prompt 固定要求：单一温和声音；先理解当前问题；提出可选的下一步但不命令；不诊断；不声称知道未提供的事实；Life Compass 只能作为方向参考，不能擅自修改；遇到高风险/医疗/自伤内容只给安全转介和人工确认建议；只返回 `{response}` JSON。该 prompt 版本进入 trace，不进入用户导出内容。

- [ ] **Step 5: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-service.test.ts`。

Expected: 至少 8 个测试通过，stub、失败、blocked、重复和 trace 隔离全覆盖。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/services/single-brain-service.ts apps/api/tests/single-brain-service.test.ts
git commit -m "feat: orchestrate single brain conversations"
```

### Task 7: 暴露 `/v1/core/conversations` API

**Files:**
- Create: `apps/api/src/routes/single-brain.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/single-brain-routes.integration.test.ts`

- [ ] **Step 1: 写 HTTP contract tests**

覆盖：无 bearer 返回 401；创建 conversation 返回 201；发送消息返回 user/assistant；相同 `Idempotency-Key` 返回同一 message IDs；跨用户 conversation 返回 404；stub 失败/blocked 有明确 status；`GET` 只返回用户自己的 sessions/messages；archive 后不能继续发送；删除 profile 后 conversation API 返回 404 或空列表；request body 的 userId/profileId 被忽略。

- [ ] **Step 2: 运行失败测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-routes.integration.test.ts`。

Expected: FAIL because routes are not registered.

- [ ] **Step 3: 实现 routes**

```text
POST   /v1/core/conversations
GET    /v1/core/conversations
GET    /v1/core/conversations/:conversationId
POST   /v1/core/conversations/:conversationId/messages
POST   /v1/core/conversations/:conversationId/archive
DELETE /v1/core/conversations/:conversationId
```

每个 handler 使用现有 `authContext.userId`，profile 固定为 `profile:${userId}`；body userId/profileId 永不覆盖身份。消息 endpoint 从 `Idempotency-Key` 或 body.clientMessageId 取幂等 key，调用 `SingleBrainService.sendMessage`。错误映射：`core_not_found`=404，`core_idempotency_conflict`/`core_revision_conflict`=409，`core_permission_required`/`core_p3_egress_blocked`=403，模型 `blocked`=409，模型 `failed`=503；响应中不包含内部 prompt、agent、route、API endpoint 或 token。

在 `app.ts` 中复用已有 `core` repository；构造 `ContextBuilder`、选择 adapter（`agentMode=stub` 使用 stub，否则使用 ModelBridge adapter），构造 `SingleBrainService`，注册 routes。现有 `registerWayfinderRoutes`、Coach routes、legacy Store 初始化和关闭顺序保持不变。

- [ ] **Step 4: 运行通过测试**

Run: `\.\node_modules\.bin\vitest.CMD run tests/single-brain-routes.integration.test.ts`。

Expected: 至少 12 个 HTTP contract tests 通过。

- [ ] **Step 5: 运行 API 回归**

Run: `corepack pnpm --filter @mindanchor/api test`。

Expected: Core、Wayfinder、Coach 和旧 API 测试全部通过；没有新增未处理的 Fastify error 日志。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/routes/single-brain.ts apps/api/src/app.ts apps/api/tests/single-brain-routes.integration.test.ts
git commit -m "feat: expose single brain conversation api"
```

### Task 8: 扩展 Web API client 和 Single Brain 页面

**Files:**
- Modify: `apps/web/src/api.ts`
- Create: `apps/web/src/pages/SingleBrainPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/pages/__tests__/single-brain-smoke.test.tsx`

- [ ] **Step 1: 写失败组件测试**

使用 API fixture mock，断言页面能够：显示 session 列表；创建新对话；发送一条用户消息并显示 assistant 回复；发送期间禁用按钮；failed/blocked 显示原因和重试提示；redactions 显示“本轮未发送 Life Compass”等用户可理解信息；页面不渲染 `traceId`、agent、route、model endpoint 或 raw prompt。

- [ ] **Step 2: 运行失败测试**

Run: `corepack pnpm --filter @mindanchor/web test -- src/pages/__tests__/single-brain-smoke.test.tsx`。

Expected: FAIL because client methods and page do not exist.

- [ ] **Step 3: 添加 typed API methods**

在 `apps/web/src/api.ts` 增加：

```ts
listCoreConversations(): Promise<{ conversations: CoreConversation[] }>;
createCoreConversation(payload?: { title?: string }): Promise<CoreConversation>;
getCoreConversation(id: string): Promise<{ conversation: CoreConversation; messages: ConversationMessage[] }>;
sendCoreMessage(id: string, payload: { content: string; dataBoundary?: "local_only" | "cloud_allowed" }, clientMessageId: string): Promise<SingleBrainResponse>;
archiveCoreConversation(id: string): Promise<CoreConversation>;
```

所有请求复用现有 bearer header 和 `request` 错误解析；发送消息必须设置 `Idempotency-Key`。

- [ ] **Step 4: 实现页面**

页面结构固定为：session 列表 -> 当前对话标题/数据边界提示 -> message list -> composer -> 发送状态。默认 `cloud_allowed` 只显示云端安全投影说明；`local_only` 只有在 API 返回可用时允许选择。用户可以新建、归档和删除 session。助手状态为 `failed`/`blocked` 时只显示可理解原因和“重试”入口，不显示内部错误原文。

- [ ] **Step 5: 运行 Web 测试和构建**

Run: `corepack pnpm --filter @mindanchor/web test; corepack pnpm --filter @mindanchor/web build`。

Expected: Single Brain smoke plus existing Dashboard/Coach/Wayfinder/Decision Ledger tests全部通过，Web build exit 0。

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src/api.ts apps/web/src/pages/SingleBrainPage.tsx apps/web/src/pages/__tests__/single-brain-smoke.test.tsx apps/web/src/App.tsx apps/web/src/styles.css
git commit -m "feat: add single brain web chat"
```

### Task 9: 隐私、导出、故障和手工验收

**Files:**
- Modify: `apps/api/tests/core-privacy-export-delete.test.ts`
- Create: `apps/api/tests/single-brain-e2e.fixture.test.ts`
- Create: `docs/architecture/comma-v0.1-single-brain-runbook.md`
- Create: `test-results/comma-v0.1-b-acceptance.md`

- [ ] **Step 1: 添加固定端到端 fixture**

使用 stub adapter 和临时 SQLite，执行：创建 Compass candidate/confirm -> 写 State report -> 写 15 条 Event -> 创建 conversation -> 发送 3 轮消息 -> export -> delete。断言每个 Context Packet 的字符预算、P3 redaction、sourceEventIds、trace count 和 message order。

- [ ] **Step 2: 添加模型故障 fixture**

使用一个总是返回 malformed JSON 的 fake adapter 和一个抛 timeout 的 fake adapter，断言 API/Service 分别返回 `invalid_model_response` 与 `provider_error`，assistant message 进入 terminal failed 状态，user message 保留，重试使用新的 clientMessageId 才能创建新 assistant attempt。

- [ ] **Step 3: 完成 runbook**

记录：

```text
启动：MINDANCHOR_AGENT_MODE=stub 即可离线使用
云模型：只允许 cloud_allowed packet，P3 Life Compass 自动省略
本地模型：dataBoundary=local_only 且 adapter.locality=local
故障：模型不可用时保留 user message，不伪造 assistant 成功
导出：/v1/core/export 包含 conversation/message，不包含 raw prompt/route/agent
删除：DELETE /v1/core/data 或 conversation delete 不影响 legacy JSON Store
```

Runbook 还要说明如何查看 trace count、如何撤回 conversation/context permission、如何用临时 SQLite 重放 fixture，以及如何确认 API key 不出现在日志和导出中。

- [ ] **Step 4: 运行完整验收**

Run:

```powershell
corepack pnpm --filter @mindanchor/domain build
corepack pnpm --filter @mindanchor/api build
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/web test
corepack pnpm --filter @mindanchor/web build
```

Expected: 所有命令 exit 0；Core/Single Brain/API/Web 测试无失败；既有 Wayfinder/Coach 回归不下降。

- [ ] **Step 5: 编写 acceptance report**

`test-results/comma-v0.1-b-acceptance.md` 必须记录：日期、目标、边界、每个命令的 exit code/通过数/失败数、Context fixture 统计、P3 外泄率、stub 离线证据、模型故障证据、导出/删除证据、未进入本阶段的 V0.1-C 事项和回滚路径。禁止使用“应该通过”“已验证但无命令”这类无证据表述。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/tests apps/web/src docs/architecture/comma-v0.1-single-brain-runbook.md test-results/comma-v0.1-b-acceptance.md
git commit -m "docs: record comma single brain acceptance"
```

---

## 数据与隐私审查清单

- [ ] 用户输入和助手回复是 P1；默认进入本地 Core，可导出和删除。
- [ ] Active Life Compass 是 P3；云端 Context Packet 永远为 `null`，并记录 redaction。
- [ ] State 只有在 `conversation/context_state` permission granted 时进入模型；撤销后聊天仍可继续但少一个上下文源。
- [ ] Context Packet 只有 allowlist 字段；没有 raw audio、screenshots、third-party chat、prompt、route、agent、token。
- [ ] Model adapter 的 trace 只存 hash、status、model tier、data boundary、redactions 和安全 adapter decision。
- [ ] 模型不可直接写 Core；assistant reply 只能通过 service 写入 message。
- [ ] 旧 Coach/Wayfinder 的 JSON Store、测试和 API 保持兼容。

## 计划自检

- 本计划只覆盖 V0.1-B，没有提前实现 Choice Engine、Intervention、Memory、Voice 或 Decision Window。
- 所有新增生产行为都有先失败测试、再最小实现、再回归测试的 TDD 步骤。
- 所有文件路径与当前仓库实际结构一致，domain 使用 `packages/domain`，API 使用 `apps/api`，Web 使用 `apps/web`。
- 没有 `TODO`、`TBD` 或未定义的“适当处理”步骤；失败状态、权限边界、删除、导出和回滚都有明确结果。
- `CoreRepository` 仍是 Personal Core 的唯一写入口；ModelBridge 只是 capability adapter，不成为数据库或产品核心。
