# Comma 桌面端退役计划：Electron → Tauri 2

> 状态：**规划**（不是执行）。阶段 0 明确**不删除** `apps/desktop`。
> 制定日期：2026-09-14
> 基线：`codex/comma-desktop-tauri`，从 `codex/comma-single-brain` (e3626ea) 派生。
> 相关：[`comma-desktop-tauri-phase0-2026-09-14.md`](./comma-desktop-tauri-phase0-2026-09-14.md)、[`comma-v0.1-development-path-2026-08-24.md`](../roadmaps/comma-v0.1-development-path-2026-08-24.md)。

## 1. 为什么现在不删

阶段 0 的 Tauri 版只交付了「活动采集 + 打断判定 + 本地留痕」。Electron 版还有四项 Tauri 尚未实现的能力。现在删除等于功能倒退。

| 能力 | Electron `apps/desktop` | Tauri `apps/desktop-tauri` | 补齐归属阶段 |
|---|---|---|---|
| 前台进程名 | `windows-foreground.cjs` | `collector/foreground.rs` | 已平价 |
| 空闲时长 | `powerMonitor.getSystemIdleTime` | `collector/idle.rs` | 已平价 |
| **锁屏 / 解锁检测** | `powerMonitor` `lock-screen`/`unlock-screen` | `collector/session.rs`（`OpenInputDesktop`） | ✅ 已完成 |
| 窗口标题（脱敏） | 可选 | 可选（更严格） | 已平价 |
| 打断判定 | 无（仅 idle 阈值节流） | 纯函数决策引擎 | Tauri 更强 |
| 本地存储 | JSON 状态文件 | SQLite append-only | Tauri 更强 |
| **信号上报 API** | 队列 + 重试 + flush | **无网络**（刻意） | T2 |
| **音频桥 / Whisper** | `audio-bridge.js`、`local-whisper-transcriber.js`、`audio-emotion.js` | **缺失** | V0.1-G |
| **Wayfinder 客户端** | `wayfinder-client.js`（preload IPC，renderer 拿不到 token） | **缺失** | T1 |
| **提醒收件箱** | 多通道（`desktop_local`/`mobile_push`/`feishu_bot`/`telegram_bot`） | **缺失** | T1 |

## 2. 当前耦合面（只读实测，2026-09-14）

全仓对 `@mindanchor/desktop` 的引用只有 4 处，`pnpm-lock.yaml` 1 处：

| # | 位置 | 内容 | 退役时动作 |
|---|---|---|---|
| 1 | `package.json:14` | `"dev:desktop": "corepack pnpm --filter @mindanchor/desktop dev"` | T3 改为指向 `@mindanchor/desktop-tauri`（或删除） |
| 2 | `pnpm-lock.yaml:54` | `apps/desktop:` workspace 条目 | T3 由 `pnpm install` 自动重算，**不手改** |
| 3 | `docs/desktop-clients.md:6,15` | Windows 客户端描述与启动命令 | T3 更新 |
| 4 | `docs/wayfinder/mobile-health-contract.md:43,53` | 2026-08-06 历史验收记录 | **永不修改**（历史证据） |

**重要：没有任何代码 import `apps/desktop` 的模块。** 删除不会破坏 `apps/api`、`packages/domain`、`apps/web` 或任何测试链。`scripts/*.mjs` 中出现的 "desktop" 字样经逐个核对全为无关词（macOS `excludeDesktopElements`、`desktop_local` 通知渠道、`desktopLanIp` 变量、`source: "desktop"` 事件来源字符串）。

### 变化中的耦合面

上面是**当前**事实。若后续阶段新增引用（例如 API 侧开始校验 desktop 事件来源、CI 增加 desktop 矩阵），本表必须重新实测，不得沿用。重测命令见 §6。

## 3. 退出基线（开始任何 T 阶段前必须记录）

Electron 端当前实测基线（2026-09-14，`codex/comma-desktop-tauri`）：

```powershell
corepack pnpm --filter @mindanchor/desktop test    # exit 0; 31 tests, 31 pass, 0 fail
corepack pnpm --filter @mindanchor/desktop build   # exit 0
```

T3 执行前必须重跑并记录，用于对比「删除后是否有能力净损失」。

