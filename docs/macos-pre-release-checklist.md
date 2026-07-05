# MindAnchor macOS 预发布检查清单

这份清单定义当前 `macOS` 候选版的实际放行门槛。

它不是“最终商店上架”标准，而是当前阶段的：

- 开发签名级
- 单用户
- 可重复回归
- 可跨机器接续

预发布标准。

---

## 1. 当前交付边界

本轮只覆盖：

- `apps/macos` 原生客户端
- `apps/api` Gateway
- Gateway → provider / OpenClaw → `desktop_local` 提醒主链路

本轮不覆盖：

- Android / iOS
- 音频 Beta
- 视频 Beta
- 健康桥接
- Apple Developer 正式签名 / 公证 / Sparkle

---

## 2. 环境检查

- [x] `xcodebuild -version` 正常
- [x] `xcodegen --version` 正常
- [x] `node -v` 为 22+
- [x] `corepack pnpm --version` 正常
- [x] Gateway 可启动
- [x] 至少已配置一个模型入口（provider 或 OpenClaw）

---

## 3. 构建门槛

- [x] `corepack pnpm --filter @mindanchor/macos generate`
- [x] `corepack pnpm --filter @mindanchor/macos build`
- [x] Xcode 可直接打开 `apps/macos/MindAnchorMac.xcodeproj`
- [x] App 能启动到主窗口和状态栏

---

## 4. 自动化回归门槛

按顺序串行执行：

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

要求：

- [x] 单测全部通过
- [x] 状态栏恢复主窗口自动验收通过
- [x] 提醒 E2E 自动验收通过

---

## 5. 产品面门槛

### Today

- [x] 能看到当前连接状态
- [x] 能看到最新状态摘要
- [x] 能看到最近活动摘要
- [x] 能看到提醒摘要

### Settings

- [x] 能看到账户状态
- [x] 能看到通知与 Accessibility 状态
- [x] 能看到设备与连接信息
- [x] 能看到本地诊断存储位置
- [x] 能导出诊断快照

### Reminders

- [x] 能看到 pending / acknowledged 列表
- [x] 能执行 snooze
- [x] 能执行 acknowledge

---

## 6. 文档门槛

- [x] `README.md` 已链接 macOS 相关文档
- [x] `docs/macos-install-and-first-run.md` 已可指导另一台 Mac 首跑
- [x] `docs/macos-mainline-runbook.md` 已覆盖主链路验收与排障
- [x] 本清单内容与实际代码行为一致

---

## 7. 当前接受的限制

以下限制当前**允许存在**：

- [x] 没有 Apple Developer 正式签名身份
- [x] 不要求真实点击系统通知横幅完成自动化
- [x] 允许通过 ad-hoc / Debug 方式完成当前 E2E
- [x] 仍然是单用户路径
- [x] 不把 Android / 音频 / 视频 / 健康纳入本轮放行

---

## 8. 当前不允许的退化

以下情况出现时，不应视为“通过”：

- [ ] `test:macos` 失败
- [ ] `test:macos:status-item` 失败
- [ ] `test:macos:reminder-e2e` 失败
- [ ] `Today` / `Settings` / `Reminders` 任何一个页面无法基本使用
- [ ] 主链路通过但没有可用 runbook / install guide

---

## 9. 放行结论

只有在以下全部满足时，当前版本才算“macOS 预发布候选版”：

- [ ] 构建通过
- [ ] 自动化回归通过
- [ ] 产品主页面可用
- [ ] 诊断导出可用
- [ ] 文档齐备

如果有一项未满足，就仍然属于“开发中版本”，而不是当前阶段的候选交付物。
