# Comma Personal Core Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不破坏现有 JSON Store/Wayfinder 的前提下，为 `apps/api` 建立单用户、Local-First、可导出可删除的 SQLite Personal Core Skeleton。

**Architecture:** 新增 `CoreRepository` 接口和 `SqliteCoreRepository` 实现。Personal Core 使用独立 SQLite 文件、迁移表和事务；现有 `MindAnchorStore` 继续服务旧 Goal/Task/Coach/Wayfinder 能力。API 通过 `/v1/core` 暴露 Event、State、Life Compass、privacy、export、retention、delete，所有写入从 bearer identity 得到 profile scope。

**Tech Stack:** Node 22, TypeScript, Fastify 5, Zod 3, Vitest, `better-sqlite3` 11.x, SQLite WAL/foreign keys/FTS5。

---

## 范围和不变量

本计划只覆盖 V0.1-A。完成后不能声称已实现 Chat、Choice Engine、Intervention Loop、Memory Retrieval、Agent/Skill、Voice、Decision Window 或外设。

固定不变量：

1. 一个本机实例只有一个 `core_profile`，profile 的 `userId` 来自现有 bearer auth；body 中的 `userId` 被忽略或覆盖。
2. SQLite 内所有时间以 UTC ISO-8601 文本保存；profile timezone 只用于展示/调度。
3. Event 和 State Snapshot 只追加；更新理解只能新写记录。
4. `clientEventId` 在 profile 内唯一；相同 payload 重试返回原记录，冲突返回 `core_idempotency_conflict`。
5. Life Compass 只有 candidate confirm 事务能成为 active version；AI 或 API 不能直接覆盖 active。
6. P3 数据默认 `local_only`；Core repository 不提供把 P3 原文发送给模型的 API。
7. `core_system_traces` 永不进入任何 Memory 查询；本阶段没有 Memory 表，也不把 trace 写入 legacy memory。
8. 删除按 profile 在一个 transaction 中级联删除 Core 数据；旧 JSON legacy 数据只有显式迁移并确认后才删除。

## 文件地图

将创建或修改以下文件。路径以仓库根目录 `C:\Users\czys1\Documents\Comma` 为准。

- Create: `apps/packages/domain/src/core.ts`：Core Zod schema、输入类型、privacy/state/life-compass 枚举。
- Modify: `apps/packages/domain/src/index.ts`：导出 Core schema/type。
- Modify: `apps/api/package.json`、`pnpm-lock.yaml`：SQLite driver。
- Create: `apps/api/src/core/core-errors.ts`：稳定错误码。
- Create: `apps/api/src/core/core-types.ts`：repository interface 与 query/input types。
- Create: `apps/api/src/core/sqlite-schema.ts`：versioned SQL migration list。
- Create: `apps/api/src/core/sqlite-core-repository.ts`：SQLite implementation。
- Create: `apps/api/src/core/core-export.ts`：导出和删除 DTO 编排。
- Create: `apps/api/src/routes/core.ts`：`/v1/core` handlers。
- Modify: `apps/api/src/env.ts`：`MINDANCHOR_PERSONAL_CORE_SQLITE_FILE`。
- Modify: `apps/api/src/app.ts`：初始化 Core repository、注册 routes、关闭连接。
- Create: `apps/api/tests/core-domain.test.ts`。
- Create: `apps/api/tests/core-sqlite-schema.test.ts`。
- Create: `apps/api/tests/core-events.test.ts`。
- Create: `apps/api/tests/core-state.test.ts`。
- Create: `apps/api/tests/core-life-compass.test.ts`。
- Create: `apps/api/tests/core-privacy-export-delete.test.ts`。
- Create: `apps/api/tests/core-routes.integration.test.ts`。
- Create: `scripts/migrate-json-to-core.mjs`：只读 dry-run，显式 `--apply` 才写入。
- Create: `scripts/__tests__/migrate-json-to-core.test.mjs`。
- Create: `docs/architecture/comma-v0.1-core-migration-runbook.md`。

---

### Task 1: 定义 Core domain contracts

