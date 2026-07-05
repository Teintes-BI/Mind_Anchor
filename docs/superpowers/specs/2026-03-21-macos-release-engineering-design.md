# MindAnchor macOS 发布工程设计

## Goal

在当前 V1 已经功能完成、测试通过的基础上，把 `apps/macos` 从“开发可验证产物”推进到“正式可分发产物”。

这里的“完成”不再指业务功能，而是指：

- 能稳定产出 `Release` 归档
- 能生成可交付的 `DMG`
- 有签名 / 公证就绪的脚本入口
- 有完整的发布 runbook 和失败排障文档

## Current State

当前已经具备：

- `macOS` 原生客户端完整功能
- `build / test / status-item / reminder-e2e` 全部通过
- `README`、安装指南、V1 检查表、runbook 已齐

当前缺失：

- 没有统一的 `Release` 归档脚本
- 没有标准化 `DMG` 产物脚本
- 没有签名 / 公证的入口和环境约定
- 没有“无证书也能先跑通 95% 发布链”的发布手册

## Problem Statement

现在这个项目“能跑、能测、能验收”，但还不等于“能交付给别人安装”。

如果没有发布工程：

1. 每次出包都要手工拼命令
2. 无法稳定复现产物结构
3. 将来接入 Apple Developer 身份时，没有统一插槽
4. 普通用户拿不到一条清晰的安装包生成路径

## Approaches

### 方案 A：先做完整发布骨架，签名/公证做可选入口（推荐）

做法：

- 先把 `archive -> app bundle -> DMG -> release summary` 整条链做完
- 没有 Apple 证书时也能生成 unsigned / ad-hoc 级候选产物
- 一旦注入证书 / notary profile，就直接复用同一脚本做正式签名和公证

优点：

- 最贴合当前现实约束
- 不阻塞今天继续交付
- 对未来正式发版最友好

缺点：

- 严格意义上的“Apple 最终发布”还要等证书

### 方案 B：等 Apple 证书后再做发布工程

优点：

- 可以一步到位做最终态

缺点：

- 现在仓库里依旧没有发布骨架
- 会把“完成”过度绑定到外部凭证

### 方案 C：只做文档，不做脚本

优点：

- 快

缺点：

- 没有可重复性
- 风险最大

## Chosen Direction

选择 **方案 A**。

原因：

- 它允许项目在没有 Apple 正式身份的前提下继续向真正交付靠近
- 它把未来签名 / 公证需要的环境变量、脚本插口、失败路径都提前固定下来

## Scope

本轮只做 `macOS` 发布工程，不扩产品功能。

### 包含

- Release 归档脚本
- DMG 打包脚本
- 发布产物目录结构
- 可选签名 / 公证参数位
- 发布 runbook
- 发布检查表升级

### 不包含

- Sparkle 自动更新
- App Store / Setapp 接入
- 正式 Apple Developer 凭证采购与管理
- 多平台统一发布

## Delivery Shape

本轮交付物固定为：

1. `scripts/build-macos-release.sh`
2. `scripts/test-macos-release-scripts.sh`
3. 一个统一的 `dist/macos-release/` 产物结构
4. `docs/macos-release-runbook.md`
5. `README.md` / 发布检查表中的链接与命令更新

## Release Pipeline

标准流程固定为：

1. 生成 Xcode 工程
2. 以 `Release` 配置做 `archive`
3. 从 `.xcarchive` 提取 `.app`
4. 生成 `DMG`
5. 写出发布摘要
6. 如果提供签名 / 公证参数，则执行签名与 notarization

## Signing Model

### 默认模式

如果没有签名凭证：

- 仍然允许生成 `unsigned release candidate`
- 产物用于本地交付、验收和干净机安装测试

### 正式模式

如果提供以下参数：

- `MINDANCHOR_MACOS_SIGNING_IDENTITY`
- `MINDANCHOR_MACOS_NOTARY_PROFILE`

则脚本进入：

- 签名
- notarization
- staple

流程。

## Success Criteria

本轮完成后，应满足：

1. 一条命令可以产出 `Release` 归档与 `DMG`
2. 产物结构固定且可文档化
3. 没有 Apple 证书时，仍能完成 unsigned 候选产物链路
4. 有 Apple 证书时，不需要重写脚本，只需补环境变量
5. 发布 runbook 足够让另一台机器继续出包
