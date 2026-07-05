# MindAnchor 当前项目树形状态（滚动更新，最近更新：2026-03-24）

这份文档的目标很简单：

- 用简单直白的话讲清楚，我们目前到底做过什么。
- 把每个模块的作用、现在的进展、还缺什么，重新整理清楚。
- 避免后面继续开发时又跑偏。

---

## 0. 当前判断（2026-03-24）

先直接回答现在最关键的问题：

- **当前方向没有跑偏。**
- **按现在这条主线继续做，理论上仍然能达到你最开始要求的“成熟、完整、可商用”标准。**
- **但当前完成度还远没到可以宣称达标。**

更直白一点：

- `apps/macos -> apps/api -> openclaw` 这条主线仍然是对的
- 当前最明显的短板已经不再是“产品形态错了”
- 而是“最后几道真正影响交付的硬门槛还没收掉”

当前最关键的未收口项，已经很明确：

1. **macOS 首次通知授权还没稳定自动化**
   - 现在已经确认真实 blocker 是 `SecurityAgent`
   - 这不是普通页面逻辑问题，而是系统级首启门槛

2. **E2E 机器准备链还没有彻底产品化**
   - 虽然已经补了稳定 bundle 和通知 profile 生成器
   - 但“如何安装、如何移除、如何纳入 clean-machine 彩排”还没正式收口

3. **商用交付最后一段还没有进入硬验收**
   - 包括：
     - clean-machine 真彩排
     - 外部 OpenClaw 真连接
     - 首次登录 / bootstrap / notification / conversation 全链
     - 正式签名 / 公证恢复

4. **“OpenClaw 是真正主脑”这件事还没有走到最终封板**
   - 现在已经有：
     - registry visibility
     - contract drift 检查
     - conversation / memory / debug trace 主链
   - 但还没有把下面这几件事收成最后一轮正式交付门槛：
     - 用户可见主要回复默认来自 OpenClaw
     - persona / memory / authority 的来源对用户和排障都可解释
     - clean-machine 上第一次接入外部 OpenClaw 仍可稳定跑通

5. **macOS 系统权限这段，还没有明确写成“产品接受边界”**
   - 现在已经确认：
     - 有些 host 上可以把系统设置定位到目标 bundle
     - 但不代表一定能稳定自动点击到具体开关
   - 如果这件事不写成正式边界，后面就容易继续误把
     - “无法全自动点击系统设置开关”
     - 当成“产品还不成熟”
  - 对商用产品来说，更合理的标准应该是：
    - 权限页说明清楚
    - 恢复链条完整
    - 用户能顺利完成最后一步
    - 失败时系统能给出明确诊断与恢复路径

6. **`real` 质量门槛还没有完全收成“可持续执行”的正式门槛**
   - 这一轮已经确认：
     - `cluster-preferred real` 可以正式通过
     - `provider-direct debugs`
     - `provider-direct business-core`
     - `provider-direct business-web-dashboard`
     - `provider-direct business-web-state`
       也都已经能独立通过并留档
   - 但还没有完成：
     - `business-web-goalflow`
     - `business-web-recovery`
     - `business-web-reflections`
     - `business-web-inbox`
       四条真实留档
   - 同时也还没把：
     - 长跑超时后的资源清理
     - 多轮运行之间的端口 / 进程隔离
       收成正式 runner 能力
   - 这件事不收掉的话：
     - 方向仍然是对的
     - 但质量门槛会停在“工程师能推进”
     - 还不到“团队长期稳定执行”的层级

再加上今天已经复核过的三条宿主真相：

- `notificationLiveState=denied`
- `deliveryGateStatus=manual_step_pending`
- `notificationSettingsAutomationBoundary=manual_recommended`

这三条一起说明的不是“方向错了”，而是：

- 当前机器已经从“纯工程调试态”
- 进入了“可以支持交付，但还没完成最后一个系统权限动作”的状态
- 所以后续不能再把重点放在继续猜系统设置页面
- 而要把：
  - 真恢复成功记录
  - clean-machine 彩排
  - 外部 OpenClaw 真主脑彩排
  继续收成正式阶段任务

所以现在的结论不是“要不要改方向”。

现在真正的结论是：

- **方向可达标**
- **计划还要继续补硬任务**
- **否则会停在“工程上很强、产品上接近完成，但还不能真正交付”的阶段**
- **而且如果只停留在当前 Phase 5 / 6 的文字颗粒度，仍然有漏项风险**
- **这轮复核后，当前方向仍然足以走到你一开始要的标准，但当前进展本身仍然做不到**
- **所以这次不改总方向，但会继续往现有 Phase 5 / Phase 6 里补新的硬任务，而不是假装已经只差收尾**
- **当前还不需要新开 `Phase 8`；现有 `Phase 5 / 6 / 7` 足够承接剩余工作，但 `Phase 5` 必须继续补任务树**

这次复判后的更新结论是：

- **当前方向仍然能做到你最开始要求的标准**
- **但当前进展本身还做不到**
- **而且这里的“做到标准”不应建立在“所有 macOS 系统权限窗都必须全自动点击成功”这个错误前提上**
- **为了避免后面又在“快做完”时漏掉真正决定交付的最后几步，我会直接把新增缺口升级成正式任务和新阶段**

---

## 1. 先讲结论

当前项目真正的主线只有一条：

`apps/macos -> apps/api -> openclaw`

直白一点说：

- `apps/macos` 是用户每天会打开的 Mac 客户端
- `apps/api` 是 Gateway，也是业务数据、memory、trace、调试的中间层
- `openclaw` 是真正跑 agent、产出对话和建议的地方

其他模块都不是当前第一主线。

---

## 2. 我们目前为止做过的工作

先不拆模块，直接按“已经做过什么”来讲。

### 2.1 产品方向上，已经定下来的

- 放弃了 `Electron` 作为正式 Mac 客户端主路线
- 正式改成原生 `SwiftUI + AppKit`
- 把产品形态固定成“菜单栏常驻 + 主窗口”
- 把当前真正主线固定成：
  - `apps/macos`
  - `apps/api`
  - `openclaw`
- 把 `apps/web` 定位成辅助控制台，不是主客户端
- 把 `apps/desktop` 和 `apps/android-recorder` 降成历史 / 备用模块
- 把 agent team 的前台人格和命名基本定下来了
- 把 memory 的正式真相源定在 Gateway / 现有业务库，而不是客户端本地黑箱

### 2.2 客户端上，已经做过的

- 原生 Mac App 工程已经建起来了
- 主窗口已经有多页面结构
- 菜单栏状态项已经接进来
- 登录页已经有
- Today、Coach、Goals、State、Reflections、Reminders、Settings 这些页面已经有了
- 中英双语已经接进来了，默认中文
- 提醒、状态、对话、设置这些核心页面不是空白壳
- 一部分 GUI 自动验收和本地手工验收已经做过
- `OpenClaw Registry` 状态已经开始直接消费 Gateway 给的健康摘要
  - 不再只能靠前台自己推 reachability / missing persona 逻辑

### 2.3 Gateway / API 上，已经做过的

- conversation 入口已经有了
- memory 相关服务已经拆出来了
- authority / governance 相关服务已经开始接上
- trace、debug、agent config audit、regression 这些调试能力已经有基础
- 状态、任务、提醒、复盘这些读写模型已经在跑
- 已经有一批 API 测试和集成测试

### 2.4 OpenClaw 上，已经做过的

- 本地 runtime 已经恢复
- local cluster 启动入口已经在仓库里
- native agent registry 已经有了
- external runtime visibility / contract 对照已经接进来
- souls 已经落到仓库里
- `Picard`、`Deanna Troi`、`Spock`、`Guinan`、`Jarvis`、`Data` 这些人格已经有独立文件
- conversation、consult、authority、memory 这些链路已经开始往 OpenClaw 收
- `/debug/openclaw/registry-visibility` 已经能同时看：
  - native registry
  - external `/health` contract
  - 关键 `/v1/tasks/execute` 的真实 probe 结果

### 2.5 测试、runbook、文档上，已经做过的

- 已经有主 spec
- 已经有 Mac 安装、首次运行、主线 runbook、预发布清单、发布 runbook
- 已经有 OpenClaw 本地联调和 cluster smoke 文档
- 已经有 macOS 状态项、提醒、Coach conversation 的自动验收脚本
- 已经有一批阶段性完成报告和验收记录
- 当前 `Phase 1` 关键 API / OpenClaw 回归最近一轮结果为：
  - `71 passed`
- `apps/api` 当前关键构建与回归最近一轮结果为：
  - `corepack pnpm --filter @mindanchor/api build` 已通过
  - `corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach.integration.test.ts tests/debug-trace-summary.integration.test.ts --no-file-parallelism` 已通过
  - 关键 API 回归最近一轮结果为 `30 passed`
- `corepack pnpm test:core-phases:local` 已重新通过
  - 说明本地主链三阶段回归已经重新恢复到“真实可跑”
- `apps/macos` 当前整套原生测试最近一轮结果为：
  - `102 passed`
- 通知恢复 / 机器准备链当前脚本回归最近一轮结果为：
  - `56 passed`
- `core-phase` 当前新增脚本层回归最近一轮结果为：
  - `20 passed`
- 2026-03-24 这轮又补了一次当前宿主真实交付 gate 复核：
  - `corepack pnpm doctor:macos:openclaw-registry-notifications`
    - 当前真实结果仍为：
      - `notificationLiveState=denied`
      - `notificationLiveStatusDescription=Notifications denied`
  - `corepack pnpm assess:macos:openclaw-registry-delivery-gate`
    - 当前真实结果仍为：
      - `deliveryGateStatus=manual_step_pending`
      - `notificationSettingsAutomationBoundary=manual_recommended`
  - 这说明：
    - 当前方向没有错
    - 但本机真实交付状态还停在“支持继续交付、等待用户完成最后一个系统权限动作”
    - 还不能把它算成“已经达到最开始要求的商用品质”
- 2026-03-24 这轮还正式把 `real` 模式跑起来了：
  - `~/.openclaw/bin/openclaw`
    - 已安装
    - 版本已确认：
      - `OpenClaw 2026.3.13`
  - `bash scripts/setup-openclaw-real-profile.sh`
    - 已成功跑通
  - `corepack pnpm test:core-phases:real`
    - 已确认不再卡在启动前
    - 已真实进入：
      - `Phase 1 Stub Baseline`
      - `Phase 2 Provider Direct`
    - 但截至这次文档更新时：
      - **最终 `report.md / report.json` 还没产出**
      - **后台真实回归仍在继续**
      - 当前日志位置：
        - `/tmp/mindanchor-core-phases-real.log`