**Files:**
- Create: `apps/packages/domain/src/core.ts`
- Modify: `apps/packages/domain/src/index.ts`
- Test: `apps/api/tests/core-domain.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import {
  coreEventSchema,
  lifeCompassCandidateSchema,
  stateSnapshotSchema,
} from "@mindanchor/domain";

describe("Comma Core contracts", () => {
  it("requires source and confidence on every event", () => {
    expect(() => coreEventSchema.parse({
      id: "evt-1", profileId: "profile-1", userId: "u-1",
      eventType: "state_report", occurredAt: "2026-08-24T10:00:00.000Z",
      payload: {}, privacyLevel: "P1", source: "user", confidence: 1,
      createdAt: "2026-08-24T10:00:01.000Z",
    })).not.toThrow();
    expect(() => coreEventSchema.parse({
      id: "evt-2", profileId: "profile-1", userId: "u-1",
      eventType: "state_report", occurredAt: "2026-08-24T10:00:00.000Z",
      payload: {}, privacyLevel: "P1", source: "user", createdAt: "2026-08-24T10:00:01.000Z",
    })).toThrow();
  });

  it("does not allow a candidate to claim confirmation", () => {
    expect(() => lifeCompassCandidateSchema.parse({
      id: "lc-c-1", profileId: "profile-1", userId: "u-1",
      content: "保留创造性工作和稳定生活的平衡", status: "confirmed",
      createdAt: "2026-08-24T10:00:00.000Z",
    })).toThrow();
  });

  it("keeps state values within 0..100", () => {
    expect(() => stateSnapshotSchema.parse({
      id: "st-1", profileId: "profile-1", userId: "u-1",
      energy: 101, emotion: 50, cognitiveLoad: 50, mentalNoise: 50,
      focusReadiness: 50, physicalFatigue: 50, recoveryNeed: 50,
      source: ["user"], confidence: 0.8, userConfirmed: true,
      revision: 1, capturedAt: "2026-08-24T10:00:00.000Z",
    })).toThrow();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-domain.test.ts`

Expected: FAIL because `@mindanchor/domain` does not export the three Core schemas.

- [ ] **Step 3: 实现 schema**

在 `core.ts` 定义并导出：

```ts
export const corePrivacyLevelSchema = z.enum(["P0", "P1", "P2", "P3"]);
export const coreEventSourceSchema = z.enum(["user", "desktop", "web", "mobile", "watch", "glasses", "system"]);
export const coreEventTypeSchema = z.enum(["state_report", "activity", "task_candidate", "check_in", "interaction", "device_signal"]);
export const coreMemoryBoundarySchema = z.enum(["local_only", "cloud_allowed"]);
export const coreEventSchema = z.object({
  id: identifierSchema, profileId: identifierSchema, userId: userIdSchema,
  clientEventId: z.string().min(1).optional(), eventType: coreEventTypeSchema,
  occurredAt: isoDateTimeSchema, createdAt: isoDateTimeSchema,
  source: coreEventSourceSchema, payload: z.record(z.unknown()),
  privacyLevel: corePrivacyLevelSchema, retentionClass: z.string().min(1).default("P1_standard"),
  expiresAt: isoDateTimeSchema.nullable().default(null), confidence: z.number().min(0).max(1),
});
export const stateSnapshotSchema = z.object({
  id: identifierSchema, profileId: identifierSchema, userId: userIdSchema,
  energy: z.number().min(0).max(100), emotion: z.number().min(0).max(100),
  cognitiveLoad: z.number().min(0).max(100), mentalNoise: z.number().min(0).max(100),
  focusReadiness: z.number().min(0).max(100), physicalFatigue: z.number().min(0).max(100),
  recoveryNeed: z.number().min(0).max(100), source: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1), userConfirmed: z.boolean(), revision: z.number().int().positive(),
  capturedAt: isoDateTimeSchema,
});
export const lifeCompassCandidateSchema = z.object({
  id: identifierSchema, profileId: identifierSchema, userId: userIdSchema,
  content: z.string().min(1).max(5000), evidenceEventIds: z.array(identifierSchema).default([]),
  status: z.enum(["pending", "confirmed", "rejected"]), createdAt: isoDateTimeSchema,
});
export const lifeCompassVersionSchema = lifeCompassCandidateSchema.extend({
  version: z.number().int().positive(), confirmedAt: isoDateTimeSchema,
  supersedesId: identifierSchema.nullable(),
}).omit({ status: true, evidenceEventIds: true });
export const corePermissionSchema = z.object({
  profileId: identifierSchema, purpose: z.string().min(1), scope: z.string().min(1),
  status: z.enum(["granted", "paused", "revoked"]), dataLevel: corePrivacyLevelSchema,
  updatedAt: isoDateTimeSchema,
});
export const coreExportSchema = z.object({ exportedAt: isoDateTimeSchema, profile: z.record(z.unknown()),
  events: z.array(coreEventSchema), stateSnapshots: z.array(stateSnapshotSchema),
  lifeCompassCandidates: z.array(lifeCompassCandidateSchema), lifeCompassVersions: z.array(lifeCompassVersionSchema),
  permissions: z.array(corePermissionSchema), systemTraceCount: z.number().int().nonnegative(), });
export type CoreEvent = z.infer<typeof coreEventSchema>;
export type StateSnapshot = z.infer<typeof stateSnapshotSchema>;
export type LifeCompassCandidate = z.infer<typeof lifeCompassCandidateSchema>;
export type LifeCompassVersion = z.infer<typeof lifeCompassVersionSchema>;
export type CorePermission = z.infer<typeof corePermissionSchema>;
```

