我理解你现在要的是一份真正可以作为**下一阶段开发基准**的《Comma V0.1 技术架构》，不是概念介绍。它需要把今天确定下来的产品哲学、Personal Core、Life Compass、Personal Dynamics Model、Choice Engine、Intervention Loop、Skill、7 个 Agent、模型分层、语音、交互、多终端、本地隐私以及未来协作愿景全部统一起来，同时仍然控制在你作为初学开发者可以逐步实现的复杂度内。

原来的 MindAnchor 已经形成了“事件 → 语义处理 → 分层记忆 → 个人模型 → 决策”的认知链路，也已经把状态、节律、启动成本、恢复方式、价值边界等作为长期个人模型的一部分。 原架构同时以 GoalFlow 和多个认知 Agent 分工处理任务、情绪、精力、中断、复盘等能力。 现有工程又已经建立了 Client → Gateway → OpenClaw Runtime → Feedback Loop 的基础设施，因此新版最合理的方向不是推倒重来，而是**重新划分职责边界**。

下面我把它正式整理成 **Comma V0.1 Technical Architecture — 2026-08-24 Draft**。

---

# Comma V0.1 技术架构

## 1. V0.1 的一句话定义

**Comma V0.1 是一个 Local-First 的长期个人 AI 陪伴系统。**

它的任务不是管理用户，也不是替用户做决定，而是不断完成一个循环：

```text
理解这个人想过怎样的生活
        ↓
理解他现在处于什么状态
        ↓
理解此刻发生了什么
        ↓
结合专业知识 + 个人历史
        ↓
生成几个现实可行的选择
        ↓
展示选择可能带来的结果
        ↓
用户自己决定
        ↓
观察真实结果
        ↓
适时进行后续追踪
        ↓
更新对这个人的理解
        ↓
下一次判断更准确
```

这就是 Comma V0.1 的**核心闭环**。

所有 Agent、Skill、LLM、语音、传感器、多终端，都只是服务这个闭环。

---

# 2. V0.1 最重要的架构变化

原来的逻辑比较接近：

```text
用户
 ↓
Chief Agent
 ↓
多个 Agent
 ↓
产生建议
 ↓
用户
```

新版改成：

```text
                     Life Compass
                         ↓
                 Comma Personal Core
                         ↓
            ┌────────────┼────────────┐
            ↓            ↓            ↓
       Personal       Personal      Personal
         State         Memory     Action Model
            └────────────┼────────────┘
                         ↓
                  Context Builder
                         ↓
                  Capability Router
                  / Skill Router
                         ↓
             Agent + Professional Skill
                         ↓
                   Choice Engine
                         ↓
              2～5 个选择 + 预测结果
                         ↓
                       用户
                         ↓
                    真实结果
                         ↓
                Intervention Loop
                         ↓
                  Personal Model
                     持续更新
```

这里最重要的变化是：

**Agent 不再是产品的中心。**

真正的中心变成：

**Personal Core。**

---

# 3. 五个真正的核心对象

以后你理解整个 Comma，只需要抓住五样东西。

| 核心                               | 回答的问题                 |
| -------------------------------- | --------------------- |
| Life Compass                     | 我真正想过怎样的生活？           |
| Personal State                   | 我现在怎么样？               |
| Personal Memory                  | 过去发生过什么？              |
| Personal Action / Dynamics Model | 什么事情在什么情况下对我有什么效果？    |
| Choice Engine                    | 此时此地我有哪些选择，各有什么代价和收益？ |

Agent、Skill、模型、RAG 都是在这五个对象下面工作的技术组件。

---

# 4. Life Compass：最高长期约束

这是新版里最重要的设计。

以前：

```text
Value Model
Goal Model
Boundary Model
```

只是 Personal Model 的组成部分。

V0.1 开始：

> **Life Compass 位于所有 Agent 和决策之上。**

它不是任务表。

也不是人格测试。

它是一份不断被用户和 Comma 共同修正的、非常精炼的“生活方向说明”。

例如内部可能是：

```yaml
desired_life:
  - 有创造性
  - 有较强自主权
  - 保持身体健康
  - 有足够自由时间
  - 保留重要关系

current_stage:
  - 优先完成 Comma 产品
  - 建立稳定工作能力

important_values:
  - autonomy
  - growth
  - health
  - curiosity
  - meaningful_creation

boundaries:
  - 不希望被 AI 强制安排
  - 不喜欢频繁提醒
  - 不希望效率凌驾于生活

current_conflicts:
  - 想推进很多目标
  - 实际精力有限
  - 高认知任务启动成本较高

interaction_preferences:
  - 更喜欢选择而不是命令
  - 深度问题偏好语音讨论
  - 简单决定偏好按钮
```

Life Compass 必须：

**短。**

目标大约几百到一千 token，而不是几万 token。

因为它几乎每一个重要决策都会读取。

---

# 5. Life Compass 不能由 AI 擅自改

这是产品主权问题。

系统可以产生：

```text
Life Compass Update Candidate
```

例如经过几个月聊天，Comma 判断：

> “你最近似乎越来越重视创造自由，而不是单纯提高工作效率。”

但不能直接写：

```text
用户价值观 = 创造自由
```

应该问：

> 最近我发现你多次表达了类似的东西。
>
> 我现在理解为：
>
> “比起单纯效率，你更希望拥有自主创造的生活。”
>
> 这个理解准确吗？

用户：

```text
[准确]
[部分准确]
[不准确]
[聊聊]
```

只有确认以后才能升级为高置信度 Life Compass 内容。

---

# 6. Personal State：描述“现在”

Personal State 和长期 Personal Model 必须分开。

V0.1 建议至少保留：