## 4. T1 — 能力平价阶段

**前置**：V0.1-G（语音）与 V0.1-H（Decision Window）的对应能力已在 Tauri 侧定义。
**目标**：Tauri 版逐项覆盖上表标记为「缺失」的四项。

### T1.1 锁屏 / 解锁检测 — ✅ 已完成（2026-09-14）

- 新增：`apps/desktop-tauri/src-tauri/src/collector/session.rs`
- 修改：`apps/desktop-tauri/src-tauri/src/collector/mod.rs`（注册模块）
- 修改：`apps/desktop-tauri/src-tauri/src/lib.rs`（`poll_once` 的 `session_locked` 改为实时读取；`decision_preview` 保持 `false` 并注明它是 what-if 工具）
- 修改：`apps/desktop-tauri/src-tauri/Cargo.toml`（新增 `Win32_System_StationsAndDesktops` feature）
- 修改：`apps/desktop-tauri/src-tauri/tests/live_windows_test.rs`（新增 2 个实时测试）

实现要点：用 `OpenInputDesktop` 轮询判定，而非 `WTSRegisterSessionNotification`（后者需要窗口过程与消息循环，对每个采集周期采样一次的读数而言是过重的接口面）。解锁时能拿到输入桌面句柄；锁定后输入桌面归安全桌面（Winlogon）所有，调用失败。**该探测只读状态，不锁定、不解锁、不切换桌面。**

失败处理：探测失败按「已锁定」处理（fail closed），避免 API 出错时误判为可打扰。注意 `HDESK` 不是 `HANDLE`，必须用 `CloseDesktop` 释放，用 `CloseHandle` 会编译失败。

验证命令：

```powershell
cargo build --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
cargo test  --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
# 实时读数（不改变桌面状态，期望 session_locked = false）
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml `
  --test live_windows_test -- --ignored --nocapture --test-threads=1 --skip session_lock_flip
# 锁定翻转（需人工按 Win+L；跑起来后有 45s 等待窗口）
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml `
  --test live_windows_test -- --ignored --nocapture session_lock_flip
```

已记录证据（2026-09-14 实测）：

- 解锁态读取：`session_locked = false`（`OpenInputDesktop` 拿到输入桌面句柄，判定正确）
- `cargo test`：50 lib + 9 decision + 7 privacy + 9 sanitize，全绿；`clippy --all-targets -- -D warnings` 与 `fmt --check` 均 exit 0
- **锁定态翻转（人工 Win+L，端到端）**：由用户在 45s 等待窗口内按 Win+L，实测输出

  ```text
  live: before = false (expect false)
  live: >>> press Win+L now; waiting up to 45s <<<
  live: after = true
  live: lock detected; unlock to finish
  test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 6 filtered out; finished in 3.51s
  ```

  即：锁定后 3.51s 内探测到状态由 `false` 翻转为 `true`。这与 Electron 版 `powerMonitor` `lock-screen` 事件能力**平价**（Electron 为事件推送，本实现为轮询，采样周期即延迟上界）。

T1.1 已完成，无遗留。

### T1.2 Wayfinder 客户端 — 重新归类到 T2

原本列为 T1，但复核后：它需要 API 服务在跑才能验收，且会打破当前「采集端零网络」的边界。这与 T2（数据路径切换）是同一类工作，合并到 T2 更合理，避免 T1 扩成跨阶段的大改动。

### T1.3 提醒收件箱 — 重新归类到 T2

理由同 T1.2：依赖 API 运行与网络边界变更，与 T2 同源。


## 5. T2 — 数据路径切换阶段 — ✅ 已实现（2026-09-14）

**前置**：V0.1-A 的 Core API 稳定（`/v1/core/events` 等），且 `expectedRevision`/幂等语义已验收。
**目标**：Tauri 版接上信号上报，走脱敏投影而非原始数据。

完整实现与验证记录见 [`comma-desktop-tauri-t2-upload-2026-09-14.md`](./comma-desktop-tauri-t2-upload-2026-09-14.md)。摘要：

