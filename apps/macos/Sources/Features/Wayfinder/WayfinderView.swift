import SwiftUI

struct WayfinderView: View {
    @ObservedObject var viewModel: AppViewModel

    @State private var eventSummary = ""
    @State private var pendingRiskAction: RiskAction?

    private enum RiskAction: Sendable {
        case confirmSituation
        case chooseOption(WayfinderDecisionOption)
    }

    private var hasGrantedConsent: Bool {
        viewModel.wayfinderConsentGrants.contains { $0.status == .granted }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Wayfinder")
                            .font(.largeTitle.bold())
                        Text("Make one deliberate next choice.")
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button {
                        Task { await viewModel.refreshWayfinder() }
                    } label: {
                        Label("Refresh", systemImage: "arrow.clockwise")
                    }
                    .disabled(viewModel.wayfinderIsRefreshing)
                }

                GroupBox("Capture a situation") {
                    VStack(alignment: .leading, spacing: 12) {
                        TextField("What needs a decision?", text: $eventSummary, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .lineLimit(2...5)
                        HStack {
                            if hasGrantedConsent {
                                Label("Consent is active", systemImage: "checkmark.shield")
                                    .foregroundStyle(.green)
                            } else {
                                Button("Grant consent") {
                                    Task { await viewModel.grantWayfinderConsent() }
                                }
                                .buttonStyle(.bordered)
                                .disabled(viewModel.wayfinderActionInFlight)
                            }
                            Spacer()
                            Button("Capture") {
                                let summary = eventSummary.trimmingCharacters(in: .whitespacesAndNewlines)
                                guard !summary.isEmpty else { return }
                                eventSummary = ""
                                Task { await viewModel.createWayfinderEvent(summary: summary) }
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(!hasGrantedConsent || eventSummary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.wayfinderIsRefreshing || viewModel.wayfinderActionInFlight)
                        }
                    }
                    .padding(.vertical, 4)
                }

                if let response = viewModel.wayfinderFastResponse {
                    GroupBox("Fast response") {
                        Label(response, systemImage: "bolt.fill")
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 4)
                    }
                }

                if let situation = viewModel.wayfinderSituation {
                    situationCard(situation)
                } else {
                    ContentUnavailableView(
                        "No active situation",
                        systemImage: "point.3.connected.trianglepath.dotted",
                        description: Text("Capture a decision when something needs your attention.")
                    )
                    .frame(maxWidth: .infinity)
                }

                if viewModel.wayfinderFullStatus == .pending {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Full response is still pending.")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button("Refresh") {
                            Task { await viewModel.refreshWayfinder() }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding(24)
        }
        .navigationTitle("Wayfinder")
        .task {
            await viewModel.refreshWayfinder()
        }
        .confirmationDialog(
            "Confirm high-risk choice",
            isPresented: Binding(
                get: { pendingRiskAction != nil },
                set: { if !$0 { pendingRiskAction = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Continue", role: .destructive) {
                let action = pendingRiskAction
                pendingRiskAction = nil
                Task {
                    switch action {
                    case .confirmSituation:
                        await viewModel.confirmWayfinderSituation(status: .confirmed)
                    case .chooseOption(let option):
                        await viewModel.recordWayfinderDecision(option: option)
                    case .none:
                        break
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                pendingRiskAction = nil
            }
        } message: {
            Text("This choice has a high or critical risk level and stays reversible only with your explicit approval.")
        }
    }

    @ViewBuilder
    private func situationCard(_ situation: WayfinderSituation) -> some View {
        GroupBox("Current situation") {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(situation.summary)
                            .font(.headline)
                        Text("Status: \(situation.status.rawValue.replacingOccurrences(of: "_", with: " "))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    riskBadge(situation.riskLevel)
                }

                if situation.status == .awaitingConfirmation {
                    HStack {
                        Button("Confirm") {
                            if situation.riskLevel.requiresExplicitConfirmation {
                                pendingRiskAction = .confirmSituation
                            } else {
                                Task { await viewModel.confirmWayfinderSituation(status: .confirmed) }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.wayfinderActionInFlight)
                        Button("Ignore", role: .cancel) {
                            Task { await viewModel.confirmWayfinderSituation(status: .dismissed) }
                        }
                        .disabled(viewModel.wayfinderActionInFlight)
                    }
                }

                if !viewModel.wayfinderOptions.isEmpty {
                    Divider()
                    Text("Options")
                        .font(.subheadline.bold())
                    ForEach(viewModel.wayfinderOptions.filter { $0.status == .proposed }) { option in
                        optionRow(option)
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }

    @ViewBuilder
    private func optionRow(_ option: WayfinderDecisionOption) -> some View {
        Button {
            if option.requiresApproval || option.riskLevel.requiresExplicitConfirmation {
                pendingRiskAction = .chooseOption(option)
            } else {
                Task { await viewModel.recordWayfinderDecision(option: option) }
            }
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(option.action)
                        .font(.body.weight(.medium))
                    Spacer()
                    riskBadge(option.riskLevel)
                }
                Text(option.firstStep)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(option.rationale)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(Color.primary.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
        .disabled(viewModel.wayfinderActionInFlight)
    }

    private func riskBadge(_ risk: WayfinderRiskLevel) -> some View {
        Text(risk.rawValue.capitalized)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(riskColor(risk).opacity(0.16))
            .foregroundStyle(riskColor(risk))
            .clipShape(Capsule())
    }

    private func riskColor(_ risk: WayfinderRiskLevel) -> Color {
        switch risk {
        case .low: return .green
        case .medium: return .orange
        case .high, .critical: return .red
        case .unknown: return .secondary
        }
    }
}
