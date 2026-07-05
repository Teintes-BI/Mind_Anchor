type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
type TaskPriority = "critical" | "high" | "medium" | "low";
type RiskLevel = "high" | "medium" | "low";
type MessageStatus = "pending" | "acknowledged";
type SessionStatus = "active" | "interrupted" | "completed";
type NotificationChannel = "desktop_local" | "mobile_push" | "feishu" | "telegram";

export const formatTaskStatus = (value: TaskStatus) =>
  ({
    todo: "待办",
    in_progress: "进行中",
    blocked: "阻塞",
    done: "完成",
  })[value];

export const formatTaskPriority = (value: TaskPriority) =>
  ({
    critical: "关键",
    high: "高",
    medium: "中",
    low: "低",
  })[value];

export const formatRiskLevel = (value: RiskLevel) =>
  ({
    high: "高风险",
    medium: "中风险",
    low: "低风险",
  })[value];

export const formatMessageStatus = (value: MessageStatus) =>
  ({
    pending: "待处理",
    acknowledged: "已确认",
  })[value];

export const formatSessionStatus = (value: SessionStatus) =>
  ({
    active: "进行中",
    interrupted: "已中断",
    completed: "已完成",
  })[value];

export const formatNotificationChannel = (value: NotificationChannel | string) =>
  (
    {
      desktop_local: "桌面提醒",
      mobile_push: "手机推送",
      feishu: "飞书",
      telegram: "Telegram",
    } as Record<string, string>
  )[value] ?? value;

export const formatCapability = (value: string) =>
  (
    {
      desktop_signals: "桌面信号",
      notifications: "通知",
      video_capture: "视频采集",
      health_bridge: "健康桥接",
    } as Record<string, string>
  )[value] ?? value;

export const formatPlatform = (value: string) =>
  (
    {
      macos: "macOS",
      windows: "Windows",
      linux: "Linux",
      android: "Android",
      ios: "iOS",
    } as Record<string, string>
  )[value] ?? value;

export const formatOnlineStatus = (value: string) =>
  (
    {
      online: "在线",
      offline: "离线",
      degraded: "降级",
      paired: "已配对",
    } as Record<string, string>
  )[value] ?? value;

export const formatRecoveryReason = (value: string) =>
  (
    {
      manual_request: "手动请求",
      session_interrupted: "会话中断",
      energy_drop: "能量下降",
      short_sleep_recovery: "睡眠不足后的恢复",
      attention_shift_after_interruption: "中断后注意力漂移",
      blocked_task_recovery: "阻塞任务恢复",
      low_focus_after_interruption: "中断后低专注",
      local_cluster_recovery: "本地恢复建议",
    } as Record<string, string>
  )[value] ?? value;

export const formatInterventionAction = (value: string) =>
  (
    {
      reset_focus: "重置专注",
      show_recovery_plan: "展示恢复计划",
    } as Record<string, string>
  )[value] ?? value;

export const formatInterventionTrigger = (value: string) =>
  (
    {
      low_state_score: "状态分数偏低",
      session_interrupted: "会话中断",
      high_risk_state: "高风险状态",
      attention_shift_detected: "检测到注意力漂移",
      stable_focus_state: "稳定专注状态",
    } as Record<string, string>
  )[value] ?? value;

export const formatCallDirection = (value: string) =>
  (
    {
      incoming: "呼入",
      outgoing: "呼出",
      missed: "未接",
    } as Record<string, string>
  )[value] ?? value;

export const formatCallStatus = (value: string) =>
  (
    {
      started: "已开始",
      connected: "已接通",
      ended: "已结束",
      missed: "未接",
      declined: "已拒接",
    } as Record<string, string>
  )[value] ?? value;

export const formatEmotionLabel = (value: string) =>
  (
    {
      calm: "平静",
      neutral: "中性",
      positive: "积极",
      tense: "紧张",
      stressed: "压力高",
    } as Record<string, string>
  )[value] ?? value;
