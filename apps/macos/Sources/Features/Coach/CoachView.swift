import SwiftUI

struct CoachView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.dashboardSummary == nil && viewModel.coachFrontAgentState == nil && viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在加载 Coach", "Loading coach"),
                message: text("正在获取当前前台人格和路由状态。", "Fetching the current front persona and routing state.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GroupBox(text("当前 Coach", "Current Coach")) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                CoachPersonaBadge(name: viewModel.coachCurrentPersonaName)
                                Spacer()
                                StatusBadge(
                                    text: viewModel.coachRoutingModeTitle,
                                    tone: viewModel.coachIsManualOverrideEnabled ? .warning : .neutral
                                )
                            }
                            Text(viewModel.coachFrontAgentRoleSummary)
                                .font(.subheadline.weight(.medium))
                            Text(viewModel.coachVisibleSummary)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)

                            if let statusTitle = viewModel.coachSystemStatusTitle,
                               let statusMessage = viewModel.coachSystemStatusMessage {
                                DiagnosticCallout(
                                    title: statusTitle,
                                    message: statusMessage,
                                    tone: .warning
                                )
                            }
                        }
                    }

                    GroupBox(text("人格切换器", "Persona Switcher")) {
                        CoachPersonaSwitcherCard(viewModel: viewModel)
                    }

                    if let consultedSummary = viewModel.coachConsultedSummary {
                        GroupBox(text("已咨询上下文", "Consulted Context")) {
                            Text(consultedSummary)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    if let handoffCard = viewModel.coachHandoffCard {
                        GroupBox(text("交接", "Handoff")) {
                            CoachHandoffCardView(card: handoffCard, language: viewModel.appLanguage)
                        }
                    }

                    GroupBox(text("对话 Coach", "Conversation Coach")) {
                        CoachConversationWorkspaceView(viewModel: viewModel)
                    }

                    GroupBox(text("Jarvis 审批", "Jarvis Approvals")) {
                        if viewModel.coachProposals.isEmpty {
                            Text(text("当前没有审批项。", "No approval items right now."))
                                .foregroundStyle(.secondary)
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(viewModel.coachProposals) { proposal in
                                    ReminderSurfaceCard(
                                        title: proposal.summary,
                                        bodyText: proposal.rationale,
                                        metadata: viewModel.coachProposalMetadata(proposal),
                                        statusText: viewModel.l10n.localizedStatus(proposal.status),
                                        statusTone: proposal.status == "proposal" ? .warning : .neutral,
                                        actions: {
                                            if proposal.status == "proposal" {
                                                HStack {
                                                    Button(text("批准", "Approve")) {
                                                        Task { await viewModel.approveCoachProposal(proposal.id) }
                                                    }
                                                    .buttonStyle(.borderedProminent)

                                                    Button(text("拒绝", "Reject")) {
                                                        Task { await viewModel.rejectCoachProposal(proposal.id) }
                                                    }
                                                }
                                            }
                                        }
                                    )
                                    if proposal.id != viewModel.coachProposals.last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                    }

                    GroupBox(text("权限边界", "Authority Boundaries")) {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(Array(viewModel.coachAuthorityContractLines.enumerated()), id: \.offset) { _, line in
                                Text(line)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    GroupBox(text("Data 记忆", "Data Memory")) {
                        if viewModel.coachMemoryItems.isEmpty {
                            Text(text("还没有受治理的记忆项。", "No governed memory items yet."))
                                .foregroundStyle(.secondary)
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(viewModel.coachMemoryItems) { memory in
                                    ReminderSurfaceCard(
                                        title: memory.summary,
                                        bodyText: "\(text("来源", "Source")): \(CoachPersonaCatalog.displayName(for: memory.sourceAgent)) · \(text("轮次", "Turn")): \(memory.sourceTurnRef)",
                                        metadata: [
                                            memory.effectiveAt.map { "\(text("生效时间", "Effective")): \($0)" },
                                            memory.recallBlockedAt.map { "\(text("禁止召回", "Recall blocked")): \($0)" },
                                            memory.deletedAt.map { "\(text("删除时间", "Deleted")): \($0)" },
                                        ].compactMap { $0 },
                                        statusText: viewModel.l10n.localizedStatus(memory.status),
                                        statusTone: memory.status == "accepted" ? .good : .neutral,
                                        actions: {
                                            if let memoryID = memory.memoryId, memory.deletedAt == nil {
                                                HStack {
                                                    if memory.recallBlockedAt == nil {
                                                        Button(text("禁止召回", "Recall Block")) {
                                                            Task { await viewModel.blockCoachMemoryRecall(memoryID) }
                                                        }
                                                    }
                                                    Button(text("删除", "Delete")) {
                                                        Task { await viewModel.deleteCoachMemory(memoryID) }
                                                    }
                                                }
                                            }
                                        }
                                    )
                                    if memory.id != viewModel.coachMemoryItems.last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(24)
            }
            .task(id: viewModel.isSignedIn) {
                if viewModel.isSignedIn {
                    await viewModel.refreshCoachConversation()
                }
            }
        }
    }
}