| 状态               | 含义          |
| ---------------- | ----------- |
| Energy           | 当前可用精力      |
| Emotion          | 当前情绪状态      |
| Cognitive Load   | 当前大脑负荷      |
| Mental Noise     | 思绪杂乱程度      |
| Focus Readiness  | 当前进入任务的准备程度 |
| Physical Fatigue | 身体疲劳        |
| Social Need      | 当前社交需求，可后加  |
| Recovery Need    | 当前恢复需要      |

例如：

```json
{
  "energy": 42,
  "emotion": 58,
  "cognitiveLoad": 76,
  "mentalNoise": 81,
  "focusReadiness": 34,
  "physicalFatigue": 47
}
```

但是必须明确：

**这些数字首先是一套个人游戏化估计体系，不是医学测量。**

例如 Energy=42 不意味着人体真的存在一个科学定义的 42% 精力。

---

# 7. 用户看到的数值和内部数值可以不同

内部可以比较细：

```text
Energy = 43.8
Confidence = 0.58
```

用户界面最好不要制造虚假精确感。

可以显示：

> 精力 44 / 100
> 当前估计：中等可信

或者：

> 精力：偏低

这部分以后可以通过实际反馈逐渐校准。

---

# 8. Personal Memory：记录“这个人的历史”

Memory 不等于聊天记录。

V0.1 仍然保留原来认知架构中的分层思想。原设计已经区分 Episodic、Behavioral、Emotional、Goal、Boundary 等记忆，并明确指出原始事件不能直接变成长时理解，而应该先经过压缩、模式提取、上下文关联和置信度判断。

新版可以简化成：

| Memory       | 内容         |
| ------------ | ---------- |
| Episodic     | 重要经历       |
| Behavioral   | 行为规律       |
| Emotional    | 情绪与恢复规律    |
| Goal         | 目标和计划      |
| Preference   | 兴趣和偏好      |
| Boundary     | 边界和价值      |
| Social       | 人际相关，可后做   |
| Intervention | 曾尝试过什么以及结果 |

---

# 9. 任何普通聊天都不能自动变长期记忆

流程必须是：

```text
Raw Conversation
      ↓
Event
      ↓
Semantic Summary
      ↓
Memory Candidate
      ↓
Confidence
      ↓
重复证据 / 用户确认
      ↓
Long-Term Memory
```

例如用户一次说：

> “我今天不想健身。”

不能形成：

> “用户讨厌健身。”

最多只是：

```text
event:
2026-08-24
user skipped exercise
reason unknown
```

如果几十次观察发现：

> 睡眠差 → 更容易取消训练

才能形成：

```text
Hypothesis:
睡眠不足似乎显著降低运动启动概率

confidence:
0.62
```

---

# 10. Personal Action Model：V0.1 最重要的新模块

我认为这是今天整个讨论里最值得正式加入架构的东西。

它回答：

> **这个人做某件事，通常会发生什么？**

不是：

```text
用户喜欢摩托
```

而是：

```text
在什么情况
+
做什么事情
→
什么结果
```

即：

# Context → Action → Outcome

例如：

```text
Condition:
Mental Noise 高
Energy 中等以上
至少有 60 分钟空闲
天气和安全条件适合

Action:
骑摩托 45~60 分钟

Typical Outcome:
Emotion +16
Mental Noise -14
Energy -5
Focus Readiness +11

Confidence:
0.68
```

再比如：

```text
Condition:
在家
轻度情绪低落
只有 15~20 分钟

Action:
和猫互动

Typical Outcome:
Emotion +9
Energy +2
Mental Noise -3

Confidence:
0.74
```

于是系统学到的不只是：

> 用户喜欢摩托。

而是：

> **摩托对这个用户可能是一种认知重置方式。**

猫则可能是一种：

> **低成本、短周期情绪恢复方式。**

---

# 11. Personal Action 的数据结构

建议统一成：

```yaml
action_id: motorcycle_ride

name: 骑摩托

category:
  - enjoyment
  - cognitive_reset

requirements:
  minimum_time_minutes: 45
  location: outdoor
  attention_required: high
  safe_condition_required: true

estimated_effect:
  energy: -5
  emotion: +16
  cognitive_load: -8
  mental_noise: -14
  focus_readiness: +11

long_term_effect:
  unknown: true

best_context:
  - high_mental_noise
  - initiation_resistance
  - medium_or_high_energy

avoid_context:
  - severe_fatigue
  - low_attention
  - unsafe_weather

observation_count: 8

confidence: 0.68
```

这些数字不是一开始人工写死。

它们应该随着使用不断更新。

---

# 12. Action Model 第一版不要用复杂机器学习

V0.1 没必要训练神经网络。

甚至不需要真正的“拟合模型”。

第一版可以用非常容易理解的方法：

```text
旧预测
+
新观察
→
加权平均
→
新预测
```

例如：

```text
原来：
骑摩托 → Emotion +12

最近一次：
实际主观反馈约 +18

更新：
Emotion 预测 +13
```

观察越多：

> 更新幅度越小，置信度越高。

观察很少：

> 更新幅度较大，但置信度低。

以后数据达到一定规模，再换 Bayesian Model、Regression、Contextual Bandit 或其他算法。

**不要第一天就训练个人模型。**

---

# 13. Choice Engine：整个用户交互最核心的一层

Choice Engine 不问：

> 什么是理论上的最优行动？

而应该问：

> **此时此地，对这个用户有哪些合理选择？**

输入：

```text
Life Compass
+
Personal State
+
Current Context
+
Current Goal
+
Personal Action Model
+
Relevant Memory
+
Professional Skills
+
Safety Constraints
```