Export the schemas and inferred types from `index.ts` without changing existing names.

- [ ] **Step 4: 运行测试确认通过**

Run: `corepack pnpm --filter @mindanchor/api test -- core-domain.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```powershell
git add apps/packages/domain/src/core.ts apps/packages/domain/src/index.ts apps/api/tests/core-domain.test.ts
git commit -m "feat: define comma personal core contracts"
```

### Task 2: 安装 SQLite driver 并建立可重放 migration

**Files:**
- Modify: `apps/api/package.json`, `pnpm-lock.yaml`
- Create: `apps/api/src/core/sqlite-schema.ts`
- Test: `apps/api/tests/core-sqlite-schema.test.ts`

- [ ] **Step 1: 安装依赖**

Run: `corepack pnpm add better-sqlite3@^11.10.0 --filter @mindanchor/api; corepack pnpm add -D @types/better-sqlite3@^7.6.12 --filter @mindanchor/api`

Expected: `apps/api/package.json` includes both packages and `pnpm-lock.yaml` changes only for the resolved SQLite dependency tree.

- [ ] **Step 2: 写 migration 失败测试**

测试使用 `:memory:` 数据库，调用 `applyCoreMigrations(db)` 两次，断言 `core_schema_migrations` 只有 1、2 两行；断言 `PRAGMA foreign_keys` 为 `1`、`PRAGMA journal_mode` 在 file DB 上为 `wal`、`core_events_fts` 能插入并检索 `payload_text`。

- [ ] **Step 3: 实现 migration**

`sqlite-schema.ts` 导出 `CORE_MIGRATIONS` 和 `applyCoreMigrations(db)`. Migration 1 创建 `core_profiles`、`core_events`、`core_state_snapshots`、`core_life_compass_candidates`、`core_life_compass_versions`、`core_permissions`、`core_system_traces`、`core_schema_migrations`，所有业务表有 `profile_id` 外键和 `ON DELETE CASCADE`；事件唯一索引为 `(profile_id, client_event_id)` 且通过 `WHERE client_event_id IS NOT NULL` 建立。Migration 2 创建 `core_events_fts` FTS5 virtual table 和 insert/update/delete triggers，索引 `event_type` 与 `payload_json` 的文本投影。

`applyCoreMigrations` 必须在 transaction 中按 version 顺序执行，并校验重复 version 的 checksum；checksum 不一致抛出 `core_migration_checksum_mismatch`。

- [ ] **Step 4: 运行 schema 测试**

Run: `corepack pnpm --filter @mindanchor/api test -- core-sqlite-schema.test.ts`

Expected: PASS，包含 migration 幂等、foreign key、WAL、FTS5 四类断言。

- [ ] **Step 5: Commit**

```powershell
git add apps/api/package.json pnpm-lock.yaml apps/api/src/core/sqlite-schema.ts apps/api/tests/core-sqlite-schema.test.ts
git commit -m "feat: add sqlite personal core migrations"
```

### Task 3: 实现 Core profile 和 Event repository

**Files:**
- Create: `apps/api/src/core/core-errors.ts`
- Create: `apps/api/src/core/core-types.ts`
- Create: `apps/api/src/core/sqlite-core-repository.ts`
- Test: `apps/api/tests/core-events.test.ts`

- [ ] **Step 1: 写失败测试**

测试覆盖：

```ts
it("creates one profile and appends an idempotent event", async () => {
  const first = await repo.appendEvent({ profileId, userId: "u-1", clientEventId: "mobile-1", eventType: "activity", occurredAt, source: "desktop", payload: { app: "editor" }, privacyLevel: "P1", confidence: 1 });
  const retry = await repo.appendEvent({ profileId, userId: "u-1", clientEventId: "mobile-1", eventType: "activity", occurredAt, source: "desktop", payload: { app: "editor" }, privacyLevel: "P1", confidence: 1 });
  expect(retry.id).toBe(first.id);
});

