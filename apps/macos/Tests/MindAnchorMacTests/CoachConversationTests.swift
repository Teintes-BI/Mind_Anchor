import XCTest
@testable import MindAnchorCore

@MainActor
final class CoachConversationTests: XCTestCase {
    func testCoachPrimaryResponseTextPrefersFullAndFallsBackToFast() async throws {
        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: ConversationMockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        let pendingMessage = CoachConversationMessagePayload(
            id: "message-pending",
            userId: "coach-user",
            sessionId: "session-1",
            role: "assistant",
            status: "pending_full",
            userText: nil,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            fullResponse: nil,
            usedMemoryIds: [],
            traceId: "trace-pending",
            errorCode: nil,
            createdAt: "2026-03-21T00:00:01.000Z",
            updatedAt: "2026-03-21T00:00:01.000Z"
        )
        let completedMessage = CoachConversationMessagePayload(
            id: "message-completed",
            userId: "coach-user",
            sessionId: "session-1",
            role: "assistant",
            status: "completed",
            userText: nil,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
            usedMemoryIds: [],
            traceId: "trace-completed",
            errorCode: nil,
            createdAt: "2026-03-21T00:00:01.000Z",
            updatedAt: "2026-03-21T00:00:02.000Z"
        )
        let failedMessage = CoachConversationMessagePayload(
            id: "message-failed",
            userId: "coach-user",
            sessionId: "session-1",
            role: "assistant",
            status: "failed",
            userText: nil,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            fullResponse: nil,
            usedMemoryIds: [],
            traceId: "trace-failed",
            errorCode: "coach_full_generation_failed",
            createdAt: "2026-03-21T00:00:01.000Z",
            updatedAt: "2026-03-21T00:00:02.000Z"
        )

        XCTAssertEqual(viewModel.coachPrimaryResponseText(for: pendingMessage), "先别急，先把它收窄成一个最小下一步。")
        XCTAssertEqual(viewModel.coachPrimaryResponseText(for: completedMessage), "我先帮你把重点压缩成一个现在就能开始的动作。")
        XCTAssertEqual(viewModel.coachPrimaryResponseText(for: failedMessage), "先别急，先把它收窄成一个最小下一步。")
    }

    func testRefreshCoachConversationLoadsSessionsMessagesAndMemory() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.conversationSessions = [
            CoachConversationSessionPayload(
                id: "session-1",
                userId: "coach-user",
                title: "整理一下今天的混乱",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            )
        ]
        client.conversationDetail = CoachConversationSessionDetailPayload(
            session: client.conversationSessions[0],
            messages: [
                CoachConversationMessagePayload(
                    id: "message-user-1",
                    userId: "coach-user",
                    sessionId: "session-1",
                    role: "user",
                    status: "completed",
                    userText: "我现在很乱，不知道先做什么。",
                    fastResponse: nil,
                    fullResponse: nil,
                    usedMemoryIds: [],
                    traceId: "trace-1",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:01.000Z",
                    updatedAt: "2026-03-21T00:00:01.000Z"
                ),
                CoachConversationMessagePayload(
                    id: "message-assistant-1",
                    userId: "coach-user",
                    sessionId: "session-1",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先别急，先把这件事收窄成一个最小下一步。",
                    fullResponse: "我先帮你把问题拆成一个可执行起点，再决定是否继续扩展。",
                    usedMemoryIds: [],
                    traceId: "trace-1",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:02.000Z",
                    updatedAt: "2026-03-21T00:00:02.000Z"
                )
            ]
        )
        client.conversationMemory = [
            CoachConversationMemoryPayload(
                id: "memory-1",
                userId: "coach-user",
                kind: "preference",
                summary: "用户更适合明确的最小下一步",
                confidence: 0.9,
                status: "active",
                sourceMessageId: "message-assistant-1",
                sourceExcerpt: "来自对话的摘要。",
                createdAt: "2026-03-21T00:00:03.000Z",
                lastUsedAt: nil,
                revokedAt: nil
            )
        ]

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()