输出：

```text
2～5 个真正可执行的选择
+
每个选择可能带来的影响
+
置信度
+
必要时一句解释
```

---

# 14. Choice Engine 不输出命令

禁止：

> 你应该去散步。

优先：

> 你现在可以考虑几个方向。

例如：

```text
你已经休息 15 分钟了。

现在大概有几个方向：

🐱 和猫玩 15 分钟
情绪 ↑
精力轻微 ↑
时间成本低

🚶 散步 10 分钟
认知负载 ↓
精力 ↑
重新开始任务的准备度 ↑

📱 再刷 10 分钟
即时愉悦 ↑
但按过去记录，后续启动任务可能更难

💻 直接继续
可以立即推进
但当前启动阻力仍然较高
```

最后必须允许：

```text
[我自己决定其他方式]
```

---

# 15. Choice Engine 的内部评价维度

可以大致有：

```text
Life Compass Alignment
+
Current State Fit
+
Goal Relevance
+
Personal Historical Effect
+
Professional Evidence
-
Time Cost
-
Risk
-
Interruption Cost
```

不是一定要建立一个非常死板的数学公式。

V0.1 可以先作为排序规则。

以后再优化。

---

# 16. 健康与快乐之间不能变成“道德判断”

例如：

> 用户非常喜欢炸鸡。

不能：

```text
炸鸡 = bad
沙拉 = good
```

而应该：

```text
炸鸡：

Emotion +20
Pleasure +18
Long-Term Health -2
Current Diet Goal -4

用户非常喜欢
```

如果用户今天说：

> 我就想吃炸鸡。

Comma 不应该教育他。

可以显示后果，然后：

> 好，那今天就按这个来。

**用户拥有最终决策权。**

---

# 17. 极端状态下关闭游戏化

这是必须加入规则的。

正常：

```text
Energy +5
Focus +8
```

可以。

明显情绪低落：

减少评分和任务压力。

强烈痛苦状态：

**关闭：**

```text
积分
连胜
扣分
效率
任务完成率
```

转入：

```text
陪伴
降低压力
安全优先
```

游戏系统服务人。

不能让人服务游戏系统。

---

# 18. Intervention Engine：记录“一次改变尝试”

这是 Personal Action Model 的主要学习来源。

例如：

> 工作之前先做 10 分钟低压力预热。

系统创建：

```yaml
intervention_id: xxx

type: pre_task_warmup

hypothesis:
  高启动成本任务之前先进行10分钟轻度预热，
  可能降低任务启动阻力。

expected_effect:
  focus_readiness: +10
  initiation_resistance: -10

observation_window:
  7_days

follow_up_plan:
  - day_1
  - day_3
  - day_7

status:
  active
```

---

# 19. Follow-Up 不能变成机械问卷

你之前提出：

> Day 1 / Day 3 / Day 7 / Day 30。

方向很好。

但系统以后不能全部固定。

应该根据：

```text
Expected Learning Value
-
Interruption Cost
```

决定要不要问。

例如：

介入效果预计只有 30 分钟：

> 不应该 30 天以后再问。

介入是：

> 改变睡眠时间。

就可能观察：

```text
Day 1
Day 3
Day 7
Day 14
```

介入是：

> 每周力量训练。

就可能：

```text
Week 1
Week 2
Week 4
Week 8
```

---

# 20. Follow-Up 最重要的是问“什么发生了”

例如系统问：

> 昨天我们尝试了工作前 10 分钟预热。
>
> 今天感觉怎么样？

用户：

> 上午有用，下午没用。

不能只存：

```text
score = 6
```

还要继续：

> 下午没用，是因为仍然不想开始，还是因为已经很累？

最后形成：

```text
Warm-up:
helps initiation resistance

But:
does not compensate for severe fatigue
```

这比：

> 有效 6/10

价值大很多。

---

# 21. Feedback & Learning Loop

完整学习闭环：

```text
Intervention
     ↓
User Execution
     ↓
Immediate Outcome
     ↓
Follow-Up
     ↓
Structured Feedback
     ↓
Context Linking
     ↓
Update Action Model
     ↓
Update Confidence
     ↓
Possibly Create Memory
     ↓
Future Choice Prediction Improves
```

这才是：

> **越用越懂用户。**

---

# 22. 七个 Agent 在新版里的位置

旧系统中的 Agent 不需要删除。

但需要重新定义：

> **Agent = 专业岗位。**

而不是：

> Agent = 一个长期拥有独立人格和完整用户记忆的大脑。

建议保持：

| Capability            | 负责      |
| --------------------- | ------- |
| State Insight         | 当前状态解释  |
| Task Planning         | 目标和任务拆解 |
| Energy Management     | 精力与恢复   |
| Interruption Recovery | 中断后的恢复  |
| Emotion Support       | 情绪陪伴    |
| Reflection            | 复盘      |
| Research              | 外部知识研究  |

Chief Agent 可以保留，但它应该更像：

```text
Capability Router / Orchestrator
```

而不是产品人格。

原来的多 Agent 能力仍然可以继续服务 GoalFlow、Recovery、Reflection 等已有模块。

---

# 23. 所有 Agent 共享一个 Personal Core

非常重要：

不要出现：

```text
State Agent 自己一套 memory
Energy Agent 自己一套 memory
Emotion Agent 自己一套 memory
Reflection Agent 自己一套 memory
```

否则上下文和长期一致性一定失控。

应该：

```text
                Personal Core
                     │
      ┌──────────────┼──────────────┐
      ↓              ↓              ↓
 State Agent   Emotion Agent   Reflection Agent
```

所有 Agent：

读取同一：

```text
Life Compass
State
Memory
Personal Action Model
```

