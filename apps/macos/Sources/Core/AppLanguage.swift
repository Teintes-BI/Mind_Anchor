import Foundation

enum AppLanguage: String, CaseIterable, Codable, Identifiable {
    case chinese = "zh-Hans"
    case english = "en"

    var id: String { rawValue }

    var settingsLabel: String {
        switch self {
        case .chinese:
            return "中文"
        case .english:
            return "English"
        }
    }
}

final class AppLanguageStore {
    static let storageKey = "mindanchor.app.language"

    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    func load() -> AppLanguage {
        guard let rawValue = userDefaults.string(forKey: Self.storageKey),
              let language = AppLanguage(rawValue: rawValue) else {
            return .chinese
        }
        return language
    }

    func save(_ language: AppLanguage) {
        userDefaults.set(language.rawValue, forKey: Self.storageKey)
    }
}

struct AppLocalization {
    let language: AppLanguage

    var notAvailable: String {
        switch language {
        case .chinese:
            return "不可用"
        case .english:
            return "Not available"
        }
    }

    var none: String {
        switch language {
        case .chinese:
            return "无"
        case .english:
            return "None"
        }
    }

    var retry: String {
        switch language {
        case .chinese:
            return "重试"
        case .english:
            return "Retry"
        }
    }

    var sync: String {
        switch language {
        case .chinese:
            return "同步"
        case .english:
            return "Sync"
        }
    }

    var syncNow: String {
        switch language {
        case .chinese:
            return "立即同步"
        case .english:
            return "Sync Now"
        }
    }

    var signedIn: String {
        switch language {
        case .chinese:
            return "已登录"
        case .english:
            return "Signed In"
        }
    }

    var signedOut: String {
        switch language {
        case .chinese:
            return "未登录"
        case .english:
            return "Signed Out"
        }
    }

    func destinationTitle(_ destination: AppDestination) -> String {
        switch (language, destination) {
        case (.chinese, .today): return "今天"
        case (.chinese, .coach): return "Coach"
        case (.chinese, .goals): return "目标 / 任务"
        case (.chinese, .state): return "状态"
        case (.chinese, .reflections): return "复盘"
        case (.chinese, .reminders): return "提醒"
        case (.chinese, .settings): return "设置"
        case (.english, .today): return "Today"
        case (.english, .coach): return "Coach"
        case (.english, .goals): return "Goals / Tasks"
        case (.english, .state): return "State"
        case (.english, .reflections): return "Reflections"
        case (.english, .reminders): return "Reminders"
        case (.english, .settings): return "Settings"
        }
    }

    func bootstrapStatusTitle(_ state: AppBootstrapState) -> String {
        switch (language, state) {
        case (.chinese, .signedOut): return "需要登录"
        case (.chinese, .authenticating): return "正在登录"
        case (.chinese, .loadingWorkspace): return "正在载入工作台"
        case (.chinese, .degraded): return "已连接，但数据受限"
        case (.chinese, .ready): return "MindAnchor 已就绪"
        case (.english, .signedOut): return "Sign in required"
        case (.english, .authenticating): return "Signing in"
        case (.english, .loadingWorkspace): return "Loading your workspace"
        case (.english, .degraded): return "Connected with limited data"
        case (.english, .ready): return "MindAnchor is ready"
        }
    }

    func bootstrapStatusMessage(_ state: AppBootstrapState, currentError: String?) -> String {
        switch state {
        case .signedOut:
            switch language {
            case .chinese:
                return "登录后即可开始同步桌面活动、提醒和恢复建议。"
            case .english:
                return "Sign in to start syncing desktop activity, reminders, and recovery suggestions."
            }
        case .authenticating:
            switch language {
            case .chinese:
                return "MindAnchor 正在建立你的账户会话。"
            case .english:
                return "MindAnchor is establishing your account session."
            }
        case .loadingWorkspace:
            switch language {
            case .chinese:
                return "MindAnchor 正在加载你的 dashboard、提醒和恢复上下文。"
            case .english:
                return "MindAnchor is loading your dashboard, reminders, and recovery context."
            }
        case .degraded:
            switch language {
            case .chinese:
                if let currentError, !currentError.isEmpty {
                    return "MindAnchor 已登录，但部分工作台数据暂时无法加载。\(userFacingErrorMessage(currentError))"
                }
                return "MindAnchor 已登录，但部分工作台数据暂时无法加载。"
            case .english:
                if let currentError, !currentError.isEmpty {
                    return "MindAnchor signed in, but some workspace data could not be loaded. \(userFacingErrorMessage(currentError))"
                }
                return "MindAnchor signed in, but some workspace data could not be loaded."
            }
        case .ready:
            switch language {
            case .chinese:
                return "桌面活动、提醒和恢复建议已可用。"
            case .english:
                return "Desktop activity, reminders, and recovery suggestions are available."
            }
        }
    }

