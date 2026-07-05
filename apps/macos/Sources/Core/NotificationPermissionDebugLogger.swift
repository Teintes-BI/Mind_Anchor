import Foundation
import UserNotifications

final class NotificationPermissionDebugLogger {
    static let environmentKey = "MINDANCHOR_NOTIFICATION_DEBUG_LOG_FILE"

    private let fileURL: URL?
    private let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    init(fileURL: URL?) {
        self.fileURL = fileURL
    }

    convenience init(environment: [String: String] = ProcessInfo.processInfo.environment) {
        if let path = environment[Self.environmentKey], !path.isEmpty {
            self.init(fileURL: URL(fileURLWithPath: path))
        } else {
            self.init(fileURL: nil)
        }
    }

    func log(
        _ message: String,
        context: String? = nil,
        authorizationStatus: UNAuthorizationStatus? = nil,
        granted: Bool? = nil
    ) {
        guard let fileURL else { return }
        let timestamp = isoFormatter.string(from: Date())
        var segments = ["[\(timestamp)]", message]
        if let context, !context.isEmpty {
            segments.append("context=\(context)")
        }
        if let authorizationStatus {
            segments.append("status=\(authorizationStatus.debugName)")
        }
        if let granted {
            segments.append("granted=\(granted)")
        }
        let line = segments.joined(separator: " ") + "\n"

        do {
            let directory = fileURL.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            if FileManager.default.fileExists(atPath: fileURL.path) {
                let handle = try FileHandle(forWritingTo: fileURL)
                defer { try? handle.close() }
                try handle.seekToEnd()
                if let data = line.data(using: .utf8) {
                    try handle.write(contentsOf: data)
                }
            } else {
                try line.write(to: fileURL, atomically: true, encoding: .utf8)
            }
        } catch {
            NSLog("NotificationPermissionDebugLogger write failed: %@", error.localizedDescription)
        }
    }
}

private extension UNAuthorizationStatus {
    var debugName: String {
        switch self {
        case .notDetermined:
            return "notDetermined"
        case .denied:
            return "denied"
        case .authorized:
            return "authorized"
        case .provisional:
            return "provisional"
        case .ephemeral:
            return "ephemeral"
        @unknown default:
            return "unknown"
        }
    }
}
