# Comma V0.1-B Single Brain Runbook

## 离线启动

```powershell
$env:MINDANCHOR_AGENT_MODE = "stub"
corepack pnpm --filter @mindanchor/api dev
```

Stub adapter 不访问网络，适合本地开发和回归测试。

## 数据边界

- `cloud_allowed` 使用云端安全投影；Life Compass 会被省略并记录 `P3_life_compass_omitted`。
- `local_only` 只能交给本地 adapter；没有本地模型时请求被阻断。
- Context Packet 只包含 allowlist 事件摘要、当前 State、最近 6 条聊天记录和本轮消息，并受 24,000 字符预算约束。

## 故障处理

用户消息总是在模型调用前落库。模型不可用、返回格式错误或 provider 异常时，用户消息保留，assistant 生成 terminal `failed` 消息；隐私边界不允许时生成 `blocked` 消息。新的尝试必须使用新的 `clientMessageId`，同一幂等键只重放原结果。

## 隐私与审计

System trace 只保存 decision/trace ID、context hash、数据边界、模型层级、状态、redactions 和安全 adapter decision；不保存 raw prompt、system prompt、route、agent 名、endpoint、token 或原始模型响应。撤销 `conversation/chat_input` P1 permission 后，发送会被拒绝。

Profile export 包含 `conversations` 与 `conversationMessages`，不包含 prompt/route/agent。删除 conversation 只删除该 session；删除 profile 通过 FK cascade 清除聊天数据，不影响 legacy JSON Store。

## 临时 SQLite replay

复制导出的 SQLite 到临时文件后以只读方式运行 API 回归，确认 message 顺序按 `created_at, id` 排序、trace 数量与消息轮次一致；不要把 API key 写入日志或 export。

## 验收命令

```powershell
corepack pnpm --filter @mindanchor/domain build
corepack pnpm --filter @mindanchor/api build
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/web test
corepack pnpm --filter @mindanchor/web build
```
