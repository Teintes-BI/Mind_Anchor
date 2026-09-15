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

## 8. Fixture 回放（2026-09-14 新增）

判定引擎的策略调整需要一个可脱离代码的回放机制。fixture 以 **JSON 数据**描述时间线，因此后续微调阈值不必改 Rust。

| 文件 | 职责 |
|---|---|
| `apps/desktop-tauri/src-tauri/fixtures/decision-scenarios.json` | 8 个场景的数据定义 |
| `apps/desktop-tauri/src-tauri/src/interrupt/fixture.rs` | 类型、解析器、回放器（纯逻辑） |
| `apps/desktop-tauri/src-tauri/tests/fixture_replay_test.rs` | 对整份 fixture 的回放断言 |

### 为什么需要回放而非更多单测

单次调用 `decide()` 无法证明**跨步骤**性质：专注是否累积、冷却是否过期、每日额度是否递减、锁屏是否先抑制后释放。这些都需要时间线。回放器维护与 App 相同的跨步骤状态（`interrupts_today`、`last_interrupt_age_ms`、样本历史），并逐步断言。

### 8 个场景

| id | 验证 |
|---|---|
| `deep-focus-then-pause` | 专注累积 → `eligible` |
| `continuous-typing` | `idle_too_short` 阻止放行 |
| `long-absence` | `idle_too_long` 推迟而非静默 |
| `switch-storm` | 窗口内切换 > 阈值 → `switch_storm` |
| `quiet-hours-across-midnight` | 22→23→0→3→7 静默，8 点排他边界恢复 |
| `daily-budget-exhausted` | 额度为 1：消耗后为 `silence`（与 `defer` 的区别即本理由） |
| `cooldown-then-recovery` | 冷却 20min 内推迟，过后恢复 `eligible` |
| `session-locked-then-unlocked` | 锁屏恒 `silence`，解锁后恢复 |

### 回放发现的真实问题（首次运行即暴露）

`every_reason_code_appears_somewhere_in_the_fixtures` 断言 8 个理由码**全部**被某个场景覆盖。首次运行报出 `daily_budget_exhausted` 从未被断言——原 `daily-budget-exhausted` 场景实际测的是冷却，名不符实。原因是：冷却（20min）先于额度耗尽生效，原场景的 3 步全落在冷却窗口内。

修正：额度设为 1，并把后续步骤移到冷却过期之后（`at_ms` 1500000 / 3000000），使额度成为唯一生效的阻塞条件。

`switch-storm` 亦经两轮修正：`switch_count` 只统计 `switch_window_ms`（10min）**窗口内**的切换，且判定为 `> max_switches_in_window`（严格大于 8，即需 9 次）。原 fixture 用 120s 间隔，窗口内仅 6 次；且第 9 个样本恰为 8 次切换，仍未触发。收紧为 40s 间隔后正确触发。**这两次修正都是 fixture 的错，不是引擎的错——引擎行为符合设计。**

### 判定性测试

`a_mutated_threshold_is_detected_by_the_replay` 故意把 `min_focus_ms` 提到 10 小时，断言回放**必须失败**。这排除了"回放恒绿"的空转可能。

### 验证命令

```powershell
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
```

实测：`cargo test` **130 passed / 0 failed**（89 lib + 9 decision + 8 fixture + 7 privacy + 10 upload + 7 ignored live）；`clippy -D warnings` 与 `fmt --check` 均 exit 0。

## 8. 证书固定（TLS pinning）

中继使用**自签名证书**，因此 WinHTTP 默认的链校验必然失败。直接关闭校验是不可接受的——那会连带接受攻击者的任意证书。采取的策略是 **pin or refuse**：

1. 用户显式配置证书的 SHA-256 指纹（脱离通道获取，如经 SSH 读取）。
2. 仅放宽 `SECURITY_FLAG_IGNORE_UNKNOWN_CA` 一项链错误——足以接受自签名叶子证书，但**姓名不匹配、过期、用途错误仍然强制校验**。
3. 响应到达后读回服务器证书，比对指纹；不匹配即失败。

