import Foundation

protocol MindAnchorAPIProviding: AnyObject, Sendable {
    func loadStoredSession() -> AuthSessionState?
    func storeSession(_ authSession: AuthSessionState) throws
    func clearSession()
    func signIn(email: String, password: String) async throws -> AuthSessionState
    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState
    func fetchMe(token: String) async throws -> MePayload
    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload
    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload
    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload
    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload]
    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload]
    func createCoachConversationSession(title: String?, token: String) async throws -> CoachConversationSessionPayload
    func fetchCoachConversationSessions(token: String) async throws -> [CoachConversationSessionPayload]
    func fetchCoachConversationSession(_ sessionID: String, token: String) async throws -> CoachConversationSessionDetailPayload
    func fetchCoachDebugTrace(_ traceID: String, token: String) async throws -> DebugTraceLookupPayload
    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload
    func sendCoachConversationMessage(sessionID: String, text: String, token: String) async throws -> CoachConversationSendMessageResponsePayload
    func retryCoachConversationMessage(_ messageID: String, token: String) async throws -> CoachConversationSendMessageResponsePayload
    func submitCoachConversationFeedback(messageID: String, label: String, reason: String?, token: String) async throws -> CoachConversationFeedbackPayload
    func fetchCoachConversationMemory(token: String) async throws -> [CoachConversationMemoryPayload]
    func deleteCoachConversationMemory(_ memoryID: String, token: String) async throws -> CoachConversationMemoryPayload
    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload
    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload
    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload
    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload
    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload
    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload
    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload
    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice
    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice
    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws
    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws
    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message
    func createWayfinderEvent(payload: WayfinderEventInput, token: String) async throws -> WayfinderEventResponse
    func fetchWayfinderSituations(token: String) async throws -> WayfinderSituationsResponse
    func fetchWayfinderSituation(_ situationID: String, token: String) async throws -> WayfinderSituation
    func confirmWayfinderSituation(_ situationID: String, status: WayfinderSituationStatus, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse
    func dismissWayfinderSituation(_ situationID: String, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse
    func ignoreWayfinderSituation(_ situationID: String, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse
    func fetchWayfinderOptions(_ situationID: String, token: String) async throws -> WayfinderOptionsResponse
    func saveWayfinderOptions(_ options: [WayfinderDecisionOption], situationID: String, token: String) async throws -> WayfinderOptionsSaveResponse
    func recordWayfinderDecision(payload: WayfinderDecisionInput, token: String) async throws -> WayfinderDecisionRecord
    func recordWayfinderOutcome(_ decisionID: String, payload: WayfinderOutcomeInput, token: String) async throws -> WayfinderOutcome
    func fetchWayfinderHistory(limit: Int?, token: String) async throws -> WayfinderHistoryResponse
    func fetchWayfinderConsent(token: String) async throws -> WayfinderConsentResponse
    func updateWayfinderConsent(source: String, payload: WayfinderConsentInput, token: String) async throws -> WayfinderConsentGrant
}

private struct UnimplementedCoachAPISurfaceError: LocalizedError {
    let message: String

    var errorDescription: String? { message }
}

extension MindAnchorAPIProviding {
    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach front-agent API is not implemented for this client.")
    }

    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach front-agent update API is not implemented for this client.")
    }

    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload] {
        throw UnimplementedCoachAPISurfaceError(message: "Coach proposal API is not implemented for this client.")
    }

    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload] {
        throw UnimplementedCoachAPISurfaceError(message: "Coach memory API is not implemented for this client.")
    }

    func createCoachConversationSession(title: String?, token: String) async throws -> CoachConversationSessionPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation session create API is not implemented for this client.")
    }

    func fetchCoachConversationSessions(token: String) async throws -> [CoachConversationSessionPayload] {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation session list API is not implemented for this client.")
    }

    func fetchCoachConversationSession(_ sessionID: String, token: String) async throws -> CoachConversationSessionDetailPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation session detail API is not implemented for this client.")
    }

    func fetchCoachDebugTrace(_ traceID: String, token: String) async throws -> DebugTraceLookupPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach debug trace API is not implemented for this client.")
    }

    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload {
        throw UnimplementedCoachAPISurfaceError(message: "OpenClaw registry visibility API is not implemented for this client.")
    }

    func sendCoachConversationMessage(sessionID: String, text: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation send API is not implemented for this client.")
    }

    func retryCoachConversationMessage(_ messageID: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation retry API is not implemented for this client.")
    }

    func submitCoachConversationFeedback(messageID: String, label: String, reason: String?, token: String) async throws -> CoachConversationFeedbackPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation feedback API is not implemented for this client.")
    }

    func fetchCoachConversationMemory(token: String) async throws -> [CoachConversationMemoryPayload] {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation memory API is not implemented for this client.")
    }

    func deleteCoachConversationMemory(_ memoryID: String, token: String) async throws -> CoachConversationMemoryPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach conversation memory delete API is not implemented for this client.")
    }

    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach proposal approval API is not implemented for this client.")
    }

    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach proposal rejection API is not implemented for this client.")
    }

    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach memory delete API is not implemented for this client.")
    }

    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        throw UnimplementedCoachAPISurfaceError(message: "Coach memory recall-block API is not implemented for this client.")
    }
}

