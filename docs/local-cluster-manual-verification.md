# Local Cluster Manual Verification

这份文档用于在**本地最小 OpenClaw 兼容服务**已经启动后，逐页做人工验收。

适用前提：

- `pnpm dev:openclaw`
- `MINDANCHOR_AGENT_MODE=openai-compatible`
- `MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787`
- `pnpm dev:api`
- `pnpm dev:web`

如果想先自动准备数据，再开始人工验收，可运行：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 \
MINDANCHOR_WEB_URL=http://127.0.0.1:5173 \
bash scripts/prepare-local-cluster-manual-check.sh
```

这个脚本会：

- 检查 cluster-preferred 是否已生效
- 为业务页面默认使用的 `demo-user` 写入本地人工验收数据
- seed `focus-recovery-loop`
- 先跑一轮 `smoke-web-console`，确认关键读模型已经有内容
- 打印要打开的页面 URL
- 把本次人工验收准备快照追加到当前 cluster smoke report

如果想一键启动本地 cluster + API + Web：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm dev:local-cluster-stack
```

---

## 1. Agent Lab

打开：

- `http://127.0.0.1:5173/agents`

### 重点检查

- `OpenClaw adapter` 卡
  - `strategy · cluster-preferred`
  - `OpenClaw base URL` 不再是 `not configured`
  - recent timeline 至少有一条 `route · cluster`

- `Resolved agent configs`
  - 长前缀不再把卡片撑破
  - Base URL 不再溢出卡片边界

- `Chief routing`
  - `Probe chief-agent` 成功
  - route badge 显示 `cluster`

- 单 agent 调试
  - `state-insight-agent`
  - `interruption-recovery-agent`
  - `reflection-coach-agent`
  - `task-management-agent`
  - `progress-feedback-agent`
  - `automation-agent`
  都至少运行一次，并确认：
  - 返回 `success`
  - route badge 显示 `cluster`
  - JSON 内容有业务语义，不是空对象

---

## 2. Recovery

打开：

- `http://127.0.0.1:5173/recovery`

### 重点检查

- `Latest recovery plan` 是否有内容
- `Generate plan` 区域是否可见且按钮可点
- `Recent interruptions` 是否有列表项
- `Resume candidates` 是否正常列出任务

### 预期

- 页面不是空白
- 有恢复计划文字
- 能看出当前本地 cluster 已经产出恢复建议
- `prepare-local-cluster-manual-check.sh` 的输出里，`Recovery plans` 与 `Inbox messages` 都应大于 `0`

---

## 3. Reflections

打开：

- `http://127.0.0.1:5173/reflections`

### 重点检查

- `Latest weekly report`
- `Latest monthly report`
- `Highlights / Blockers / Trends / Next suggestions`

### 预期

- 周报月报都能看到
- 文本不应是空数组全空白
- 内容应该和当前项目阶段相关，例如：
  - Gateway / Web console / cluster smoke / blocked task / next suggestion
- `prepare-local-cluster-manual-check.sh` 的输出里，`Reflection reports` 应大于 `0`

---

## 4. GoalFlow

打开：

- `http://127.0.0.1:5173/tasks`

### 重点检查

- Goal 列表
- Task 列表
- `suggested focus` 标签
- `Focus session` 区域
- Recovery plan 卡片

### 预期

- 至少一个 goal / 多个 task
- `suggested focus` 能看到
- `Open Recovery workspace` 跳转正常

---

## 5. State Trends

打开：

- `http://127.0.0.1:5173/state`

### 重点检查

- `Current assessment`
- `Latest behavior conclusion`
- 多模态趋势列表

### 预期

- `Current assessment` 有具体分数和摘要
- 应能看到与音频 / 视频 / 健康相关的摘要
- `prepare-local-cluster-manual-check.sh` 的输出里，`State assessments` 应大于 `0`

---

## 6. Inbox

打开：

- `http://127.0.0.1:5173/inbox`

### 重点检查

- `Latest behavior conclusion` 区域
- `Channel distribution`
- pending / acknowledged 分组

### 预期

- 有 pending 或 acknowledged 消息
- 渠道统计有内容
- `prepare-local-cluster-manual-check.sh` 的输出里，`Inbox messages` 应大于 `0`

---

## 7. 建议记录方式

人工验收时建议同步记录到：

- `docs/openclaw-cluster-smoke-report-local-2026-03-07.md`
- 或新生成的日期报告文件

建议把每个页面记成：

- 通过
- 部分通过
- 不通过
- 截图位置
- 发现的问题