        XCTAssertEqual(viewModel.coachConversationSessions.count, 1)
        XCTAssertEqual(viewModel.coachConversationSelectedSessionID, "session-1")
        XCTAssertEqual(viewModel.coachConversationMessages.count, 2)
        XCTAssertEqual(viewModel.coachConversationMemoryItems.count, 1)
        XCTAssertGreaterThanOrEqual(client.fetchConversationSessionsCallCount, 1)
        XCTAssertGreaterThanOrEqual(client.fetchConversationSessionDetailCallCount, 1)
    }

    func testSendCoachConversationMessageCreatesSessionWhenNeededAndAppendsMessages() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.createdConversationSession = CoachConversationSessionPayload(
            id: "session-new",
            userId: "coach-user",
            title: "New Coach Session",
            status: "active",
            createdAt: "2026-03-21T00:00:00.000Z",
            updatedAt: "2026-03-21T00:00:00.000Z",
            lastMessageAt: "2026-03-21T00:00:00.000Z"
        )
        client.sentConversationResponse = CoachConversationSendMessageResponsePayload(
            userMessage: CoachConversationMessagePayload(
                id: "message-user-1",
                userId: "coach-user",
                sessionId: "session-new",
                role: "user",
                status: "completed",
                userText: "先帮我收窄今天的重点。",
                fastResponse: nil,
                fullResponse: nil,
                usedMemoryIds: [],
                traceId: "trace-send",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:01.000Z",
                updatedAt: "2026-03-21T00:00:01.000Z"
            ),
            assistantMessage: CoachConversationMessagePayload(
                id: "message-assistant-1",
                userId: "coach-user",
                sessionId: "session-new",
                role: "assistant",
                status: "completed",
                userText: nil,
                fastResponse: "先别急，先把它收窄成一个最小下一步。",
                fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
                usedMemoryIds: [],
                traceId: "trace-send",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:02.000Z",
                updatedAt: "2026-03-21T00:00:02.000Z"
            ),
            frontAgentState: .defaultAuto,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            traceID: "trace-send"
        )

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        viewModel.coachConversationDraft = "先帮我收窄今天的重点。"
        await viewModel.sendCoachConversationMessage()

        XCTAssertEqual(client.createConversationSessionCallCount, 1)
        XCTAssertEqual(client.sendConversationMessageCallCount, 1)
        XCTAssertEqual(viewModel.coachConversationSelectedSessionID, "session-new")
        XCTAssertEqual(viewModel.coachConversationMessages.count, 2)
        XCTAssertEqual(viewModel.coachConversationDraft, "")
        XCTAssertEqual(viewModel.coachConversationLastTraceID, "trace-send")
    }

    func testPendingConversationMessageAutoRefreshesToCompleted() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.createdConversationSession = CoachConversationSessionPayload(
            id: "session-auto",
            userId: "coach-user",
            title: "Auto Refresh",
            status: "active",
            createdAt: "2026-03-21T00:00:00.000Z",
            updatedAt: "2026-03-21T00:00:00.000Z",
            lastMessageAt: "2026-03-21T00:00:00.000Z"
        )
        client.sentConversationResponse = CoachConversationSendMessageResponsePayload(
            userMessage: CoachConversationMessagePayload(
                id: "message-user-auto",
                userId: "coach-user",
                sessionId: "session-auto",
                role: "user",
                status: "completed",
                userText: "先帮我收窄今天的重点。",
                fastResponse: nil,
                fullResponse: nil,
                usedMemoryIds: [],
                traceId: "trace-auto",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:01.000Z",
                updatedAt: "2026-03-21T00:00:01.000Z"
            ),
            assistantMessage: CoachConversationMessagePayload(
                id: "message-assistant-auto",
                userId: "coach-user",
                sessionId: "session-auto",
                role: "assistant",
                status: "pending_full",
                userText: nil,
                fastResponse: "先别急，先把它收窄成一个最小下一步。",
                fullResponse: nil,
                usedMemoryIds: [],
                traceId: "trace-auto",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:02.000Z",
                updatedAt: "2026-03-21T00:00:02.000Z"
            ),
            frontAgentState: .defaultAuto,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            traceID: "trace-auto"
        )
        client.conversationDetailSequence = [
            CoachConversationSessionDetailPayload(
                session: client.createdConversationSession!,
                messages: [
                    client.sentConversationResponse!.userMessage,
                    client.sentConversationResponse!.assistantMessage,
                ]
            ),
            CoachConversationSessionDetailPayload(
                session: client.createdConversationSession!,
                messages: [
                    client.sentConversationResponse!.userMessage,
                    CoachConversationMessagePayload(
                        id: "message-assistant-auto",
                        userId: "coach-user",
                        sessionId: "session-auto",
                        role: "assistant",
                        status: "completed",
                        userText: nil,
                        fastResponse: "先别急，先把它收窄成一个最小下一步。",
                        fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
                        usedMemoryIds: [],
                        traceId: "trace-auto-2",
                        errorCode: nil,
                        createdAt: "2026-03-21T00:00:02.000Z",
                        updatedAt: "2026-03-21T00:00:04.000Z"
                    ),
                ]
            ),
        ]

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        viewModel.coachConversationDraft = "先帮我收窄今天的重点。"
        await viewModel.sendCoachConversationMessage()

        XCTAssertEqual(viewModel.coachConversationMessages.last?.status, "pending_full")

        try? await Task.sleep(for: .milliseconds(1200))

        XCTAssertEqual(viewModel.coachConversationMessages.last?.status, "completed")
        XCTAssertEqual(viewModel.coachConversationMessages.last?.fullResponse, "我先帮你把重点压缩成一个现在就能开始的动作。")
        XCTAssertGreaterThanOrEqual(client.fetchConversationSessionDetailCallCount, 1)
    }

    func testPendingConversationAutoRefreshAlsoReloadsAuthoritySidecars() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.createdConversationSession = CoachConversationSessionPayload(
            id: "session-data",
            userId: "coach-user",
            title: "Memory Governance",
            status: "active",
            createdAt: "2026-03-21T00:00:00.000Z",
            updatedAt: "2026-03-21T00:00:00.000Z",
            lastMessageAt: "2026-03-21T00:00:00.000Z"
        )
        client.sentConversationResponse = CoachConversationSendMessageResponsePayload(
            userMessage: CoachConversationMessagePayload(
                id: "message-user-data",
                userId: "coach-user",
                sessionId: "session-data",
                role: "user",
                status: "completed",
                userText: "请忘记我偏好短句这条记忆。",
                fastResponse: nil,
                fullResponse: nil,
                usedMemoryIds: [],
                traceId: "trace-data",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:01.000Z",
                updatedAt: "2026-03-21T00:00:01.000Z"
            ),
            assistantMessage: CoachConversationMessagePayload(
                id: "message-assistant-data",
                userId: "coach-user",
                sessionId: "session-data",
                role: "assistant",
                status: "pending_full",
                userText: nil,
                fastResponse: "先别急，先把这条记忆治理请求收窄成一个最小下一步。",
                fullResponse: nil,
                usedMemoryIds: ["memory-conversation-1"],
                traceId: "trace-data",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:02.000Z",
                updatedAt: "2026-03-21T00:00:02.000Z"
            ),
            frontAgentState: .defaultAuto,
            fastResponse: "先别急，先把这条记忆治理请求收窄成一个最小下一步。",
            traceID: "trace-data"
        )
        client.conversationDetailSequence = [
            CoachConversationSessionDetailPayload(
                session: client.createdConversationSession!,
                messages: [
                    client.sentConversationResponse!.userMessage,
                    client.sentConversationResponse!.assistantMessage,
                ]
            ),
            CoachConversationSessionDetailPayload(
                session: client.createdConversationSession!,
                messages: [
                    client.sentConversationResponse!.userMessage,
                    CoachConversationMessagePayload(
                        id: "message-assistant-data",
                        userId: "coach-user",
                        sessionId: "session-data",
                        role: "assistant",
                        status: "completed",
                        userText: nil,
                        fastResponse: "先别急，先把这条记忆治理请求收窄成一个最小下一步。",
                        fullResponse: "我已停止继续沿用这条记忆，并把这件事收束为一个清晰的治理结果。",
                        usedMemoryIds: [],
                        traceId: "trace-data",
                        errorCode: nil,
                        createdAt: "2026-03-21T00:00:02.000Z",
                        updatedAt: "2026-03-21T00:00:05.000Z"
                    ),
                ]
            ),
        ]
        client.coachFrontAgentPayload = CoachFrontAgentPayload(
            currentFrontAgent: "memory-governor-agent",
            routingMode: "auto",
            manualOverride: false,
            consultedAgent: nil,
            handoffReason: "memory_governance",
            overrideSourceAgent: "director-agent",
            visibleSummary: "Picard routed this turn to Data for memory governance."
        )
        client.coachMemoryPayload = [
            DataMemoryPayload(
                candidateId: "candidate-memory-1",
                memoryId: "memory-1",
                status: "deleted",
                sourceAgent: "companion-agent",
                sourceTurnRef: "turn-memory-1",
                summary: "用户偏好短句、明确下一步。",
                effectiveAt: "2026-03-21T00:00:00.000Z",
                recallBlockedAt: nil,
                deletedAt: "2026-03-21T00:00:05.000Z"
            )
        ]

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        viewModel.coachConversationDraft = "请忘记我偏好短句这条记忆。"
        await viewModel.sendCoachConversationMessage()

        try? await Task.sleep(for: .milliseconds(1200))

        XCTAssertEqual(viewModel.coachConversationMessages.last?.status, "completed")
        XCTAssertEqual(viewModel.activeCoachFrontAgentState.currentFrontAgent, "memory-governor-agent")
        XCTAssertEqual(viewModel.coachMemoryItems.first?.status, "deleted")
        XCTAssertGreaterThanOrEqual(client.fetchCoachFrontAgentCallCount, 2)
        XCTAssertGreaterThanOrEqual(client.fetchCoachMemoryCallCount, 2)
    }

    func testRefreshCoachConversationBuildsMessageExecutionTrailFromTrace() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.conversationSessions = [
            CoachConversationSessionPayload(
                id: "session-trace",
                userId: "coach-user",
                title: "Trace Session",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            )
        ]
        client.conversationDetail = CoachConversationSessionDetailPayload(
            session: client.conversationSessions[0],
            messages: [
                CoachConversationMessagePayload(
                    id: "message-assistant-trace",
                    userId: "coach-user",
                    sessionId: "session-trace",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先别急，先把问题收窄。",
                    fullResponse: "我先帮你把问题拆成一个可执行起点。",
                    usedMemoryIds: [],
                    conversationPath: .init(
                        frontAgent: "companion-agent",
                        consultedAgent: "analyst-agent",
                        authorityAgent: "memory-governor-agent",
                        authorityTarget: "delete_memory",
                        authorityExecutionStatus: "deleted",
                        runtimeSource: "original-runtime",
                        revokedMemoryCount: 1,
                        primaryRoute: "provider-fallback",
                        usedOpenClaw: true,
                        hadFallback: true,
                        degraded: true,
                        degradedReason: "cluster_fallback"
                    ),
                    traceId: "trace-message-1",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:02.000Z",
                    updatedAt: "2026-03-21T00:00:03.000Z"
                )
            ]
        )
        client.debugTracePayloadByID["trace-message-1"] = DebugTraceLookupPayload(
            traceId: "trace-message-1",
            agentRuns: [],
            matrixRuns: [],
            events: [
                CoachDebugTraceEventPayload(
                    id: "event-consult",
                    traceId: "trace-message-1",
                    parentTraceId: nil,
                    level: "info",
                    component: "conversation-coach",
                    event: "coach.consult.completed",
                    message: "Coach consult completed",
                    metadata: [
                        "consultedAgent": .string("analyst-agent"),
                        "frontAgent": .string("companion-agent"),
                    ],
                    createdAt: "2026-03-21T00:00:03.000Z"
                ),
                CoachDebugTraceEventPayload(
                    id: "event-authority",
                    traceId: "trace-message-1",
                    parentTraceId: nil,
                    level: "info",
                    component: "conversation-coach",
                    event: "coach.authority.handoff.completed",
                    message: "Coach authority handoff completed",
                    metadata: [
                        "authorityAgent": .string("memory-governor-agent"),
                        "action": .string("delete_memory"),
                        "executionStatus": .string("deleted"),
                    ],
                    createdAt: "2026-03-21T00:00:04.000Z"
                ),
                CoachDebugTraceEventPayload(
                    id: "event-memory",
                    traceId: "trace-message-1",
                    parentTraceId: nil,
                    level: "info",
                    component: "conversation-coach",
                    event: "coach.memory.revoked",
                    message: "Coach memory revoked by governance handoff",
                    metadata: [
                        "revokedMemoryCount": .number(1),
                    ],
                    createdAt: "2026-03-21T00:00:04.500Z"
                ),
            ],
            summary: .init(
                conversationPath: .init(
                    frontAgent: "companion-agent",
                    consultedAgent: "analyst-agent",
                    authorityAgent: "memory-governor-agent",
                    authorityTarget: "delete_memory",
                    authorityExecutionStatus: "deleted",
                    runtimeSource: "original-runtime",
                    revokedMemoryCount: 1,
                    primaryRoute: "provider-fallback",
                    usedOpenClaw: true,
                    hadFallback: true,
                    degraded: true,
                    degradedReason: "cluster_fallback"
                )
            )
        )

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        await viewModel.refreshCoachConversation()

        XCTAssertEqual(client.fetchCoachDebugTraceCallCount, 0)
        let message = try XCTUnwrap(viewModel.coachConversationMessages.first)
        let lines = viewModel.coachMessageExecutionTrailLines(for: message)
        XCTAssertTrue(lines.contains(where: { $0.contains("Spock") }))
        XCTAssertTrue(lines.contains(where: { $0.contains("Data") }))
        XCTAssertTrue(lines.contains(where: { $0.contains("deleted") || $0.contains("已删除") }))
        XCTAssertTrue(lines.contains(where: { $0.contains("revoked") || $0.contains("已撤销") }))
        XCTAssertTrue(lines.contains(where: { $0.contains("Degraded") || $0.contains("降级") || $0.contains("回退") }))
        XCTAssertTrue(lines.contains(where: {
            ($0.contains("官方 OpenClaw runtime") || $0.contains("Official OpenClaw runtime")) &&
            ($0.contains("fallback") || $0.contains("provider-fallback") || $0.contains("回退"))
        }))
    }

    func testUsedMemoryDisplayLinesPreferStructuredEntries() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.conversationSessions = [
            CoachConversationSessionPayload(
                id: "session-memory-display",
                userId: "coach-user",
                title: "memory display",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            )
        ]
        client.conversationDetail = CoachConversationSessionDetailPayload(
            session: client.conversationSessions[0],
            messages: [
                CoachConversationMessagePayload(
                    id: "message-memory-display",
                    userId: "coach-user",
                    sessionId: "session-memory-display",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先别急。",
                    fullResponse: "我先帮你收窄成一个更容易执行的下一步。",
                    usedMemoryIds: ["memory-1"],
                    usedMemoryEntries: [
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: "memory-1",
                            summary: "用户偏好短句、明确下一步。",
                            kind: "preference",
                            source: "coach-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "本周会议负载偏高，连续大块专注时间有限。",
                            kind: "constraint",
                            source: "gateway-memory"
                        )
                    ],
                    traceId: "trace-memory-display",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:01.000Z",
                    updatedAt: "2026-03-21T00:00:02.000Z"
                )
            ]
        )

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        await viewModel.refreshCoachConversation()

        let lines = viewModel.coachUsedConversationMemoryDisplayLines(for: "message-memory-display")
        XCTAssertEqual(lines.count, 2)
        XCTAssertTrue(lines.contains(where: { $0.contains("用户偏好短句") && $0.contains("长期偏好") }))
        XCTAssertTrue(lines.contains(where: { $0.contains("会议负载偏高") && $0.contains("现实约束") }))
    }

    func testUsedMemoryDisplayLinesFollowFrontAgentPersonaTemplate() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.conversationSessions = [
            CoachConversationSessionPayload(
                id: "session-persona-memory-display",
                userId: "coach-user",
                title: "persona memory display",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            )
        ]
        client.conversationDetail = CoachConversationSessionDetailPayload(
            session: client.conversationSessions[0],
            messages: [
                CoachConversationMessagePayload(
                    id: "message-troi-memory-display",
                    userId: "coach-user",
                    sessionId: "session-persona-memory-display",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先稳一下。",
                    fullResponse: "我先帮你落回一个更稳的节奏。",
                    usedMemoryIds: ["memory-1"],
                    usedMemoryEntries: [
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: "memory-1",
                            summary: "用户偏好短句、明确下一步。",
                            kind: "preference",
                            source: "coach-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "Picard is currently coordinating the team.",
                            kind: "recent_context",
                            source: "front-agent-state"
                        )
                    ],
                    traceId: "trace-troi-memory-display",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:01.000Z",
                    updatedAt: "2026-03-21T00:00:02.000Z"
                ),
                CoachConversationMessagePayload(
                    id: "message-spock-memory-display",
                    userId: "coach-user",
                    sessionId: "session-persona-memory-display",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先看约束。",
                    fullResponse: "我先按现实边界和行为模式来收敛问题。",
                    usedMemoryIds: ["memory-2"],
                    usedMemoryEntries: [
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: "memory-2",
                            summary: "高压时更适合一次只推进一个动作。",
                            kind: "work_style",
                            source: "coach-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "本周会议负载偏高，连续大块专注时间有限。",
                            kind: "constraint",
                            source: "gateway-memory"
                        )
                    ],
                    traceId: "trace-spock-memory-display",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:03.000Z",
                    updatedAt: "2026-03-21T00:00:04.000Z"
                ),
                CoachConversationMessagePayload(
                    id: "message-guinan-memory-display",
                    userId: "coach-user",
                    sessionId: "session-persona-memory-display",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先别往两边拉扯。",
                    fullResponse: "我先帮你把现实和感受放回同一个节奏里。",
                    usedMemoryIds: ["memory-3"],
                    usedMemoryEntries: [
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: "memory-3",
                            summary: "用户更适合温和但不失现实感的提醒。",
                            kind: "preference",
                            source: "coach-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "Guinan is holding the balance for this turn.",
                            kind: "recent_context",
                            source: "front-agent-state"
                        )
                    ],
                    traceId: "trace-guinan-memory-display",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:05.000Z",
                    updatedAt: "2026-03-21T00:00:06.000Z"
                ),
                CoachConversationMessagePayload(
                    id: "message-jarvis-memory-display",
                    userId: "coach-user",
                    sessionId: "session-persona-memory-display",
                    role: "assistant",
                    status: "completed",
                    userText: nil,
                    fastResponse: "先定一下执行顺序。",
                    fullResponse: "我先按你当前现实条件把接下来的动作排一遍。",
                    usedMemoryIds: ["memory-4"],
                    usedMemoryEntries: [
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: "memory-4",
                            summary: "用户更容易执行明确、短链、可打勾的任务。",
                            kind: "preference",
                            source: "coach-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "今天下午只有一小时可自由安排。",
                            kind: "constraint",
                            source: "gateway-memory"
                        ),
                        CoachConversationMessagePayload.UsedMemoryEntryPayload(
                            memoryId: nil,
                            summary: "Jarvis is currently organizing the plan.",
                            kind: "recent_context",
                            source: "front-agent-state"
                        )
                    ],
                    traceId: "trace-jarvis-memory-display",
                    errorCode: nil,
                    createdAt: "2026-03-21T00:00:07.000Z",
                    updatedAt: "2026-03-21T00:00:08.000Z"
                )
            ]
        )
        client.debugTracePayloadByID["trace-troi-memory-display"] = DebugTraceLookupPayload(
            traceId: "trace-troi-memory-display",
            agentRuns: [],
            matrixRuns: [],
            events: [],
            summary: .init(
                conversationPath: .init(
                    frontAgent: "companion-agent",
                    consultedAgent: nil,
                    authorityAgent: nil,
                    authorityTarget: nil,
                    authorityExecutionStatus: nil,
                    primaryRoute: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                    degraded: false,
                    degradedReason: nil
                )
            )
        )
        client.debugTracePayloadByID["trace-spock-memory-display"] = DebugTraceLookupPayload(
            traceId: "trace-spock-memory-display",
            agentRuns: [],
            matrixRuns: [],
            events: [],
            summary: .init(
                conversationPath: .init(
                    frontAgent: "analyst-agent",
                    consultedAgent: nil,
                    authorityAgent: nil,
                    authorityTarget: nil,
                    authorityExecutionStatus: nil,
                    primaryRoute: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                    degraded: false,
                    degradedReason: nil
                )
            )
        )
        client.debugTracePayloadByID["trace-guinan-memory-display"] = DebugTraceLookupPayload(
            traceId: "trace-guinan-memory-display",
            agentRuns: [],
            matrixRuns: [],
            events: [],
            summary: .init(
                conversationPath: .init(
                    frontAgent: "balance-agent",
                    consultedAgent: nil,
                    authorityAgent: nil,
                    authorityTarget: nil,
                    authorityExecutionStatus: nil,
                    primaryRoute: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                    degraded: false,
                    degradedReason: nil
                )
            )
        )
        client.debugTracePayloadByID["trace-jarvis-memory-display"] = DebugTraceLookupPayload(
            traceId: "trace-jarvis-memory-display",
            agentRuns: [],
            matrixRuns: [],
            events: [],
            summary: .init(
                conversationPath: .init(
                    frontAgent: "life-secretary-agent",
                    consultedAgent: nil,
                    authorityAgent: nil,
                    authorityTarget: nil,
                    authorityExecutionStatus: nil,
                    primaryRoute: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                    degraded: false,
                    degradedReason: nil
                )
            )
        )

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        await viewModel.refreshCoachConversation()

        let troiLines = viewModel.coachUsedConversationMemoryDisplayLines(for: "message-troi-memory-display")
        XCTAssertTrue(troiLines.contains(where: { $0.contains("安抚偏好") }))
        XCTAssertTrue(troiLines.contains(where: { $0.contains("当前情绪焦点") }))

        let spockLines = viewModel.coachUsedConversationMemoryDisplayLines(for: "message-spock-memory-display")
        XCTAssertTrue(spockLines.contains(where: { $0.contains("行为习惯") }))
        XCTAssertTrue(spockLines.contains(where: { $0.contains("现实约束") }))

        let guinanLines = viewModel.coachUsedConversationMemoryDisplayLines(for: "message-guinan-memory-display")
        XCTAssertTrue(guinanLines.contains(where: { $0.contains("平衡偏好") }))
        XCTAssertTrue(guinanLines.contains(where: { $0.contains("当前平衡焦点") }))

        let jarvisLines = viewModel.coachUsedConversationMemoryDisplayLines(for: "message-jarvis-memory-display")
        XCTAssertTrue(jarvisLines.contains(where: { $0.contains("执行偏好") }))
        XCTAssertTrue(jarvisLines.contains(where: { $0.contains("计划约束") }))
        XCTAssertTrue(jarvisLines.contains(where: { $0.contains("当前计划焦点") }))
    }

    func testRetryFeedbackAndDeleteMemoryUpdateConversationState() async throws {
        let client = ConversationMockAPIClient()
        client.storedSession = AuthSessionState(
            accessToken: "token-conversation",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
        client.conversationSessions = [
            CoachConversationSessionPayload(
                id: "session-1",
                userId: "coach-user",
                title: "整理一下今天的混乱",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            )
        ]
        client.conversationDetail = CoachConversationSessionDetailPayload(
            session: client.conversationSessions[0],
            messages: [
                CoachConversationMessagePayload(
                    id: "message-assistant-1",
                    userId: "coach-user",
                    sessionId: "session-1",
                    role: "assistant",
                    status: "failed",
                    userText: nil,
                    fastResponse: "先别急，先把它收窄成一个最小下一步。",
                    fullResponse: nil,
                    usedMemoryIds: [],
                    traceId: "trace-before",
                    errorCode: "coach_generation_failed",
                    createdAt: "2026-03-21T00:00:01.000Z",
                    updatedAt: "2026-03-21T00:00:01.000Z"
                )
            ]
        )
        client.conversationMemory = [
            CoachConversationMemoryPayload(
                id: "memory-1",
                userId: "coach-user",
                kind: "preference",
                summary: "用户更适合明确的最小下一步",
                confidence: 0.9,
                status: "active",
                sourceMessageId: "message-assistant-1",
                sourceExcerpt: "来自对话的摘要。",
                createdAt: "2026-03-21T00:00:03.000Z",
                lastUsedAt: nil,
                revokedAt: nil
            )
        ]
        client.retriedConversationMessage = CoachConversationMessagePayload(
            id: "message-assistant-1",
            userId: "coach-user",
            sessionId: "session-1",
            role: "assistant",
            status: "pending_full",
            userText: nil,
            fastResponse: "先别急，先把它收窄成一个最小下一步。",
            fullResponse: nil,
            usedMemoryIds: [],
            traceId: "trace-retry",
            errorCode: nil,
            createdAt: "2026-03-21T00:00:01.000Z",
            updatedAt: "2026-03-21T00:00:02.000Z"
        )
        client.deletedConversationMemory = CoachConversationMemoryPayload(
            id: "memory-1",
            userId: "coach-user",
            kind: "preference",
            summary: "用户更适合明确的最小下一步",
            confidence: 0.9,
            status: "revoked",
            sourceMessageId: "message-assistant-1",
            sourceExcerpt: "来自对话的摘要。",
            createdAt: "2026-03-21T00:00:03.000Z",
            lastUsedAt: nil,
            revokedAt: "2026-03-21T00:10:00.000Z"
        )

        let viewModel = AppViewModel(
            configuration: .conversationTestValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeConversationTempDirectory()),
            collector: ConversationNoopCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        await viewModel.refreshCoachConversation()
        client.conversationDetailSequence = [
            CoachConversationSessionDetailPayload(
                session: client.conversationSessions[0],
                messages: [
                    client.retriedConversationMessage!
                ]
            ),
            CoachConversationSessionDetailPayload(
                session: client.conversationSessions[0],
                messages: [
                    CoachConversationMessagePayload(
                        id: "message-assistant-1",
                        userId: "coach-user",
                        sessionId: "session-1",
                        role: "assistant",
                        status: "completed",
                        userText: nil,
                        fastResponse: "先别急，先把它收窄成一个最小下一步。",
                        fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
                        usedMemoryIds: [],
                        traceId: "trace-retry",
                        errorCode: nil,
                        createdAt: "2026-03-21T00:00:01.000Z",
                        updatedAt: "2026-03-21T00:00:03.000Z"
                    )
                ]
            )
        ]
        await viewModel.retryCoachConversationMessage("message-assistant-1")
        XCTAssertEqual(viewModel.coachConversationMessages.first?.status, "pending_full")
        try? await Task.sleep(for: .milliseconds(1200))
        await viewModel.submitCoachConversationFeedback(messageID: "message-assistant-1", label: "helpful")
        await viewModel.deleteCoachConversationMemory("memory-1")

        XCTAssertEqual(viewModel.coachConversationMessages.first?.status, "completed")
        XCTAssertEqual(client.submitConversationFeedbackCallCount, 1)
        XCTAssertEqual(viewModel.coachConversationMemoryItems.first?.status, "revoked")
    }
}

