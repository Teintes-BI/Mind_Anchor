import XCTest
@testable import MindAnchorCore

@MainActor
final class WindowCoordinatorTests: XCTestCase {
    func testWindowShouldCloseHidesInsteadOfDestroyingWindow() {
        let coordinator = WindowCoordinator()
        let window = MockWindow()

        coordinator.register(window: window)
        window.showWindow()

        let shouldClose = coordinator.hide(window: window)

        XCTAssertFalse(shouldClose)
        XCTAssertFalse(window.isVisible)
    }

    func testShowMainWindowRestoresTrackedWindow() {
        let coordinator = WindowCoordinator()
        let window = MockWindow()

        coordinator.register(window: window)
        _ = coordinator.hide(window: window)
        coordinator.showMainWindow(activateApp: false)

        XCTAssertTrue(window.isVisible)
    }
}

@MainActor
private final class MockWindow: WindowManagingObject {
    private(set) var isVisible = false

    func hideWindow() {
        isVisible = false
    }

    func showWindow() {
        isVisible = true
    }
}
