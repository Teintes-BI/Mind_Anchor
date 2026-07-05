# MindAnchor macOS Apple 签名 / 公证最终操作单

这份文档只处理最后一个**仓库外**步骤：

- Apple Developer 账号与证书
- 本机 keychain 中的签名身份
- notarytool profile

当这些准备好之后，仓库内的发布脚本已经可以直接复用。

---

## 1. 你还缺什么

如果你已经完成仓库内发布工程，但还没有 Apple 凭证，那么现在缺的是：

1. `Developer ID Application` 签名证书
2. Apple Team ID
3. `notarytool` 可用的 keychain profile

先跑：

```bash
corepack pnpm check:macos:signing
```

它会直接告诉你本机还少哪项。

---

## 2. 需要配置的环境变量

当前发布脚本读取这三个变量：

```bash
export MINDANCHOR_MACOS_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export MINDANCHOR_MACOS_TEAM_ID="TEAMID"
export MINDANCHOR_MACOS_NOTARY_PROFILE="mindanchor-notary"
```

然后可以先做严格预检：

```bash
bash scripts/check-macos-signing-prereqs.sh --strict
```

通过后再发版：

```bash
corepack pnpm release:macos
```

---

## 3. 证书侧准备清单

至少需要：

- Apple Developer Program 有效成员资格
- `Developer ID Application` 证书已导入本机登录钥匙串
- 证书对应私钥存在

本机快速查看代码签名身份：

```bash
security find-identity -v -p codesigning
```

找到你的 `Developer ID Application` 后，把完整名称填进：

```bash
MINDANCHOR_MACOS_SIGNING_IDENTITY
```

---

## 4. notary profile 准备

你需要先在本机保存一个 `notarytool` profile。

示意流程：

```bash
xcrun notarytool store-credentials "mindanchor-notary" \
  --apple-id "your-apple-id@example.com" \
  --team-id "TEAMID" \
  --password "app-specific-password"
```

保存成功后，把 profile 名写到：

```bash
export MINDANCHOR_MACOS_NOTARY_PROFILE="mindanchor-notary"
```

---

## 5. 最终执行顺序

建议固定按这个顺序：

```bash
corepack pnpm check:macos:signing
bash scripts/check-macos-signing-prereqs.sh --strict
corepack pnpm test:macos:release
corepack pnpm release:macos
```

---

## 6. 成功后你应该得到什么

成功后应至少得到：

- `.xcarchive`
- `.app`
- `.dmg`
- `release-summary.json`

并且 `release-summary.json` 中应看到：

- `"signed": true`
- `"notarized": true`

---

## 7. 如果失败先看哪里

### 签名失败

优先看：

- `MINDANCHOR_MACOS_SIGNING_IDENTITY` 是否与本机钥匙串完全一致
- 私钥是否真的存在

### notarization 失败

优先看：

- `MINDANCHOR_MACOS_NOTARY_PROFILE`
- Team ID 是否正确
- Apple 凭证是否可用

### 只想继续 unsigned 候选包

那就不要设置上述三个变量，继续执行：

```bash
corepack pnpm release:macos
```

这仍然会生成可验收的 unsigned candidate。
