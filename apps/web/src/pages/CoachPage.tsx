import { useEffect, useMemo, useState } from "react";
import type { CoachFeedback, CoachFrontAgentState, CoachMessage, CoachSession } from "@mindanchor/domain";
import { api, type DebugTraceLookup } from "../api";

type CoachSessionDetail = {
  session: CoachSession;
  messages: CoachMessage[];
  feedback: CoachFeedback[];
};

const personaNames: Record<string, string> = {
  "director-agent": "Picard",
  "companion-agent": "Deanna Troi",
  "analyst-agent": "Spock",
  "balance-agent": "Guinan",
  "life-secretary-agent": "Jarvis",
  "memory-governor-agent": "Data",
};

function personaName(agentId?: string | null) {
  if (!agentId) return "—";
  return personaNames[agentId] ?? agentId;
}

function statusLabel(raw?: string | null) {
  if (!raw) return "—";
  return raw.replaceAll("_", " ");
}

function routingModeLabel(frontAgent?: CoachFrontAgentState | null) {
  if (!frontAgent) return "—";
  return frontAgent.manualOverride ? "手动覆盖" : "自动路由";
}

function primaryResponse(message?: CoachMessage | null) {
  if (!message) return null;
  return message.fullResponse?.trim() || message.fastResponse?.trim() || null;
}

function formatRuntimeLine(message?: CoachMessage | null) {
  const path = message?.conversationPath;
  if (!path) return "当前还没有这轮对话的运行来源信息。";
  const route = path.primaryRoute ?? (path.usedOpenClaw ? "cluster" : "unknown");
  if (path.runtimeSource === "original-runtime") {
    return `官方 OpenClaw runtime · ${route}`;
  }
  if (path.runtimeSource === "managed-runtime") {
    if (path.hadFallback) {
      return `OpenClaw 回退 · ${route}`;
    }
    return `OpenClaw 主路径 · ${route}`;
  }
  if (path.runtimeSource === "provider-direct") {
    return `Provider 直连 · ${route}`;
  }
  if (path.runtimeSource === "failed") {
    return `生成失败 · ${route}`;
  }
  if (path.usedOpenClaw && !path.hadFallback) {
    return `OpenClaw 主路径 · ${path.primaryRoute ?? "cluster"}`;
  }
  if (path.usedOpenClaw && path.hadFallback) {
    return `OpenClaw 回退 · ${path.primaryRoute ?? "provider-fallback"}`;
  }
  if (path.degraded) {
    return `当前为降级路径 · ${path.degradedReason ?? "degraded"}`;
  }
  return `当前路径 · ${path.primaryRoute ?? "unknown"}`;
}

function buildExplainabilityLines(message?: CoachMessage | null) {
  const path = message?.conversationPath;
  if (!path) return [];

  const lines: string[] = [];
  if (path.consultedAgent) {
    lines.push(`Consult · ${personaName(path.consultedAgent)}`);
  }
  if (path.authorityAgent) {
    const target = statusLabel(path.authorityTarget);
    const status = statusLabel(path.authorityExecutionStatus);
    lines.push(`Authority · ${personaName(path.authorityAgent)} · ${target} · ${status}`);
  }
  if ((path.revokedMemoryCount ?? 0) > 0) {
    lines.push(`Memory revoked · ${path.revokedMemoryCount}`);
  }
  return lines;
}

const scopeLabels: Record<string, string> = {
  preferences: "preference",
  habits: "habit",
  constraints: "constraint",
  recentContext: "recent-context",
};

const workflowLabels: Record<string, string> = {
  coach_conversation_fast: "快速回复",
  coach_conversation_full: "完整回复",
  coach_consult: "协作分析",
  coach_authority: "权限动作",
};

function formatAdapterRouteSummary(route: {
  agentName: string;
  workflow: string | null;
  route: string;
}) {
  const routeLabel =
    route.route === "cluster"
      ? "OpenClaw 主路径"
      : route.route === "provider-fallback"
        ? "OpenClaw 回退"
        : route.route === "provider-direct"
          ? "Provider 直连"
          : route.route === "failed"
            ? "生成失败"
            : route.route;
  return `${personaName(route.agentName)} · ${workflowLabels[route.workflow ?? ""] ?? route.workflow ?? "未知流程"} · ${routeLabel}`;
}

