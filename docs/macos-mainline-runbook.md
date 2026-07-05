# MindAnchor macOS 主链路运行手册

这份手册用于跑通并验收当前 `MindAnchor` 的 macOS 主链路。

它面向两类场景：

- 当前开发机器上复跑已完成的主链路
- 换一台 Mac 继续开发时，快速判断环境、命令、通过标准和排障路径

本文档对应的当前主链路是：

**原生 Mac 客户端登录与启动 → Gateway / OpenClaw 生成提醒 → 真实进入 macOS 通知层 → 状态栏恢复主窗口到 Reminders → App 内 ack 指定提醒并回写服务端**

配套文档：

- 首次安装与首跑：`docs/macos-install-and-first-run.md`
- 当前预发布门槛：`docs/macos-pre-release-checklist.md`

---

## 1. 当前范围

本手册覆盖：

- `apps/macos` 原生 macOS 客户端
- `apps/api` Gateway
- Gateway 到 provider / OpenClaw 的提醒生成链路
- macOS 状态栏恢复主窗口
- `desktop_local` 提醒的接收与 ack 回写

本手册当前**不**覆盖：

- Apple Developer 正式签名、公证、DMG 发布
- 点击真实系统通知横幅后的黑盒 UI 跳转
- 音频 Beta、视频 Beta、健康桥接
- Android / iOS 客户端

---

## 2. 通过标准

当前这条主链路的**开发级正式通过标准**固定为：

1. `apps/macos` 单测全部通过
2. 状态栏自动验收通过：主窗口可隐藏、可从状态项恢复、可切到 `Today` / `Reminders`
3. 提醒 E2E 自动验收通过，且满足以下事实：
   - 服务端真实生成了 `desktop_local` 提醒
   - 客户端真实收到了 pending reminder
   - 提醒 request 已进入 macOS 系统通知层
   - 状态项可以把主窗口恢复到 `Reminders`
   - App 自动化命令可以 ack **指定 messageId**
   - 服务端该 message 已变为 `acknowledged`

以下情况**不再视为失败**：

- 没有 Apple 正式签名身份
- 没有点击真实系统通知横幅 / 通知中心项
- ack 后客户端仍有其他 `pending` reminder

最后一点非常重要：  
当前 E2E 只要求“**目标提醒成功 ack**”，**不要求所有 pending 数量归零**，因为同一轮 provider 运行可能生成多条提醒。

---

## 3. 环境要求

至少需要：

- macOS
- Xcode / `xcodebuild`
- `xcodegen`
- Node.js 22+（建议）
- `corepack`
- `pnpm`

### 3.1 快速检查

```bash
xcodebuild -version
xcodegen --version
node -v
corepack pnpm --version
```

### 3.2 模型侧最小要求

提醒 E2E 需要 Gateway 至少能接上一个真实模型入口，满足以下二选一：

#### 方案 A：直连 provider

至少设置：

```bash
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=...
export MINDANCHOR_DEFAULT_MODEL_API_KEY=...
```

#### 方案 B：OpenClaw / cluster

