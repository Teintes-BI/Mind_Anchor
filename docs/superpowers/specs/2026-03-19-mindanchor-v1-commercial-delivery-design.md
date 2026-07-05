# MindAnchor V1 商用交付规约设计

## Goal

定义 MindAnchor 第一版可商用交付物的唯一主规约，明确：

- V1 到底交付什么
- 交付给谁
- 以什么形态交付
- 哪些能力必须上线
- 哪些能力明确不阻塞首发
- 客户端、Gateway、OpenClaw、Web 的职责边界
- 普通用户如何完成安装、登录、连接、使用和排障

本文档用于替代此前偏探索式、多轨并行的规划口径。自本文档确认后，`apps/macos`、`apps/api`、`apps/web`、部署引导和验收测试都以本规约为准。

## Product Decision Ledger

本节用于记录用户已经明确做出的关键产品决策、对应理由，以及这些决策对后续开发的约束。

后续凡是影响以下任一方向的新决定，都必须继续增写到本节，而不是只改零散段落：

- 交付形态
- 架构主脑
- 客户端路线
- agent team 结构
- memory 来源与治理
- 发布边界
- V1 scope 与非阻塞项

### 记录规则

- 本节是主规约中的“高优先级决策台账”。
- 新决策必须写明：`决定了什么`、`为什么这样定`、`对开发的直接约束`。
- 若后续新决定与旧决定冲突，必须：
  - 追加一条新决策说明替换关系
  - 同步修正文档其他段落
  - 不能只改实现，不改规约
- 开发、拆任务、做设计、补测试前，应先检查本节是否存在相关冻结约束。

### 已确认决策

#### D-001｜V1 固定为单用户商用交付

- 决策：
  - V1 首发固定为单用户，不做多用户实例，不做团队协作。
- 理由：
  - 用户明确选择“单用户”与“普通用户”作为首发对象，希望先把核心闭环做成熟，不被多租户和协作复杂度拖偏。
- 开发约束：
  - 不允许把多用户、团队、共享工作区作为当前主线阻塞项。

#### D-002｜真正的大脑是用户自部署的 Gateway + OpenClaw

- 决策：
  - 系统智能中枢固定在用户自部署的 Gateway + OpenClaw 集群上，而不是工作电脑、手机或浏览器本地。
- 理由：
  - 用户明确要求真正的大脑不在工作设备上，兼顾隐私边界、架构清晰度和长期可扩展性。
- 开发约束：
  - 不允许把本地模型推理、工作设备本地 OpenClaw、客户端本地业务决策重新引回主线。

#### D-003｜客户端统一是入口/出口，不是业务大脑

- 决策：
  - Mac、Web、移动端统一作为数据入口/出口：采集、上传、接收、展示、提醒。
- 理由：
  - 用户明确要求所有业务推理、融合、Agent 编排、结论生成都在 OpenClaw 集群侧完成。
- 开发约束：
  - 客户端只能做最小必要展示与交互，不能内嵌长期 heuristics 作为最终业务真相。

#### D-004｜Mac 客户端优先，作为 V1 主入口

- 决策：
  - 当前主客户端优先级固定为 macOS。
- 理由：
  - 用户希望先把“电脑活动频率来源数据 + 提醒 + Coach 主链”在 Mac 上做实，再扩展其他平台。
- 开发约束：
  - 若资源冲突，优先保证 `apps/macos`、Gateway、OpenClaw conversation 主链，不优先扩展 Android / iOS / 多模态 Beta。

#### D-005｜放弃 Electron 主路线，正式改为原生 macOS

- 决策：
  - 旧 `apps/desktop` 不再是目标实现；正式客户端固定为 `apps/macos`，技术栈固定为 `SwiftUI + AppKit`。
- 理由：
  - 用户明确要求做“成熟、完整、可商用”的 Mac 应用，并直接放弃 Electron 路线。
- 开发约束：
  - 不允许再以 Electron 作为主交付目标；`apps/desktop` 仅保留历史资产或迁移 fallback 身份。

#### D-006｜Mac 首发交互形态固定为“菜单栏常驻 + 主窗口”

- 决策：
  - 首发形态固定为状态项常驻与可打开主窗口，不做纯 menubar-only。
- 理由：
  - 用户需要常驻在线、快捷入口、提醒接收、状态查看、排障与可解释界面。
- 开发约束：
  - 与提醒、对话、状态、设置相关的能力，必须在主窗口内有稳定承载，不应只依赖隐藏入口。

#### D-007｜V1 主线先做低侵入桌面信号、提醒与 Coach 闭环

- 决策：
  - 首发主线优先打通桌面活动信号、提醒、状态、任务、恢复与 Coach conversation。
- 理由：
  - 用户多次确认音频、视频、健康真实接入都不是当前阻塞项，核心是把最低侵入、最高价值的主链做稳定。
- 开发约束：
  - 音频 / 视频 / 健康 / 外部通知等轨道不能反向挤占当前主线资源。

#### D-008｜每个 agent 都保留独立模型身份

- 决策：
  - 每个 agent 必须按自己的 agent 名拥有独立模型配置身份；当前阶段可临时共用同一个 `gpt-5.4`。
- 理由：
  - 用户明确要求后续能按情感、语音、代码、逻辑等职责单独替换模型，不要匿名共享。
- 开发约束：
  - 配置解析、调试审计、trace、回归测试都要保留 agent-name-based identity。

#### D-009｜Memory 的长期真相源固定在 Gateway / 现有库

- 决策：
  - agent 获取 memory 的正式来源固定为 Gateway / 现有业务库与 retrieval contract，而不是模型侧自由生长的黑箱 memory。
- 理由：
  - 用户认可“Gateway / 现有库为主”的路线，希望 memory 可审计、可撤销、可治理、不污染 agent。
- 开发约束：
  - 不允许把长期记忆只存在模型提示词拼接或客户端本地缓存中；必须可回查、可 revoke、可解释。

#### D-010｜OpenClaw Conversation / Coach 必须单独成链，避免污染其他 agent

- 决策：
  - 面向 Mac Coach 的 OpenClaw conversation 能力必须作为一条独立 agent/team lane 演进，不与其他业务 agent 语义混杂。
- 理由：
  - 用户明确要求“对 openclaw 单独做一个 agent 出来，不要和其他 agent 污染了”。
- 开发约束：
  - Coach persona、Coach memory、Coach feedback、Coach trace 需要保持边界清晰，不能与普通任务/状态 agent 直接混写。

#### D-011｜Coach 第一阶段先做只读建议型

- 决策：
  - Coach 第一阶段先以“只读建议型”为主，不直接做高权限自动执行。
- 理由：
  - 用户明确要求先验证效果、先做可读、可追踪、可纠偏的建议链，再逐步增加更高权限能力。
- 开发约束：
  - 默认优先建议、解释、提示、proposal；真正的 authority apply 必须受明确路由与边界控制。

#### D-012｜学习顺序固定为“偏好 / 习惯优先，强化训练在后”

- 决策：
  - 个性化先从偏好与习惯学习做起，强化学习和更重的定制训练作为后续档位记录在计划中。
- 理由：
  - 用户明确选择“两者都记，但先以偏好/习惯为主”，希望先把可解释、可治理的贴合感做起来。
- 开发约束：
  - 当前主链不以 RL 训练为前置，不允许为了“训练”破坏现有可审计 memory / feedback pipeline。

#### D-013｜必须有一个专门的 director-agent 统一决定谁出面

- 决策：
  - agent team 不采用“多个 agent 同时抢答”模式，而是由专门的 director-agent 决定当前由谁前台出面。
- 理由：
  - 用户明确要求由一个平衡/导演角色决定谁出面，避免声音混乱和责任不清。
- 开发约束：
  - 前台默认只能有一个用户可见人格；consult 与 authority 必须通过明确路由进入，而不是并列发言。

#### D-014｜Secretary agent 负责现实计划统筹与情绪冲击下的改排

- 决策：
  - 需要一个“秘书型” agent，负责组织生活计划、任务安排，以及遇到突发情况和情绪波动时做统筹调整。
- 理由：
  - 用户明确希望把全部生活计划放入系统，并由秘书型 agent 根据现实与情绪共同调整安排。
- 开发约束：
  - 计划改排、任务重排、恢复块插入等能力，应优先归到 `Jarvis` / life secretary 角色，不要分散到其他人格。

#### D-015｜Agent Team 的用户可见人格名已冻结

- 决策：
  - 当前用户可见人格命名已冻结为：
    - director-agent → `Picard`
    - emotional companion → `Deanna Troi`
    - analyst-agent → `Spock`
    - balance / grounded wisdom → `Guinan`
    - life-secretary-agent → `Jarvis`
    - memory-governor-agent → `Data`
- 理由：
  - 这些名字由用户逐个确认，要求“来源真实原型、与职责贴切、有未来感但不空泛”。
- 开发约束：
  - 后续 persona 文案、soul、UI、trace 展示、命名映射都应以这套冻结命名为准，避免频繁改名造成认知漂移。

#### D-016｜Mac 客户端语言固定支持中英双语，默认中文

- 决策：
  - macOS 客户端固定支持中文 / 英文切换，默认中文；专有名词与 agent 名保留英文。
- 理由：
  - 用户明确要求双语能力，同时保留系统中的英文专有名词一致性。
- 开发约束：
  - 新 UI 文案、通知文案、设置项、Coach 视图都必须按双语体系扩展，而不是只写单语文案。

#### D-017｜关于主规约本身：所有大方向决策继续增写到本文件

- 决策：
  - 后续所有涉及方向、范围、架构、agent team、memory、发布边界的大决定，统一继续增写到本主 spec。
- 理由：
  - 用户多次明确要求“在原 spec 文档上增写，而不是重写一份”，以避免多份主规约并行导致跑偏。
- 开发约束：
  - 不允许再新开平行主 spec 替代本文；若有子计划、子 runbook，可以新增，但主方向必须回写本文。

#### D-018｜项目执行方式固定采用“目标树 + Task Packet + 阶段出口验证”

- 决策：
  - 后续执行固定采用：
    - 主规约
    - 阶段树
    - 决策台账
    - Task Packet
    - 阶段出口验证
    这套执行操作系统。
- 理由：
  - 用户明确要求同时解决两件事：
    - 我们实际在做的事情是否和最终目标统一
    - 如何在 `512KB` 上下文限制下持续推进而不失控
- 开发约束：
  - 新任务若不能映射到阶段目标、Task Packet 和出口验证，就不能直接开工。

#### D-019｜上下文预算按“安全工作预算”使用，不按 512KB 上限直接使用

- 决策：
  - 后续单任务默认只主动占用 `180KB–220KB` 左右上下文。
- 理由：
  - `512KB` 是硬上限，不是可随意占满的工作预算；需要给代码、diff、日志、错误和推理留余量。
- 开发约束：
  - 单任务必须做到：
    - 单一目标
    - 单一主验证
    - 有限文件范围
    - 可压缩总结
  - 任何超出预算的任务都必须继续拆分。

#### D-020｜OpenClaw 生态接入路线固定选择 B 档“运行接入”

- 决策：
  - OpenClaw 生态接入路线固定选择：
    - **B 档：运行接入**
  - 即：
    - OpenClaw 负责 agent 注册、agent runtime、agent 调度入口、agent 管理
    - MindAnchor 负责多端产品层、Gateway、长期 memory authority、read model 与用户闭环
- 理由：
  - 用户已经明确确认：
    - 目标不是只做一层“像 OpenClaw 一样管理”的外观
    - 而是开发一套能直接配合用户原 OpenClaw 生态的 agent 组合，并和全终端 App 打通做成产品
  - A 档太轻，C 档当前过重，B 档最符合现阶段路线。
- 开发约束：
  - 后续迁移以“OpenClaw 成为 agent 运行真相源，MindAnchor 保留产品和业务真相源”为总边界。
  - 不允许在没有记录替换理由的前提下，悄悄退回 A 档或直接跳成 C 档。

### 开发防跑偏检查点

后续开发若出现以下倾向，应视为偏离本规约，需要先停下并回看本节：

- 又想把本地模型或客户端 heuristics 重新做成业务大脑
- 又想把 Electron 重新拉回主交付路线
- 又想把多用户 / 团队协作拉入 V1 首发范围
- 又想绕过 Gateway retrieval contract，直接把长期 memory 塞进模型黑箱
- 又想让多个 agent 同时对用户发言，而不是由 `Picard` 统一调度
- 又想在没有记录到本节的情况下，悄悄修改交付边界、人格命名、学习路线或发布标准
- 又开始按“长任务 + 大上下文 + 模糊完成标准”推进，而不是按 Task Packet 和阶段出口验证推进
- 又把 OpenClaw 生态接入退回成“只是加个管理层”，而不是按 B 档运行接入推进

## Execution Operating System

这一节不是产品功能，而是**项目如何被正确执行**的固定方法。

它要解决两个问题：

1. 如何保证我们实际做的事情和最终目标统一
2. 如何在 `512KB` 上下文限制下持续推进而不失控

### 五份长期文档

后续推进固定依赖这五份文档：

- **主规约**
  - 定义最终产品目标、交付边界、冻结决策
- **阶段树**
  - 定义当前阶段、下一阶段、任务顺序与阶段出口
- **决策台账**
  - 记录关键决定、理由、替换关系与禁止回退点
- **Task Packet**
  - 每个执行任务的最小上下文包
- **验证报告**
  - 每个阶段的出口留档与证据

### 四层目标树

后续所有工作必须能映射到下面四层中的一层：

- **L0：最终目标**
  - MindAnchor 最终要成为什么产品
- **L1：阶段目标**
  - 当前阶段要新增什么能力
- **L2：阶段任务**
  - 为达到该阶段目标需要完成哪些任务
