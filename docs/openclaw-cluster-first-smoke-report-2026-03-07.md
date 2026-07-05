# OpenClaw Cluster First Smoke Report（2026-03-07 样例）

> 当前状态：**尚未执行真实外部 cluster 联调**。  
> 这份文件是“第一次真实 OpenClaw cluster 端到端 smoke” 的**可直接填写样例**。  
> 建议真正执行时复制为新的日期文件，例如：
>
> - `docs/openclaw-cluster-first-smoke-report-2026-03-08.md`
> - `docs/openclaw-cluster-first-smoke-report-2026-03-15.md`

---

## 1. 基本信息

- 执行日期：
- 执行人：
- 机器：
- Gateway 仓库版本：
- Cluster 仓库版本 / 镜像版本：
- 执行目标：
  - [ ] 首次真实 cluster 联调
  - [ ] 更换 cluster 部署后回归
  - [ ] 更换 provider fallback 后回归
  - [ ] 更换 Gateway 版本后回归

## 2. 环境配置快照

> 注意：不要在这份文档里明写真实密钥。

- `MINDANCHOR_API_URL`：
- `MINDANCHOR_OPENCLAW_BASE_URL`：
- `MINDANCHOR_AGENT_MODE`：
- provider fallback 是否已配置：是 / 否
- `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 是否已配置：是 / 否
- `MINDANCHOR_DEFAULT_MODEL_NAME`：

## 3. 执行入口

### 3.1 直连 cluster smoke

执行命令：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 \
MINDANCHOR_OPENCLAW_BASE_URL=http://your-openclaw-host:8787 \
bash scripts/smoke-openclaw-cluster.sh
```

脚本结果：

- [ ] 通过
- [ ] 部分通过
- [ ] 不通过

### 3.2 关键手工检查

- [ ] `GET /health`
- [ ] `GET /debug/openclaw/adapter`
- [ ] `GET /debug/model-probe/chief-agent`
- [ ] Agent Lab → `Probe chief-agent`
- [ ] Agent Lab → `state-insight-agent` debug

## 4. 直连 cluster 合同结果

| Endpoint | HTTP Status | `success` | `parsed/outputText` | 结果 |
| --- | --- | --- | --- | --- |
| `/v1/tasks/execute` |  |  |  |  |
| `/tasks/execute` |  |  |  |  |
| `/api/tasks/execute` |  |  |  |  |

补充记录：

- 实际命中的 canonical endpoint：
- 返回的 cluster `traceId`：
- 返回的 `taskId`：
- 返回的 `metadata.runtime`：
- 返回的 `metadata.worker`：

## 5. Gateway cluster-preferred 结果

### `/health`

- HTTP Status：
- `mode`：
- `openClawBaseUrl`：
- 结果：通过 / 不通过

### `/debug/openclaw/adapter`

- HTTP Status：
- `clusterEnabled`：
- `executionStrategy`：
- `lastDecision.route`：
- `lastDecision.selectedEndpoint`：
- `lastFallback.fallbackReason`：
- `recentTimeline` 条数：
- 结果：通过 / 不通过

### `/debug/model-probe/chief-agent`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `adapter.fallbackReason`：
- `traceId`：
- 结果：通过 / 不通过

### `POST /debug/scenarios/focus-recovery-loop/seed`

- HTTP Status：
- `scenarioId`：
- `userId`：
- 结果：通过 / 不通过

### `/debug/agent/state-insight`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/interruption-recovery`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/reflection`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

## 6. Agent Lab 页面结果

- Agent Lab 页面可打开：是 / 否
- adapter 状态卡显示正常：是 / 否
- `Probe chief-agent` 路由结果：
  - [ ] `cluster`
  - [ ] `provider-fallback`
  - [ ] `provider-direct`
  - [ ] `failed`
- `state-insight-agent` debug 路由结果：
  - [ ] `cluster`
  - [ ] `provider-fallback`
  - [ ] `provider-direct`
  - [ ] `failed`
- `interruption-recovery-agent` debug 路由结果：
  - [ ] `cluster`
  - [ ] `provider-fallback`
  - [ ] `provider-direct`
  - [ ] `failed`
- `reflection-coach-agent` debug 路由结果：
  - [ ] `cluster`
  - [ ] `provider-fallback`
  - [ ] `provider-direct`
  - [ ] `failed`
- Trace Inspector 可打开对应 trace：是 / 否

## 7. 页面人工验收

### 7.1 Dashboard

- 顶部 `Workspace shortcuts` 是否显示完整：是 / 否
- `Latest state` 卡是否可读：是 / 否
- `Behavior conclusion` 卡是否可读：是 / 否
- `Open Recovery page` 跳转是否正常：是 / 否

### 7.2 GoalFlow

- Goal 列表是否正常显示：是 / 否
- Task 列表是否正常显示：是 / 否
- `suggested focus` 标签是否出现：是 / 否
- Focus session 区域是否正常：是 / 否

### 7.3 State / Recovery / Reflections / Inbox

- `State Trends` 页面当前评估 + 趋势列表是否可读：是 / 否
- `Recovery` 页面恢复计划与中断列表是否可读：是 / 否
- `Reflections` 页面周报/月报是否可读：是 / 否
- `Inbox` 页面消息队列与渠道统计是否可读：是 / 否

### 7.4 Agent Lab 人工观察

- `Resolved agent configs` 卡片无长文本溢出：是 / 否
- `OpenClaw adapter` 卡片显示的 `strategy / route` 是否符合预期：是 / 否
- `Prefix / Base URL / endpoint` 文本无卡片溢出：是 / 否
- 长列表滚动和 code block 是否可读：是 / 否

## 8. 关键 trace / 输出留痕

- 关键 `traceId`：
  - cluster probe：
  - chief-agent probe：
  - scenario seed trace：
  - state-insight debug：
  - interruption-recovery debug：
  - reflection debug：
- 已保存的输出位置：
  - adapter JSON 快照：
  - cluster 原始返回：
  - Agent Lab 截图：

## 9. 综合结论

- 直连 cluster 合同：通过 / 部分通过 / 不通过
- Gateway cluster-preferred：通过 / 部分通过 / 不通过
- Web / Agent Lab：通过 / 部分通过 / 不通过
- 综合判定：通过 / 部分通过 / 不通过

## 10. 问题记录

1.
2.
3.

## 11. 后续动作

1.
2.
3.

---

配套文档：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/openclaw-cluster-smoke-report-template.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`