    func userFacingErrorMessage(_ error: String) -> String {
        let lower = error.lowercased()

        if lower.contains("gateway unreachable") || lower.contains("could not connect") || lower.contains("timed out") || lower.contains("nsurlerrordomain") {
            switch language {
            case .chinese:
                return "Gateway 当前不可达。请确认 Gateway 已启动、网络可访问，然后重试同步。"
            case .english:
                return "Gateway is currently unreachable. Confirm the Gateway is running and reachable, then retry sync."
            }
        }

        if lower.contains("openclaw") || lower.contains("registry unreachable") || lower.contains("registry unavailable") {
            switch language {
            case .chinese:
                return "OpenClaw 当前不可达。请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接。"
            case .english:
                return "OpenClaw is currently unreachable. Check the OpenClaw runtime / Registry, then refresh the connection."
            }
        }

        if lower.contains("401") || lower.contains("unauthorized") || lower.contains("authentication required") || lower.contains("forbidden") || lower.contains("token") || lower.contains("session expired") {
            switch language {
            case .chinese:
                return "当前登录已失效。请重新登录后再继续同步、提醒和 Coach。"
            case .english:
                return "Your sign-in session is no longer valid. Sign in again to resume sync, reminders, and Coach."
            }
        }

        return error
    }

    func pendingReminderSummary(count: Int) -> String {
        switch language {
        case .chinese:
            switch count {
            case 0: return "当前没有待处理提醒。"
            case 1: return "有 1 条待处理提醒需要查看。"
            default: return "有 \(count) 条待处理提醒需要查看。"
            }
        case .english:
            switch count {
            case 0: return "No pending reminders."
            case 1: return "1 pending reminder needs review."
            default: return "\(count) pending reminders need review."
            }
        }
    }

    func pendingBadgeText(count: Int) -> String {
        switch language {
        case .chinese:
            return count > 0 ? "\(count) 条待处理" : "提醒已清空"
        case .english:
            return count > 0 ? "\(count) Pending" : "Reminders clear"
        }
    }

    var healthy: String {
        language == .chinese ? "健康" : "Healthy"
    }

    var needsAttention: String {
        language == .chinese ? "需处理" : "Needs attention"
    }

    func queueCount(_ count: Int) -> String {
        switch language {
        case .chinese:
            return "队列 \(count)"
        case .english:
            return "Queue \(count)"
        }
    }

    var noSuggestedActionYet: String {
        switch language {
        case .chinese:
            return "暂时没有建议动作。"
        case .english:
            return "No suggested action yet."
        }
    }

    func coachVisibleSummaryFallback(personaName: String) -> String {
        switch language {
        case .chinese:
            return "\(personaName) 正在处理当前这一轮。"
        case .english:
            return "\(personaName) is handling the current turn."
        }
    }

    func coachRoutingModeTitle(manualOverride: Bool) -> String {
        switch (language, manualOverride) {
        case (.chinese, true): return "手动接管"
        case (.chinese, false): return "自动路由"
        case (.english, true): return "Manual override"
        case (.english, false): return "Auto routing"
        }
    }

    func coachRoutingModeBadge(manualOverride: Bool) -> String {
        switch (language, manualOverride) {
        case (.chinese, true): return "手动"
        case (.chinese, false): return "自动"
        case (.english, true): return "Manual"
        case (.english, false): return "Auto"
        }
    }

    func coachConsultedSummary(agentName: String, visibleSummary: String) -> String {
        switch language {
        case .chinese:
            return "已咨询 \(agentName) · \(visibleSummary)"
        case .english:
            return "Consulted \(agentName) · \(visibleSummary)"
        }
    }

