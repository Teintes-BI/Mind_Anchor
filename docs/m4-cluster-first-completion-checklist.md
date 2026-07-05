# M4 Cluster-first Business Migration Completion Checklist

## 状态

- 阶段：`M4 — Cluster-first Business Migration`
- 最后更新：`2026-03-08`
- 当前结论：`已完成（以单机 LAN + 真实 OpenClaw 常驻服务为验收目标）`

---

## 1. 这份清单的作用

这份清单专门回答一个问题：

**什么时候才能说 MindAnchor 的 M4 真正完成？**

这里的“完成”不是指：

- 已经做了几条 cluster-first 路径
- 页面上已经能看到 cluster 徽章
- 本地 compatibility runtime 看起来还不错

而是指：

- 关键业务结论已经主要由 OpenClaw cluster 产出
- Gateway 本地 heuristics 已退到“兜底”位置
- 真实外部 cluster 模式已经完成端到端验收
- 文档、测试、人工验收三者结论一致

---

## 2. M4 完成定义

只有当下面四组条件都满足时，才能把 `M4` 标记为“完成”：

### A. 业务结论迁移完成

- 关键读模型所依赖的核心业务结论，默认都由 cluster-first 路径产出
- Gateway 本地 heuristics 仅作为：
  - `stub`
  - cluster 不可用时的 fallback
  - schema 归一化兜底
- 不再出现“cluster 已配置，但关键业务页仍主要靠本地 heuristic 结果支撑”的情况

### B. 真实部署态验证完成

- 已在**真实 OpenClaw 部署态**上跑完正式 `smoke:cluster`
- 已生成至少一份真实部署态 smoke report
- 已完成对应的 Web / Agent Lab 人工验收

### C. 工程链路收口完成

- 自动测试能覆盖主要 cluster-first 读模型链路
- `smoke:web-console`
- `smoke:cluster`
- `prepare:local-cluster-ui-check`
  三条链路结论一致
- 文档、脚本、报告模板已同步，不再互相打架

### D. 退出标准可复述

- 新机器上的开发者只看文档就能回答：
  - 哪些读模型已 cluster-first
  - 哪些仍是 fallback / heuristic 主导
  - M4 还差什么
  - 下一步先做哪一刀

---

## 3. 当前已完成项

以下条目可视为 **已完成**：

### 3.1 GoalFlow / Dashboard / Recovery / Inbox / State / Reflections

- [x] `GoalFlow overview` 已复用 cluster-first 的 `DashboardSummary`
- [x] `Recovery history` 的候选任务排序与 `suggestedFocusTaskId` 已走 cluster-first
- [x] `behavior conclusion` 已走 cluster-first
- [x] `Inbox notification content` 已走 cluster-first
- [x] `state/latest` 已支持读时按需 cluster-first 刷新
- [x] `state/trends` 已支持读时按需 cluster-first 刷新
- [x] `dashboard/summary` 已支持读时按需 cluster-first 刷新
- [x] `client/inbox/overview` 已支持读时按需 cluster-first 刷新
- [x] `reflections/overview` 已支持读时按需 cluster-first 刷新

### 3.2 本地验证与工程链路

- [x] 本地 compatibility runtime 已能支撑 cluster-first 业务验收
- [x] 真实 OpenClaw dev profile 已可在当前机器本地跑通
- [x] 已完成一份基于真实 OpenClaw CLI 的本地 real-cluster smoke 报告
- [x] `smoke:web-console` 已支持 `demo-user` bootstrap + 内容检查
- [x] `prepare:local-cluster-ui-check` 已先跑 web smoke，再输出业务页就绪计数
- [x] 本地 smoke / 手工验收 / 报告回填链路已收口

### 3.3 Web / Agent Lab 可见性

- [x] Agent Lab 已能显示 cluster / provider 路径
- [x] Agent Lab 第一轮中文优先收口已完成
- [x] 业务页第一轮中文优先收口已完成

### 3.4 当前自动化验证

- [x] `@mindanchor/api` 测试通过
- [x] `@mindanchor/api` 构建通过
- [x] `@mindanchor/web` 构建通过

---

## 4. 当前剩余事项（进入 M5 后继续）

以下条目不再阻塞 `M4`，但如果后续要继续推进到更正式的部署阶段，仍建议在 `M5` 中继续完成。

### 4.1 跨机器 / 真正远端部署深化

- [x] 在真实 OpenClaw 部署态上执行正式 `smoke:cluster`
- [x] 生成一份真实部署态 smoke report
- [x] 基于真实部署态完成 Dashboard / GoalFlow / State / Recovery / Reflections / Inbox / Agent Lab 的人工验收

说明：

- 本次完成态以用户确认的部署目标为准：
  - **只有这一台机器**
  - **OpenClaw 作为独立常驻服务运行**
  - **通过非 loopback 的局域网地址暴露**
- 如果未来要升级到“另一台物理机 / NAS / 云主机上的真正远端集群”，这属于后续部署深化，不再阻塞当前 `M4` 完成判断

### 4.2 剩余 heuristic 的“主导权”清退

- [x] 明确列出哪些关键业务字段仍主要由 Gateway 本地 heuristic 产生
- [x] 决定这些字段是：
  - 继续保留在 Gateway
  - 下放到 cluster contract
  - 或删除
- [x] 对仍保留在 Gateway 的 heuristic 做“非主导”标记和文档说明

说明：

- 见 `docs/m4-cluster-first-read-model-audit.md`

### 4.3 读模型新鲜度策略显式化

- [x] 为主要 read-model 明确“何时刷新、何时复用缓存、何时 fallback”的统一规则
- [x] 明确哪些 read-model 读取时允许触发模型调用，哪些只允许读取已有结果
- [x] 把这套策略写进文档，避免后续开发时再次混乱

说明：

- 见 `docs/m4-cluster-first-read-model-audit.md`

### 4.4 文档完成态回填

- [x] 当真实部署态验证通过后，把 `docs/spec.md` 的 `M4` 状态从“已开始”更新为“已完成”
- [x] 把交接文档中的“下一步”切到 `M5` 或客户端深化，而不是继续写 `M4`

---

## 5. 当前风险点

如果未来要把“单机 LAN 部署态完成”误认为“跨机器远端部署也完成”，会有这些风险：

- 风险 1：**把本地 compatibility runtime 的成功误判成真实 cluster 的成功**
- 风险 2：**后续开发者会以为 Gateway 已经不再主导业务结论**
- 风险 3：**真实外部 cluster 一旦行为不同，当前完成判断会失真**

所以当前更准确的说法是：

**M4 已完成。**

补充说明：

- 当前完成态对应的是：`单机 + 非 loopback LAN + 真实 OpenClaw 常驻服务`
- 真正跨机器 / 云主机的远端部署，属于后续部署深化，不再阻塞 `M4`

---

## 6. 建议的收口顺序

如果要继续把部署形态从“单机 LAN”深化到“跨机器远端”，建议严格按下面顺序推进：

1. 统计仍未清退的关键 heuristic / fallback 主导点
2. 确认这些点哪些必须迁到 cluster
3. 用真实部署态 OpenClaw 跑一次正式 `smoke:cluster`
4. 基于真实部署态做完整人工验收
5. 回填 smoke report / spec / handoff
6. 在 `M5` 中继续推进正式远端部署

---

## 7. 当前一句话总结

截至 `2026-03-08`：

**M4 已完成；当前仓库已达到“核心读模型 cluster-first + 单机 LAN 真实部署态验收通过”的状态。**