因此攻击者出示另一张自签名证书会得到**指纹不匹配**，而非上传成功。**`https` 端点未配置指纹一律拒绝**（`PinRequired`），代码中**不存在**跳过校验的模式。

| 文件 | 职责 |
|---|---|
| `src-tauri/src/upload/cert.rs` | 指纹规范化与校验策略（纯函数） |
| `src-tauri/src/upload/client.rs` | WinHTTP 传输 + 证书指纹读取 |
| `src-tauri/tests/live_relay_test.rs` | 对真实中继的端到端测试（`#[ignore]`） |

**实测（2026-09-14，对 `https://47.104.73.144:18443`）**：

| 检查 | 结果 |
|---|---|
| 正确指纹投递 | **201**，eventId `170a6af5-f47e-4a44-afa4-66f6eb26564c` |
| 幂等重放 | **同一 eventId** `4da835b6-…` |
| **错误指纹** | 拒绝（`FingerprintMismatch`） |
| **未配置指纹** | 拒绝（`PinRequired`），且未建立连接 |
| 无鉴权 | **401** |
| P3 | **403** `core_p3_egress_blocked` |

复跑：`cargo test --test live_relay_test -- --ignored --nocapture`

### 实现中踩到的两个真实缺陷（记录以免复现）

1. **`WinHttpWriteData` 返回 `E_INVALIDARG (0x80070057)`**：先 `WinHttpSendRequest`（body 为空、长度 0）再 `WinHttpWriteData` 写 body 会被 WinHTTP 拒绝。正确做法是把 body 直接传给 `WinHttpSendRequest` 的 `lpOptional` 并同时给出 `dwTotalLength`。
2. **证书只能在 `WinHttpReceiveResponse` 之后读取**：TLS 握手在该调用中完成，之前读 `WINHTTP_OPTION_SERVER_CERT_CONTEXT` 会失败。

另有一处**调用约定**值得注意：`post_json` 自行拼接 `Bearer ` 前缀，因此传入的 token **不能**再带 `Bearer `，否则会发出 `Bearer Bearer dev:…` 而被 401 拒绝。这一点已在测试常量处注明。

## 8b. 中继配置界面与自动上传（2026-09-15 新增）

**界面**：`index.html` 新增「可信中继」面板——端点、Bearer 令牌、证书指纹、自动上传间隔，以及队列与"下次调度"状态。令牌字段用 `type="password"`，且**后端从不回显**任何密钥，界面只显示"已设置/未设置"。

**自动上传**：`src-tauri/src/upload/schedule.rs`（纯函数决策）+ `lib.rs` 中的后台线程，每分钟重估一次。每个 tick 都**重新读取**全部门禁，不缓存"已配置"状态——因此用户关掉开关后不会继续上传。

门禁链（**全部**满足才上传）：采集开启 → 上传开关开启 → **端点已配置** → 队列非空。任一不满足即 `Skip(reason)`，并且原因**会显示在界面上**（"端点未配置"而不是静默不动）。间隔会被钳制到 `[1 分钟, 24 小时]`，`0` 表示关闭调度。

调度与手动上传共用 `flush_uploads_inner`——**同一条代码路径、同一组门禁**，所以自动上传无法绕过手动上传要过的检查。

**界面守卫**：`scripts/check-shell.mjs` 新增三条不变量（反向自测见 `scripts/check-shell.test.mjs`，已接入 `pnpm test`）：

| 不变量 | 理由 |
|---|---|
| 前端与 HTML 中**不得出现硬编码端点** | 一旦写死就等于绕开"未配置就不发送" |
| 令牌字段必须是 `type="password"` | 避免密钥明文显示 |
| 配置必须来自 `invoke("upload_status")` | 端点只能源自 Rust 状态 |

自测已证明三条守卫**确实会失败**（故意注入硬编码端点、把 password 改成 text、删掉后端读取，分别被拦下）。

**同时修正了 HTML 中两处因 T2 而失实的声明**：原写"本程序不含任何网络代码"与"脱敏导出默认关闭"，现已改为准确描述（仅在端点已配置且双开关开启时才发送整块聚合；上传开关默认值仍为 `true`）。

## 8c. 静默时段开关与「立即上传」修复（2026-09-15）