- **L3：Task Packet**
  - 本轮实际执行的最小工作单元

如果某个任务不能从 `L3` 一路追溯到 `L0`，就不应开工。

### Task Packet 固定模板

后续每个任务包都必须包含：

- 任务名称
- 所属阶段
- 目标
- 非目标
- 依赖的决策
- 涉及文件
- 唯一主验证
- 完成定义
- 5–10 行压缩总结

### 上下文预算规则

后续上下文预算固定如下：

- 主目标 / 阶段摘要：`20KB`
- 当前 Task Packet：`10KB`
- 关键决策摘要：`10KB`
- 必读代码与文档切片：`80KB–120KB`
- 验证输出 / 错误日志：`30KB–40KB`
- 保留余量：`>250KB`

也就是说：

- **不按 512KB 上限工作**
- **按 `180KB–220KB` 的安全工作预算工作**

### 任务拆分硬规则

单任务默认必须满足：

- 单一目标
- 单一主验证
- 最多 `3` 个写文件
- 最多 `5` 个必读文件
- 最多 `2` 个接口边界
- 目标执行时长 `30–120` 分钟

出现以下任一情况就必须继续拆：

- 任务跨多个核心系统边界
- 任务完成后无法通过一个主验证判断成败
- 任务既包含架构决策又包含大量实现细节
- 任务需要反复加载大段历史上下文

### 阶段执行线性流程

后续每个阶段固定走下面 6 步：

1. 锁定阶段目标
2. 写清阶段非目标
3. 拆出阶段任务树
4. 为每个任务生成 Task Packet
5. 逐个执行并做 focused verification
6. 阶段结束后做出口验证并压缩总结

### 阶段出口验证固定四类

后续阶段出口统一只认这四类：

- **目标检查**
  - 该阶段承诺的新能力是否真的出现
- **技术检查**
  - 关键 contract / test / e2e 是否通过
- **产品检查**
  - 用户真正使用到的链路是否可用
- **归档检查**
  - 是否留下报告、摘要、下一阶段默认顺序

没有出口验证，就不算阶段完成。

## Product Definition

MindAnchor V1 不是一个监控软件，也不是一个通用待办工具。它的首发定位是：

- 一个帮助用户持续推进长期目标的个人执行辅助系统
- 一个以桌面活动信号为主输入的状态感知与提醒产品
- 一个以用户自部署 OpenClaw 集群为智能中枢的单用户系统

V1 的核心体验是：

1. 用户在自己的 Mac 上安装原生客户端
2. 用户在自己的非工作设备或自有服务器上部署 Gateway + OpenClaw
3. 用户登录后，桌面客户端开始采集低侵入活动信号
4. Gateway 将结构化数据交给 OpenClaw 生成状态、建议、恢复方案和提醒
5. 客户端与 Web 控制台回显这些结果，形成任务推进、状态感知、提醒和复盘闭环

## Delivery Form

### 交付模型

V1 固定为以下交付形式：

- 客户端由产品方交付
- Gateway 与 OpenClaw 由用户自部署
- 产品首发面向单用户
- 安装和使用面向普通用户，而不是默认只面向命令行工程师

### 交付对象

V1 的目标用户画像为：

- 愿意为个人目标推进和状态管理付费的个人用户
- 可以接受按引导完成自部署，但不希望自己手工拼装复杂基础设施
- 重视隐私，希望真正的大脑不放在工作电脑上

### 交付体验

服务器侧交付体验固定为：

- 不是纯手工命令行教程
- 不是官方托管 SaaS
- 而是“普通用户可完成”的引导式安装流程

这意味着 V1 需要交付的不只是二进制和源码，还包括：

- 明确的环境准备说明
- 安装前检查
- 逐步部署引导
- 首次连接向导
- 常见错误排查文档

## V1 Scope

### 必须上线

以下能力属于 V1 首发阻塞项：

- 原生 `macOS` 客户端
- Gateway API
- OpenClaw 对接能力
- Web 控制台
- 正式登录与鉴权
- 单用户设备绑定
- Mac 桌面活动采集
- 提醒收发闭环
- 状态、任务、恢复建议、复盘闭环

### 首发不阻塞

以下能力允许继续保留规划或 Beta 身份，但不进入 V1 发布门槛：

- Android 客户端
- iOS 客户端
- 音频 Beta
- 视频 Beta
- 健康数据接入
- Feishu / Telegram 外部通知
- 自动更新
- App Store / Setapp 分发

### 明确不纳入 V1

以下内容在 V1 中明确不做：

- 多用户实例
- 团队协作
- 工作电脑本地模型推理
- 截图、键盘记录、聊天正文采集
- 默认开启的敏感媒体采集
- 官方托管 OpenClaw 服务

## Deliverables

V1 的最终交付物固定为四类。

### 1. Mac 原生应用

交付一个可安装、可运行的原生 `SwiftUI + AppKit` macOS 应用，至少包含：

- 登录页
- 菜单栏常驻能力
- 主窗口多页面壳
- Today、Goals/Tasks、State、Reflections、Reminders、Settings 页面
- 本地权限诊断
- 本地日志与错误提示

### 2. Gateway 服务

交付一个用户可自部署的 Gateway 服务，负责：

- Bearer 鉴权
- 单用户上下文派生
- 设备注册与心跳
- 结构化事件接收
- 读模型聚合
- 与 OpenClaw 集群的安全对接

### 3. OpenClaw 对接层

交付 OpenClaw 集群接入规范，而不是在客户端本地跑模型。V1 中 OpenClaw 是唯一智能中枢，负责：

- 状态分析
- 任务建议
- 恢复建议
- 复盘报告
- 提醒决策

### 4. Web 控制台

交付一个面向用户的辅助控制台，至少包含：

- Dashboard
- GoalFlow / Tasks
- State Trends
- Recovery History
- Reflections
- Inbox / Reminders

Web 控制台是辅助查看与管理入口，不是主采集端。

## User Journey

### 首次使用

1. 用户获得 Mac 安装包与服务器部署引导
2. 用户在自己的服务器环境中按向导部署 Gateway + OpenClaw
3. 用户在 Mac 上安装并打开客户端
4. 用户注册或登录自己的单用户账户
5. 客户端完成设备注册与首屏 bootstrap
6. 用户授予通知权限；按需授予桌面活动采集相关权限
7. 客户端开始采集活动信号并回传
8. 用户开始创建目标、任务，并进入日常使用

### 日常使用

用户日常使用的最小闭环是：

1. 打开或保持菜单栏客户端在线
2. 客户端上报桌面活动信号
3. Gateway / OpenClaw 生成状态评估与建议
4. 提醒回流到 Mac 客户端
5. 用户在客户端或 Web 查看状态、任务和复盘

### 关键体验标准

V1 不要求做“无感自动一切”，但必须做到：

- 登录后系统可持续工作
- 断网后不直接丢事件
- 提醒能稳定抵达
- 用户能理解当前采集了什么、没采什么、为什么提醒自己

## System Responsibilities

### Mac Client

Mac 客户端只负责：

- 登录与会话保持
- 设备注册与心跳
- 低侵入桌面活动采集
- 本地排队与补传
- 提醒接收与展示
- 手动 check-in
- 展示状态、任务、复盘与诊断信息

Mac 客户端不负责：

- 跑本地 LLM
- 执行业务推理
- 直接保存长期业务真相源

### Gateway

Gateway 负责：

- 认证用户上下文解析
- 统一 API 入口
- 客户端与 OpenClaw 之间的协议适配
- 读模型输出
- 设备与提醒数据聚合
- 服务端可观测性与调试能力

Gateway 不是最终业务大脑。它是网关和读模型协调层。

### OpenClaw

OpenClaw 是唯一智能中枢，负责：

- 接收 Gateway 转发的结构化上下文
- 调用大模型与 agent 链
- 生成业务结论
- 返回结构化结果给 Gateway

所有状态推理、恢复建议、复盘报告、提醒决策都以 OpenClaw 输出为准。

### Web Console

Web 负责：

- 查看最新状态
- 查看目标与任务
- 查看恢复建议
- 查看复盘与趋势
- 查看提醒收件箱

Web 不承担关键采集职责。

## Mac Client V1 Requirements

### 应用壳

V1 的 Mac 客户端固定为：

- 菜单栏常驻
- 主窗口多页面
- 关闭主窗口不退出
- 显式退出才结束进程

### 登录与鉴权

V1 必须具备正式登录流，不再依赖 `demo-user` 作为正式交付路径。

登录要求：

- 支持邮箱登录或等价单用户正式凭证
- 成功登录后存储安全会话
- 所有业务请求默认走 Bearer Token
- 服务端以认证上下文派生真实用户，不信任客户端伪造的 `userId`

### 桌面活动采集

V1 只采集低侵入活动信号：

- `idle`
- `lock`
- `unlock`
- `active_app`
- `window_switch`
- `manual_checkin`

V1 明确不采集：

- typed text
- 截图
- 聊天正文
- 文档正文
- 麦克风和摄像头原始媒体

### 本地状态与补传

V1 的 Mac 客户端必须具备正式的本地可靠性能力：

- 事件本地入队
- 后台自动 flush
- 失败重试
- 最近同步时间与错误可视化
- 最近活动摘要缓存
- 提醒 snooze 状态本地持久化

### 提醒中心

V1 必须支持：

- 拉取 Inbox / Reminder 读模型
- 本地系统通知
- 打开主窗口
- 标记已处理
- 本地稍后提醒

提醒决策来源固定为服务器侧，不在客户端做本地业务推理。

### 设置与诊断

Settings 页至少需要：

- 当前账户信息
- API / 连接状态
- 版本信息
- 通知权限状态
- 桌面活动采集权限状态
- 一键刷新权限状态
- 日志导出入口

## Gateway V1 Requirements

### 认证模型

V1 固定为单用户，但服务端仍通过正式认证上下文识别用户，不再把“单用户”实现成不设防模式。

Gateway 必须支持：

- 账户注册/登录
- Bearer Token 验证
- `GET /me`
- `GET /client/bootstrap`

### 设备模型

V1 至少支持：

- 设备注册
- 设备心跳
- 设备能力上报
- 当前在线状态聚合

### 业务读模型

Gateway 必须稳定输出以下读模型：

- Dashboard Summary
- GoalFlow Overview
- State Latest / Trends
- Recovery History
- Reflections Latest / Overview
- Client Inbox / Inbox Overview

### OpenClaw 适配

Gateway 必须以 OpenClaw 为最终智能路径，至少保证：

- 能把结构化上下文提交给 OpenClaw
- 能接收结构化结果并落回读模型
- 出错时提供清晰 trace / 错误原因

## OpenClaw Integration V1

### 定位

OpenClaw 集群是用户自部署的智能运行面，不放在工作电脑上，也不放在手机上。

### V1 必须承担的工作流

OpenClaw 在 V1 中必须支撑：

- `state_assessment`
- `task_management`
- `recovery_plan`
- `progress_summary`
- `reflection_report`
- `notification_dispatch`

### 接口要求

V1 需要一个稳定、可文档化的 Gateway → OpenClaw 协议，不允许依赖隐式约定才能跑通。

最重要的是保证：

- 输入结构稳定
- 输出结构稳定
- 能追踪 trace
- 能区分 Gateway 错误、模型错误、OpenClaw 错误

### OpenClaw Native Agent Team

V1.1 起，MindAnchor 不再把 agent 只视为 Gateway 侧“命名目标”或“外部 provider prompt 分流标签”，而是要逐步演进为：

- `Picard`：总导演 / 路由与统筹 agent
- `Deanna Troi`：情绪陪伴与上下文采集 agent
- `Spock`：理性分析与结构判断 agent
- `Guinan`：平衡推进与节奏调节 agent
- `Jarvis`：计划、排程与执行变更 agent
- `Data`：长期记忆治理与回收边界 agent

这些 agent 的用户可见人格名、背景、人设与 soul 文件继续保留在 `openclaw/souls/` 下，但后续目标不只是“有 soul 文件”，而是要把它们作为 **OpenClaw 原生 agent team** 真正注册到运行时中。

也就是说，V1 当前的 Gateway + OpenClaw 结构在首发阶段可以接受“Gateway 编排 + OpenClaw 执行”为主，但后续主线必须收敛到：

- agent identity 在 OpenClaw 内部可枚举、可探测
- 每个 agent 都有独立 model config、soul、skill scope、I/O contract
- `Picard` 成为唯一前台路由入口与团队协调者
- 其他 agent 通过 consult / handoff / proposal 方式协作，而不是互相直接污染输出

### Memory Authority

MindAnchor 后续 agent team 的 memory 权威真源固定为：

- **Gateway / 现有服务端存储为主**

而不是：

- 工作电脑本地文件为主
- OpenClaw agent 自己私有落库
- 每个 agent 各自保存一份长期真相

这样做的原因是：

- 便于统一权限、审计、删除、回滚
- 便于做用户反馈与标注后的治理
- 便于后续替换 OpenClaw runtime 或替换模型时，memory 不丢失
- 便于防止多个 agent 各自形成不一致的“私有真相”

因此，V1.1 的原则是：

- OpenClaw 负责 agent 执行、路由、提案与对话生成
- Gateway 负责 memory 持久化、检索、治理和最终真相源

### Memory Access Model

所有 OpenClaw agent 都 **不得直连数据库**。agent 获取 memory 的唯一允许路径是：

- `OpenClaw Agent -> Memory Skill / Gateway Adapter -> Gateway Memory API -> 现有库`

也就是说，agent 读取 memory 时，必须通过受控 skill 或 Gateway Adapter 请求结构化 memory bundle，而不是自己拼 SQL 或直接读取服务端存储。

建议的读取流程固定为：

