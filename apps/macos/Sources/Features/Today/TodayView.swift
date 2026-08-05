import SwiftUI

struct TodayView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    private var registryTone: StatusBadge.Tone {
        switch viewModel.openClawRegistryStatusTone {
        case .neutral: return .neutral
        case .good: return .good
        case .warning: return .warning
        case .danger: return .danger
        }
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在同步工作台", "Syncing your workspace"),
                message: text("正在获取今天摘要、提醒和恢复建议。", "Fetching today summary, reminders, and recovery suggestions.")
            )
        } else if let error = viewModel.currentError, viewModel.dashboardSummary == nil {
            ErrorStateView(
                title: text("无法加载今天页", "Unable to load Today"),
                message: viewModel.userFacingCurrentErrorMessage ?? error,
                retryTitle: viewModel.l10n.retry,
                retry: { Task { await viewModel.syncNow() } }
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GroupBox(text("运行摘要", "Operational Summary")) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(viewModel.todayOperationalHeadline)
                                .font(.title3.weight(.semibold))
                            Text(viewModel.todaySuggestedActionSummary)
                                .foregroundStyle(.secondary)
                            HStack {
                                StatusBadge(text: viewModel.connectionStatusTitle, tone: viewModel.currentError == nil ? .good : .warning)
                                StatusBadge(
                                    text: viewModel.pendingReminderBadgeText,
                                    tone: viewModel.pendingReminderCount > 0 ? .warning : .neutral
                                )
                            }
                            InfoRow(label: text("下一步", "Next Step"), value: viewModel.todaySuggestedActionSummary)
                            InfoRow(label: text("提醒", "Reminders"), value: viewModel.todayReminderSummary)
                            if let reminderStatusTitle = viewModel.reminderStatusTitle,
                               let reminderStatusMessage = viewModel.reminderStatusMessage {
                                DiagnosticCallout(
                                    title: reminderStatusTitle,
                                    message: reminderStatusMessage,
                                    tone: .warning
                                )
                            }
                        }
                    }

                    if let situation = viewModel.wayfinderSituation {
                        GroupBox(text("Wayfinder 情境", "Wayfinder Situation")) {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: viewModel.hasActiveWayfinderSituation ? "scope" : "checkmark.circle")
                                    .font(.title2)
                                    .foregroundStyle(viewModel.hasActiveWayfinderSituation ? .orange : .secondary)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(situation.summary)
                                        .font(.headline)
                                        .lineLimit(2)
                                    Text(situation.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Button(text("打开 Wayfinder", "Open Wayfinder")) {
                                    viewModel.focus(destination: .wayfinder)
                                }
                                .buttonStyle(.borderedProminent)
                            }
                        }
                    }

                    GroupBox(text("连接", "Connection")) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                StatusBadge(
                                    text: viewModel.runtimeStatus.lastErrorMessage == nil ? viewModel.l10n.healthy : viewModel.l10n.needsAttention,
                                    tone: viewModel.runtimeStatus.lastErrorMessage == nil ? .good : .warning
                                )
                                StatusBadge(
                                    text: viewModel.l10n.queueCount(viewModel.runtimeStatus.queueLength),
                                    tone: viewModel.runtimeStatus.queueLength == 0 ? .neutral : .warning
                                )
                            }
                            InfoRow(label: text("账户", "Account"), value: viewModel.accountEmail, emphasize: true)
                            InfoRow(label: "API", value: viewModel.configuration.apiBaseURL.absoluteString)
                            InfoRow(label: text("最近同步", "Last Sync"), value: MindAnchorFormatters.timestamp(viewModel.runtimeStatus.lastSyncAt, language: viewModel.appLanguage))
                            InfoRow(label: text("最近心跳", "Last Heartbeat"), value: MindAnchorFormatters.timestamp(viewModel.runtimeStatus.lastHeartbeatAt, language: viewModel.appLanguage))
                            InfoRow(label: text("最近错误", "Last Error"), value: viewModel.runtimeStatus.lastErrorMessage ?? viewModel.l10n.none)
                            InfoRow(label: text("连接状态", "Connection"), value: viewModel.connectionStatusTitle)
                            InfoRow(label: text("连接详情", "Connection Detail"), value: viewModel.connectionStatusDetail)
                            DiagnosticCallout(
                                title: viewModel.bootstrapStatusTitle,
                                message: viewModel.bootstrapStatusMessage,
                                tone: viewModel.bootstrapState == .degraded ? .warning : .neutral
                            )
                            if viewModel.shouldShowOpenClawRegistryCallout {
                                DiagnosticCallout(
                                    title: viewModel.openClawRegistryStatusTitle,
                                    message: viewModel.openClawRegistryStatusMessage,
                                    tone: registryTone
                                )
                                InfoRow(
                                    label: text("Registry 问题", "Registry Issues"),
                                    value: viewModel.openClawRegistryIssueSummary
                                )
                                InfoRow(
                                    label: text("Registry 原因", "Registry Reasons"),
                                    value: viewModel.openClawRegistryReasonSummary
                                )
                            }
                        }
                    }

                    GroupBox(text("权限与采集", "Permissions & Collection")) {
                        VStack(alignment: .leading, spacing: 10) {
                            InfoRow(label: text("通知", "Notifications"), value: viewModel.localizedNotificationStatusDescription)
                            InfoRow(label: text("通知说明", "Notification Guidance"), value: viewModel.notificationPermissionHelpText)
                            InfoRow(label: text("桌面采集", "Desktop Collection"), value: viewModel.desktopCollectionStatusTitle)
                            InfoRow(label: text("采集详情", "Collection Detail"), value: viewModel.desktopCollectionStatusDetail)
                        }
                    }

                    GroupBox(text("今日状态", "Today")) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(viewModel.todayOperationalHeadline)
                                .font(.title3.weight(.semibold))
                            Text(viewModel.todaySuggestedActionSummary)
                                .foregroundStyle(.secondary)

                            Divider()

                            InfoRow(
                                label: text("恢复", "Recovery"),
                                value: viewModel.dashboardSummary?.latestRecoveryPlan?.nextStep ?? text("暂时没有恢复计划。", "No recovery plan yet.")
                            )
                            InfoRow(
                                label: text("行为结论", "Behavior"),
                                value: viewModel.dashboardSummary?.latestBehaviorConclusion?.summary ?? text("暂时没有行为结论。", "No behavior conclusion yet.")
                            )
                            InfoRow(
                                label: text("建议动作", "Suggested Action"),
                                value: viewModel.dashboardSummary?.latestBehaviorConclusion?.suggestedAction ?? text("暂时没有建议。", "No suggestion yet.")
                            )
                        }
                    }

                    GroupBox(text("最近活动", "Recent Activity")) {
                        VStack(alignment: .leading, spacing: 8) {
                            InfoRow(label: text("前台 App", "Frontmost App"), value: viewModel.runtimeStatus.lastFrontmostApp.isEmpty ? text("不可用", "Unavailable") : viewModel.runtimeStatus.lastFrontmostApp)
                            InfoRow(label: text("窗口切换", "Window Switches"), value: "\(viewModel.collectorStatus.windowSwitchCount)")
                            InfoRow(label: text("闲置事件", "Idle Events"), value: "\(viewModel.collectorStatus.idleCount)")
                            InfoRow(label: text("最近闲置秒数", "Last Idle Seconds"), value: "\(viewModel.runtimeStatus.lastIdleSeconds)")
                            InfoRow(label: text("锁屏 / 解锁", "Locks / Unlocks"), value: "\(viewModel.collectorStatus.lockCount) / \(viewModel.collectorStatus.unlockCount)")
                        }
                    }

                    GroupBox(text("最近提醒", "Recent Reminders")) {
                        if viewModel.latestMessages.isEmpty {
                            EmptyStateView(
                                title: text("还没有提醒", "No reminders yet"),
                                systemImage: "bell.slash",
                                message: text("来自 Gateway 的新提醒会显示在这里。", "New reminders from Gateway will appear here.")
                            )
                            .frame(height: 180)
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(viewModel.latestMessages.prefix(5)) { message in
                                    VStack(alignment: .leading, spacing: 6) {
                                        HStack {
                                            Text(message.title)
                                                .font(.headline)
                                            Spacer()
                                            StatusBadge(
                                                text: viewModel.l10n.localizedStatus(message.status),
                                                tone: message.status == "pending" ? .warning : .neutral
                                            )
                                        }
                                        Text(message.message)
                                            .foregroundStyle(.secondary)
                                        Text(message.createdAt)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    if message.id != viewModel.latestMessages.prefix(5).last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                    }

                    GroupBox(text("手动 Check-In", "Manual Check-In")) {
                        ManualCheckInForm(viewModel: viewModel)
                    }
                }
                .padding(24)
            }
        }
    }
}

private struct ManualCheckInForm: View {
    @ObservedObject var viewModel: AppViewModel
    @State private var focusScore = 60.0
    @State private var energyScore = 60.0
    @State private var moodScore = 60.0
    @State private var note = ""

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            LabeledContent(text("专注", "Focus")) {
                Slider(value: $focusScore, in: 0...100)
                    .frame(width: 220)
            }
            LabeledContent(text("精力", "Energy")) {
                Slider(value: $energyScore, in: 0...100)
                    .frame(width: 220)
            }
            LabeledContent(text("情绪", "Mood")) {
                Slider(value: $moodScore, in: 0...100)
                    .frame(width: 220)
            }
            TextField(text("可选备注", "Optional note"), text: $note)
            Button(text("提交 Check-In", "Submit Check-In")) {
                Task {
                    await viewModel.submitCheckIn(
                        focus: Int(focusScore.rounded()),
                        energy: Int(energyScore.rounded()),
                        mood: Int(moodScore.rounded()),
                        note: note
                    )
                    note = ""
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.isBusy)
        }
    }
}