但只得到当前任务真正需要的一小部分。

---

# 24. Skill Library：专业知识工具箱

这一层正式加入 V0.1。

Agent 本身不能只靠模型参数中的泛化知识判断。

它可以调用：

```text
心理学
行为科学
脑科学
哲学
社会学
人类学
睡眠科学
运动科学
决策科学
沟通理论
目标管理
……
```

等 Skill。

---

# 25. Universal Skill 和 Personal Skill 分开

## Universal Skill

来自人类已有知识。

例如：

```text
ACT Psychological Flexibility
CBT Cognitive Reframing
Attention Residue
Cognitive Fatigue
Sleep Hygiene
Behavior Activation
Existential Choice
Stoic Dichotomy of Control
```

## Personal Skill

从用户本人身上学到。

例如：

```text
和猫互动
骑摩托
听某种音乐
特定散步路线
某种休息方式
和某个人聊天
```

最终：

```text
Universal Knowledge
        ×
Personal Experience
        ×
Current Context
        ×
Life Compass
```

共同形成判断。

---

# 26. Skill 标准格式

建议未来 Skill 都用统一 metadata：

```yaml
name:
domain:

description:

use_when:

avoid_when:

core_concepts:

questions:

possible_actions:

evidence_type:
  scientific
  clinical_framework
  philosophical
  sociological
  personal_observation

evidence_strength:

safety_notes:

source:

author:

license:

version:

commercial_use_allowed:
```

这里特别要保留：

```text
evidence_type
```

否则萨特和现代随机对照研究会被系统当成同一种“证据”。

不能这样。

---

# 27. 哲学 Skill 不是科学事实

例如：

```text
Sartrean Existential Lens
```

可以帮助：

> 从自由、选择、责任、自我定义角度思考。

但输出应该是：

> 从存在主义角度，可以这样理解……

而不是：

> 科学证明你应该……

这会是 Comma 专业度的重要组成部分。

---

# 28. Skill Router

Skill 不能全部塞给模型。

正确：

```text
当前 Event
     ↓
Problem Classification
     ↓
Skill Search
     ↓
Top 3～5
     ↓
Context Filter
     ↓
Top 1～3
     ↓
加载全文
```

例如用户：

> 脑子很乱，不想开始任务。

候选可能：

```text
Cognitive Fatigue
Attention Residue
Behavior Activation
Task Initiation
```

而不会加载：

> 300 个 Skill。

---

# 29. Context Builder：专门解决上下文膨胀

这是 V0.1 必须单独成为一个模块的东西。

每次调用模型时构造：

# Context Packet

而不是把数据库直接喂给模型。

普通决策目标可以控制在：

```text
Life Compass:
300~800 tokens

Current State:
100~200

Current Goal / Task:
100~300

Current Event:
100~300

Relevant Memories:
3~5 条

Relevant Skills:
1~3 个

Relevant Personal Actions:
2~5 个

Active Intervention:
0~2 个

Recent Conversation:
压缩后的必要部分
```

普通场景尽量：

**约 2K～5K token。**

深度复盘可以更高。

但这是设计目标，不是死限制。

---

# 30. 模型架构：三层而不是“一只大模型干全部”

## Level 0：不用模型

普通程序可以完成：

```text
计时
App 使用检测
规则检测
计划时间
数据库查询
通知触发
简单评分
```

例如：

```text
short_video_usage > 20min
```

不需要 LLM。

---

# 31. Level 1：Fast Brain

小模型。

负责：

```text
Event 分类
结构化抽取
摘要
Memory Candidate
Skill Router
简单状态推断
Context Compression
反馈结构化
普通 Choice 生成
```

V0.1 可以选择一个适合本地设备的小模型。

例如：

```text
4B～9B 级
```

但模型名称应该是可替换配置，而不是写死在 Comma 中。

---

# 32. Level 2：Deep Brain

只有这些情况使用：

```text
晚间深度复盘
Life Compass 讨论
人生方向
复杂情绪
多 Skill 冲突
重大决策
月度总结
复杂个人模式解释
```

可以：

```text
本地强模型
或
云端强模型
```

根据硬件和用户授权决定。

---

# 33. Model Router

因此：

```text
Request
  ↓
Complexity Estimator
  ↓
┌─────────────────────────┐
│ Rule Engine             │
│ Fast Brain              │
│ Deep Brain              │
└─────────────────────────┘
```

这会直接控制：

```text
算力
延迟
API 成本
隐私
```

---

# 34. 模型供应商必须可替换

不要让 Comma 代码里面到处出现：

```text
qwen.xxx()
openai.xxx()
anthropic.xxx()
```

统一：

```text
ModelProvider
```

例如：

```ts
interface ModelProvider {
  generate(request: ModelRequest): Promise<ModelResponse>
}
```

实现：

```text
LocalProvider
OpenAIProvider
AnthropicProvider
OpenRouterProvider
FutureProvider
```

以后换模型不动 Personal Core。

---

# 35. OpenClaw 的新版定位

现有系统已经建立 production OpenClaw runtime、Gateway 和多个客户端之间的运行链路，因此没有理由重写这部分基础设施。

新版：

# OpenClaw = Agent Runtime

负责：

```text
Agent 调度
Tool 调用
Skill 调用
Session
Cron
Gateway
Channel
Model Invocation
Runtime Trace
```

但它不应该负责定义：

```text
Life Compass
Personal Action Model
Intervention Logic
Choice Philosophy
Personal Dynamics
```

这些属于 Comma。

---

# 36. Hermes 的定位

Hermes 可以继续作为：

# Reference Architecture

重点借鉴：