1. Gateway 下发 task envelope 给 OpenClaw
2. envelope 中包含：
   - `userId`
   - `sessionId`
   - `traceId`
   - `workflow`
   - `frontAgent`
   - `memoryScopes`
3. OpenClaw 当前 agent 调用统一 memory retrieval skill
4. Gateway 返回裁剪后的 memory bundle
5. agent 基于 bundle 生成建议、结论或回复

建议的 memory 读取结果结构至少包含：

- `identity`
- `preferences`
- `habits`
- `constraints`
- `recentContext`
- `memoryMetadata`

每条 memory 至少应带：

- `memoryId`
- `kind`
- `summary`
- `source`
- `confidence`
- `updatedAt`
- `recallAllowed`

### Memory Scope Isolation

不同 agent 默认只能读取与自己职责相关的 memory scope，不允许默认全量读取全部长期记忆。

建议的默认范围：

- `Picard`
  - 可读：`preferences`、`habits`、`constraints`、`recentContext`
  - 用途：决定当前前台人格、是否 consult、是否 handoff
- `Deanna Troi`
  - 可读：`preferences`、`recentContext`、情绪相关模式摘要
  - 用途：陪伴、安抚、信息补采
- `Spock`
  - 可读：`constraints`、`habits`、任务与现实上下文
  - 用途：理性分析、现实判断
- `Guinan`
  - 可读：`preferences`、`habits`、恢复与节奏相关模式
  - 用途：平衡现实推进与情绪负荷
- `Jarvis`
  - 可读：`constraints`、日程、任务、执行偏好
  - 用途：改计划、排优先级、重排时间块
- `Data`
  - 可读：memory proposal、memory metadata、recall / delete / block 状态
  - 用途：治理长期记忆，不默认当前台

### Memory Write Model

Agent 不直接写正式 memory，而是先写 **memory proposal**。

建议流程为：

1. agent 从一次对话、一次 check-in、一次状态变化中提炼出候选记忆
2. 通过 Gateway Memory Proposal API 提交 proposal
3. `Data` 或 Gateway 规则层审核 proposal
4. 通过后才进入正式 memory store

因此，后续所有写入都应遵守：

- `agent -> proposal`
- `proposal -> governance`
- `governance -> persisted memory`

而不是：

- `agent -> direct write`

### Memory Feedback Loop

后续偏好/习惯学习与用户反馈强化也以 Gateway/现有库存储为主。

用户对建议、提醒、对话的反馈，后续至少分成两类：

- `preference feedback`
  - 用户更喜欢哪种表达、节奏、提醒方式
- `habit / outcome feedback`
  - 哪种建议在现实中更有效，是否真的帮助恢复或推进

这些反馈先入 Gateway，再由治理层转成：

- memory strengthening
- memory weakening
- memory revoke
- future routing hints

这为后续“越用越懂你”的 agent team 打基础，但不会让 agent 自己私下保存一套不可控偏好数据。

### V1.1 Implementation Direction

基于以上原则，后续 OpenClaw Native Agent Team 的最小落地顺序固定为：

1. 先把 `Picard`、`Deanna Troi`、`Spock` 注册为 OpenClaw 原生 agent
2. 再补 `Guinan`、`Jarvis`、`Data`
3. 先完成：
   - memory context read
   - memory proposal write
   - proposal governance handoff
4. 再推进：
   - feedback-based preference strengthening
   - habit/outcome 级别的长期学习

在这一阶段，允许 Gateway 继续保留部分 orchestration 兼容逻辑，但长期目标明确为：

- **agent 在 OpenClaw 内真正运行**
- **memory 在 Gateway/现有库中统一治理**
- **两者通过受控 skill / API 契约耦合，而不是互相越界**

### V1.1 Current Implementation Status

截至当前代码状态，以下部分已经实际落地：

- Gateway 已提供：
  - `GET /internal/agent-memory/context`
  - `POST /internal/agent-memory/proposals`
- 共享 domain contract 已补齐：
  - `MemoryScope`
  - `AgentMemoryContextBundle`
  - `AgentMemoryProposal`
  - `AgentRuntimeDescriptor`
- 6 个 persona agent 已通过 `openclaw/runtime/agent-registry.mjs` 注册为本地 runtime 原生 registry
- local runtime 已支持：
  - runtime metadata 暴露
  - task envelope 携带 `workflow`、`frontAgent`、`runtimeAgentId`、`memoryScopes`
  - 在生成前向 Gateway 拉取 scoped memory
- `Picard` 路由 helper 已从 Gateway 浅规则中抽出到 OpenClaw workflow 文件：
  - `openclaw/runtime/workflows/picard-router.mjs`
  - `openclaw/runtime/workflows/persona-executor.mjs`
- `Jarvis` / `Data` authority workflow 已具备原生 runtime 结构化输出：
  - `openclaw/runtime/workflows/jarvis-authority.mjs`
  - `openclaw/runtime/workflows/data-governor.mjs`
- Gateway 已新增 authority execution 内部执行入口，可把结构化决策真正落到现有存储：
  - `POST /internal/agent-authority/jarvis/execute`
  - `POST /internal/agent-authority/data/execute`
- OpenClaw runtime 已新增 `authority-client`，并支持在显式 `applyAuthority=true` 时主动调用 Gateway authority execution：
  - `openclaw/runtime/authority-client.mjs`
  - 当前已接入：
    - `life-secretary-agent` -> Jarvis authority apply
    - `memory-governor-agent` -> Data governance apply
- Gateway authority execution 已新增 apply 后读模型自动回流：
  - 低风险 Jarvis apply 后会立即刷新并返回：
    - `dashboard summary`
    - `goalflow overview`
    - `client inbox overview`
  - Data governance 当前也会带出同批 read-model snapshot，便于 trace 与调试对齐
- local runtime 返回 metadata 已补充 authority apply 结果：
  - `authorityApplied`
  - `authorityApply`
    - `attempted`
    - `applied`
    - `endpoint`
    - `status`
    - `error`
    - `readModelRefresh`
- Conversation coach 主链已开始收敛到 `Picard -> front persona`：
  - Gateway 对话入口现在会先用 `Picard` 路由当前用户消息
  - 然后把 fast / full 生成真正打到前台 persona target
  - 当前前台 persona 会同步写入 `coachFrontAgentState`
  - `dashboard summary` 已能反映最近一次对话选中的前台 persona
- 对 mixed emotional + analytical turn，consulted agent 已开始真实执行：
  - 当前链路支持 `Picard -> front persona -> consulted persona -> front persona final`
  - consult 当前已进入同一条 conversation trace
  - 已新增 trace 事件：
    - `coach.consult.started`
    - `coach.consult.completed`
- `unhelpful` feedback 已开始进入治理闭环：
  - 如果一条 assistant message 被标记为 `unhelpful`
  - 该消息引用过的 `usedMemoryIds` 会被 revoke
  - 该消息对应的 `coachTrainingExample` 会被 invalidated
  - 已新增 trace 事件：
    - `coach.feedback.applied`
- `helpful` feedback 已开始进入 strengthening proposal 闭环：
  - 如果一条 assistant message 被标记为 `helpful`
  - 当前会生成一个轻量 `memory-strengthening candidate proposal`
  - proposal 暂不直接改写长期 memory，而是先进入候选层
  - 已新增 trace 事件：
    - `coach.feedback.strengthening.proposed`
- local runtime 已支持 persona target 直接承接：
  - `coach_conversation_fast`
  - `coach_conversation_full`
  - `coach_conversation_consult`
- Gateway env / config audit 已把 persona agents 正式纳入独立 target：
  - `director-agent`
  - `companion-agent`
  - `analyst-agent`
  - `balance-agent`
  - `life-secretary-agent`
  - `memory-governor-agent`
- 当前 `Jarvis` 已能经 Gateway 执行：
  - 低风险 task ordering direct apply
  - 高风险 plan change proposal create
- 当前 `Data` 已能经 Gateway 执行：
  - candidate accept
  - candidate reject
  - memory recall block
  - memory delete
- `coach.memory.revoked` trace 事件已补齐，memory revoke 开始进入可观测主链
- 当前 `conversation-coach` 的 cluster 路径时序也已稳定，memory persisted 与 full completion 不再乱序

但当前仍属于 **V1.1 过渡态**，尚未完全完成的部分包括：

- `Picard` 路由结果在所有业务 agent workflow 中的统一落地
- proposal -> governance -> persisted memory 的完整 OpenClaw 内部编排闭环
- authority 执行后的 trace 聚合与跨 workflow 统一呈现
- 本地 runbook 之外的集群部署 runbook

### V1.1 Recommended Next Plan

基于当前已完成程度、对主线价值、以及后续返工成本，后续最推荐的推进顺序固定为：

#### Phase A｜Authority Apply 从“可执行”推进到“OpenClaw 主动执行”

目标：

- 不再只是 Gateway 暴露 `authority execution` 内部接口
- 而是让 OpenClaw runtime 在 `Jarvis` / `Data` 决策之后，主动调 Gateway apply

建议顺序：

1. 新增 `openclaw/runtime/authority-client.mjs`
2. 让 `Jarvis authority workflow` 在输出 direct/proposal 决策后，可选调用 Gateway apply
3. 让 `Data governance workflow` 在输出 govern 决策后，可选调用 Gateway apply
4. 把 apply 结果写回 runtime metadata / trace

阶段退出标准：

- `Jarvis` 决策 -> Gateway apply -> store 变化 -> 读模型可见
- `Data` 决策 -> Gateway apply -> memory 状态变化 -> 读模型可见
- 整条链不依赖手工再次调用 internal route

当前状态更新：

- 以上 4 项已在 local runtime 中完成最小闭环
- apply 后的关键读模型自动回流也已打通
- coach 对话入口已经开始收敛到 `Picard -> front persona`
- consulted persona 已开始进入真实执行链
- memory revoke 已补充独立 trace 事件
- `unhelpful feedback -> revoke / invalidate` 已开始进入治理闭环
- `helpful feedback -> strengthening proposal` 已开始进入候选闭环
- 当前下一重点已从“让 helpful feedback 进入 proposal 层”切换到“把 authority handoff 与 Mac Coach UI 继续接入同一条主链”

#### Phase B｜Picard 真正成为统一 orchestration 入口

目标：

- 让更多 workflow 先经过 `Picard`
- 再决定：
  - 当前 front agent
  - consulted agent
  - 是否需要 authority handoff

建议优先接入：

1. `task_management`
2. `recovery_plan`
3. `notification_dispatch`
4. `reflection_report`

阶段退出标准：

- 这些 workflow 的关键分流都能追溯到 `Picard`
- Gateway 不再保留同一层级的重复 persona 硬编码

#### Phase C｜读模型自动回流与刷新收敛

目标：

- authority apply 完成后，业务读模型自动刷新
- 不让“写成功了，但 Dashboard / Inbox / GoalFlow 没更新”成为常态

建议优先收敛：

- `dashboard summary`
- `goalflow overview`
- `client inbox`
- `reflections latest / overview`

阶段退出标准：

- 一次 authority apply 后，不需要人工补调刷新 API
- 关键读模型在同一 trace 下可回查

#### Phase D｜Governance 闭环收敛

目标：

- 把 proposal 生命周期做完整

至少要包含：

- proposal create
- proposal approve
- proposal reject
- memory accept
- memory reject
- memory recall block
- memory delete
- revoke / audit trace

阶段退出标准：

- 每个 memory / plan 结论都能追到：
  - 来源 agent
  - proposal
  - governance decision
  - persisted result

#### Phase E｜Cluster-preferred 成为默认验收态

目标：

- 现在 provider-direct 仍承担较多开发兜底
- 后续验收要切到 `cluster-preferred` 为主

推荐做法：

- 关键 agent debug / regression 默认先走 cluster
- provider-direct 只保留为降级验证态

阶段退出标准：

- 主回归以 cluster-preferred 为第一验收路径
- provider-direct 不再代表目标架构

### V1.1 Optimization Priorities

除了继续补能力，当前最值得同步优化的点还有：

#### 1. Trace 统一性

建议把以下信息统一进入 trace：

- routing owner
- front agent
- consulted agent
- authority agent
- authority action
- apply result
- read-model refresh result

这样后续调试不会只看到“调用成功”，却看不到真正做了什么。

#### 2. Runtime / Gateway Contract 稳定化

建议把以下 payload 字段固定下来，不再随实现漂移：

- `workflow`
- `userId`
- `frontAgent`
- `runtimeAgentId`
- `memoryScopes`
- `gatewayBaseUrl`
- `authorityAction`
- `proposalContext`

#### 3. 测试分层收敛

当前测试已经不少，但后续建议明确拆成三层：

- contract/unit
- Gateway integration
- OpenClaw runtime e2e

避免把所有新行为都挤进 `api.integration.test.ts`。

#### 4. Runbook 分层

后续文档建议拆成：

- local check
- self-host deploy
- cluster-preferred acceptance
- macOS client end-to-end

这样下一台机器继续开发或部署时不会混乱。

### Current Best Next Action

如果继续按“价值最高、最不容易返工”的顺序推进，当前最佳下一动作固定为：

1. 把 Mac 端 Coach 面板接上现有 front / consult / feedback / revoke / authority 主链
2. 把 OpenClaw conversation memory bundle 与 Gateway retrieval contract 继续收敛为单一真相源
3. 继续把 helpful feedback 从 proposal 推进到轻量 strengthening 生效
4. 把 memory governance 的“delete / block / reject”进一步做成更细粒度、可解释的用户可见反馈

当前本地验证入口已经整理到：

- `docs/runbooks/openclaw-native-agent-team-local-check.md`

## OpenClaw Ecosystem Integration（B 档：运行接入）

