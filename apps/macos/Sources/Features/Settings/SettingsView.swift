import AppKit
import SwiftUI

struct SettingsView: View {
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
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                GroupBox(text("语言", "Language")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Picker(
                            text("应用语言", "App Language"),
                            selection: Binding(
                                get: { viewModel.appLanguage },
                                set: { viewModel.setAppLanguage($0) }
                            )
                        ) {
                            ForEach(AppLanguage.allCases) { language in
                                Text(language.settingsLabel).tag(language)
                            }
                        }
                        .pickerStyle(.segmented)
                        Text(text("默认中文。MindAnchor、OpenClaw、agent 名和技术专有名词保持英文。", "Chinese is the default. MindAnchor, OpenClaw, agent names, and technical proper nouns stay in English."))
                            .foregroundStyle(.secondary)
                    }
                }

                GroupBox(text("账户", "Account")) {
                    VStack(alignment: .leading, spacing: 10) {
                        if viewModel.isSignedIn {
                            InfoRow(label: "Email", value: viewModel.accountEmail, emphasize: true)
                            InfoRow(label: "User ID", value: viewModel.authSession?.user.id ?? viewModel.l10n.notAvailable)
                            InfoRow(label: text("启动状态", "Bootstrap"), value: viewModel.bootstrapStatusTitle)
                            InfoRow(label: text("状态详情", "Status Detail"), value: viewModel.bootstrapStatusMessage)
                            Button(text("退出登录", "Sign Out")) { viewModel.signOut() }
                        } else {
                            LoginView(viewModel: viewModel)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }

                GroupBox(text("权限", "Permissions")) {
                    VStack(alignment: .leading, spacing: 10) {
                        InfoRow(label: text("通知", "Notifications"), value: viewModel.localizedNotificationStatusDescription)
                        InfoRow(label: text("通知说明", "Notification Guidance"), value: viewModel.notificationPermissionHelpText)
                        InfoRow(
                            label: "Accessibility",
                            value: viewModel.accessibilityStatusDescription
                        )
                        InfoRow(label: text("桌面采集", "Desktop Collection"), value: viewModel.desktopCollectionStatusTitle)
                        InfoRow(label: text("采集详情", "Collection Detail"), value: viewModel.desktopCollectionStatusDetail)
                        InfoRow(
                            label: text("桌面信号建议", "Desktop Signal Recommendation"),
                            value: viewModel.l10n.expectedByGateway(viewModel.permissionsHint?.desktopSignalsExpected == true)
                        )
                        InfoRow(
                            label: text("Accessibility 建议", "Accessibility Recommendation"),
                            value: viewModel.l10n.recommended(viewModel.permissionsHint?.accessibilityRecommended == true)
                        )
                        HStack {
                            Button(text("刷新权限", "Refresh Permissions")) { Task { await viewModel.diagnostics.refresh() } }
                            Button(text("请求通知权限", "Request Notifications")) { Task { await viewModel.diagnostics.requestNotifications() } }
                            Button(text("打开系统设置", "Open System Settings")) {
                                if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security") {
                                    NSWorkspace.shared.open(url)
                                }
                            }
                        }
                    }
                }

                GroupBox(text("设备与连接", "Device & Connection")) {
                    VStack(alignment: .leading, spacing: 10) {
                        InfoRow(label: text("设备名称", "Device Name"), value: viewModel.deviceProfile.label, emphasize: true)
                        InfoRow(label: "Device ID", value: viewModel.deviceProfile.deviceID)
                        InfoRow(label: text("平台", "Platform"), value: viewModel.deviceProfile.platform)
                        InfoRow(label: text("能力", "Capabilities"), value: viewModel.deviceProfile.capabilities.joined(separator: ", "))
                        Divider()
                        InfoRow(label: "API Base URL", value: viewModel.configuration.apiBaseURL.absoluteString)
                        InfoRow(label: text("连接", "Connection"), value: viewModel.connectionStatusTitle)
                        InfoRow(label: text("连接详情", "Connection Detail"), value: viewModel.connectionStatusDetail)
                        InfoRow(label: text("队列深度", "Queue Depth"), value: "\(viewModel.runtimeStatus.queueLength)")
                        InfoRow(label: text("最近同步", "Last Sync"), value: MindAnchorFormatters.timestamp(viewModel.runtimeStatus.lastSyncAt, language: viewModel.appLanguage))
                        InfoRow(label: text("最近心跳", "Last Heartbeat"), value: MindAnchorFormatters.timestamp(viewModel.runtimeStatus.lastHeartbeatAt, language: viewModel.appLanguage))
                        InfoRow(label: text("最近错误", "Last Error"), value: viewModel.runtimeStatus.lastErrorMessage ?? viewModel.l10n.none)
                        Button(text("立即同步", "Sync Now")) {
                            Task { await viewModel.syncNow() }
                        }
                    }
                }

                GroupBox(text("OpenClaw Registry", "OpenClaw Registry")) {
                    VStack(alignment: .leading, spacing: 10) {
                        DiagnosticCallout(
                            title: viewModel.openClawRegistryStatusTitle,
                            message: viewModel.openClawRegistryStatusMessage,
                            tone: registryTone
                        )
                        InfoRow(label: text("本地 persona 数量", "Native Persona Count"), value: "\(viewModel.openClawNativePersonaCount)")
                        InfoRow(label: text("外部实例已配置", "External Runtime Configured"), value: viewModel.l10n.recommended(viewModel.openClawExternalConfigured))
                        InfoRow(label: text("外部实例可达", "External Runtime Reachable"), value: viewModel.l10n.recommended(viewModel.openClawExternalReachable))
                        InfoRow(label: text("外部 Runtime", "External Runtime"), value: viewModel.openClawRuntimeDisplay)
                        InfoRow(label: "OpenClaw Base URL", value: viewModel.openClawExternalBaseURL)
                        InfoRow(label: text("外部 Agent 数量", "External Agent Count"), value: "\(viewModel.openClawExternalAgentCount)")
                        InfoRow(label: text("已对齐 persona", "Matched Personas"), value: "\(viewModel.openClawMatchedAgentCount)")
                        InfoRow(label: text("外部缺失 persona", "Missing In External"), value: viewModel.openClawMissingExternalAgentsSummary)
                        InfoRow(label: text("外部额外 agents", "Unknown External Agents"), value: viewModel.openClawUnknownExternalAgentsSummary)
                        if !viewModel.openClawRegistryContractSummaryLines.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(text("Contract 对照", "Contract Alignment"))
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(.secondary)
                                ForEach(Array(viewModel.openClawRegistryContractSummaryLines.enumerated()), id: \.offset) { _, line in
                                    Text("• \(line)")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                        Button(text("刷新 OpenClaw Registry", "Refresh OpenClaw Registry")) {
                            Task { await viewModel.refreshOpenClawRegistryVisibility() }
                        }
                    }
                }

                GroupBox(text("本地诊断", "Local Diagnostics")) {
                    VStack(alignment: .leading, spacing: 10) {
                        InfoRow(label: text("存储目录", "Storage Directory"), value: viewModel.localDiagnosticsStoragePath)
                        InfoRow(label: text("状态文件", "State File"), value: viewModel.localDiagnosticsStateFilePath)
                        InfoRow(label: text("最近导出", "Last Export"), value: MindAnchorFormatters.timestamp(viewModel.localStore.state.lastDiagnosticsExportAt, language: viewModel.appLanguage))
                        InfoRow(label: text("待处理提醒", "Pending Reminders"), value: "\(viewModel.pendingReminderCount)")
                        InfoRow(label: text("版本", "Version"), value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.1.0")
                    }
                }

                GroupBox(text("支持", "Support")) {
                    VStack(alignment: .leading, spacing: 12) {
                        DiagnosticCallout(
                            title: viewModel.supportExportStatusTitle,
                            message: viewModel.supportExportStatusMessage,
                            tone: viewModel.lastDiagnosticsExportPath == nil ? .neutral : .good
                        )
                        HStack {
                            Button(text("导出诊断快照", "Export Diagnostics Snapshot")) {
                                _ = viewModel.exportDiagnosticsSnapshot()
                            }
                            if let lastDiagnosticsExportPath = viewModel.lastDiagnosticsExportPath {
                                Button(text("在 Finder 中显示", "Reveal in Finder")) {
                                    NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: lastDiagnosticsExportPath)])
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(24)
    }
}
