# MindAnchor macOS `OpenClaw Registry` 真实 GUI 验收记录

日期：`2026-03-23`

## 验收目标

验证 `apps/macos` 中新增的 `Settings -> OpenClaw Registry` 面板已经真正接上：

- Gateway `GET /debug/openclaw/registry-visibility`
- native persona registry
- external OpenClaw runtime `/health` 对照结果

并确认这些信息不是只停留在测试接口或单元测试里，而是已经真实显示在 macOS GUI 中。

## 验收环境

- 本地 OpenClaw runtime：`http://127.0.0.1:8788`
- 临时 Gateway：`http://127.0.0.1:3011`
- Gateway 模式：`openai-compatible`
- Gateway `MINDANCHOR_OPENCLAW_BASE_URL`：`http://127.0.0.1:8788`
- Mac App：`apps/macos/.derived-data/registry-gui-acceptance/Build/Products/Debug/MindAnchorMac.app`
- 独立登录账号：`registry-gui@example.com`
- 独立会话存储：`mindanchor-auth-session-registry-gui`

## 验收方法

1. 启动本地 OpenClaw runtime
2. 启动独立 Gateway，并确认：
   - `/health` 返回 `mode=openai-compatible`
   - `/debug/openclaw/registry-visibility` 返回：
     - `configured=true`
     - `reachable=true`
     - `matchedAgentIds` 包含 6 个 persona agents
3. 用独立 auth session account 启动 Mac App
4. 用系统快捷键 `⌘,` 打开 `Settings`
5. 通过 macOS Accessibility 实际读取 `Settings` 窗口可见文本，确认 `OpenClaw Registry` 面板内容

## 实际 GUI 观测结果

在真实 `Settings` 窗口中，成功观测到以下文本：

- `Email`
- `registry-gui@example.com`
- `API Base URL`
- `http://127.0.0.1:3011`
- `本地 persona 数量`
- `6`
- `外部实例已配置`
- `推荐`
- `外部实例可达`
- `推荐`
- `OpenClaw Base URL`
- `http://127.0.0.1:8788`
- `已对齐 persona`
- `6`
- `外部缺失 persona`
- `无`
- `外部额外 agents`
- `chief-agent, state-insight-agent, task-management-agent, progress-feedback-agent, interruption-recovery-agent, reflection-coach-agent, automation-agent, conversation-coach-fast-agent, conversation-coach-agent`

## 结论

本轮验收通过。

已确认：

- Mac 客户端真实 GUI 中已经出现 `OpenClaw Registry` 面板
- 面板显示的数据来自真实 Gateway / OpenClaw 对照结果
- native persona 数量显示为 `6`
- external runtime 已配置且可达
- matched persona 数量显示为 `6`
- missing persona 显示为 `无`
- external runtime 额外 workflow agents 会正确显示在 `外部额外 agents`

## 后续增强复验

同日继续复验了增强后的运维视图文案，真实 GUI 中额外观测到：

- `OpenClaw Registry 已对齐`
- `外部实例 openclaw-local-cluster · structured-local-runtime-phase1 已可达，6 个 persona 已对齐，另有 9 个额外 workflow agents。`
- `openclaw-local-cluster · structured-local-runtime-phase1`

这说明新的 registry health callout 也已真正进入 GUI，而不是只停留在 ViewModel 或单元测试层。

## 当前意义

这意味着现在用户可以直接在 Mac 客户端里判断：

- 当前是不是连到了一个真正可达的 OpenClaw runtime
- 外部实例是否已经对齐了 persona registry
- 外部实例里还额外暴露了哪些 workflow / system agents

不再需要手动打 debug API 才能判断 registry 对齐状态。

## 2026-03-23 第二轮自动化补验

同日继续补做了更强的真实 GUI / 系统通知链路自动验收，新增内容包括：

- Mac 自动化桥新增了专用的 `refresh_openclaw_registry` 动作
- 新增专用脚本：`scripts/run-macos-openclaw-registry-e2e.mjs`
- 脚本会真实执行：
  - 启动本地可达的 fake OpenClaw runtime
  - 启动 Gateway 与原生 Mac App
  - 验证 `Today` 页进入 `OpenClaw Registry 已对齐`
  - 关闭 runtime 制造真实不可达
  - 验证客户端进入 `OpenClaw Registry 不可达`
  - 等待本地系统通知并尝试真实点击

### 本轮自动化实测结果

已稳定通过：

- `Today` 页真实进入 `OpenClaw Registry 已对齐`
- 关闭 runtime 后，客户端真实进入 `OpenClaw Registry 不可达`
- 本地通知请求 id 已进入客户端系统通知检查器

当前仍未通过：

- **“真实 macOS 通知中心里找到该条告警并自动点击”** 这一步，在本机上仍未稳定通过

### 当前 blocker 证据

- 自动化脚本两次实跑都稳定进入：
  - `Today 已对齐`
  - `danger` 状态
  - operational alert request id 已创建
- 但通知中心 Accessibility dump 当前只能看到系统 widget 窗口：
  - `天气预报`
  - `月`
- 尚未在可访问层级里读到 MindAnchor 的那条告警通知，因此自动点击步骤超时

### 结论更新

截至本次记录，可以确认：

- **产品代码主链已经接通**：
  - `Today` 轻量 registry health
  - outage operational alert 触发
  - 点击通知后的 App 内路由目标仍保持为 `Settings`
- **未完成的是本机通知中心 UI 自动化层**，不是 Gateway / AppViewModel / ReminderCenter 主链未接通

因此这部分当前应视为：

- 代码主线：已到位
- 真机系统通知点击自动化：仍需继续攻克本机 Notification Center 的可访问性 / 展示层差异