    func coachRoutingModeDescription(manualOverride: Bool) -> String {
        switch (language, manualOverride) {
        case (.chinese, true):
            return "你当前锁定了前台人格，系统不会无提示换人。"
        case (.chinese, false):
            return "由 Picard 自动判断当前最合适的前台人格。"
        case (.english, true):
            return "You pinned the current front persona, so the system will not switch speakers silently."
        case (.english, false):
            return "Picard automatically decides which front persona should lead right now."
        }
    }

    func coachPersonaRoleSummary(agentID: String?) -> String {
        let resolvedAgentID = agentID ?? "director-agent"
        switch (language, resolvedAgentID) {
        case (.chinese, "director-agent"):
            return "负责调度整个团队，并定义下一步行动框架。"
        case (.chinese, "companion-agent"):
            return "负责情绪陪伴、共情和上下文收集。"
        case (.chinese, "analyst-agent"):
            return "负责理性分析、结构化判断与清晰结论。"
        case (.chinese, "balance-agent"):
            return "负责现实节奏、情绪平衡和稳步推进。"
        case (.chinese, "life-secretary-agent"):
            return "负责计划、排程和执行层面的实际调整。"
        case (.chinese, "memory-governor-agent"):
            return "负责长期记忆治理与召回边界。"
        default:
            return CoachPersonaCatalog.roleSummary(for: resolvedAgentID)
        }
    }

    var coachAuthorityContractLines: [String] {
        switch language {
        case .chinese:
            return [
                "Jarvis 负责改动计划。",
                "Data 负责长期记忆治理。",
            ]
        case .english:
            return [
                "Jarvis changes plans.",
                "Data manages long-term memory.",
            ]
        }
    }

    func coachProposalMetadata(_ proposal: JarvisProposalPayload) -> [String] {
        switch language {
        case .chinese:
            return [
                "风险：\(proposal.riskLevel.capitalized)",
                "变更前：\(proposal.beforeStateSummary)",
                "变更后：\(proposal.afterStateSummary)",
                "理由：\(proposal.rationale)",
                "创建时间：\(proposal.createdAt)",
            ]
        case .english:
            return [
                "Risk: \(proposal.riskLevel.capitalized)",
                "Before: \(proposal.beforeStateSummary)",
                "After: \(proposal.afterStateSummary)",
                "Rationale: \(proposal.rationale)",
                "Created: \(proposal.createdAt)",
            ]
        }
    }

    func coachSystemStatusTitle(for error: String) -> String? {
        let lower = error.lowercased()
        if lower.contains("jarvis unavailable") {
            return language == .chinese ? "Jarvis 当前不可用" : "Jarvis unavailable"
        }
        if lower.contains("data unavailable") {
            return language == .chinese ? "Data 当前不可用" : "Data unavailable"
        }
        if lower.contains("support agent unavailable") || lower.contains("consult unavailable") {
            return language == .chinese ? "支持 agent 当前不可用" : "Support agent unavailable"
        }
        if lower.contains("timeout") {
            return language == .chinese ? "Agent 超时" : "Agent timeout"
        }
        return nil
    }

    func coachSystemStatusMessage(for error: String) -> String? {
        let lower = error.lowercased()
        if lower.contains("jarvis unavailable") {
            return language == .chinese
                ? "Jarvis 当前不可用，因此没有执行任何计划改动。"
                : "Jarvis is unavailable right now, so no plan changes were applied."
        }
        if lower.contains("data unavailable") {
            return language == .chinese
                ? "Data 当前不可用，因此长期记忆保持不变。"
                : "Data is unavailable right now, so long-term memory was left unchanged."
        }
        if lower.contains("support agent unavailable") || lower.contains("consult unavailable") {
            return language == .chinese
                ? "某个支持 agent 当前不可用，因此 MindAnchor 保持了单一清晰前台人格，并直接说明了最合适的下一步。"
                : "A supporting agent was unavailable, so MindAnchor stayed with one clear front persona and explained the best next step it could."
        }
        if lower.contains("timeout") {
            return language == .chinese
                ? "某个支持 agent 响应超时，因此 MindAnchor 保持了单一清晰前台人格，并明确暴露了回退结果。"
                : "A supporting agent timed out, so MindAnchor kept one clear front persona and did not hide the fallback."
        }
        return nil
    }

