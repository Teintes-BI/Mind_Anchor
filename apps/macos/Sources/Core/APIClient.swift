import Foundation

enum APIClientError: LocalizedError {
    case invalidResponse
    case server(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an invalid response."
        case .server(let statusCode, let message):
            return "Server error \(statusCode): \(message)"
        }
    }
}

struct RegisteredEdgeDevice: Codable, Equatable {
    let id: String
    let userId: String
    let deviceId: String
    let label: String
    let deviceType: String
    let platform: String
    let capabilities: [String]
    let status: String
}

private struct EmptyResponse: Decodable {}
private struct LatestStateEnvelope: Decodable {
    let latestAssessment: DashboardSummaryPayload.StateAssessment?
}

private extension JSONDecoder {
    static var mindAnchor: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

final class APIClient: MindAnchorAPIProviding, @unchecked Sendable {
    private let configuration: AppConfiguration
    private let session: URLSession
    private let keychainStore: any KeychainStoring

    init(configuration: AppConfiguration, session: URLSession = .shared, keychainStore: any KeychainStoring = KeychainStore()) {
        self.configuration = configuration
        self.session = session
        self.keychainStore = keychainStore
    }

    func loadStoredSession() -> AuthSessionState? {
        guard let data = try? keychainStore.load(account: configuration.authSessionAccount),
              let session = try? JSONDecoder.mindAnchor.decode(AuthSessionState.self, from: data) else {
            return nil
        }
        return session
    }

    func storeSession(_ authSession: AuthSessionState) throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        try keychainStore.save(encoder.encode(authSession), account: configuration.authSessionAccount)
    }

    func clearSession() {
        keychainStore.delete(account: configuration.authSessionAccount)
    }

    func signIn(email: String, password: String) async throws -> AuthSessionState {
        if let supabaseURL = configuration.supabaseURL,
           let anonKey = configuration.supabaseAnonKey,
           !anonKey.isEmpty {
            return try await signInWithSupabase(email: email, password: password, supabaseURL: supabaseURL, anonKey: anonKey)
        }

        let session: AuthSessionState = try await request(
            path: "/auth/login",
            method: "POST",
            token: nil,
            body: [
                "email": email,
                "password": password,
            ]
        )
        try storeSession(session)
        return session
    }

    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState {
        if let supabaseURL = configuration.supabaseURL,
           let anonKey = configuration.supabaseAnonKey,
           !anonKey.isEmpty {
            return try await signUpWithSupabase(email: email, password: password, anonKey: anonKey, supabaseURL: supabaseURL)
        }

        let session: AuthSessionState = try await request(
            path: "/auth/register",
            method: "POST",
            token: nil,
            body: [
                "email": email,
                "password": password,
                "displayName": displayName ?? "",
            ]
        )
        try storeSession(session)
        return session
    }

