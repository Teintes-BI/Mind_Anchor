import XCTest
@testable import MindAnchorCore

final class WayfinderAPIClientTests: XCTestCase {
    func testRiskLevelsAboveLowRequireExplicitConfirmation() {
        XCTAssertFalse(WayfinderRiskLevel.low.requiresExplicitConfirmation)
        XCTAssertTrue(WayfinderRiskLevel.medium.requiresExplicitConfirmation)
        XCTAssertTrue(WayfinderRiskLevel.high.requiresExplicitConfirmation)
        XCTAssertTrue(WayfinderRiskLevel.critical.requiresExplicitConfirmation)
        XCTAssertTrue(WayfinderRiskLevel.unknown.requiresExplicitConfirmation)
    }

    func testUnknownWayfinderEnumsDecodeToUnknown() throws {
        let data = """
        {
          "id": "situation-1",
          "userId": "user-1",
          "eventIds": ["event-1"],
          "status": "future_status",
          "summary": "A task was mentioned.",
          "uncertainty": [],
          "linkedGoalIds": [],
          "linkedTaskIds": [],
          "riskLevel": "future_risk",
          "createdAt": "2026-08-05T00:00:00.000Z",
          "updatedAt": "2026-08-05T00:00:00.000Z",
          "traceId": "trace-1"
        }
        """.data(using: .utf8)!

        let situation = try JSONDecoder().decode(WayfinderSituation.self, from: data)

        XCTAssertEqual(situation.status, .unknown)
        XCTAssertEqual(situation.riskLevel, .unknown)
    }

    func testCreateWayfinderEventPostsBearerAndReturnsFastResponse() async throws {
        let protocolMock = WayfinderURLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-wayfinder")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/wayfinder/events")

            let body = try XCTUnwrap(request.httpBody ?? readWayfinderBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["sourceDeviceId"] as? String, "mac-1")
            XCTAssertEqual(decoded["consentRef"] as? String, "consent-1")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Idempotency-Key"), "client-event-1")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "event": {
                    "id": "event-1", "userId": "user-1", "sourceDeviceId": "mac-1", "kind": "manual_note",
                    "occurredAt": "2026-08-05T00:00:00.000Z", "receivedAt": "2026-08-05T00:00:00.000Z",
                    "clientEventId": "client-event-1", "payload": {"summary": "Prepare a proposal"},
                    "confidence": 0.9, "consentRef": "consent-1", "retentionClass": "summary",
                    "evidenceRefs": [], "traceId": "trace-1"
                  },
                  "situation": {
                    "id": "situation-1", "userId": "user-1", "eventIds": ["event-1"], "status": "awaiting_confirmation",
                    "summary": "Prepare a proposal", "uncertainty": [], "linkedGoalIds": [], "linkedTaskIds": [],
                    "riskLevel": "low", "createdAt": "2026-08-05T00:00:00.000Z", "updatedAt": "2026-08-05T00:00:00.000Z", "traceId": "trace-1"
                  },
                  "fastStatus": "completed", "fullStatus": "pending"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(configuration: .testValue, session: makeWayfinderURLSession(protocolType: protocolMock))
        let response = try await client.createWayfinderEvent(
            payload: WayfinderEventInput(
                sourceDeviceId: "mac-1",
                kind: .manualNote,
                occurredAt: "2026-08-05T00:00:00.000Z",
                clientEventId: "client-event-1",
                payload: ["summary": .string("Prepare a proposal")],
                confidence: 0.9,
                consentRef: "consent-1",
                retentionClass: .summary,
                evidenceRefs: [],
                traceId: "trace-1"
            ),
            token: "token-wayfinder"
        )

        XCTAssertEqual(response.event.id, "event-1")
        XCTAssertEqual(response.situation.status, .awaitingConfirmation)
        XCTAssertEqual(response.fullStatus, .pending)
    }

    func testWayfinderOptionsAndConsentEndpointsDecodeWrappers() async throws {
        let protocolMock = WayfinderURLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-options")
            let path = request.url?.path ?? ""
            if path.hasSuffix("/options") {
                return (
                    HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!,
                    """
                    {"situationId":"situation-1","status":"confirmed","options":[],"fullStatus":"pending"}
                    """.data(using: .utf8)!
                )
            }
            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!,
                """
                {"grants":[{"id":"grant-1","userId":"user-1","source":"mac-1","purpose":"wayfinder_context","scope":"voice","status":"granted","rawRetentionSeconds":0,"derivedRetentionDays":30,"modelSharing":"local_only","grantedAt":"2026-08-05T00:00:00.000Z","updatedAt":"2026-08-05T00:00:00.000Z","traceId":"trace-1"}]}
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(configuration: .testValue, session: makeWayfinderURLSession(protocolType: protocolMock))
        let options = try await client.fetchWayfinderOptions("situation-1", token: "token-options")
        let grants = try await client.fetchWayfinderConsent(token: "token-options")

        XCTAssertEqual(options.situationId, "situation-1")
        XCTAssertEqual(options.status, .confirmed)
        XCTAssertEqual(grants.grants.first?.modelSharing, .localOnly)
    }

    func testUnauthorizedWayfinderRequestSurfaces401() async {
        let protocolMock = WayfinderURLProtocolMock.self
        protocolMock.requestHandler = { request in
            (
                HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!,
                Data("Authentication required.".utf8)
            )
        }

        let client = APIClient(configuration: .testValue, session: makeWayfinderURLSession(protocolType: protocolMock))

        do {
            _ = try await client.fetchWayfinderConsent(token: "expired-token")
            XCTFail("Expected a 401 API error")
        } catch let APIClientError.server(statusCode, _) {
            XCTAssertEqual(statusCode, 401)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}

private final class WayfinderURLProtocolMock: URLProtocol {
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.requestHandler else {
            client?.urlProtocol(self, didFailWithError: NSError(domain: "WayfinderURLProtocolMock", code: 1))
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

private func makeWayfinderURLSession(protocolType: URLProtocol.Type) -> URLSession {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [protocolType]
    return URLSession(configuration: configuration)
}

private func readWayfinderBody(from request: URLRequest) -> Data? {
    guard let stream = request.httpBodyStream else { return nil }
    stream.open()
    defer { stream.close() }
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: 4096)
    defer { buffer.deallocate() }
    var data = Data()
    while stream.hasBytesAvailable {
        let count = stream.read(buffer, maxLength: 4096)
        if count <= 0 { break }
        data.append(buffer, count: count)
    }
    return data.isEmpty ? nil : data
}

private extension AppConfiguration {
    static let testValue = AppConfiguration(
        apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
        supabaseURL: nil,
        supabaseAnonKey: nil,
        authDevToken: nil,
        debugAuthBootstrap: nil,
        notificationSnoozeMinutes: 15,
        inboxPollInterval: 30,
        heartbeatInterval: 60,
        idleThresholdSeconds: 120,
        authSessionAccount: "mindanchor-auth-session",
        reminderPollingOnly: false
    )
}