    func coachHandoffReasonTitle(_ reason: String) -> String {
        switch reason {
        case "plan_write_requires_jarvis":
            return language == .chinese ? "计划写入必须由 Jarvis 处理" : "Plan writes require Jarvis"
        case "memory_governance_requires_data":
            return language == .chinese ? "记忆治理必须由 Data 处理" : "Memory governance requires Data"
        default:
            return reason
                .split(separator: "_")
                .map { $0.capitalized }
                .joined(separator: " ")
        }
    }

    func supportExportStatusTitle(hasExport: Bool) -> String {
        switch (language, hasExport) {
        case (.chinese, false): return "尚未导出诊断包"
        case (.chinese, true): return "诊断包已准备好"
        case (.english, false): return "Diagnostics export not created"
        case (.english, true): return "Diagnostics export ready"
        }
    }

    func supportExportStatusMessage(path: String?, exportedAt: String?) -> String {
        guard let path else {
            return language == .chinese
                ? "在提交支持说明或迁移到另一台 Mac 前，先导出一份本地诊断快照。"
                : "Export a local snapshot before filing support notes or moving to another Mac."
        }

        let fileName = URL(fileURLWithPath: path).lastPathComponent
        let exportedAt = exportedAt ?? notAvailable
        switch language {
        case .chinese:
            return "\(fileName) 已导出，时间：\(exportedAt)。"
        case .english:
            return "\(fileName) exported at \(exportedAt)."
        }
    }

    func desktopCollectionStatusTitle(collectorEnabled: Bool, accessibilityGranted: Bool) -> String {
        if !collectorEnabled {
            return language == .chinese ? "桌面采集已关闭" : "Desktop collection off"
        }
        switch language {
        case .chinese:
            return accessibilityGranted ? "桌面采集中" : "桌面采集为基础模式"
        case .english:
            return accessibilityGranted ? "Desktop collection active" : "Desktop collection in basic mode"
        }
    }

    func desktopCollectionStatusDetail(collectorEnabled: Bool, accessibilityGranted: Bool) -> String {
        if !collectorEnabled {
            return language == .chinese
                ? "当前构建关闭了桌面信号采集。登录、同步和提醒功能仍可使用。"
                : "Desktop signal collection is disabled in this build configuration. Login, sync, and reminders can still work."
        }
        switch language {
        case .chinese:
            return accessibilityGranted
                ? "idle、lock/unlock 和 app-switch 信号已可用。"
                : "idle、lock/unlock 和 app-switch 信号仍可继续；依赖 Accessibility 的窗口上下文需授权后才可用。"
        case .english:
            return accessibilityGranted
                ? "Idle, lock/unlock, and app-switch signals are available."
                : "Idle, lock/unlock, and app-switch signals continue. Accessibility-only window context is unavailable until permission is granted."
        }
    }

    func notificationPermissionHelpText(_ state: NotificationAuthorizationState) -> String {
        switch (language, state) {
        case (.chinese, .allowed):
            return "通知可通过 macOS Notification Center 正常送达。"
        case (.chinese, .denied):
            return "通知已在 macOS 设置中被禁用；提醒仍会在 MindAnchor 内显示。"
        case (.chinese, .notRequested):
            return "通知权限尚未授予；MindAnchor 仍可继续同步并在应用内显示提醒。"
        case (.chinese, .checking):
            return "MindAnchor 正在检查当前通知权限状态。"
        case (.chinese, .unknown):
            return "MindAnchor 暂时无法判断当前通知权限状态。"
        case (.english, .allowed):
            return "Notifications can be delivered through macOS Notification Center."
        case (.english, .denied):
            return "Notifications are blocked in macOS settings. Reminders still appear inside MindAnchor."
        case (.english, .notRequested):
            return "Notifications have not been granted yet. MindAnchor can still sync and show reminders in-app."
        case (.english, .checking):
            return "MindAnchor is checking the current notification permission state."
        case (.english, .unknown):
            return "MindAnchor could not determine the current notification permission state."
        }
    }

