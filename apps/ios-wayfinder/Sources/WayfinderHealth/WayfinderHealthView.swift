import SwiftUI

public struct WayfinderHealthView: View {
    @StateObject private var model = HealthViewModel()

    public init() {}

    public var body: some View {
        NavigationStack {
            List {
                Section("Health summary") {
                    Text(model.status)
                        .accessibilityLabel("Health summary status: \(model.status)")
                    Text("Permission: \(model.permissionStatus)")
                        .font(.subheadline)
                        .accessibilityLabel("Health permission: \(model.permissionStatus)")
                    Text("Last sync: \(model.lastSyncLabel)")
                        .font(.subheadline)
                        .accessibilityLabel("Health sync: \(model.lastSyncLabel)")
                    Button("Request HealthKit access") {
                        Task { await model.requestAuthorization() }
                    }
                    .buttonStyle(.borderedProminent)
                    .accessibilityHint("Requests read-only access to a bounded health summary")
                    Button("Sync last 24 hours") {
                        Task { await model.sync() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(!model.canSync)
                    .accessibilityHint("Reads a bounded summary only after authorization")
                }
                if let summary = model.summary {
                    Section("Latest summary") {
                        HealthMetricRow(title: "Sleep", value: summary.sleepMinutes.map { "\($0) min" })
                        HealthMetricRow(title: "Activity", value: summary.activeMinutes.map { "\($0) min" })
                        HealthMetricRow(title: "Steps", value: summary.steps.map { String($0) })
                        HealthMetricRow(title: "Resting heart rate", value: summary.restingHeartRate.map { "\(Int($0.rounded())) bpm" })
                    }
                }
                Section("Boundary") {
                    Text("Only aggregated sleep, activity, steps, and resting heart rate are shared. Missing data is not treated as inactivity or illness.")
                        .font(.footnote)
                    Text("Upload requires a host-provided health consent reference. This prototype never stores raw HealthKit samples.")
                        .font(.footnote)
                }
            }
            .navigationTitle("MindAnchor")
        }
    }
}

private struct HealthMetricRow: View {
    let title: String
    let value: String?

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(value ?? "Not available")
                .foregroundStyle(value == nil ? .secondary : .primary)
        }
    }
}

public final class HealthViewModel: ObservableObject {
    @Published public private(set) var status = "Health summary is not synced."
    @Published public private(set) var interaction = HealthInteractionState()
    @Published public private(set) var summary: HealthSummaryPayload?

    private let bridge: any HealthSummaryProvider
    private let consentRef: String?

    public init(bridge: any HealthSummaryProvider = HealthKitBridge(), consentRef: String? = nil) {
        self.bridge = bridge
        self.consentRef = consentRef
        if bridge.authorizationState == .unavailable {
            interaction.finishAuthorization(.unavailable)
        }
    }

    public var canSync: Bool { interaction.canSync }

    public var permissionStatus: String {
        switch interaction.authorization {
        case .notRequested: return "Not requested"
        case .requesting: return "Requesting"
        case .requestCompleted: return "Prompt completed; read access may still be unavailable"
        case .authorized: return "Ready"
        case .denied: return "Not granted"
        case .unavailable: return "Unavailable"
        }
    }

    public var syncStatus: String {
        switch interaction.sync {
        case .idle: return "Not synced"
        case .syncing: return "Syncing"
        case .available: return "Available"
        case .missing: return "Missing"
        case .delayed: return "Delayed"
        case .failed: return "Failed"
        }
    }

    public var lastSyncLabel: String {
        guard let lastSyncAt = interaction.lastSyncAt else { return syncStatus }
        return "\(syncStatus) at \(Self.timestampFormatter.string(from: lastSyncAt))"
    }

    @MainActor
    public func requestAuthorization() async {
        interaction.beginAuthorization()
        status = "Requesting HealthKit access..."
        do {
            try await bridge.requestAuthorization()
            interaction.finishAuthorization(bridge.authorizationState)
            switch interaction.authorization {
            case .authorized:
                status = "HealthKit access is ready."
            case .requestCompleted:
                status = "HealthKit prompt completed; read access will be verified during sync."
            default:
                status = "HealthKit is unavailable on this device."
            }
        } catch {
            interaction.finishAuthorization(.denied)
            status = "HealthKit access was not granted."
        }
    }

    @MainActor
    public func sync() async {
        guard interaction.beginSync() else { return }
        status = "Syncing the last 24 hours..."
        let end = Date()
        do {
            let summary = try await bridge.readSummary(
                sourceDevice: "iPhone",
                windowStart: end.addingTimeInterval(-86_400),
                windowEnd: end,
                consentRef: consentRef
            )
            self.summary = summary
            interaction.finishSync(summary.missingness, at: summary.receivedAt)
            status = "Sync status: \(summary.missingness.rawValue)."
        } catch {
            interaction.failSync()
            status = "Health summary sync failed."
        }
    }

    private static let timestampFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withColonSeparatorInTime]
        return formatter
    }()
}