    func fetchMe(token: String) async throws -> MePayload {
        try await request(path: "/me", token: token)
    }

    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload {
        try await request(path: "/client/bootstrap", token: token)
    }

    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload {
        try await request(path: "/coach/front-agent", token: token)
    }

    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload {
        try await request(
            path: "/coach/front-agent",
            method: "POST",
            token: token,
            body: [
                "currentFrontAgent": payload.currentFrontAgent,
                "routingMode": payload.routingMode,
                "manualOverride": payload.manualOverride,
                "consultedAgent": payload.consultedAgent ?? NSNull(),
                "handoffReason": payload.handoffReason ?? NSNull(),
                "overrideSourceAgent": payload.overrideSourceAgent ?? NSNull(),
                "visibleSummary": payload.visibleSummary ?? NSNull(),
            ]
        )
    }

    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload] {
        try await request(path: "/coach/proposals", token: token)
    }

    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload] {
        try await request(path: "/coach/memory", token: token)
    }

    func createCoachConversationSession(title: String?, token: String) async throws -> CoachConversationSessionPayload {
        var body: [String: Any] = [:]
        if let title, !title.isEmpty {
            body["title"] = title
        }
        let response: CoachConversationSessionPayload = try await request(
            path: "/coach/sessions",
            method: "POST",
            token: token,
            body: body
        )
        return response
    }

    func fetchCoachConversationSessions(token: String) async throws -> [CoachConversationSessionPayload] {
        try await request(path: "/coach/sessions", token: token)
    }

    func fetchCoachConversationSession(_ sessionID: String, token: String) async throws -> CoachConversationSessionDetailPayload {
        try await request(path: "/coach/sessions/\(sessionID)", token: token)
    }

    func fetchCoachDebugTrace(_ traceID: String, token: String) async throws -> DebugTraceLookupPayload {
        try await request(path: "/debug/traces/\(traceID)", token: token)
    }

    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload {
        try await request(path: "/debug/openclaw/registry-visibility", token: token)
    }

    func sendCoachConversationMessage(sessionID: String, text: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        try await request(
            path: "/coach/sessions/\(sessionID)/messages",
            method: "POST",
            token: token,
            body: [
                "text": text,
            ]
        )
    }

    func retryCoachConversationMessage(_ messageID: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        try await request(path: "/coach/messages/\(messageID)/retry", method: "POST", token: token)
    }

    func submitCoachConversationFeedback(messageID: String, label: String, reason: String?, token: String) async throws -> CoachConversationFeedbackPayload {
        var body: [String: Any] = [
            "label": label,
        ]
        if let reason {
            body["reason"] = reason
        }
        let response: CoachConversationFeedbackPayload = try await request(
            path: "/coach/messages/\(messageID)/feedback",
            method: "POST",
            token: token,
            body: body
        )
        return response
    }

    func fetchCoachConversationMemory(token: String) async throws -> [CoachConversationMemoryPayload] {
        try await request(path: "/coach/memories", token: token)
    }

    func deleteCoachConversationMemory(_ memoryID: String, token: String) async throws -> CoachConversationMemoryPayload {
        try await request(path: "/coach/memories/\(memoryID)", method: "DELETE", token: token)
    }

    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        try await request(path: "/coach/proposals/\(proposalID)/approve", method: "POST", token: token)
    }

    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        try await request(path: "/coach/proposals/\(proposalID)/reject", method: "POST", token: token)
    }

    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        try await request(path: "/coach/memory/\(memoryID)/delete", method: "POST", token: token)
    }

    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        try await request(path: "/coach/memory/\(memoryID)/recall-block", method: "POST", token: token)
    }

    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload {
        try await request(path: "/client/inbox/overview", token: token)
    }

    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload {
        try await request(path: "/state/trends?userId=\(userID)", token: token)
    }

    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload {
        try await request(path: "/reflections/overview?userId=\(userID)", token: token)
    }

    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice {
        try await request(
            path: "/devices/register",
            method: "POST",
            token: token,
            body: [
                "userId": userID,
                "deviceId": profile.deviceID,
                "label": profile.label,
                "deviceType": "desktop",
                "platform": profile.platform,
                "capabilities": profile.capabilities,
                "appVersion": profile.appVersion,
            ]
        )
    }

    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice {
        try await request(
            path: "/devices/heartbeat",
            method: "POST",
            token: token,
            body: [
                "userId": userID,
                "deviceId": profile.deviceID,
                "status": "online",
                "queueDepth": queueDepth,
                "capabilities": profile.capabilities,
            ]
        )
    }

    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws {
        let formatter = ISO8601DateFormatter()
        let events = signals.map { signal in
            [
                "userId": userID,
                "source": "desktop",
                "eventType": signal.eventType,
                "occurredAt": formatter.string(from: signal.occurredAt),
                "clientEventId": signal.id.uuidString,
                "payload": signal.payload,
            ]
        }
        let _: EmptyResponse = try await request(path: "/state/signals/batch", method: "POST", token: token, body: ["events": events])
    }

    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws {
        let _: LatestStateEnvelope = try await request(
            path: "/state/checkins",
            method: "POST",
            token: token,
            body: [
                "userId": userID,
                "focusScore": focusScore,
                "energyScore": energyScore,
                "moodScore": moodScore,
                "note": note,
            ]
        )
    }

    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message {
        try await request(path: "/client/inbox/\(messageID)/ack", method: "POST", token: token)
    }

    private func request<T: Decodable>(path: String, method: String = "GET", token: String?, body: [String: Any]? = nil) async throws -> T {
        var request = URLRequest(url: buildURL(path: path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(statusCode: http.statusCode, message: String(data: data, encoding: .utf8) ?? "Request failed")
        }
        return try JSONDecoder.mindAnchor.decode(T.self, from: data)
    }

    private func buildURL(path: String) -> URL {
        if let queryIndex = path.firstIndex(of: "?") {
            let pathPart = String(path[..<queryIndex])
            let queryPart = String(path[path.index(after: queryIndex)...])
            var components = URLComponents(url: configuration.apiBaseURL.appending(path: pathPart), resolvingAgainstBaseURL: false)
            components?.percentEncodedQuery = queryPart
            return components?.url ?? configuration.apiBaseURL.appending(path: pathPart)
        }

        return configuration.apiBaseURL.appending(path: path)
    }

    private func signInWithSupabase(email: String, password: String, supabaseURL: URL, anonKey: String) async throws -> AuthSessionState {
        var request = URLRequest(url: supabaseURL.appending(path: "auth/v1/token"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": email,
            "password": password,
            "grant_type": "password",
        ])

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(statusCode: http.statusCode, message: String(data: data, encoding: .utf8) ?? "Authentication failed")
        }

        struct SupabaseAuthResponse: Decodable {
            struct User: Decodable {
                let id: String
                let email: String?
            }

            let access_token: String
            let refresh_token: String?
            let expires_in: Double?
            let user: User
        }

        let decoded = try JSONDecoder.mindAnchor.decode(SupabaseAuthResponse.self, from: data)
        let authSession = AuthSessionState(
            accessToken: decoded.access_token,
            refreshToken: decoded.refresh_token,
            expiresAt: decoded.expires_in.map { Date().addingTimeInterval($0) },
            user: AuthUser(id: decoded.user.id, email: decoded.user.email, provider: "supabase-jwt")
        )
        try storeSession(authSession)
        return authSession
    }

    private func signUpWithSupabase(email: String, password: String, anonKey: String, supabaseURL: URL) async throws -> AuthSessionState {
        var request = URLRequest(url: supabaseURL.appending(path: "auth/v1/signup"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": email,
            "password": password,
        ])

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIClientError.server(statusCode: http.statusCode, message: String(data: data, encoding: .utf8) ?? "Sign up failed")
        }

        return try await signInWithSupabase(email: email, password: password, supabaseURL: supabaseURL, anonKey: anonKey)
    }
}