    func connectionStatusTitle(isSignedIn: Bool, currentError: String?, queueLength: Int, lastHeartbeatAt: Date?) -> String {
        if let currentError, !currentError.isEmpty {
            return language == .chinese ? "同步需要处理" : "Sync needs attention"
        }
        if queueLength > 0 {
            return language == .chinese ? "等待同步" : "Pending sync"
        }
        if !isSignedIn {
            return language == .chinese ? "未连接" : "Not connected"
        }
        if lastHeartbeatAt == nil {
            return language == .chinese ? "连接中" : "Connecting"
        }
        return language == .chinese ? "已连接" : "Connected"
    }

    func connectionStatusDetail(isSignedIn: Bool, currentError: String?, queueLength: Int, lastHeartbeatAt: Date?) -> String {
        if let currentError, !currentError.isEmpty {
            return userFacingErrorMessage(currentError)
        }
        if queueLength > 0 {
            return language == .chinese
                ? "MindAnchor 当前有排队中的桌面信号，等待下一次成功上传。"
                : "MindAnchor has queued desktop signals waiting for the next successful upload."
        }
        if !isSignedIn {
            return language == .chinese
                ? "登录后即可开始同步桌面活动和提醒。"
                : "Sign in to start syncing desktop activity and reminders."
        }
        if lastHeartbeatAt == nil {
            return language == .chinese
                ? "MindAnchor 正在建立第一次设备心跳。"
                : "MindAnchor is establishing the first device heartbeat."
        }
        return language == .chinese
            ? "MindAnchor 已连接到 Gateway，当前没有排队中的桌面事件。"
            : "MindAnchor is connected to the Gateway and has no queued desktop events."
    }

    func reminderStatusTitle(_ context: ReminderStatusContext?) -> String? {
        switch (language, context) {
        case (.chinese, .refreshFailed):
            return "显示最近一次同步的提醒"
        case (.chinese, .acknowledgeFailed):
            return "提醒操作失败"
        case (.english, .refreshFailed):
            return "Showing last synced reminders"
        case (.english, .acknowledgeFailed):
            return "Reminder action failed"
        case (_, nil):
            return nil
        }
    }

    func reminderStatusMessage(_ context: ReminderStatusContext?) -> String? {
        switch (language, context) {
        case (.chinese, .refreshFailed):
            return "刷新提醒失败。MindAnchor 仍在显示最近一次成功获取的 inbox 快照。"
        case (.chinese, .acknowledgeFailed):
            return "MindAnchor 暂时无法确认这条提醒；它会继续保持待处理状态，方便你稍后重试。"
        case (.english, .refreshFailed):
            return "Reminder refresh failed. MindAnchor is still showing the last successful inbox snapshot."
        case (.english, .acknowledgeFailed):
            return "MindAnchor could not acknowledge this reminder yet. The pending reminder stays visible so you can retry."
        case (_, nil):
            return nil
        }
    }

    func notSignedInAccountEmail() -> String {
        language == .chinese ? "未登录" : "Not signed in"
    }

    func notificationStatusDescription(_ state: NotificationAuthorizationState) -> String {
        switch (language, state) {
        case (.chinese, .checking):
            return "检查中…"
        case (.chinese, .allowed):
            return "通知已允许"
        case (.chinese, .denied):
            return "通知已拒绝"
        case (.chinese, .notRequested):
            return "通知未请求"
        case (.chinese, .unknown):
            return "通知状态未知"
        case (.english, .checking):
            return "Checking…"
        case (.english, .allowed):
            return "Notifications allowed"
        case (.english, .denied):
            return "Notifications denied"
        case (.english, .notRequested):
            return "Notifications not requested"
        case (.english, .unknown):
            return "Notifications status unknown"
        }
    }

    func accessibilityStatus(granted: Bool) -> String {
        switch (language, granted) {
        case (.chinese, true): return "已授予"
        case (.chinese, false): return "未授予"
        case (.english, true): return "Granted"
        case (.english, false): return "Not granted"
        }
    }

    func expectedByGateway(_ expected: Bool) -> String {
        switch (language, expected) {
        case (.chinese, true): return "Gateway 预期启用"
        case (.chinese, false): return "可选"
        case (.english, true): return "Expected by Gateway"
        case (.english, false): return "Optional"
        }
    }

    func recommended(_ recommended: Bool) -> String {
        switch (language, recommended) {
        case (.chinese, true): return "推荐"
        case (.chinese, false): return "非必需"
        case (.english, true): return "Recommended"
        case (.english, false): return "Not required"
        }
    }

