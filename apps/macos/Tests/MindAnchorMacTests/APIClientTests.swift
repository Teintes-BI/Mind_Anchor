import XCTest
@testable import MindAnchorCore

final class APIClientTests: XCTestCase {
    func testFetchBootstrapIncludesBearerToken() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/client/bootstrap")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "me": { "authenticated": true, "user": { "id": "user-1", "email": "user@example.com", "provider": "gateway-local" } },
                  "dashboard": {
                    "goalCount": 0,
                    "taskCount": 0,
                    "openInterventions": 0,
                    "completionRate": 0,
                    "coachFrontAgent": {
                      "currentFrontAgent": "director-agent",
                      "routingMode": "auto",
                      "manualOverride": false,
                      "consultedAgent": null,
                      "handoffReason": null,
                      "overrideSourceAgent": null,
                      "visibleSummary": "Picard is currently coordinating the team."
                    },
                    "latestAssessment": null,
                    "latestRecoveryPlan": null,
                    "latestBehaviorConclusion": null,
                    "goals": [],
                    "tasks": []
                  },
                  "inboxOverview": {
                    "messages": [],
                    "pendingMessages": [],
                    "acknowledgedMessages": [],
                    "channelCounts": []
                  },
                  "goalFlow": {
                    "goals": [],
                    "tasks": [],
                    "suggestedFocusTaskId": null,
                    "summaryHeadline": "Ready",
                    "latestAssessment": null,
                    "latestRecoveryPlan": null
                  },
                  "permissions": {
                    "notificationChannelRecommended": "desktop_local",
                    "desktopSignalsExpected": true,
                    "accessibilityRecommended": true
                  }
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchBootstrap(token: "token-123")
        XCTAssertEqual(payload.me.user?.id, "user-1")
        XCTAssertEqual(payload.permissions.notificationChannelRecommended, "desktop_local")
        XCTAssertEqual(payload.dashboard.coachFrontAgent?.currentFrontAgent, "director-agent")
    }

    func testStoreAndLoadSessionUsesInjectedKeychain() throws {
        let keychain = MockKeychainStore()
        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: URLProtocolMock.self),
            keychainStore: keychain
        )

        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: Date(timeIntervalSince1970: 1_700_000_000),
            user: AuthUser(id: "user-1", email: "stored@example.com", provider: "gateway-local")
        )

        try client.storeSession(session)
        let restored = client.loadStoredSession()

        XCTAssertEqual(restored, session)
        XCTAssertEqual(keychain.savedAccount, "mindanchor-auth-session")
    }

    func testStoreAndLoadSessionUsesConfiguredStorageAccount() throws {
        let keychain = MockKeychainStore()
        let configuration = AppConfiguration(
            apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
            supabaseURL: nil,
            supabaseAnonKey: nil,
            authDevToken: nil,
            debugAuthBootstrap: nil,
            notificationSnoozeMinutes: 15,
            inboxPollInterval: 30,
            heartbeatInterval: 60,
            idleThresholdSeconds: 120,
            authSessionAccount: "mindanchor-auth-session-e2e",
            reminderPollingOnly: false
        )
        let client = APIClient(
            configuration: configuration,
            session: makeURLSession(protocolType: URLProtocolMock.self),
            keychainStore: keychain
        )

        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: Date(timeIntervalSince1970: 1_700_000_000),
            user: AuthUser(id: "user-1", email: "stored@example.com", provider: "gateway-local")
        )

        try client.storeSession(session)
        let restored = client.loadStoredSession()

        XCTAssertEqual(restored, session)
        XCTAssertEqual(keychain.savedAccount, "mindanchor-auth-session-e2e")
    }

    func testFetchInboxOverviewIncludesBearerToken() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-456")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/client/inbox/overview")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "messages": [
                    {
                      "id": "msg-1",
                      "title": "Take a breath",
                      "message": "Stand up for two minutes.",
                      "channel": "desktop_local",
                      "status": "pending",
                      "createdAt": "2026-03-20T00:00:00.000Z"
                    }
                  ],
                  "pendingMessages": [
                    {
                      "id": "msg-1",
                      "title": "Take a breath",
                      "message": "Stand up for two minutes.",
                      "channel": "desktop_local",
                      "status": "pending",
                      "createdAt": "2026-03-20T00:00:00.000Z"
                    }
                  ],
                  "acknowledgedMessages": [],
                  "channelCounts": []
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchInboxOverview(token: "token-456")
        XCTAssertEqual(payload.pendingMessages.count, 1)
        XCTAssertEqual(payload.pendingMessages.first?.id, "msg-1")
    }

    func testFetchCoachFrontAgentIncludesBearerToken() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-front")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/front-agent")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "currentFrontAgent": "life-secretary-agent",
                  "routingMode": "manual",
                  "manualOverride": true,
                  "consultedAgent": "analyst-agent",
                  "handoffReason": "plan_write_requires_jarvis",
                  "overrideSourceAgent": "analyst-agent",
                  "visibleSummary": "Jarvis is taking over the plan write."
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchCoachFrontAgent(token: "token-front")
        XCTAssertEqual(payload.currentFrontAgent, "life-secretary-agent")
        XCTAssertEqual(payload.manualOverride, true)
        XCTAssertEqual(payload.consultedAgent, "analyst-agent")
        XCTAssertEqual(payload.handoffReason, "plan_write_requires_jarvis")
        XCTAssertEqual(payload.visibleSummary, "Jarvis is taking over the plan write.")
    }

    func testFetchOpenClawRegistryVisibilityIncludesBearerTokenAndDecodesPayload() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-registry")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/debug/openclaw/registry-visibility")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "source": "gateway-openclaw-registry-visibility",
                  "explanation": "registry visibility",
                  "nativeRegistry": {
                    "source": "gateway-native-openclaw-registry",
                    "explanation": "native registry",
                    "totalAgents": 6,
                    "agents": [
                      {
                        "agentId": "director-agent",
                        "displayName": "Picard",
                        "runtimeAgentId": "picard-runtime-agent",
                        "worker": "director-agent-worker",
                        "modelTarget": "director-agent",
                        "soulFilePath": "openclaw/souls/picard.md",
                        "supportedWorkflows": ["coach_front_state", "persona_routing"],
                        "memoryScopes": ["preferences", "constraints"],
                        "canFront": true,
                        "canConsult": true,
                        "canWritePlans": false,
                        "canGovernMemory": false,
                        "visibleInLocalRuntime": true
                      }
                    ]
                  },
                  "externalRuntime": {
                    "healthStatus": "attention",
                    "healthReasonCodes": ["workflow_execution_probe_mismatch", "runtime_contract_mismatch"],
                    "healthIssueCounts": {
                      "missingPersonaCount": 0,
                      "contractMismatchCount": 1,
                      "runtimeContractMismatchCount": 1,
                      "workflowContractMismatchCount": 1,
                      "workflowResponseContractMismatchCount": 1,
                      "workflowExecutionContractMismatchCount": 1,
                      "workflowExecutionProbeMismatchCount": 1,
                      "unknownExternalAgentCount": 1,
                      "totalIssueCount": 6
                    },
                    "configured": true,
                    "reachable": true,
                    "baseUrl": "http://127.0.0.1:8788",
                    "runtime": "openclaw-local-cluster",
                    "runtimeVersion": "structured-local-runtime-phase1",
                    "agentCount": 15,
                    "agents": [
                      {
                        "name": "director-agent",
                        "worker": "director-agent-worker",
                        "modelTarget": "director-agent",
                        "skillCount": 2,
                        "supportedWorkflows": ["coach_front_state", "persona_routing"]
                      }
                    ],
                    "matchedAgentIds": ["director-agent"],
                    "missingInExternal": [],
                    "contractMismatches": [
                      {
                        "agentId": "director-agent",
                        "mismatchFields": ["supportedWorkflows", "canConsult"]
                      }
                    ],
                    "runtimeContractMismatches": ["responseMode"],
                    "workflowContractMismatches": [
                      {
                        "workflow": "coach_conversation_full",
                        "missingRequiredContextFields": ["frontAgent", "userText"]
                      }
                    ],
                    "workflowResponseContractMismatches": [
                      {
                        "workflow": "coach_conversation_full",
                        "missingRequiredParsedFields": ["fastResponse"]
                      }
                    ],
                    "workflowExecutionContractMismatches": [
                      {
                        "workflow": "plan_adjustment",
                        "missingRequiredMetadataFields": ["authorityApply"],
                        "missingMemoryFetchFields": [],
                        "missingAuthorityApplyFields": ["status"]
                      }
                    ],
                    "workflowExecutionProbeMismatches": [
                      {
                        "workflow": "memory_governance",
                        "target": "memory-governor-agent",
                        "statusCode": 500,
                        "missingRequiredMetadataFields": ["authorityApply"],
                        "missingMemoryFetchFields": [],
                        "missingAuthorityApplyFields": ["status"],
                        "error": "Probe returned HTTP 500."
                      }
                    ],
                    "unknownExternalAgents": ["chief-agent"],
                    "error": null
                  }
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchOpenClawRegistryVisibility(token: "token-registry")
        XCTAssertEqual(payload.nativeRegistry.totalAgents, 6)
        XCTAssertEqual(payload.nativeRegistry.agents.first?.displayName, "Picard")
        XCTAssertEqual(payload.externalRuntime.baseUrl, "http://127.0.0.1:8788")
        XCTAssertEqual(payload.externalRuntime.matchedAgentIds, ["director-agent"])
        XCTAssertEqual(payload.externalRuntime.unknownExternalAgents, ["chief-agent"])
        XCTAssertEqual(payload.externalRuntime.contractMismatches.first?.agentId, "director-agent")
        XCTAssertEqual(payload.externalRuntime.runtimeContractMismatches, ["responseMode"])
        XCTAssertEqual(payload.externalRuntime.workflowContractMismatches.first?.workflow, "coach_conversation_full")
        XCTAssertEqual(payload.externalRuntime.workflowResponseContractMismatches.first?.missingRequiredParsedFields, ["fastResponse"])
        XCTAssertEqual(payload.externalRuntime.workflowExecutionContractMismatches.first?.workflow, "plan_adjustment")
        XCTAssertEqual(payload.externalRuntime.workflowExecutionProbeMismatches.first?.target, "memory-governor-agent")
    }

    func testUpdateCoachFrontAgentPostsJSONBody() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-update")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/front-agent")

            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["currentFrontAgent"] as? String, "companion-agent")
            XCTAssertEqual(decoded["routingMode"] as? String, "manual")
            XCTAssertEqual(decoded["manualOverride"] as? Bool, true)
            XCTAssertEqual(decoded["consultedAgent"] as? String, "analyst-agent")
            XCTAssertEqual(decoded["handoffReason"] as? String, "memory_governance_requires_data")
            XCTAssertEqual(decoded["overrideSourceAgent"] as? String, "balance-agent")
            XCTAssertEqual(decoded["visibleSummary"] as? String, "Deanna Troi stays front while Data handles memory governance.")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "currentFrontAgent": "companion-agent",
                  "routingMode": "manual",
                  "manualOverride": true,
                  "consultedAgent": "analyst-agent",
                  "handoffReason": "memory_governance_requires_data",
                  "overrideSourceAgent": "balance-agent",
                  "visibleSummary": "Deanna Troi stays front while Data handles memory governance."
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = CoachFrontAgentPayload(
            currentFrontAgent: "companion-agent",
            routingMode: "manual",
            manualOverride: true,
            consultedAgent: "analyst-agent",
            handoffReason: "memory_governance_requires_data",
            overrideSourceAgent: "balance-agent",
            visibleSummary: "Deanna Troi stays front while Data handles memory governance."
        )
        let updated = try await client.updateCoachFrontAgent(payload: payload, token: "token-update")

        XCTAssertEqual(updated.currentFrontAgent, "companion-agent")
        XCTAssertEqual(updated.manualOverride, true)
        XCTAssertEqual(updated.overrideSourceAgent, "balance-agent")
        XCTAssertEqual(updated.visibleSummary, "Deanna Troi stays front while Data handles memory governance.")
    }

    func testFetchCoachProposalsDecodesArrayPayload() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-proposals")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/proposals")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                [
                  {
                    "id": "proposal-1",
                    "userId": "user-1",
                    "actorType": "agent",
                    "actorAgent": "life-secretary-agent",
                    "riskLevel": "high",
                    "status": "proposal",
                    "summary": "Move tomorrow's client block.",
                    "beforeStateSummary": "Tomorrow afternoon client block.",
                    "afterStateSummary": "Next Tuesday afternoon client block.",
                    "rationale": "Current load is unsafe.",
                    "createdAt": "2026-03-21T00:00:00.000Z",
                    "approvedAt": null
                  }
                ]
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchCoachProposals(token: "token-proposals")
        XCTAssertEqual(payload.count, 1)
        XCTAssertEqual(payload.first?.actorAgent, "life-secretary-agent")
        XCTAssertEqual(payload.first?.status, "proposal")
    }

    func testFetchCoachMemoryDecodesArrayPayload() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-memory")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/memory")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                [
                  {
                    "candidateId": "candidate-1",
                    "memoryId": "memory-1",
                    "status": "accepted",
                    "sourceAgent": "companion-agent",
                    "sourceTurnRef": "turn-1",
                    "summary": "The user prefers short recovery steps.",
                    "effectiveAt": "2026-03-21T00:00:00.000Z",
                    "recallBlockedAt": null,
                    "deletedAt": null
                  }
                ]
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let payload = try await client.fetchCoachMemory(token: "token-memory")
        XCTAssertEqual(payload.count, 1)
        XCTAssertEqual(payload.first?.candidateId, "candidate-1")
        XCTAssertEqual(payload.first?.memoryId, "memory-1")
        XCTAssertEqual(payload.first?.status, "accepted")
    }

    func testApproveCoachProposalPostsActionEndpoint() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-approve")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/proposals/proposal-1/approve")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "proposal-1",
                  "userId": "user-1",
                  "actorType": "agent",
                  "actorAgent": "life-secretary-agent",
                  "riskLevel": "high",
                  "status": "approved",
                  "summary": "Move tomorrow's client block.",
                  "beforeStateSummary": "Tomorrow afternoon client block.",
                  "afterStateSummary": "Next Tuesday afternoon client block.",
                  "rationale": "Current load is unsafe.",
                  "createdAt": "2026-03-21T00:00:00.000Z",
                  "approvedAt": "2026-03-21T01:00:00.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let proposal = try await client.approveCoachProposal("proposal-1", token: "token-approve")
        XCTAssertEqual(proposal.status, "approved")
        XCTAssertEqual(proposal.approvedAt, "2026-03-21T01:00:00.000Z")
    }

    func testRejectCoachProposalPostsActionEndpoint() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-reject")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/proposals/proposal-1/reject")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "proposal-1",
                  "userId": "user-1",
                  "actorType": "agent",
                  "actorAgent": "life-secretary-agent",
                  "riskLevel": "high",
                  "status": "rejected",
                  "summary": "Move tomorrow's client block.",
                  "beforeStateSummary": "Tomorrow afternoon client block.",
                  "afterStateSummary": "Next Tuesday afternoon client block.",
                  "rationale": "Current load is unsafe.",
                  "createdAt": "2026-03-21T00:00:00.000Z",
                  "approvedAt": null
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let proposal = try await client.rejectCoachProposal("proposal-1", token: "token-reject")
        XCTAssertEqual(proposal.status, "rejected")
        XCTAssertNil(proposal.approvedAt)
    }

    func testBlockCoachMemoryRecallPostsActionEndpoint() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-block")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/memory/memory-1/recall-block")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "candidateId": "candidate-1",
                  "memoryId": "memory-1",
                  "status": "recall_blocked",
                  "sourceAgent": "companion-agent",
                  "sourceTurnRef": "turn-1",
                  "summary": "The user prefers short recovery steps.",
                  "effectiveAt": "2026-03-21T00:00:00.000Z",
                  "recallBlockedAt": "2026-03-21T01:30:00.000Z",
                  "deletedAt": null
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let memory = try await client.blockCoachMemoryRecall("memory-1", token: "token-block")
        XCTAssertEqual(memory.status, "recall_blocked")
        XCTAssertEqual(memory.recallBlockedAt, "2026-03-21T01:30:00.000Z")
    }

    func testDeleteCoachMemoryPostsActionEndpoint() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-delete")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/memory/memory-1/delete")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "candidateId": "candidate-1",
                  "memoryId": "memory-1",
                  "status": "deleted",
                  "sourceAgent": "companion-agent",
                  "sourceTurnRef": "turn-1",
                  "summary": "The user prefers short recovery steps.",
                  "effectiveAt": "2026-03-21T00:00:00.000Z",
                  "recallBlockedAt": null,
                  "deletedAt": "2026-03-21T02:00:00.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let memory = try await client.deleteCoachMemory("memory-1", token: "token-delete")
        XCTAssertEqual(memory.status, "deleted")
        XCTAssertEqual(memory.deletedAt, "2026-03-21T02:00:00.000Z")
    }

    func testCreateCoachConversationSessionPostsTitleAndDecodesSession() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-conversation-session")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/sessions")

            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["title"] as? String, "整理一下今天的混乱")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "session-1",
                  "userId": "coach-user",
                  "title": "整理一下今天的混乱",
                  "status": "active",
                  "createdAt": "2026-03-21T00:00:00.000Z",
                  "updatedAt": "2026-03-21T00:00:00.000Z",
                  "lastMessageAt": "2026-03-21T00:00:00.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let session = try await client.createCoachConversationSession(title: "整理一下今天的混乱", token: "token-conversation-session")
        XCTAssertEqual(session.id, "session-1")
        XCTAssertEqual(session.title, "整理一下今天的混乱")
        XCTAssertEqual(session.status, "active")
    }

    func testCreateCoachConversationSessionOmitsTitleWhenNil() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-conversation-session-nil")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/sessions")

            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertNil(decoded["title"])

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "session-nil",
                  "userId": "coach-user",
                  "title": "New Coach Session",
                  "status": "active",
                  "createdAt": "2026-03-21T00:00:00.000Z",
                  "updatedAt": "2026-03-21T00:00:00.000Z",
                  "lastMessageAt": null
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let session = try await client.createCoachConversationSession(title: nil, token: "token-conversation-session-nil")
        XCTAssertEqual(session.id, "session-nil")
    }

    func testFetchCoachConversationSessionsDecodesArrayPayload() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-conversation-list")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/sessions")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                [
                  {
                    "id": "session-1",
                    "userId": "coach-user",
                    "title": "整理一下今天的混乱",
                    "status": "active",
                    "createdAt": "2026-03-21T00:00:00.000Z",
                    "updatedAt": "2026-03-21T00:00:00.000Z",
                    "lastMessageAt": "2026-03-21T00:00:00.000Z"
                  }
                ]
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let sessions = try await client.fetchCoachConversationSessions(token: "token-conversation-list")
        XCTAssertEqual(sessions.count, 1)
        XCTAssertEqual(sessions.first?.id, "session-1")
    }

    func testFetchCoachConversationSessionDecodesPendingCompletedAndFailedAssistantStates() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-conversation-detail")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/sessions/session-1")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "session": {
                    "id": "session-1",
                    "userId": "coach-user",
                    "title": "整理一下今天的混乱",
                    "status": "active",
                    "createdAt": "2026-03-21T00:00:00.000Z",
                    "updatedAt": "2026-03-21T00:00:00.000Z",
                    "lastMessageAt": "2026-03-21T00:00:00.000Z"
                  },
                  "messages": [
                    {
                      "id": "message-pending",
                      "userId": "coach-user",
                      "sessionId": "session-1",
                      "role": "assistant",
                      "status": "pending_full",
                      "userText": null,
                      "fastResponse": "先别急，先把它收窄成一个最小下一步。",
                      "fullResponse": null,
                      "usedMemoryIds": [],
                      "usedMemoryEntries": [],
                      "conversationPath": {
                        "frontAgent": "companion-agent",
                        "consultedAgent": "analyst-agent",
                        "authorityAgent": null,
                        "authorityTarget": null,
                        "authorityExecutionStatus": null,
                        "primaryRoute": "cluster",
                        "usedOpenClaw": true,
                        "hadFallback": false,
                        "degraded": false,
                        "degradedReason": null
                      },
                      "traceId": "trace-pending",
                      "errorCode": null,
                      "createdAt": "2026-03-21T00:00:01.000Z",
                      "updatedAt": "2026-03-21T00:00:01.000Z"
                    },
                    {
                      "id": "message-completed",
                      "userId": "coach-user",
                      "sessionId": "session-1",
                      "role": "assistant",
                      "status": "completed",
                      "userText": null,
                      "fastResponse": "先别急，先把它收窄成一个最小下一步。",
                      "fullResponse": "我先帮你把重点压缩成一个现在就能开始的动作。",
                      "usedMemoryIds": ["memory-1"],
                      "usedMemoryEntries": [
                        {
                          "memoryId": "memory-1",
                          "summary": "用户偏好短句、明确下一步。",
                          "kind": "preference",
                          "source": "coach-memory"
                        }
                      ],
                      "conversationPath": {
                        "frontAgent": "companion-agent",
                        "consultedAgent": "analyst-agent",
                        "authorityAgent": null,
                        "authorityTarget": null,
                        "authorityExecutionStatus": null,
                        "primaryRoute": "cluster",
                        "usedOpenClaw": true,
                        "hadFallback": false,
                        "degraded": false,
                        "degradedReason": null
                      },
                      "traceId": "trace-completed",
                      "errorCode": null,
                      "createdAt": "2026-03-21T00:00:01.000Z",
                      "updatedAt": "2026-03-21T00:00:02.000Z"
                    },
                    {
                      "id": "message-failed",
                      "userId": "coach-user",
                      "sessionId": "session-1",
                      "role": "assistant",
                      "status": "failed",
                      "userText": null,
                      "fastResponse": "先别急，先把它收窄成一个最小下一步。",
                      "fullResponse": null,
                      "usedMemoryIds": [],
                      "usedMemoryEntries": [],
                      "conversationPath": {
                        "frontAgent": "director-agent",
                        "consultedAgent": null,
                        "authorityAgent": null,
                        "authorityTarget": null,
                        "authorityExecutionStatus": null,
                        "primaryRoute": "provider-fallback",
                        "usedOpenClaw": true,
                        "hadFallback": true,
                        "degraded": true,
                        "degradedReason": "cluster_fallback"
                      },
                      "traceId": "trace-failed",
                      "errorCode": "coach_full_generation_failed",
                      "createdAt": "2026-03-21T00:00:01.000Z",
                      "updatedAt": "2026-03-21T00:00:03.000Z"
                    }
                  ]
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let detail = try await client.fetchCoachConversationSession("session-1", token: "token-conversation-detail")
        XCTAssertEqual(detail.messages.count, 3)
        XCTAssertEqual(detail.messages[0].status, "pending_full")
        XCTAssertEqual(detail.messages[0].fastResponse, "先别急，先把它收窄成一个最小下一步。")
        XCTAssertNil(detail.messages[0].fullResponse)
        XCTAssertEqual(detail.messages[1].status, "completed")
        XCTAssertEqual(detail.messages[1].fullResponse, "我先帮你把重点压缩成一个现在就能开始的动作。")
        XCTAssertEqual(detail.messages[1].usedMemoryEntries.first?.summary, "用户偏好短句、明确下一步。")
        XCTAssertEqual(detail.messages[2].status, "failed")
        XCTAssertEqual(detail.messages[2].errorCode, "coach_full_generation_failed")
        XCTAssertEqual(detail.messages[2].conversationPath?.degraded, true)
    }

    func testSendCoachConversationMessagePostsJSONBodyAndDecodesFastFullResponse() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-send-conversation")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/sessions/session-1/messages")

            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["text"] as? String, "我现在很乱，不知道先做什么。")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "userMessage": {
                    "id": "message-user-1",
                    "userId": "coach-user",
                    "sessionId": "session-1",
                    "role": "user",
                    "status": "completed",
                    "userText": "我现在很乱，不知道先做什么。",
                    "fastResponse": null,
                    "fullResponse": null,
                    "usedMemoryIds": [],
                    "traceId": "trace-1",
                    "errorCode": null,
                    "createdAt": "2026-03-21T00:00:00.000Z",
                    "updatedAt": "2026-03-21T00:00:00.000Z"
                  },
                  "frontAgentState": {
                    "currentFrontAgent": "companion-agent",
                    "routingMode": "auto",
                    "manualOverride": false,
                    "consultedAgent": "analyst-agent",
                    "handoffReason": null,
                    "overrideSourceAgent": null,
                    "visibleSummary": "Deanna Troi is currently leading this turn.",
                    "updatedAt": "2026-03-21T00:00:01.000Z"
                  },
                  "fastResponse": "先别急，先把这件事收窄成一个最小下一步。",
                  "traceId": "trace-1",
                  "assistantMessage": {
                    "id": "message-assistant-1",
                    "userId": "coach-user",
                    "sessionId": "session-1",
                    "role": "assistant",
                    "status": "pending_full",
                    "userText": null,
                    "fastResponse": "先别急，先把这件事收窄成一个最小下一步。",
                    "fullResponse": null,
                    "usedMemoryIds": ["memory-1"],
                    "usedMemoryEntries": [
                      {
                        "memoryId": "memory-1",
                        "summary": "用户偏好短句、明确下一步。",
                        "kind": "preference",
                        "source": "coach-memory"
                      },
                      {
                        "memoryId": null,
                        "summary": "今天下午还有会议，建议先做 10 分钟可收口的小步。",
                        "kind": "constraint",
                        "source": "gateway-memory"
                      }
                    ],
                    "conversationPath": {
                      "frontAgent": "companion-agent",
                      "consultedAgent": "analyst-agent",
                      "authorityAgent": null,
                      "authorityTarget": null,
                      "authorityExecutionStatus": null,
                      "primaryRoute": "cluster",
                      "usedOpenClaw": true,
                      "hadFallback": false,
                      "degraded": false,
                      "degradedReason": null
                    },
                    "traceId": "trace-1",
                    "errorCode": null,
                    "createdAt": "2026-03-21T00:00:01.000Z",
                    "updatedAt": "2026-03-21T00:00:01.000Z"
                  }
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let response = try await client.sendCoachConversationMessage(
            sessionID: "session-1",
            text: "我现在很乱，不知道先做什么。",
            token: "token-send-conversation"
        )
        XCTAssertEqual(response.userMessage.role, "user")
        XCTAssertEqual(response.assistantMessage.role, "assistant")
        XCTAssertEqual(response.assistantMessage.status, "pending_full")
        XCTAssertEqual(response.assistantMessage.usedMemoryIds, ["memory-1"])
        XCTAssertEqual(response.assistantMessage.usedMemoryEntries.count, 2)
        XCTAssertEqual(response.assistantMessage.usedMemoryEntries.first?.summary, "用户偏好短句、明确下一步。")
        XCTAssertEqual(response.assistantMessage.usedMemoryEntries.last?.source, "gateway-memory")
        XCTAssertNil(response.assistantMessage.fullResponse)
        XCTAssertEqual(response.fastResponse, "先别急，先把这件事收窄成一个最小下一步。")
        XCTAssertEqual(response.traceID, "trace-1")
        XCTAssertEqual(response.frontAgentState.currentFrontAgent, "companion-agent")
        XCTAssertEqual(response.assistantMessage.conversationPath?.frontAgent, "companion-agent")
        XCTAssertEqual(response.assistantMessage.conversationPath?.consultedAgent, "analyst-agent")
        XCTAssertEqual(response.assistantMessage.conversationPath?.primaryRoute, "cluster")
        XCTAssertEqual(response.assistantMessage.conversationPath?.usedOpenClaw, true)
    }

    func testRetryAndFeedbackConversationEndpointsUseDedicatedCoachPaths() async throws {
        let protocolMock = URLProtocolMock.self
        var requestCount = 0
        protocolMock.requestHandler = { request in
            requestCount += 1
            if requestCount == 1 {
                XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-retry-conversation")
                XCTAssertEqual(request.httpMethod, "POST")
                XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/messages/message-assistant-1/retry")

                return (
                    HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                    """
                    {
                      "userMessage": {
                        "id": "message-user-1",
                        "userId": "coach-user",
                        "sessionId": "session-1",
                        "role": "user",
                        "status": "completed",
                        "userText": "帮我把今天的情况重新理顺。",
                        "fastResponse": null,
                        "fullResponse": null,
                        "usedMemoryIds": [],
                        "usedMemoryEntries": [],
                        "conversationPath": null,
                        "traceId": "trace-2",
                        "errorCode": null,
                        "createdAt": "2026-03-21T00:00:00.000Z",
                        "updatedAt": "2026-03-21T00:00:00.000Z"
                      },
                      "assistantMessage": {
                        "id": "message-assistant-1",
                        "userId": "coach-user",
                        "sessionId": "session-1",
                        "role": "assistant",
                        "status": "completed",
                        "userText": null,
                        "fastResponse": "先别急，先把这件事收窄成一个最小下一步。",
                        "fullResponse": "我先帮你把问题拆成一个可执行起点，再决定是否继续扩展。",
                        "usedMemoryIds": ["memory-1"],
                        "usedMemoryEntries": [],
                        "conversationPath": {
                          "frontAgent": "director-agent",
                          "consultedAgent": null,
                          "authorityAgent": null,
                          "authorityTarget": null,
                          "authorityExecutionStatus": null,
                          "primaryRoute": "provider-fallback",
                          "usedOpenClaw": true,
                          "hadFallback": true,
                          "degraded": true,
                          "degradedReason": "cluster_fallback"
                        },
                        "traceId": "trace-2",
                        "errorCode": null,
                        "createdAt": "2026-03-21T00:00:01.000Z",
                        "updatedAt": "2026-03-21T00:00:02.000Z"
                      },
                      "frontAgentState": {
                        "currentFrontAgent": "director-agent",
                        "routingMode": "auto",
                        "manualOverride": false,
                        "consultedAgent": null,
                        "handoffReason": null,
                        "overrideSourceAgent": null,
                        "visibleSummary": "Picard routed this turn to director-agent.",
                        "updatedAt": "2026-03-21T00:00:02.000Z"
                      },
                      "fastResponse": "先别急，先把这件事收窄成一个最小下一步。",
                      "traceId": "trace-2"
                    }
                    """.data(using: .utf8)!
                )
            }

            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-feedback-conversation")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/messages/message-assistant-1/feedback")
            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["label"] as? String, "helpful")
            XCTAssertEqual(decoded["reason"] as? String, "更符合我的节奏")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "feedback-1",
                  "userId": "coach-user",
                  "sessionId": "session-1",
                  "messageId": "message-assistant-1",
                  "label": "helpful",
                  "reason": "更符合我的节奏",
                  "createdAt": "2026-03-21T00:00:03.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let retried = try await client.retryCoachConversationMessage("message-assistant-1", token: "token-retry-conversation")
        XCTAssertEqual(retried.assistantMessage.id, "message-assistant-1")
        XCTAssertEqual(retried.assistantMessage.status, "completed")
        XCTAssertEqual(retried.frontAgentState.currentFrontAgent, "director-agent")
        XCTAssertEqual(retried.assistantMessage.conversationPath?.degraded, true)
        XCTAssertEqual(retried.traceID, "trace-2")

        let feedback = try await client.submitCoachConversationFeedback(
            messageID: "message-assistant-1",
            label: "helpful",
            reason: "更符合我的节奏",
            token: "token-feedback-conversation"
        )
        XCTAssertEqual(feedback.label, "helpful")
        XCTAssertEqual(feedback.reason, "更符合我的节奏")
    }

    func testFetchCoachDebugTraceDecodesExecutionEvents() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-trace")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/debug/traces/trace-1")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "traceId": "trace-1",
                  "agentRuns": [],
                  "matrixRuns": [],
                  "events": [
                    {
                      "id": "event-1",
                      "traceId": "trace-1",
                      "level": "info",
                      "component": "conversation-coach",
                      "event": "coach.consult.completed",
                      "message": "Coach consult completed",
                      "metadata": {
                        "consultedAgent": "analyst-agent",
                        "frontAgent": "companion-agent"
                      },
                      "createdAt": "2026-03-21T00:00:03.000Z"
                    },
                    {
                      "id": "event-2",
                      "traceId": "trace-1",
                      "level": "info",
                      "component": "conversation-coach",
                      "event": "coach.authority.handoff.completed",
                      "message": "Coach authority handoff completed",
                      "metadata": {
                        "authorityAgent": "memory-governor-agent",
                        "action": "delete_memory",
                        "executionStatus": "deleted"
                      },
                      "createdAt": "2026-03-21T00:00:04.000Z"
                    }
                  ]
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let trace = try await client.fetchCoachDebugTrace("trace-1", token: "token-trace")
        XCTAssertEqual(trace.traceId, "trace-1")
        XCTAssertEqual(trace.events.count, 2)
        XCTAssertEqual(trace.events.first?.event, "coach.consult.completed")
        XCTAssertEqual(trace.events.last?.metadata["executionStatus"]?.stringValue, "deleted")
    }

    func testSubmitCoachConversationFeedbackOmitsReasonKeyWhenNil() async throws {
        let protocolMock = URLProtocolMock.self
        protocolMock.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-feedback-nil")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/messages/message-assistant-1/feedback")

            let body = try XCTUnwrap(request.httpBody ?? readBody(from: request))
            let decoded = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(decoded["label"] as? String, "helpful")
            XCTAssertNil(decoded["reason"])

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "feedback-2",
                  "userId": "coach-user",
                  "sessionId": "session-1",
                  "messageId": "message-assistant-1",
                  "label": "helpful",
                  "reason": null,
                  "createdAt": "2026-03-21T00:00:03.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let feedback = try await client.submitCoachConversationFeedback(
            messageID: "message-assistant-1",
            label: "helpful",
            reason: nil,
            token: "token-feedback-nil"
        )

        XCTAssertEqual(feedback.label, "helpful")
        XCTAssertNil(feedback.reason)
    }

    func testFetchAndDeleteCoachConversationMemoryUsePluralMemoriesRoute() async throws {
        let protocolMock = URLProtocolMock.self
        var requestCount = 0
        protocolMock.requestHandler = { request in
            requestCount += 1
            if requestCount == 1 {
                XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-conversation-memory")
                XCTAssertEqual(request.httpMethod, "GET")
                XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/memories")

                return (
                    HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                    """
                    [
                      {
                        "id": "memory-1",
                        "userId": "coach-user",
                        "kind": "preference",
                        "summary": "用户更适合明确的最小下一步",
                        "confidence": 0.9,
                        "status": "active",
                        "sourceMessageId": "message-assistant-1",
                        "sourceExcerpt": "来自对话的摘要。",
                        "createdAt": "2026-03-21T00:00:00.000Z",
                        "lastUsedAt": null,
                        "revokedAt": null
                      }
                    ]
                    """.data(using: .utf8)!
                )
            }

            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-delete-conversation-memory")
            XCTAssertEqual(request.httpMethod, "DELETE")
            XCTAssertEqual(request.url?.absoluteString, "http://127.0.0.1:3001/coach/memories/memory-1")

            return (
                HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!,
                """
                {
                  "id": "memory-1",
                  "userId": "coach-user",
                  "kind": "preference",
                  "summary": "用户更适合明确的最小下一步",
                  "confidence": 0.9,
                  "status": "revoked",
                  "sourceMessageId": "message-assistant-1",
                  "sourceExcerpt": "来自对话的摘要。",
                  "createdAt": "2026-03-21T00:00:00.000Z",
                  "lastUsedAt": null,
                  "revokedAt": "2026-03-21T00:05:00.000Z"
                }
                """.data(using: .utf8)!
            )
        }

        let client = APIClient(
            configuration: .testValue,
            session: makeURLSession(protocolType: protocolMock)
        )

        let memories = try await client.fetchCoachConversationMemory(token: "token-conversation-memory")
        XCTAssertEqual(memories.count, 1)
        XCTAssertEqual(memories.first?.id, "memory-1")

        let deleted = try await client.deleteCoachConversationMemory("memory-1", token: "token-delete-conversation-memory")
        XCTAssertEqual(deleted.status, "revoked")
    }
}

private final class MockKeychainStore: KeychainStoring {
    var storedData: Data?
    var savedAccount: String?

    func save(_ value: Data, account: String) throws {
        savedAccount = account
        storedData = value
    }

    func load(account: String) throws -> Data? {
        storedData
    }

    func delete(account: String) {
        storedData = nil
    }
}

private final class URLProtocolMock: URLProtocol {
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.requestHandler else {
            XCTFail("Missing request handler.")
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

private func makeURLSession(protocolType: URLProtocol.Type) -> URLSession {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [protocolType]
    return URLSession(configuration: configuration)
}

private func readBody(from request: URLRequest) -> Data? {
    guard let stream = request.httpBodyStream else {
        return nil
    }

    stream.open()
    defer { stream.close() }

    let bufferSize = 4096
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
    defer { buffer.deallocate() }

    var data = Data()
    while stream.hasBytesAvailable {
        let readCount = stream.read(buffer, maxLength: bufferSize)
        if readCount <= 0 {
            break
        }
        data.append(buffer, count: readCount)
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