```text
Persistent user understanding
Progressive Skill loading
Memory summarization
Auxiliary model
Learning loop
```

但是不要：

> 把 Comma 直接变成 Hermes 插件。

也不要：

> 把 Personal Core 交给 Hermes。

以后想实验，可以做：

```text
HermesRuntimeAdapter
```

但不是 V0.1 必须项。

---

# 37. Comma Personal Core 应该完全独立于 Agent Runtime

理想边界：

```text
                Comma Personal Core
                       │
                 Runtime Adapter
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
      OpenClaw       Hermes        Future
```

未来某个框架停止维护：

> Comma 不受致命影响。

---

# 38. V0.1 推荐技术结构

考虑你现有项目已经使用 Fastify/Zod 一类 TypeScript 基础，而且你目前还是初学阶段，我现在反而建议：

**Personal Core V0.1 优先继续用 TypeScript。**

不要立刻增加 Python 微服务。

这样：

```text
Desktop
Mobile
Web
   ↓
Gateway / Fastify
   ↓
Comma Core / TypeScript
   ↓
OpenClaw Runtime
   ↓
Models / Skills / Tools
```

只有这些东西需要 Python 时：

```text
语音识别
本地语音模型
特殊 ML
训练实验
```

再单独做：

```text
Python Worker
```

这样比：

> Node 后端 + Python Core + OpenClaw

同时维护三套逻辑更适合当前阶段。

---

# 39. 数据存储

V0.1：

# SQLite

完全够用。

推荐结构：

```text
SQLite
+
FTS5
+
JSON columns where appropriate
```

以后需要向量检索：

```text
Embedding index
```

再增加。

不要 V0.1 就：

```text
Postgres
Redis
Vector DB
Graph DB
Kafka
```

全部上齐。

---

# 40. 建议的核心数据表

第一批真正需要：

| 表                         | 作用               |
| ------------------------- | ---------------- |
| users                     | 用户               |
| life_compass              | Life Compass 与版本 |
| goals                     | 长期/短期目标          |
| tasks                     | 当前执行任务           |
| events                    | 不可变事件            |
| state_snapshots           | 状态快照             |
| memories                  | 长期记忆             |
| memory_candidates         | 候选记忆             |
| personal_actions          | 用户行为/兴趣          |
| action_effects            | 行为效果             |
| choices                   | 一次决策窗口           |
| choice_options            | 候选选择             |
| interventions             | 介入方案             |
| intervention_observations | 后续观察             |
| feedback                  | 用户反馈             |
| skills                    | Skill metadata   |
| skill_usage               | Skill 调用记录       |
| sessions                  | 对话               |
| devices                   | 终端               |
| permissions               | 数据授权             |

---

# 41. Event 是整个数据库的根

推荐 Event 至少：

```json
{
  "id": "...",
  "timestamp": "...",
  "type": "state_report",
  "source": "desktop",
  "actor": "user",
  "context": {},
  "payload": {},
  "confidence": 1,
  "privacy_level": "local"
}
```

Event 原则：

> 已经发生的事实尽量不修改。

后续理解变化：

产生新的：

```text
memory
model
hypothesis
```

而不是改历史。

---

# 42. State Snapshot

例如：

```json
{
  "energy": 42,
  "emotion": 56,
  "cognitiveLoad": 75,
  "mentalNoise": 80,
  "focusReadiness": 31,
  "sources": [
    "self_report",
    "desktop_activity"
  ],
  "confidence": 0.61
}
```

---

# 43. Memory

建议：

```json
{
  "type": "behavioral",
  "content": "长时间高认知编程后任务切换频率明显增加",
  "confidence": 0.68,
  "evidenceEventIds": [],
  "createdAt": "...",
  "lastConfirmedAt": "...",
  "userConfirmed": false
}
```

必须能：

```text
查看
修改
纠正
删除
```

---

# 44. Interaction：不是所有场景都聊天

V0.1 正式定义五级交互。

| Interaction       | 使用场景     |
| ----------------- | -------- |
| Silent            | 后台观察，不出现 |
| Decision Card     | 关键决策窗口   |
| Quick Feedback    | 评分/标签    |
| Voice Reflection  | 晚间复盘     |
| Deep Conversation | 人生/复杂问题  |

---

# 45. Silent Mode

系统绝大多数时候：

> **什么都不做。**

这是 Comma 和普通效率 App 最大差异之一。

后台：

```text
记录事件
更新状态
等待
```

不要：

> 每检测到一次异常就通知。

---

# 46. Decision Window

只有判断：

> 现在是一个有意义的岔路口。

才弹出。

例如：

```text
工作 100min
↓
窗口切换增加
↓
进入短视频
↓
持续 15min
↓
Focus Readiness 下降
↓
Decision Window
```

---

# 47. Decision Window UI

不要 checkbox。

如果只能选择一个：

> 单选卡片 / Action Card。

例如：

```text
接下来怎么走？

🐱 陪猫 15 分钟

🚶 散步 10 分钟

📱 再刷一会儿

💻 回到当前任务

➕ 我有别的想法
```

点击一次完成。

---

# 48. Quick Feedback

推荐：

```text
⭐ 1~5

有效
没效果
很烦
还不错
以后少提醒
```

不要逼用户输入长文字。

---

# 49. Voice Reflection

晚上才是语音真正有价值的地方。

建议：

```text
Scheduler
    ↓
判断今天有没有值得回顾的内容
    ↓
轻提示
“今天有两个变化值得聊两分钟，要聊聊吗？”
    ↓
用户同意
    ↓
Voice Session
```

不是每天强制开会。

---

# 50. 第一版 Voice 不做端到端“大脑”

正确：