export function CoachPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [traceBusy, setTraceBusy] = useState(false);
  const [showMessageList, setShowMessageList] = useState(false);
  const [showExplainabilityDetails, setShowExplainabilityDetails] = useState(false);
  const [showMemoryBreakdown, setShowMemoryBreakdown] = useState(false);
  const [showRouteBreakdown, setShowRouteBreakdown] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [frontAgent, setFrontAgent] = useState<CoachFrontAgentState | null>(null);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CoachSessionDetail | null>(null);
  const [latestTrace, setLatestTrace] = useState<DebugTraceLookup | null>(null);

  const loadSessionDetail = async (sessionId: string) => {
    const loadedDetail = await api.getCoachSession(sessionId);
    setDetail(loadedDetail);
    setSelectedSessionId(sessionId);
    const defaultMessage = [...loadedDetail.messages].reverse().find((message) => message.role === "assistant") ?? loadedDetail.messages[0] ?? null;
    setSelectedMessageId(defaultMessage?.id ?? null);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setBusy(true);
      setError(null);
      try {
        const [frontAgentState, sessionResponse] = await Promise.all([api.getCoachFrontAgent(), api.getCoachSessions()]);
        if (cancelled) return;
        setFrontAgent(frontAgentState);
        setSessions(sessionResponse.sessions);

        const latestSession = sessionResponse.sessions[0];
        if (!latestSession) {
          setDetail(null);
          return;
        }

        const loadedDetail = await api.getCoachSession(latestSession.id);
        if (cancelled) return;
        setDetail(loadedDetail);
        setSelectedSessionId(latestSession.id);
        const defaultMessage = [...loadedDetail.messages].reverse().find((message) => message.role === "assistant") ?? loadedDetail.messages[0] ?? null;
        setSelectedMessageId(defaultMessage?.id ?? null);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "加载 Coach 观测失败");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestAssistantMessage = useMemo(() => {
    return [...(detail?.messages ?? [])].reverse().find((message) => message.role === "assistant") ?? null;
  }, [detail]);
  const selectedMessage = useMemo(() => {
    if (!detail) return null;
    return detail.messages.find((message) => message.id === selectedMessageId) ?? latestAssistantMessage;
  }, [detail, latestAssistantMessage, selectedMessageId]);
  const selectedMessageFeedback = useMemo(() => {
    if (!selectedMessage) return null;
    return detail?.feedback.find((feedback) => feedback.messageId === selectedMessage.id) ?? null;
  }, [detail, selectedMessage]);

  const explainabilityLines = useMemo(() => buildExplainabilityLines(latestAssistantMessage), [latestAssistantMessage]);
  const traceEvents = useMemo(() => latestTrace?.events.slice(-6).reverse() ?? [], [latestTrace]);
  const traceConversationSummary = latestTrace?.summary?.conversationPath ?? null;
  const traceFeedbackLearnedCount =
    (traceConversationSummary?.feedbackLearning?.strengtheningRecalledCount ?? 0) +
    (traceConversationSummary?.feedbackLearning?.weakenedRejectedCandidateCount ?? 0);
  const selectedMessageMemoryLinkSummary = useMemo(() => {
    if (!selectedMessage) return null;
    const selectedCount = selectedMessage.usedMemoryEntries.length;
    const recalledCount = traceConversationSummary?.memoryUsage?.recalledCount ?? 0;
    if (selectedCount === 0 && recalledCount === 0) return null;
    return `本条消息记忆 ${selectedCount} / 本轮召回 ${recalledCount}`;
  }, [selectedMessage, traceConversationSummary]);
  const traceSourceSummaries = useMemo(() => {
    const sourceCounts = traceConversationSummary?.memoryUsage?.sourceCounts;
    if (!sourceCounts) return [];
    return Object.entries(sourceCounts)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => `来源 ${source} × ${count}`);
  }, [traceConversationSummary]);
  const traceScopeSummaries = useMemo(() => {
    const scopeEntryCounts = traceConversationSummary?.memoryUsage?.scopeEntryCounts;
    if (!scopeEntryCounts) return [];
    return Object.entries(scopeEntryCounts)
      .filter(([, count]) => count > 0)
      .map(([scope, count]) => `范围 ${scopeLabels[scope] ?? scope} × ${count}`);
  }, [traceConversationSummary]);

  useEffect(() => {
    let cancelled = false;

    const traceId = selectedMessage?.traceId;
    if (!traceId) {
      setLatestTrace(null);
      return;
    }

    const loadTrace = async () => {
      setTraceBusy(true);
      try {
        const trace = await api.getDebugTrace(traceId);
        if (!cancelled) {
          setLatestTrace(trace);
        }
      } catch {
        if (!cancelled) {
          setLatestTrace(null);
        }
      } finally {
        if (!cancelled) {
          setTraceBusy(false);
        }
      }
    };

    void loadTrace();
    return () => {
      cancelled = true;
    };
  }, [selectedMessage?.traceId]);

  useEffect(() => {
    setShowMessageList(false);
  }, [selectedSessionId]);

  useEffect(() => {
    setShowExplainabilityDetails(false);
    setShowMemoryBreakdown(false);
    setShowRouteBreakdown(false);
    setShowTimeline(false);
  }, [selectedMessage?.id]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    setActionStatus(null);
    try {
      let session = detail?.session ?? sessions[0] ?? null;
      if (!session) {
        session = await api.createCoachSession();
        setSessions((current) => [session as CoachSession, ...current]);
      }

      const response = await api.sendCoachMessage(session.id, { text });
      setDraft("");
      setFrontAgent(response.frontAgentState);
      setSelectedSessionId(session.id);
      setDetail((current) => {
        const existingMessages = current?.session.id === session?.id ? current.messages : [];
        return {
          session,
          messages: [...existingMessages.filter((item) => item.id !== response.userMessage.id && item.id !== response.assistantMessage.id), response.userMessage, response.assistantMessage],
          feedback: current?.feedback ?? [],
        };
      });

      let latestAssistant = response.assistantMessage;
      setSelectedMessageId(response.assistantMessage.id);
      for (let attempt = 0; attempt < 12; attempt += 1) {
        if (latestAssistant.status === "completed" || latestAssistant.status === "failed") break;
        await new Promise((resolve) => setTimeout(resolve, 250));
        latestAssistant = await api.getCoachMessage(response.assistantMessage.id);
      }

      setDetail((current) => {
        if (!current || current.session.id !== session?.id) {
          return current;
        }
        return {
          ...current,
          messages: current.messages.map((message) => (message.id === latestAssistant.id ? latestAssistant : message)),
        };
      });
      setActionStatus("已收到这轮消息，当前已同步到最新 assistant 结果。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "发送 Coach 消息失败");
    } finally {
      setSending(false);
    }
  };

  const submitFeedback = async (messageId: string, label: "helpful" | "unhelpful") => {
    try {
      setActionStatus(null);
      const payload = feedbackReason.trim() ? { label, reason: feedbackReason.trim() } : { label };
      const feedback = await api.submitCoachFeedback(messageId, payload);
      setDetail((current) => {
        if (!current) return current;
        return {
          ...current,
          feedback: [...current.feedback.filter((item) => item.messageId !== messageId), feedback],
        };
      });
      setFeedbackReason("");
      setActionStatus("已记录反馈，这会进入后续偏好学习与治理链。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "提交反馈失败");
    }
  };

  const retryMessage = async (messageId: string) => {
    try {
      setActionStatus(null);
      const response = await api.retryCoachMessage(messageId);
      setFrontAgent(response.frontAgentState);
      setSelectedMessageId(response.assistantMessage.id);
      setDetail((current) => {
        if (!current) return current;
        const remainingMessages = current.messages.filter(
          (item) => item.id !== response.userMessage.id && item.id !== response.assistantMessage.id,
        );
        return {
          ...current,
          messages: [...remainingMessages, response.userMessage, response.assistantMessage],
        };
      });
      setActionStatus("已完成重试，当前已切到最新 assistant 结果。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "重试消息失败");
    }
  };

  if (busy) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Coach</p>
            <h2>正在加载 Coach…</h2>
          </div>
        </div>
        <p className="muted">正在同步当前前台人格、最近线程和对话来源。</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Coach</p>
          <h2>Coach 观测</h2>
        </div>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-2">
        <article className="card">
          <h3>会话列表</h3>
          {sessions.length > 0 ? (
            <ul className="list">
              {sessions.map((session) => (
                <li key={session.id} className="task-row">
                  <button className="button-secondary" onClick={() => void loadSessionDetail(session.id)}>
                    {session.title}
                  </button>
                  {selectedSessionId === session.id ? <span className="pill">当前</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">当前还没有 Coach 会话。</p>
          )}
        </article>

        <article className="card">
          <h3>当前摘要</h3>
          <div className="stack">
            {frontAgent ? (
              <>
                <div className="detail-row">
                  <span className="pill">当前人格：{personaName(frontAgent.currentFrontAgent)}</span>
                  <span className="pill">模式：{routingModeLabel(frontAgent)}</span>
                  {frontAgent.consultedAgent ? <span className="pill">Consult · {personaName(frontAgent.consultedAgent)}</span> : null}
                </div>
                <p>{frontAgent.visibleSummary ?? "当前还没有可见路由摘要。"}</p>
              </>
            ) : (
              <p className="muted">当前还没有 front agent 状态。</p>
            )}

            {detail ? (
              <>
                <strong>当前线程：{detail.session.title}</strong>
                <p className="muted">消息数：{detail.messages.length} · 更新时间：{new Date(detail.session.updatedAt).toLocaleString()}</p>
                <p className="muted">最近回复</p>
                <p>{primaryResponse(latestAssistantMessage) ?? "最近一轮还没有 assistant 回复。"}</p>
              </>
            ) : (
              <p className="muted">{sessions.length === 0 ? "当前还没有 Coach 会话。" : "当前还没有加载到会话详情。"}</p>
            )}
          </div>
        </article>
      </div>

      <article className="card">
        <h3>消息列表</h3>
        {detail ? (
          <div className="stack">
            <div className="inline-actions">
              <p className="muted">当前会话共 {detail.messages.length} 条消息。</p>
              <button className="button-secondary" onClick={() => setShowMessageList((current) => !current)}>
                {showMessageList ? `收起会话消息（${detail.messages.length}）` : `查看会话消息（${detail.messages.length}）`}
              </button>
            </div>
            {showMessageList ? (
              <ul className="list">
                {detail.messages.map((message) => (
                  <li key={message.id} className="task-row">
                    <button className="button-secondary" onClick={() => setSelectedMessageId(message.id)}>
                      {message.role} · {message.id}
                    </button>
                    {selectedMessageId === message.id ? <span className="pill">已选</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="muted">先选择一个会话。</p>
        )}
      </article>

      <article className="card">
        <h3>对话来源解释</h3>
        {selectedMessage ? (
          <div className="stack">
            <div className="inline-actions">
              <div className="detail-row">
                <span className="pill">Front · {personaName(selectedMessage.conversationPath?.frontAgent ?? frontAgent?.currentFrontAgent)}</span>
                <span className="pill">{formatRuntimeLine(selectedMessage)}</span>
              </div>
              <p className="muted">来源摘要</p>
              <button className="button-secondary" onClick={() => setShowExplainabilityDetails((current) => !current)}>
                {showExplainabilityDetails ? "收起来源细节" : "查看来源细节"}
              </button>
            </div>
            {showExplainabilityDetails ? (
              buildExplainabilityLines(selectedMessage).length > 0 ? (
                <ul className="list compact-list">
                  {buildExplainabilityLines(selectedMessage).map((line) => (
                    <li key={line} className="task-row">
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">这轮对话还没有 consult / authority / memory revoke 记录。</p>
              )
            ) : null}
          </div>
        ) : (
          <p className="muted">还没有 assistant 消息可用于展示 explainability。</p>
        )}
      </article>

      <article className="card">
        <h3>实时对话</h3>
        <div className="stack">
          <textarea
            placeholder="输入你现在的情况，或你想让 Coach 帮你收窄的问题"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="inline-actions">
            <button className="button-primary" onClick={() => void sendMessage()} disabled={sending || !draft.trim()}>
              {sending ? "发送中..." : "发送给 Coach"}
            </button>
          </div>
          {latestAssistantMessage ? (
            <div className="message-card">
              <strong>最近 assistant 回复</strong>
              <p>{primaryResponse(latestAssistantMessage) ?? "当前还没有 assistant 回复。"}</p>
              <div className="detail-row">
                <span className="pill">{formatRuntimeLine(latestAssistantMessage)}</span>
                {latestAssistantMessage.traceId ? <span className="pill">trace {latestAssistantMessage.traceId}</span> : null}
              </div>
            </div>
          ) : (
            <p className="muted">发送第一条消息后，这里会显示最近一轮返回。</p>
          )}
        </div>
      </article>

      <article className="card">
        <h3>已选消息</h3>
        {selectedMessage ? (
          <div className="stack">
            <div className="detail-row">
              <span className="pill">{selectedMessage.role}</span>
              <span className="pill">{selectedMessage.status}</span>
              {selectedMessage.traceId ? <span className="pill">trace {selectedMessage.traceId}</span> : null}
              {selectedMessageFeedback ? <span className="pill">feedback · {selectedMessageFeedback.label}</span> : null}
            </div>
            <p>{selectedMessage.userText ?? primaryResponse(selectedMessage) ?? "当前消息还没有正文。"}</p>
            {selectedMessage.errorCode ? <span className="pill">{selectedMessage.errorCode}</span> : null}
            {selectedMessage.usedMemoryEntries.length > 0 ? (
              <ul className="list">
                {selectedMessage.usedMemoryEntries.map((entry, index) => (
                  <li key={`${selectedMessage.id}-memory-${index}`} className="task-row">
                    <span>{entry.summary}</span>
                    <span className="muted">{entry.source}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {selectedMessageMemoryLinkSummary || traceSourceSummaries.length > 0 || traceScopeSummaries.length > 0 ? (
              <div className="message-card compact-card">
                <div className="inline-actions">
                  <strong>{showMemoryBreakdown ? "记忆联动摘要" : "记忆联动"}</strong>
                  <button className="button-secondary" onClick={() => setShowMemoryBreakdown((current) => !current)}>
                    {showMemoryBreakdown ? "收起记忆联动" : "展开记忆联动"}
                  </button>
                </div>
                {selectedMessageMemoryLinkSummary ? <span className="pill">{selectedMessageMemoryLinkSummary}</span> : null}
                {showMemoryBreakdown ? (
                  <div className="detail-row">
                    {traceSourceSummaries.map((line) => (
                      <span key={`${selectedMessage.id}-${line}`} className="pill">
                        {line}
                      </span>
                    ))}
                    {traceScopeSummaries.map((line) => (
                      <span key={`${selectedMessage.id}-${line}`} className="pill">
                        {line}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {selectedMessage.role === "assistant" ? (
              <div className="stack">
                {(selectedMessage.status === "failed" || selectedMessage.status === "pending_full") ? (
                  <div className="inline-actions">
                    <button className="button-secondary" onClick={() => void retryMessage(selectedMessage.id)}>
                      重试这条消息
                    </button>
                  </div>
                ) : null}
                {actionStatus ? <p className="muted">{actionStatus}</p> : null}
                {!selectedMessageFeedback ? (
                  <>
                    <textarea
                      placeholder="可选：补一句为什么这条回复没帮助"
                      value={feedbackReason}
                      onChange={(event) => setFeedbackReason(event.target.value)}
                    />
                    <div className="inline-actions">
                      <button className="button-secondary" onClick={() => void submitFeedback(selectedMessage.id, "helpful")}>
                        有帮助
                      </button>
                      <button className="button-secondary" onClick={() => void submitFeedback(selectedMessage.id, "unhelpful")}>
                        没帮助
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="muted">请选择一条消息查看详情。</p>
        )}
      </article>

      <article className="card">
        <h3>消息级 Trace</h3>
        {selectedMessage?.traceId ? (
          <div className="stack">
            <div className="detail-row">
              <span className="pill">trace {selectedMessage.traceId}</span>
              {traceBusy ? <span className="pill">加载中...</span> : null}
              {latestTrace ? <span className="pill">events {latestTrace.events.length}</span> : null}
              {traceConversationSummary?.memoryUsage ? (
                <span className="pill">memory recalled {traceConversationSummary.memoryUsage.recalledCount}</span>
              ) : null}
              {traceFeedbackLearnedCount > 0 ? <span className="pill">feedback learned {traceFeedbackLearnedCount}</span> : null}
            </div>
            {traceConversationSummary?.routeStatusSummary ? <p>{traceConversationSummary.routeStatusSummary}</p> : null}
            {traceConversationSummary?.degradedSummary ? <p className="muted">{traceConversationSummary.degradedSummary}</p> : null}
            {traceConversationSummary?.adapterRoutes.length ? (
              <div className="compact-details">
                <button className="button-secondary" onClick={() => setShowRouteBreakdown((current) => !current)}>
                  {showRouteBreakdown ? "收起执行链路" : "查看执行链路"}
                </button>
                {showRouteBreakdown ? (
                  <ul className="list compact-list">
                    {traceConversationSummary.adapterRoutes.map((route, index) => (
                      <li key={`${selectedMessage.traceId}-route-${index}`} className="task-row">
                        <span>{formatAdapterRouteSummary(route)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {traceEvents.length > 0 ? (
              <div className="compact-details">
                <button className="button-secondary" onClick={() => setShowTimeline((current) => !current)}>
                  {showTimeline ? "收起事件时间线" : "查看事件时间线"}
                </button>
                {showTimeline ? (
                  <ul className="list compact-list">
                    {traceEvents.map((event) => (
                      <li key={event.id} className="task-row">
                        <div className="task-meta">
                          <strong>{event.event}</strong>
                          <span className="muted">{event.message}</span>
                        </div>
                        <span className="muted">{new Date(event.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : latestTrace ? (
              <p className="muted">当前 trace 已加载，但还没有可展示的结构化事件。</p>
            ) : (
              <p className="muted">当前还没有加载到 trace 详情。</p>
            )}
          </div>
        ) : (
          <p className="muted">当前还没有可 drill-down 的 trace。</p>
        )}
      </article>
    </section>
  );
}
