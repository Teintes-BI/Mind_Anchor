import SwiftUI

struct CoachConversationWorkspaceView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(text("OpenClaw 对话 Coach", "OpenClaw Conversation Coach"))
                    .font(.headline)
                Spacer()
                Button(text("新建对话", "New Conversation")) {
                    Task { await viewModel.createCoachConversationSession() }
                }
                Button(text("刷新线程", "Refresh Thread")) {
                    Task { await viewModel.refreshCoachConversationSession() }
                }
            }

            HStack(alignment: .top, spacing: 16) {
                coachSessionList
                    .frame(width: 220)

                VStack(alignment: .leading, spacing: 14) {
                    coachMessageThread
                    coachComposer
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                coachMemoryPanel
                    .frame(width: 260)
            }
        }
    }

    private var coachSessionList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(text("会话", "Sessions"))
                .font(.subheadline.weight(.semibold))

            if viewModel.coachConversationSessions.isEmpty {
                Text(text("还没有对话会话。", "No conversation sessions yet."))
                    .foregroundStyle(.secondary)
            } else {
                ForEach(viewModel.coachConversationSessions) { session in
                    Button {
                        Task { await viewModel.selectCoachConversationSession(session.id) }
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                    Text(session.title)
                                        .font(.subheadline.weight(.medium))
                                        .multilineTextAlignment(.leading)
                                    Spacer()
                                    if session.id == viewModel.coachConversationSelectedSessionID {
                                        StatusBadge(text: text("当前", "Current"), tone: .good)
                                    }
                                }
                            Text(session.updatedAt)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(session.id == viewModel.coachConversationSelectedSessionID ? Color.accentColor.opacity(0.12) : Color.secondary.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var coachMessageThread: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(text("线程", "Thread"))
                .font(.subheadline.weight(.semibold))

            if viewModel.coachConversationMessages.isEmpty {
                EmptyStateView(
                    title: text("还没有消息", "No messages yet"),
                    systemImage: "bubble.left.and.bubble.right",
                    message: text("开始一段对话后，OpenClaw 会先返回一个快速落地回复，再补全更完整的回答。", "Start a conversation and OpenClaw will first return a fast grounding reply, then complete the fuller answer.")
                )
                .frame(height: 220)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(viewModel.coachConversationMessages) { message in
                            CoachConversationMessageCard(
                                message: message,
                                usedMemoryLines: viewModel.coachUsedConversationMemoryDisplayLines(for: message.id),
                                executionTrailLines: viewModel.coachMessageExecutionTrailLines(for: message),
                                feedback: viewModel.coachConversationFeedbackByMessageID[message.id],
                                language: viewModel.appLanguage,
                                onRetry: {
                                    Task { await viewModel.retryCoachConversationMessage(message.id) }
                                },
                                onHelpful: {
                                    Task { await viewModel.submitCoachConversationFeedback(messageID: message.id, label: "helpful") }
                                },
                                onUnhelpful: {
                                    Task { await viewModel.submitCoachConversationFeedback(messageID: message.id, label: "unhelpful") }
                                }
                            )
                        }
                    }
                }
                .frame(minHeight: 260, maxHeight: 520)
            }
        }
    }

    private var coachComposer: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(text("输入区", "Composer"))
                .font(.subheadline.weight(.semibold))
            TextEditor(text: $viewModel.coachConversationDraft)
                .font(.body)
                .frame(minHeight: 92)
                .padding(8)
                .background(Color.secondary.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            HStack {
                if let traceID = viewModel.coachConversationLastTraceID {
                    Text("Trace: \(traceID)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer()
                Button(text("发送", "Send")) {
                    Task { await viewModel.sendCoachConversationMessage() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.coachConversationDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private var coachMemoryPanel: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(text("对话记忆", "Conversation Memory"))
                .font(.subheadline.weight(.semibold))

            if viewModel.coachConversationMemoryItems.isEmpty {
                Text(text("还没有对话记忆。", "No conversation memory yet."))
                    .foregroundStyle(.secondary)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(viewModel.coachConversationMemoryItems) { memory in
                            ReminderSurfaceCard(
                                title: memory.summary,
                                bodyText: memory.sourceExcerpt,
                                metadata: [
                                    "\(text("类型", "Kind")): \(memory.kind)",
                                    "\(text("置信度", "Confidence")): \(Int(memory.confidence * 100))%",
                                    "\(text("状态", "Status")): \(viewModel.l10n.localizedStatus(memory.status))",
                                ],
                                statusText: viewModel.l10n.localizedStatus(memory.status),
                                statusTone: memory.status == "active" ? .good : .neutral,
                                actions: {
                                    if memory.status == "active" {
                                        Button(text("撤销", "Revoke")) {
                                            Task { await viewModel.deleteCoachConversationMemory(memory.id) }
                                        }
                                    }
                                }
                            )
                            if memory.id != viewModel.coachConversationMemoryItems.last?.id {
                                Divider()
                            }
                        }
                    }
                }
                .frame(minHeight: 220, maxHeight: 520)
            }
        }
    }
}

private struct CoachConversationMessageCard: View {
    let message: CoachConversationMessagePayload
    let usedMemoryLines: [String]
    let executionTrailLines: [String]
    let feedback: CoachConversationFeedbackPayload?
    let language: AppLanguage
    let onRetry: () -> Void
    let onHelpful: () -> Void
    let onUnhelpful: () -> Void

    private func text(_ chinese: String, _ english: String) -> String {
        language == .chinese ? chinese : english
    }

    private var primaryResponseText: String? {
        if let fullResponse = message.fullResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fullResponse.isEmpty {
            return fullResponse
        }
        if let fastResponse = message.fastResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fastResponse.isEmpty {
            return fastResponse
        }
        return nil
    }

    private var primaryResponsePhase: String? {
        if let fullResponse = message.fullResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fullResponse.isEmpty {
            return "full"
        }
        if let fastResponse = message.fastResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fastResponse.isEmpty {
            return "fast"
        }
        return nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                StatusBadge(text: roleTitle, tone: roleTone)
                Spacer()
                StatusBadge(text: AppLocalization(language: language).localizedStatus(message.status), tone: statusTone)
            }

            if let userText = message.userText, !userText.isEmpty {
                Text(userText)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let primaryResponseText {
                VStack(alignment: .leading, spacing: 4) {
                    Text(
                        primaryResponsePhase == "full"
                            ? text("完整回复", "Full Response")
                            : text("快速回复（暂时）", "Fast Response (Temporary)")
                    )
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text(primaryResponseText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            } else if message.role == "assistant" && message.status == "pending_full" {
                Text(text("OpenClaw 仍在完成更完整的回复…", "OpenClaw is still finishing the fuller reply…"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if !usedMemoryLines.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(text("本次回复使用的记忆", "Used In This Reply"))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    ForEach(Array(usedMemoryLines.enumerated()), id: \.offset) { _, line in
                        Text("• \(line)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if !executionTrailLines.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(AppLocalization(language: language).coachExecutionTrailTitle())
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    ForEach(Array(executionTrailLines.enumerated()), id: \.offset) { _, line in
                        Text("• \(line)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if message.role == "assistant" {
                HStack {
                    if message.status == "failed" || message.status == "pending_full" {
                        Button(text("重试", "Retry")) { onRetry() }
                    }
                    if let feedback {
                        StatusBadge(text: AppLocalization(language: language).localizedStatus(feedback.label), tone: .good)
                    } else {
                        Button(text("有帮助", "Helpful")) { onHelpful() }
                        Button(text("没帮助", "Unhelpful")) { onUnhelpful() }
                    }
                    Spacer()
                    Text(message.updatedAt)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else {
                Text(message.updatedAt)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(roleBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var roleTitle: String {
        message.role == "assistant" ? "Coach" : text("你", "You")
    }

    private var roleTone: StatusBadge.Tone {
        message.role == "assistant" ? .good : .neutral
    }

    private var statusTone: StatusBadge.Tone {
        switch message.status {
        case "completed":
            return .good
        case "failed":
            return .danger
        case "pending_full", "pending_fast":
            return .warning
        default:
            return .neutral
        }
    }

    private var roleBackground: Color {
        message.role == "assistant" ? Color.blue.opacity(0.08) : Color.secondary.opacity(0.08)
    }
}
