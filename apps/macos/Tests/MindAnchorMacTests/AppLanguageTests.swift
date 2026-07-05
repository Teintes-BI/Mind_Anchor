import XCTest
@testable import MindAnchorCore

final class AppLanguageTests: XCTestCase {
    func testLanguageStoreDefaultsToChinese() {
        let defaults = makeLanguageDefaults()
        let store = AppLanguageStore(userDefaults: defaults)

        XCTAssertEqual(store.load(), .chinese)
    }

    func testLanguageStorePersistsEnglishSelection() {
        let defaults = makeLanguageDefaults()
        let store = AppLanguageStore(userDefaults: defaults)

        store.save(.english)

        XCTAssertEqual(store.load(), .english)
    }

    func testBootstrapStatusMessageClassifiesGatewayUnreachable() {
        let l10n = AppLocalization(language: .chinese)

        let message = l10n.bootstrapStatusMessage(.degraded, currentError: "Gateway unreachable")

        XCTAssertTrue(message.contains("Gateway"))
        XCTAssertTrue(message.contains("已启动") || message.contains("可达"))
    }

    func testConnectionStatusDetailClassifiesOpenClawUnavailable() {
        let l10n = AppLocalization(language: .chinese)

        let detail = l10n.connectionStatusDetail(
            isSignedIn: true,
            currentError: "OpenClaw Registry unreachable",
            queueLength: 0,
            lastHeartbeatAt: Date()
        )

        XCTAssertTrue(detail.contains("OpenClaw"))
        XCTAssertTrue(detail.contains("Registry") || detail.contains("runtime") || detail.contains("刷新"))
    }

    func testConnectionStatusDetailClassifiesUnauthorizedSession() {
        let l10n = AppLocalization(language: .english)

        let detail = l10n.connectionStatusDetail(
            isSignedIn: true,
            currentError: "Server error 401: Authentication required.",
            queueLength: 0,
            lastHeartbeatAt: Date()
        )

        XCTAssertTrue(detail.localizedCaseInsensitiveContains("sign in"))
        XCTAssertTrue(detail.localizedCaseInsensitiveContains("again") || detail.localizedCaseInsensitiveContains("session"))
    }

    func testUserFacingErrorMessageRewritesGatewayUnreachable() {
        let l10n = AppLocalization(language: .chinese)

        let message = l10n.userFacingErrorMessage("Gateway unreachable")

        XCTAssertNotEqual(message, "Gateway unreachable")
        XCTAssertTrue(message.contains("Gateway"))
    }

    private func makeLanguageDefaults() -> UserDefaults {
        let suiteName = "MindAnchorMacTests.AppLanguage.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }
}