### 问题一：深夜所有判定恒为 `静默`

默认静默时段是 **22:00–08:00**，因此在深夜调试时每一条判定都返回 `Silence`，理由恒为 `OutsideQuietHours`——看上去像引擎坏了，实际是设计如此。这个现象**掩盖了其余规则是否工作**。

修复：`CollectionState` 新增 `quiet_hours_enabled`（默认 `true`，保持"夜间不打扰"的隐私姿态），界面在「隐私边界」加勾选框。关闭时窗口折叠为 `start == end`，而 `is_quiet_hour` **本来就把相同起止视为"永不静默"**——沿用既有表示，避免出现第二个可能与规则冲突的真值来源。重新开启会恢复 `22–8`。

已加 5 个测试，包括：开关往返、幂等、**起点为 0 的真实窗口（0→5）仍可被关闭**（不能把"关闭"误当成"起点为 0"）、以及关机时段后 03:00 不再被抑制。

### 问题二：「立即上传」点了没反应（两处真实缺陷）

1. **逻辑不完整**：`enqueue_upload_now`（入队）与 `flush_uploads`（发送）是两个命令，而按钮**只调了后者**。队列为空 → 必然 `EmptyQueue`。界面上又没有入队入口，所以该功能实际不可用。
   修复：新增 `send_now` = 入队 + 发送，共用 `enqueue_upload_inner` 的门禁，一步到位。

2. **错误显示在别的面板**：`renderError` 把消息**写死**插在「立即采样一次」按钮之后，而「立即上传」在最下面的面板 → 视觉上"没反应"。
   修复：`renderError(message, anchorId)` 把消息锚定到触发操作旁边的控件。

另修一个**空指针**：`quiet_hours_window` 在关闭时段时为 `null`，原先直接读 `.start_hour` 会让整个 `refresh()` 抛异常。

### 状态显示

`StatusSnapshot` 新增 `quiet_hours_enabled` 与 `quiet_hours_window`；界面「静默时段」一行显示 `开启（22:00–08:00）` 或 `已关闭`。

实测：`cargo test` **149 passed / 0 failed**（lib 110 → 115，含 5 个新测试）；`clippy -D warnings`、`fmt --check`、`pnpm test`、`live_relay_test` 6/6 全部 exit 0。

### 一个工具陷阱（值得记住）

`tauri dev` 的 `cargo-tauri` 是**文件监听器**：源码一改就自动重编译并重启应用，于是 `comma-desktop.exe` 被反复占用，`cargo test` / `cargo build` 持续报 `failed to remove file ...comma-desktop.exe`。**关掉应用窗口无效**，必须停掉 `cargo-tauri` 进程（或 Ctrl+C 整个 dev 会话）。

## 8d. UI → IPC → Rust → 中继 端到端验收（2026-09-15，人工点击）

**结论：通过。** 这是此前唯一的"未验证链路"，现已由真实点击闭环。

### 证据一：服务端收到的事件

中继 `/home/claw/.local/share/comma-core-relay/personal-core.sqlite` 中 `core_events` 实测：

```
2026-09-15T04:39:28Z  desktop  ui-test  desktop-activity-dee02fbf8411ceaf
2026-09-15T04:39:20Z  desktop  ui-test  desktop-activity-cbdc4e981ab782b9
2026-09-15T04:38:20Z  desktop  ui-test  desktop-activity-6f67b6bc10ab0a47

按用户统计： ui-test: 3
```

**与界面「已送达 3」逐一对上** —— 界面计数不是本地乐观计数，而是真实投递数。

### 证据二：配置持久化（关掉重开后仍正确）

人工验收步骤与结果：

1. 填端点 / 令牌 / 指纹 → 点「保存中继配置」→ 显示 `中继配置已保存`
2. 完全关闭应用（Ctrl+C 停 dev 会话）
3. 重新 `cargo tauri dev`
4. 「可信中继」三行显示：**端点 = 完整 URL、令牌 = 已设置、证书指纹 = 已固定**

**通过。** 此前三者恒为 `（未配置）/ 未设置 / 未固定`。

### 这一轮修掉的四类真实缺陷