private struct UnimplementedWayfinderAPISurfaceError: LocalizedError {
    let message: String

    var errorDescription: String? { message }
}

extension MindAnchorAPIProviding {
    func createWayfinderEvent(payload: WayfinderEventInput, token: String) async throws -> WayfinderEventResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder event API is not implemented for this client.")
    }

    func fetchWayfinderSituations(token: String) async throws -> WayfinderSituationsResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder situations API is not implemented for this client.")
    }

    func fetchWayfinderSituation(_ situationID: String, token: String) async throws -> WayfinderSituation {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder situation API is not implemented for this client.")
    }

    func confirmWayfinderSituation(_ situationID: String, status: WayfinderSituationStatus, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder situation confirmation API is not implemented for this client.")
    }

    func dismissWayfinderSituation(_ situationID: String, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse {
        try await confirmWayfinderSituation(situationID, status: .dismissed, traceID: traceID, token: token)
    }

    func ignoreWayfinderSituation(_ situationID: String, traceID: String, token: String) async throws -> WayfinderSituationConfirmationResponse {
        try await dismissWayfinderSituation(situationID, traceID: traceID, token: token)
    }

    func fetchWayfinderOptions(_ situationID: String, token: String) async throws -> WayfinderOptionsResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder options API is not implemented for this client.")
    }

    func saveWayfinderOptions(_ options: [WayfinderDecisionOption], situationID: String, token: String) async throws -> WayfinderOptionsSaveResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder options save API is not implemented for this client.")
    }

    func saveWayfinderOptions(situationID: String, options: [WayfinderDecisionOption], token: String) async throws -> WayfinderOptionsSaveResponse {
        try await saveWayfinderOptions(options, situationID: situationID, token: token)
    }

    func recordWayfinderDecision(payload: WayfinderDecisionInput, token: String) async throws -> WayfinderDecisionRecord {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder decision API is not implemented for this client.")
    }

    func recordWayfinderOutcome(_ decisionID: String, payload: WayfinderOutcomeInput, token: String) async throws -> WayfinderOutcome {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder outcome API is not implemented for this client.")
    }

    func fetchWayfinderHistory(limit: Int? = nil, token: String) async throws -> WayfinderHistoryResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder history API is not implemented for this client.")
    }

    func fetchWayfinderConsent(token: String) async throws -> WayfinderConsentResponse {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder consent API is not implemented for this client.")
    }

    func updateWayfinderConsent(source: String, payload: WayfinderConsentInput, token: String) async throws -> WayfinderConsentGrant {
        throw UnimplementedWayfinderAPISurfaceError(message: "Wayfinder consent update API is not implemented for this client.")
    }
}

extension ReminderPresenting {
    func showOperationalAlert(id: String, title: String, message: String, kind: String) async {}
}
