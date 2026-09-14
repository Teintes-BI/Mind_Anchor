# Comma Desktop 阶段 0 基座：Windows 活动采集与「是否值得打扰」

> 状态：已实现并通过本地验证（2026-09-14）。
> 基线分支：`codex/comma-single-brain` (e3626ea) → 实现分支 `codex/comma-desktop-tauri`。
> 上游约束：[`comma-v0.1-technical-architecture-2026-08-24.md`](./comma-v0.1-technical-architecture-2026-08-24.md)、[`comma-v0.1-development-path-2026-08-24.md`](../roadmaps/comma-v0.1-development-path-2026-08-24.md)。

## 1. 本阶段在路线图中的位置

路线图 §1 把 Desktop Decision Window 归入 **V0.1-H**，§13 要求 V0.1-D 通过后才启动。本阶段**不实现 V0.1-H 的 Decision Window**，只交付它赖以成立的两个基座能力，且全部处于 shadow 模式：

| 交付 | 说明 | V0.1-H 中的对应 |
|---|---|---|
| 活动采集 | 前台进程名 + 空闲时长，本地采样 | 「在现有桌面活动采集上增加…」的前置 |
| 打断判定 | 纯函数分类 `interrupt / defer / silence` | 「识别有意义岔路口」的判定部分 |
| 本地留痕 | SQLite append-only 样本与判定 | 「关键提示有可追溯 trace」的雏形 |

**明确不做**：通知、弹窗、声音、置顶窗口、Action Card、Follow-Up、模型调用、向量检索、健康推断、外设。shadow 下判定结果只写入本地并显示在窗口里。

## 2. 技术栈迁移

| 项 | 原（Electron） | 现（Tauri 2 + Rust） |
|---|---|---|
| 运行时 | `apps/desktop`（Electron 35 + Node） | `apps/desktop-tauri`（Tauri 2 + Rust 2021） |
| 采集实现 | `windows-foreground.cjs`（PowerShell 子进程） | `src/collector/foreground.rs`（Win32 直调） |
| 判定位置 | 分散在 `collector-logic.js` / `desktop-state.js` | 集中 `src/interrupt/decision.rs`（纯函数） |
| 存储 | JSON 状态文件 | SQLite（`rusqlite` bundled） |

**替换策略**：Electron 版在本阶段**保持原样不动**，其测试继续有效；Tauri 版为新增。待 Tauri 版覆盖同等能力后，由后续阶段删除 `apps/desktop`。这样避免一次性重写破坏既有回归。

## 3. 模块结构

```text
apps/desktop-tauri/
├─ package.json                 # workspace 包，构建走 cargo 与 shell 检查
├─ scripts/check-shell.mjs      # 前端 shadow 不变量检查（禁 Notification 等）
├─ src/                         # 前端壳：只读展示 + 三个开关
└─ src-tauri/
   ├─ Cargo.toml                # 无任何 HTTP 客户端依赖
   ├─ tauri.conf.json           # 单窗口，无通知权限
   ├─ capabilities/default.json # 仅 core:default
   ├─ src/
   │  ├─ main.rs                # 引导：定位本地库、启动
   │  ├─ lib.rs                 # 6 个 Tauri command
   │  ├─ collector/
   │  │  ├─ mod.rs              # CollectorConfig + redact_title
   │  │  ├─ idle.rs             # GetLastInputInfo → 空闲秒数（唯一键盘相关调用）
   │  │  ├─ foreground.rs       # 前台进程名（标题默认不读）
   │  │  └─ sampler.rs          # 有界环形缓冲 + 采样门控
   │  ├─ interrupt/
   │  │  ├─ mod.rs              # SHADOW_MODE 常量与再导出
   │  │  └─ decision.rs         # ★ 全部判定逻辑，纯函数
   │  ├─ store/
   │  │  ├─ mod.rs              # SQLite append-only + 清除
   │  │  └─ sanitize.rs         # ★ 唯一上传投影
   │  └─ privacy/mod.rs         # P0-P3 分级 + 采集开关
   └─ tests/
      ├─ decision_test.rs       # 判定契约与理由可达性
      ├─ sanitize_test.rs       # 上传边界红队
      └─ privacy_test.rs        # schema 结构与写入门控
```

## 4. 判定引擎契约

`decision.rs` 是**纯函数**：无 I/O、无线程、无全局时钟。当前时间、当前小时、冷却状态全部经由 `DecisionInput` 注入，因此整个「是否值得打扰」问题可以在 `cargo test` 中完全复现。

输入 → 输出：

```text
DecisionInput { now_ms, local_hour, idle_seconds, samples[], last_interrupt_age_ms, interrupts_today, session_locked, policy }
        ↓ decide()
DecisionOutput { decision: Interrupt | Defer | Silence, reasons: [ReasonCode], score: 0-100 }
```

判定顺序即契约，分两组：

