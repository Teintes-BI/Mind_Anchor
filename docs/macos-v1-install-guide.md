# MindAnchor macOS V1 安装与连接指南

这是 V1 版本面向普通单用户的 macOS 安装说明。

如果你已经看过更详细的开发版文档，可以把这份理解为：

- 更贴近最终交付
- 更强调“连上自己的 Gateway + OpenClaw”

详细首跑说明仍可参考：

- `docs/macos-install-and-first-run.md`

---

## 1. 你要先准备什么

在开始前，确保你已经有：

- 一台可访问的 Gateway
- 一个可访问的 OpenClaw 实例
- 通过了 `scripts/preflight-v1-stack.sh`

---

## 2. Mac 客户端首启

首次启动前，至少设置：

```bash
export MINDANCHOR_API_BASE_URL=http://你的-gateway:3001
```

如果是开发 / 试用期快速接入，也可以用：

```bash
export MINDANCHOR_AUTH_BOOTSTRAP_MODE=login
export MINDANCHOR_AUTH_BOOTSTRAP_EMAIL=你的邮箱
export MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD=你的密码
```

然后：

```bash
corepack pnpm --filter @mindanchor/macos generate
open apps/macos/MindAnchorMac.xcodeproj
```

在 Xcode 中运行 `MindAnchorMac`。

---

## 3. 首次成功判定

成功后你应该看到：

- 菜单栏出现 `MindAnchor`
- 主窗口可进入 `Today`
- `Settings` 中能看到连接信息
- `Settings -> Support` 可以导出诊断快照

---

## 4. 连接成功后再做什么

建议按顺序执行：

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

这三步通过，说明：

- 原生客户端正常
- 状态栏路径正常
- 提醒闭环正常

---

## 5. 常见排障

### 看不到数据

优先检查：

- `MINDANCHOR_API_BASE_URL`
- Gateway 是否真的可达
- `Settings` 的 `Connection` / `Last Error`

### 收不到提醒

优先检查：

- Gateway 是否真的生成了 Inbox 消息
- OpenClaw 路由是否可用
- macOS 通知权限是否允许

### 要跨机器接续

先到 `Settings -> Support` 导出诊断快照，再把文档和快照一起带走。
