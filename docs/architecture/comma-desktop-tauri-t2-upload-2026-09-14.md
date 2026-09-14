# Comma Desktop T2：数据路径切换（采集端 → Core API）

> 状态：已实现并通过跨边界契约验证（2026-09-14）。
> 上游：[`comma-desktop-electron-retirement-plan-2026-09-14.md`](./comma-desktop-electron-retirement-plan-2026-09-14.md) §5、[`comma-desktop-tauri-phase0-2026-09-14.md`](./comma-desktop-tauri-phase0-2026-09-14.md)。

## 1. 目标与边界

T2 把「采集端」与「服务端」之间的数据路径接通：Tauri 客户端把已有的脱敏聚合投影（`SanitizedExport`）投递到 Core API 的 `POST /v1/core/events`。

| 做 | 不做 |
|---|---|
| 脱敏投影 → Core event 的映射 | Wayfinder 客户端（交互面，归 T3 前的独立工作） |
| 本地持久队列 + 幂等重试 | 提醒收件箱（同上） |
| 端点配置与协议策略 | 音频桥（归 V0.1-G） |
| 三重门禁与 fail-closed | 任何自动触发上传的调度器（手动 `flush_uploads`） |

**T1.2 / T1.3 的重新归类**：退役计划原把 Wayfinder 客户端与提醒收件箱列为 T1 子项。复核后确认它们是**交互面**，与数据路径不同性质，且 Electron 版仍保留它们。故不在 T2 实现，避免把阶段做成跨阶段大爆炸。

## 2. 目标契约（读源码得到，非文档推断）

`POST /v1/core/events`，鉴权 `Authorization: Bearer <token>`（支持 `dev:<userId>:<email>` 本地绕过）：

| 字段 | 类型 | 本实现取值 |
|---|---|---|
| `eventType` | 枚举 | `"activity"` |
| `source` | 枚举 | `"desktop"` |
| `occurredAt` | ISO-8601 UTC | 导出时刻 |
| `privacyLevel` | `P0`\|`P1`\|`P2`\|`P3` | `"P1"` |
| `confidence` | **number** 0–1 | 聚合导出，上限 0.80 |
| `payload` | object | 仅聚合计数 |
| `clientEventId` | string（可选） | 内容哈希，提供幂等 |

成功返回 `201` + 事件对象。相同 `clientEventId` + 相同 payload 返回既有记录（幂等）；跨用户读写返回 404/空集。

> **`confidence` 必须是数字。** 初版实现按字符串发送（`"0.34"`），被 `apps/api/tests/desktop-upload-contract.test.ts` 以 400 拦下：`z.number()` 拒绝字符串。这是一个若不测就会让 100% 上传失败的缺陷。契约测试是发现它、而非假设它的唯一途径。

## 3. 变更文件

### 新增

| 文件 | 职责 |
|---|---|
| `apps/desktop-tauri/src-tauri/src/upload/mod.rs` | 模块导出、`UploadError`、端点协议策略 |
| `apps/desktop-tauri/src-tauri/src/upload/client.rs` | WinHTTP 传输（**唯一网络出口**） |
| `apps/desktop-tauri/src-tauri/src/upload/payload.rs` | `SanitizedExport` → Core event 映射 |
| `apps/desktop-tauri/src-tauri/src/upload/queue.rs` | 重试与退避策略（纯函数） |
| `apps/api/tests/desktop-upload-contract.test.ts` | 跨边界契约测试（Rust body → 真实 API） |

### 修改

| 文件 | 变更 |
|---|---|
| `apps/desktop-tauri/src-tauri/Cargo.toml` | 新增 `Win32_Networking_WinHttp` |
| `apps/desktop-tauri/src-tauri/src/lib.rs` | 4 个上传 command + `UploadStatus` + `CommandError::Upload` |
| `apps/desktop-tauri/src-tauri/src/store/mod.rs` | migration 2：`upload_queue` 表（append-only）+ 队列方法 |
| `apps/desktop-tauri/src-tauri/src/privacy/mod.rs` | `upload_enabled` 默认改为 `true` |
| `apps/desktop-tauri/src-tauri/src/store/sanitize.rs` | 测试随默认值更新 |
| `apps/desktop-tauri/src-tauri/tests/sanitize_test.rs` | 测试随默认值更新 |
| `pnpm-lock.yaml` | `pnpm install` 自动登记 `apps/desktop-tauri` workspace 条目 |

## 4. 三重门禁

```
enabled（采集开关）  AND  upload_enabled（默认 true）  AND  endpoint 非空且合法
```