```text
Microphone
   ↓
VAD
   ↓
ASR
   ↓
Text
   ↓
Comma Core
   ↓
LLM
   ↓
Text
   ↓
TTS
   ↓
Voice
```

这样文字和语音共用：

```text
Life Compass
Memory
Skill
Agent
Intervention
```

---

# 51. V0.1 Voice 推荐采用可替换 Adapter

例如：

```text
VoicePipeline

VADProvider
ASRProvider
TTSProvider
```

候选实现可以继续考虑我们今天讨论过的：

```text
Pipecat
SenseVoice / FunASR
CosyVoice
```

但架构里不要绑死具体项目。

---

# 52. Voice Emotion 只能作为弱信号

例如：

```text
User text:
“没事，我挺好的。”

Voice model:
negative emotion probability 0.62
```

不能：

> “你其实很难过。”

只能：

```text
possible_conflict = true
confidence = low
```

必要时：

> “听起来你好像有点累，我理解得对吗？”

由用户确认。

---

# 53. 晚间 Voice Reflection 完整数据流

```text
21:30
↓
Follow-Up Scheduler
↓
发现 active intervention
↓
轻提示用户
↓
用户接受
↓
Voice Session
↓
ASR
↓
Context Builder
↓
Life Compass
Today's Events
Intervention History
Relevant Memory
Relevant Skills
↓
Deep Brain
↓
自然对话
↓
TTS
↓
结束
↓
Fast Brain
↓
抽取：

Outcome
Reason
Context
Score
New Hypothesis
↓
写 Event
↓
Update Action Model
↓
Update Intervention
↓
Memory Candidate
```

---

# 54. 多终端架构

目标：

> 一个 Personal Core，多种终端。

```text
                   Personal Core
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
    Desktop           Mobile            Web
       ↓                ↓
     Watch           Earbuds
                        ↓
                  Smart Glasses
```

每一个设备只是：

```text
Sensor
+
Interaction Surface
```

不是新的大脑。

---

# 55. V0.1 不应该同时开发全部终端

技术架构：

> Multi-Terminal Ready。

实际交付：

> Desktop First。

因为当前已有工程也把桌面模型效果作为重要主线，并已经验证过移动端闭环。

所以 V0.1 建议：

```text
Primary:
macOS/Desktop

Secondary:
Web admin / debug

Optional:
existing Android capture

Later:
Watch
Earbuds
Glasses
```

---

# 56. Desktop V0.1 负责什么

```text
聊天
当前任务
状态
Decision Window
App Usage
Interruption
通知
Memory 查看
Life Compass 查看
反馈
```

---

# 57. 手机以后负责什么

```text
随身对话
Voice
位置 Context
通知
离开电脑后的事件
快速反馈
健康数据桥接
```

---

# 58. 智能眼镜真正适合什么

不是：

> 时时刻刻在视野里讲话。

而是：

# Ambient Interaction

例如：

```text
低频提示
环境 Context
轻量语音
视觉辅助
快速确认
```

真正成功的 Comma：

> 大部分时候不存在感很低。

---

# 59. Privacy Architecture

新版正式定义：

# Local First + User Sovereignty

原则：

```text
默认本地
按需上传
用户知道
用户授权
可以撤销
可以导出
可以删除
```

---

# 60. 数据最好划四级

例如：

```text
P0 — Ephemeral
原始传感器数据
尽可能处理后删除

P1 — Event
结构化事件

P2 — Personal Memory
长期私人数据

P3 — Deep Personal Model
Life Compass
Dynamics
Sensitive Preferences
```

P3 默认：

> **只允许本地。**

---

# 61. 云端模型调用

如果未来调用云模型：

Context Builder 应该知道：

```text
local_only
cloud_allowed
sensitive
```

例如：

```text
Life Compass:
cloud_allowed = false
```

那么使用云模型时只给必要投影。

---

# 62. Collaboration Profile 永远不是 Personal Model 本身

远期社会协作：

```text
Private Personal Model
        ↓
User Permission
        ↓
Projection Generator
        ↓
Collaboration Profile
        ↓
Network Matching
```

服务器只看：

```text
技能
兴趣
合作意愿
可用时间
希望回报
项目偏好
```

不应该看到：

```text
情绪历史
亲密关系
私人对话
心理脆弱点
生活细节
```

---

# 63. Safety Constraint 永远高于兴趣偏好

例如：

> 用户喜欢骑摩托。

但是：

```text
严重疲劳
注意力下降
天气危险
```

此时 Choice Engine：

不能因为：

> “历史上骑摩托情绪 +16”

就排第一。

排序必须：

```text
Safety
>
Preference
```

---

# 64. Comma 绝不应该变成医疗诊断工具

它可以：

> 观察。

> 提醒。

> 陪伴。

> 提出假设。

不能：

> 根据语音宣布用户患有某种心理疾病。

所有类似心理和情绪推断应该带：

```text
confidence
source
user_confirmation
```

---

# 65. Comma 也不应该成为“隐形控制系统”

因此必须增加：

# Agency Guard

它检查输出是不是：

```text
命令
操控
羞耻
恐吓
积分惩罚
过度诱导
```

例如：

不应该：

> 你已经失败三天了，再这样下去目标肯定完不成。

应该：

> 最近三次你都没有继续这个计划。要不要看看这个计划是不是本身不适合你？

---

# 66. Observability

每一次重要判断建议本地保存一个 trace：

```text
Decision ID

Input Event
Context Packet
Selected Memory
Selected Skills
Selected Capability
Model Tier
Generated Options
User Choice
Outcome
```

这样以后你才能调试：

> 为什么 Comma 今天突然推荐骑摩托？

---