| 组 | 条件 | 结果 |
|---|---|---|
| 硬抑制 | 会话锁定 / 静默时段 / 今日额度用尽 | `Silence` |
| 软推迟 | 正在操作 / 离开过久 / 专注不足 / 切换风暴 / 冷却中 | `Defer` |
| 无阻塞 | 以上均不成立 | `Interrupt`（shadow 下仅记录） |

理由码全部可枚举、可断言：`IdleTooShort`、`IdleTooLong`、`FocusTooBrief`、`SwitchStorm`、`OutsideQuietHours`、`DailyBudgetExhausted`、`CooldownActive`、`Eligible`。`decision_test.rs::every_suppression_reason_is_reachable` 保证没有任何理由码是死代码。

默认策略：空闲阈值 30s、离开阈值 15min、最小专注 5min、切换窗口 10min / 8 次、静默时段 22:00–08:00、每日额度 3、冷却 20min。

## 5. 隐私实现（不是承诺，是结构）

本阶段把隐私做成**类型与 schema 层面的不可能**，而不是运行时的检查：

| 约束 | 实现方式 | 验证 |
|---|---|---|
| 不存按键与文本 | `ActivitySample` 无键码/文本字段；`activity_samples` 表无对应列 | `privacy_test.rs` 断言列集合恰为 5 列且不含 key/text/content/clipboard/title |
| 键盘只统计时长 | 仅调用 `GetLastInputInfo`（返回时间戳），**未安装任何键盘钩子** | 代码审阅：`idle.rs` 是唯一键盘相关文件 |
| 标题默认关闭 | `CollectorConfig::capture_window_title = false`；`sampler.rs` 二次强制清空 | `collector/mod.rs` 与 `sampler.rs` 单测 |
| 标题即使开启也脱敏 | `redact_title()` 截断 24 字符并丢弃分隔符后的文档名 | `redact_title_drops_document_tail` |
| 采集可关闭 | `CollectionState::enabled=false` 时采样返回 `None`，写入返回 `CollectionDisabled` | `privacy_test.rs::writes_are_gated_by_the_collection_switch` |
| 上传默认关闭 | `upload_enabled=false`，`may_upload()` 需双开关同时为真 | `sanitize_test.rs::default_state_cannot_export` |
| P3 永不出境 | `DataLevel::P3DeepPersonalModel.egress_forbidden()`，导出级别恒为 P1 | `export_declares_p1_and_excludes_p3` |
| 无网络能力 | `Cargo.toml` 无 HTTP 客户端依赖 | `cargo tree` 可验证 |

### 脱敏出口

`sanitize.rs` 定义唯一允许离开本机的数据结构 `SanitizedExport`：只含整点小时分桶计数、样本总数、空闲秒数总和、判定计数。**不含**应用名、窗口标题、路径、原始毫秒时间戳、用户名。红队测试用 `TaxReturn-2025`、`TherapyNotes`、`1Password` 等敌意应用名验证其绝不外泄。

按您的指示，「采集全程本地，但脱敏后允许发送到可信服务器」——本阶段只实现到**生成脱敏投影为止**，不实现任何传输，且传输默认关闭。

## 6. 验证证据

所有命令在 `apps/desktop-tauri/src-tauri` 下执行，均为实测结果。

```powershell
cargo fetch          # 依赖拉取
cargo fmt --check    # 格式
cargo clippy -- -D warnings
cargo test           # 单元 + 三个集成测试
cargo build          # 构建
corepack pnpm --filter @mindanchor/desktop-tauri test   # 前端 shell 不变量
```

（具体数值见本次交付汇报中的实测输出。）

## 7. 退出条件与遗留

本阶段退出条件：判定引擎在固定 fixture 下确定性可复现；隐私不变量有自动化证据；构建通过。**不**包含：真实通知投递、误打扰率统计、7 天连续运行——这些属于 V0.1-H 正式验收。

遗留项：

1. 采样调度目前由前端每 10s 轮询 + 手动触发；后续应改为 Rust 侧定时器。
2. `current_local_hour()` 使用 `GetLocalTime`，未做时区数据库处理；判定函数已把小时作为数据注入，替换点单一。
3. 真实打断效果（误打扰率、忽略率）尚未测量，需在放开 shadow 前用 7 天数据评估。
4. 锁屏 / 解锁检测已实现并端到端验证（`collector/session.rs`，`OpenInputDesktop` 轮询）。`poll_once` 实时读取；探测失败 fail closed 视为已锁定。实测：解锁态读数 `false`，人工 Win+L 后 3.51s 内翻转为 `true`。
5. Electron 版 `apps/desktop` 本阶段**刻意保留**，因为 Tauri 版尚未覆盖音频桥、Wayfinder 客户端与提醒收件箱三项能力。删除的前置条件、分阶段退出路径与每步验证命令见
   [`comma-desktop-electron-retirement-plan-2026-09-14.md`](./comma-desktop-electron-retirement-plan-2026-09-14.md)。