private final class ConversationMockAPIClient: MindAnchorAPIProviding, @unchecked Sendable {
    var storedSession: AuthSessionState?
    var bootstrapPayload: ClientBootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: .defaultAuto)
    var inboxOverviewPayload: InboxOverviewPayload = .fixture(messages: [])
    var stateTrendsPayload: StateTrendsPayload = .fixture
    var reflectionOverviewPayload: ReflectionOverviewPayload = .fixture

    var conversationSessions: [CoachConversationSessionPayload] = []
    var conversationDetail: CoachConversationSessionDetailPayload?
    var conversationDetailSequence: [CoachConversationSessionDetailPayload] = []
    var conversationMemory: [CoachConversationMemoryPayload] = []
    var createdConversationSession: CoachConversationSessionPayload?
    var sentConversationResponse: CoachConversationSendMessageResponsePayload?
    var retriedConversationMessage: CoachConversationMessagePayload?
    var deletedConversationMemory: CoachConversationMemoryPayload?
    var coachFrontAgentPayload: CoachFrontAgentPayload = .defaultAuto
    var coachProposalsPayload: [JarvisProposalPayload] = []
    var coachMemoryPayload: [DataMemoryPayload] = []
    var openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
        source: "gateway-openclaw-registry-visibility",
        explanation: "registry",
        nativeRegistry: OpenClawNativeAgentsResponsePayload(
            source: "gateway-native-openclaw-registry",
            explanation: "native",
            totalAgents: 0,
            agents: []
        ),
        externalRuntime: .init(
            configured: false,
            reachable: false,
            baseUrl: nil,
            runtime: nil,
            runtimeVersion: nil,
            agentCount: 0,
            agents: [],
            matchedAgentIds: [],
            missingInExternal: [],
            unknownExternalAgents: [],
            error: nil
        )
    )
    var debugTracePayloadByID: [String: DebugTraceLookupPayload] = [:]

    private(set) var fetchConversationSessionsCallCount = 0
    private(set) var fetchConversationSessionDetailCallCount = 0
    private(set) var createConversationSessionCallCount = 0
    private(set) var sendConversationMessageCallCount = 0
    private(set) var retryConversationMessageCallCount = 0
    private(set) var submitConversationFeedbackCallCount = 0
    private(set) var deleteConversationMemoryCallCount = 0
    private(set) var fetchCoachFrontAgentCallCount = 0
    private(set) var fetchCoachProposalsCallCount = 0
    private(set) var fetchCoachMemoryCallCount = 0
    private(set) var fetchCoachDebugTraceCallCount = 0

    func loadStoredSession() -> AuthSessionState? { storedSession }
    func storeSession(_ authSession: AuthSessionState) throws { storedSession = authSession }
    func clearSession() { storedSession = nil }

    func signIn(email: String, password: String) async throws -> AuthSessionState {
        AuthSessionState(accessToken: "signin-token", refreshToken: nil, expiresAt: nil, user: AuthUser(id: "coach-user", email: email, provider: "gateway-local"))
    }

    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState {
        AuthSessionState(accessToken: "register-token", refreshToken: nil, expiresAt: nil, user: AuthUser(id: "coach-user", email: email, provider: "gateway-local"))
    }

    func fetchMe(token: String) async throws -> MePayload {
        MePayload(authenticated: true, user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local"))
    }

    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload { bootstrapPayload }
    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload {
        fetchCoachFrontAgentCallCount += 1
        return coachFrontAgentPayload
    }
    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload { payload }
    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload] {
        fetchCoachProposalsCallCount += 1
        return coachProposalsPayload
    }
    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload] {
        fetchCoachMemoryCallCount += 1
        return coachMemoryPayload
    }
    func fetchCoachDebugTrace(_ traceID: String, token: String) async throws -> DebugTraceLookupPayload {
        fetchCoachDebugTraceCallCount += 1
        return debugTracePayloadByID[traceID] ?? DebugTraceLookupPayload(traceId: traceID, agentRuns: [], matrixRuns: [], events: [], summary: nil)
    }
    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload { openClawRegistryVisibilityPayload }
    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload { throw NSError(domain: "unused", code: 1) }
    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload { throw NSError(domain: "unused", code: 1) }
    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload { throw NSError(domain: "unused", code: 1) }
    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload { throw NSError(domain: "unused", code: 1) }
    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload { inboxOverviewPayload }
    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload { stateTrendsPayload }
    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload { reflectionOverviewPayload }
    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }
    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }
    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws {}
    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws {}
    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message {
        InboxOverviewPayload.Message(id: messageID, title: "Ack", message: "Ack", channel: "desktop_local", status: "acknowledged", createdAt: "2026-03-20T00:00:00.000Z")
    }

    func createCoachConversationSession(title: String?, token: String) async throws -> CoachConversationSessionPayload {
        createConversationSessionCallCount += 1
        let created = createdConversationSession ?? CoachConversationSessionPayload(
            id: "session-created",
            userId: "coach-user",
            title: title ?? "New Coach Session",
            status: "active",
            createdAt: "2026-03-21T00:00:00.000Z",
            updatedAt: "2026-03-21T00:00:00.000Z",
            lastMessageAt: "2026-03-21T00:00:00.000Z"
        )
        conversationSessions.insert(created, at: 0)
        return created
    }

    func fetchCoachConversationSessions(token: String) async throws -> [CoachConversationSessionPayload] {
        fetchConversationSessionsCallCount += 1
        return conversationSessions
    }

    func fetchCoachConversationSession(_ sessionID: String, token: String) async throws -> CoachConversationSessionDetailPayload {
        fetchConversationSessionDetailCallCount += 1
        if !conversationDetailSequence.isEmpty {
            return conversationDetailSequence.removeFirst()
        }
        return conversationDetail ?? CoachConversationSessionDetailPayload(
            session: conversationSessions.first(where: { $0.id == sessionID }) ?? CoachConversationSessionPayload(
                id: sessionID,
                userId: "coach-user",
                title: "Fallback Session",
                status: "active",
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z",
                lastMessageAt: "2026-03-21T00:00:00.000Z"
            ),
            messages: []
        )
    }

    func sendCoachConversationMessage(sessionID: String, text: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        sendConversationMessageCallCount += 1
        return sentConversationResponse ?? CoachConversationSendMessageResponsePayload(
            userMessage: CoachConversationMessagePayload(
                id: "message-user",
                userId: "coach-user",
                sessionId: sessionID,
                role: "user",
                status: "completed",
                userText: text,
                fastResponse: nil,
                fullResponse: nil,
                usedMemoryIds: [],
                conversationPath: nil,
                traceId: "trace-default",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z"
            ),
            assistantMessage: CoachConversationMessagePayload(
                id: "message-assistant",
                userId: "coach-user",
                sessionId: sessionID,
                role: "assistant",
                status: "completed",
                userText: nil,
                fastResponse: "先把它收窄成一个最小下一步。",
                fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
                usedMemoryIds: [],
                conversationPath: .init(
                    frontAgent: "director-agent",
                    consultedAgent: nil,
                    authorityAgent: nil,
                    authorityTarget: nil,
                    authorityExecutionStatus: nil,
                    primaryRoute: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                    degraded: false,
                    degradedReason: nil
                ),
                traceId: "trace-default",
                errorCode: nil,
                createdAt: "2026-03-21T00:00:01.000Z",
                updatedAt: "2026-03-21T00:00:01.000Z"
            ),
            frontAgentState: .defaultAuto,
            fastResponse: "先把它收窄成一个最小下一步。",
            traceID: "trace-default"
        )
    }

    func retryCoachConversationMessage(_ messageID: String, token: String) async throws -> CoachConversationSendMessageResponsePayload {
        retryConversationMessageCallCount += 1
        let updated = retriedConversationMessage ?? CoachConversationMessagePayload(
            id: messageID,
            userId: "coach-user",
            sessionId: "session-1",
            role: "assistant",
            status: "completed",
            userText: nil,
            fastResponse: "先把它收窄成一个最小下一步。",
            fullResponse: "我先帮你把重点压缩成一个现在就能开始的动作。",
            usedMemoryIds: [],
            conversationPath: .init(
                frontAgent: "director-agent",
                consultedAgent: nil,
                authorityAgent: nil,
                authorityTarget: nil,
                authorityExecutionStatus: nil,
                primaryRoute: "cluster",
                usedOpenClaw: true,
                hadFallback: false,
                degraded: false,
                degradedReason: nil
            ),
            traceId: "trace-retry",
            errorCode: nil,
            createdAt: "2026-03-21T00:00:01.000Z",
            updatedAt: "2026-03-21T00:00:02.000Z"
        )
        if let detail = conversationDetail {
            let nextMessages = detail.messages.map { message in
                message.id == updated.id ? updated : message
            }
            conversationDetail = CoachConversationSessionDetailPayload(session: detail.session, messages: nextMessages)
        }
        return CoachConversationSendMessageResponsePayload(
            userMessage: CoachConversationMessagePayload(
                id: "message-user-retry",
                userId: "coach-user",
                sessionId: updated.sessionId,
                role: "user",
                status: "completed",
                userText: "retry source",
                fastResponse: nil,
                fullResponse: nil,
                usedMemoryIds: [],
                conversationPath: nil,
                traceId: updated.traceId,
                errorCode: nil,
                createdAt: "2026-03-21T00:00:00.000Z",
                updatedAt: "2026-03-21T00:00:00.000Z"
            ),
            assistantMessage: updated,
            frontAgentState: .defaultAuto,
            fastResponse: updated.fastResponse ?? "",
            traceID: updated.traceId ?? "trace-retry"
        )
    }

    func submitCoachConversationFeedback(messageID: String, label: String, reason: String?, token: String) async throws -> CoachConversationFeedbackPayload {
        submitConversationFeedbackCallCount += 1
        return CoachConversationFeedbackPayload(
            id: "feedback-1",
            userId: "coach-user",
            sessionId: "session-1",
            messageId: messageID,
            label: label,
            reason: reason,
            createdAt: "2026-03-21T00:00:03.000Z"
        )
    }

    func fetchCoachConversationMemory(token: String) async throws -> [CoachConversationMemoryPayload] {
        conversationMemory
    }

    func deleteCoachConversationMemory(_ memoryID: String, token: String) async throws -> CoachConversationMemoryPayload {
        deleteConversationMemoryCallCount += 1
        let updated = deletedConversationMemory ?? CoachConversationMemoryPayload(
            id: memoryID,
            userId: "coach-user",
            kind: "preference",
            summary: "用户更适合明确的最小下一步",
            confidence: 0.9,
            status: "revoked",
            sourceMessageId: "message-assistant-1",
            sourceExcerpt: "来自对话的摘要。",
            createdAt: "2026-03-21T00:00:03.000Z",
            lastUsedAt: nil,
            revokedAt: "2026-03-21T00:10:00.000Z"
        )
        if let index = conversationMemory.firstIndex(where: { $0.id == updated.id }) {
            conversationMemory[index] = updated
        }
        return updated
    }
}