# 67. 但 Trace 不能污染 Memory

之前你的工程里已经发现过内部 route/agent/trace 噪声进入记忆上下文的问题。

因此数据库必须物理或逻辑区分：

```text
System Trace
≠
User Memory
```

任何：

```text
router
agent name
model response
internal prompt
trace
```

默认禁止进入长期个人记忆。

---

# 68. V0.1 应该重点观察哪些指标

不要第一版就看：

> DAU。

对你作为第一个用户，更重要的是：

| Metric                   | 意义              |
| ------------------------ | --------------- |
| Choice Acceptance        | 推荐有没有用          |
| Ignore Rate              | 是否太烦            |
| Interruption Error       | 不该打扰却打扰多少       |
| Follow-Up Completion     | 用户愿不愿意反馈        |
| Prediction Error         | 预测效果和真实效果差多少    |
| Memory Correction Rate   | 系统有多少理解被用户纠正    |
| Memory Usefulness        | 被检索的记忆是否真正帮助判断  |
| Action Confidence Growth | 是否越来越理解个人行为     |
| Life Compass Stability   | 对用户长期方向理解是否逐渐稳定 |

真正北极星：

> **三个月后的 Comma 是否明显比第一天更懂这个用户？**

---

# 69. 推荐代码目录

如果基于现有项目，我建议向这个结构靠：

```text
comma/
│
├── apps/
│   ├── desktop/
│   ├── mobile/
│   └── web/
│
├── services/
│   ├── gateway/
│   └── voice-worker/
│
├── core/
│   ├── life-compass/
│   ├── state/
│   ├── events/
│   ├── memory/
│   ├── actions/
│   ├── interventions/
│   ├── choices/
│   ├── reflection/
│   ├── context/
│   └── privacy/
│
├── runtime/
│   └── openclaw/
│
├── skills/
│   ├── psychology/
│   ├── neuroscience/
│   ├── philosophy/
│   ├── sociology/
│   ├── behavior/
│   ├── health/
│   └── personal/
│
├── models/
│   ├── router/
│   ├── providers/
│   └── prompts/
│
├── packages/
│   ├── contracts/
│   ├── schemas/
│   └── ui/
│
└── data/
    └── local/
```

---

# 70. API 设计建议

核心接口大致：

```text
POST /v1/events
GET  /v1/state/current

GET  /v1/life-compass
POST /v1/life-compass/candidates
POST /v1/life-compass/confirm

POST /v1/choices/generate
POST /v1/choices/:id/select

POST /v1/interventions
GET  /v1/interventions/active
POST /v1/interventions/:id/observe

GET  /v1/memories/search
POST /v1/memories/:id/confirm
DELETE /v1/memories/:id

POST /v1/reflections/start

POST /v1/voice/session

GET  /v1/privacy/export
DELETE /v1/privacy/data
```

---

# 71. 一个完整的 Decision Window 信息流

以刷短视频为例：

```text
Desktop Sensor
↓
检测：
短视频 App 15min
↓
Event:
short_video_session
↓
State Engine
↓
Context Builder
↓
发现：

Current Goal:
今晚继续开发

State:
Energy 45
Mental Noise 76
Focus 30

Location:
home

Personal Actions:
cat
walk
meditation
motorcycle

Memory:
过去长刷以后重启困难

↓
Safety Filter
↓
Skill Router
↓
Attention / Recovery Skill
↓
Choice Engine
↓
候选：

猫
散步
继续刷
继续工作

↓
Decision Card
↓
用户：
选择猫

↓
Choice Event
↓
15min later
↓
Quick Feedback
↓
Emotion improved
↓
Update:
cat_action_effect
```

---

# 72. 一个完整晚间复盘信息流

```text
Scheduler
↓
检查今天有没有：
重要介入
异常状态
值得确认的 Memory Candidate

↓
Interruption Value Evaluation

如果值得：
↓
轻提示

用户同意
↓
Voice Session
↓
ASR
↓
Context Packet
↓
Reflection Capability
↓
相关 Skills
↓
Deep Brain
↓
自然交流
↓
TTS
↓
Session End
↓
Fast Brain Summary
↓
结构化：

Today Reflection
Intervention Outcome
New Hypothesis
Memory Candidate
Life Compass Candidate

↓
用户确认必要部分
↓
数据库更新
```

---

# 73. 一次深度人生对话

这种对话不应该天天发生。

例如：

> “我现在不知道做 Comma 到底值不值得。”

流程：

```text
Deep Conversation
↓
Life Compass
↓
Goal Memory
↓
Relevant Episodic Memory
↓
Value / Existential / Decision Skills
↓
Deep Brain
↓
Discussion
```

最后不应该：

> “你必须继续做。”

而应该帮助：

> 把真正的冲突看清楚。

如果对话出现新的长期理解：

```text
Life Compass Candidate
```

之后再确认。

---

# 74. V0.1 现在明确“不做”的东西

这是控制项目复杂度的关键。

第一版暂时不要：

```text
训练自己的大模型

完整智能眼镜客户端

全自动人格画像

复杂神经网络个人预测模型

多人协作网络

自动招聘

项目众筹平台

复杂社交画像

完全自动任务执行

几十个 Agent

几百个 Skill 同时接入

医疗级状态判断
```

这些不是砍掉。

只是：

> **不能进入 V0.1 Critical Path。**

---

# 75. Comma V0.1 真正必须完成的 10 个能力

这一版达到下面十条，就可以认为核心成立：

