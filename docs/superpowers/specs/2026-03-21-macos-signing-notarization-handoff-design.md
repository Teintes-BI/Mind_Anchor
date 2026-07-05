# MindAnchor macOS 签名与公证交接设计

## Goal

把当前项目从“发布工程已完成，但仍缺外部 Apple 凭证”推进到：

- 仓库内所有可准备项都已准备好
- 用户只需注入 Apple Developer 外部凭证
- 就能按文档完成签名与 notarization

## Current State

当前已经具备：

- `archive -> .app -> .dmg -> release-summary.json`
- 可执行的 `Release candidate` 脚本
- 发布 runbook

当前缺失：

- 一个专门检查 Apple 签名/公证前置条件的脚本
- 一页最终外部操作单，告诉用户如何把证书/团队 ID/notary profile 接到现有脚本

## Chosen Direction

本轮只做两件事：

1. `signing preflight script`
2. `Apple signing/notarization final steps doc`

不改业务功能，不重写发布脚本。

## Success Criteria

完成后应满足：

1. 仓库内可以运行一个签名预检脚本
2. 脚本能明确告诉用户缺了哪项 Apple 外部前置条件
3. 文档能把“生成证书 -> 设置环境变量 -> 调发布脚本”讲清楚
4. 相关入口已挂到 README / runbook / checklist
