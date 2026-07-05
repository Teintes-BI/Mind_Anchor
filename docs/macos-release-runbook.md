# MindAnchor macOS 发布工程运行手册

这份手册描述当前 `MindAnchorMac` 的正式发布工程。

它覆盖两种模式：

- **Unsigned release candidate**：没有 Apple Developer 凭证时也能完成
- **Signed / notarized release**：注入签名与 notary 参数后的正式发布模式

配套文档：

- 最后一跳 Apple 凭证接入：`docs/macos-apple-signing-final-steps.md`

---

## 1. 当前目标

当前发布链固定为：

`xcodegen -> xcodebuild archive -> 提取 .app -> 生成 .dmg -> 写 summary`

如果存在签名 / 公证参数，则继续：

`codesign -> notarytool submit -> stapler`

---

## 2. 关键命令

### 2.1 发布脚本回归

```bash
corepack pnpm test:macos:release
```

它检查：

- 发布脚本存在且可执行
- `--help` 正常
- `--dry-run` 能输出 archive / dmg 计划

### 2.1.1 Apple 签名预检

```bash
corepack pnpm check:macos:signing
```

严格模式：

```bash
bash scripts/check-macos-signing-prereqs.sh --strict
```

### 2.2 生成 unsigned candidate

```bash
corepack pnpm release:macos
```

默认输出目录：

```bash
dist/macos-release
```

也可以手动指定：

```bash
bash scripts/build-macos-release.sh --output-dir dist/macos-release-candidate
```

### 2.3 常用覆盖参数

```bash
bash scripts/build-macos-release.sh \
  --output-dir dist/macos-release-candidate \
  --api-base-url https://api.example.com \
  --version 0.1.0 \
  --build-number 42
```

---

## 3. 产物结构

发布完成后你应看到：

- `dist/macos-release*/MindAnchorMac.xcarchive`
- `dist/macos-release*/staging/MindAnchorMac.app`
- `dist/macos-release*/MindAnchorMac-<version>+<build>.dmg`
- `dist/macos-release*/release-summary.json`

其中：

- `.xcarchive` 用于追溯和后续签名/公证
- `.app` 是提取出的应用包
- `.dmg` 是交付候选产物
- `release-summary.json` 是机器可读摘要

---

## 4. 签名 / 公证参数

如果你已经有 Apple Developer 身份，可以通过环境变量进入正式模式：

```bash
export MINDANCHOR_MACOS_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export MINDANCHOR_MACOS_TEAM_ID="TEAMID"
export MINDANCHOR_MACOS_NOTARY_PROFILE="mindanchor-notary"
```

然后执行：

```bash
corepack pnpm check:macos:signing
corepack pnpm release:macos
```

当前脚本会：

1. 用 `codesign` 对提取出的 `.app` 重新签名
2. 用 `xcrun notarytool submit --wait` 提交 `DMG`
3. 用 `xcrun stapler staple` 回贴票据

---

## 5. 没有 Apple 凭证时

如果你还没有 Apple Developer 身份，当前也可以正常推进：

- 继续生成 unsigned candidate
- 在干净机做安装测试
- 验证归档、产物结构和文档

这意味着你已经完成了 **95% 发布工程**；
真正剩下的是苹果侧凭证注入，而不是再写一套新流程。

---

## 6. 推荐发布前检查顺序

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm test:core-phases:local
corepack pnpm --filter @mindanchor/web exec vitest run
corepack pnpm --filter @mindanchor/web build
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
corepack pnpm test:macos:release
corepack pnpm release:macos
```

---

## 7. 常见失败点

### 7.1 `xcodegen` 失败

优先看：

- `apps/macos/project.yml`
- 本机 Xcode / XcodeGen 是否可用

### 7.2 `archive` 失败

优先看：

- `Release.xcconfig`
- 是否传了错误的 build setting 覆盖
- 是否误带了不合法签名参数

### 7.3 `DMG` 失败

优先看：

- 输出目录权限
- `hdiutil` 是否可用
- staging 目录是否真的存在 `.app`

### 7.4 notarization 失败

优先看：

- `MINDANCHOR_MACOS_NOTARY_PROFILE`
- 签名身份是否为 `Developer ID Application`
- `.app` 是否先被正确签名

---

## 8. 当前结论

当前仓库已经具备：

- 完整 V1 功能
- 完整 V1 验收
- 一条可跑的 macOS 发布工程

如果你已经准备好 Apple 凭证，下一步就是把这条链切到签名 / 公证正式模式。