1. 用户能够持续和 Comma 聊天。
2. 系统能够维护并让用户查看/修改 Life Compass。
3. 系统能够保存 Event 和当前 State。
4. 系统可以从相关 Memory 中检索少量上下文。
5. 系统可以根据当前状态生成 2～5 个选择，而不是命令。
6. 每一个 Choice 可以记录用户实际选了什么。
7. 可以创建 Intervention 并安排后续观察。
8. Follow-Up 后可以更新 Personal Action Model。
9. 晚上能够完成一次自然的语音复盘。
10. 全部 Personal Core 数据默认本地，并支持用户查看、修改、导出和删除。

只要这十件事情成立：

> **Comma 的核心已经成立。**

---

# 76. 我建议你的实际开发顺序

考虑你是初学者，同时已有一部分 OpenClaw/Gateway 基础，我建议现在真正按照下面顺序做：

### V0.1-A：Personal Core Skeleton

先实现：

```text
SQLite
Event
State
Life Compass
API
```

不接复杂 AI。

---

### V0.1-B：Single Brain

实现：

```text
用户聊天
↓
Context Builder
↓
一个模型
↓
回复
```

先不要七 Agent。

---

### V0.1-C：Choice Engine

第一个真正的产品功能：

```text
当前状态
+
Life Compass
+
Personal Action
↓
2～5 Action Cards
```

并记录选择。

---

### V0.1-D：Intervention Loop

实现：

```text
介入
↓
定时 Follow-Up
↓
反馈
↓
Action Effect 更新
```

这一步是整个产品“越用越懂”的起点。

---

### V0.1-E：Memory

加入：

```text
Memory Candidate
Memory Confirm
Memory Retrieval
```

不要一开始做复杂 RAG。

SQLite FTS 足够开始。

---

### V0.1-F：Agent + Skill

这时候再把：

```text
State
Task
Energy
Recovery
Emotion
Reflection
Research
```

逐步接进 OpenClaw。

每次只接一个。

---

### V0.1-G：Voice Reflection

接：

```text
VAD
ASR
LLM
TTS
```

第一目标：

> 晚上能够自然聊 3～10 分钟。

---

### V0.1-H：Desktop Decision Window

最后才开始：

```text
App Activity
Interruption Detection
Context
Automatic Decision Window
```

这时候半侵入式 Agent 才真正开始出现。

---

# 77. 一句话区分每一层

以后开发遇到混乱，可以用这张表判断代码应该放哪里。

| 组件                    | 一句话             |
| --------------------- | --------------- |
| Client                | 我怎么和用户交互        |
| Event                 | 发生了什么           |
| State                 | 用户现在怎么样         |
| Memory                | 过去发生过什么         |
| Life Compass          | 用户想去哪           |
| Personal Action Model | 什么对这个人有效        |
| Skill                 | 人类已有的方法         |
| Agent                 | 谁负责处理           |
| Model                 | 谁负责推理           |
| Choice Engine         | 现在有哪些路          |
| Intervention          | 我们正在尝试什么改变      |
| Feedback              | 实际效果怎么样         |
| Reflection            | 我们从过去学到了什么      |
| OpenClaw              | 这些智能能力怎么运行      |
| Comma Core            | 所有东西如何围绕“这个人”统一 |

---

# 78. 最终架构总图，用文字表达就是

```text
┌─────────────────────────────────────────────┐
│                User / Real Life             │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│               Interaction Layer             │
│ Silent / Cards / Feedback / Voice / Chat    │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│                Event & Context              │
│ App / Task / Location / Voice / Self-report │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│            COMMA PERSONAL CORE              │
│                                             │
│ Life Compass                                │
│ Personal State                              │
│ Personal Memory                             │
│ Personal Action Model                       │
│ Intervention Engine                         │
│ Choice Engine                               │
│ Reflection                                  │
│ Privacy / Permission                        │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│          Intelligence / Capability          │
│                                             │
│ Context Builder                             │
│ Skill Router                                │
│ Capability / Agent Router                   │
│ Model Router                                │
│                                             │
│ State / Task / Energy / Recovery            │
│ Emotion / Reflection / Research             │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│             OpenClaw Runtime                │
│ Agent / Skill / Tool / Cron / Session       │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│               Model Layer                   │
│                                             │
│ Rule Engine                                 │
│ Fast Local Brain                            │
│ Deep Local / Cloud Brain                    │
└──────────────────────┬──────────────────────┘
                       ↓
                Choice / Conversation
                       ↓
                     User
                       ↓
                 Actual Outcome
                       ↓
               Feedback / Follow-Up
                       ↓
┌─────────────────────────────────────────────┐
│              Learning Loop                  │
│ Event → Memory → Action Model → Confidence  │
└──────────────────────┬──────────────────────┘
                       │
                       └──────────────→ Personal Core
```

---

# 79. 最后把今天整个设计压成一句产品架构原则

**Comma 不是一个拥有很多 Agent 的效率软件。**

它应该是：

> **一个拥有长期个人记忆和动态个人模型的本地 AI Core。它理解用户想过怎样的生活，观察用户当前处境，在需要的时候调用合适的 Agent、专业 Skill 和模型，展示几个可能的未来，把选择权交给用户，再通过真实结果和持续反馈逐渐学习“什么对这个具体的人真正有效”。**

从工程角度：

> **Life Compass 是方向。**
> **Personal Core 是主体。**
> **Memory 是过去。**
> **State 是现在。**
> **Action Model 是经验。**
> **Skill 是专业知识。**
> **Agent 是岗位。**
> **Model 是算力。**
> **Choice Engine 是交互核心。**
> **Intervention Loop 是学习机制。**
> **OpenClaw 是运行底座。**
> **终端只是入口。**

我认为这一版已经可以替代原来的“7 Agent 为中心”的架构，成为后面 **Comma V0.1 真正的技术总纲**。