private final class ConversationNoopCollector: DesktopActivityCollecting {
    func start() {}
    func stop() {}
    func flushPendingSignals() {}
    func simulateFrontmostAppChange(to applicationName: String) {}
    func simulateIdleCheck(secondsIdle: TimeInterval) {}
    func simulateLock() {}
    func simulateUnlock() {}
}

private func makeConversationTempDirectory() -> URL {
    let url = URL(fileURLWithPath: NSTemporaryDirectory())
        .appendingPathComponent("mindanchor-conversation-tests-\(UUID().uuidString)", isDirectory: true)
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    return url
}

private extension AppConfiguration {
    static let conversationTestValue = AppConfiguration(
        apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
        supabaseURL: nil,
        supabaseAnonKey: nil,
        authDevToken: nil,
        debugAuthBootstrap: nil,
        notificationSnoozeMinutes: 15,
        inboxPollInterval: 30,
        heartbeatInterval: 60,
        idleThresholdSeconds: 120,
        authSessionAccount: "mindanchor-auth-session-conversation-tests",
        reminderPollingOnly: false
    )
}

private extension ClientBootstrapPayload {
    static func fixture(userID: String, coachFrontAgent: CoachFrontAgentPayload?) -> ClientBootstrapPayload {
        ClientBootstrapPayload(
            me: MePayload(authenticated: true, user: AuthUser(id: userID, email: "coach@example.com", provider: "gateway-local")),
            dashboard: DashboardSummaryPayload(
                goalCount: 0,
                taskCount: 0,
                openInterventions: 0,
                completionRate: 0,
                coachFrontAgent: coachFrontAgent,
                latestAssessment: nil,
                latestRecoveryPlan: nil,
                latestBehaviorConclusion: nil,
                goals: [],
                tasks: []
            ),
            inboxOverview: .fixture(messages: []),
            goalFlow: GoalFlowOverviewPayload(
                goals: [],
                tasks: [],
                suggestedFocusTaskId: nil,
                summaryHeadline: "Ready",
                latestAssessment: nil,
                latestRecoveryPlan: nil
            ),
            permissions: AppPermissionHint(
                notificationChannelRecommended: "desktop_local",
                desktopSignalsExpected: true,
                accessibilityRecommended: true
            )
        )
    }
}

private extension InboxOverviewPayload {
    static func fixture(messages: [InboxOverviewPayload.Message]) -> InboxOverviewPayload {
        InboxOverviewPayload(
            messages: messages,
            pendingMessages: messages.filter { $0.status == "pending" },
            acknowledgedMessages: messages.filter { $0.status == "acknowledged" },
            channelCounts: []
        )
    }
}

private extension StateTrendsPayload {
    static let fixture = StateTrendsPayload(currentAssessment: nil, assessments: [], activeInputs: [])
}

private extension ReflectionOverviewPayload {
    static let fixture = ReflectionOverviewPayload(latestWeekly: nil, latestMonthly: nil, reports: [])
}
