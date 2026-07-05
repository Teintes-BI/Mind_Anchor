# MindAnchor V1 完工报告（2026-03-21）

## 结论

截至 `2026-03-21`，按已确认的单用户 V1 范围，MindAnchor 已完成。

这里的“完成”包括：

- Gateway / OpenClaw 主链
- Web 控制台
- macOS 原生客户端
- macOS 发布工程
- 自部署与排障文档

## Fresh Verification

本次完工确认基于以下 fresh 验证：

### API / OpenClaw

- `corepack pnpm --filter @mindanchor/api test`
- `corepack pnpm test:core-phases:local`
- `bash scripts/preflight-v1-stack.sh --gateway-url ... --openclaw-url ...`

### Web

- `corepack pnpm --filter @mindanchor/web exec vitest run`
- `corepack pnpm --filter @mindanchor/web build`
- `bash scripts/smoke-web-console.sh`

### macOS

- `corepack pnpm --filter @mindanchor/macos build`
- `corepack pnpm --filter @mindanchor/macos test`
- `corepack pnpm test:macos:status-item`
- `corepack pnpm test:macos:reminder-e2e`
- `corepack pnpm test:macos:release`
- `corepack pnpm release:macos`
- `corepack pnpm check:macos:signing`

## 关键交付物

### 产品

- 原生 macOS 客户端
- Gateway API
- OpenClaw 集群接入路径
- Web 控制台

### 发布工程

- `scripts/build-macos-release.sh`
- `scripts/test-macos-release-scripts.sh`
- `scripts/check-macos-signing-prereqs.sh`
- `dist/macos-release/MindAnchorMac.xcarchive`
- `dist/macos-release/MindAnchorMac-0.1.0+1.dmg`
- `dist/macos-release/release-summary.json`

### 文档

- `docs/gateway-openclaw-guided-install.md`
- `docs/macos-v1-install-guide.md`
- `docs/macos-mainline-runbook.md`
- `docs/macos-release-runbook.md`
- `docs/macos-apple-signing-final-steps.md`
- `docs/macos-v1-release-checklist.md`

## 当前接受的边界

以下仍然不是 V1 阻塞项：

- Android / iOS 正式版
- 音频 / 视频 / 健康正式发布
- Apple 正式签名 / notarization 的外部凭证本身
- 真实点击系统通知横幅的黑盒自动化

## 唯一剩余的外部事项

仓库内工作已经完成。

如果要把 unsigned release candidate 进一步变成 Apple 正式签名 / 公证产物，唯一还需要的是：

- `Developer ID Application` 签名身份
- Apple Team ID
- `notarytool` keychain profile

对应操作单：

- `docs/macos-apple-signing-final-steps.md`