这一节定义的是**中长期架构迁移方向**，它不替代 V1 首发主线，但用于保证后续每一步都和最终目标一致。

### 总目标

目标不是“做一个像 OpenClaw 的东西”，而是：

- 让 MindAnchor agent team 可以直接配合用户原 OpenClaw 生态
- 让这些 agent 由 OpenClaw 统一注册、统一运行、统一管理
- 让 MindAnchor 成为基于 OpenClaw 生态的多端产品层

### 分层边界

#### OpenClaw 负责

- agent registry
- agent runtime
- agent 调度入口
- agent 生命周期
- persona soul 绑定
- agent 管理与控制面

#### MindAnchor 负责

- `apps/macos`、`apps/web` 多端产品体验
- `apps/api` Gateway
- 长期 memory authority
- feedback learning
- authority / proposal / revoke 业务真相
- read model
- reminder / state / task / reflection 产品闭环

### 为什么固定选 B 档

- A 档“管理接入”太轻，只能解决“看见 agent”
- C 档“完全原生接入”当前太重，容易演变成整体架构重构
- B 档“运行接入”最符合当前产品目标：
  - OpenClaw 成为 agent 运行真相源
  - MindAnchor 保留产品和业务真相源

### Phase A｜目标与边界锁定

目标：

- 明确 OpenClaw 管什么，MindAnchor 管什么
- 固定迁移边界，避免后面又变成双真相源

出口验证：

- 能用 5 句话讲清：
  - OpenClaw 的职责
  - MindAnchor 的职责
  - 什么必须迁
  - 什么明确不迁
  - 为什么当前路线是 B 而不是 A / C

### Phase B｜OpenClaw 管理接入

目标：

- 让 6 个核心 persona agent 在原 OpenClaw 中可见、可管理、可配置

任务：

- 注册 6 个 persona agent
- 绑定 soul / metadata / model / runtime agent id
- 让 OpenClaw 面板中能看见它们的角色与配置
- 管理态对齐优先直接读取真实 OpenClaw profile home，而不是长期依赖手工导出的 actual JSON 文件
- Gateway `/debug/openclaw/registry-visibility` 必须能直接显示：
  - 当前 profile 是否已对齐
  - 缺哪些 agent
  - 多哪些 agent
  - 哪些字段漂移

出口验证：

- `Picard`
- `Deanna Troi`
- `Spock`
- `Guinan`
- `Jarvis`
- `Data`

全部能在原 OpenClaw 中被枚举和管理。

当前阶段补充约束：

- `doctor-openclaw-management-pack` 必须支持：
  - pack JSON 对齐检查
  - `--profile-home` 直读真实 profile
- Gateway 当前支持两种管理态来源：
  - `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME`
  - `MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH`
- 优先级固定为：
  1. `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME`
  2. `MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH`
- `aligned` 的产品语义固定为：
  - 6 个 persona agent 都存在
  - 并且它们的关键字段没有漂移
  - 如果共享 profile 里还保留 legacy runtime agents，这些 agent 继续记入 `extraAgents`
  - 但不阻塞 persona 管理态判定

### Phase C｜OpenClaw 运行接入

目标：

- 至少一条真实前台对话链在原 OpenClaw runtime 中执行

任务：

- 把 `Picard` 前台路由接入原 OpenClaw runtime
- 迁移至少一个前台 persona 的真实运行入口
- 让 Gateway 不再依赖本地伪 registry 才能完成主链

当前阶段补充约束：

- Phase C 允许分两步进入，不要求一步到位：
  1. **前台 persona 生成先桥接到官方 OpenClaw runtime**
  2. **再把 Picard 路由决策迁到官方 OpenClaw runtime**
