# MindAnchor macOS 安装与首次运行指南

这份文档面向两类人：

- 在当前机器上首次拉起 `apps/macos`
- 在另一台 Mac 上无缝接续开发或做预发布试用

如果你要看完整主链路验收，请配合：

- `docs/macos-mainline-runbook.md`
- `docs/macos-pre-release-checklist.md`

---

## 1. 目标结果

成功完成本指南后，你应该能做到：

1. 生成并打开原生 macOS 工程
2. 启动 `MindAnchorMac`
3. 看到登录 / Today / Settings 主窗口
4. 完成一次基础同步
5. 在 `Settings` 里导出诊断快照

---

## 2. 环境前提

至少需要：

- macOS
- Xcode
- `xcodebuild`
- `xcodegen`
- Node.js 22+
- `corepack`
- `pnpm`

快速检查：

```bash
xcodebuild -version
xcodegen --version
node -v
corepack pnpm --version
```

---

## 3. 仓库准备

在仓库根目录执行：

```bash
cd /Users/claw/mindanchor
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
```

如果你只是要生成 macOS 工程：

```bash
corepack pnpm --filter @mindanchor/macos generate
```

---

## 4. 最小环境变量

### 4.1 API 必填

```bash
export MINDANCHOR_API_BASE_URL=http://127.0.0.1:3001
```

### 4.2 登录开发自举（推荐）

如果要快速进入单用户开发态：

```bash
export MINDANCHOR_AUTH_BOOTSTRAP_MODE=register
export MINDANCHOR_AUTH_BOOTSTRAP_EMAIL=demo@example.com
export MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD=Password123!
export MINDANCHOR_AUTH_BOOTSTRAP_DISPLAY_NAME="MindAnchor Demo"
```

如果该账号已经存在，把 `register` 改成 `login` 即可。

### 4.3 提醒链路的模型侧前提

二选一：

#### 方案 A：直连 provider

```bash
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn
export MINDANCHOR_DEFAULT_MODEL_API_KEY=你的密钥
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
```

#### 方案 B：走 OpenClaw cluster

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787
```

---

## 5. 启动顺序

### 5.1 启动 Gateway

```bash
corepack pnpm dev:api
```

如果你是 cluster 路径，再另开终端：

```bash
corepack pnpm dev:openclaw
```

### 5.2 生成并打开 Xcode 工程

```bash
corepack pnpm --filter @mindanchor/macos generate
open apps/macos/MindAnchorMac.xcodeproj
```

### 5.3 在 Xcode 里运行

最短路径：

1. 选中 `MindAnchorMac` scheme
2. Destination 选 `My Mac`
3. 按 `Run`

如果你更喜欢命令行构建：

```bash
corepack pnpm --filter @mindanchor/macos build
```

---

## 6. 首次运行时你应该看到什么

### 6.1 启动后

你应看到：

- 菜单栏里出现 `MindAnchor`
- 主窗口出现侧边栏：`Today` / `Goals / Tasks` / `State` / `Reflections` / `Reminders` / `Settings`

### 6.2 登录 / 自举成功后

在 `Today` 页应能看到：

- `Operational Summary`
- `Connection`
- `Permissions & Collection`
- `Recent Activity`
- `Recent Reminders`

### 6.3 `Settings` 页应能看到

- 账户信息
- 权限信息
- 设备与连接状态
- 本地诊断路径
- `Export Diagnostics Snapshot`

---

## 7. 首次运行成功判定

满足以下几点即可认为首跑成功：

1. App 可启动且不会立即退出
2. `Today` 能看到已登录或可登录状态
3. `Settings` 能看到 API 地址、队列、心跳、权限状态
4. 点击 `Export Diagnostics Snapshot` 后，状态变为 `Diagnostics export ready`
5. `Reveal in Finder` 能打开诊断快照位置

---

## 8. 首次排障顺序

如果首跑失败，按这个顺序看：

1. `MINDANCHOR_API_BASE_URL` 是否正确
2. `pnpm dev:api` 是否已启动
3. Xcode 是否真的在运行 `MindAnchorMac`
4. `Settings` 里的 `Last Error` 是什么
5. `Settings` 里的连接状态是不是一直停在 `Connecting`

如果提醒链路失败，再继续看：

- `docs/macos-mainline-runbook.md`

---

## 9. 下一步建议

首跑完成后，建议按这个顺序继续：

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

这样就从“能打开”进入了“主链路可验收”。