至少设置：

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=...
```

如果两者都没有，`scripts/run-macos-reminder-notification-e2e.mjs` 会直接失败。

### 3.3 当前签名要求

当前开发级验收**不要求** Apple Developer 正式签名身份。

提醒 E2E 脚本会：

- 生成独立 bundle id
- 构建 Debug 包
- 对 E2E App 做 ad-hoc 签名

因此即使本机 `security find-identity -v -p codesigning` 没有有效身份，当前主链路仍然可以验收。

---

## 4. 关键命令

### 4.1 单测

```bash
corepack pnpm --filter @mindanchor/macos test
```

### 4.2 状态栏恢复主窗口验收

```bash
corepack pnpm test:macos:status-item
```

### 4.3 提醒主链路 E2E

```bash
corepack pnpm test:macos:reminder-e2e
```

### 4.4 OpenClaw Registry 通知准备诊断

```bash
corepack pnpm doctor:macos:openclaw-registry-notifications
corepack pnpm probe:macos:openclaw-registry-live-notification-status
```

如果你手上已经有某次 `registry e2e` 失败留下的 debug log，也可以直接带进去：

```bash
corepack pnpm doctor:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
```

这条命令会统一输出：

- 当前稳定 E2E bundle id
- notification profile 是否完整安装
- 当前 stable bundle 的 live 通知状态
- 当前 debug log 推断出的通知状态
- 是否检测到 `SecurityAgent`
- 下一步最直接的恢复建议

`probe:macos:openclaw-registry-live-notification-status` 的定位是：

- 不再从外部猜 stable bundle 当前的通知状态
- 而是直接让 `com.mindanchor.mac.openclaw.registry.e2e` 自己写出实时状态
- 这条命令当前最适合用来区分：
  - 真的还是 `denied`
  - 还是你已经在系统设置里改好了，只是旧 debug log 还没更新

### 4.5 OpenClaw Registry 通知准备安装

```bash
corepack pnpm install:macos:openclaw-registry-notifications
corepack pnpm verify:macos:openclaw-registry-notifications
```

当前这条链的定位是：

- 给固定 bundle `com.mindanchor.mac.openclaw.registry.e2e` 做机器准备
- 在 `SecurityAgent` 首次授权窗暂时不稳定时，作为旁路恢复手段
- 安装动作仍然需要系统设置人工完成最后一步

### 4.6 OpenClaw Registry 通知拒绝恢复

```bash
corepack pnpm open:macos:openclaw-registry-notification-settings
corepack pnpm repair:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm recover:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm report:macos:openclaw-registry-notification-recovery
corepack pnpm diagnose:macos:notification-center-click "OpenClaw Registry 不可达" "已配置外部 OpenClaw runtime，但当前无法连通" /tmp/.../notification-debug.log
corepack pnpm assess:macos:openclaw-registry-delivery-gate
```

这两条命令的分工是：

- `open:macos:openclaw-registry-notification-settings`
  - 优先尝试拉起**目标 bundle 对应**的 macOS 通知设置页
- `repair:macos:openclaw-registry-notifications`
  - 根据当前 debug log / profile / `SecurityAgent` 状态自动选择：
    - 打开通知设置
    - 或继续走 profile 安装旁路
- `recover:macos:openclaw-registry-notifications`
  - 触发恢复动作后继续自动复验
  - 当前会根据场景走两条不同路径：
    - `open_settings` → 先轮询实时 `doctor`
    - `install_profile` → 先轮询 `verify`
  - 最后会写出结构化恢复报告：
    - `tmp/mindanchor-openclaw-registry-notification-recovery-report.json`
  - 当前结束时还会自动生成可读 HTML：
    - `tmp/mindanchor-openclaw-registry-notification-recovery-report.html`
- `report:macos:openclaw-registry-notification-recovery`
  - 把恢复 JSON 重新整理成一份可读 HTML 报告
- `diagnose:macos:notification-center-click`
  - 单独诊断 “通知已授权，但 Notification Center 点击失败”
  - 会写出：
    - `tmp/macos-notification-center-click-diagnostics.json`
    - `tmp/macos-notification-center-click-diagnostics.html`
  - 当前这条诊断在 `OpenClaw Registry` E2E 中也已经自动接入：
    - 当通知已授权，但 `system notification click` 超时
    - `test:macos:openclaw-registry-e2e` 会自动继续产出这两份诊断文件
- `assess:macos:openclaw-registry-delivery-gate`
  - 读取恢复报告并给出当前机器的交付 gate 口径
  - 当前至少会区分：
    - `ready`
    - `manual_step_pending`
    - `setup_incomplete`
    - `blocked`

### 4.7 推荐执行顺序

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

这是当前最推荐的顺序：

- 先确认原生逻辑没坏
- 再确认 UI 壳和状态栏路由没坏
- 最后确认完整主链路

如果当前正在做 `OpenClaw Registry` 告警链路验收，推荐补上：

```bash
corepack pnpm doctor:macos:openclaw-registry-notifications
corepack pnpm probe:macos:openclaw-registry-live-notification-status
corepack pnpm repair:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm recover:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm report:macos:openclaw-registry-notification-recovery
corepack pnpm diagnose:macos:notification-center-click "OpenClaw Registry 不可达" "已配置外部 OpenClaw runtime，但当前无法连通" /tmp/.../notification-debug.log
corepack pnpm assess:macos:openclaw-registry-delivery-gate
corepack pnpm test:macos:openclaw-registry-e2e
```

---

## 5. 每一步在验证什么

### 5.1 `test:macos`

它主要覆盖：

- `AppConfiguration` 环境变量解析
- `APIClient` token / session 行为
- `AppViewModel` 登录、自举、提醒刷新
- `DesktopActivityCollector` 基础逻辑
- `ReminderCenter` 提醒展示与 ack 行为
- `MacAutomation` 自动化桥
- `StatusBarCoordinator` / `WindowCoordinator`

当前与主链路直接相关的关键测试包括：

- `apps/macos/Tests/MindAnchorMacTests/MacAutomationTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`

### 5.2 `test:macos:status-item`

它验证：

- App 可启动
- 主窗口可被隐藏
- 状态项可以恢复主窗口
- 状态项可以切换到 `Today`
- 状态项可以切换到 `Reminders`

对应脚本：

- `scripts/run-macos-status-item-acceptance.mjs`

### 5.3 `test:macos:reminder-e2e`

它验证的是真实主链路：

1. 生成 Xcode 工程并构建 App
2. ad-hoc 签名 E2E App
3. 启动临时 API 进程
4. 创建测试用户并登录
5. 启动 MindAnchorMac
6. 通过真实 `POST /state/signals/batch` 注入桌面信号
7. 等待 Gateway 生成 `desktop_local` 提醒
8. 等待客户端拉到 pending reminder
9. 观察 `systemNotificationRequestIDs`，确认 request 进入系统通知层
10. 通过状态项恢复到 `Reminders`
11. 通过 App 自动化命令 `acknowledge_reminder` 回写指定提醒
12. 轮询 `GET /client/inbox/overview`，确认目标提醒进入 `acknowledged`

对应脚本：

- `scripts/run-macos-reminder-notification-e2e.mjs`

---

## 6. 当前主链路里的关键实现点

如果后续继续改主链路，优先看这些文件：

- 自动化命令定义：`apps/macos/Sources/Core/MacAutomation.swift`
- App 内自动化 ack 入口：`apps/macos/Sources/Core/AppViewModel.swift`
- 提醒列表 UI：`apps/macos/Sources/Features/Reminders/RemindersView.swift`
- 状态栏恢复验收脚本：`scripts/run-macos-status-item-acceptance.mjs`
- 提醒主链路 E2E：`scripts/run-macos-reminder-notification-e2e.mjs`

当前最关键的两个稳定点是：

### 6.1 系统通知层证据

我们现在不是靠黑盒点击系统通知来验收，而是靠：

- `UNUserNotificationCenter` 的 pending / delivered request id
- 由 App 暴露到自动化快照中的 `systemNotificationRequestIDs`

这比点真实横幅稳定得多。

### 6.2 App 内 ack

当前不会再用 AppleScript 去点击 SwiftUI 按钮。  
最后一跳改为：

- 自动化命令 `acknowledge_reminder`
- 由 App 内部调用真实 `acknowledge(messageID:)`
- 再由脚本确认服务端 `acknowledgedMessages` 中出现目标 message

这条链更稳，也更适合持续回归。

---

## 7. 常见输出与证据

### 7.1 状态栏验收成功时

你应该能在终端看到：

- `✅ macOS 状态项恢复主窗口自动验收通过`

同时输出：

- `app bundle`
- `command file`
- `response file`

### 7.2 提醒 E2E 成功时

你应该能在终端看到：

- `✅ macOS 提醒通知整链路自动验收通过`

并且看到类似字段：

- `selected destination: reminders`
- `system notification request ids: ...`
- `pending reminder count after ack: ...`

注意：

- `pending reminder count after ack` **允许大于 0**
- 只要目标 reminder 已经被 ack，这轮就是通过

### 7.3 临时产物位置

脚本会输出：

- `command file`
- `response file`
- `api log`

这些文件都在系统临时目录下，适合排障。

另外构建产物固定在：

- `apps/macos/.derived-data/status-item-acceptance`
- `apps/macos/.derived-data/reminder-notification-e2e`

---

## 8. 故障排查顺序

建议固定按这个顺序排：

1. 单测有没有先绿
2. 状态栏验收有没有先绿
3. 提醒 E2E 卡在哪一步
4. 对应 API log 里最后一个请求是什么
5. 自动化快照里 `currentError` / `notificationStatus` / `systemNotificationRequestIDs` 是什么

### 8.1 构建失败

先看：

- `xcodegen generate`
- `xcodebuild`

优先检查：

- Xcode 是否可用
- `project.yml` 是否有效
- 本机 SDK / 架构是否可用

### 8.2 客户端登录超时

优先看：

- 自动化快照里的 `currentError`
- 启动环境变量：
  - `MINDANCHOR_API_BASE_URL`
  - `MINDANCHOR_AUTH_BOOTSTRAP_MODE`
  - `MINDANCHOR_AUTH_BOOTSTRAP_EMAIL`
  - `MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD`

### 8.3 服务端没有生成提醒

优先看：

- `/client/inbox/overview`
- `api.log`
- 模型环境是否设置

重点排查：

- `MINDANCHOR_OPENCLAW_BASE_URL`
- 或 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` / `MINDANCHOR_DEFAULT_MODEL_API_KEY`
- `POST /state/signals/batch` 是否成功