- 只有当这两步都完成，才算 Phase C 完整达标
- 当前官方 runtime 桥接形态允许先走：
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE=cli-local`
  - 通过官方 `openclaw agent --agent <id> --json --local` 执行 persona turn
- 当前这条桥只应先覆盖 persona target，不应直接替换所有 agent 调用
- 当前最小配置固定为：
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE=cli-local`
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PATH=~/.openclaw/bin/openclaw`
  - `MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PROFILE=dev`
- 当前真实验收要求至少包括：
  - `POST /coach/sessions`
  - `POST /coach/sessions/:sessionId/messages`
  - trace 中出现：
    - `openclaw.original-runtime.request.succeeded`
- 当前 Phase C 前半步的真实证据应至少覆盖：
  - `workflow = coach_conversation_route`
  - `agentName = director-agent`
  - `coach.route.selected` 中的 `frontAgent` 与官方 runtime 返回一致

出口验证：

- 至少 1 条 `Picard -> front persona` 主链真实成功
- Gateway trace 能解释这条链来自原 OpenClaw runtime
- 当前状态：
  - **已基本达成**
  - 真实链路已经拿到：
    - `director-agent / coach_conversation_route`
    - `front persona / coach_conversation_fast`
    - `front persona / coach_conversation_full`
    - 同一条 trace 内的官方 runtime 证据
  - 这意味着：
    - `Picard` 路由本身已经不再只是本地静态 fallback
    - 至少一条完整的 `Picard -> front persona` 主链已经进入官方 OpenClaw runtime
  - 当前 Phase C 剩余工作不再是“证明能不能接上”，而是：
    - 收掉阶段文档中的旧口径
    - 把 Phase D 协作链迁移验收补齐

### Phase D｜协作链迁移

目标：

- consult / planning / governance 进入原 OpenClaw runtime

任务：

- 迁移 `consult` 链
- 迁移 `Jarvis` planning / adjustment 链
- 迁移 `Data` governance 链

出口验证：

- 至少 1 条 consult 链真实成功
- 至少 1 条 authority / proposal 链真实成功
- 至少 1 条 memory governance 链真实成功
- 当前状态：
  - **已开始，并已拿到第一轮正式验收**
  - 当前已新增并跑通官方 runtime 集成回归：
    - `apps/api/tests/conversation-coach-original-runtime-route.integration.test.ts`
  - 已覆盖并验证：
    - `coach_conversation_consult`
    - `plan_adjustment`
    - `memory_governance`
  - 当前已确认：
    - consult 链可以在 `Picard -> front persona -> consulted persona -> front persona full` 中走官方 runtime
    - `Jarvis` authority handoff 可以在同一条 conversation trace 中走官方 runtime
    - `Data` governance handoff 也可以在同一条 conversation trace 中走官方 runtime，并对真实 memory 项执行删除/撤销
  - 当前 Phase D 下一步不再是“是否可行”，而是：
    - 把这些 trace contract 和用户可见解释同步到产品层
    - 继续进入 Phase E 的产品闭环恢复

### Phase E｜产品闭环恢复

目标：

- 在迁移后，macOS / Web / API / OpenClaw 的产品闭环不退化

任务：

- macOS Coach 展示来源解释
- Web Coach 观测页展示最近对话来源解释
- Web Agent Lab 展示原 OpenClaw 路由与 registry
- Gateway trace / debug 汇总继续可读

出口验证：

- 用户在 macOS / Web 中能看清：
  - 这次由谁前台发言
  - 谁被 consult
  - 哪部分来自 OpenClaw runtime
- 当前状态：
  - **已开始**
  - 当前已新增：
    - `apps/web/src/pages/CoachPage.tsx`
      - 已从纯观测页推进到可直接发送消息的 Web Coach 页面
      - 当前可做：
        - 拉取当前 front agent
        - 查看最近会话
        - 切换会话
        - 发送新消息
        - 自动轮询 assistant 从 `pending_full` 到 `completed`
        - 查看最近一轮 explainability
        - 查看最近一轮的消息级 trace drill-down
        - 选择单条消息查看详情
        - 对 assistant 消息提交 helpful / unhelpful feedback
        - 对失败消息执行 retry
        - 为 `unhelpful` feedback 补充文字原因
        - 在单条消息详情里直接查看 `errorCode` 与 `usedMemoryEntries`
        - 在消息级 Trace 区查看 `routeStatusSummary / degradedSummary`
        - 在消息级 Trace 区查看 `memory recalled / feedback learned` 摘要
        - 在 send / retry / feedback 完成后看到稳定的动作状态提示
        - 在已选消息区看到“本条消息记忆 / 本轮召回”的联动摘要
        - 在已选消息区看到 trace 聚合出的 `来源 / 范围` memory 摘要
        - 在消息级 Trace 区把 `adapter route` 显示成用户可读的人格 / 流程 / 路径摘要
        - 当消息级 `conversationPath.runtimeSource = original-runtime` 时，前台直接显示 `官方 OpenClaw runtime`
        - 将记忆联动摘要收成一张紧凑摘要卡
        - 将执行链路 / 事件时间线收成可展开细节，默认不占满主视图
        - 默认只展示摘要层；记忆联动 / 执行链路 / 事件时间线需用户主动展开
        - 将会话消息列表默认折叠，只有在用户需要切换 message 时再主动展开
        - 将来源解释区默认收成摘要，只在用户需要时展开 consult / authority / revoke 细节
        - 将顶部摘要区进一步收口为两张卡：
          - `会话列表`
          - `当前摘要`
        - 将顶部三张摘要卡的文案收口为更偏产品前台的表达：
          - `当前人格：...`
          - `模式：自动路由 / 手动覆盖`
          - `当前线程：...`
          - `最近回复`
          - `来源摘要`
      - 会话详情返回当前也已包含 session 内 feedback 列表，支持前台持续使用而不是一次性单轮查看
    - `apps/macos/Sources/Core/AppViewModel.swift`
      - 已把 `primaryRoute / usedOpenClaw / hadFallback` 接进消息执行轨迹摘要
      - 当前也已接上 `runtimeSource`
        - 当消息来自官方 OpenClaw runtime 时，执行轨迹直接显示 `官方 OpenClaw runtime`
    - `apps/macos/Sources/Core/MacAutomation.swift`
      - 自动化快照当前会继续带出 `coach.lastAssistantExecutionTrail`
      - 这样 GUI / E2E 不必猜界面节点，也能直接断言当前执行链里有没有出现 `OpenClaw`
      - 当前也已补上 `userFacingCurrentError`
        - 这样后续 GUI 自动验收能直接断言：
          - 当前是不是用户可读恢复提示
          - 而不是只能看到底层原始错误
      - 当前还继续补上：
        - `bootstrapStatusTitle`
        - `bootstrapStatusMessage`
        - `connectionStatusTitle`
        - `connectionStatusDetail`
      - 这样真实 GUI / E2E 现在也能直接断言：
        - 顶层恢复状态标题
        - 顶层恢复状态正文
        - 连接状态标题
        - 连接状态详情
    - `apps/macos/Sources/Core/AppLanguage.swift`
      - 当前已开始把原始错误改写成用户可读恢复提示
      - 首批已覆盖：
        - `Gateway unreachable`
        - `OpenClaw Registry / runtime unreachable`
        - `401 / unauthorized / session expired`
    - `apps/macos/Sources/Core/AppViewModel.swift`
      - `OpenClaw Registry 不可达` 文案当前已继续补成：
        - 原因
        - 明确恢复动作
      - 当前会直接提示：
        - `请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接`
    - `apps/macos/Sources/Features/*`
      - Today / State / Goals / Reflections / Reminders / Login
      - 当前空数据页与登录页都已切到用户可读错误，不再直接暴露原始英文报错
  - 当前前台已能直接看到：
    - `会话列表`
    - `当前摘要`
    - `Front`
    - `Consult`
    - `Authority`
    - `官方 OpenClaw runtime / OpenClaw 主路径 / Provider 直连`
    - `OpenClaw 主路径 / fallback`
    - `traceId + 最近关键事件时间线`
    - `routeStatusSummary / degradedSummary`
    - `memory recalled / feedback learned`
    - `当前会话`
    - `当前选中消息`
    - `feedback 状态`
  - Web 当前还补上了开发态 Coach 鉴权接入：
    - `apps/web/src/api.ts`
      - 对 `/coach/*` 请求自动附带 dev bearer token
      - 使控制台在本地 dev 环境下能直接接真实 Coach API
  - 当前这一步说明：
    - 协作链不再只存在于 debug trace
    - 已开始进入普通前台界面可读层
  - 本轮新增验证已通过：
    - `corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach-original-runtime-route.integration.test.ts tests/debug-trace-summary.integration.test.ts --no-file-parallelism`
    - `corepack pnpm --filter @mindanchor/web exec vitest run src/pages/__tests__/coach-smoke.test.tsx src/api.test.ts`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/CoachConversationTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/MacAutomationTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/AppViewModelAuthTests`
  - `OpenClaw Registry` 告警链的真实 GUI 验收当前也继续收紧：
    - `scripts/run-macos-openclaw-registry-e2e.mjs`
      - 不再只验：
        - `danger`
        - `OpenClaw Registry 不可达`
      - 现在还要求：
        - 告警正文必须明确出现 `OpenClaw`
        - 告警正文必须带出恢复动作：
          - `请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接`
      - 当前脚本也支持：
        - `MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=<unique-bundle>`
      - 作用是：
        - 当本机稳定 E2E bundle 已被 macOS 记成 `denied`
        - 仍能用临时 bundle 继续定位真实 GUI 通知链问题
      - 当前还继续补上：
        - 权限点击脚本会显式标记 `security-agent-present`
        - 不再把 “按钮树不可见的 SecurityAgent” 混成普通 `not-found`
      - 当前对 `SecurityAgent` 首次授权阻塞的提示，也已经收口为：
        - 优先给出 `recover:macos:openclaw-registry-notifications`
        - 再给 `install`
        - 最后给 `verify`
      - 当前 `recover` 脚本本身也已继续补齐：
        - `--bundle-id=<bundle>`
        - custom bundle child env 透传
      - 这样 `recover` 后续拉起的：
        - `repair`
        - `probe`
        - `doctor`
        - `verify`
        - `registry e2e`
        - 都会继续锁定在同一个临时 bundle 上
      - 当前还新增：
        - `report:macos:openclaw-registry-notification-recovery`
      - 它会把恢复 JSON 直接整理成 HTML 报告，方便留档与交付
      - 默认输出：
        - `tmp/mindanchor-openclaw-registry-notification-recovery-report.html`
      - 当前 `recover` 脚本结束时也会自动触发这条报告生成：
        - 默认同时产出 JSON + HTML
      - 所以当前通知恢复链已经具备：
        - 执行
        - 留档
        - 交付展示
        - 一次完成
      - 并且通知诊断/恢复提示当前已经支持：
        - 自定义 bundle id 前缀命令
        - 例如：
          - `MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=<bundle> corepack pnpm install:macos:openclaw-registry-notifications`
      - 当前还已把：
        - `prepare`
        - `open profile`
        - `install`
        - `verify`
        - `doctor`
        - `E2E failure guidance`
        - 全部接到同一套 bundle 定向命令格式
      - 这意味着：
        - 临时 bundle 模式下
        - 失败输出现在已经可以直接执行
        - 不会再误导回稳定 bundle
  - 当前真实机验收结论也要明确记录：
    - 业务代码主链没有卡住
      - 快照字段、恢复文案、单测都已通过
    - 当前 blocker 仍位于本机 macOS 通知授权层
      - 稳定 bundle 会落到 `notificationLiveState=denied`
      - 临时 bundle 当前会落到 `notificationDebugState=request_in_flight`
      - 本轮已补充确认：
        - `SecurityAgent` 安全窗真实存在
        - 但当前宿主上：
          - 不给稳定可用的 AX 按钮树
          - 也没有被当前自动化点击器真正消费
      - 当前真实复验输出已能稳定显示：
        - `已检测到 SecurityAgent 通知授权窗`
        - `建议优先执行：... recover:macos:openclaw-registry-notifications <notification-debug.log>`
        - `建议 recover 实参：... recover:macos:openclaw-registry-notifications <debug-log> <report-json>`
        - `预期恢复报告：...notification-recovery-report.json`
        - `预期恢复 HTML：...notification-recovery-report.html`
        - 对应 bundle 的 `install / verify / doctor` 命令
      - 最近一轮真实复验还补充确认：
        - 通知权限已经能真实进入 `authorized`
        - 当前剩余卡点不再是授权窗
        - 而是 `system notification click` 的 Notification Center 自动化边界
      - 当前也已经把这两类问题正式拆开：
        - 首次授权阻塞 -> `SecurityAgent`
        - 已授权但点击失败 -> `Notification Center`
      - 第二条路径当前会直接给出：
        - `recover` 实参
        - JSON 报告路径
        - HTML 报告路径
      - 当前还新增了独立的：
        - `diagnose:macos:notification-center-click`
      - 用于把“通知已授权，但 Notification Center 点击失败”这类问题单独留档和诊断
      - 当前这条诊断链也已经接回 `E2E` 主脚本：
        - 当点击失败且通知已授权时
        - 会自动补产 JSON + HTML 点击诊断报告
      - 最近一轮真实复验已确认：
        - 自动点击诊断确实会随 `E2E` 失败一起落盘
        - 当前诊断结果明确是：
          - `boundary = notification_center_click_boundary`
          - Notification Center 当前展示的不是目标 MindAnchor 告警项
      - 并且当前 `E2E` 失败后已经会自动触发：
        - `recover`
        - 同时自动产出 JSON + HTML 恢复报告
  - `provider-direct business-web` 剩余读模型分段也已进一步补齐真实 `real` 留档：
    - `business-web-goalflow`
      - `test-results/core-phase-2026-03-29T12-38-56-722Z/report.md`
      - `passed`
    - `business-web-recovery`
      - `test-results/core-phase-2026-03-29T12-43-24-901Z/report.md`
      - `passed`
    - `business-web-reflections`
      - `test-results/core-phase-2026-03-29T12-46-30-418Z/report.md`
      - `passed`
    - `business-web-inbox`
      - `test-results/core-phase-2026-03-29T12-49-42-580Z/report.md`
      - `passed`
  - 这意味着：
    - `Task 5.14` 当前已经从“剩余四段未收齐”
    - 推进到“真实分段留档已补齐”
  - `Task 5.15` 也已经完成第一轮正式收口：
    - 新增：
      - `scripts/lib/core-phase-process-supervisor.mjs`
      - `scripts/__tests__/core-phase-process-supervisor.test.mjs`
    - `run-core-phase-tests.mjs` 已切到统一的进程组启动 / 回收逻辑
    - 最近一轮最小主链复验已通过：
      - `corepack pnpm test:core-phases:local -- --phases stub --segments baseline`
      - `test-results/core-phase-2026-03-29T14-19-49-893Z/report.md`
    - 最近一轮真实 `SIGTERM` 中断复验也已通过：
      - `test-results/core-phase-sigterm-check-20260329-222455/report.md`
    - 最近一轮 timebox 强退后同端口重跑复验也已通过：
      - `test-results/core-phase-timebox-stop-20260329-223550/report.md`
      - `test-results/core-phase-timebox-rerun-20260329-223550/report.md`
    - 这意味着：
      - `Task 5.15` 当前可视为：
        - **已完成**
  - `Task 5.13` 当前也已拿到第一份完整 `full real` 正式留档：
    - `test-results/core-phase-real-full-20260329-1/report.md`
    - `test-results/core-phase-real-full-20260329-1/report.json`
    - 当前完整 real 的真实结论是：
      - `Stub`：`passed`
      - `Provider Direct`：`failed`
      - `Cluster Preferred`：`passed`
    - 当前主 blocker 已明确不是 OpenClaw 主脑：
      - 而是 `provider-direct` 直连 provider 返回：
        - `Provider returned HTTP 401.`
        - `INVALID_API_KEY`
    - 当前还顺手修正了一个报告误导点：
      - phase summary 不再把 degraded fallback step 统计成 passed step
      - 所以这份完整报告现在会正确显示：
        - `Phase 2 Provider Direct | failed | ... | 56/72`
    - 当前又补了一轮“更早失败、更早指引”的正式收口：
      - 新增：
        - `scripts/lib/core-phase-provider-auth-probe.mjs`
        - `scripts/__tests__/core-phase-provider-auth-probe.test.mjs`
      - `run-core-phase-tests.mjs` 现在在 `providerMode=real` 时会先跑真实 provider 轻量认证探针
      - 最近一轮真实验证：
        - `test-results/core-phase-real-provider-preflight-20260329-1/report.md`
      - 当前结果：
        - `invalid_provider_api_key`
        - `HTTP 401`
      - 这意味着：
        - `provider-direct` 的无效凭据问题现在能在 preflight 直接暴露
        - 不再需要先跑完整套 full real 才发现
    - 随后又把漂移来源继续压实：
      - 新增：
        - `scripts/lib/core-phase-provider-config-drift.mjs`
        - `scripts/diagnose-core-phase-provider-drift.mjs`
      - 最近一轮真实诊断结果：
        - Gateway 默认 `baseUrl`：
          - `https://cdn-gmn.chuangzuoli.com`
        - OpenClaw dev profile `baseUrl`：
          - `https://gmncode.cn`
      - 最近一轮临时对齐后真实验证：
        - `test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1/report.md`
        - `Phase 2 Provider Direct = passed`
        - `21/21`
      - 随后已收成正式入口：
        - `scripts/run-core-phase-tests-real-aligned.mjs`
        - `corepack pnpm test:core-phases:real:aligned`
      - 最近一轮 wrapper 真实验证：
        - `test-results/core-phase-real-aligned-wrapper-20260329-1/report.md`
        - `Phase 2 Provider Direct = passed`
        - `21/21`
      - 最近一轮完整 `full real` 对齐后总留档：
        - `test-results/core-phase-real-full-aligned-baseurl-20260329-1/report.md`
        - 当前结果：
          - `Stub`：`passed`
          - `Provider Direct`：`passed`
          - `Cluster Preferred`：`passed`
      - 这意味着当前 `provider-direct` 的主要 blocker 已进一步缩小为：
        - **Gateway 默认 `baseUrl` 与 OpenClaw real profile 漂移**
        - 所以真正的边界是：
          - `SecurityAgent` 安全窗自动化边界
          - 而不是 Gateway / App / OpenClaw 主链
    - 这说明下一步优先级应是：
      - 继续处理本机 `System Settings / Notifications / profile` 准备链
      - 而不是改 Gateway / App 主业务逻辑
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/AppLanguageTests`
    - `xcodebuild test -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -destination 'platform=macOS' -only-testing:MindAnchorMacTests/AppViewModelAuthTests`
    - `node scripts/run-macos-coach-conversation-e2e.mjs`
    - `corepack pnpm --filter @mindanchor/web build`
    - `corepack pnpm --filter @mindanchor/api build`

### Phase F｜正式交付验证

目标：

- 证明这条“OpenClaw 生态 + MindAnchor 产品层”路线能达到最终交付标准

任务：

- clean-machine
- external OpenClaw
- first-time user
- notification / conversation / memory / feedback 全链留档

出口验证：

- 至少一轮完整交付彩排通过并留档
- 用户在自己的 OpenClaw 生态中能看见并管理这套 agent
- 同时能在 MindAnchor 多端中稳定用到它们

### Current Execution Priority Override

虽然本规约覆盖的是完整 V1 商用交付边界，但结合最近一轮用户决策，**当前实际执行优先级** 必须按以下顺序覆盖更宽泛的外围事项：

1. `Mac Coach + OpenClaw conversation` 主链继续收敛
2. `Gateway retrieval contract + conversation memory bundle` 收敛为单一真相源
3. `memory governance / helpful feedback / preference-habit learning` 继续做真实闭环
4. `模型反馈延迟 / 质量 / trace 可解释性` 优化
5. 其余商业化外围项（更完整发布工程、签名、公证、扩平台）只在不干扰前四项时推进

这条覆盖规则的原因是：

- 用户最近最关注的不是“更宽的发布面”，而是：
  - conversation 是否真正跑在 OpenClaw 内
  - memory 是否真的可取、可撤、可治理
  - agent team 是否越来越贴合本人
  - 模型反馈是否更快、更好、更稳定

执行约束：

- 如果某项工作不能直接增强以上前四项，就不应抢占当前主线资源。
- 若出现“发布工程继续扩张，但 conversation / memory 主链还未收敛”的情况，应视为优先级偏移。

### Current Working Tree And Correction

为了避免后续执行时继续分散，这里把当前项目按“真正主线 / 支撑模块 / 暂缓模块”重新整理如下。

补充说明：

- 面向日常纠偏和新人同步的白话树形总览，统一放在：
  - `docs/mindanchor-tree-status-2026-03-23.md`
- 这份树形文档的目的不是替代本主规约，而是把“当前到底哪些模块在主线、各自做到哪了、下一步先做什么”讲得更直白。
- 若后续实际开发状态发生变化，需要同时更新：
  - 本节
  - `docs/mindanchor-tree-status-2026-03-23.md`

#### A. 真正主线

- `apps/macos`
  - 作用：
    - 用户真正每天打开和使用的 Mac 客户端
    - 承载 Coach 对话、提醒、状态查看、memory 操作与设置
  - 当前已完成：
    - 原生 `SwiftUI + AppKit` 主客户端建立
    - 菜单栏、主窗口、Coach 面板、双语、execution trail、真实 GUI E2E
  - 还需要继续做：
    - 对话里“用了哪些记忆”的可解释展示
    - fast / full / authority / memory 的 UI 呈现继续收敛
    - 提醒、状态、Coach 三块信息的优先级与信息密度继续收敛
    - 减少自动化与真实 UI 之间的状态抖动
  - 当前定位：
    - **继续做，但只做与 Coach / memory / 提醒主链直接相关的内容**

- `apps/api`
  - 作用：
    - Gateway
    - conversation 入口
    - memory 真相源
    - trace / debug / authority / 读模型协调层
  - 当前已完成：
    - conversation、authority、memory、trace、debug 入口
    - memory retrieval contract 初步建立
    - authority handoff 与 conversation 主链已接通
  - 还需要继续做：
    - memory retrieval 的跨 scope 排序与 explainability
    - feedback -> preference / habit learning 闭环
    - latency / quality / route / memory 统计指标
    - 对外部 OpenClaw 实例的 registry / contract 对齐能力
  - 当前定位：
    - **核心中的核心，当前必须持续优先推进**

- `openclaw`
  - 作用：
    - 真正的 agent 运行侧
    - 路由、consult、authority、memoryContext 消费
  - 当前已完成：
    - native persona registry
    - local runtime
    - coach conversation fast/full/consult 路径
    - Jarvis / Data authority workflow
    - memoryContext 开始接入
  - 还需要继续做：
    - conversation output 更稳定地只认 OpenClaw 主路径
    - runtime 侧更完整消费统一 memory bundle
    - 外部独立 OpenClaw 实例与本仓库 registry 的对齐方式
    - 后续 persona-specific budget / routing / quality 收敛
  - 当前定位：
    - **和 `apps/api` 一起推进，不能再拖后**

#### B. 支撑主线，但不是当前第一优先级

- `apps/web`
  - 作用：
    - 调试、查看、辅助管理
  - 当前定位：
    - 保持能用即可
    - 只有在能直接增强主线 debug / trace / registry 可见性时才优先处理

- `packages/domain`
  - 作用：
    - 类型、schema、persona 元数据
  - 当前定位：
    - 跟着主线变化同步调整

#### C. 暂缓主线

- `apps/desktop`
  - 已冻结，不再作为正式客户端主线推进

- Android / iOS / 音频 / 视频 / 健康 / 更广发布工程
  - 当前全部不是第一优先级
  - 只有在不影响 `apps/macos + apps/api + openclaw` 主线时才推进

#### D. 当前纠偏后的执行顺序

1. 先做 `apps/api + openclaw`
   - 让 conversation / memory / authority / feedback 真正收敛成单一主链
2. 再做 `apps/macos`
   - 把上述主链清楚、稳定、可解释地展示出来
3. 最后再处理 Web、发布工程和外围能力

这条顺序的原因是：

- 如果 `apps/api + openclaw` 还没收敛，Mac 端再做很多界面也只是包装未成熟主链
- 当前项目的真正核心是：
  - 对话是不是由 OpenClaw 稳定产生
  - memory 是不是统一、可控、可解释
  - feedback 是否真的会让系统越来越贴合用户

#### E. 立即生效的约束

- 接下来若要问“什么时候推进 `apps/api` 和 `openclaw`”，答案固定是：
  - **现在就是最高优先级**
- 接下来若要问“`apps/macos` 还做什么”，答案固定是：
  - **只继续做那些能直接增强 Coach / memory / 提醒主链体验的内容**
- 任何不直接增强这三者的工作，都默认排到后面。

### Current Phased Execution Plan

基于上面的纠偏结果，当前主线不再按“看到什么缺什么就补什么”的方式推进，而是固定按阶段收敛。

#### Phase 0｜纠偏冻结

目标：

- 冻结当前主线，避免继续被外围事项分散。

当前规则：

- 主线固定为：
  - `apps/api`
  - `openclaw`
  - `apps/macos`
- 执行顺序固定为：
  1. `apps/api + openclaw`
  2. `apps/macos`
  3. Web / 发布工程 / 外围能力

阶段退出标准：

- 后续所有新决定继续回写本主 spec
- 不再把 Electron、多平台、外围发布工程当作当前第一优先级

#### Phase 1｜Conversation 主路径收敛

目标：

- 让用户看到的对话内容，稳定地以 OpenClaw 为主路径产生。
- 让 `Picard -> front agent -> consult -> authority` 成为单一、可追踪、可解释的主链。

重点工作：

- 明确 `fast / full / consult / authority` 各段的主路径与降级路径
- fallback 变成显式降级，而不是静默替代
- trace 明确记录：
  - front agent
  - consulted agent
  - authority agent
  - cluster / fallback route

阶段退出标准：

- conversation 主要输出默认来自 OpenClaw 主路径
- fallback 发生时，系统可明确看出
- 不再出现“看起来像 OpenClaw，实际不是同一条链”的情况

当前已落地：

- `GET /debug/traces/:traceId` 已开始返回对话主路径摘要 `summary.conversationPath`
- 当前摘要已可直接给出：
  - `frontAgent`
  - `consultedAgent`
  - `authorityAgent`
  - `authorityTarget`
  - `authorityExecutionStatus`
  - `primaryRoute`
  - `usedOpenClaw`
  - `hadFallback`
  - `degraded`
  - `degradedReason`
  - `adapterRoutes`
- 这意味着现在排查“这一轮到底是不是从 OpenClaw 主路径来的”时，不再必须手工翻完整 trace 事件列表
- 对于非 cluster 主路径的 conversation turn，trace 摘要现在会显式标成 degraded，并给出原因，例如：
  - `cluster_disabled_or_not_used`
  - `cluster_fallback`
  - `generation_failed`

#### Phase 2｜Memory Explainability 收敛

目标：

- 让 memory 不只是“被取来用了”，而是“能说清用了什么、为什么用、来自哪里”。

重点工作：

- 统一 `usedMemoryIds / usedMemorySources / usedMemorySummaries`
- 继续完善：
  - top-k
  - 排序
  - compaction
  - 跨 scope 优先级
- 区分：
  - `coach-memory`
  - `gateway-memory`
  - `recentContext`

阶段退出标准：

- 每条 assistant reply 都能更清楚说明用了哪些 memory
- API、trace、Mac UI 三端对 memory 解释一致

#### Phase 3｜Feedback Learning 闭环

目标：

- 让系统开始真正“越用越贴合你”，但先做偏好/习惯学习，不做重训练。

重点工作：

- `helpful` 不再只是记录，而是进入 strengthening / proposal / governance
- 区分：
  - preference strengthening
  - habit strengthening
  - 偶然反馈噪声
- 保留 weakening / revoke / 反向修正能力

阶段退出标准：

- feedback 能逐步影响后续 retrieval / routing / tone
- 用户能撤回或纠正已经学错的偏好

#### Phase 4｜Mac 展示收敛

目标：

- 不再扩很多新壳，而是把已经打通的主链在 Mac 上清楚稳定地呈现出来。

重点工作：

- 在 Coach UI 中显示“本轮用了哪些记忆”
- 将“本轮用了哪些记忆”从只看 `usedMemoryIds` 升级为结构化 explainability：
  - 返回 `usedMemoryEntries[]`
  - 每项至少包含 `summary`、`kind`、`source`
  - `coach-memory` 与 `gateway-memory` 需要能在 UI 中被直接区分
  - explainability 不允许把所有 bundle 原样平铺给用户，必须做轻量压缩与排序
  - 当前优先顺序固定为：`coach-memory -> gateway-memory -> front-agent-state`
  - 当前默认上限固定为 `4` 条，优先保证“本地长期偏好 + 现实约束 + 当前协调状态”三类都能看见
  - Mac 展示层需要进一步按本轮 `frontAgent` 做 persona template，而不是所有 persona 共用同一套标签
  - 当前第一版 persona template 固定为：
    - `Picard`：长期偏好 / 现实约束 / 当前协调状态
    - `Deanna Troi`：安抚偏好 / 现实边界 / 当前情绪焦点
    - `Spock`：决策偏好或行为习惯 / 现实约束 / 当前分析焦点
    - `Guinan`：平衡偏好 / 现实边界 / 当前平衡焦点
    - `Jarvis`：执行偏好 / 计划约束 / 当前计划焦点
- 清楚区分：
  - fast
  - full
  - consult
  - authority
  - memory revoke
- 收敛提醒、状态、Coach 三块信息的层级与优先级

阶段退出标准：

- 用户能从 Mac UI 看懂这轮回答为什么会这样说
- Mac 端不再只是“能看到消息”，而是能理解背后的主链
- 不能再出现“后端只返回 memory id，前端看不出具体用了什么”的黑箱状态

#### Phase 5｜延迟、质量、稳定性优化

目标：

- 在主链已经成立后，再系统性提高速度、质量与稳定性。

重点工作：

- 增加 latency 指标：
  - fast
  - full
  - consult
  - authority
  - memory retrieve
- 增加质量指标：
  - feedback
  - revoke
  - fallback
- 优化高频慢路径：
  - memory fetch
  - full completion
  - authority 收尾

阶段退出标准：

- 能清楚知道慢在哪里、差在哪里、错在哪里
- 能区分是模型问题、memory 问题、routing 问题还是展示问题

### Current Milestones

#### M1｜主链成立

- OpenClaw 主路径下的 conversation 稳定可追踪
- authority handoff 稳定
- memory 统一来源成立

#### M2｜主链可解释

- 用户能知道这轮回答用了哪些 memory
- trace / API / Mac UI 三端解释一致

#### M3｜主链可学习

- feedback 能逐步影响 preference / habit
- 用户能撤回和纠错

#### M4｜主链够稳定

- GUI、API、runtime 三边回归稳定
- 延迟与 fallback 可量化

### Things Explicitly Not Prioritized Right Now

- 扩更多非主线 Web 功能
- 扩 Android / iOS 正式版
- 扩音频 / 视频 / 健康正式链路
- 把大量时间继续花在更广发布包装、签名、公证外围
- 给 Mac 端继续堆很多不增强主链解释性的 UI 壳

### V1.1 Remaining Critical Gaps

如果以“真正可长期使用的 OpenClaw Native Agent Team”作为标准，当前还存在五个必须补齐的缺口：

#### 1. 会话主链还没有完全收敛到 OpenClaw

目前 memory read、proposal write、authority execution 已经具备基础能力，但“用户发来一句话 -> Picard 决策 -> 前台 agent 回复 -> consult / authority -> memory proposal / apply -> 读模型回流”还没有形成单一稳定主链。

这意味着：

- 用户可见对话体验与后台治理链仍有分叉
- Mac 客户端、Gateway、OpenClaw 之间还没有统一的 conversation contract
- 后续做延迟优化与质量对比时，容易出现“看起来可用，但实际上不是同一条链”的问题

#### 2. Fast / Full 双阶段响应还没有正式定型

当前要同时满足“够快”和“够好”，但尚未在规约层固定：

- 第一拍快速建议由谁生成
- 第二拍深入补充由谁 consult
- 哪些情况下只回 fast，不回 full
- full 结果是否允许覆盖、补充或撤销 fast 建议

如果不先把这个协议定下来，后续会不断在 Mac 客户端、Gateway 与 OpenClaw 之间来回改 UI 和 trace。

#### 3. Memory 检索预算与压缩策略还不够明确

虽然已经有 scoped memory API，但还没有把以下规则写成稳定规约：

- 每个 agent 默认最多拿多少 memory
- recent context、preferences、habits、constraints 的优先级怎么排
- 超长历史是直接截断，还是先摘要再返回
- recall blocked / revoked memory 在 retrieval 时如何硬性排除

这会直接影响：

- 模型延迟
- 输出质量稳定性
- 不同 agent 间的人设污染风险

#### 4. 用户反馈到 memory strengthening 的闭环还处于原则层

目前已经明确“长期真相源在 Gateway”，但真正的反馈闭环仍需规约收敛：

- 哪些用户操作算显式 feedback
- 哪些行为结果算隐式 outcome feedback
- feedback 如何变成 proposal，而不是直接改 memory
- 何时只调路由权重，何时真的升级为长期偏好

如果不把这一层补清楚，后续“越用越懂你”会停留在概念层。

#### 5. 生产可观测性还不够支撑长期迭代

当前 trace 能力已有基础，但离真正的线上优化还差：

- 缺少按 workflow / agent / route / apply result 的统一 latency 统计
- 缺少 fast 与 full 的质量对照记录
- 缺少 memory retrieve / proposal / apply / refresh 的阶段性耗时拆分
- 缺少“这次建议为什么这样说”的结构化调试摘要

这会让后续调优非常依赖人工体感，而不是证据。

### V1.1 Additional Completion Plan

基于上述缺口，后续补充计划建议固定为以下五段，且继续写回当前主规约，不另开平行主线。

#### Phase F｜Conversation Channel 收敛为唯一前台入口

目标：

- 让 Mac 客户端的对话、提醒解释、手动 check-in 补充说明，逐步收敛到同一套 OpenClaw conversation path
- 让所有用户可见建议都能追溯到：
  - front agent
  - consulted agents
  - memory bundle
  - authority action
  - final trace

规约要求：

- 前台始终只有一个用户可见人格出面
- 默认由 `Picard` 先做路由决策，再选定前台 persona
- `Jarvis` 与 `Data` 默认不直接当前台聊天，除非 `Picard` 明确 handoff
- Mac 客户端的消息发送、提醒详情展开、建议解释，都复用同一 conversation session

阶段退出标准：

- 用户从 Mac 发起的一次完整消息，能在同一 trace 下看到 front / consult / memory / authority / response

#### Phase G｜Fast / Full / Feedback 交互协议固定化

目标：

- 同时解决“首拍要快”和“最终要稳”的矛盾

规约要求：

- `fast`：
  - 由 `Picard + 当前 front agent` 基于轻量 memory bundle 先给出第一拍建议
  - 目标是快速回应、稳定不断流
- `full`：
  - 允许 `Picard` 追加 consult `Spock`、`Guinan`、`Jarvis`、`Data`
  - 用于补充现实约束、计划调整、节奏建议或记忆治理结果
- `feedback`：
  - 用户对一条建议的“有帮助 / 太冷 / 太重 / 不贴合 / 时机不对”必须结构化保存
- `memory revoke`：
  - 用户撤回、屏蔽、降权某条记忆时，后续 retrieval 必须立即生效

Mac 客户端显示策略固定为：

- 先显示 fast
- 若 full 到达且质量更高，则以“补充建议”或“更新结论”方式呈现
- 不允许 silent overwrite，必须让用户知道这是后续补充还是修正

阶段退出标准：

- fast、full、feedback、memory revoke 四条链都能被稳定 trace 和回归测试覆盖

#### Phase H｜Memory Retrieval / Compaction / Governance 收敛

目标：

- 让 memory 真正成为“可控、可删、可强化、可审计”的系统能力，而不是简单拼接上下文

规约要求：

- Gateway 负责统一 retrieval policy：
  - scope 过滤
  - top-k 裁剪
  - recent first
  - preference / habit / constraint 分层
- 对超长历史，优先返回摘要记忆，而不是原始长文本
- 对被 revoke、blocked、deleted 的记忆，retrieval 层必须强制排除
- `Data` 负责：
  - candidate 审核
  - memory 生命周期治理
  - recall 边界维护

阶段退出标准：

- 同一用户长期使用后，memory 总量增长不会线性拖垮响应时间
- 任意一条被 revoke 的 memory 在后续 agent retrieval 中不可见

当前已落地：

- `ConversationCoachService` 不再只靠本地 `coach memory` 直接拼 prompt：
  - `Picard` 路由阶段已开始通过 `AgentMemoryService` 读取 `director-agent` 允许范围内的 memory bundle
  - front agent 的 `fast / full` 阶段已开始通过 `AgentMemoryService` 读取该 agent 自己 allowed scopes 下的 bundle
  - consulted agent 也开始按自己的 agent scope 读取 bundle，而不是沿用前台 persona 的随意拼接记忆
- `AgentMemoryService` 已开始具备第一版 retrieval budget / compaction 行为：
  - `preferences` 当前默认 top-k = `3`
  - `habits` 当前默认 top-k = `2`
  - `constraints` 当前默认 top-k = `2`
  - `recentContext` 当前默认 top-k = `1`
  - 同一 scope 内会先按 `updatedAt desc`、再按 `confidence desc` 排序
  - 同一 scope 内会按 `summary` 做轻量去重，避免重复记忆线性堆积
- conversation 调用 OpenClaw runtime 时，已开始附带统一的：
  - `runtimeAgentId`
  - `memoryScopes`
  - `gatewayBaseUrl`
  使 local runtime / cluster 路径可以通过同一套 Gateway retrieval contract 拉取 memoryContext
- local runtime 的 `coach_conversation_full` 已优先消费 `memoryContext`，不再只依赖旧的 `recalledMemory` 文本数组
- conversation prompt 现在不只传原始 memory summary，也开始把 persona explainability 反向喂回 prompt：
  - Gateway 会把当前轮 `usedMemoryEntries` 映射成 `memoryFramingHints`
  - `memoryFramingHints` 会随 `coach_conversation_fast / full` 一起进入 OpenClaw prompt payload
  - 当前 hint 结构至少包含：`label`、`summary`、`source`、`kind`
  - 这意味着模型看到的“记忆如何被解释”开始与 Mac UI 看到的 framing 对齐，而不是 UI 和模型各说各话
- local runtime 的 `coach_conversation_full` 已开始优先消费 `memoryFramingHints`：
  - 当 hint 存在时，返回内容会优先按 `参考框架：<label>:<summary>` 组织
  - 只有在 hint 不存在时，才回退到旧的 `参考偏好` 文本拼接
- 这套 explainability framing 已继续从“前台 full”扩到 `consult / authority`：
  - consulted persona prompt 现在也会拿到自己 agent scope 下压缩过的 `memoryFramingHints`
  - `coach_conversation_consult` 的 local runtime 已开始把这些 hints 显式组织进 `consultSummary`
  - `coach_conversation_full` 现在会把 `consultSummary`、`authoritySummary` 一起拼进最终 `fullResponse`
  - 这意味着最终用户看到的 full response，不再只反映 front agent 自己的 framing，也开始显式带上 consult / authority 的补充判断
- `Jarvis / Data` authority prompt 也已开始吃同一套 explainability 思路：
  - `Jarvis` authority prompt 会带自己的 `memoryFramingHints`，让计划调整 summary 显式体现 `计划约束`
  - `Data` authority prompt 会带治理专用 hints，让 memory governance summary 显式体现 `治理目标` / `待治理候选`
  - authority normalize 现在会优先保留 runtime 已生成的 `summary`，不再在 Gateway normalize 阶段把 authority framing 覆盖丢失
- 已新增并跑通的回归，确认 consult / authority explainability 真正进入最终对话输出：
  - mixed emotional + analytical turn 下，`Spock` consult 的 `现实约束` 会进入最终 `fullResponse`
  - memory governance turn 下，`Data` authority 的 `治理目标` 会进入最终 `fullResponse`
  - plan adjustment turn 下，`Jarvis` authority 的 `计划约束` 继续保持可见
- 已新增回归，覆盖“分析型对话通过统一 memory bundle 读到 constraint memory 并进入 full response”的场景
  - 并额外覆盖：分析型对话在 full response 中明确出现 `现实约束` 这类 persona framing label
- `coachMessage` 契约已从“只有 `usedMemoryIds`”扩成“`usedMemoryIds + usedMemoryEntries`”：
  - `packages/domain` 已新增结构化 `coachMessageUsedMemoryEntry`
  - API 已在 send / full completion / retry completion 三个写入点回填 `usedMemoryEntries`
  - `usedMemoryEntries` 当前直接来源于该轮真实进入 prompt 的 `AgentMemoryContextBundle`
  - `coach-memory` 保留真实 `memoryId`
  - 非 coach-memory 来源（如 `gateway-memory`、`front-agent-state`）用结构化 `summary/kind/source` 暴露，不再强依赖虚假 id 映射
- Mac `CoachConversation` 已优先显示结构化 `usedMemoryEntries`，不再只靠本地 memory 列表反查：
  - 当 assistant turn 带有 `usedMemoryEntries` 时，直接显示摘要与来源
  - 当旧数据还没有该字段时，才回退到旧的 `usedMemoryIds -> 本地 memory item` 反查逻辑
  - Mac 端不再直接展示 `gateway-memory`、`coach-memory` 这类内部 source key，而是展示人类可读标签
  - 当前已落地的首批来源标签：
    - `coach-memory` -> `长期偏好 / Coach Memory`
    - `gateway-memory` -> `现实约束 / Gateway Memory`
    - `front-agent-state` -> `当前协调状态 / Front Agent State`
  - 当前已开始按消息级 `frontAgent` 套用 persona explainability template，而不是只看全局当前 front persona：
    - `Deanna Troi`：`安抚偏好 / Comfort Preference`、`现实边界 / Reality Boundary`、`当前情绪焦点 / Emotional Focus`
    - `Spock`：`决策偏好 / Decision Preference`、`行为习惯 / Behavior Pattern`、`现实约束 / Reality Constraint`、`当前分析焦点 / Analysis Focus`
    - `Guinan`：`平衡偏好 / Balance Preference`、`现实边界 / Reality Boundary`、`当前平衡焦点 / Balance Focus`
    - `Jarvis`：`执行偏好 / Execution Preference`、`计划约束 / Planning Constraint`、`当前计划焦点 / Planning Focus`
- 已新增双端回归：
  - API 集成测试覆盖 conversation cluster path 下 `usedMemoryEntries` 返回
  - Mac 单测覆盖 `APIClient` 解码与 `CoachConversation` 展示优先走结构化 entries
  - API 集成测试额外覆盖 `usedMemoryEntries` 的压缩顺序与条数上限
  - Mac 单测额外覆盖来源标签的人类可读映射
  - Mac 单测额外覆盖 persona template 会随消息自己的 `frontAgent` 改变，而不是被当前全局 persona 污染

这意味着当前已经完成了“单一真相源收敛”的第一刀：

- Gateway retrieval contract 开始成为 conversation memory 的主来源
- OpenClaw runtime 与 Gateway prompt 侧不再各自维护一套彼此分离的记忆输入
- 用户可见 explainability 也开始与真实 memory bundle 对齐，而不是只看到抽象 id

当前仍待继续收敛：

- recentContext 与长期 memory 的跨 scope 优先级排序
- `usedMemoryEntries` 是否需要按 persona / workflow 采用不同压缩模板，而不是当前全局统一的 4 条规则
- `Picard / Troi / Spock / Guinan / Jarvis` 之外的新 persona 若后续加入，也需要补自己的 explainability template
- budget 策略是否需要按 agent persona 差异化，而不是全局固定常量

#### Phase I｜反馈学习以“偏好 / 习惯”为先，强化训练为后

目标：

- 先把“越用越贴合”做扎实，再考虑更重的个性化训练

V1.1 默认优先级固定为：

1. `preference learning`
   - 表达风格
   - 提醒频率
   - 建议语气
   - 恢复方式偏好
2. `habit learning`
   - 哪种安排更容易执行
   - 哪种恢复建议更容易真正发生
   - 哪些任务组合会带来更好的情绪回报
3. `custom training / RL`
   - 只作为后续轨道，不进入当前主链阻塞项

治理要求：

- 所有学习结果先落到 Gateway feedback / proposal / memory pipeline
- 不允许直接把一次用户点赞或点踩视为永久真理
- 必须允许 weakening、revoke、反向修正

阶段退出标准：

- 系统能在不改底层基模的前提下，先明显提升“贴合这个用户”的感觉

#### Phase J｜生产化观测、评估与上线门槛收敛

目标：

- 让后续优化基于证据，而不是仅凭体感

建议固定四类核心指标：

- `latency`
  - fast 首拍耗时
  - full 补充耗时
  - memory retrieve 耗时
  - authority apply 耗时
- `quality`
  - 用户显式反馈
  - 后续是否采纳建议
  - 是否触发 memory revoke / negative feedback
- `stability`
  - fallback rate
  - malformed output rate
  - apply failure rate
- `learning effectiveness`
  - 同类场景下用户满意度是否提升
  - 重复被否定的建议是否下降

阶段退出标准：

- 每条主 workflow 都有可比对的周维度指标
- 能区分是模型问题、memory 问题、routing 问题，还是客户端展示问题

#### Phase K｜Helpful Feedback 进入 strengthening / proposal 闭环

目标：

- 不只处理 negative feedback
- 也让“这次有帮助”的反馈逐步转成长期可治理的 strengthening 信号

规约要求：

- `helpful` feedback 不直接改写长期 memory
- 先进入 Gateway feedback pipeline，再转成：
  - routing hint strengthening
  - candidate confidence 提升
  - preference proposal
- 当一条建议被连续多次标记为 helpful，且场景相近时，才允许进入更强的长期偏好候选
- 必须保留反向修正能力，避免一次偶然点赞把风格永久推偏

建议优先落地：

1. `helpful` feedback -> trace event
2. `helpful` feedback -> lightweight preference-strength proposal
3. proposal -> Data / rule-layer 审核
4. 审核通过后再影响 retrieval 权重或 persona routing bias

阶段退出标准：

- helpful feedback 不再只是“记录一下”
- 至少能对后续相似 turn 的 routing / tone / memory ranking 产生可追踪的轻量影响

#### Phase L｜Authority Handoff 进入对话主链

目标：

- 让 `Jarvis` 与 `Data` 不只存在于后台 apply 路径
- 而是在对话中需要时，能被 `Picard` 明确 handoff 进入同一条 trace

规约要求：

- 默认仍由前台 persona 与用户对话
- 只有在确实需要：
  - 计划改排
  - 任务重排
  - 恢复块落地
  - memory governance
  时，`Picard` 才触发 authority handoff
- handoff 必须区分：
  - consult
  - propose
  - apply_direct
- 用户可见结果必须说明：
  - 这是普通建议
  - 还是已经进入 Jarvis / Data 权限动作

建议优先落地：

1. 对话内 plan-write 意图 -> `Jarvis` handoff
2. 对话内 memory-boundary / forget / block 意图 -> `Data` handoff
3. handoff 结果进入同一 trace 与同一 session timeline
4. 低风险动作可 apply，高风险动作必须降级为 proposal

阶段退出标准：

- 用户在一次 conversation session 内，就能看到 authority handoff 的开始、结果与是否落地

当前已落地：

- 对话内 `plan-write / reorder` 意图已经可经 `Picard -> Jarvis` 进入同一条 conversation trace
- 对话内 `forget / delete memory / do not remember` 意图已经可经 `Picard -> Data` 进入同一条 conversation trace
- `Data` handoff 已真正调用 Gateway authority execution，而不是只停留在前台 persona 文案层
- `Data` handoff 落地后会同步撤销当前对话侧已召回的 coach memory，避免“用户要求忘记，但本轮 full response 还继续引用旧记忆”
- memory governance turn 已阻止“忘记这条记忆”再次被误写成新的 coach memory
- `Jarvis` / `Data` 两条 authority handoff 现在都已具备：
  - `coach.authority.handoff.started`
  - `coach.authority.handoff.completed`
  - 读模型回流 / dashboard front agent 可见
- authority execution 新增 `includeReadModelRefresh` 开关，并在 conversation authority handoff 内默认关闭阻塞式 read model refresh：
  - 目标是避免 `Data` / `Jarvis` handoff 被 `dashboard / goalflow / inbox` 聚合刷新拖住
  - 对话主链优先保证：
    - `coach.authority.handoff.completed`
    - `coach.message.full.completed`
  - 后续 read model 仍通过显式读取入口按需刷新，而不是卡在同一 turn 内串行等待
- 已补 service 级回归，确保显式关闭 refresh 时不会再触发 orchestrator 聚合读取
- 已复跑 conversation integration，确认 memory governance turn 不再停在 `pending_full`

#### Phase M｜异步任务与测试可靠性硬化

目标：

- 让当前快速推进出来的对话/治理主链具备稳定回归能力
- 避免“功能在，但测试或 teardown 偶发脏掉”拖慢后续开发

当前已知应优先收敛的问题类型：

- full-turn 后台异步任务在测试 teardown 后继续写文件
- 临时目录被删除后仍有异步 persist 触发
- 局部通过、全量回归偶发失败
- trace/adapter timeline 因异步顺序不同而断言脆弱

建议优先落地：

1. 对话后台任务显式跟踪与可等待
2. 测试 teardown 前 drain pending work
3. 为关键异步链补 deterministic wait helper
4. 把最容易抖动的断言改为结构性断言而非时序偶然值

阶段退出标准：

- 相关核心测试在连续多次本地全量运行下稳定通过
- 后续开发不再频繁被异步残留和临时目录 race 打断

#### Phase N｜Mac 客户端 Coach 面板进入可用闭环

目标：

- 让已经在 Gateway/OpenClaw 跑通的 agent-team conversation 主链，真正被 Mac 用户看见和用起来

首批必须呈现的信息：

- 当前前台 persona
- 当前 consulted persona（如果有）
- fast / full 两阶段回复
- feedback 入口
- memory revoke 入口
- authority / proposal 状态摘要

规约要求：

- Mac 端不重写 routing 逻辑
- 只消费 Gateway 聚合结果和 session/message 读模型
- UI 必须能区分：
  - 普通建议
  - consult 补充
  - authority handoff
  - proposal / applied

阶段退出标准：

- Mac 端至少能完整走一轮：
  - 发消息
  - 看到 front persona
  - 看到 consult / full
  - 提交 feedback

当前已落地：

- Mac `CoachConversation` 发送消息后，已会继续自动轮询 session detail，直到 assistant turn 从 `pending_full` 变为 `completed`
- 上述自动轮询现在不再只刷新消息线程，也会同步刷新：
  - `coachFrontAgent`
  - `coachProposals`
  - `coachMemory`
- 这意味着当对话内发生 `Jarvis` / `Data` authority handoff 时，Mac 面板会更快看到：
  - 当前前台 persona 已切换
  - handoff card / visible summary 已更新
  - governed memory / proposal 列表已更新
- 已补一条专门回归，覆盖：
  - pending conversation 完成
  - authority sidecars 同步刷新
  - `memory-governor-agent` 与 deleted memory 状态出现在 Mac 端读模型
- Mac `CoachConversation` 的单条 assistant message 现在已可基于 `traceId` 读取并展示消息级执行轨迹，首批覆盖：
  - `coach.consult.completed`
  - `coach.authority.handoff.completed`
  - `coach.memory.revoked`
- Mac 自动化快照已新增最后一条 assistant message 的 execution trail，便于后续真实 GUI 自动验收稳定断言
  - 触发 revoke 或 authority 结果展示
- 真实 macOS Coach E2E 已完成一轮完整闭环：
  - fast
  - full
  - helpful feedback
  - memory revoke
  - 第二轮 governance turn（`请忘记我偏好短句这条记忆。`）
- 当前真实 GUI E2E 已可稳定断言最后一条 assistant message 的 execution trail 中出现：
  - `Authority · Data`
  - `Memory revoked · <count>`
- Mac 端现在也开始消费 `/debug/traces/:traceId` 返回的 `summary.conversationPath`
  - 当一轮对话是 degraded / fallback 结果时，execution trail 会明确显示降级提示
  - 这意味着用户侧不必只依赖开发者去看 debug API，Mac UI 本身也开始暴露“这一轮不是标准主路径结果”
- 这意味着 Mac 端现已不只是“消息能发出去”，而是已经能把：
  - OpenClaw 路由
  - Data authority handoff
  - coach memory revoke
  - full response 收口
  串成同一条用户可见主链

#### Phase O｜安全边界与人格质量闸门

目标：

- 多 persona agent team 上线前，不只要“能跑”
- 还要避免人格串味、越权和语气失控

规约要求：

- `Picard` 负责人格出面顺序，但不直接替代其他角色的专业边界
- `Troi` 不给出越权现实承诺
- `Spock` 不用冷硬风格覆盖情绪安抚场景
- `Guinan` 不把节奏建议包装成确定性诊断
- `Jarvis` 不绕过风险分级直接做高风险落地
- `Data` 不在没有明确治理意图时介入前台表达

建议增加的质量闸门：

- persona-specific prompt regression
- cross-persona contamination checks
- authority boundary tests
- UI copy review for fast/full/handoff/proposal states

阶段退出标准：

- 同一输入在多次回归中，人格边界基本稳定
- 不会出现明显的越权角色发言或职责串位

#### Phase P｜Agent Registry 可见性与对照能力

目标：

- 让开发与验收时不再出现“agent 明明在跑，但在 OpenClaw 里看不到”的认知落差
- 明确区分：
  - 仓库内 native OpenClaw runtime 已注册的 persona agents
  - 外部独立 OpenClaw 实例是否已经同步具备同一套 registry

当前已落地：

- Gateway 已新增 `GET /debug/openclaw/native-agents`
- 该接口会直接返回当前仓库 native OpenClaw persona registry，包括：
  - `agentId`
  - `displayName`
  - `runtimeAgentId`
  - `supportedWorkflows`
  - `memoryScopes`
  - 权限能力标记
- 该接口会显式说明：
  - 这是“本仓库 native OpenClaw runtime”里的 registry
  - 若用户查看的是外部独立 OpenClaw 实例，则未必自动包含这套注册表
- Gateway 已新增 `GET /debug/openclaw/registry-visibility`
  - 该接口会保留 `nativeRegistry` 作为仓库内 persona registry 真相源
  - 同时会在配置了 `MINDANCHOR_OPENCLAW_BASE_URL` 时主动探测外部 OpenClaw 的 `/health`
  - 并返回：
    - `matchedAgentIds`
    - `missingInExternal`
    - `unknownExternalAgents`
    - `reachable`
    - `runtime / runtimeVersion`
  - 这样就能区分：
    - persona agents 已在本仓库 native runtime 注册
    - 外部独立 OpenClaw 实例是否真的已经暴露同一批 persona agents
- 已新增回归，覆盖：
  - 未配置外部 OpenClaw 时，registry visibility 返回 `configured=false`
  - 配置本仓库 local runtime 为外部实例时，6 个 persona agent 全部进入 `matchedAgentIds`
  - 当外部 runtime 额外暴露 chief / workflow agents 时，这些会进入 `unknownExternalAgents`，而不是误判 persona registry 缺失
- `apps/macos` 已开始消费这条 debug contract：
  - `APIClient` 已新增对 `GET /debug/openclaw/registry-visibility` 的解码
  - `AppViewModel` 会在 bootstrap / refresh 阶段拉取 registry visibility
  - `Settings` 页已新增 `OpenClaw Registry` 面板，直接展示：
    - native persona 数量
    - external runtime 是否已配置 / 可达
    - matched persona 数量
    - missing / unknown agent 列表
  - `Settings` 页现在还会额外显示一条 registry health callout：
    - 对齐完成时显示 `OpenClaw Registry 已对齐`
    - 未配置 / 缺失 persona 时显示 warning
    - 已配置但不可达时显示 danger
    - callout 文案会直接带出 `runtime / runtimeVersion` 与当前缺口摘要
  - `Today` 页已开始同步这条轻量 health 提示：
    - 用户不进入 `Settings` 也能看到当前 OpenClaw registry 是否对齐
  - 菜单栏菜单顶部已开始显示一句简短状态：
    - 例如 `OpenClaw：已对齐`
    - 当外部 runtime 不可达时，会切到 `OpenClaw：不可达`
  - 当 external OpenClaw 已配置但变为不可达时，Mac 客户端会主动发出一条本地 operational alert：
    - 默认 title 直接使用 `OpenClaw Registry 不可达`
    - body 直接带出 base URL 与错误原因
    - 同一故障指纹不会重复刷屏
    - 当恢复后再次掉线，才会重新提醒
    - 点击该通知会把用户带到 `Settings`
  - 为了把这条链路做成可持续自动验收，`apps/macos` 已新增一条专用自动化入口：
    - `refresh_openclaw_registry`
    - 该动作只刷新 registry visibility，不再依赖较重的 bootstrap / reflection 刷新链
    - 这样可以稳定复验：
      - `Today` 进入 aligned
      - runtime 掉线后进入 danger
      - operational alert request 被实际送入系统通知层
  - 已新增专用脚本：
    - `scripts/run-macos-openclaw-registry-e2e.mjs`
    - 它会真实启动 fake OpenClaw runtime、Gateway、macOS App，并回放：
      - reachable
      - unreachable
      - notification click attempt
  - 当前真实验收状态需要明确记录，避免误判方向：
    - **已确认通过**
      - `Today` 轻量 registry health 已进入真实 GUI
      - runtime 掉线后 danger 状态已进入真实 GUI
      - operational alert request id 已进入系统通知检查器
    - **当前唯一未完成**
      - 在这台开发机上，Notification Center 的 Accessibility 视图仍无法稳定枚举到 MindAnchor 那条告警通知，因此“真实系统通知点击 -> 打开 Settings”尚未完全自动化闭环
    - 这意味着当前 blocker 位于：
      - macOS Notification Center 展示 / 可访问性层
      - 而不是 Gateway / registry visibility / Mac 客户端业务主链
  - 这意味着用户现在不必手动打 debug API，就能在 Mac 客户端里确认“外部 OpenClaw 到底有没有对齐 persona registry”

阶段价值：

- 以后排查 agent team 时，可以先确认：
  - agent 是否已在本仓库 runtime 注册
  - 技术 id 与人格名如何映射
  - 当前应该看 Gateway debug 出口，还是外部 OpenClaw 面板
  - 外部 OpenClaw 实例到底是“没连上”、还是“连上了但 persona registry 还没对齐”

### V1.1 Pre-Launch Hardening Checklist

在进入真正的 V1 商业交付验收前，建议把以下项目视为硬化门槛，而不是“以后再说”的杂项：

- conversation 主链能覆盖：
  - front
  - consult
  - feedback
  - revoke
  - authority handoff
- helpful / unhelpful 两类 feedback 都已进入治理闭环
- persona target 已全部有独立 config identity 与可审计 trace
- 关键异步测试已稳定，不依赖偶然时序
- Mac 端至少能消费并展示当前 agent-team conversation 主链
- cluster-preferred 已成为主要验收态，而不是补充态

### Recommended Delivery Order From Here

为了减少返工、尽快把“空壳风险”压下去，后续推荐交付顺序固定为：

1. `authority-client.mjs` + OpenClaw 主动 apply
2. 前台 conversation channel 收敛到 `Picard -> front persona -> consult / authority`
3. fast / full 双阶段输出协议落地并在 Mac 客户端稳定呈现
4. memory retrieval / revoke / governance 规则收敛
5. feedback -> preference / habit learning 闭环落地
6. 再进入更重的 cluster rollout、延迟优化和个性化强化训练

这一顺序的原则是：

- 先把“真的在 OpenClaw 内跑”做扎实
- 再把“越用越懂你”做真实
- 最后再把“更快、更强、更个性化”做深

## Web Console V1 Requirements

### 页面要求

V1 Web 至少需要以下页面可用：

- Dashboard
- Goals / Tasks
- State
- Recovery
- Reflections
- Inbox

### 使用定位

Web 在 V1 中的定位是：

- 辅助查看
- 辅助管理
- 辅助复盘

不要求用户全天依赖 Web 才能获得提醒闭环。

## Deployment And Installation

### 总原则

V1 面向普通用户，因此部署方案必须是“引导式安装”，而不是“你先自己懂一整套 Docker / 反向代理 / 模型路由”。

### 部署交付内容

部署部分至少要交付：

- 环境要求说明
- 部署前检查表
- 引导式安装步骤
- 首次启动配置说明
- Mac 客户端配对/连接说明
- 常见失败排查指南

### 用户部署目标环境

V1 支持的用户部署环境可以包括：

- 家用主机
- Mini PC
- NAS
- 用户自有云主机

但文档和安装流程必须统一抽象成一套普通用户可跟随的步骤。

### 首次连接体验

首次连接必须尽量引导式完成：

- 用户知道要填什么地址
- 用户知道服务是否健康
- 用户知道为什么连接失败
- 用户知道下一步去哪里修复

## Security And Privacy

### 隐私边界

V1 明确遵守以下原则：

- 工作电脑只做数据入口/出口
- 智能中枢在用户自部署环境
- 客户端默认不采集敏感正文内容
- 音频、视频、健康都不是首发默认能力

### 数据边界

V1 需要明确区分：

- 本地临时缓存
- Gateway 持久业务数据
- OpenClaw 推理上下文

需要让用户清楚知道：

- 采了什么
- 没采什么
- 数据大致流向哪里
- 哪些结果是由 OpenClaw 推理得到的

## Failure And Degradation Strategy

### 客户端侧

当客户端遇到以下情况时，不应直接崩成不可用：

- Gateway 暂时不可达
- 本地权限缺失
- 登录会话失效
- 提醒拉取失败

V1 应至少做到：

- 显示清晰错误
- 本地排队待同步
- 允许用户手动重试

### 服务端侧

当 OpenClaw 暂不可用时：

- Gateway 需要给出明确错误来源
- 客户端和 Web 仍可查看已有读模型
- 不允许把“服务端推理失败”伪装成“客户端无数据”

## Release Quality

### V1 发布前必须满足

- Mac 客户端可构建、可安装、可运行
- Gateway 可按引导式文档部署
- OpenClaw 路径可跑通
- 登录、设备注册、信号上报、提醒、复盘主链路可验证
- 主要错误有可读反馈
- 用户知道自己是否处于已连接、已同步、已提醒状态

### V1 不要求在首发完成

- 自动更新
- App Store 分发
- 多平台统一客户端
- 多模态媒体正式版
- 健康数据自动权重融合

## Acceptance Criteria

V1 验收以“单用户完整主链路”作为唯一硬门槛。

必须完成以下场景：

1. 用户完成服务器部署并通过健康检查
2. 用户在 Mac 客户端注册/登录成功
3. 客户端完成设备注册与 bootstrap
4. 桌面活动信号持续上报
5. Gateway + OpenClaw 生成状态和建议
6. 至少一条提醒抵达客户端
7. 用户能在客户端和 Web 中查看状态、任务、恢复建议、复盘

如果上述链路不能稳定复现，则 V1 不能视为达到商用交付标准。

## Post-V1 Tracks

以下能力留作 V1 后续扩展轨道：

- Android / iOS
- 音频 Beta
- 视频 Beta
- 健康数据桥接
- Feishu / Telegram
- 自动更新

这些轨道后续可以独立出子 spec，但不允许反向污染 V1 首发边界。

## Repository Implications

基于本规约，当前仓库的主线目标应固定为：

- `apps/macos`：V1 主客户端
- `apps/api`：V1 Gateway
- `apps/web`：V1 辅助控制台
- `packages/domain`：共享契约

以下内容在 V1 中只保留为迁移资产或后续轨道，不再作为当前交付核心：

- `apps/desktop`
- `apps/android-recorder`

如仓库中的历史实验能力与本文档冲突，以本文档为准。