| # | 缺陷 | 后果 | 提交 |
|---|---|---|---|
| 1 | 后端错误对象被 `${error}` 拼接 | 界面显示 `[object Object]`，失败原因不可读 | `53c6b6c` |
| 2 | 未填字段以 `""` 提交 | 后端读作"清空" → 空白格会删掉已存配置 | `63b49dd` |
| 3 | `refresh()` 每次覆盖端点输入框 | 冲掉正在输入的内容 | `63b49dd` |
| 4 | **配置只写内存、从未落盘** | 重启即丢；而队列计数来自 SQLite，造成"计数对、配置空"的割裂 | `7774ce6` |

第 4 项是本轮的核心：**第一次诊断（"UI 读错状态来源"）是错的**——`已送达 3` 与 `端点` 同源，解释不通。真因是 `app.upload_endpoint = trimmed;` 不落盘。

### 界面守卫（防回归）

`pnpm test` 现含 9 条反向自测，**每条都实测会失败**：

| 脚本 | 守卫 |
|---|---|
| `check-shell.mjs` + `.test.mjs` | 不得硬编码端点、令牌框必须 password、配置须来自后端、错误须经 `formatError`、`formatError` 必须存在、**不得从 `collector_status` 读中继字段** |
| `check-relay-form.test.mjs` | 未填字段不得以空串提交、refresh 不得覆盖半输入的端点、**指纹框不得被清空** |

### 工具陷阱（两次踩到，值得记）

`cargo-tauri` 是**文件监听器**：源码一变就自动重编译并重启应用，持续占用 `comma-desktop.exe`，导致 `cargo build` / `cargo test` 反复报 `failed to remove file ... (os error 5)`。**关掉应用窗口无效**，必须 Ctrl+C 停掉整个 dev 会话。`cargo check` / `clippy` 不链接二进制，因此不受影响，可用于在被占用期间核对类型。

## 9. 已知缺口与后续

1. ~~**未做真实网络端到端**~~ → **已完成于 2026-09-14**。`ali-2v2g` 中继已部署并验证：从 Windows 经公网 TLS 投递 **201**（0.097s），幂等重放返回同一 id，P3 被 **403** 拒绝，无鉴权 **401**。完整证据（部署路径、证书指纹、逐步命令、实测输出）见
   [`comma-t2-relay-e2e-evidence-2026-09-14.md`](./comma-t2-relay-e2e-evidence-2026-09-14.md)。
2. ~~**Rust 客户端尚未指向该端点 / 无证书指纹 pin / 未跑真实 flush_uploads**~~ → **已于 2026-09-15 完成**。证书固定（pin-or-refuse）见 §8；Rust 客户端对真实中继的 6 个 live 用例通过（201 / 幂等同 id / 错误指纹拒绝 / 未配指纹拒绝 / 401 / P3 403）。
3. ~~**UI → IPC → Rust 链路未点击验证**~~ → **已于 2026-09-15 完成**，见 §8d。服务端 `core_events` 中 `ui-test` 3 条与界面「已送达 3」对上；配置在关掉重开后仍正确。
4. ~~**无自动调度**~~ → **已完成**。`upload/schedule.rs` + 后台线程，门禁链与手动上传共用 `flush_uploads_inner`（见 §8b）。
5. **中继侧运维缺口（未做）**：`Mind_Anchor_core` 的新 API 目前是 `nohup` 启动，**无 systemd 单元**，主机重启不会自动恢复；`MINDANCHOR_AUTH_DEV_BYPASS` 仍为 `true`，上线前必须改 `false` 并配置真实 JWT 密钥。详见 §relay 证据文档。
6. **队列无清理手段**：失败的队列项按设计不被静默丢弃，但界面**没有清除入口**，失败计数会长期滞留并干扰判断。
7. **Wayfinder 客户端与提醒收件箱**仍未实现（见 §1 重新归类说明），Electron 版继续承担这些能力，故 `apps/desktop` 暂不能删除。
8. **重试与业务串行**：`flush_uploads` 是同步阻塞的（在 command 线程内）。若队列变大应移到独立线程；当前 `limit` 默认 20 遏制了单次耗时。
