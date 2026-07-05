# MindAnchor macOS V1 发布检查表

这是 V1 层级的发布检查表。

它高于 `macOS 预发布检查清单`，因为这里额外要求：

- Web 控制台可构建
- guided install 文档齐
- 服务器预检脚本可跑

---

## 1. API / OpenClaw

- [x] `corepack pnpm --filter @mindanchor/api test`
- [x] `corepack pnpm test:core-phases:local`
- [x] `bash scripts/preflight-v1-stack.sh --gateway-url ... --openclaw-url ...`

---

## 2. Web

- [x] `corepack pnpm --filter @mindanchor/web exec vitest run`
- [x] `corepack pnpm --filter @mindanchor/web build`
- [x] Dashboard 可打开
- [x] Inbox 可打开

---

## 3. macOS

- [x] `corepack pnpm check:macos:signing`
- [x] `corepack pnpm test:macos:release`
- [x] `corepack pnpm release:macos`
- [x] `corepack pnpm --filter @mindanchor/macos build`
- [x] `corepack pnpm --filter @mindanchor/macos test`
- [x] `corepack pnpm test:macos:status-item`
- [x] `corepack pnpm test:macos:reminder-e2e`

---

## 4. 产品体验

- [x] 登录可用
- [x] 设备注册可用
- [x] 桌面活动信号可上传
- [x] 提醒可抵达客户端
- [x] Settings 可导出诊断快照
- [x] Web 和 Mac 都能查看状态 / 复盘 / 收件箱

---

## 5. 文档

- [x] `docs/gateway-openclaw-guided-install.md`
- [x] `docs/macos-v1-install-guide.md`
- [x] `docs/macos-mainline-runbook.md`
- [x] `docs/macos-v1-release-checklist.md`
- [x] `docs/macos-release-runbook.md`
- [x] `docs/macos-apple-signing-final-steps.md`

---

## 6. 当前仍接受的限制

- [x] 仍然是单用户
- [x] 仍然不含 Android / iOS / 音频 / 视频 / 健康正式发布
- [x] 仍然不要求 Apple 正式签名 / 公证
- [x] 仍然不要求真实点击系统通知横幅完成自动化