### 8.4 客户端收不到提醒

优先看：

- 自动化快照里的 `pendingReminderCount`
- `MINDANCHOR_REMINDER_POLLING_ONLY`
- `MINDANCHOR_INBOX_POLL_INTERVAL_SECONDS`

### 8.5 `OpenClaw Registry` 卡在通知权限

优先执行：

```bash
corepack pnpm doctor:macos:openclaw-registry-notifications
```

如果某次 `registry e2e` 已经留下 debug log，再带上那份 log：

```bash
corepack pnpm doctor:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
```

重点看 4 个字段：

- `notificationProfile profileInstalled=...`
- `notificationLiveState=...`
- `notificationDebugState=...`
- `notificationDebugStatus=...`
- `SecurityAgent window#...`

当前推荐判断法：

- 如果是 `notificationDebugState=denied`
  - 更准确地说，优先看 `notificationLiveState=denied`
  - 这说明稳定 bundle 当前真的还被系统拒绝
  - 默认先执行：

```bash
corepack pnpm repair:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm recover:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
```

  - 再去“系统设置 → 通知”把对应应用改回允许或清掉拒绝状态
  - 然后再重跑：

```bash
corepack pnpm test:macos:openclaw-registry-e2e
```

- 如果出现 `SecurityAgent window#...` 且 profile 还没装全
  - 先走通知准备旁路：

