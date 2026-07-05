import SwiftUI

struct LoadingStateView: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .controlSize(.large)
            Text(title)
                .font(.title3.weight(.semibold))
            Text(message)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(32)
    }
}

struct EmptyStateView: View {
    let title: String
    let systemImage: String
    let message: String

    var body: some View {
        ContentUnavailableView(title, systemImage: systemImage, description: Text(message))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorStateView: View {
    let title: String
    let message: String
    let retryTitle: String
    let retry: () -> Void

    init(
        title: String,
        message: String,
        retryTitle: String = "Try Again",
        retry: @escaping () -> Void
    ) {
        self.title = title
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 28))
                .foregroundStyle(.orange)
            Text(title)
                .font(.title3.weight(.semibold))
            Text(message)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button(retryTitle, action: retry)
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(32)
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    var emphasize: Bool = false

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .multilineTextAlignment(.trailing)
                .font(emphasize ? .body.weight(.semibold) : .body)
        }
    }
}

struct StatusBadge: View {
    enum Tone {
        case neutral
        case good
        case warning
        case danger

        var foregroundStyle: Color {
            switch self {
            case .neutral: return .secondary
            case .good: return Color(red: 0.05, green: 0.45, blue: 0.35)
            case .warning: return Color(red: 0.8, green: 0.45, blue: 0.05)
            case .danger: return Color(red: 0.7, green: 0.15, blue: 0.15)
            }
        }

        var backgroundStyle: Color {
            switch self {
            case .neutral: return Color.secondary.opacity(0.12)
            case .good: return Color.green.opacity(0.14)
            case .warning: return Color.orange.opacity(0.18)
            case .danger: return Color.red.opacity(0.14)
            }
        }
    }

    let text: String
    let tone: Tone

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tone.foregroundStyle)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(tone.backgroundStyle)
            .clipShape(Capsule())
    }
}

struct DiagnosticCallout: View {
    let title: String
    let message: String
    var tone: StatusBadge.Tone = .neutral

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                StatusBadge(text: title, tone: tone)
                Spacer()
            }
            Text(message)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .background(tone.backgroundStyle.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

enum MindAnchorFormatters {
    static func timestamp(_ date: Date?, language: AppLanguage = .english) -> String {
        guard let date else {
            return AppLocalization(language: language).notAvailable
        }
        return date.formatted(date: .abbreviated, time: .shortened)
    }
}