- **`upload_enabled` 默认 `true`**：按本项目要求，可信中转服务器是必备设置，故机制默认就绪。
- **端点为空则拒绝**（`EndpointNotConfigured`），绝不猜测默认地址。
- **端点策略**：仅允许 `https://`；`http://` 仅限 loopback（`127.0.0.1` / `localhost` / `[::1]`）用于本地测试。非 loopback 明文一律拒绝（`InsecureEndpointRejected`），避免配置写错就静默明文外发行为数据。

### 关于 ali_2v2g 中转服务器的待办

用户将使用 `ali_2v2g` 作为可信服务器，协议待确认。届时按以下标准收敛：

| 服务器能力 | 处理 |
|---|---|
| 可信证书的 HTTPS | 直接可用，零改动 |
| 自签证书 HTTPS | 增加「信任此证书指纹」显式开关；**不**提供全局跳过校验 |
| 仅明文 HTTP | 需用户明确授权，并记为例外（代码注释 + 本文档） |

**当前不实现证书豁免路径**，因为一个"忽略证书错误"开关是长期风险，而正确的修法是把证书装进系统信任库。

## 5. 隐私不变式（T2 后仍成立）

| 不变式 | 实现 | 验证 |
|---|---|---|
| 无第三方 HTTP 栈 | 用系统 WinHTTP | `cargo tree` 中 reqwest/ureq/isahc/attohttpc/hyper 均为 **0** |
| 离开本机的只有聚合投影 | 唯一 payload 类型是 `SanitizedExport` | `serialised_body_carries_no_identifying_fields` |
| 无应用名/标题/路径 | 投影中不存在这些字段 | 同上 + Phase 0 红队测试 |
| P3 永不出境 | 导出级别恒为 `P1`；API 侧 P3 守卫拒绝 | `privacy_level_is_never_p3` + 契约测试 |
| 时间只到整点 | 小时分桶 | `raw_timestamps_are_bucketed_not_forwarded` |
| 失败不丢数据 | 耗尽尝试后标记 `failed` 保留 | `failed_items_are_kept_not_dropped` |

## 6. 重试策略

| 情形 | 处理 |
|---|---|
| 传输失败（DNS/连接/TLS/超时） | 重试，退避 1s→2s→4s… 上限 15min |
| HTTP 5xx / 429 | 重试 |
| HTTP 4xx（除 429） | **立即**标记 `failed`，不消耗尝试预算 |
| 响应格式错误 | 立即 `failed` |

最多 `MAX_ATTEMPTS = 8` 次；之后保持 `failed` 状态**保留在队列中**并在状态面可见，绝不静默删除。

## 7. 验证记录（2026-09-14 实测）

```powershell
# Rust 侧
cargo fmt --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
cargo build --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
# 前端
corepack pnpm --filter @mindanchor/desktop-tauri test
# API 跨边界契约（需先 build domain）
corepack pnpm --filter @mindanchor/domain build
apps/api/node_modules/.bin/vitest.cmd run --config apps/api/vitest.config.ts apps/api/tests/desktop-upload-contract.test.ts
```

| 检查 | 退出码 | 结果 |
|---|---|---|
| `cargo fmt --check` | 0 | 无差异 |
| `cargo clippy -D warnings` | 0 | 零警告 |
| `cargo test` | 0 | **79 + 9 + 7 + 10 = 105 passed, 0 failed** |
| `cargo build` | 0 | Finished |
| `pnpm test`（前端） | 0 | shadow 不变量通过 |
| **API 契约测试** | 0 | **4 passed**（幂等、跨用户隔离、P3 拒绝、401） |
| `cargo tree \| grep http-client` | — | reqwest/ureq/isahc/attohttpc/hyper **全为 0** |

## 8. 已知缺口与后续

1. **未做真实网络端到端**：Rust 侧 HTTP 发送只验证了"死端口返回干净错误"（`http://127.0.0.1:1`）。真实投递需在 `ali_2v2g` 就绪后跑一次，并把 HTTP 状态与 event id 记入本文档。
2. **无自动调度**：上传目前由 UI/命令手动触发；定时 flush 应在其后接入，并复用同一条门禁链。
3. **Wayfinder 客户端与提醒收件箱**仍未实现（见 §1 重新归类说明），Electron 版继续承担这些能力，故 `apps/desktop` 暂不能删除。
4. **重试与业务串行**：`flush_uploads` 是同步阻塞的（在 command 线程内）。若队列变大应移到独立线程；当前 `limit` 默认 20 遏制了单次耗时。