it("rejects the same idempotency key with a different payload", async () => {
  await repo.appendEvent(validInput({ clientEventId: "same" }));
  await expect(repo.appendEvent(validInput({ clientEventId: "same", payload: { app: "other" } }))).rejects.toThrow("core_idempotency_conflict");
});

it("keeps users isolated and removes expired P0 events only", async () => {
  await repo.appendEvent(validInput({ userId: "u-1", profileId: "p-1", privacyLevel: "P0", expiresAt: past }));
  await repo.appendEvent(validInput({ userId: "u-2", profileId: "p-2", privacyLevel: "P1" }));
  expect(await repo.listEvents("p-2", "u-1")).toHaveLength(0);
  expect(await repo.runRetention(now)).toEqual({ deletedEvents: 1 });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-events.test.ts`

Expected: FAIL because `SqliteCoreRepository` does not exist.

- [ ] **Step 3: 定义 interface 和错误**

`core-errors.ts` 导出 `CoreError`，错误码为 `core_profile_scope_mismatch`、`core_idempotency_conflict`、`core_revision_conflict`、`core_not_found`、`core_permission_required`、`core_p3_egress_blocked`、`core_migration_checksum_mismatch`。

`core-types.ts` 导出：

```ts
export type CoreRepository = {
  init(): Promise<void>;
  close(): void;
  ensureProfile(input: { profileId: string; userId: string; timezone: string }): Promise<CoreProfile>;
  appendEvent(input: CreateCoreEventInput): Promise<CoreEvent>;
  listEvents(profileId: string, userId: string, query?: { from?: string; to?: string; limit?: number }): Promise<CoreEvent[]>;
  getCurrentState(profileId: string, userId: string): Promise<StateSnapshot | null>;
  appendStateSnapshot(input: CreateStateSnapshotInput, expectedRevision?: number): Promise<StateSnapshot>;
  getLifeCompass(profileId: string, userId: string): Promise<{ active: LifeCompassVersion | null; candidates: LifeCompassCandidate[] }>;
  createLifeCompassCandidate(input: CreateLifeCompassCandidateInput): Promise<LifeCompassCandidate>;
  confirmLifeCompassCandidate(profileId: string, userId: string, candidateId: string, expectedVersion: number | null): Promise<LifeCompassVersion>;
  listPermissions(profileId: string, userId: string): Promise<CorePermission[]>;
  upsertPermission(input: CorePermission): Promise<CorePermission>;
  addSystemTrace(input: CreateSystemTraceInput): Promise<void>;
  exportProfile(profileId: string, userId: string): Promise<CoreExport>;
  runRetention(at: string): Promise<{ deletedEvents: number }>;
  deleteProfile(profileId: string, userId: string): Promise<{ deletedRows: number }>;
};
```

输入类型禁止客户端传入 `id`, `createdAt`, `revision`, `version`；这些由 repository 生成。

- [ ] **Step 4: 实现 Event 方法**

`SqliteCoreRepository` 构造函数接收 `Database.Database` 和 `now`/`id` 可选依赖，`init()` 设置 `foreign_keys=ON`、`journal_mode=WAL`、`busy_timeout=5000` 并调用 migrations。`ensureProfile` 使用 `INSERT ... ON CONFLICT(profile_id) DO UPDATE`，但 userId 不同抛 `core_profile_scope_mismatch`。

`appendEvent` 在 transaction 内检查 profile scope；有 client key 时先读取同 key 的 canonical JSON hash；相同返回既有实体，不同抛冲突。无 key 每次生成 UUID。写入时根据 `expiresAt` 保留 P0 的删除时间；返回通过 `coreEventSchema.parse` 的对象。`listEvents` 只能按 profile + user 过滤，按 `occurred_at DESC` 排序并 clamp limit 到 1..200。

- [ ] **Step 5: 运行事件测试**

Run: `corepack pnpm --filter @mindanchor/api test -- core-events.test.ts`

Expected: PASS，至少 5 个测试，覆盖幂等、冲突、隔离、排序和 retention。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/core apps/api/tests/core-events.test.ts
git commit -m "feat: persist personal core events in sqlite"
```

### Task 4: 实现 append-only Personal State projection

**Files:**
- Modify: `apps/api/src/core/core-types.ts`, `apps/api/src/core/sqlite-core-repository.ts`
- Test: `apps/api/tests/core-state.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖：没有 snapshot 时 current 为 null；第一次写 revision 1；第二次必须带 expected revision 1 才能写 revision 2；expected revision 错误返回 `core_revision_conflict`；普通 activity event 不改变 current state；只有显式 state report service 写入 `userConfirmed=true`。

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-state.test.ts`

Expected: FAIL because state methods are not implemented.

- [ ] **Step 3: 实现方法**

`appendStateSnapshot` 在 transaction 内锁定 profile 当前最大 revision，要求 `expectedRevision === null`（首写）或等于最大值；不匹配抛 `core_revision_conflict`。写入所有七个字段 `energy`、`emotion`、`cognitiveLoad`、`mentalNoise`、`focusReadiness`、`physicalFatigue`、`recoveryNeed`，并存 `source_json`、`confidence`、`user_confirmed`。`getCurrentState` 返回最大 revision 且校验 user scope。

新增 `deriveStateFromEvent` 只允许识别 eventType `state_report`，将 payload 通过 `stateReportPayloadSchema` 校验后写 snapshot；activity/task_candidate/device_signal 返回 null，确保事件观察不会无意改变状态。

- [ ] **Step 4: 运行测试确认通过**

Run: `corepack pnpm --filter @mindanchor/api test -- core-state.test.ts`

Expected: PASS，至少 6 个测试。

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/core apps/api/tests/core-state.test.ts
git commit -m "feat: add append-only personal state snapshots"
```

### Task 5: 实现 Life Compass candidate/confirm/version

**Files:**
- Modify: `apps/api/src/core/core-types.ts`, `apps/api/src/core/sqlite-core-repository.ts`
- Test: `apps/api/tests/core-life-compass.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖：candidate 创建后 active 为 null；candidate 的 status 不能直接传 `confirmed`；确认后生成 version 1；第二次确认生成 version 2 并保留 version 1；expectedVersion 错误返回 `core_revision_conflict`；跨用户 candidate 返回 `core_not_found`；reject 不生成 active version。

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-life-compass.test.ts`

Expected: FAIL because candidate/version methods are not implemented.

- [ ] **Step 3: 实现 candidate 和 confirm transaction**

`createLifeCompassCandidate` 强制 status=`pending`，保存 evidence event ids、content 和 createdAt。`confirmLifeCompassCandidate` 在一个 transaction 中：

1. 验证 candidate 属于 profile/user 且 status 为 pending。
2. 查询 active version；`expectedVersion` 必须等于当前版本号或 null（无版本）。
3. 将 candidate 标为 confirmed。
4. 插入 `version = current + 1`、`supersedes_id=current.id` 的新 version。
5. 写入 `core_system_traces`，记录 candidate id、旧/新版本和 user confirmation。

任何一步失败都 rollback。`getLifeCompass` 只把 confirmed candidate 作为 candidate history 返回，active 只取最高 version。

- [ ] **Step 4: 运行测试确认通过**

Run: `corepack pnpm --filter @mindanchor/api test -- core-life-compass.test.ts`

Expected: PASS，至少 7 个测试。

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/core apps/api/tests/core-life-compass.test.ts
git commit -m "feat: require user confirmation for life compass versions"
```

### Task 6: 权限、P0 retention、trace 隔离、导出与删除

**Files:**
- Create: `apps/api/src/core/core-export.ts`
- Modify: `apps/api/src/core/sqlite-core-repository.ts`
- Test: `apps/api/tests/core-privacy-export-delete.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖：没有对应 `purpose/scope` granted permission 的 P0/P1 写入返回 `core_permission_required`；P3 permission 只能为 local_only；调用 `buildCloudProjection` 传入 P3 返回 `core_p3_egress_blocked`；export 包含 events/state/compass/permissions 但只返回 `systemTraceCount` 不返回 prompt/model raw；delete 后所有 Core 表为空且 profile 不可再读取；retention 只删除 `expires_at <= at` 的 P0。

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-privacy-export-delete.test.ts`

Expected: FAIL because privacy/export/delete methods are not implemented.

- [ ] **Step 3: 实现权限与 egress guard**

`upsertPermission` 使用 `(profile_id, purpose, scope)` 唯一键；`revoked` 覆盖 granted。`assertWritePermission(profileId, dataLevel, purpose, scope)` 对 P0/P1/P2/P3 都要求 granted；P3 还要求 repository 的 storage policy 为 local_only。`buildCloudProjection` 只能返回 P0/P1 的字段白名单：event type、时间、非敏感摘要和 confidence；遇到 P3 或 `privacyLevel=P3` 直接抛 `core_p3_egress_blocked`。

- [ ] **Step 4: 实现 export/delete**

`exportProfile` 以 read transaction 组装 `coreExportSchema`：profile、events、state snapshots、candidates、versions、permissions、trace count。所有 payload 仍为用户可见数据；系统 trace 的内部 prompt、route、agent、model response 不出现在返回体。`deleteProfile` 以 transaction 按 profile 删除 `core_system_traces`、permissions、compass versions/candidates、state snapshots、events、profile，并返回已删除行数；删除是幂等的。

- [ ] **Step 5: 运行测试确认通过**

Run: `corepack pnpm --filter @mindanchor/api test -- core-privacy-export-delete.test.ts`

Expected: PASS，至少 8 个测试，且 trace 查询无法通过 export 的 events/state/memory 结果出现。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/core apps/api/tests/core-privacy-export-delete.test.ts
git commit -m "feat: enforce core privacy export and deletion"
```

### Task 7: 接入环境配置和 Fastify 生命周期

**Files:**
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/core-routes.integration.test.ts`

- [ ] **Step 1: 写启动失败测试**

使用 temporary directory 设置 `MINDANCHOR_PERSONAL_CORE_SQLITE_FILE`，创建 app 并调用 `app.ready()`；断言 SQLite 文件创建、`GET /v1/core/state/current` 能返回 200；调用 `app.close()` 后文件句柄释放，Windows 可删除临时目录。

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-routes.integration.test.ts -t "initializes personal core"`

Expected: FAIL because env 和 app 没有 Core repository。

- [ ] **Step 3: 实现 env 和 app wiring**

在 `env.ts` 增加：

```ts
personalCoreSqliteFile: process.env.MINDANCHOR_PERSONAL_CORE_SQLITE_FILE ?? `${process.cwd()}/data/comma-personal-core.sqlite`,
```

`app.ts` 创建 `SqliteCoreRepository.fromFile(env.personalCoreSqliteFile)`，在 app factory 初始化后 `await core.init()`，将 `core` 传给 `registerCoreRoutes`；在 `app.addHook("onClose", ...)` 调用 `core.close()`。当 SQLite 初始化失败时 app 启动失败并返回原始错误，不伪造 Core 可用。

- [ ] **Step 4: 运行启动测试**

Run: `corepack pnpm --filter @mindanchor/api test -- core-routes.integration.test.ts -t "initializes personal core"`

Expected: PASS，临时 SQLite 能创建、读取、关闭。

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/env.ts apps/api/src/app.ts apps/api/tests/core-routes.integration.test.ts
git commit -m "feat: wire sqlite personal core into api lifecycle"
```

### Task 8: 实现 `/v1/core` typed API

**Files:**
- Create: `apps/api/src/routes/core.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/core-routes.integration.test.ts`

- [ ] **Step 1: 写 HTTP contract tests**

使用现有测试 auth helper 覆盖：无 bearer 返回 401；`POST /v1/core/events` 生成 201；相同 `Idempotency-Key` 返回同一个 id；不同 body 返回 409；`GET /v1/core/events` 不能跨用户读取；`POST /v1/core/life-compass/candidates` 后 active 仍为 null；confirm 后 active version 为 1；`GET /v1/core/export` 能读取；`DELETE /v1/core/data` 后再次读取返回 null/空列表；P3 未授权写入返回 403。

- [ ] **Step 2: 运行测试确认失败**

Run: `corepack pnpm --filter @mindanchor/api test -- core-routes.integration.test.ts`

Expected: FAIL because `/v1/core` routes are not registered.

- [ ] **Step 3: 实现 route handlers**

`core.ts` 导出 `registerCoreRoutes(app, { core })`。每个 handler 先调用现有 `requireUser(request, reply)`；认证失败立即返回。所有 input 用 domain schema parse，服务端把 `userId`/`profileId` 绑定到 bearer profile。实现：

```text
POST /v1/core/events
GET  /v1/core/events
GET  /v1/core/state/current
POST /v1/core/state/reports
GET  /v1/core/life-compass
POST /v1/core/life-compass/candidates
POST /v1/core/life-compass/candidates/:candidateId/confirm
GET  /v1/core/privacy
PATCH /v1/core/privacy/:purpose/:scope
GET  /v1/core/export
POST /v1/core/retention/run
DELETE /v1/core/data
```

错误映射固定为：scope/revision/idempotency 409，permission/egress 403，not found 404，Zod validation 400；handler 不写 prompt、不调用模型、不执行外部动作。

- [ ] **Step 4: 运行 API contract tests**

Run: `corepack pnpm --filter @mindanchor/api test -- core-routes.integration.test.ts`

Expected: PASS，至少 12 个 HTTP contract tests。

- [ ] **Step 5: 运行旧回归**

Run: `corepack pnpm --filter @mindanchor/api test -- wayfinder.integration.test.ts`

Expected: 原有 Wayfinder 集成测试全部 PASS；Core route 的新 repository 不改变 JSON Store 数据。

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/routes/core.ts apps/api/src/app.ts apps/api/tests/core-routes.integration.test.ts
git commit -m "feat: expose personal core api"
```

### Task 9: 编写显式 JSON -> Core 迁移工具

**Files:**
- Create: `scripts/migrate-json-to-core.mjs`
- Create: `scripts/__tests__/migrate-json-to-core.test.mjs`
- Create: `docs/architecture/comma-v0.1-core-migration-runbook.md`

- [ ] **Step 1: 写 dry-run 测试**

用 fixture JSON 创建 legacy `wayfinderContextEvents`、`stateAssessments`、`wayfinderValueProfiles` 和一个 `traceLogEvent`。运行 `node scripts/migrate-json-to-core.mjs --input fixture.json --sqlite out.sqlite --dry-run`，断言退出码 0、输出 counts 和 unmapped counts，且 out.sqlite 不存在或没有业务写入。

- [ ] **Step 2: 写 apply 测试**

运行同一 fixture 的 `--apply`，断言 Context Event 只映射为 P1 event；StateAssessment 映射为 `userConfirmed=false` snapshot；ValueProfile 进入 `unmapped` 报告，不自动成为 Life Compass；trace 不进入 Core events；再次 apply 不重复写入。

- [ ] **Step 3: 实现工具**

工具只接受显式 `--input`、`--sqlite`、`--apply`；默认 dry-run。它读取 JSON，不删除、不覆盖源文件。映射规则固定：

```text
wayfinderContextEvents -> core_events(eventType=activity, source=legacy, privacy=P1)
stateAssessments       -> core_state_snapshots(userConfirmed=false, source=["legacy_state_assessment"])
wayfinderValueProfiles -> unmapped report only
traceLogEvents         -> unmapped report only
agent/coach memory     -> unmapped report only
```

`--apply` 通过 Core repository 的 clientEventId=`legacy:<old-id>` 幂等写入；结束输出 JSON `{dryRun, imported, skipped, unmapped, sourceSha256}`。source hash 改变时拒绝覆盖已有 import，要求新的目标 SQLite 路径。

- [ ] **Step 4: 编写 runbook**

记录备份源 JSON、dry-run、review unmapped、apply、export 对比、失败恢复（删除目标 SQLite 后重新 apply）和“未经用户确认不把旧 value profile 变成 Life Compass”的操作步骤。

- [ ] **Step 5: 运行迁移测试**

Run: `node --test scripts/__tests__/migrate-json-to-core.test.mjs`

Expected: PASS，dry-run 不写入、apply 幂等、敏感旧 trace 不进入 Core。

- [ ] **Step 6: Commit**

```powershell
git add scripts/migrate-json-to-core.mjs scripts/__tests__/migrate-json-to-core.test.mjs docs/architecture/comma-v0.1-core-migration-runbook.md
git commit -m "feat: add explicit legacy json to core migration"
```

### Task 10: 完成构建、静态检查和证据包

**Files:**
- Modify: `README.md` 或 `docs/local-development.md`：增加 Core 本地运行和数据文件位置。
- Create: `test-results/comma-v0.1-a-acceptance.md`：只记录本轮命令证据，不覆盖用户已有 test-results。

- [ ] **Step 1: 运行 domain/API build**

Run: `corepack pnpm --filter @mindanchor/domain build; corepack pnpm --filter @mindanchor/api build`

Expected: 两个命令退出码 0，生成 `apps/packages/domain/dist` 和 `apps/api/dist`，无 TypeScript error。

- [ ] **Step 2: 运行 Core tests**

Run: `corepack pnpm --filter @mindanchor/api test -- core-domain.test.ts core-sqlite-schema.test.ts core-events.test.ts core-state.test.ts core-life-compass.test.ts core-privacy-export-delete.test.ts core-routes.integration.test.ts`

Expected: 所有 Core 测试通过；输出通过数量和失败数量到 acceptance report。

- [ ] **Step 3: 运行旧回归**

Run: `corepack pnpm --filter @mindanchor/api test -- wayfinder.integration.test.ts wayfinder-policy.test.ts wayfinder-repository.test.ts`

Expected: 旧 Wayfinder 测试全通过；若根 `pnpm test` 因已有 macOS shell 命令在 Windows 失败，只记录失败原因，不修改无关脚本。

- [ ] **Step 4: 手工验收本地数据控制**

使用临时 `MINDANCHOR_PERSONAL_CORE_SQLITE_FILE` 启动 API，执行一次 event、state report、compass candidate/confirm、export、delete；检查 SQLite 文件可被 SQLite CLI/Node 读取，删除后业务 API 返回空结果，原始 legacy JSON 文件未改变。

- [ ] **Step 5: 完成 acceptance report**

报告必须包含：目标、修改文件、边界、每个命令的退出码/通过数、手工步骤、P0/P3/trace 证据、未完成的后续阶段和回滚路径。不得写“应该通过”或无命令依据的“已完成”。

- [ ] **Step 6: Commit**

```powershell
git add README.md docs/local-development.md test-results/comma-v0.1-a-acceptance.md
git commit -m "docs: record comma personal core skeleton acceptance"
```

---

## 计划自检

- 领域模型先于 API；API 先于客户端；没有把 V0.1-B-H 的模型、语音、外设混入本计划。
- Life Compass 只能 candidate -> user confirmation -> version；没有 direct overwrite endpoint。
- P0 retention、P3 local-only、permission revoke、export/delete、trace/memory separation 都有任务和测试。
- 旧 JSON Store 只读兼容和显式迁移都有任务；没有要求删除或覆盖工作树既有改动。
- 没有使用 `TODO`、`TBD` 或未定义的函数名作为步骤。
- 每个 API 写入都绑定 bearer user，不信任 body userId。