```bash
corepack pnpm repair:macos:openclaw-registry-notifications /tmp/.../notification-debug.log
corepack pnpm install:macos:openclaw-registry-notifications
corepack pnpm verify:macos:openclaw-registry-notifications
```

- 如果 `profileInstalled=false` / `bundleConfigured=false`
  - 说明当前机器准备链还没到位
  - 不要直接盲目重复跑 E2E
  - 先把 profile 安装链走完，再回头跑 `registry e2e`

### 8.6 哪些恢复结果不是脚本故障

如果 `recover` 的报告里出现：

- `notificationSettingsAutomationBoundary=manual_recommended`
- `result=waiting_for_manual_step`

这表示：

- 当前 host 上系统设置页**不适合继续假设可直接自动点击到开关**
- 但恢复链本身已经正常工作
- 现在只是停在了“等待你在系统设置里完成最后一步”

这类情况当前应当视为：

- **产品支持边界内的预期状态**
- **不是 recover 脚本故障**
- **也不应再被误判成产品不成熟**

如果你希望把这件事进一步落成交付口径，请直接执行：

```bash
corepack pnpm assess:macos:openclaw-registry-delivery-gate
```

当它返回：

- `deliveryGateStatus=manual_step_pending`

表示：

- 当前机器已经进入“可以继续交付 / onboarding”的支持状态
- 但还在等待用户手动完成系统权限最后一步

### 8.7 看不到系统通知层 request

优先看：

- 自动化快照里的 `notificationStatus`
- 自动化快照里的 `systemNotificationRequestIDs`

如果 `notificationStatus` 仍然是：

- `Notifications not requested`
- 或 `Notifications denied`

说明问题在系统通知授权，而不是提醒生成链路本身。

### 8.6 ack 没有写回服务端

优先看：

- `POST /client/inbox/:messageId/ack` 是否打到了 API
- `api.log` 中该请求是否 200
- 目标 message 是否进入 `acknowledgedMessages`

当前稳定标准是：

- **以服务端状态变更为准**
- 不是以客户端本地 pending 计数是否归零为准

### 8.7 需要导出排障材料

现在优先使用客户端内置的诊断导出：

1. 打开 `Settings`
2. 进入 `Support`
3. 点击 `Export Diagnostics Snapshot`
4. 如需附带文件位置，再点 `Reveal in Finder`

导出文件会包含：

- 当前账户与连接状态
- 队列 / 心跳 / 最近错误
- 权限与降级状态
- 最近通知 request id

这比手工截图更适合远程排障。

---

## 9. 换机接续开发时的最小流程

如果你在另一台 Mac 上接着做，建议按这个顺序：

### Step 1：准备环境

```bash
xcodebuild -version
xcodegen --version
node -v
corepack pnpm --version
```

### Step 2：准备模型入口

至少配置以下之一：

```bash
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=...
export MINDANCHOR_DEFAULT_MODEL_API_KEY=...
```

或：

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=...
```

### Step 3：跑单测

```bash
corepack pnpm --filter @mindanchor/macos test
```

### Step 4：跑状态栏验收

```bash
corepack pnpm test:macos:status-item
```

### Step 5：跑提醒主链路

```bash
corepack pnpm test:macos:reminder-e2e
```

只要这三步都过，就说明这台机器已经具备继续开发当前 macOS 主链路的基础。

---

## 10. 当前结论

截至当前仓库状态，macOS 主链路已经稳定到以下层级：

- 原生 App 可构建、可测试
- 状态栏恢复主窗口链路可自动验收
- 提醒主链路可自动验收
- 最后一跳 ack 已从脆弱的外部 UI 点击，收敛为稳定的 App 内自动化回写
- `Settings` 已具备本地诊断导出能力，可用于跨机器接续与支持排障

这就是当前最适合继续往“更成熟商用品质”推进的基线。