- 新增 `apps/desktop-tauri/src-tauri/src/upload/`（`mod.rs` 端点策略、`client.rs` WinHTTP 传输、`payload.rs` 契约映射、`queue.rs` 重试策略）。
- 新增 `apps/api/tests/desktop-upload-contract.test.ts`：把 Rust 生成的 body 喂进真实 Fastify `inject()`，验证幂等、跨用户隔离、P3 拒绝、401。**该测试发现了一个真实缺陷**：`confidence` 初版按字符串发送，API 的 `z.number()` 会以 400 拒绝，即 100% 上传失败。
- store migration 2 新增 `upload_queue` 表（append-only，唯一索引保证同一 `clientEventId` 不重复投递）。
- 三重门禁：`enabled` AND `upload_enabled`（**默认 `true`**，因可信中转服务器是本设计必备设置）AND 端点非空且合法。
- 端点策略：仅 `https://`，`http://` 仅限 loopback。**ali_2v2g 的协议待用户确认后按同一标准收敛**（自签证书走系统信任库，不提供跳过校验开关）。

### T2.2 旧状态文件处置 — 待 T3 决策

Electron 版把状态写在 JSON 文件里。必须二选一并在文档中明确声明，**不允许默认静默丢弃**：

- **迁移**：一次性把 `signalQueue` / `collector.recentSignals` 转成 Core event，记录迁移计数；
- **不迁移**：在退役报告里写明「旧状态文件保留只读，不导入 Core」，并提供用户手动导出路径。

验证命令：

```powershell
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml
corepack pnpm --filter @mindanchor/domain build
apps/api/node_modules/.bin/vitest.cmd run --config apps/api/vitest.config.ts apps/api/tests/desktop-upload-contract.test.ts
```

已记录证据：`cargo test` 105 passed / 0 failed；契约测试 4 passed / 0 failed；`cargo clippy -D warnings` 与 `fmt --check` 均 exit 0；`cargo tree` 中第三方 HTTP 客户端数量为 0。

**T2 剩余门**：真实网络端到端投递（需 `ali_2v2g` 就绪），届时记录 HTTP 状态与 event id。

## 6. T3 — 实际删除阶段

**前置**：T1 与 T2 均通过各自退出门。

### 执行步骤

```powershell
# 1. 记录删除前基线
corepack pnpm --filter @mindanchor/desktop test
corepack pnpm --filter @mindanchor/desktop build

# 2. 确认无代码引用（必须为空；非空则停止）
#    用 search_files 工具搜索 "@mindanchor/desktop"，预期仅剩 package.json:14、
#    docs/desktop-clients.md，以及 mobile-health-contract.md 的历史记录

# 3. 删除目录
git rm -r apps/desktop

# 4. 改 dev:desktop 指向新包（或整体删除该脚本）
#    修改 package.json:14

# 5. 重算 lockfile
corepack pnpm install

# 6. 全量回归
corepack pnpm -r --if-present build
corepack pnpm -r --if-present test
corepack pnpm --filter @mindanchor/desktop-tauri test
cargo test --manifest-path apps/desktop-tauri/src-tauri/Cargo.toml

# 7. 更新文档
#    docs/desktop-clients.md 的 Windows 章节改为 Tauri；
#    mobile-health-contract.md 的 2026-08-06 记录保持原样（历史证据）。
```

### T3 退出门

- `git rm -r apps/desktop` 后 `pnpm install` 无 lockfile 冲突；
- 全仓 `--if-present build` / `test` 与删除前基线**同等通过**；
- `search_files "@mindanchor/desktop"` 只剩预期位置；
- `mobile-health-contract.md` 历史记录未被改写。

## 7. 回滚路径

T3 在独立分支（建议 `codex/comma-desktop-retirement`）执行，从 T1 完成点派生，**不与其他阶段混提**。若 T1 或 T2 出现能力倒退，直接丢弃该分支，Electron 版仍在 `main` 历史中可用。

禁止在 T1/T2 未通过时提前删除，理由是那时回滚需要 revert 一个跨包删除，成本远高于丢弃一个未合并分支。

## 8. 不属于本计划

- 阶段 0 的 Tauri 采集/判定实现（见 phase0 文档）；
- macOS 原生客户端 `apps/macos` —— 与 Electron 退役无关，不在范围；
- 移动端 `apps/android-recorder` / `apps/ios-wayfinder` —— 不在范围。
