import SwiftUI

struct CoachPersonaBadge: View {
    let name: String

    var body: some View {
        Label(name, systemImage: "person.crop.circle.badge.checkmark")
            .font(.headline)
    }
}

struct CoachPersonaSwitcherCard: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Toggle(
                text("手动接管", "Manual override"),
                isOn: Binding(
                    get: { viewModel.coachIsManualOverrideEnabled },
                    set: { newValue in
                        Task { await viewModel.setCoachManualOverride(newValue) }
                    }
                )
            )

            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(CoachPersonaCatalog.visibleFrontRows(maxColumns: 4).enumerated()), id: \.offset) { _, row in
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(row) { option in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(option.displayName)
                                        .font(.headline)
                                    Spacer()
                                    if option.agentID == viewModel.coachSelectedPersonaID {
                                        StatusBadge(text: text("当前", "Current"), tone: .good)
                                    }
                                }
                                Text(viewModel.coachPersonaRoleSummary(for: option.agentID))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Button(option.agentID == viewModel.coachSelectedPersonaID ? text("已选中", "Selected") : text("切到这里", "Switch Here")) {
                                    Task { await viewModel.selectCoachPersona(option.agentID) }
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.secondary.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }

                        if row.count < 4 {
                            ForEach(0..<(4 - row.count), id: \.self) { _ in
                                Spacer()
                                    .frame(maxWidth: .infinity)
                            }
                        }
                    }
                }
            }
        }
    }
}

struct CoachHandoffCardView: View {
    let card: CoachHandoffCardState
    let language: AppLanguage

    private func text(_ chinese: String, _ english: String) -> String {
        language == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                StatusBadge(text: text("交接", "Handoff"), tone: .warning)
                Spacer()
            }
            InfoRow(label: text("来自", "From"), value: card.sourceDisplayName, emphasize: true)
            InfoRow(label: text("原因", "Reason"), value: card.reasonTitle)
            InfoRow(label: text("下一位发言者", "Next Speaker"), value: card.nextDisplayName)
            Text(card.reasonDescription)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .background(Color.orange.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