    func reminderSnoozedUntil(_ timestamp: String) -> String {
        switch language {
        case .chinese:
            return "已稍后提醒至 \(timestamp)"
        case .english:
            return "Snoozed until \(timestamp)"
        }
    }

    func localizedStatus(_ raw: String) -> String {
        switch (language, raw.lowercased()) {
        case (.chinese, "pending"): return "待处理"
        case (.chinese, "acknowledged"): return "已处理"
        case (.chinese, "active"): return "进行中"
        case (.chinese, "accept_candidate"): return "接受候选"
        case (.chinese, "reject_candidate"): return "拒绝候选"
        case (.chinese, "delete_memory"): return "删除记忆"
        case (.chinese, "task_order"): return "任务重排"
        case (.chinese, "recovery_block"): return "恢复块"
        case (.chinese, "plan_change"): return "计划变更"
        case (.chinese, "proposal"): return "待批准"
        case (.chinese, "approved"): return "已批准"
        case (.chinese, "rejected"): return "已拒绝"
        case (.chinese, "accepted"): return "已接受"
        case (.chinese, "recall_blocked"): return "已禁止召回"
        case (.chinese, "deleted"): return "已删除"
        case (.chinese, "completed"): return "已完成"
        case (.chinese, "failed"): return "失败"
        case (.chinese, "pending_full"), (.chinese, "pending_fast"): return "处理中"
        case (.chinese, "helpful"): return "有帮助"
        case (.chinese, "unhelpful"): return "没帮助"
        case (.chinese, "high"): return "高"
        case (.chinese, "medium"): return "中"
        case (.chinese, "low"): return "低"
        default:
            return raw.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    func coachExecutionTrailTitle() -> String {
        switch language {
        case .chinese: return "执行轨迹"
        case .english: return "Execution Trail"
        }
    }

    func coachMemorySourceLabel(_ raw: String, kind: String, frontAgent: String?) -> String {
        switch frontAgent {
        case "companion-agent":
            switch (language, raw) {
            case (.chinese, "coach-memory"): return "安抚偏好"
            case (.english, "coach-memory"): return "Comfort Preference"
            case (.chinese, "gateway-memory"): return "现实边界"
            case (.english, "gateway-memory"): return "Reality Boundary"
            case (.chinese, "front-agent-state"): return "当前情绪焦点"
            case (.english, "front-agent-state"): return "Emotional Focus"
            default: break
            }
        case "analyst-agent":
            switch (language, raw, kind) {
            case (.chinese, "coach-memory", "habit"), (.chinese, "coach-memory", "work_style"): return "行为习惯"
            case (.english, "coach-memory", "habit"), (.english, "coach-memory", "work_style"): return "Behavior Pattern"
            case (.chinese, "coach-memory", _): return "决策偏好"
            case (.english, "coach-memory", _): return "Decision Preference"
            case (.chinese, "gateway-memory", _): return "现实约束"
            case (.english, "gateway-memory", _): return "Reality Constraint"
            case (.chinese, "front-agent-state", _): return "当前分析焦点"
            case (.english, "front-agent-state", _): return "Analysis Focus"
            default: break
            }
        case "balance-agent":
            switch (language, raw) {
            case (.chinese, "coach-memory"): return "平衡偏好"
            case (.english, "coach-memory"): return "Balance Preference"
            case (.chinese, "gateway-memory"): return "现实边界"
            case (.english, "gateway-memory"): return "Reality Boundary"
            case (.chinese, "front-agent-state"): return "当前平衡焦点"
            case (.english, "front-agent-state"): return "Balance Focus"
            default: break
            }
        case "life-secretary-agent":
            switch (language, raw) {
            case (.chinese, "coach-memory"): return "执行偏好"
            case (.english, "coach-memory"): return "Execution Preference"
            case (.chinese, "gateway-memory"): return "计划约束"
            case (.english, "gateway-memory"): return "Planning Constraint"
            case (.chinese, "front-agent-state"): return "当前计划焦点"
            case (.english, "front-agent-state"): return "Planning Focus"
            default: break
            }
        default:
            break
        }

        switch (language, raw) {
        case (.chinese, "coach-memory"): return "长期偏好"
        case (.english, "coach-memory"): return "Coach Memory"
        case (.chinese, "gateway-memory"): return "现实约束"
        case (.english, "gateway-memory"): return "Gateway Memory"
        case (.chinese, "front-agent-state"): return "当前协调状态"
        case (.english, "front-agent-state"): return "Front Agent State"
        default:
            return localizedStatus(raw)
        }
    }

    func coachExecutionTrailConsult(agentName: String) -> String {
        switch language {
        case .chinese: return "Consult · \(agentName)"
        case .english: return "Consult · \(agentName)"
        }
    }

    func coachExecutionTrailRoute(runtimeSource: String?, primaryRoute: String?, usedOpenClaw: Bool, hadFallback: Bool) -> String? {
        let route = primaryRoute ?? (usedOpenClaw ? "cluster" : nil)
        guard usedOpenClaw || hadFallback || route != nil else { return nil }

        switch language {
        case .chinese:
            if runtimeSource == "original-runtime" {
                return "官方 OpenClaw runtime · \(route ?? "cluster")"
            }
            if usedOpenClaw && hadFallback {
                return "OpenClaw 回退 · \(route ?? "provider-fallback")"
            }
            if usedOpenClaw {
                return "OpenClaw 主路径 · \(route ?? "cluster")"
            }
            return "当前路径 · \(route ?? "unknown")"
        case .english:
            if runtimeSource == "original-runtime" {
                return "Official OpenClaw runtime · \(route ?? "cluster")"
            }
            if usedOpenClaw && hadFallback {
                return "OpenClaw fallback · \(route ?? "provider-fallback")"
            }
            if usedOpenClaw {
                return "OpenClaw primary · \(route ?? "cluster")"
            }
            return "Route · \(route ?? "unknown")"
        }
    }

    func coachExecutionTrailAuthority(agentName: String, target: String?, status: String?) -> String {
        let suffix = [target, status].compactMap { $0 }.joined(separator: " · ")
        switch language {
        case .chinese:
            return suffix.isEmpty ? "Authority · \(agentName)" : "Authority · \(agentName) · \(suffix)"
        case .english:
            return suffix.isEmpty ? "Authority · \(agentName)" : "Authority · \(agentName) · \(suffix)"
        }
    }

    func coachExecutionTrailMemoryRevoked(count: Int) -> String {
        switch language {
        case .chinese: return "Memory revoked · \(count)"
        case .english: return "Memory revoked · \(count)"
        }
    }

    func coachExecutionTrailDegraded(reason: String?) -> String {
        let normalizedReason = reason ?? "fallback"
        switch language {
        case .chinese:
            switch normalizedReason {
            case "cluster_disabled_or_not_used":
                return "Degraded · 当前未走 OpenClaw 主路径"
            case "cluster_fallback":
                return "Degraded · 已回退到备用路径"
            case "generation_failed":
                return "Degraded · 本轮生成失败后已降级"
            default:
                return "Degraded · 本轮为降级结果"
            }
        case .english:
            switch normalizedReason {
            case "cluster_disabled_or_not_used":
                return "Degraded · OpenClaw primary path not used"
            case "cluster_fallback":
                return "Degraded · Fell back to a backup path"
            case "generation_failed":
                return "Degraded · Generation degraded after failure"
            default:
                return "Degraded · This turn used a degraded path"
            }
        }
    }

    var statusBarOpenMindAnchor: String {
        switch language {
        case .chinese:
            return "打开 MindAnchor"
        case .english:
            return "Open MindAnchor"
        }
    }

    func statusBarViewRecentReminders(count: Int) -> String {
        switch language {
        case .chinese:
            return "查看最近提醒 (\(count))"
        case .english:
            return "View Recent Reminders (\(count))"
        }
    }

    var quit: String {
        switch language {
        case .chinese:
            return "退出"
        case .english:
            return "Quit"
        }
    }

    var openMainWindow: String {
        switch language {
        case .chinese:
            return "打开主窗口"
        case .english:
            return "Open Main Window"
        }
    }

    var acknowledge: String {
        switch language {
        case .chinese:
            return "标记已处理"
        case .english:
            return "Acknowledge"
        }
    }

    var snoozeFifteenMinutes: String {
        switch language {
        case .chinese:
            return "稍后提醒 15 分钟"
        case .english:
            return "Snooze 15 Minutes"
        }
    }
}
