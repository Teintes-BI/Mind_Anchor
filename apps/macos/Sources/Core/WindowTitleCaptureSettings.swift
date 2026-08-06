import Foundation

final class WindowTitleCaptureSettingsStore {
    static let key = "mindanchor.desktop.recordWindowTitles"

    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    func load() -> Bool {
        userDefaults.bool(forKey: Self.key)
    }

    func save(_ enabled: Bool) {
        userDefaults.set(enabled, forKey: Self.key)
    }
}