- 2026-03-24 这轮又拿到第一份正式的 segmented `real` 留档：
  - 运行命令：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline,probes,routes`
  - 产物目录：
    - `test-results/core-phase-real-provider-direct-probes`
  - 当前结果：
    - `Phase 2 Provider Direct`
      - `passed`
      - `30/30`
  - 当前这份真实留档已经确认：
    - `real` 模式不只是“能起”
    - 还已经能在更细口径下产出正式 `report.md / report.json`
  - 当前这份留档的真实总耗时：
    - `101325ms`
    - 约 `1m 41s`
  - 当前最慢的几步已经留档：
    - `chief-route-task-management`
      - `40240ms`
    - `chief-route-recovery`
      - `12152ms`
    - `probe-task-management-agent`
      - `8707ms`
    - `probe-automation-agent`
      - `6837ms`
    - `probe-reflection-coach-agent`
      - `6835ms`
- 2026-03-24 这轮又正式收掉了一个 `real` 主阻塞：
  - 之前 `cluster-preferred real` 没进入 phase body 的根因已经确认不是 contract 本身
  - 而是：
    - 仓库和脚本把 `openclaw/production-runtime-server.mjs` 当成 canonical 入口
    - 但这个文件当时在仓库里缺失
  - 这轮已经补上：
    - `openclaw/production-runtime-server.mjs`
    - `local-cluster-server.mjs` 现在也已经改成复用这条 canonical 入口
    - 对应 import 级回归也已补上
  - 这轮新的真实分段结果：
    - `corepack pnpm test:core-phases:real -- --phases cluster-preferred --segments baseline,probes`
    - `test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/report.md`
  - 当前结果：
    - `Phase 3 Cluster Preferred = passed`
    - `21/21`
    - `Registry Health = aligned`
  - 当前真实总耗时：
    - `100160ms`
    - 约 `1m 40s`
  - 这说明：
    - `cluster-preferred real` 已经从“启动即失败”
    - 推进到“正式分段留档可通过”
- 2026-03-24 这轮又继续把 `provider-direct real` 的长链拆细并拿到新的正式留档：
  - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments debugs`
    - `test-results/core-phase-real-provider-direct-debugs/report.md`
    - 当前结果：
      - `passed`
      - `15/15`
  - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-core`
    - `test-results/core-phase-real-provider-direct-business-core/report.md`
    - 当前结果：
      - `passed`
      - `14/14`
  - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-dashboard`
    - `test-results/core-phase-real-provider-direct-business-web-dashboard/report.md`
    - 当前结果：
      - `passed`
      - `15/15`
  - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-state`
    - `test-results/core-phase-real-provider-direct-business-web-state/report.md`
    - 当前结果：
      - `passed`
      - `15/15`
  - 这说明：
    - `provider-direct real` 已经不再只是“能起”
    - 而是已经继续拆成多个可独立通过、可独立留档的质量片段
  - 当前仍未收齐的 `business-web` 读模型片段还包括：
    - `goalflow`
    - `recovery`
    - `reflections`
    - `inbox`
- 2026-03-24 这一轮又补了一次 conversation contract 收口：
  - `coach message` 现在开始正式携带消息级 `conversationPath`
  - 这份消息级摘要现在已经补进了 `revokedMemoryCount`
  - Mac 前台会优先吃消息级 contract 来展示 execution trail
  - `/debug/traces/:traceId` 退回成诊断 fallback，而不是前台主依赖
- 这一轮新增/确认通过的关键验证结果：
  - `corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach.integration.test.ts tests/debug-trace-summary.integration.test.ts --no-file-parallelism` 已通过
  - `corepack pnpm --filter @mindanchor/macos test` 已通过
  - `corepack pnpm test:core-phases:local` 已通过
  - `corepack pnpm test:macos:openclaw-registry-contract` 已通过
  - `node --test scripts/__tests__/macos-installed-profiles.test.mjs scripts/__tests__/macos-security-agent-window.test.mjs scripts/__tests__/macos-e2e-bundle-ids.test.mjs scripts/__tests__/macos-notification-prep.test.mjs scripts/__tests__/macos-notification-profile.test.mjs scripts/__tests__/macos-notification-profile-status.test.mjs scripts/__tests__/macos-notification-install-flow.test.mjs scripts/__tests__/macos-notification-e2e-guidance.test.mjs scripts/__tests__/macos-notification-debug-log.test.mjs scripts/__tests__/macos-notification-doctor-guidance.test.mjs scripts/__tests__/macos-notification-settings-url.test.mjs` 已通过
- 这一轮新增的正式恢复入口已经落地并本机实跑：
  - `corepack pnpm doctor:macos:openclaw-registry-notifications`
  - `corepack pnpm open:macos:openclaw-registry-notification-settings`
  - `corepack pnpm repair:macos:openclaw-registry-notifications <notification-debug.log>`
  - `corepack pnpm probe:macos:openclaw-registry-live-notification-status`
- 这一轮也补上了更硬的一层 external runtime 验收口径：
  - `scripts/run-macos-openclaw-registry-e2e.mjs` 现在不仅看 Registry 状态色
  - 还会显式检查：
    - `openClawRegistryContractSummaryLines`
  - 如果出现“表面 good、实际 contract 已漂”的情况，脚本会直接失败
  - 当前真实 GUI E2E 还卡在：
    - macOS 客户端登录 / bootstrap 启动链超时
  - 这说明现在的主要阻塞，已经不再是“看不到 drift”，而是“真实启动面还不够稳定”
- 这一轮还顺手确认了一个 `real` 质量门槛里的假失败根因：
  - 之前这条失败留档：
    - `test-results/core-phase-real-provider-direct-debugs-business/report.md`
    - 表面显示：
      - `debug-task-management: socket hang up`
  - 这轮复盘日志后已经确认：
    - 真根因不是 `task-management` 业务逻辑挂掉
    - 而是 `provider-direct` 这轮 API 起服务时命中了：
      - `listen EADDRINUSE: address already in use 0.0.0.0:3024`
    - 当时 phase runner 的端口探测只探：
      - `127.0.0.1`
    - 没把：
      - `0.0.0.0`
      的 wildcard 绑定冲突探出来
  - 这轮已经补上：
    - `scripts/lib/core-phase-port-availability.mjs`
    - loopback host 会同时探测：
      - `127.0.0.1`
      - `0.0.0.0`
    - 对应脚本层回归也已补上
  - 这轮新的真实复跑结果：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments debugs,business`
    - 旧的 `socket hang up` 已不再出现
    - 复跑已真实推进到：
      - `28` 个 step 无失败
    - 但因为这条链整体耗时过长：
      - 外层 CLI 等待在 `30m` 左右超时
      - 当前 live 留档停在：
        - `test-results/core-phase-real-provider-direct-debugs-business-rerun/report.live.md`
  - 这说明：
    - `provider-direct debugs,business` 的旧失败已经被确认是**假失败**
    - 当前剩下的真实问题已经从“假性端口冲突”
    - 收敛成“整段 real 运行时间仍然过长，需要继续拆分或继续做最终长跑留档”
  - 这轮又继续把这条长链往更细段拆了一步：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments debugs`
    - `test-results/core-phase-real-provider-direct-debugs/report.md`
    - 当前结果：
      - `Phase 2 Provider Direct = passed`
      - `15/15`
    - 当前真实总耗时：
      - `约 8m 01s`
    - 当前最慢步骤已经留档：
      - `debug-reflection = 108500ms`
      - `debug-progress-feedback = 103441ms`
      - `debug-task-management = 73544ms`
  - 这轮也继续验证了：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business`
    - 目前已经不是“中途逻辑失败”
    - 而是：
      - 已跑过前半段 business 与 web 读模型步骤
      - 但整段总耗时依然会撞外层 CLI 超时
    - 当前 live 观察到的重步骤包括：
      - `web-dashboard-summary = 384534ms`
      - `business-reflections-latest = 177047ms`
      - `business-signal-batch = 131510ms`
    - 这说明：
      - `Task 5.13` 现在的真实下一步已经更明确：
        - 不是继续修误报
        - 而是继续把 `business` 段再拆细，或者给最终长跑换成更长等待口径
  - 这轮已经把这一步继续做成正式脚本能力并拿到真实留档：
    - 当前新增 finer-grained segments：
      - `business-core`
      - `business-web-dashboard`
      - `business-web-goalflow`
      - `business-web-state`
      - `business-web-recovery`
      - `business-web-reflections`
      - `business-web-inbox`
    - 当前约定：
      - `business-core`
        - 只跑 business 写入 / inbox / reflection 基础链
      - `business-web-*`
        - 会先准备最小 business core 数据
        - 再只跑一个指定 Web 读模型检查
  - 这轮新的真实分段结果：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-core`
    - `test-results/core-phase-real-provider-direct-business-core/report.md`
    - 当前结果：
      - `Phase 2 Provider Direct = passed`
      - `14/14`
    - 当前真实总耗时：
      - `约 10m 31s`
    - 当前最慢步骤：
      - `business-reflections-latest = 247032ms`
      - `business-signal-batch = 102818ms`
  - 这轮还拿到两条新的 Web 读模型留档：
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-dashboard`
    - `test-results/core-phase-real-provider-direct-business-web-dashboard/report.md`
    - 当前结果：
      - `passed`
      - `15/15`
    - 当前真实总耗时：
      - `约 13m 01s`
    - 当前最慢新增步骤：
      - `web-dashboard-summary = 92553ms`
    - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-state`
    - `test-results/core-phase-real-provider-direct-business-web-state/report.md`
    - 当前结果：
      - `passed`
      - `15/15`
    - 当前真实总耗时：
      - `约 15m 32s`
    - 当前最慢新增步骤：
      - `web-state-trends = 91892ms`
      - 但真正最重的底层前置仍是：
        - `business-reflections-latest = 454706ms`
  - 这说明：
    - `provider-direct business` 现在已经不必再整段一起跑
    - 至少已经能把：
      - business core
      - dashboard read model
      - state read model
      拆成可独立通过、可独立留档的真实质量片段
- conversation 异步收尾测试已经补上
  - `app.close()` 现在不会再把 pending full-response 留成测试尾部噪音
- Mac 前台这轮也继续收紧了统一诊断口径：
  - `Today` 页现在能直接显示 `OpenClaw Registry` 的问题数和原因码
  - 自动验收快照也开始带：
    - `openClawRegistryIssueSummary`
    - `openClawRegistryReasonSummary`

---

## 3. 当前项目树

### 3.1 真正主线

#### `apps/macos`

- 这是现在最重要的用户端。
- 它是用户真正会打开的原生 Mac App。

它现在主要分成这些部分：

- `Sources/App`
  - 应用入口、主窗口、菜单栏状态项、窗口控制
- `Sources/Core`
  - API 连接、本地状态、通知、桌面活动采集、权限诊断、语言设置
- `Sources/Features/Login`
  - 登录
- `Sources/Features/Today`
  - 今日摘要、状态总览
- `Sources/Features/Coach`
  - 和 agent 对话
- `Sources/Features/Goals`
  - 目标、任务
- `Sources/Features/State`
  - 状态趋势、状态结果
- `Sources/Features/Reflections`
  - 周报、月报、复盘
- `Sources/Features/Reminders`
  - 提醒列表、处理提醒
- `Sources/Features/Settings`
  - 语言、连接、权限、版本、诊断
- `Tests/MindAnchorMacTests`
  - API、提醒、状态项、语言、活动采集、Coach 等测试

它的功能是什么：

- 登录到系统
- 展示今日信息
- 和 agent 对话
- 看目标、任务、状态、复盘、提醒
- 负责菜单栏常驻
- 负责接住系统通知和窗口恢复

它现在做到哪了：

- 原生 App 已经能生成、能运行
- 主窗口多页面结构已经起来了
- 菜单栏状态项已经做了
- Coach 页面不是空壳，已经接了 conversation 主链的一部分
- 提醒页面、设置页、登录页都已经有了
- 中英双语已经接进来
- 已经有一批单元测试和 GUI/E2E 脚本

它还缺什么：

- 对话内容要更稳定地确认来自 OpenClaw 主链
- UI 上要更清楚地告诉用户“用了哪些 memory、为什么这样回答”
- 提醒 -> 系统通知 -> 打开窗口 -> ack 这条链还要更稳
- 真正的 macOS 系统通知点击动作还要继续做稳定
- 页面之间的信息密度还要再收口，不要又多又散

一句话：

- `apps/macos` 现在已经像一个真正的产品前台了，但后面体验能不能成熟，还是要看 `apps/api + openclaw` 这条主链继续收口。

#### `apps/api`

- 这是现在整个项目最核心的中间层。
- 它不是单纯转发，而是整个系统的 Gateway 和业务协调中心。

它现在主要包含：

- `src/app.ts` / `src/index.ts`
  - 服务入口
- `src/orchestrator.ts`
  - 主要协调逻辑
- `src/lib`
  - 鉴权、OpenClaw 连接、trace、model bridge、contracts
- `src/services`
  - state、task、reflection、notification、conversation coach、agent memory、authority execution 等服务
- `src/routes`
  - API 路由
- `tests`
  - conversation、memory、authority、notification、reflection、agent team、runtime visibility 等测试

它的功能是什么：

- 接住 Mac / Web 请求
- 存和读状态、任务、提醒、复盘这些业务数据
- 统一用户上下文
- 给 OpenClaw 提供结构化上下文
- 接 OpenClaw 的结果并回写
- 提供 trace、debug、regression、config audit

它现在做到哪了：

- conversation 入口已经有了
- state/task/reflection/notification 等服务已经存在
- agent memory / data memory / memory proposal 已经拆出来
- authority execution 已经有服务
- OpenClaw cluster client / trace logger / model bridge 都已经在仓库里
- 已经有比较完整的一批 API 测试和集成测试

它还缺什么：

- memory retrieval contract 还要继续统一
- feedback -> preference / habit learning 还没真正闭环
- 还要把 latency、质量、路由、memory 命中这些观测做清楚
- 更多 workflow 还要真正收敛到统一主链，而不是分散在多处
- 对外部独立 OpenClaw 的 contract 还要继续对齐

一句话：

- `apps/api` 现在就是主脑前面的总线和业务中台，它是当前最该继续重投的地方。

#### `openclaw`

- 这里是 agent 真正运行的地方。
- 如果用户最终要看到“这是一个活的 agent team”，核心就在这里。

它现在主要包含：

- `runtime/agent-registry.mjs`
  - agent 注册表
- `runtime/memory-client.mjs`
  - 取 memory 的入口
- `runtime/authority-client.mjs`
  - authority / apply 相关入口
- `runtime/workflows`
  - `picard-router`
  - `jarvis-authority`
  - `data-governor`
  - `persona-executor`
- `souls`
  - 六个前台/后台人格的 soul 文件
- `skills`
  - skill schema
- `local-runtime`
  - 本地 runtime 服务
- `local-cluster-server.mjs`
  - 本地 cluster 验证入口

它的功能是什么：

- 跑 persona 路由
- 跑对话生成
- 跑 consult / authority / governance
- 消费 Gateway 给的 memory 上下文
- 返回结构化的对话和决策结果

它现在做到哪了：

- native registry 已经恢复
- souls 已经落库
- 本地 runtime 已经有
- `Picard`、`Jarvis`、`Data` 这些关键 workflow 已经开始接进真实链路
- conversation fast / full / consult 已经有基础主路径

它还缺什么：

- 需要更稳定地成为“真正默认产出内容的地方”
- memory bundle 的消费还要更统一
- persona 路由、consult、authority 的 trace 还要更好看懂
- 和外部真正独立部署的 OpenClaw 还要继续对齐

一句话：

- `openclaw` 已经不是空目录了，但它还需要继续从“能跑”推进到“真正稳定地主导输出”。

#### `packages/domain`

- 这是共享协议层。
- 它不直接面向用户，但非常重要。

它的功能是什么：

- 统一客户端、Gateway、OpenClaw 之间的字段和类型
- 放共享 schema 和 contract

它现在做到哪了：

- 已经有共享的 `src/index.ts` 和 `src/agent-team.ts`
- 已经有编译产物

它还缺什么：

- 跟着主线继续收紧 conversation payload、memory contract、persona metadata

一句话：

- 这是底座，别抢戏，但必须稳。

### 3.2 支撑主线，但不是第一优先级

#### `apps/web`

- 这是 Web 控制台。
- 它现在不是第一交付客户端，更像辅助台。

它的功能是什么：

- 看 Dashboard
- 看 GoalFlow / Tasks
- 看 State / Recovery / Reflections / Inbox
- 看 Agent Lab、debug、trace、regression

它现在做到哪了：

- 页面已经有了
- `src/App.tsx`、`src/api.ts`、`src/labels.ts` 这套基础结构在
- 调试和读模型查看能力已经接进来

它还缺什么：

- 只做“帮助主线调试和看清楚系统状态”的增强
- 不要再把它做成反客为主的第一前台

一句话：

- `apps/web` 有用，但现在是辅助控制台，不是主战场。

#### `scripts`

- 这是自动化、验收、打包、预检脚本集合。

它的功能是什么：

- 跑核心阶段测试
- 跑 Mac 状态项验收
- 跑提醒通知验收
- 跑 Coach conversation E2E
- 跑 cluster smoke 和 web smoke
- 跑发布前检查

它现在做到哪了：

- 已经有：
  - `scripts/run-core-phase-tests.mjs`
  - `scripts/run-macos-status-item-acceptance.mjs`
  - `scripts/run-macos-reminder-notification-e2e.mjs`
  - `scripts/run-macos-coach-conversation-e2e.mjs`
  - `scripts/run-macos-openclaw-registry-e2e.mjs`
- 发布、签名前检查、cluster smoke 相关脚本也已经有了

它还缺什么：

- 继续把最关键主链做成更稳定的自动闭环
- 尤其是：
  - 原始文本输入并发送
  - OpenClaw 返回内容
  - reminder 到达
  - 通知动作
  - ack / revoke / feedback

一句话：

- 脚本已经不少了，现在重点不是再堆更多脚本，而是把最关键那几条链测稳。

#### `docs`

- 这是规约、runbook、验收记录、报告的集合。

它的功能是什么：

- 告诉我们方向
- 告诉我们怎么启动、怎么验收、怎么排障
- 记录用户做过的关键决定

它现在做到哪了：

- 主 spec 已经有了
- Mac 安装、首次运行、主线 runbook、发布 runbook、预发布清单已经有了
- OpenClaw 本地联调和 cluster smoke 文档已经有了
- 已经开始把决策台账写回主 spec

它还缺什么：

- 继续把新决策写回主 spec
- 继续减少“文档很多，但主线不够直观”的问题

一句话：

- 文档已经够多了，现在更重要的是让文档更清楚，不是继续无序增长。

### 3.3 历史 / 备用模块

#### `apps/desktop`

- 这是旧 Electron 桌面端。

现在的定位：

- 保留历史资产和旧思路参考
- 不再作为正式商用 Mac 客户端主路线

一句话：

- 留着参考可以，但不要再往这里投主力。

#### `apps/android-recorder`

- 这是 Android 音频 Beta / 备用轨。

现在的定位：

- 保留
- 不删
- 但当前不是主线

一句话：

- 先别让它抢主线资源。

---

## 4. 现在每个模块的真实进展

### 已经明显成形的

- `apps/macos`
- `apps/api`
- `openclaw`
- `scripts`
- `docs`

这里的“成形”不是说已经完工，而是：

- 已经不是概念和空壳
- 已经有代码、有页面、有服务、有测试、有 runbook

### 已经能用，但不是现在最该深挖的

- `apps/web`
- `packages/domain`

### 当前明确不该再继续扩张的

- `apps/desktop`
- `apps/android-recorder`
- 音频 / 视频 / 健康 / 更多平台分支

---

## 5. 当前最容易跑偏的地方

现在最容易犯的错，不是没做东西，而是又散掉。

最容易散掉的方式有这几种：

- 又把很多精力放回 `apps/web`
- 又想重拉 `Electron`
- 又开新的客户端分支
- 又在 `apps/macos` 里堆很多前台展示，但 `apps/api + openclaw` 还没完全收口
- 又把 memory 做回不可解释的黑箱

所以当前最重要的原则还是这一句：

- 不能直接增强 `apps/macos -> apps/api -> openclaw` 主链的工作，默认往后排。

---

## 6. 接下来最该继续做什么

当前建议顺序固定为：

### 第一步：继续收紧 `apps/api + openclaw`

重点是：

- conversation 真实主路径
- memory retrieval contract
- feedback -> preference / habit learning
- authority / governance / trace

### 第二步：再继续收紧 `apps/macos`

重点是：

- 把上面那条主链清楚地展示出来
- 让对话、提醒、通知、ack、memory 操作都更稳
- 让用户看得懂现在系统为什么这么回答、为什么这么提醒

### 第三步：最后再补 `apps/web` 和外围发布工程

重点是：

- 只补必要的辅助视图、调试能力和发布清单

---

## 7. 最后一段大白话总结

我们现在不是“什么都没有”，也不是“只有一个 PPT 方向”。

现在的真实状态是：

- 主线骨架已经搭起来了
- Mac 前台已经成形
- Gateway 中层已经成形
- OpenClaw runtime 已经不是空壳
- 测试、runbook、验收也已经积累出来了

但同时也要承认：

- 真正最核心的那条链，也就是“用户发出输入 -> OpenClaw 产出结果 -> memory 能解释 -> 提醒和后续动作能稳定闭环”，还没有完全收口

所以接下来的目标不是继续开新线，而是把这条主线做稳、做深、做成熟。

---

## 8. 阶段计划树

下面这部分不讲空话，只讲接下来 3 个阶段我们到底要做什么。

原则只有一个：

- 后面的工作，必须继续围着 `apps/macos -> apps/api -> openclaw` 这条主线收口。

### Phase 1｜先把核心主链收紧

这一阶段最重要的，不是继续做更多页面，而是先把真正的核心链做扎实。

这一阶段主要解决什么：

- 用户发出的输入，是否真的主要走 OpenClaw 主路径
- Gateway 给 OpenClaw 的 memory、上下文、trace，是否已经统一
- feedback、authority、governance 这些动作，是否已经进入同一条主链

这一阶段主要做哪些事：

- 继续收紧 `apps/api`
  - conversation 主入口继续统一
  - memory retrieval contract 继续统一
  - feedback -> preference / habit learning 开始进入真实闭环
  - authority / proposal / governance / revoke 的 trace 继续补全
- 继续收紧 `openclaw`
  - 让对话、consult、authority 更稳定地由 OpenClaw 产出
  - 让 `Picard -> front agent -> consulted agent -> authority agent` 这条链更清楚
  - 让 runtime 对 memory bundle 的消费更统一
  - 让外部独立 OpenClaw 和当前仓库里的 registry 更好对齐

这一阶段明确先不做什么：

- 不优先扩更多客户端
- 不优先扩更多 Web 页面
- 不优先做外围商业化包装
- 不优先把很多复杂展示继续堆到 Mac 前台

这一阶段什么时候算完成：

- 用户输入后的主要对话结果，默认来自 OpenClaw 主链
- memory 来源、命中、撤销、proposal、governance 在服务端已经可追踪
- feedback 不再只是记录，而是开始真实影响 preference / habit learning
- trace 里已经能更清楚看出：
  - 谁在前台说话
  - 谁被 consult
  - 谁在执行 authority
  - 走的是主路径还是 fallback

一句话：

- Phase 1 的目标，就是先把“大脑内部”收紧。

#### Phase 1 任务树

#### Phase 1 当前进度（更新到 2026-03-24）

- 已经开始推进：
  - Task 1.1
  - Task 1.2
  - Task 1.3
  - Task 1.4
  - Task 1.5
  - Task 1.6
- 当前阶段判断：
  - `Phase 1` 还处在“主链收口中”，不是“已完成”
  - 但已经把最容易乱掉的四块先收了一部分：
    - conversation 入口
    - memory contract
    - authority / governance 边界
    - trace summary
- 当前统一参考回归口径：
  - `@mindanchor/domain build` 已通过
  - `apps/api` + `openclaw` 的 Phase 1 关键回归已通过
  - 最近一轮结果为 `64 passed`
- 当前最应该继续往下做的，不是跳去 Phase 2，而是先把 `Task 1.5` 和 `Task 1.6` 收口。
- Task 1.1｜收紧 conversation 主入口
  - 把主要对话入口继续收敛到统一的 Gateway conversation 主链
  - 减少“看起来像一条链，实际走了两三套逻辑”的情况
  - 明确 fast / full / consult / fallback 的边界
  - 当前状态：
    - 已部分完成
  - 当前进展：
    - 已经补上 `retry` 路径复用同一条 consult-aware completion 主链
    - `retry` 不再跳过 consulted-agent conversation lane
    - 对应 trace summary 与 adapter route 也已补齐
  - 还差什么：
    - `send / retry / 后续同类入口` 还没有完全抽成统一 turn runner
    - fast / full / consult 的共享组装逻辑还有重复代码
- Task 1.2｜收紧 memory retrieval contract
  - 统一 Gateway 给 OpenClaw 的 memory bundle
  - 统一 scope、排序、命中来源、framing hint
  - 减少不同 workflow 自己拼 memory 的情况
  - 当前状态：
    - 已部分完成
  - 当前进展：
    - 已经把 memory context 的 `scopes` 顺序收敛为 persona 定义顺序
    - 同一组 scopes 即使请求顺序不同，Gateway 返回也保持稳定
    - 对应 service 层和 internal API 层测试已补齐
    - 已经把返回 bundle 的 `scopeEntryCounts` / `sourceCounts` 补进 metadata
    - 后续 trace、UI、OpenClaw 可以直接消费同一份来源摘要，而不是各算各的
  - 还差什么：
    - memoryFramingHints / recalledMemory / usedMemoryEntries 还没完全统一成单一组装口径
    - 不同 conversation workflow 里还有各自拼 prompt memory 的痕迹
- Task 1.3｜打通 feedback -> preference / habit learning
  - 让 helpful / unhelpful feedback 不只是被记下来
  - 让它开始真实进入 preference / habit learning 主链
  - 让这个过程能回查、能解释、能撤销
  - 当前状态：
    - 已持续推进，开始进入 learning 收口
  - 当前进展：
    - `unhelpful feedback -> revoke / invalidate` 这条治理链已经在工作
    - `helpful feedback -> strengthening proposal` 不再只是留在 candidate 层
    - 现在后续 coach turn 会开始轻量读取这些 pending strengthening candidate
      - 不直接改写长期 memory
      - 但会作为 lightweight hint 进入后续 turn 的 `memoryFramingHints`
    - retrieval 排序现在也开始受到这类 strengthening candidate 的轻量影响：
      - 如果某条 active memory 命中了 pending helpful-feedback strengthening candidate
      - 它在同 scope 的 retrieval 排序里会被轻量提前
      - 这样 helpful feedback 不只影响 prompt hint，也开始影响后续 memory ranking
    - 已补上专门 trace：
      - `coach.feedback.strengthening.recalled`
      - 现在能直接看到这次 turn 轻量读取了多少 strengthening candidate
      - 也能看到 sourceAgents 与 targetScopeCounts
    - 反向修正也开始进入主链：
      - 如果某次 reply 轻量用了 strengthening candidate，但随后被用户标为 `unhelpful`
      - 对应 pending strengthening candidate 会被自动 reject
      - 后续 turn 不再继续轻量读取这条被打回的 strengthening candidate
    - 已补上反向修正 trace：
      - `coach.feedback.strengthening.weakened`
      - 现在能直接看到这次 unhelpful feedback 打回了多少 strengthening candidate
    - 现在已经补上第一版可解释的衰减规则：
      - helpful-feedback strengthening 不会无限期持续影响后续 turn
      - 当前先按 `14 天 freshness window` 做轻量衰减
      - 超过窗口的 strengthening candidate 不再继续参与 recall / retrieval boost
    - 脏数据保护也已经补上：
      - 如果 strengthening candidate 找不到对应 source message
      - 现在会按 `missing_source` 处理，而不是默认继续生效
      - 这样不会因为历史残缺数据让 strengthening 永远保持 fresh
    - 对话侧 trace 现在也能解释“为什么这次没 recall”：
      - 新增 `coach.feedback.strengthening.filtered`
      - metadata 会带 `staleCandidateCount`
      - metadata 也会带 `missingSourceMessageCount`
    - retrieval 侧和 conversation 侧已经共用同一套 strengthening freshness helper
      - 避免两边各写一份 `14 天` 规则，后续漂移
    - 这让 helpful feedback 已经开始对后续 turn 产生“可追踪的轻量影响”，而不只是“记录一下”
    - 当前这条线最近一轮稳定回归结果：
      - `@mindanchor/domain build` 已通过
      - `apps/api` 相关主链回归已通过
      - 当前回归结果为 `113 passed`
  - 还差什么：
    - 现在已经有 freshness decay，但还没有更明确、可调的 ranking weight 机制
    - `preferences` / `habits` 的 strengthening 规则还比较粗，目前主要按已用 memory kind 做轻量区分
    - 虽然已经有了 unhelpful -> weakening 和第一版 freshness decay，但还没有更平滑的 confidence / score 衰减规则
- Task 1.4｜收紧 authority / proposal / governance
  - 继续明确 `Jarvis`、`Data`、`Picard` 的职责边界
  - proposal、approve、reject、revoke、delete 这些动作继续统一
  - 避免 authority 和 memory governance 混成一团
  - 当前状态：
    - 已持续推进，已经进入阶段性收口
  - 当前进展：
    - 已收紧一条关键边界：
      - 只要 `Jarvis executionMode=proposal`，就不能偷偷直接 apply
    - 现在低风险 `task_order` 即使可直接执行，只要显式要求 `proposal`，也会保留为提案
    - `Data` governance 现在也补上了一层结果收口：
      - 缺少 `candidateId` / `memoryId` 的内部请求会直接返回 `400`
      - 找不到治理目标时，不再回一个没有 `status` 的空结果，而是显式返回 `rejected`
    - `Jarvis task_order` 也补上了一条安全边界：
      - 如果没有明确 `goalId`，即使是低风险 `apply_direct`，也会自动降级为 `proposal`
      - 不再出现“目标不清楚但看起来已执行”的假成功
    - `Jarvis` proposal action 结果也补上了一层结果收口：
      - `approveProposal` / `rejectProposal` 在 proposal 不存在时，不再只回一个模糊的 `rejected`
      - 现在会带上稳定字段：
        - `reason`
        - `proposalId`
        - `commandLog`
      - 这样后面 trace、route、UI 再消费时，不需要自己猜“是没找到，还是正常拒绝”
    - 还补了一条“proposal 终态不能翻转”的 guard：
      - 已经 `approved` / `rejected` 的 proposal，再次 approve/reject 会立即返回 `proposal_already_final`
      - 不会重新插入 command log，也不会把状态倒回
      - 这让 rerun tests / traces 不再波动
    - 公开 `coach proposal` 动作路由也已经跟上这层边界：
      - 如果 proposal 已经终态，再次点 `approve` / `reject` 不会再返回假成功
      - 现在会返回 `409 Proposal already finalized.`
      - 并把 `reason=proposal_already_final` 与当前 proposal 一起带回，前台可以直接刷新状态
    - store 底层 proposal 状态迁移也已经补上 guard：
      - `approvePlanChangeProposal` / `rejectPlanChangeProposal` 现在都只允许从 `proposal` 进入终态
      - 已经终态的 proposal，在 store 层也不会再被翻回去
      - 这让底层状态更不容易被绕过 service 误改
    - 对应 service 层和 integration 层测试已补齐
    - 当前这条线的最近一轮稳定回归结果：
      - `@mindanchor/domain build` 已通过
      - `apps/api` 相关主链回归已通过
      - 当前回归结果为 `106 passed`
  - 还差什么：
    - `Jarvis` / `Data` 的更多 executionMode 与 targetKind 组合边界还要继续收
    - `Jarvis` proposal / approve / reject 的结果形状还能再继续和 `Data` 治理口径靠近
    - `Data` 治理这边还没有对应的“更硬底层状态迁移 guard”抽象
- Task 1.5｜补齐主链 trace
  - trace 里补齐：
    - front agent
    - consulted agent
    - authority agent
    - selected route
    - fallback reason
    - memory usage summary
  - 让排障时能看懂发生了什么
  - 当前状态：
    - 已部分完成
  - 当前进展：
    - `/debug/traces/:traceId` 已补上 conversation 级别的 `memoryUsage` 摘要
    - 现在 trace summary 可以直接看到：
      - recalledCount
      - sourceCounts
      - scopeEntryCounts
    - `coach.memory.recalled` 事件也已同步记录这些字段
    - 已补上 `routeSummary` / `authoritySummary`
    - 现在 trace summary 不只知道“走了哪条路”，也能直接看出：
      - Picard 为什么这样路由
      - authority 最后做了什么结果
    - 已补上 `routeStatusSummary`
    - 现在 trace summary 还能直接告诉你：
      - 这次是 cluster 健康主路径
      - 还是 provider-direct
      - 还是 fallback / failed
    - 已补上 `degradedSummary`
    - 现在 trace summary 对降级路径也能直接给出一句人能看懂的结论
    - 已补上 `feedbackLearning` 摘要
    - 现在 `/debug/traces/:traceId` 还能直接看到本次 conversation trace 里的 learning 信号：
      - `strengtheningRecalledCount`
      - `staleFilteredCount`
      - `missingSourceFilteredCount`
      - `weakenedRejectedCandidateCount`
    - 这意味着排查“为什么这次回复开始变得更贴用户”或“为什么某条 strengthening 没再继续生效”时
      - 不需要再手翻所有 trace event
      - conversation summary 已经能直接给出 learning 主线摘要
    - 还补了一条 conversation shutdown 收口：
      - `app.close()` 现在会等待 pending 的 coach full-response 后台任务完成
      - 不再出现测试已经结束、后台异步还在写 `mindanchor.json` 的残留问题
      - 这让 conversation trace / learning / memory 相关回归不再夹带 unhandled rejection 假噪音
    - 已补对应回归：
      - 现在会显式验证“assistant 先返回 `pending_full` 后，应用关闭前必须完成 full response 收口”
    - 2026-03-24 这一轮又补上了一层更稳定的 route 聚合摘要：
      - `conversationPath.routeMetrics`
      - 现在 trace summary 里会直接带：
        - `adapterDecisionCount`
        - `agentCounts`
        - `workflowCounts`
        - `routeCounts`
        - `fallbackReasonCounts`
      - 这意味着排查某次对话时，不只知道“最后走了哪条主路径”
      - 还知道：
        - 这轮一共做了几次 adapter decision
        - 哪些 agent 实际被调用了几次
        - 哪些 workflow 真正参与了
        - fallback reason 主要落在哪类
      - 这一层摘要也已经复用到消息级 `conversationPath`
        - 避免 `debug trace` 和 `coach message` 两边再次漂移
    - 这一轮新增验证结果：
      - `corepack pnpm --filter @mindanchor/api exec vitest run tests/debug-trace-summary.integration.test.ts tests/conversation-coach.integration.test.ts --no-file-parallelism` 已通过
      - `corepack pnpm --filter @mindanchor/api build` 已通过
      - `corepack pnpm test:core-phases:local` 已继续通过
  - 还差什么：
    - 现在单次 trace 的 route 聚合摘要已经补上
    - 但还没有进一步沉淀成跨阶段 / 跨回归的长期指标报表
    - 所以下一步更适合从 `Task 1.5` 继续切到 `Task 1.6`
- Task 1.6｜对齐外部 OpenClaw 接入
  - 继续整理本仓库 runtime 和外部独立 OpenClaw 的 contract
  - 让 registry、memory、authority、workflow 的接口更一致
  - 避免“本地能跑，接外部实例就变样”
  - 当前状态：
    - 已开始推进
  - 当前进展：
    - `registry visibility` 已经不只比对“外部实例有没有这些 persona agent”
    - 现在还会继续比对：
      - `supportedWorkflows`
      - `memoryScopes`
      - `canFront`
      - `canConsult`
      - `canWritePlans`
      - `canGovernMemory`
    - 这意味着当外部独立 OpenClaw 暴露了同名 persona agent，但 contract 已经漂移时
      - `matchedAgentIds` 不会再制造“看起来已对齐”的假象
      - `contractMismatches` 会直接指出是哪几个字段不一致
    - local runtime `/health` 现在也开始显式带出 persona contract 字段
      - 不再只有 agent name / worker / workflow
      - 后续做 external runtime 对照时，口径更硬
    - 已补回归，覆盖：
      - local runtime 作为 external runtime 时，`contractMismatches=[]`
      - 外部 runtime 只要同名 agent 的 workflow / memoryScopes / capability 漂移，就会进入 `contractMismatches`
    - 现在也开始补 runtime 级 contract 对照：
      - `responseMode`
      - `executeEndpoints`
    - 这意味着外部独立 OpenClaw 即使 agent 名字全部对上了
      - 只要 runtime 级别的响应模式或 execute endpoint 不兼容
      - `runtimeContractMismatches` 也会直接指出问题
    - 这样排查“为什么外部实例看起来在线，但真正 conversation / authority 主链还是不稳”时
      - 不再只能猜是 agent registry 问题
      - 现在也能更快区分是不是 runtime contract 本身没对齐
    - 现在也开始补 workflow payload contract 对照：
      - external runtime `/health` 已开始显式暴露 `workflowContracts`
      - 当前至少覆盖：
        - `coach_conversation_fast`
        - `coach_conversation_full`
        - `coach_conversation_consult`
        - `plan_adjustment`
        - `memory_governance`
      - 每条 workflow 都会声明 `requiredContextFields`
    - `registry visibility` 现在会继续产出 `workflowContractMismatches`
      - 如果外部实例缺少关键 payload 字段
      - 现在可以直接指出是哪个 workflow 缺了哪些 context fields
    - 这意味着 external OpenClaw 对齐已经从三层开始收口：
      - persona registry 是否对齐
      - runtime contract 是否对齐
      - workflow payload contract 是否对齐
    - 现在也开始补 workflow response contract 对照：
      - external runtime `/health` 已开始支持 `workflowResponseContracts`
      - 当前至少声明每条关键 workflow 的 `requiredParsedFields`
      - `registry visibility` 现在会继续产出 `workflowResponseContractMismatches`
    - 这意味着排查 external OpenClaw 时，不再只能看到“输入 contract 有没有对齐”
      - 也能继续看到“这条 workflow 的结构化输出 shape 有没有对齐”
    - 现在已经开始补真实 execute probe 对照：
      - 不再只相信 external runtime `/health` 自己声明的 `workflowExecutionContracts`
      - `registry visibility` 现在还会主动 probe 关键 `/v1/tasks/execute` 响应
      - 当前至少覆盖：
        - `coach_conversation_full`
        - `plan_adjustment`
        - `memory_governance`
    - probe 现在会直接检查真实 execute 返回里的：
      - `metadata`
      - `memoryFetch`
      - `authorityApply`
    - 如果 external runtime 口头上说 contract 对齐，但真实 execute 响应里少字段
      - 现在会直接进入 `workflowExecutionProbeMismatches`
      - 不再出现“health 看起来没问题，真正执行才发现 metadata shape 漂了”的假绿
    - `registry visibility` 现在也开始直接返回压缩后的健康摘要：
      - `healthStatus`
      - `healthReasonCodes`
      - `healthIssueCounts`
    - 这意味着 Mac / Web 调试面后续不需要再各自手写一套复杂判断
      - 可以直接根据统一的 health summary 做状态展示
      - `unknownExternalAgents` 继续保留，但不再误算成“主链不健康”
    - `apps/macos` 已开始直接消费这层健康摘要：
      - 当 Gateway 返回 `healthStatus=attention`
      - Mac 端会优先把 Registry 状态展示为“需要检查”
      - 不再只依赖前台本地拼装 missing / reachable 的推断逻辑
      - 这轮又继续往前推了一步：
        - `Today` 页里的 Registry callout 现在不只显示标题
        - 还会继续显示：
          - `Registry 问题`
          - `Registry 原因`
        - 当 `healthStatus=attention` 时，状态消息也不再伪装成“基本对齐”
        - 现在会明确说出问题数和 `healthReasonCodes`
      - 自动验收快照也开始带这两个字段：
        - `openClawRegistryIssueSummary`
        - `openClawRegistryReasonSummary`
      - 这意味着后面做 GUI 自动验收时，不只知道“有 warning”
        - 还能继续知道 warning 到底是几类问题、哪条 reason code 在触发
    - `apps/web` 的 `AgentLabPage` 现在也已经开始直接消费这层健康摘要：
      - 顶部诊断区新增了独立的 `OpenClaw Registry` 卡片
      - 会直接显示：
        - `healthStatus`
        - `healthReasonCodes`
        - `healthIssueCounts.totalIssueCount`
        - `healthIssueCounts.missingPersonaCount`
      - 这意味着 Web 辅助控制台现在和 Mac 一样，已经开始吃同一套 Gateway 诊断真相
      - 不再需要前端各自再拼一套 registry 健康判断
    - 已补 Web smoke test，覆盖：
      - `OpenClaw Registry` 标题可见
      - `需要检查` 状态可见
      - `workflow_execution_probe_mismatch` reason code 可见
      - `问题数` / `缺失 persona` 统计可见
    - `scripts/run-core-phase-tests.mjs` 现在也开始直接消费这层健康摘要：
      - baseline checks 会新增拉取 `/debug/openclaw/registry-visibility`
      - 每个 phase 会写入压缩后的 `registrySummary`
      - `report.md` / `report.json` 现在会直接带出：
        - `healthStatus`
        - `healthReasonCodes`
        - `totalIssueCount`
        - `missingPersonaCount`
        - `matchedAgentCount / nativeAgentCount`
      - `cluster-preferred` 阶段现在也开始把 `healthStatus=aligned` 作为更明确的 phase gate
      - 这意味着 Mac / Web / phase 脚本三条线已经开始共享同一套 registry 健康口径
    - 已补脚本级 helper 测试，覆盖：
      - registry 摘要压缩
      - cluster phase gate 在 `healthStatus!=aligned` 时失败
      - 非 cluster phase 不会误判失败
    - 2026-03-24 这一轮又把 `phase gate / pass-fail` 口径继续收紧了一层：
      - `core-phase` 的 `registrySummary` 现在不再只带：
        - `healthStatus`
        - `healthReasonCodes`
        - `totalIssueCount`
      - 还会继续带出更细的 issue breakdown：
        - `contractMismatchCount`
        - `runtimeContractMismatchCount`
        - `workflowContractMismatchCount`
        - `workflowResponseContractMismatchCount`
        - `workflowExecutionContractMismatchCount`
        - `workflowExecutionProbeMismatchCount`
        - `unknownExternalAgentCount`
      - `cluster-preferred` 阶段如果因为 Registry 没对齐而失败
        - 失败信息现在也不再只说：
          - `healthStatus!=aligned`
        - 还会直接带：
          - `issue breakdown`
        - 这样看到失败时，可以更快分辨：
          - 是 persona contract 漂了
          - 还是 runtime contract 漂了
          - 还是 workflow response / execute probe 在漂
      - `report.md` 和 `core-phase runbook` 现在也已经同步写出这层 breakdown
        - 后面做阶段回归排障时，不需要再手翻整份 `registry-visibility.json`
    - 这一轮还补上了 `test:core-phases:real` 的正式预检：
      - 现在在真正起服务之前，会先检查：
        - `MINDANCHOR_DEFAULT_MODEL_BASE_URL`
        - `MINDANCHOR_DEFAULT_MODEL_API_KEY`
        - `MINDANCHOR_DEFAULT_MODEL_NAME`
        - `MINDANCHOR_DEFAULT_MODEL_WIRE_API`
        - `OPENCLAW_BIN` / `~/.openclaw/bin/openclaw`
      - 如果这些前置条件没准备好
        - 脚本现在会在启动前直接失败
        - 并明确告诉你缺的是 provider 变量，还是 OpenClaw CLI
      - 这意味着后面跑 `test:core-phases:real` 时
        - 不会再走到中途才发现“其实机器根本没准备好”
        - `real` 模式已经开始有自己独立的正式入口门槛
    - 这一轮还继续往真实 `real` 回归推进了一步：
      - 已确认此前真正挡住 `test:core-phases:real` 的根因之一是：
        - `OpenClaw 2026.3.13` 需要 `Node >= 22.16`
        - 但仓库 `.tools/node/bin/node` 是 `22.14.0`
      - 现在已经补上：
        - `OpenClaw` 兼容 Node 选择 helper
        - `real` 预检里的 Node 版本检查
        - `setup-openclaw-real-profile.sh` 不再强制把旧 `.tools/node/bin` 放到前面
      - 真实结果也已经往前推进：
        - `~/.openclaw/bin/openclaw` 已安装并确认版本：
          - `OpenClaw 2026.3.13`
        - `bash scripts/setup-openclaw-real-profile.sh` 已成功跑通
        - `test:core-phases:real` 现在已经不再卡在启动前
        - 已能真实进入：
          - `Phase 1 Stub Baseline`
          - `Phase 2 Provider Direct`
      - 当前最新观察到的新瓶颈不是“起不来”
        - 而是：
          - 真实 provider-direct debug / probe 请求非常慢
          - 单次真实请求已经观测到：
            - `~53s`
            - `~76s`
            - `~80s`
          - 所以整套 `test:core-phases:real` 当前明显会超过一般 30 分钟交互超时
      - 因为这条真实链路现在确实变长了
        - 这一轮也继续补了两层运行面支持：
          - `core-phase` 每一步现在都会输出：
            - `START`
            - `DONE`
            - `FAIL`
            - 并带：
              - phase title
              - step label
              - path
              - timeout
              - elapsedMs
          - `test:core-phases` 现在支持：
            - `--phases stub,provider-direct,cluster-preferred`
            - 也支持环境变量：
              - `MINDANCHOR_PHASED_PHASES`
        - 这意味着：
          - 后面跑长链 `real` 回归时，不会再只有阶段标题而没有过程
          - 也可以把 `provider-direct` 和 `cluster-preferred` 拆开单独跑
        - 这一轮还补做了最小实跑确认：
          - `corepack pnpm test:core-phases:local -- --phases stub`
          - 已确认：
            - `Selected Phases: stub`
            - 只进入 `Phase 1 Stub Baseline`
            - 新的 step 级 `START / DONE` 日志已经生效
          - 虽然这条 stub 分段在当前机器负载下依然很慢
            - 但至少已经证明：
              - 分段参数生效
              - 过程日志生效
              - 不是“参数写了但没用”
        - 这一轮又继续补上了一层 live snapshot：
          - 运行中会持续刷新：
            - `report.live.json`
            - `report.live.md`
          - 已用：
            - `MINDANCHOR_PHASED_REPORT_DIR=test-results/core-phase-test-live corepack pnpm test:core-phases:local -- --phases stub`
            - 做了最小实跑确认
          - 当前已确认：
            - 运行未结束时，目录里已经能看到：
              - `report.live.json`
              - `report.live.md`
            - 这意味着后面即使 `real` 回归还在后台长跑
              - 也不再需要等最终 `finalizeRun()` 才知道当前跑到哪
        - 这一轮又继续把“更细的分段回归口径”落成正式脚本能力：
          - `test:core-phases` 现在除了 `--phases`
          - 还支持：
            - `--segments baseline,web,seed,probes,routes,debugs,business,regressions`
            - 以及环境变量：
              - `MINDANCHOR_PHASED_SEGMENTS`
          - 已做最小实跑确认：
            - `corepack pnpm test:core-phases:local -- --phases stub --segments baseline`
          - 当前已确认：
            - `Selected Phases: stub`
            - `Selected Segments: baseline`
            - 只执行了 baseline 相关步骤
            - 并且已经产出：
              - `report.json`
              - `report.md`
              - `report.live.json`
              - `report.live.md`
          - 这意味着：
            - 现在不只可以按 phase 拆
            - 还可以继续按 phase 内部的逻辑段拆
            - `Task 5.13` 已经从“只能整套后台长跑”
            - 推进到“可以逐层拆开并正式留档”
    - 这说明：
        - `Task 1.6` 现在已经从“真实模式起不来”
        - 推进到“真实模式能跑，也能看清过程，但还需要继续收运行时长与最终留档”
    - 2026-03-24 这轮又继续往前收了一步：
      - 已确认此前挡住 `cluster-preferred real` 的根因之一不是 API contract
      - 而是仓库缺失：
        - `openclaw/production-runtime-server.mjs`
      - 当前已经补上这条 canonical runtime 入口
      - `local-cluster-server.mjs` 也已经改成直接复用这条入口
      - 对应 import 级回归已通过
    - 这轮新的真实留档：
      - `corepack pnpm test:core-phases:real -- --phases cluster-preferred --segments baseline,probes`
      - `test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/report.md`
      - 当前结果：
        - `Phase 3 Cluster Preferred = passed`
        - `21/21`
        - `Registry Health = aligned`
      - 当前真实总耗时：
        - `100160ms`
        - 约 `1m 40s`
    - 这意味着：
      - `Task 1.6` 现在已经不只是“real 模式能启动”
      - 而是已经拿到一份正式的 `cluster-preferred real` 通过留档
      - 这条线上当前主要剩余工作，已经从“修缺入口”
      - 切换成“继续收完整 real 总留档与时长门槛”
    - 这轮关键回归已经重新收绿：
      - `@mindanchor/domain build` 已通过
      - `apps/api` Phase 1 关键回归已通过
      - `apps/web test` 已通过
      - `apps/web build` 已通过
      - 最近一轮结果为 `65 passed`
    - 这轮新增验证结果：
      - `node --test scripts/__tests__/core-phase-openclaw-registry.test.mjs` 已通过
      - `node --check scripts/run-core-phase-tests.mjs` 已通过
      - `docs/core-phase-test-runbook.md` 已补上新的 registry 健康摘要与 phase gate 说明
      - `@mindanchor/macos test` 已通过
      - 这一轮又继续确认：
        - `node --test scripts/__tests__/core-phase-openclaw-registry.test.mjs` 已通过
        - `node --test scripts/__tests__/core-phase-real-preflight.test.mjs` 已通过
        - `node --test scripts/__tests__/openclaw-node-runtime.test.mjs` 已通过
        - `node --test scripts/__tests__/core-phase-progress.test.mjs` 已通过
        - `node --test scripts/__tests__/core-phase-selection.test.mjs` 已通过
        - `node --test scripts/__tests__/core-phase-segments.test.mjs` 已通过
        - `corepack pnpm test:core-phases:local -- --phases stub`
          - 已确认新参数与 step 级日志生效
        - `corepack pnpm test:core-phases:local -- --phases stub --segments baseline`
          - 已确认更细 segment 参数生效，并能快速完成一轮最小留档
        - `corepack pnpm --filter @mindanchor/api build` 已继续通过
    - 这轮也顺手把当时挡住 `test:core-phases:local` 的 `apps/api` TypeScript 漂移收口了：
      - 去掉了 `apps/api/src/app.ts` 里重复的 domain import
      - 在 `agent-memory-service` / `agent-memory-proposal-service` 里把 persona `memoryScopes` 做了本地宽化，避免 tuple-union 把 `.includes()` 收窄成 `never`
      - 在 `conversation-coach-service` 里把 retry 流程中的 `sourceUserText` 提前收成非空局部变量，消掉闭包里的 `string | null`
      - 给 `openclaw/runtime/*.mjs` 和 `openclaw/runtime/workflows/*.mjs` 补了 sidecar `.d.mts` 声明，恢复 API 对 native OpenClaw runtime 的类型可见性
    - 这轮进一步验证结果：
      - `corepack pnpm --filter @mindanchor/api build` 已重新通过
      - `corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts tests/conversation-coach.integration.test.ts tests/agent-memory-service.test.ts tests/agent-team-service.test.ts --no-file-parallelism` 已通过
      - 最近一轮关键 API 回归结果为 `71 passed`
      - `corepack pnpm test:core-phases:local` 已重新通过，并成功产出新的 `report.md`
      - `apps/macos` 这轮聚焦测试：
        - `AppViewModelAuthTests`
        - `MacAutomationTests`
        - 全量 `@mindanchor/macos test`
        都已通过
  - 还差什么：
    - 现在已经把 `/health` 自报 contract 和真实 execute probe 都纳入第一版对照
    - Mac / Web 也都已经开始直接消费压缩后的健康摘要
    - 主链路 runbook 和 phase gate / pass-fail 口径这一层，现在也已经开始收口
    - 由于脚本输出、phase gate、runbook、API 构建漂移这轮都已经开始收口
    - 下一步更适合继续往：
      - `test:core-phases:real`
      - 真实回归结果留档
      - 如果时长仍过长，再继续补：
        - live report snapshot
        - 更细的分段回归口径
      - 更完整的主链路 runbook / 验收包
      - Mac 前台继续消费这套统一 phase / registry 诊断
        - 例如把 phase / route / fallback 的更紧凑摘要继续带进 Today / Coach

#### Phase 1 任务顺序

推荐固定按这个顺序做：

1. Task 1.1
2. Task 1.2
3. Task 1.5
4. Task 1.4
5. Task 1.3
6. Task 1.6

原因：

- 先把入口和 memory 收紧，再补 trace，后面的 authority 和 learning 才不会继续乱长。

按当前实际进度，建议的下一步顺序更新为：

1. 继续补完 Task 1.5
2. 再处理 Task 1.6
3. 如有必要，再回头做 `Task 1.4` 的小收尾
4. 然后才进入 Phase 2

原因：

- 现在 `Task 1.3` 已经进入阶段性收口，下一步最值钱的是把 trace 口径和外部 OpenClaw contract 补齐，否则后面进 Mac 前台仍然容易出现“看起来能用，但解释和外部实例不一致”的问题。

#### Phase 1 完成标记

只要还有下面任意一种情况，就说明 Phase 1 还没完成：

- 用户看到的主要回复还经常不是 OpenClaw 主路径产出
- memory 命中来源还说不清楚
- feedback 还没有真实影响 preference / habit learning
- trace 还看不出这次到底是谁在主导
- 外部 OpenClaw 接进来后行为明显漂移

### Phase 2｜再把 Mac 前台闭环收紧

这一阶段的重点，是把前面已经收紧的核心链，稳定地展示给用户、交给用户使用。

这一阶段主要解决什么：

- 用户能不能清楚看懂当前回答、提醒、memory、动作之间的关系
- 对话、提醒、通知、窗口恢复、ack、feedback 能不能形成稳定闭环
- Mac 客户端是不是已经足够像一个成熟产品，而不只是开发界面

这一阶段主要做哪些事：

- 继续收紧 `apps/macos`
  - Coach 页面更清楚展示当前 front agent、consulted agent、memory 使用情况
  - 把对话结果、execution trail、feedback、memory revoke/accept 展示得更清楚
  - 把提醒列表、系统通知、打开主窗口、ack 这条链继续做稳
  - 把 Today / Coach / Reminders / Settings 的信息优先级继续收口
  - 把双语文案继续补齐，保证中文默认体验自然
- 继续补自动验收
  - 原始文本输入并发送
  - OpenClaw 返回对话
  - reminder 到达
  - 系统通知动作
  - 打开窗口
  - ack / revoke / feedback

这一阶段明确先不做什么：

- 不优先再扩很多新页面
- 不优先做大规模视觉重做
- 不优先把很多本来应该在 Gateway/OpenClaw 做的逻辑搬到客户端

这一阶段什么时候算完成：

- 用户能在 Mac 前台直接看懂：
  - 当前是谁在响应
  - 为什么这么回答
  - 用了哪些记忆
  - 当前有哪些待处理提醒
- 对话 -> reminder -> 系统通知 -> 主窗口 -> ack 这条链稳定可回归
- GUI 自动验收能覆盖关键主链，不再只靠手工感觉
- Mac 前台对主链的展示是清楚的，而不是信息很多但逻辑散

一句话：

- Phase 2 的目标，就是把“已经有的大脑”真正做成“用户每天能用的前台”。

#### Phase 2 任务树

- Task 2.1｜收紧 Coach 对话区
  - 把对话区继续做成真正稳定的主工作区
  - 清楚展示当前是谁在响应
  - 清楚展示当前有没有 consult、有没有 handoff
- Task 2.2｜补清 memory explainability
  - 在前台更清楚地展示：
    - 本次回复用了哪些 memory
    - 哪些是 preference
    - 哪些是 habit
    - 哪些已经 revoked / inactive
  - 让用户看得懂，不靠猜
- Task 2.3｜收紧提醒闭环
  - 把 reminder 列表、系统通知、打开主窗口、ack 继续做稳
  - 把 pending / snooze / handled 的状态更清楚地展示出来
  - 确保提醒不是“到了但不知道怎么处理”
- Task 2.4｜收紧 Today / Coach / Reminders 的信息优先级
  - 减少同屏信息过多、逻辑分散
  - 明确哪些信息是现在最重要的
  - 让主窗口更像成熟产品，而不是开发台
- Task 2.5｜补稳系统通知真实动作
  - 继续把真实 macOS 系统通知弹出、点击、聚焦窗口这条链做稳
  - 解决自动验收和真实机器表现不一致的问题
- Task 2.6｜补全 GUI 自动验收主链
  - 继续把下面这些动作纳入稳定回归：
    - 原始文本输入
    - 发送消息
    - OpenClaw 返回
    - reminder 到达
    - 系统通知动作
    - 打开窗口
    - ack
    - feedback
    - memory revoke
- Task 2.7｜收尾双语前台体验
  - 继续补齐中文 / 英文文案
  - 保证默认中文自然、统一
  - 保留 agent 名和专有名词英文不乱掉

#### Phase 2 任务顺序

推荐固定按这个顺序做：

1. Task 2.1
2. Task 2.2
3. Task 2.3
4. Task 2.5
5. Task 2.6
6. Task 2.4
7. Task 2.7

原因：

- 先把对话、memory、提醒三块主闭环收紧，再去做更整体的信息层次和文案收尾。

#### Phase 2 完成标记

只要还有下面任意一种情况，就说明 Phase 2 还没完成：

- 用户在前台还看不懂这次是谁在回复
- 用户还看不懂用了哪些 memory
- reminder 到达后，通知 / 主窗口 / ack 还不够稳
- GUI 自动验收还覆盖不到关键主链
- 页面信息还明显偏乱、偏散

### Phase 3｜最后再收紧辅助面和交付面

这一阶段不是主脑，也不是主前台，而是把辅助层和交付层整理到可长期维护。

这一阶段主要解决什么：

- 调试和查看是不是足够顺手
- runbook、验收、发布说明是不是足够清楚
- 项目是不是已经具备更稳定的交付面，而不是只靠开发者脑内记忆

这一阶段主要做哪些事：

- 继续收紧 `apps/web`
  - 只补对主线有帮助的调试、trace、registry、read model 可见性
  - 保证 Web 是辅助控制台，不反客为主
- 继续收紧 `docs`
  - 主 spec 持续记录新决策
  - runbook、树形文档、验收记录持续同步
  - 把“怎么启动、怎么验证、哪里容易坏”写得更直白
- 继续收紧 `scripts`
  - 让最关键的主链回归命令更稳定
  - 把本地开发、联调、验收、预发布检查继续做清楚
- 再整理发布外围
  - 只在不影响前两阶段的前提下，补发布清单、预发布检查、安装说明

这一阶段明确先不做什么：

- 不把外围发布工程重新抬成当前第一优先级
- 不因为写文档、做包装，就反过来拖慢主链收口

这一阶段什么时候算完成：

- Web、scripts、docs 都清楚地服务主线，而不是各自长成一套平行系统
- 新人接手时，能更快理解：
  - 主线是什么
  - 怎么启动
  - 怎么看 trace
  - 怎么验收
- 发布与验收相关资料已经足够清楚，但没有抢占主链开发资源

一句话：

- Phase 3 的目标，就是把“主线周边”整理好，让项目能更稳定地继续往前走。

#### Phase 3 任务树

- Task 3.1｜收紧 Web 辅助控制台
  - 只保留和增强真正有助于主线的内容：
    - trace
    - registry
    - read models
    - debug / regression
  - 避免再开很多和主线没直接关系的新页面
- Task 3.2｜收紧 runbook 体系
  - 让本地启动、联调、验收、排障的文档更直白
  - 明确“看哪份文档就够了”
  - 减少重复文档和口径不一致
- Task 3.3｜收紧自动化脚本入口
  - 把最关键的测试命令整理得更清楚
  - 让开发、联调、验收、预发布检查各自入口明确
  - 减少“脚本很多但不知道该跑哪个”
- Task 3.4｜收紧主 spec 和决策台账
  - 每次方向变化都继续写回主 spec
  - 保证后续做事时不再偏离已确认决定
  - 保证树形文档、spec、runbook 不互相打架
- Task 3.5｜补齐主线验收包
  - 整理当前最关键的：
    - 本地验收
    - GUI 验收
    - API / OpenClaw 联调验收
    - 发布前检查
  - 让“验收主链是否可用”变得更简单
- Task 3.6｜最后再整理交付外围
  - 安装说明
  - 启动说明
  - 预发布清单
  - 发布前检查
  - 只在不影响前两阶段时推进

#### Phase 3 任务顺序

推荐固定按这个顺序做：

1. Task 3.2
2. Task 3.3
3. Task 3.4
4. Task 3.1
5. Task 3.5
6. Task 3.6

原因：

- 先把“怎么做、怎么验、怎么不跑偏”整理清楚，再补 Web 和外围，会更稳。

#### Phase 3 完成标记

只要还有下面任意一种情况，就说明 Phase 3 还没完成：

- 新人接手时，还是不知道从哪份 runbook 开始
- 测试和验收命令还是分散得很乱
- spec、树形文档、runbook 的说法还不一致
- Web 还没有真正服务主线调试
- 发布外围材料还会反过来干扰主线推进

---

## 9. 阶段之间的顺序关系

现在已经不能只按“前三阶段”来理解全项目了。

正确顺序更新为：

1. Phase 1：先收紧 `apps/api + openclaw`
2. Phase 2：再收紧 `apps/macos`
3. Phase 3：再收紧 `apps/web + docs + scripts + 交付外围基础`
4. Phase 4：再做 `OpenClaw` 主脑定版
5. Phase 5：再做商用级可靠性与质量闸门
6. Phase 6：最后做正式交付与上线准备

原因很简单：

- 如果 Phase 1 还没收口，Phase 2 做再多，也容易只是包装一个还没稳定的大脑
- 如果 Phase 2 还没收口，Phase 3 做再多，也只是把说明文档和辅助台写得更完整
- 如果 Phase 4~7 不补上，那项目即使“能跑”，也还达不到最开始要求的成熟商用标准

所以真正的顺序不是：

- 哪块看起来缺就先补哪块

而是：

- 永远先补最靠近主链核心、最接近最终交付门槛的地方

---

## 10. 当前默认执行顺序（旧三阶段口径已升级）

如果不再额外讨论，后面默认执行顺序按下面这棵树走：

- Phase 1｜核心主链
  - `apps/api`
  - `openclaw`
  - 当前顺序：
    - Task 1.5 -> 1.6 -> 必要时回头 1.4
- Phase 2｜Mac 前台闭环
  - `apps/macos`
  - Task 2.1 -> 2.2 -> 2.3 -> 2.5 -> 2.6 -> 2.4 -> 2.7
- Phase 3｜辅助面和交付基础
  - `apps/web`
  - `scripts`
  - `docs`
  - 发布外围基础
  - Task 3.2 -> 3.3 -> 3.4 -> 3.1 -> 3.5 -> 3.6
- Phase 4｜OpenClaw 主脑定版
  - external runtime / registry / route / fallback / contract
- Phase 5｜商用级可靠性与质量闸门
  - latency / quality / reliability / stable acceptance
- Phase 6｜正式交付与上线准备
  - deployment / onboarding / release gate / final acceptance

最后再说一次最重要的判断标准：

- 这件事是不是直接让主线更成熟、离最终交付更近？

如果答案不是“是”，那它默认就不该排到前面。

---

## 11. 对照最初标准的判断（更新到 2026-03-24）

这里不讲客气话，只讲判断。

### 11.1 当前主线方向有没有偏移

结论：

- **主线方向目前没有根本性偏移。**

原因：

- 现在真正的主线仍然是：
  - `apps/macos`
  - `apps/api`
  - `openclaw`
- `Gateway / 现有库` 仍然被当作 memory 真相源
- `OpenClaw` 仍然被当作真正的 agent 运行面，而不是客户端本地 heuristic
- `Mac` 仍然是主入口，不是 `Web`、不是旧 `Electron`

但也要明确一个事实：

- **执行节奏上，前面有过“前台、脚本、文档先跑了一段，核心主脑还没完全收口”的倾向。**
- 这个倾向现在已经在树形文档里被纠正回来。
- 所以后续判断不能只看“做了很多东西”，而要看：
  - 用户输入后的主要结果，是否真的稳定来自 `OpenClaw`
  - `Gateway` 是否已经把 memory / trace / authority 收成单一主链

一句话：

- **方向没有跑偏，但完成度离最开始要的标准还差明显一截。**

### 11.2 当前进展能不能达到最开始要求的标准

最开始要求的标准，不是“能跑”，而是下面这组更高标准：

- Mac 是真正可日用的主入口
- OpenClaw 是真正的主脑和主要输出来源
- 产品是成熟、完整、可商用的一版
- 核心闭环能稳定验收，而不是靠感觉

对照当前状态，结论是：

- **现在还不能直接算达到这个标准。**

原因不是某一个点没做，而是还有 5 个关键缺口没有完全收口：

#### 1. OpenClaw 还没有完全变成“唯一稳定的用户可见主脑”

- 虽然 conversation、consult、authority、memory 已经在往 OpenClaw 收
- 但“用户输入 -> Picard 路由 -> front persona -> consult / authority -> 最终回复 -> 后续读模型回流”还没有完全收成唯一稳定主链
- 这意味着现在还不能说：
  - 所有主要用户可见内容都稳定由 OpenClaw 主链产出

#### 2. Mac 前台还没有到“成熟商用品质”

- `apps/macos` 已经成形了
- 但还没有到“普通用户每天稳定使用都不会明显感到开发态”的程度
- 主要还差：
  - 更稳定的系统通知点击闭环
  - 更清楚的 memory explainability
  - 更稳定的对话 / 提醒 / ack / feedback / revoke 全自动闭环
  - 更少的开发台感和信息散乱感

#### 3. 商用交付需要的上线闸门还没真正立起来

- 当前有 runbook、脚本、验收记录
- 但离“可商用交付”还差：
  - 统一上线门槛
  - 明确 latency / quality / fallback 指标
  - 真实 clean install / clean machine 验收
  - 更稳定的登录、设备绑定、部署与故障恢复闭环

#### 4. 外部独立 OpenClaw 的对齐还没到最终验收态

- 现在已经能看到 native registry、visibility、external reachability
- 但“外部独立 OpenClaw 真正作为长期主脑稳定运行”这件事，还没有完全验收完
- 这也是为什么现在不能直接把系统说成“已经达到最终形态”

#### 5. 目前三阶段计划还不够覆盖“商用达标”最后一段路

- 现在文档里的 `Phase 1~3`
  - 更像“把主链拉直、把前台补齐、把外围整理好”
- 但它们还没有完整覆盖：
  - OpenClaw 主脑定版
  - 商用级可靠性门槛
  - 正式交付 / 上线前验收门槛

所以判断很直接：

- **按现在的方向继续做，是有机会达到最开始要求的标准的。**
- **但按当前完成度，还远没有达到。**
- **当前不是“方向不对”，而是“最后几段 hardest part 还没收口”。**
- **而且即使已有 `Phase 4~7`，如果不把“人格安全 / 心理边界”和“普通用户自部署交付成功率”写成硬任务，也仍然不够稳。**
- **所以当前方向是对的，但计划还要继续补硬门槛任务。**

再补一条今天的最新判断：

- 从仓库结构、当前代码落点、最近这轮回归结果来看：
  - **方向本身仍然能做到最开始要求的标准**
  - **所以当前继续保留 `Phase 1 ~ Phase 7` 这套阶段树，不再继续扩成 `Phase 8`**
- 但从真实 GUI E2E 的阻塞看：
  - `OpenClaw registry` 这条线已经开始进入更硬的验收态
  - 真正新的主阻塞已经进一步前移到：
    - macOS 通知权限恢复成功记录
    - clean-machine 交付 gate
    - 外部 OpenClaw 真主脑彩排
    - `test:core-phases:real` 的最终报告和可接受运行时长
- 这意味着：
  - 现有 `Phase 1~7` 的大方向仍然成立
  - 但必须继续把 `Phase 5` 和 `Phase 6` 里的恢复链、启动面与 clean-machine 任务做成真正的退出门槛
  - 否则最后仍然可能出现“功能看起来都在，但普通用户启动不稳”的假完成

再说得更直白一点：

- **当前方向是对的。**
- **当前完成度还不够称为“成熟、完整、可商用”。**
- **现在最多能说：已经从“原型/开发态主链”进入了“可持续收口的产品主链”，但还没到最终交付线。**
- **这次再往前看，真正的新缺口已经不是“能不能跑 real 模式”，而是“real 模式能不能收成正式质量门槛”。**

### 11.3 当前阶段真实进度

为了避免“看起来都在推进，但其实优先级混了”，这里把当前真实状态重新压缩成一句话：

- `Phase 1`：**进行中，而且仍然是第一优先级**
- `Phase 2`：**已做了不少前置工作，但本质上还不能算完成**
- `Phase 3`：**已经有部分基础资产，但只能算辅助层预铺，不算收口完成**

更直白地说：

- `apps/macos` 已经不是空壳
- `apps/api` 已经不是空壳
- `openclaw` 已经不是空壳
- **但三者之间还没有完全达到“成熟商用品质”的统一闭环**

---

## 12. 现阶段计划进度重排

为了让后面不再误判，当前计划进度统一改成下面这个口径：

### Phase 1｜先把核心主链收紧

- 当前状态：
  - **进行中**
- 完成度判断：
  - **已进入验收前收口阶段，但还没有达到退出标准**
- 当前重点：
  - `Task 1.3`
  - `Task 1.5`
  - `Task 1.6`
- 当前最新进展：
  - `core-phases:local` 已重新恢复通过
  - API 构建漂移已收口
  - Registry 健康摘要已经同时进入：
    - Mac
    - Web
    - phase 脚本
  - 说明 `Phase 1` 已经不再是“基础还没站住”，而是“正在逼近统一验收口径”

### Phase 2｜再把 Mac 前台闭环收紧

- 当前状态：
  - **已明显推进，但不能视为完成**
- 已有基础：
  - 多页面壳
  - 菜单栏
  - Coach / Reminders / Settings / Today
  - 一部分 GUI 验收
  - Registry 健康摘要已进入 `Settings`、`Today` 和自动验收快照
- 还没完成的关键点：
  - 真实系统通知点击闭环
  - 对话 / reminder / ack / feedback / revoke 稳定闭环
  - 用户可见 explainability
  - 前台成熟度与信息优先级收口

### Phase 3｜最后再收紧辅助面和交付面

- 当前状态：
  - **已部分收口，但还不算真正完成**
- 已有基础：
  - runbook
  - scripts
  - tree status
  - spec / 决策台账
  - Web 辅助面
  - core-phase runbook / report / registry phase gate 已开始统一
- 还没完成的关键点：
  - 验收入口统一
  - 文档口径完全一致
  - Web 完全服务主线而不反客为主
  - 交付外围真正变成“可交付”，而不只是“资料已经很多”

### Phase 4｜OpenClaw 主脑定版

- 当前状态：
  - **已明显推进，但还没有过主脑验收线**
- 已有基础：
  - `Task 4.1` 已基本落地
  - `Task 4.2` 已基本落地
  - `Task 4.3` 已基本落地
  - `Task 4.4` 已进入 external runtime 验收阶段
- 当前最关键的未完成点：
  - `Task 4.5` 还没完成
  - 真实 GUI `openclaw registry e2e` 当前主阻塞已经不再是登录 / bootstrap
  - 而是：
    - 通知权限恢复后能不能继续稳定跨过最后的系统门槛
    - 外部 OpenClaw 真主脑口径能不能按交付标准留档
  - 这说明“主脑 contract”已经开始稳了，但“主脑真正稳定接入 Mac 前台并完成交付彩排”还没完全稳

### Phase 5｜商用级可靠性与质量闸门

- 当前状态：
  - **已进入中段，但只完成了后半段的关键基础，还没有过质量门槛**
- 已有前置基础：
  - `core-phases:local`
  - `macos test`
  - conversation / trace / registry 相关回归
  - 部分 GUI / E2E 脚本
  - `doctor / repair / recover / assess` 这组通知恢复与交付 gate 工具链
- 当前最关键的未完成点：
  - latency / quality / fallback 指标还没形成固定报表
  - `Task 5.8 ~ 5.12` 已经把启动面、恢复链、权限边界做出了第一版工具和判断
  - 但还缺：
    - 至少一轮真实恢复成功记录
    - 至少一轮 clean-machine 口径复验
    - GUI / API / OpenClaw 全闭环的稳定全自动验收
    - 前半段 `5.1 ~ 5.7` 的质量指标正式报表
    - 至少一轮完整 `test:core-phases:real` 最终报告与运行时长留档

### Phase 6｜正式交付与上线准备

- 当前状态：
  - **已开始进入交付 gate 设计，但还没有过首次交付彩排**
- 已有前置基础：
  - 登录接口
  - `/me` / `/client/bootstrap`
  - 设备注册与心跳接口
  - runbook / 发布脚本 / 签名检查脚本
  - 交付 gate 评估入口：
    - `corepack pnpm assess:macos:openclaw-registry-delivery-gate`
- 当前最关键的未完成点：
  - clean machine 首次连接还没有形成稳定彩排
  - 当前宿主真实结果仍是：
    - `deliveryGateStatus=manual_step_pending`
  - 说明：
    - 现在已经进入“可以支持交付、但仍待最后一步人工完成”的状态
    - 还不能把这台机器当成正式交付通过样板
  - 外部独立 OpenClaw 面向普通用户的连接流程还没有被真正走通
  - 签名 / 公证恢复仍然在后置状态

---

## 13. 新增阶段计划树

因为当前 `Phase 1~3` 还不足以覆盖“成熟、商用级、OpenClaw 为真正主脑、Mac 为主入口”的最终标准，所以这里补三段新阶段。

更新到 2026-03-24 的判断是：

- 这套 `Phase 1~7` 仍然足够覆盖最开始要求的标准
- **当前不再新增 `Phase 8`**
- 但需要继续把 `Phase 5` / `Phase 6` 的恢复链、启动面稳定性和 clean-machine 真彩排补成真正可退出的硬任务

后面默认阶段顺序更新为：

1. Phase 1：核心主链收紧
2. Phase 2：Mac 前台闭环收紧
3. Phase 3：辅助面和交付面收紧
4. Phase 4：OpenClaw 主脑定版
5. Phase 5：商用级可靠性与质量闸门
6. Phase 6：正式交付与上线准备
7. Phase 7：商用封板与最终交付门槛

### Phase 4｜OpenClaw 主脑定版

这一阶段的目标不是“继续接更多 agent”，而是把这句话真正做实：

- **OpenClaw 是唯一稳定的用户可见主脑。**

这一阶段主要解决什么：

- 用户可见回复是否真的默认来自 OpenClaw 主链
- `Picard -> front persona -> consult / authority` 是否已经是唯一稳定入口
- 外部独立 OpenClaw 是否已经能和仓库内 runtime 对齐到验收级别

#### Phase 4 任务树

- Task 4.1｜收敛唯一 conversation channel
  - 把用户输入后的主要前台路径彻底收敛到单一 conversation 主链
  - 明确 fast / full / consult / authority 的唯一入口和组装口径
  - 当前已完成：
    - `send` / `retry` 都已经统一返回 turn-level response：
      - `userMessage`
      - `assistantMessage`
      - `frontAgentState`
      - `fastResponse`
      - `traceId`
    - Mac 前台不再把 `retry` 当成单独旧协议去解
    - API / macOS 两边都已经补齐了这套统一 contract 的回归测试
- Task 4.2｜固定 Fast / Full 协议
  - 把 fast / full 的行为边界、覆盖关系、回退关系固定下来
  - 不再让前台展示和服务端行为持续漂移
  - 当前已完成：
    - `retry` 现在已经跟 `send` 对齐成同一套节奏：
      - 先返回 `assistantMessage.status = pending_full`
      - 先给前台稳定的 `fastResponse`
      - 再由后台补齐 `fullResponse`
    - `retry` 遇到“已有 fast、缺 full”的消息时：
      - 不再重跑新的 fast 文本
      - trace 里不会再多打一轮 `coach.message.fast.started/completed`
      - 只继续走 full completion 主链
    - `full` 完成后不再覆盖最初那条 fast 文本
      - 这样 fast 成为稳定的首响记录
      - full 成为后续覆盖展示的完整正文
    - Mac 前台现在已经收成“单正文展示”：
      - pending 时优先显示 fast
      - completed 时原位切到 full
      - failed / 无 full 时继续保留 fast 作为兜底正文
      - 不再把同一条 assistant message 画成 `Fast Response + Full Response` 两段并列
    - session detail 刷新口已经补了三种状态 contract 回归：
      - `pending_full`
      - `completed`
      - `failed`
      - 并且同时锁住了 `usedMemoryEntries` 与 `conversationPath`
- Task 4.3｜固定 front / consult / authority trace contract
  - 让每次对话都能稳定看出：
    - 谁前台出面
    - 谁被 consult
    - 谁做 authority
    - 最终为什么这么说
  - 当前已完成：
    - `coach message` 现在已经直接带：
      - `frontAgent`
      - `consultedAgent`
      - `authorityAgent`
      - `authorityTarget`
      - `authorityExecutionStatus`
      - `runtimeSource`
      - `primaryRoute`
      - `usedOpenClaw`
      - `hadFallback`
      - `degraded`
      - `degradedReason`
      - `revokedMemoryCount`
    - Mac 的 execution trail 已经优先从 message-level contract 直接渲染：
      - consult 人格
      - authority 人格 / 动作 / 状态
      - memory revoked
      - degraded / fallback
    - 这意味着“看一次消息就知道这轮是谁出面、有没有 consult、有没有 authority、有没有撤销记忆、有没有降级”
    - `/debug/traces/:traceId` 仍保留，但定位回“诊断补充信息”，不再是正常前台展示的主路径
- Task 4.4｜对齐外部独立 OpenClaw 运行面
  - 把 external runtime 的 registry、workflow、route、health、fallback 对齐到最终验收态
  - 避免“仓库内能跑，外部实例一接就变味”
  - 当前已完成：
    - `apps/macos` 现在已经不只吃压缩后的 `healthStatus / healthReasonCodes`
    - 还开始直接解码并消费这几类 external runtime contract 漂移：
      - `contractMismatches`
      - `runtimeContractMismatches`
      - `workflowContractMismatches`
      - `workflowResponseContractMismatches`
      - `workflowExecutionContractMismatches`
      - `workflowExecutionProbeMismatches`
    - `Settings -> OpenClaw Registry` 里现在会继续显示紧凑的 contract 对照摘要
      - 可以直接看到是：
        - 哪个 persona contract 漂了
        - 哪条 workflow payload / response 漂了
        - 哪条 execute contract / execute probe 漂了
      - 不再只知道“有问题”，而不知道到底是哪一层漂了
    - `apps/macos` 的 registry payload 解码回归已经补齐：
      - 现在会锁住上述几类 mismatch 的 decode
    - `AppViewModelAuthTests` 也已经补上：
      - 确保前台能把这些 mismatch 家族压成稳定可读的摘要行
    - `MacAutomation` 快照现在也开始带这组 contract 对照摘要：
      - `openClawRegistryContractSummaryLines`
      - 这意味着后面做 GUI 自动验收时
        - 不只知道 Registry 是 warning / danger
        - 还能直接看到是 runtime contract、workflow response、还是 execute probe 在漂
    - 已补自动验收回归：
      - `MacAutomationTests` 现在会锁住这组 snapshot 字段
    - 已把这组 contract 摘要真正接进 `scripts/run-macos-openclaw-registry-e2e.mjs`
      - 健康态 `Today` 快照现在会主动检查：
        - `openClawRegistryContractSummaryLines` 必须为空
        - 如果“表面 good、实际 contract 已漂”，脚本会直接失败
      - E2E 成功日志里也会明确打印：
        - `today contract summary`
        - `outage contract summary`
      - 这样后续看到失败时，不会只知道“Registry 不对”，而是能直接看到哪类 contract 漂了
    - 已新增一层轻量 Node 回归：
      - `scripts/openclaw-registry-e2e-assertions.test.mjs`
      - 专门锁住：
        - 空摘要时通过
        - 有 drift 摘要时抛出可读错误
      - 根脚本入口已补：
        - `corepack pnpm test:macos:openclaw-registry-contract`
        - `corepack pnpm test:macos:openclaw-registry-e2e`
  - 当前验证：
    - `corepack pnpm --filter @mindanchor/api build` 已通过
    - `corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach.integration.test.ts tests/debug-trace-summary.integration.test.ts --no-file-parallelism` 已通过
    - `node --test scripts/openclaw-registry-e2e-assertions.test.mjs` 已通过
    - `corepack pnpm --filter @mindanchor/macos test` 已通过
    - `corepack pnpm test:core-phases:local` 已继续通过
    - 这一轮又继续把真实 GUI E2E 往前推进了一段：
      - 已确认此前“等待 macOS 客户端登录超时”的关键根因之一是：
        - registry E2E 里的 fake runtime `/health` / execute contract 已经过时
        - 以及固定 bundle id 会让这条链更容易漂
      - 现在 registry E2E 已切到：
        - 唯一 bundle id
        - 仓库内真实 `openclaw/local-cluster-server.mjs`
        - 更硬的启动面 / contract drift 验收
      - 当前 `node scripts/run-macos-openclaw-registry-e2e.mjs` 已经能稳定推进到：
        - 登录成功
        - `Today` 页 `OpenClaw Registry 已对齐`
        - 关闭 runtime 后进入 `OpenClaw Registry 不可达`
      - 这说明：
        - 登录 / bootstrap / registry refresh 这条链已经明显前进
        - 现在新的主要阻塞不再是登录
      - 当前新的剩余阻塞已经收敛为：
        - `等待 macOS 通知权限就绪超时`
        - 以及后续真实 system notification click 自动化
      - 为了继续推进这一段，已新增一条前台自动化能力：
        - `request_notification_permission`
        - 允许 GUI 自动验收显式拉起通知授权请求
        - 对应 `MacAutomationTests` 已补回归
      - 也就是说：
        - `Task 5.8` 已经从“启动面失联”推进到“通知权限 / 真实点击”这一层
        - 主阻塞已经明显变小
- Task 4.5｜完成 OpenClaw 主脑验收
  - 对真实用户可见主链做一次“默认由 OpenClaw 产出”的验收闭环
  - 当前这一轮已新增正式验收产物：
    - `corepack pnpm accept:openclaw-mainline`
    - 输出：
      - `tmp/openclaw-mainline-acceptance-report.json`
      - `tmp/openclaw-mainline-acceptance-report.md`
  - 最近一轮真实结果：
    - `status = passed`
    - `duration = 2139ms`
    - 4 条核心主脑链全部通过：
      - Picard routing
      - consult chain
      - Jarvis authority handoff
      - Data governance handoff

#### Phase 4 完成标记

- 用户主要可见回复默认稳定来自 OpenClaw 主链
- front / consult / authority / fallback 在 trace 里一眼可读
- 外部独立 OpenClaw 与当前 runtime 对齐到可验收状态

### Phase 5｜商用级可靠性与质量闸门

这一阶段的目标，是把“已经能跑的主线”提升到“可以作为商用品质交付”的水平。

这一阶段主要解决什么：

- 延迟是否稳定
- 输出质量是否可观测
- 失败时是否可恢复
- GUI / API / OpenClaw 三条验收是否形成稳定门槛

#### Phase 5 任务树

- Task 5.1｜建立主链 latency 指标
  - 固定 fast、full、memory retrieve、authority、read-model 回流的耗时统计
- Task 5.2｜建立主链 quality 指标
  - 固定 helpful / unhelpful / revoke / fallback / retry 的质量观测
- Task 5.3｜建立可靠性门槛
  - 固定 malformed output、fallback rate、apply failure、notification failure 的门槛
- Task 5.4｜收紧自动验收闭环
  - 把 GUI、API、OpenClaw 联调的关键闭环变成稳定回归
  - 重点覆盖：
    - 发消息
    - OpenClaw 返回
    - reminder 到达
    - 系统通知动作
    - 主窗口恢复
    - ack / feedback / revoke
- Task 5.5｜收紧异常恢复链
  - 网络异常、OpenClaw 不可达、登录态异常、读模型刷新异常时，要有可读恢复路径
- Task 5.6｜收紧人格安全与心理边界闸门
  - 对多 persona agent team 增加明确的安全边界检查：
    - 不过度替用户做高风险现实决策
    - 不制造情绪依赖
    - 不把临时情绪波动误写成长期人格定论
    - authority apply 继续保持 proposal / apply 的清晰边界
  - 把这部分纳入主链验收，而不是只靠提示词“希望它安全”
- Task 5.7｜建立普通用户自部署成功率闸门
  - 不再只看“工程师能不能把 Gateway / OpenClaw 跑起来”
  - 要开始固定检查：
    - clean machine 按文档启动是否成功
    - 首次登录 / 连接 / bootstrap 是否稳定
    - 失败时是否能靠诊断包和 runbook 自助恢复
  - 这条要作为商用级可靠性门槛，而不是只留到最后发布时才想起
- Task 5.8｜建立真实启动面稳定性闸门
  - 把“App 能启动”细化成一条真正可验收的链：
    - 启动客户端
    - 自动或手动登录
    - session restore
    - `/client/bootstrap`
    - `devices/register`
    - `devices/heartbeat`
    - `OpenClaw Registry` 首次刷新
  - 当前新增这条任务的直接原因：
    - `scripts/run-macos-openclaw-registry-e2e.mjs` 已经能验 contract drift
    - 但真实链路现在卡在“等待 macOS 客户端登录超时”
    - 所以启动面稳定性必须从“隐性前置条件”升级成正式 gate
  - 最近新增进展（2026-03-24）：
    - 已把 `scripts/lib/macos-app-launcher.mjs` 从“直接跑二进制”切到：
      - `open -n -a <app> --env ... --args`
      - 也就是改成走 `LaunchServices` 正式启动路径
    - 已把 `registry e2e` 的 bundle id 固定为稳定值：
      - `com.mindanchor.mac.openclaw.registry.e2e`
      - 不再每轮随机生成
      - 这样后面不管走：
        - 手动一次性授权
        - 通知设置 profile 预授权
      - 都终于有了可复用的目标 bundle
    - 对应 Node 回归已补并通过：
      - `scripts/__tests__/macos-app-launcher.test.mjs`
    - 已给 macOS 客户端补上通知权限诊断日志：
      - `apps/macos/Sources/Core/NotificationPermissionDebugLogger.swift`
      - `PermissionsDiagnostics` 现在会记录：
        - 谁触发了通知授权
        - 授权前系统状态
        - `requestAuthorization` 是否返回 / 抛错
        - 授权后系统状态
    - `scripts/run-macos-openclaw-registry-e2e.mjs` 失败时现在会直接带出：
      - `notification-debug.log`
      - 不再只能看到“超时”，而不知道卡在哪一步
    - 已确认一个重要根因：
      - `bootstrap-auto-request` 会把通知权限链路打坏
      - 在自动验收里如果先触发 bootstrap 自动请求，后续显式 automation 请求会直接进入 `denied`
    - 已把这个结论正式收进 `registry e2e`：
      - `scripts/run-macos-openclaw-registry-e2e.mjs` 现在默认关闭
        - `MINDANCHOR_AUTO_REQUEST_NOTIFICATIONS_ON_BOOTSTRAP`
      - 避免真实验收先被 bootstrap 自动请求污染
    - 已确认当前更硬的剩余 blocker：
      - 当禁用 bootstrap 自动请求后，
      - `automation-command` 会从 `notDetermined` 进入 `requestAuthorization starting`
      - 但不会返回
      - 说明系统正在等待用户响应，而不是请求根本没发出去
    - 已进一步确认：
      - 当前 host 上真实弹出的权限窗属于 `SecurityAgent`
      - 这不是 `NotificationCenter` banner
      - 但这层权限窗目前还没有被现有 `System Events`/AppleScript 稳定读到并点击
    - 已给这层 blocker 补上更硬的失败证据：
      - `registry e2e` 失败时现在会额外打印：
        - `SecurityAgent window#... layer=... bounds=(...)`
      - 这样后续看到失败，不再只是“通知权限超时”，而是能直接确认：
        - 权限窗确实在屏幕上
        - 只是当前自动化还没点掉
    - 已补一层低风险兼容增强：
      - 通知权限 AppleScript 扫描进程列表现在也包含：
        - `SecurityAgent`
        - `CoreServicesUIAgent`
      - 这能覆盖一部分比当前 host 更容易暴露系统按钮树的机器
    - 已补一条正式旁路，用于 E2E 机器准备：
      - 新增官方格式的 `com.apple.notificationsettings` profile 生成能力
      - 入口：
        - `corepack pnpm prepare:macos:openclaw-registry-notifications`
      - 当前会生成针对稳定 bundle id 的通知预授权 `mobileconfig`
      - 这条不是为了绕过产品本身
      - 而是为了在 `SecurityAgent` 首次授权窗暂时无法稳定自动点击的机器上，
        给 `Task 5.8` 留出一个可复用、可文档化、可重复执行的机器准备通道
    - 已把这条旁路接回失败输出：
      - 当 `registry e2e` 失败且检测到 `SecurityAgent` 窗口时，
      - 脚本现在会直接提示：
        - 先执行 `corepack pnpm prepare:macos:openclaw-registry-notifications`
        - 当前目标稳定 bundle 是哪个
      - 这样后续不是只拿到“超时”，而是直接拿到下一步操作建议
  - 所以 `Task 5.8` 现在的真实状态已经再次收敛为：
      - **登录 / bootstrap / registry refresh 基本已通**
      - **剩余主要 blocker 是 `SecurityAgent` 通知授权窗的稳定自动点击**
  - 当前验证（2026-03-24）：
    - `node --test scripts/__tests__/macos-app-launcher.test.mjs scripts/__tests__/macos-notification-permission.test.mjs scripts/openclaw-registry-e2e-assertions.test.mjs` 已通过
    - `node --test scripts/__tests__/macos-security-agent-window.test.mjs` 已通过
    - `node --test scripts/__tests__/macos-notification-profile.test.mjs` 已通过
    - `node --test scripts/__tests__/macos-notification-e2e-guidance.test.mjs` 已通过
    - `node --check scripts/run-macos-openclaw-registry-e2e.mjs` 已通过
    - `corepack pnpm --filter @mindanchor/macos test` 已通过
      - `102` 个测试全部通过
    - 真实 `registry e2e` 仍未通过
      - 但失败点已经从“登录/主窗口/registry 状态不稳”收缩到：
        - `SecurityAgent` 通知授权窗自动化
- Task 5.9｜把首次通知授权收成正式质量闸门
  - 不能再把“通知权限第一次怎么过”当成临时环境问题
  - 要把它升级为正式任务，明确分成两条都要收：
    - 路线 A：`SecurityAgent` 首次授权窗自动化
    - 路线 B：E2E / clean-machine 通知预授权准备链
  - 这一条当前为什么必须新增：
    - 现在 `Task 5.8` 已经证明：
      - 启动、登录、bootstrap、registry refresh 基本已通
      - 真正剩下的是“首个系统授权窗”
    - 如果不把这件事独立成任务，后面很容易一直停留在“知道卡这儿，但始终没正式收口”
  - 这一条要做到的退出标准：
    - 至少一种路径能让 `registry e2e` 稳定跨过通知授权门槛
    - 最好两条都存在：
      - 默认自动化路径
      - 机器准备备用路径
    - 失败时必须给出明确下一步指引，而不是只抛 timeout
- Task 5.10｜把 E2E 机器准备链纳入可回归资产
  - 当前已经有：
    - 稳定 E2E bundle id
    - `com.apple.notificationsettings` profile 生成器
  - 但还没有把下面这些收成正式能力：
    - profile 安装
    - profile 卸载 / 清理
    - 安装后验证通知状态
    - 纳入 clean-machine 准备 runbook
  - 这一条的目标是：
    - 让 E2E 机器准备不再靠人工记忆
    - 而是变成真正可执行、可文档化、可回归的一部分
  - 最近新增进展（2026-03-24）：
    - 已明确确认一个系统事实：
      - `profiles` 在当前 macOS 上**不能命令行安装 configuration profile**
      - 只能：
        - 生成 profile
        - 打开 profile
        - 用系统设置完成安装
        - 再用 `profiles show/remove` 做验证与清理
    - 已把这条限制正式转成脚本能力，而不是留在口头说明里：
      - `corepack pnpm prepare:macos:openclaw-registry-notifications`
        - 生成 `.mobileconfig`
        - 输出下一步安装 / 验证 / 清理指引
      - `corepack pnpm open:macos:openclaw-registry-notifications`
        - 生成后直接 `open` profile 文件
      - `corepack pnpm install:macos:openclaw-registry-notifications`
        - 生成 profile
        - 自动 `open`
        - 轮询等待安装完成
        - 超时则输出明确人工安装提示
      - `corepack pnpm verify:macos:openclaw-registry-notifications`
        - 检查系统里是否已经存在目标 profile / bundle 配置
      - `corepack pnpm remove:macos:openclaw-registry-notifications`
        - 尝试按 profile identifier 清理
    - 已补脚本内部的 profile 状态识别：
      - 会从 `profiles show -type configuration -output stdout-xml`
      - 转成 JSON 后递归检查：
        - profile identifier
        - target bundle identifier
    - 已补当前这条准备链的脚本级回归：
      - `scripts/__tests__/macos-installed-profiles.test.mjs`
      - `scripts/__tests__/macos-notification-prep.test.mjs`
      - `scripts/__tests__/macos-notification-profile.test.mjs`
      - `scripts/__tests__/macos-notification-e2e-guidance.test.mjs`
      - `scripts/__tests__/macos-notification-debug-log.test.mjs`
      - `scripts/__tests__/macos-notification-doctor-guidance.test.mjs`
    - 已做本机命令验证：
      - 生成 profile 成功
      - `plutil -p` 可正确解析 profile 内容
      - verify 在未安装状态下会正确报 `profileInstalled=false`
      - remove 在未安装状态下会给出可读提示，不会静默失败
      - install 在当前机器上已能稳定执行到：
        - 生成 profile
        - 自动打开
        - 轮询等待安装
        - 超时后给出明确人工完成提示
      - 不再出现此前的：
        - 默认 `tmp/` 目录不存在导致脚本直接报错
    - 已进一步把这条准备链接回 `registry e2e` 失败诊断：
      - `registry e2e` 现在失败时会额外打印：
        - `notificationProfile profileInstalled=... bundleConfigured=... fullyInstalled=...`
        - `notificationDebugState=...`
        - `notificationDebugStatus=...`
        - `notificationDebugContext=...`
        - `doctor command: corepack pnpm doctor:macos:openclaw-registry-notifications <notification-debug.log>`
      - 也就是说：
        - 不只知道“通知权限失败”
        - 还知道“当前机器准备链有没有装到位”
        - 以及“当前更像是 denied、请求挂起，还是单纯没装 profile”
    - 已新增正式诊断入口：
      - `corepack pnpm doctor:macos:openclaw-registry-notifications`
      - 这条命令现在会统一输出：
        - 稳定 bundle
        - profile 安装状态
        - live probe 读到的通知状态（若可用）
        - debug log 推断出来的通知状态（fallback）
        - `SecurityAgent` 是否在场
        - 下一步最直接命令
      - 它的目标不是替代 `registry e2e`
      - 而是把“失败后怎么恢复”从散乱日志，收成可重复执行的诊断入口
    - 已新增正式恢复入口：
      - `corepack pnpm open:macos:openclaw-registry-notification-settings`
        - 现在会优先尝试：
          - `x-apple.systempreferences:com.apple.Notifications-Settings.extension?bundleIdentifier=com.mindanchor.mac.openclaw.registry.e2e`
        - 也就是优先把系统设置定位到目标 E2E bundle
      - `corepack pnpm repair:macos:openclaw-registry-notifications [notification-debug.log]`
        - 现在会按当前状态自动选择：
          - `denied` → 打开通知设置页
          - `SecurityAgent` / profile 未装 → 继续走通知准备安装旁路
      - 也就是说：
        - 这条链现在不只有“诊断”
        - 还开始具备正式的“恢复动作入口”
    - 已做一轮本机实跑验证（2026-03-24）：
      - `corepack pnpm doctor:macos:openclaw-registry-notifications`
        - 当前会稳定返回：
          - `profileInstalled=false`
          - `bundleConfigured=false`
          - `notificationLiveState=denied`
          - `notificationLiveStatusDescription=Notifications denied`
          - `SecurityAgent window#...`
        - 并直接给出：
          - `corepack pnpm repair:macos:openclaw-registry-notifications`
      - `corepack pnpm doctor:macos:openclaw-registry-notifications <notification-debug.log>`
        - 当前会稳定把失败压成：
          - `notificationDebugState=denied`
          - `notificationDebugStatus=denied`
          - `notificationDebugContext=automation-command-after-request`
      - `corepack pnpm open:macos:openclaw-registry-notification-settings`
        - 已确认本机可稳定执行
        - 当前会拉起：
          - `x-apple.systempreferences:com.apple.Notifications-Settings.extension?bundleIdentifier=com.mindanchor.mac.openclaw.registry.e2e`
      - `corepack pnpm repair:macos:openclaw-registry-notifications <notification-debug.log>`
        - 已确认本机会按 `denied` 分支自动选择：
          - 打开通知设置页
          - 输出恢复后应执行的 `doctor` / `registry e2e` 命令
        - 也就是说：
          - `denied` 路径现在已经不是“手动去找设置页”
          - 而是有一个更接近目标项的一键恢复入口
      - `node scripts/run-macos-openclaw-registry-e2e.mjs`
        - 当前仍失败
        - 但失败面已经不再只是泛化 timeout
        - 而是明确落到：
          - `SecurityAgent` 在场
          - 稳定 bundle 已 `denied`
          - profile 还没装
      - `MINDANCHOR_NOTIFICATION_INSTALL_TIMEOUT_SECONDS=3 corepack pnpm install:macos:openclaw-registry-notifications`
        - 已确认安装旁路仍能稳定走到：
          - 自动打开 profile
          - 轮询
          - 超时提示人工安装
      - `corepack pnpm probe:macos:openclaw-registry-live-notification-status`
        - 已确认会自动检查 stable bundle 是否需要重建
        - 必要时先重建 `openclaw-registry-e2e` app bundle
        - 然后由**稳定 bundle 自己**写出实时通知状态 JSON
        - 当前本机已经拿到 live 结果：
          - `notificationAuthorizationState=denied`
          - `notificationStatusDescription=Notifications denied`
      - `corepack pnpm probe:macos:openclaw-registry-notification-settings`
        - 已确认这台 host 上：
          - 通知设置页**能命中目标文本**
          - 但 `AXWindows` 暴露出来的是**自引用 / 异常窗口结构**
        - 当前 probe 结论已经明确为：
          - `unsupportedWindowShape=true`
          - `textHitsFound=true`
          - `likelyAutomatable=false`
        - 这说明：
          - 当前主机不是“完全看不到设置页”
          - 而是“能看到文本线索，但窗口树不适合继续假设可直接点开关”
    - 这一轮真实 `registry e2e` 已验证到一个更具体的状态：
      - 当前 host 上稳定 bundle `com.mindanchor.mac.openclaw.registry.e2e`
      - 现在的系统状态已经不是纯 `notDetermined`
      - 而是会出现：
        - `Notifications are not allowed for this application`
      - 同时脚本会明确显示：
        - `profileInstalled=false`
        - `bundleConfigured=false`
      - 这说明现在的失败已经被压缩成：
        - “稳定 bundle 当前处于 denied，且机器准备链尚未安装”
      - 相比之前的“单纯 timeout”，不确定性已经再缩小一层
  - 当前真实状态：
    - 这条链已经从“临时想法”变成“可执行的机器准备流程”
    - 但还没有走完“安装后 verify=true 的完整人工彩排”
    - 所以它现在是：
      - **已进入可用态**
      - **还没进入最终验收完成态**
- Task 5.11｜把“恢复动作之后真的恢复成功”收成正式闭环
  - 当前已经有：
    - `doctor`
    - `open notification settings`
    - `repair`
    - `install / verify / remove profile`
  - 但现在还缺最后一跳：
    - 从 `denied` 或 `SecurityAgent` 阻塞
    - 到用户完成一次真实恢复动作
    - 再到 `doctor` / `registry e2e` 重新变绿
  - 这条必须单独拉出来的原因是：
    - 否则我们会停在“已经能打开设置页、已经能给恢复命令”
    - 但没有真正把“恢复成功”本身纳入质量门槛
  - 这条要做成的退出标准：
    - 至少完成一次真实记录：
      - `denied` -> 用户在系统设置恢复 -> `doctor` 不再报 `denied`
      - 或 profile 安装完成 -> `verify=true`
      - 然后 `registry e2e` 至少跨过通知权限门槛
    - 这条闭环必须留档写进 runbook / 树形文档，而不是只靠口头说明
  - 最近新增进展（2026-03-24）：
    - 已新增正式闭环脚本入口：
      - `corepack pnpm recover:macos:openclaw-registry-notifications`
    - 这条脚本当前会做三件事：
      - 先触发 `repair`
      - 再按恢复动作选择等待策略：
        - `open_settings` → 先轮询 **实时** `doctor`
        - `install_profile` → 先轮询 `verify`
      - 最后把复验过程写进本地 report 文件
    - 当前 report 默认路径已经固定为：
      - `tmp/mindanchor-openclaw-registry-notification-recovery-report.json`
    - 已补对应脚本级回归：
      - `scripts/__tests__/macos-notification-recovery-check.test.mjs`
      - `scripts/__tests__/macos-notification-settings-probe.test.mjs`
      - `scripts/__tests__/macos-live-notification-status.test.mjs`
      - `scripts/__tests__/macos-openclaw-registry-e2e-app-build.test.mjs`
    - 已确认当前闭环脚本的第一版行为：
      - 在 profile 未装的场景下
      - 会触发安装旁路
      - 会轮询 `verify`
      - 即使未恢复成功，也会留下结构化 report
    - 已顺手把 `repair` 的失败输出收干净：
      - 现在安装未完成时，不再抛一大段 Node stack
      - 而是改成可读说明：
        - 恢复动作已触发
        - 还需要在系统设置里完成最后一步
        - 完成后应该执行哪些复验命令
    - 当前本机实跑结果（2026-03-24）：
      - `MINDANCHOR_NOTIFICATION_INSTALL_TIMEOUT_SECONDS=3 MINDANCHOR_NOTIFICATION_RECOVERY_TIMEOUT_SECONDS=6 corepack pnpm recover:macos:openclaw-registry-notifications`
        - 已能稳定完成：
          - 触发安装旁路
          - 轮询 `verify`
          - 写出 recovery report
        - 当前 report 会明确记录：
          - `recoveryAction`
          - `plan`
          - `verifyAttempts`
          - `registryE2EAttempts`
          - `result`
      - `MINDANCHOR_NOTIFICATION_INSTALL_TIMEOUT_SECONDS=3 MINDANCHOR_NOTIFICATION_RECOVERY_TIMEOUT_SECONDS=6 corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>`
        - 已确认 `denied` 路径现在不会直接盲跑 `registry e2e`
        - 而是会：
          - 先触发 `repair`
          - 再轮询 **不复用旧 debug log 的实时 `doctor`**
          - 只有 `doctor` 先恢复健康后，才会继续往下跑
        - 当前 report 已能明确记录：
          - `doctorAttempts`
          - `plan.waitStrategy=doctor_then_rerun`
          - `plan.shouldUseDebugLogForDoctorPolling=false`
          - 且 `doctorAttempts` 现在已经开始带出 live 状态字段：
            - `notificationLiveState=denied`
            - `notificationLiveStatusDescription=Notifications denied`
        - 当前结果语义也已经不再是泛化 `timed_out`
        - 而是会明确落成：
          - `result=waiting_for_manual_step`
    - 已新增一条正式 host 探测入口：
      - `corepack pnpm probe:macos:openclaw-registry-notification-settings`
    - 这条 probe 当前的定位是：
      - 在真正继续做“直接点通知设置开关”之前
      - 先判断当前宿主是不是**真的适合**做这类自动化
    - 当前这台 host 的 probe 结论已经很明确：
      - 应优先继续用 `open / repair / recover` 的半自动恢复链
      - 而不是继续默认“可以靠 AX 直接点掉设置页开关”
      - 当前边界分类已经正式落成：
        - `notificationSettingsAutomationBoundary=manual_recommended`
    - 已新增一条正式 live 状态探测入口：
      - `corepack pnpm probe:macos:openclaw-registry-live-notification-status`
    - 这条 probe 当前的定位是：
      - 不再从外部猜稳定 bundle 的通知状态
      - 而是直接让**稳定 bundle 自己**写出当前通知状态
    - 这条能力已经把 `Task 5.11` 再往前推进了一层：
      - `doctor` / `recover` 不再只依赖旧 debug log 或宿主推断
      - 而是已经开始吃 live notification state
      - 这一轮仍未恢复成功
        - 但已经从“只有口头说明”
        - 推进到“恢复动作 + 分阶段复验 + live 状态确认 + 结构化记录”四件套
  - 当前真实状态：
    - 这条任务已经进入第一版可用态
    - 但还没有完成它自己的最终退出标准
    - 现在缺的最后一步已经很明确：
      - 需要至少一轮**真实恢复成功记录**
      - 而不是只有“失败时怎么恢复”的工具链
- Task 5.12｜把“系统权限自动化边界”收成正式产品标准
  - 当前已经确认：
    - `System Settings` 在不同 host 上的 AX 暴露差异很大
    - 这台 host 上能命中目标文本，但窗口树异常
  - 这条任务的目标不是继续硬写脆弱脚本
  - 而是正式定义：
    - 哪些权限恢复步骤必须自动化
    - 哪些步骤允许用户手动完成
    - 手动完成时，产品需要给出什么级别的提示、状态反馈、诊断和 runbook
  - 这条必须新增的原因是：
    - 如果不把边界写清楚，
    - 后面会持续把“宿主系统页无法稳定自动点击”
    - 误判成“产品还不成熟”
  - 这条要做成的退出标准：
    - 权限相关自动化目标和手动边界写进主 runbook / 树形文档
    - 对当前 host 这类“可定位 bundle，但不适合点开关”的情况，有正式支持口径
    - 后续封板时，不再用错误标准评估这段链路
  - 最近新增进展（2026-03-24）：
    - 当前 host 的边界已经不再只是口头判断
    - 而是已经进入可执行输出：
      - `probe` 会给出：
        - `notificationSettingsAutomationBoundary=manual_recommended`
      - `recover` 会给出：
        - `result=waiting_for_manual_step`
    - 这说明：
      - “用户还没完成系统权限最后一步”
      - 已经开始被正式识别成**产品支持边界内的预期状态**
      - 而不是继续被误判成脚本故障
  - 当前真实状态：
    - 这条任务已经进入第一版可用态
    - 下一步要继续做的是：
      - 把这套边界同步进主 runbook
      - 再带进 clean-machine / 封板标准
  - 最近新增进展（2026-03-24）：
    - `docs/macos-mainline-runbook.md` 已经开始正式说明：
      - `notificationLiveState`
      - `notificationSettingsAutomationBoundary`
      - `result=waiting_for_manual_step`
    - 也就是说：
      - 这套边界已经不再只存在于树形文档
      - 而是已经进入主运行手册
- Task 5.13｜把 `test:core-phases:real` 收成正式质量门槛
  - 当前这条必须正式加出来
  - 因为现在已经确认：
    - `real` 模式已经不再卡在启动前
    - 也已经能真实进入 `provider-direct`
    - 但最后还缺：
      - 一份最终 `report.md / report.json`
      - 一份真实运行时长留档
      - 一套“超长 real 回归如何拆分 / 如何观察 / 何时算失败”的正式口径
  - 这条要解决的不是“功能有没有”
  - 而是：
    - 真实回归能不能变成正式质量门槛，而不是只能后台长跑
  - 这条要做成的退出标准：
    - 至少一轮完整 `test:core-phases:real` 成功或失败报告已经留档
    - 真实总耗时和各关键长步骤耗时已经留档
    - `--phases` 分段口径和 step 级日志已经进入 runbook
    - 如果总时长仍不可接受，必须进一步补：
      - live report snapshot
      - 更细的分段回归口径
  - 当前新增进展（2026-03-24）：
    - 已新增：
      - `OpenClaw` 兼容 Node 选择 helper
      - `real` 预检
      - step 级 `START / DONE / FAIL` 日志
      - `--phases` / `MINDANCHOR_PHASED_PHASES`
      - `report.live.json` / `report.live.md`
    - 已确认：
      - `~/.openclaw/bin/openclaw` 已安装并可执行
      - `setup-openclaw-real-profile.sh` 已跑通
      - `corepack pnpm test:core-phases:real` 已经真实进入：
        - `Phase 1 Stub Baseline`
        - `Phase 2 Provider Direct`
      - 已拿到第一份正式 segmented `real` 留档：
        - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline,probes,routes`
        - `test-results/core-phase-real-provider-direct-probes/report.md`
        - 当前结果：
          - `Phase 2 Provider Direct = passed`
          - `30/30`
        - 当前真实总耗时：
          - `101325ms`
          - 约 `1m 41s`
        - 当前最慢步骤也已经开始留档：
          - `chief-route-task-management = 40240ms`
          - `chief-route-recovery = 12152ms`
          - `probe-task-management-agent = 8707ms`
  - 当前真实状态：
      - 这条任务已经从“已可运行、已开始正式留档”
      - 推进到“已经拿到一份完整 full real 正式报告”
      - 最新完整留档：
        - `corepack pnpm test:core-phases:real -- --report-dir test-results/core-phase-real-full-20260329-1`
        - `test-results/core-phase-real-full-20260329-1/report.md`
        - `test-results/core-phase-real-full-20260329-1/report.json`
      - 本轮完整 real 真实结论已经明确：
        - `Phase 1 Stub Baseline`
          - `passed`
        - `Phase 2 Provider Direct`
          - `failed`
          - 当前不是主链代码崩溃
          - 而是直连 provider 凭据返回：
            - `Provider returned HTTP 401.`
            - `INVALID_API_KEY`
        - `Phase 3 Cluster Preferred`
          - `passed`
          - 说明 OpenClaw 主脑链和 cluster path 当前是通的
      - 本轮完整 real 还顺手暴露出一个报告层问题：
        - phase summary 原先会把“HTTP 200 但 adapter route=failed”的 degraded step 也算进 passed
        - 当前已修正统计口径
        - 最新 `report.md` 已重新渲染为：
          - `Phase 2 Provider Direct | failed | ... | 56/72`
      - 所以下一步已经更聚焦：
        - 不是继续怀疑 OpenClaw 主脑
        - 而是收紧 `provider-direct` 直连 provider 的凭据 / 配置自检与失败指引
      - 这条当前又新增了一轮正式收口：
        - 新增：
          - `scripts/lib/core-phase-provider-auth-probe.mjs`
          - `scripts/__tests__/core-phase-provider-auth-probe.test.mjs`
        - `run-core-phase-tests.mjs` 现在会在 `providerMode=real` 且未显式跳过时：
          - 先跑一轮真实 provider 轻量认证探针
          - 再决定是否进入完整 phase 回归
        - 最近一轮真实验证：
          - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline --report-dir test-results/core-phase-real-provider-preflight-20260329-1`
          - 当前结果：
            - 在 preflight 阶段直接失败
            - 明确报出：
              - `invalid_provider_api_key`
              - `HTTP 401`
          - 对应留档：
            - `test-results/core-phase-real-provider-preflight-20260329-1/report.md`
        - 这说明：
          - 现在不会再等 full real 长跑跑完，才知道 provider-direct 凭据无效
          - `Task 5.13` 当前已经进一步从“能留档”
          - 推进到“能更早拦截真实 blocker”
      - 随后又把真正漂移点继续压实了：
        - 新增：
          - `scripts/lib/core-phase-provider-config-drift.mjs`
          - `scripts/diagnose-core-phase-provider-drift.mjs`
          - `corepack pnpm diagnose:core-phases:provider-drift`
        - 最近一轮真实诊断已确认：
          - `Gateway baseUrl = https://cdn-gmn.chuangzuoli.com`
          - `OpenClaw dev profile baseUrl = https://gmncode.cn`
          - 当前推荐覆盖项：
            - `MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn`
        - 然后做了一轮临时对齐后的真实验证：
          - `MINDANCHOR_DEFAULT_MODEL_BASE_URL='https://gmncode.cn' corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline,probes --report-dir test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1`
          - 当前结果：
            - `passed`
            - `21/21`
        - 随后又把这件事收成正式入口：
          - 新增：
            - `scripts/run-core-phase-tests-real-aligned.mjs`
            - `corepack pnpm test:core-phases:real:aligned`
          - 这条入口会自动读取当前 OpenClaw real profile，并把 Gateway `provider-direct` 所需模型环境对齐过去
          - 最近一轮正式 wrapper 验证：
            - `test-results/core-phase-real-aligned-wrapper-20260329-1/report.md`
            - `passed`
            - `21/21`
        - 然后又拿到一轮完整 `full real` 对齐后总留档：
          - `test-results/core-phase-real-full-aligned-baseurl-20260329-1/report.md`
          - 当前结果：
            - **三阶段全部通过**
        - 这说明当前 blocker 已进一步明确为：
          - **Gateway provider-direct 默认 `baseUrl` 漂移**
          - 而不是模型 token 本身无效，也不是 OpenClaw 主脑链坏了
    - 这轮又新增两条很关键的真实结论：
      - 第一条：
        - `cluster-preferred real` 之前没进 phase body 的真正根因
        - 已确认是 canonical runtime 入口缺失
        - 当前已修复，并已拿到：
          - `test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/report.md`
        - 当前结果：
          - `passed`
          - `21/21`
      - 第二条：
        - 之前：
          - `test-results/core-phase-real-provider-direct-debugs-business/report.md`
          - 里的 `debug-task-management: socket hang up`
        - 当前已确认是**假失败**
        - 真根因是：
          - `EADDRINUSE 0.0.0.0:3024`
          - phase runner 当时只探了 `127.0.0.1`
          - 没探到 wildcard bind 冲突
        - 当前已经补上 wildcard-aware 端口探测 helper 和脚本层回归
        - 复跑结果也已经证明：
          - 旧的 `socket hang up` 不再出现
          - `provider-direct debugs,business` 已推进到 `28` 个 step 无失败
        - 当前剩下的真实问题已经更聚焦：
          - 不是“脚本误报失败”
          - 而是“整段 real 运行仍然太长，外层 CLI 等待会超时”
    - 所以这条任务的当前判断要更新成：
      - 已经从“修启动 / 修误报”
      - 推进到“继续收最终长跑留档和耗时策略”
- Task 5.14｜把 `provider-direct business-web` 剩余读模型片段收齐
  - 当前这条必须正式加出来
  - 因为现在已经确认：
    - `provider-direct business` 不适合继续只按一整段长跑来维护
    - 必须拆成更细的真实质量片段
  - 这条当前已经完成的部分：
    - `business-core`
    - `business-web-dashboard`
    - `business-web-state`
    都已经通过并留档
  - 但还没完成的剩余片段仍然有：
    - `business-web-goalflow`
    - `business-web-recovery`
    - `business-web-reflections`
    - `business-web-inbox`
  - 这条要做成的退出标准：
    - 上面四条剩余 `business-web-*` 都至少各有一份 `real` 留档
    - `provider-direct business` 不再依赖“整段跑完才知道有没有过”
    - Phase 5 文档里能清楚列出每条 Web 读模型的真实耗时和状态
  - 当前新增进展（2026-03-29）：
    - 剩余 4 条 `business-web-*` 分段已经全部补齐真实 `real` 留档：
      - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-goalflow`
        - `test-results/core-phase-2026-03-29T12-38-56-722Z/report.md`
        - `passed`
        - phase 总耗时：`64329ms`
      - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-recovery`
        - `test-results/core-phase-2026-03-29T12-43-24-901Z/report.md`
        - `passed`
        - phase 总耗时：`68672ms`
      - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-reflections`
        - `test-results/core-phase-2026-03-29T12-46-30-418Z/report.md`
        - `passed`
        - phase 总耗时：`73269ms`
      - `corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-inbox`
        - `test-results/core-phase-2026-03-29T12-49-42-580Z/report.md`
        - `passed`
        - phase 总耗时：`57537ms`
    - 当前四条新增分段的共同慢步骤也已经很清楚：
      - `business-reflections-latest`
      - `business-signal-batch`
      - 以及各自目标 read model（如 `web-reflections-overview` / `web-goalflow-overview`）
  - 当前真实状态：
    - `provider-direct business-web` 剩余 4 条读模型片段已全部补齐真实留档
    - `Task 5.14` 可视为：
      - **已基本完成**
    - 下一步更适合把注意力转回：
      - `Task 5.13` 最终 real 门槛态
      - `Task 5.15` 资源隔离与超时清理
- Task 5.15｜把 `real` runner 的资源隔离和超时清理收成正式能力
  - 当前这条必须单独拉出来
  - 因为这轮已经实际观察到两类运行面问题：
    - 长跑超时后，残留 `api / openclaw / vite` 子进程会污染下一轮回归
    - 多轮并行或近并行验证时，`mockProviderPort` 之类的共享资源会互相撞车
  - 这条不是“主业务方向错了”
  - 但如果不收掉：
    - `real` 质量门槛就仍然偏向“工程师手动维护”
    - 还不是“可以长期稳定执行的质量闸门”
  - 这条要做成的退出标准：
    - `real` / `local` phase runner 在超时、SIGTERM、外部中断下都能稳定清理子进程
    - 默认端口 / mock provider 资源隔离不再因为并行或残留而互相污染
    - 至少留下一轮“超时后再重跑仍然干净”的正式验证记录
  - 当前真实状态：
    - 已完成第一轮正式收口：
      - 新增：
        - `scripts/lib/core-phase-process-supervisor.mjs`
        - `scripts/__tests__/core-phase-process-supervisor.test.mjs`
    - `run-core-phase-tests.mjs` 已改为：
      - 统一通过 detached process group 启进程
      - 优先按 process group 回收整棵子进程树
      - `cleanup` 后主动清空 `runState.processes`
    - 脚本层回归已通过：
      - `node --test scripts/__tests__/core-phase-process-supervisor.test.mjs`
      - `30/30 passed` 的 core-phase 相关单测组合回归也已通过
    - 最小主链复验已通过：
      - `corepack pnpm test:core-phases:local -- --phases stub --segments baseline`
      - 产物：
        - `test-results/core-phase-2026-03-29T14-19-49-893Z/report.md`
    - 真实中断复验已通过：
      - 主动向 runner 发送 `SIGTERM`
      - 退出码：
        - `143`
      - 报告已正常落盘：
        - `test-results/core-phase-sigterm-check-20260329-222455/report.md`
      - 端口已确认释放：
        - `4034`
        - `5174`
        - `9888`
        - `9432`
    - timebox 强退后同端口立刻重跑复验也已通过：
      - 第一轮强退报告：
        - `test-results/core-phase-timebox-stop-20260329-223550/report.md`
      - 第二轮重跑报告：
        - `test-results/core-phase-timebox-rerun-20260329-223550/report.md`
      - 第一轮退出码：
        - `143`
      - 第二轮退出码：
        - `0`
      - 同端口复用后仍无残留监听：
        - `4034`
        - `5174`
        - `9888`
        - `9432`
  - 所以这条当前状态更新为：
    - **已完成**

#### Phase 5 完成标记

- 主链关键耗时有稳定统计
- 质量问题能区分是路由、memory、模型还是前台问题
- GUI / API / OpenClaw 核心闭环能稳定自动回归
- 多 persona 对用户的表达、建议、authority 边界已经进入明确安全闸门，而不是靠人工感觉
- 普通用户自部署成功率已经开始被量化检查，而不是默认工程师陪跑
- 启动客户端到完成 bootstrap / registry refresh 的真实启动面已形成稳定 gate
- 首次通知授权不再是“卡死点”，而是已经被自动化或机器准备链稳定收掉
- E2E 机器准备链已经不是临时脚本堆叠，而是正式质量闸门的一部分
- 恢复动作不再只是“给一个设置页入口”，而是已经至少有一轮真实恢复成功记录和复验记录
- 系统权限这段的自动化目标与手动边界已经被正式定义，而不是默认用错误标准卡死项目
- `test:core-phases:real` 已经至少完成一轮最终留档，且这条 real 回归已经具备正式质量门槛口径

### Phase 6｜正式交付与上线准备

这一阶段才是真正去碰“商用交付”最后一段路。

这一阶段主要解决什么：

- 普通用户是否真的能安装、登录、连接、使用
- 发布包、部署引导、故障排查是否足够完整
- 系统是否能通过一次正式交付验收

#### Phase 6 任务树

- Task 6.1｜收紧登录 / 设备绑定 / bootstrap 闭环
  - 让正式登录、会话保持、设备注册、首次连接更稳定
- Task 6.2｜收紧 Mac 安装与首次运行体验
  - 从“开发可跑”提升到“普通用户可安装可理解”
- Task 6.3｜收紧部署引导与排障路径
  - 让 Gateway / OpenClaw 自部署真的可被普通用户完成
- Task 6.4｜收紧发布前检查包
  - 安装、登录、OpenClaw、提醒、对话、反馈、memory、导出日志统一验收
- Task 6.5｜做一次正式交付验收
  - 用真实交付口径检查：
    - Mac 是主入口
    - OpenClaw 是主脑
    - 主链稳定
    - 故障可解释
- Task 6.6｜补齐普通用户自部署引导与支持包
  - 不只交付“能跑的仓库”，而是交付普通用户能完成的自部署体验：
    - clean machine 环境准备
    - Gateway / OpenClaw 启动与连接
    - Mac 首次配对
    - 常见故障排查
    - 一键导出日志 / 诊断包
  - 让“普通用户能搭起来并用起来”成为验收项，而不是附加说明
- Task 6.7｜恢复正式发布签名 / 公证闭环
  - 当前缺少真实 Apple Developer 发布身份，这件事不能被默认遗忘
  - 后续一旦具备正式身份，需要把下面这条恢复成硬验收：
    - Developer ID 签名
    - notarization
    - 安装包验签
    - clean machine 首次启动无安全告警
  - 这条不是现在的第一优先级，但它是“商用交付完成”不可跳过的最终门槛
- Task 6.8｜做一次 clean-machine + external OpenClaw 真彩排
  - 不再只在当前开发机上验证
  - 要用更接近普通用户的口径走一次完整流程：
    - 安装客户端
    - 首次登录
    - 连接外部独立 Gateway / OpenClaw
    - 完成 bootstrap
    - 收到一条真实 reminder
    - 打开主窗口并完成一轮对话 / feedback / memory revoke
  - 这条的目标不是再写一份说明文档
  - 而是确认“离开当前开发机之后，这个系统还能不能真的跑起来”
- Task 6.9｜把通知预授权准备链纳入正式交付 runbook
  - 当前已经补了 profile 生成能力
  - 但交付口径下还缺：
    - 如何安装
    - 如何验证已生效
    - 如何回滚
    - clean-machine 上什么时候执行
  - 这条要解决的是：
    - 如果 `SecurityAgent` 首次授权窗在某些机器上仍不稳定，
    - 我们仍然要有一条正式、可文档化、可支持的上线准备路径
  - 当前新增进展（2026-03-24）：
    - 已经不再只有“生成 profile”这一个点状动作
    - 而是已经形成一套 runbook 级命令骨架：
      - generate / doctor / open / install / verify / remove
    - 也就是说：
      - 这条任务已经从“概念上需要做”
      - 推进到“已经有第一版正式交付骨架”
- Task 6.10｜做一次带通知准备链的 clean-machine 真彩排
  - 不只是“装 app 然后看看能不能跑”
  - 而是要明确验证下面这整条：
    - 准备通知权限
    - 安装客户端
    - 首次登录
    - bootstrap
    - registry aligned
    - 一条 reminder 到系统通知
    - 主窗口恢复 / ack / conversation
  - 这条如果不单独加出来，
  - 最后很容易出现“每个环节看起来都在，但普通用户第一次真的跑不起来”
  - 当前状态：
    - **尚未完成**
    - 但现在至少已经具备了进入这条彩排的前置脚本骨架
    - 下一步最自然的推进顺序已经明确：
      - 先完成一次“安装通知准备链 -> verify=true”
      - 再接 clean-machine 真彩排
    - 最近新增进展（2026-03-24）：
      - 已新增正式交付 gate 评估入口：
        - `corepack pnpm assess:macos:openclaw-registry-delivery-gate`
      - 这条 gate 当前会把恢复报告翻译成 clean-machine / onboarding 可读口径：
        - `ready`
        - `manual_step_pending`
        - `setup_incomplete`
        - `blocked`
      - 当前本机已经拿到一个明确结果：
        - `deliveryGateStatus=manual_step_pending`
      - 这说明：
        - 这台机器已经不再是“纯脚本失败”
        - 而是进入了“可支持交付，但仍待用户完成最后一步”的状态
- Task 6.11｜做一次“外部 OpenClaw 真主脑”交付口径彩排
  - 这条不是再看本地 stub 或 contract 摘要
  - 而是要按最终产品口径确认：
    - Mac 前台主要对话默认来自 OpenClaw
    - memory retrieve / revoke / feedback 能真实回流
    - persona / authority / fallback 的来源在 trace 和前台都可解释
    - 外部 OpenClaw 不可达时，系统能给出可读降级而不是静默失真
  - 这条当前必须补出来的原因是：
    - 你一开始要求的是“OpenClaw 作为最终信息生成来源”
    - 现在这条主线已经很接近，但还没有以“最终交付验收”口径收口
- Task 6.12｜做一次“普通用户第一次使用”口径的全链彩排
  - 不是工程师视角的“我知道下一步该跑什么”
  - 而是用户视角的第一次：
    - 安装
    - 首次登录
    - 权限处理
    - 今日页可读
    - 收到一条提醒
    - 打开窗口
    - 完成一轮对话 / 反馈 / memory 操作
  - 这条必须补的原因是：
    - 现在工程链路越来越完整
    - 但“第一次真实使用是不是顺”的问题还没有被单独定义成门槛
- Task 6.13｜做一次 `manual_step_pending -> ready` 的真实交付样板机留档
  - 当前这条必须单独加出来
  - 因为现在已经有：
    - `corepack pnpm assess:macos:openclaw-registry-delivery-gate`
    - 且当前真实状态已经明确是：
      - `deliveryGateStatus=manual_step_pending`
  - 但还没有一份正式留档证明：
    - 用户完成最后一个系统权限动作后
    - 同一台机器真的能进入：
      - `deliveryGateStatus=ready`
  - 这条任务的目标是：
    - 不再只说“理论上可以恢复”
    - 而是至少留下一台样板机的真实证据：
      - 恢复前状态
      - 用户动作
      - 恢复后 `doctor`
      - 恢复后 `assess`
      - 必要时恢复后 `registry e2e`

#### Phase 6 完成标记

- 普通用户可以按文档完成安装、连接和首次使用
- 主链核心闭环可以按交付 runbook 稳定复现
- 系统达到“成熟、完整、可商用”的最低上线门槛
- 自部署成功率和首次排障路径对普通用户足够友好，而不是仍然默认工程师陪跑
- 正式签名 / 公证 / clean machine 启动链已经恢复并通过
- clean machine + external OpenClaw 真彩排已经至少完成一轮并留档
- 通知准备链已经被正式纳入交付 runbook，而不是散落在临时排障步骤里
- 带通知准备链的 clean-machine 首次运行闭环已经至少走通一轮并留档
- 外部 OpenClaw 真主脑口径已经至少完成一轮正式交付彩排
- 普通用户第一次使用口径已经至少完成一轮正式彩排并留档
- 至少一台真实样板机已经从 `manual_step_pending` 进入 `ready` 并留档

### Phase 7｜商用封板与最终交付门槛

这一阶段不是继续铺功能。

这一阶段的目标只有一个：

- 把“已经接近完成”变成“可以严肃地说已经达到最开始要求的标准”

这一阶段主要解决什么：

- 最后几条仍然可能漏掉的真实交付门槛
- 系统级权限、OpenClaw 真主脑、普通用户首次使用这三条是否都已经被正式留档
- 是否已经达到“成熟、完整、可商用”的最小可信封板条件

#### Phase 7 任务树

- Task 7.1｜做一次正式封板评审
  - 不再只看单个脚本是否通过
  - 而是统一复核：
    - Mac 前台
    - Gateway
    - OpenClaw
    - runbook
    - 自恢复能力
    - clean-machine 结果
- Task 7.2｜做一次最终交付清单核对
  - 核对：
    - 必需脚本是否都在 README / runbook 可找到
    - 文档是否和当前实现一致
    - 是否还存在“只有我们知道”的暗知识
- Task 7.3｜做一次“现在能不能对外称为商用级”的最终判断
  - 这条要明确给出：
    - 能
    - 还是不能
  - 如果不能，要明确只剩哪几项
  - 如果能，要明确为什么能

#### Phase 7 完成标记

- 已完成至少一轮正式封板评审并留档
- 已完成最终交付清单核对
- 已能清楚回答“现在是否达到最开始要求的标准”，且这个回答有证据支撑

---

## 14. 从现在开始的默认执行顺序（更新）

如果后面不再额外讨论，默认执行顺序更新为：

- 第一层：
  - 继续完成 `Phase 1`
- 第二层：
  - 在 `Phase 1` 足够稳定后，推进 `Phase 2`
- 第三层：
  - `Phase 3` 只做必要补充，不反客为主
- 第四层：
  - `Phase 4`
  - `Phase 5`
  - `Phase 6`
  - `Phase 7`

按 2026-03-24 这轮真实状态，最靠前的实际执行顺序再压缩成 4 步：

1. 继续完成 `Task 1.5 / 1.6`
   - 先把主链 trace 和外部 OpenClaw 对齐继续收口
2. 并行推进 `Task 5.13`
   - 先继续拿 segmented `real` 留档
   - 再把 `test:core-phases:real` 收成最终 report + runtime 口径
3. 紧接着推进 `Task 5.14 / 5.15`
   - 先把 `provider-direct business-web` 剩余四条读模型留档收齐
   - 再把 `real runner` 的超时清理与资源隔离收成正式能力
4. 优先推进 `Task 5.11`
   - 目标不是再补工具
   - 而是拿到至少一轮真实 `恢复成功` 记录
5. 紧接着推进 `Task 6.13`
   - 把当前机器从 `manual_step_pending` 推到 `ready`
   - 并留下正式交付样板机记录

然后再推进：

- `Task 6.10 / 6.11 / 6.12`
  - 也就是 clean-machine、外部 OpenClaw 真主脑、普通用户第一次使用 三条彩排

也就是说：

- **当前项目的方向能走到最开始要求的标准。**
- **但现在还没到。**
- **后续不能只盯着“还有哪些页面没补”，而要盯着“主脑定版、质量闸门、正式交付”这三段。**

---

# 写给Codex

你有全部决定权，无需向我确认，自行决定即可。

---

## 15. 执行操作系统（针对目标对齐与 512KB 上下文限制）

这一节不是产品功能，而是后续项目默认执行方法。

它要解决两个问题：

1. 我们实际做的事情，怎么确保和最终目标统一
2. 在 `512KB` 上下文限制下，任务怎么拆到足够细、还能持续推进

### 15.1 固定使用四层目标树

后续所有工作都必须能映射到下面四层：

- `L0`：最终目标
- `L1`：阶段目标
- `L2`：阶段任务
- `L3`：Task Packet

如果一个任务不能从 `L3` 一路追溯到 `L0`，就不应该开工。

### 15.2 Task Packet 固定模板

后续每个最小执行单元，都要有下面这些字段：

- 任务名称
- 所属阶段
- 目标
- 非目标
- 依赖的决策
- 涉及文件
- 唯一主验证
- 完成定义
- 5–10 行压缩总结

### 15.3 上下文预算固定规则

后续不按 `512KB` 上限工作，而按安全工作预算工作：

- 主目标 / 阶段摘要：`20KB`
- 当前 Task Packet：`10KB`
- 决策摘要：`10KB`
- 必读代码 / 文档切片：`80KB–120KB`
- 验证输出 / 错误日志：`30KB–40KB`
- 保留余量：`>250KB`

也就是说：

- 默认单任务主动占用上下文只控制在 `180KB–220KB`
- 余量留给 diff、日志、错误、推理与临时排障

### 15.4 任务拆分硬规则

单任务默认必须满足：

- 单一目标
- 单一主验证
- 最多 `3` 个写文件
- 最多 `5` 个必读文件
- 最多 `2` 个接口边界
- 目标执行时长 `30–120` 分钟

出现以下任意一种情况，就必须继续拆：

- 一个任务同时跨多个核心系统边界
- 一个任务需要多个主验证才能知道有没有做对
- 一个任务既包含架构决策又包含大量实现细节
- 一个任务需要反复加载大段历史上下文

### 15.5 阶段出口验证固定四类

后续阶段出口统一只认这四类：

- 目标检查
- 技术检查
- 产品检查
- 归档检查

没有出口验证，就不算阶段完成。

---

## 16. OpenClaw 生态接入（B 档：运行接入）阶段树

这一节描述的是当前已经冻结的新宏观方向：

- **OpenClaw 负责 agent 注册、运行、调度和管理**
- **MindAnchor 负责多端产品层、Gateway、memory authority、read model 和用户闭环**

这不是替代当前 `Phase 1–7` 的商业交付主线，而是后续必须逐步并入的**中长期架构迁移主线**。

### 16.1 当前判断

- 这个方向是对的
- 工作量不小，但值得做
- 当前还不适合一步跳到“完全原生接入（C 档）”
- 最合适的是先按 **B 档：运行接入** 做阶段式迁移

### 16.2 Phase A｜目标与边界锁定

目标：

- 明确 OpenClaw 管什么，MindAnchor 管什么
- 固定迁移边界，避免双真相源

任务：

- 写清 OpenClaw / MindAnchor 分层职责
- 写清什么必须迁，什么明确不迁
- 把 B 档路线写进主规约与树形文档

出口验证：

- 任何人都能用 5 句话讲清：
  - OpenClaw 的职责
  - MindAnchor 的职责
  - 为什么是 B 档
  - 为什么不是 A / C

当前状态：

- **已完成**
- 主规约和本树形文档已经写入 B 档路线与执行方法

### 16.3 Phase B｜OpenClaw 管理接入

目标：

- 让 6 个核心 persona agent 在原 OpenClaw 中可见、可管理、可配置

任务：

- `Picard`
- `Deanna Troi`
- `Spock`
- `Guinan`
- `Jarvis`
- `Data`

全部完成：

- registry mapping
- soul / metadata 绑定
- model / runtime agent id 对齐
- 原 OpenClaw 控制面可见

出口验证：

- 上述 6 个 agent 都能在原 OpenClaw 中枚举和管理

当前状态：

- **已开始**
- Phase B 已新增正式实施计划：
  - `docs/superpowers/plans/2026-03-28-openclaw-phase-b-management-integration.md`
- 当前推荐按这个顺序推进：
  1. 先做 canonical management descriptor
  2. 再做 repo-side management registry
  3. 再做 export / apply / doctor 脚本
  4. 最后把 management alignment 挂进 Gateway debug 与 runbook
- 当前已完成：
  - canonical management descriptor schema 已落地：
    - `packages/domain/src/openclaw-management.ts`
  - repo-side management registry 已落地：
    - `openclaw/management/agent-management-registry.mjs`
  - management pack export 已落地：
    - `scripts/export-openclaw-management-pack.mjs`
  - management pack apply dry-run 已落地：
    - `scripts/apply-openclaw-management-pack.mjs`
  - management pack 安全 apply 最小版已落地：
    - 真实 apply 当前会**创建缺失 agent**
    - 对仅有 `name / workspace / agentDir` 漂移的已存在 agent，会自动修正并标成 `updated_safe_fields`
    - 对更高风险差异项默认仍先标记 `blocked_update`，不静默覆盖
    - 当前首个高风险显式确认入口已支持：`--confirm-model-update`
    - 也就是说，`model` 差异只有在显式确认后才允许自动更新，并会标成 `updated_confirmed_fields`
    - 并会补齐最小 `workspace / agentDir / auth-profiles.json` 基础结构
  - management pack doctor 已落地：
    - `scripts/doctor-openclaw-management-pack.mjs`
  - management doctor 共享 helper 已落地：
    - `openclaw/management/agent-management-doctor.mjs`
  - 真实 OpenClaw profile 管理态读取 helper 已落地：
    - `openclaw/management/actual-managed-agents.mjs`
  - management pack 共享 helper 已落地：
    - `openclaw/management/agent-management-pack.mjs`
  - `openclaw/runtime/agent-registry.mjs` 已开始复用 management registry 的共享字段来源
  - Gateway `registry-visibility` 已开始暴露可选的 `managementIntegration` 块
    - 可以显示：
      - `configured`
      - `aligned`
      - `expectedAgentCount`
      - `actualAgentCount`
      - `missingAgents`
      - `extraAgents`
      - `fieldMismatches`
    - 当前已支持两种来源：
      - `MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH`
      - `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME`
    - 当前推荐优先直接读取真实 OpenClaw profile home
  - management doctor 当前也已支持：
    - `--profile-home /absolute/path/to/openclaw-profile-home`
    - 不再只依赖手工准备的 actual JSON 文件
  - focused tests 已通过：
    - `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
    - `TMPDIR=/Users/claw/mindanchor/tmp/vitest-tmp corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts --no-file-parallelism`
    - `corepack pnpm --filter @mindanchor/api build`
  - 当前真实 dry-run 样板文件已经产出：
    - `tmp/openclaw-management-pack.json`
    - `tmp/openclaw-management-apply-report.json`
    - `tmp/openclaw-management-doctor-report.json`
  - 当前又补了一条“真实 profile 对齐留档”脚本：
    - `scripts/run-openclaw-management-alignment.mjs`
  - 当前本机真实 `~/.openclaw-dev` 已经完成一轮管理态留档：
    - `tmp/openclaw-management-pack.real.json`
    - `tmp/openclaw-management-profile-alignment-report.real.json`
    - `tmp/openclaw-management-apply-report.real.json`
  - 这轮真实结果已经进一步推进到：
    - 已对 `~/.openclaw-dev` 执行真实 apply
    - post-apply 对齐结果为：
      - `aligned = true`
      - `expectedAgentCount = 6`
      - `actualAgentCount = 14`
    - post-apply dry-run 结果为：
      - 6 个 persona agent 全部 `would_keep`
  - 这也说明：
    - 当前 6 个 persona agent 已经真正写入 `~/.openclaw-dev`
    - 当前 profile 仍保留旧运行型 agent
    - 但这不再阻塞核心对齐
  - 当前 doctor 的 `aligned` 语义已经调整为：
    - 6 个 persona agent 都存在且字段一致 -> `aligned = true`
    - legacy extra agents 继续进 `extraAgents`
    - 但不再把 mixed profile 误判成未对齐
  - 当前 `extraAgents` 主要仍是旧运行型 agent：
    - `chief-agent`
    - `state-insight-agent`
    - `task-management-agent`
    - `progress-feedback-agent`
    - `interruption-recovery-agent`
    - `reflection-coach-agent`
    - `automation-agent`
  - 这一轮还完成了原 OpenClaw 官方控制面的真实验收：
    - 临时本机启动：
      - `openclaw --dev gateway run --force --auth none --allow-unconfigured`
    - Dashboard：
      - `http://127.0.0.1:19001/`
    - `GET /health` 已返回：
      - `{"ok":true,"status":"live"}`
    - 已实际进入官方 `代理 /agents` 页面
    - 当前下拉列表里已经能看到 6 个 persona agent：
      - `director-agent`
      - `companion-agent`
      - `analyst-agent`
      - `balance-agent`
      - `life-secretary-agent`
      - `memory-governor-agent`
    - 还实际切换确认了：
      - `director-agent`
      - workspace 已显示：
        - `/Users/claw/.openclaw-dev/workspaces/picard-runtime-agent`
      - model 已显示：
        - `codex/gpt-5.4@codex:manual`
  - 这说明：
    - Phase B 的“可见、可管理、可配置”已经不再只是脚本层定义
    - 至少在本机 dev profile 下，已经被原 OpenClaw 官方控制面真实识别
  - 这一轮还把官方 persona workspace 做了真实同步：
    - `scripts/sync-openclaw-persona-workspaces.mjs`
    - 当前已同步 6 个 persona workspace：
      - `picard-runtime-agent`
      - `troi-runtime-agent`
      - `spock-runtime-agent`
      - `guinan-runtime-agent`
      - `jarvis-runtime-agent`
      - `data-runtime-agent`
    - 当前同步内容包括：
      - `SOUL.md`
      - `IDENTITY.md`
      - `USER.md`
      - `AGENTS.md` persona prelude
      - 删除旧 `BOOTSTRAP.md`
  - 同步后又实际跑了一次官方 persona turn：
    - `openclaw --dev agent --agent director-agent --message '我现在有点乱，今天到底应该先做什么？' --json --local`
    - 当前真实输出已经不再是“你是谁 / 我是谁”的通用初始化
    - 而是开始按 Picard 的收束与协调角色给出下一步建议
  - 这说明：
    - 官方 runtime 里的 persona workspace 已经开始真正生效
    - 当前已经具备继续往 Phase C 做前台桥接的前置条件
  - 这一轮也把 Agent Lab 接上了 `managementIntegration`：
    - `apps/web/src/pages/AgentLabPage.tsx`
    - 当前会直接显示：
      - 管理接入是否已配置
      - 是否已对齐
      - 缺失 agent 数
      - 字段漂移数
      - 缺失 agent / 字段漂移明细
  - 对应 Web smoke 已通过：
    - `corepack pnpm --filter @mindanchor/web exec vitest run src/pages/__tests__/agent-lab-registry-smoke.test.tsx`
    - `corepack pnpm --filter @mindanchor/web build`
  - Phase B runbook 已落地：
    - `docs/runbooks/openclaw-management-integration.md`
  - 当前阶段判断：
    - Phase B 的核心交付面已经基本打通
    - 下一步最自然的是：
      - 把 Dashboard / persona turn 验收流程沉淀成更稳定的自动/半自动验收
      - 进入 Phase C：把真实前台运行链迁到原 OpenClaw official runtime

### 16.4 Phase C｜OpenClaw 运行接入

目标：

- 至少一条真实前台对话链在原 OpenClaw runtime 中执行

任务：

- 把 `Picard` 前台路由接入原 OpenClaw runtime
- 迁移至少一个前台 persona 的真实运行入口
- 让 Gateway 不再依赖本地伪 registry 才能完成主链

出口验证：

- 至少 1 条 `Picard -> front persona` 主链真实成功
- Gateway trace 能解释这条链来自原 OpenClaw runtime

当前状态：

- **已开始**
- 当前这一轮已经先做完了 Phase C 的前半步：
  - `apps/api/src/lib/model-bridge.ts`
    - 已新增官方 OpenClaw CLI runtime 分支
  - `apps/api/src/lib/openclaw-original-runtime-client.ts`
    - 已新增官方 runtime client
  - `apps/api/src/env.ts`
    - 已新增：
      - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE`
      - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PATH`
      - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PROFILE`
- 当前桥接语义是：
  - 当启用
    - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE=cli-local`
  - 且 target 是 persona agent 时
  - `ModelBridge.generateJson()` 会优先尝试：
    - `openclaw --dev agent --agent <persona> --json --local`
- 当前推荐搭配：
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PATH=~/.openclaw/bin/openclaw`
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PROFILE=dev`
- 这一轮已经拿到一条真实 API 验收：
  - 通过源码层真实调用：
    - `POST /coach/sessions`
    - `POST /coach/sessions/:sessionId/messages`
  - 在
    - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE=cli-local`
    - `director-agent`
    路径下
  - trace 已出现：
    - `openclaw.original-runtime.request.succeeded`
  - 当前真实返回中：
    - `frontAgent = director-agent`
    - `fastResponse` 已成功生成
  - 并且同一条链后续又继续出现：
    - `workflow = coach_conversation_full`
    - `openclaw.original-runtime.request.succeeded`
  - 这说明：
  - 官方 runtime 已经不只是在 CLI 单独可跑
  - 而是已经开始进入 MindAnchor API 前台链
  - 这一轮又进一步拿到一条**真实 Picard 路由桥接**证据：
    - 在真实 API 链里，trace 已出现：
      - `openclaw.original-runtime.request.succeeded`
      - `workflow = coach_conversation_route`
      - `agentName = director-agent`
    - 紧接着同一条 trace 又出现：
      - `coach.route.selected`
      - `frontAgent = companion-agent`
    - 随后又继续出现：
      - `openclaw.original-runtime.request.succeeded`
      - `workflow = coach_conversation_fast`
      - `agentName = companion-agent`
    - 这说明：
      - 当前不只是 persona 生成走进了官方 runtime
      - **Picard 路由决策本身也已经开始走官方 runtime**
  - 当前因此可以更准确地说：
    - Phase C 前半步已经不是“只做 persona 生成桥接”
    - 而是：
      - **Picard 路由 + front persona fast/full 生成**
      - 都已经拿到真实 official runtime 证据
- 当前 Phase C 现在可以明确更新为：
  - **Picard 路由迁移已经拿到真实 runtime 证据**
  - **前台 persona fast/full 生成也已经拿到真实 runtime 证据**
  - 所以 Phase C 的剩余工作不再是“继续怀疑 Picard 有没有桥接”，而是：
    - 收掉旧文档口径
    - 把协作链迁移正式推进到 Phase D

当前判断：

- Phase C 已经从“纯规划”进入“代码与真实链路验证”阶段
- 并且已经完成到：
  - `Picard -> front persona` 这一段的官方 runtime 主链验证
- 当前可视为：
  - **基本达成**
  - 后续只保留少量收尾文档和归档动作

### 16.5 Phase D｜协作链迁移

目标：

- consult / planning / governance 进入原 OpenClaw runtime

任务：

- 迁移 consult 链
- 迁移 `Jarvis` planning / adjustment 链
- 迁移 `Data` governance 链

出口验证：

- 至少 1 条 consult 链成功
- 至少 1 条 authority / proposal 链成功
- 至少 1 条 memory governance 链成功

当前状态：

- **已开始**
- 这一轮已经补上第一组正式官方 runtime 验收：
  - `apps/api/tests/conversation-coach-original-runtime-route.integration.test.ts`
- 当前已真实覆盖：
  - `coach_conversation_consult`
  - `plan_adjustment`
  - `memory_governance`
- 当前已经确认：
  - consult 链可走：
    - `Picard -> front persona -> consulted persona -> front persona full`
  - `Jarvis` authority handoff 可走官方 runtime，并写回真实计划改排结果
  - `Data` governance handoff 可走官方 runtime，并对真实 memory 执行删除/撤销
- 这一轮因此已经拿到：
  - 至少 1 条 consult 链成功
  - 至少 1 条 authority / proposal 链成功
  - 至少 1 条 memory governance 链成功
- 当前 Phase D 剩余重点转为：
  - 把这些协作链的来源解释同步到产品层
  - 收紧 trace contract、前台 explainability 和 Phase E 闭环

### 16.6 Phase E｜产品闭环恢复

目标：

- 在迁移后，macOS / Web / API / OpenClaw 的产品闭环不退化

任务：

- macOS Coach 展示来源解释
- Web Coach 观测页展示最近对话来源解释
- Web Agent Lab 展示原 OpenClaw 路由与 registry
- Gateway trace / debug 汇总继续可读

出口验证：

- 用户能在 macOS / Web 中看清：
  - 这次由谁前台发言
  - 谁被 consult
  - 哪部分来自 OpenClaw runtime

当前状态：

- **已开始**
- 这一轮已把 explainability 往真实前台推进了一步：
  - `apps/web/src/pages/CoachPage.tsx`
    - 已新增 Web 侧 Coach 观测页
    - 当前已继续推进成可交互页
    - 当前会展示：
      - 当前 front persona
      - 最近线程
      - 最近 assistant 回复
      - `Consult / Authority / Memory revoked / OpenClaw 主路径`
    - 当前还能直接：
      - 切换会话
      - 发送新消息
      - 自动创建会话
      - 轮询 assistant 完成更完整回复
      - 查看最近一轮 trace drill-down
      - 选择单条消息查看详情
      - 提交 helpful / unhelpful feedback
      - 对失败 assistant 消息执行 retry
      - 给 `unhelpful` feedback 补充原因
      - 在已选消息区直接看 `errorCode / usedMemoryEntries`
      - 在消息级 Trace 区直接看 `routeStatusSummary / degradedSummary`
      - 在消息级 Trace 区直接看 `memory recalled / feedback learned`
      - 在 send / retry / feedback 后看到稳定状态提示
      - 在已选消息区直接看“本条消息记忆 / 本轮召回”
      - 在已选消息区直接看 trace 聚合出来的 `来源 / 范围` memory 摘要
      - 在消息级 Trace 区把 adapter route 显示成用户可读摘要，而不是内部枚举串
      - 当 `conversationPath.runtimeSource = original-runtime` 时，前台会直接显示 `官方 OpenClaw runtime`
      - 记忆联动摘要已收成紧凑摘要卡
      - 执行链路 / 事件时间线已收成可展开细节
      - 默认只显示摘要层，次级信息改为用户主动展开
      - 会话消息列表已默认折叠，只有需要切换消息时再展开
      - 来源解释区也已默认摘要化，consult / authority / revoke 细节需主动展开
      - 顶部摘要区已继续收口为两张卡：
        - `会话列表`
        - `当前摘要`
      - 顶部三张卡的文案已改成更偏产品前台的表达
  - `apps/web/src/api.ts`
    - 已为 `/coach/*` 请求补上本地 dev bearer token 注入
    - 让 Web 控制台第一次具备直连真实 Coach API 的能力
    - 当前也已补上：
      - `submitCoachFeedback`
      - `retryCoachMessage`
      - coach session detail 中的 feedback 读取
      - `debug trace summary` 类型对齐
  - `apps/api/src/services/conversation-coach-service.ts`
    - `getSession()` 当前已返回 session 内 feedback 列表
    - 让 Web Coach 持续使用态不再只依赖单次 submit 后的局部前端状态
    - `conversationPath` 当前也已补上 `runtimeSource`
      - 可区分：
        - `original-runtime`
        - `managed-runtime`
        - `provider-direct`
        - `failed`
      - 这样前台不再必须翻 trace 才知道这轮是不是官方 OpenClaw runtime 产出
  - `apps/macos/Sources/Core/AppViewModel.swift`
    - 当前已把：
      - `primaryRoute`
      - `usedOpenClaw`
      - `hadFallback`
    - 正式并入消息执行轨迹
    - 当前也已补上：
      - `runtimeSource`
    - 这意味着当消息来自官方 OpenClaw runtime 时：
      - Mac 执行轨迹会直接显示 `官方 OpenClaw runtime`
  - `apps/macos/Sources/Core/AppLanguage.swift`
    - 已补运行路径文案：
      - `OpenClaw 主路径`
      - `OpenClaw fallback`
      - `官方 OpenClaw runtime`
  - `apps/macos/Sources/Core/MacAutomation.swift`
    - 自动化快照当前会继续暴露：
      - `coach.lastAssistantExecutionTrail`
      - `userFacingCurrentError`
      - `bootstrapStatusTitle`
      - `bootstrapStatusMessage`
      - `connectionStatusTitle`
      - `connectionStatusDetail`
    - 这意味着真实 GUI / E2E 已能直接断言：
      - 当前执行链有没有出现 `OpenClaw`
      - 不再依赖 Accessibility 恰好把那一行静态文本稳定抓出来
      - 当前错误是不是已经被改写成用户可读恢复提示
      - 当前恢复卡片是不是已经带出用户可执行的下一步
  - `apps/macos/Sources/Core/AppLanguage.swift`
    - 当前已开始把原始错误改写成用户可读恢复提示
    - 首批已覆盖：
      - `Gateway unreachable`
      - `OpenClaw Registry / runtime unreachable`
      - `401 / unauthorized / session expired`
  - `apps/macos/Sources/Core/AppViewModel.swift`
    - `OpenClaw Registry 不可达` 文案当前已补成“原因 + 恢复动作”格式
    - 当 external runtime 不可达时，前台不再只显示：
      - `connection refused`
      - `127.0.0.1:8788`
    - 而是会继续补出：
      - `请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接`
  - `apps/macos/Sources/Features/*`
    - Today / State / Goals / Reflections / Reminders / Login
    - 当前空数据页和登录页都已切到用户可读错误，不再直接把原始英文错误暴露给普通用户
- 这一轮验证已通过：
  - Web：
    - `corepack pnpm --filter @mindanchor/web exec vitest run src/api.test.ts src/pages/__tests__/coach-smoke.test.tsx src/pages/__tests__/dashboard-smoke.test.tsx`
    - `corepack pnpm --filter @mindanchor/web build`
  - API：
    - `corepack pnpm --filter @mindanchor/api build`
  - macOS：
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/CoachConversationTests`
  - 当前 Phase E 下一步重点变成：
  - 继续把 explainability 从“观测页 / 消息轨迹”推进到更完整的用户闭环
  - 特别是把 Web 的消息级操作继续推进到：
  - 这一轮针对收口后的 Web Coach 页面重新回归通过：
    - `corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach-original-runtime-route.integration.test.ts tests/debug-trace-summary.integration.test.ts --no-file-parallelism`
    - `corepack pnpm --filter @mindanchor/web exec vitest run src/pages/__tests__/coach-smoke.test.tsx src/api.test.ts`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/CoachConversationTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/MacAutomationTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/AppLanguageTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/AppViewModelAuthTests`
    - `node scripts/run-macos-coach-conversation-e2e.mjs`
    - `corepack pnpm --filter @mindanchor/web build`
    - `corepack pnpm --filter @mindanchor/api build`
  - 这一轮还收掉了一条真实 GUI E2E 的稳定性根因：
    - 之前 `scripts/run-macos-coach-conversation-e2e.mjs` 会直接继承当前 shell 里的 provider 配置
    - 一旦本机 provider 凭证失效，就会出现：
      - provider `401`
      - 前台 execution trail 退成 `当前路径 · failed`
      - 从而误伤整条 GUI 验收
    - 当前这条脚本已切到：
      - 仓库内本地 `openclaw/local-cluster-server.mjs`
      - 再把 API 显式指向这条本地 runtime
    - 这样这条真实 GUI Coach 验收已经回到可重复、可留档状态
  - 这一轮还把 `OpenClaw Registry` 告警链的恢复验收再收紧了一步：
    - `scripts/run-macos-openclaw-registry-e2e.mjs`
      - 当前不再只断言：
        - `danger`
        - `OpenClaw Registry 不可达`
      - 现在还会继续断言：
        - 告警 message 里必须明确出现 `OpenClaw`
        - 告警 message 里必须带出恢复动作：
          - `请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接`
      - 当前还已补上：
        - `MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=<bundle>`
        - 自定义 bundle 诊断链
      - 以及：
        - 当权限点击脚本没法从 `SecurityAgent` 拿到按钮树时
        - 会显式返回 `security-agent-present`
        - 不再一律落成模糊的 `not-found`
      - 当前针对 `SecurityAgent` 首次授权阻塞，还新增了更短的下一步建议：
        - `recover:macos:openclaw-registry-notifications`
      - 也就是失败时优先提示：
        - `recover`
        - 再退回 `install`
        - 最后是 `verify`
      - 当前 `recover` 脚本本身也已继续补上：
        - `--bundle-id=<bundle>`
        - 以及 custom bundle child env 透传
      - 这意味着：
        - `recover` 后续拉起的
          - `repair`
          - `probe`
          - `doctor`
          - `verify`
          - `test:macos:openclaw-registry-e2e`
        - 已经会继续针对同一个临时 bundle
        - 不会中途掉回稳定 bundle
      - 当前还新增了一条可交付报告产物链：
        - `corepack pnpm report:macos:openclaw-registry-notification-recovery`
      - 输入：
        - `tmp/mindanchor-openclaw-registry-notification-recovery-report.json`
      - 输出：
        - `tmp/mindanchor-openclaw-registry-notification-recovery-report.html`
      - 用途：
        - 把 bundle / result / recoveryAction / attempts / debug log 关键信息一次性整理成可读报告
      - 当前这条链又往前推了一步：
        - `recover:macos:openclaw-registry-notifications`
        - 结束时会自动生成对应 HTML 报告
      - 也就是一次执行后，默认会同时落下：
        - `tmp/mindanchor-openclaw-registry-notification-recovery-report.json`
        - `tmp/mindanchor-openclaw-registry-notification-recovery-report.html`
      - 当前还继续把：
        - `prepare`
        - `open profile`
        - `install`
        - `verify`
        - `doctor`
        - `E2E failure guidance`
        - 全部接上 bundle 定向命令前缀
      - 这意味着临时 bundle 模式下，失败输出已经不会再误导到稳定 bundle
    - 并且脚本当前也支持：
      - `MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=<unique-bundle>`
      - 这样遇到本机稳定 bundle 已被系统记成 `denied` 时，可以先用临时干净 bundle 继续诊断真实 GUI 链路
  - 当前这台机器的真实 GUI 状态也要明确留档：
    - 业务链没有卡住
      - `MacAutomationTests` 已通过
      - `AppViewModelAuthTests` 已通过
      - `OpenClaw Registry 不可达` 恢复文案已通过单测
    - 当前卡住的是 macOS 系统通知授权层
      - 稳定 bundle：
        - `notificationLiveState=denied`
      - 临时 bundle：
        - `notificationDebugState=request_in_flight`
        - 请求已经发出，但系统授权弹窗没有在这台机器上被稳定拉起
      - 本轮又补充确认了一条更精确的根因：
        - 真实 `SecurityAgent` 窗口确实已经出现
        - 观测到固定窗口：
          - `SecurityAgent window#41961 layer=1000 alpha=1 bounds=(743,225,434x182)`
        - 但当前宿主上它：
          - 不暴露稳定可用的 AX 按钮树
          - 也没有被当前自动化点击器真正接受
        - 所以 blocker 不是“没弹窗”
        - 而是“弹窗已出现，但属于当前主机上的安全窗自动化边界”
      - 这也意味着：
        - 当前所有失败输出都应该优先引导到
          - `install / verify / doctor`
          - 并且在临时 bundle 模式下带上正确的 bundle id 前缀
      - 本轮已再次真实复验：
        - `run-macos-openclaw-registry-e2e.mjs`
      - 当前失败输出已正确显示：
        - `已检测到 SecurityAgent 通知授权窗`
        - `建议优先执行：... recover:macos:openclaw-registry-notifications <notification-debug.log>`
        - `建议 recover 实参：... recover:macos:openclaw-registry-notifications <debug-log> <report-json>`
        - `预期恢复报告：...notification-recovery-report.json`
        - `预期恢复 HTML：...notification-recovery-report.html`
        - `doctor command: MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=<bundle> corepack pnpm doctor:...`
      - 当前又新增一条真实机结论：
        - 在最近一次复验里，通知权限已经成功进入：
          - `notificationDebugState=allowed`
          - `notificationDebugStatus=authorized`
        - 但链路仍卡在：
          - `system notification click`
          - 也就是 Notification Center 展示/点击自动化边界
      - 当前这两条路径已经正式拆开：
        - `SecurityAgent` 首次授权阻塞
        - `authorized` 之后的 Notification Center 点击阻塞
      - 对于第二条路径，当前失败提示会直接收口成：
        - “通知权限已经就绪，当前剩余问题集中在 Notification Center 展示 / 点击自动化边界。”
        - 并继续给出 `recover` 实参和 JSON / HTML 报告路径
      - 当前还新增了独立脚本：
        - `corepack pnpm diagnose:macos:notification-center-click`
      - 作用是：
        - 单独诊断 Notification Center 是否展示了目标通知
        - 当前点击尝试结果是什么
        - 并直接落 JSON / HTML 诊断报告
      - 当前这条点击诊断链也已经挂回 `run-macos-openclaw-registry-e2e.mjs`
      - 也就是一旦落到：
        - `notificationDebugState=allowed`
        - 但 `system notification click` 超时
      - 脚本会自动继续产出：
        - `tmp/macos-notification-center-click-diagnostics.json`
        - `tmp/macos-notification-center-click-diagnostics.html`
      - 最近一轮真实复验已确认这条自动诊断真的生效：
        - `clickResult = not-found`
        - `boundary = notification_center_click_boundary`
        - `dump = window:天气预报 ... / window:月 ...`
      - 这说明当前机器上的剩余问题已经非常具体：
        - Notification Center 当前展示的是别的卡片
        - 而不是目标 MindAnchor 告警通知
      - 同时，当前 `E2E` 失败后已经会自动触发：
        - `recover`
        - 并自动落下：
          - `tmp/mindanchor-openclaw-registry-notification-recovery-report.json`
          - `tmp/mindanchor-openclaw-registry-notification-recovery-report.html`
    - 这意味着下一步如果要继续彻底打通：
      - 优先不是改业务代码
      - 而是继续处理本机 `System Settings / Notifications / profile` 准备链
    - adapter route 已改成产品语言，下一步继续压缩视觉层级
    - message-local memory / trace 联动已增强并开始卡片化
    - send / retry / feedback 的状态提示统一后，再继续收紧信息密度
    - “默认只看最重要信息，次级信息再展开” 已开始落地，下一步适合继续压缩文案与卡片数
    - “来源解释”区也已进入摘要优先，顶部卡片文案也已开始收口
    - 下一步更适合考虑是否把顶部 3 卡进一步并成 2 卡

### 16.7 Phase F｜正式交付验证

目标：

- 证明“OpenClaw 生态 + MindAnchor 产品层”路线能达到最终交付标准

任务：

- clean-machine
- external OpenClaw
- first-time user
- notification / conversation / memory / feedback 全链留档

出口验证：

- 至少一轮完整交付彩排通过并留档
- 用户在自己的 OpenClaw 生态中能看见并管理这套 agent
- 同时能在 MindAnchor 多端中稳定用到它们

当前状态：

- **未开始**

### 16.8 与当前主线的关系

当前 B 档迁移不是替代眼前主线，而是：

- 当前 `Phase 5.13 / 5.14 / 5.15 / 5.11 / 6.13`
  继续优先收当前系统的质量门槛和交付门槛
- 待这些基础更稳后，B 档迁移按 `Phase A -> Phase B -> Phase C -> Phase D -> Phase E -> Phase F` 推进

这能保证：

- 我们做的每一步都与最终目标统一
- 但不会因为过早大迁移而打断当前已经接近成形的交付主链
