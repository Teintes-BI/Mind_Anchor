import { useEffect, useMemo, useState } from "react";
import {
  api,
  type AgentDebugRun,
  type AgentDebugResult,
  type DebugAgentConfigsResponse,
  type DebugRegressionMatrixCase,
  type DebugRegressionMatrixRun,
  type DebugRegressionMatrixResult,
  type DebugRegressionSuiteResult,
  type DebugTraceLookup,
  type DebugScenarioDefinition,
  type DebugScenarioSeedResult,
  type GatewayHealth,
  type ModelProbeResult,
  type OpenClawAdapterDecision,
  type OpenClawAdapterStatusResponse,
  type OpenClawRegistryVisibilityResponse,
} from "../api";

const CHIEF_WORKFLOWS = [
  "state_assessment",
  "task_management",
  "progress_summary",
  "recovery_plan",
  "reflection_report",
  "notification_dispatch",
] as const;

type ChiefWorkflow = (typeof CHIEF_WORKFLOWS)[number];

type RunState = {
  probing?: boolean;
  debugging?: boolean;
  probe?: ModelProbeResult;
  debug?: AgentDebugResult;
  probeError?: string | null;
  debugError?: string | null;
};

export function AgentLabPage() {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [adapterStatus, setAdapterStatus] = useState<OpenClawAdapterStatusResponse | null>(null);
  const [adapterError, setAdapterError] = useState<string | null>(null);
  const [registryVisibility, setRegistryVisibility] = useState<OpenClawRegistryVisibilityResponse | null>(null);
  const [registryVisibilityError, setRegistryVisibilityError] = useState<string | null>(null);
  const [agentConfigs, setAgentConfigs] = useState<DebugAgentConfigsResponse | null>(null);
  const [agentConfigError, setAgentConfigError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<DebugScenarioDefinition[]>([]);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<DebugScenarioSeedResult | null>(null);
  const [seedingScenarioId, setSeedingScenarioId] = useState<string | null>(null);
  const [chiefWorkflow, setChiefWorkflow] = useState<ChiefWorkflow>("state_assessment");
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [runHistory, setRunHistory] = useState<AgentDebugRun[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [leftRunId, setLeftRunId] = useState<string | null>(null);
  const [rightRunId, setRightRunId] = useState<string | null>(null);
  const [suiteResult, setSuiteResult] = useState<DebugRegressionSuiteResult | null>(null);
  const [suiteBusy, setSuiteBusy] = useState(false);
  const [suiteError, setSuiteError] = useState<string | null>(null);
  const [matrixCases, setMatrixCases] = useState<DebugRegressionMatrixCase[]>([]);
  const [matrixCaseIds, setMatrixCaseIds] = useState<string[]>([]);
  const [matrixResult, setMatrixResult] = useState<DebugRegressionMatrixResult | null>(null);
  const [matrixRunHistory, setMatrixRunHistory] = useState<DebugRegressionMatrixRun[]>([]);
  const [matrixBusy, setMatrixBusy] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [matrixHistoryBusy, setMatrixHistoryBusy] = useState(false);
  const [matrixHistoryError, setMatrixHistoryError] = useState<string | null>(null);
  const [leftMatrixRunId, setLeftMatrixRunId] = useState<string | null>(null);
  const [rightMatrixRunId, setRightMatrixRunId] = useState<string | null>(null);
  const [traceLookupId, setTraceLookupId] = useState("");
  const [traceDetails, setTraceDetails] = useState<DebugTraceLookup | null>(null);
  const [traceBusy, setTraceBusy] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [localVerificationBusy, setLocalVerificationBusy] = useState(false);
  const [localVerificationError, setLocalVerificationError] = useState<string | null>(null);
  const [localVerificationCompletedAt, setLocalVerificationCompletedAt] = useState<string | null>(null);

  const debugContext = useMemo(
    () => ({
      userId: activeScenario?.userId ?? "demo-user",
      scenarioId: activeScenario?.scenarioId,
      taskId: activeScenario?.taskId,
      goalId: activeScenario?.goalId,
      periodType: activeScenario?.periodType ?? "weekly",
    }),
    [activeScenario],
  );

  const agentDefinitions = useMemo(
    () => [
      {
        name: "state-insight-agent",
        title: "状态洞察",
        description: "状态评估、摘要与建议动作。",
        runDebug: () => api.debugStateInsight({ userId: debugContext.userId, scenarioId: debugContext.scenarioId }),
      },
      {
        name: "task-management-agent",
        title: "任务管理",
        description: "任务拆解、重排与 GoalFlow 建议。",
        runDebug: () => api.debugTaskManagement({ userId: debugContext.userId, goalId: debugContext.goalId, scenarioId: debugContext.scenarioId }),
      },
      {
        name: "progress-feedback-agent",
        title: "进展反馈",
        description: "Dashboard 进展摘要与聚合输出。",
        runDebug: () => api.debugProgressFeedback({ userId: debugContext.userId, scenarioId: debugContext.scenarioId }),
      },
      {
        name: "interruption-recovery-agent",
        title: "中断恢复",
        description: "中断恢复计划与建议下一步。",
        runDebug: () => api.debugRecovery({ userId: debugContext.userId, taskId: debugContext.taskId, scenarioId: debugContext.scenarioId }),
      },
      {
        name: "reflection-coach-agent",
        title: "复盘教练",
        description: "周报/月报结构化反思输出。",
        runDebug: () => api.debugReflection({ userId: debugContext.userId, periodType: debugContext.periodType, scenarioId: debugContext.scenarioId }),
      },
      {
        name: "automation-agent",
        title: "自动化 / 通知",
        description: "提醒投递策略与自动化输出。",
        runDebug: () => api.debugAutomation({ userId: debugContext.userId, scenarioId: debugContext.scenarioId }),
      },
    ],
    [debugContext.goalId, debugContext.periodType, debugContext.scenarioId, debugContext.taskId, debugContext.userId],
  );

  const setRunState = (key: string, patch: Partial<RunState>) => {
    setRuns((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  };

  const loadHealth = async () => {
    try {
      setHealthError(null);
      setHealth(await api.getGatewayHealth());
    } catch (cause) {
      setHealthError(cause instanceof Error ? cause.message : "加载 Gateway 健康状态失败");
    }
  };

  const loadOpenClawAdapterStatus = async () => {
    try {
      setAdapterError(null);
      setAdapterStatus(await api.getDebugOpenClawAdapterStatus());
    } catch (cause) {
      setAdapterError(cause instanceof Error ? cause.message : "加载 OpenClaw adapter 状态失败");
    }
  };

  const loadOpenClawRegistryVisibility = async () => {
    try {
      setRegistryVisibilityError(null);
      setRegistryVisibility(await api.getDebugOpenClawRegistryVisibility());
    } catch (cause) {
      setRegistryVisibilityError(cause instanceof Error ? cause.message : "加载 OpenClaw Registry 状态失败");
    }
  };

  const loadScenarios = async () => {
    try {
      setScenarioError(null);
      const data = await api.getDebugScenarios();
      setScenarios(data.scenarios);
    } catch (cause) {
      setScenarioError(cause instanceof Error ? cause.message : "加载调试场景失败");
    }
  };

  const loadAgentConfigs = async () => {
    try {
      setAgentConfigError(null);
      setAgentConfigs(await api.getDebugAgentConfigs());
    } catch (cause) {
      setAgentConfigError(cause instanceof Error ? cause.message : "加载已解析 agent 配置失败");
    }
  };

  const refreshGatewayDiagnostics = async () => {
    await Promise.all([loadHealth(), loadOpenClawAdapterStatus(), loadOpenClawRegistryVisibility()]);
  };

  const loadMatrixCases = async () => {
    try {
      setMatrixError(null);
      const data = await api.getDebugRegressionMatrixCases();
      setMatrixCases(data.cases);
      setMatrixCaseIds((current) => (current.length > 0 ? current.filter((id) => data.cases.some((item) => item.id === id)) : data.cases.map((item) => item.id)));
    } catch (cause) {
      setMatrixError(cause instanceof Error ? cause.message : "加载矩阵回归 case 失败");
    }
  };

  const loadMatrixRunHistory = async () => {
    try {
      setMatrixHistoryBusy(true);
      setMatrixHistoryError(null);
      const data = await api.getDebugRegressionMatrixRuns({ limit: 10 });
      setMatrixRunHistory(data.runs);
      setLeftMatrixRunId((current) => (current && data.runs.some((run) => run.id === current) ? current : data.runs[0]?.id ?? null));
      setRightMatrixRunId((current) => {
        if (current && data.runs.some((run) => run.id === current)) {
          return current;
        }
        return data.runs[1]?.id ?? data.runs[0]?.id ?? null;
      });
    } catch (cause) {
      setMatrixHistoryError(cause instanceof Error ? cause.message : "加载矩阵回归历史失败");
    } finally {
      setMatrixHistoryBusy(false);
    }
  };

  const loadRunHistory = async (userId: string) => {
    try {
      setHistoryBusy(true);
      setHistoryError(null);
      const data = await api.getDebugRuns({ userId, limit: 20 });
      setRunHistory(data.runs);
      setLeftRunId((current) => (current && data.runs.some((run) => run.id === current) ? current : data.runs[0]?.id ?? null));
      setRightRunId((current) => {
        if (current && data.runs.some((run) => run.id === current)) {
          return current;
        }
        return data.runs[1]?.id ?? data.runs[0]?.id ?? null;
      });
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : "加载调试运行历史失败");
    } finally {
      setHistoryBusy(false);
    }
  };

  const loadTraceDetails = async (traceId: string) => {
    if (!traceId) {
      setTraceDetails(null);
      return;
    }

    try {
      setTraceBusy(true);
      setTraceError(null);
      setTraceDetails(await api.getDebugTrace(traceId));
    } catch (cause) {
      setTraceError(cause instanceof Error ? cause.message : "加载 trace 详情失败");
    } finally {
      setTraceBusy(false);
    }
  };

  const runFullRegressionSuite = async () => {
    try {
      setSuiteError(null);
      setSuiteBusy(true);
      const result = await api.runFullRegressionSuite();
      setSuiteResult(result);

      const firstScenario = result.scenarioResults[0];
      if (firstScenario) {
        setActiveScenario({
          scenarioId: firstScenario.scenarioId as DebugScenarioDefinition["id"],
          title: firstScenario.title,
          description: firstScenario.description,
          userId: firstScenario.userId,
          goalId: firstScenario.goalId,
          taskId: firstScenario.taskId,
          sessionId: firstScenario.sessionId,
                          periodType: firstScenario.periodType,
                          recommendedWorkflows: firstScenario.recommendedWorkflows,
                          notes: firstScenario.notes,
                          counts: firstScenario.counts,
                        });
        await loadRunHistory(firstScenario.userId);
      }
    } catch (cause) {
      setSuiteError(cause instanceof Error ? cause.message : "执行全量回归失败");
    } finally {
      setSuiteBusy(false);
    }
  };

  const runMatrixRegression = async () => {
    try {
      setMatrixError(null);
      setMatrixBusy(true);
      const result = await api.runDebugRegressionMatrix({
        caseIds: matrixCaseIds.length > 0 ? matrixCaseIds : undefined,
      });
      setMatrixResult(result);
      await loadMatrixRunHistory();
    } catch (cause) {
      setMatrixError(cause instanceof Error ? cause.message : "执行矩阵回归失败");
    } finally {
      setMatrixBusy(false);
    }
  };

  useEffect(() => {
    void refreshGatewayDiagnostics();
    void loadAgentConfigs();
    void loadMatrixCases();
    void loadMatrixRunHistory();
    void loadScenarios();
  }, []);

  useEffect(() => {
    void loadRunHistory(debugContext.userId);
  }, [debugContext.userId]);

  const seedScenario = async (scenarioId: DebugScenarioDefinition["id"]) => {
    try {
      setScenarioError(null);
      setSeedingScenarioId(scenarioId);
      const seeded = await api.seedDebugScenario(scenarioId);
      setActiveScenario(seeded);
      const preferredWorkflow = seeded.recommendedWorkflows[0];
      if (preferredWorkflow && CHIEF_WORKFLOWS.includes(preferredWorkflow as ChiefWorkflow)) {
        setChiefWorkflow(preferredWorkflow as ChiefWorkflow);
      }
      await loadRunHistory(seeded.userId);
    } catch (cause) {
      setScenarioError(cause instanceof Error ? cause.message : "场景造数失败");
    } finally {
      setSeedingScenarioId(null);
    }
  };

  const runProbeWithContext = async (agentName: string, context: { userId: string; scenarioId?: string }) => {
    try {
      setRunState(agentName, { probing: true, probeError: null });
      const probe = await api.probeAgentModel(agentName, { userId: context.userId, scenarioId: context.scenarioId });
      setRunState(agentName, { probing: false, probe });
      await loadRunHistory(context.userId);
    } catch (cause) {
      setRunState(agentName, {
        probing: false,
        probeError: cause instanceof Error ? cause.message : "Probe 失败",
      });
      throw cause;
    }
  };

  const runProbe = async (agentName: string) => {
    try {
      await runProbeWithContext(agentName, debugContext);
    } catch {
      return;
    }
  };

  const runDebugWithContext = async (
    key: string,
    runner: () => Promise<AgentDebugResult>,
    userId: string,
  ) => {
    try {
      setRunState(key, { debugging: true, debugError: null });
      const debug = await runner();
      setRunState(key, { debugging: false, debug });
      await loadRunHistory(userId);
    } catch (cause) {
      setRunState(key, {
        debugging: false,
        debugError: cause instanceof Error ? cause.message : "Debug 运行失败",
      });
      throw cause;
    }
  };

  const runDebug = async (key: string, runner: () => Promise<AgentDebugResult>) => {
    try {
      await runDebugWithContext(key, runner, debugContext.userId);
    } catch {
      return;
    }
  };

  const runLocalVerificationChecks = async () => {
    try {
      setLocalVerificationBusy(true);
      setLocalVerificationError(null);

      let verificationContext = {
        userId: debugContext.userId,
        scenarioId: debugContext.scenarioId,
        goalId: debugContext.goalId,
        taskId: debugContext.taskId,
        periodType: debugContext.periodType,
      };

      if (activeScenario?.scenarioId !== "focus-recovery-loop") {
        const seeded = await api.seedDebugScenario("focus-recovery-loop");
        setActiveScenario(seeded);
        verificationContext = {
          userId: seeded.userId,
          scenarioId: seeded.scenarioId,
          goalId: seeded.goalId,
          taskId: seeded.taskId,
          periodType: seeded.periodType ?? "weekly",
        };
        await loadRunHistory(seeded.userId);
      }

      await runProbeWithContext("chief-agent", verificationContext);
      await runDebugWithContext(
        "state-insight-agent",
        () => api.debugStateInsight({ userId: verificationContext.userId, scenarioId: verificationContext.scenarioId }),
        verificationContext.userId,
      );
      await refreshGatewayDiagnostics();
      setLocalVerificationCompletedAt(new Date().toISOString());
    } catch (cause) {
      setLocalVerificationError(cause instanceof Error ? cause.message : "本地验收检查失败");
    } finally {
      setLocalVerificationBusy(false);
    }
  };

  const toggleMatrixCase = (caseId: string) => {
    setMatrixCaseIds((current) => (current.includes(caseId) ? current.filter((item) => item !== caseId) : [...current, caseId]));
  };

  const clearRunHistory = async () => {
    try {
      setHistoryError(null);
      setHistoryBusy(true);
      await api.clearDebugRuns(debugContext.userId);
      await loadRunHistory(debugContext.userId);
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : "清空调试运行历史失败");
    } finally {
      setHistoryBusy(false);
    }
  };

  const clearMatrixRunHistory = async () => {
    try {
      setMatrixHistoryError(null);
      setMatrixHistoryBusy(true);
      await api.clearDebugRegressionMatrixRuns();
      setMatrixResult(null);
      await loadMatrixRunHistory();
    } catch (cause) {
      setMatrixHistoryError(cause instanceof Error ? cause.message : "清空矩阵回归历史失败");
    } finally {
      setMatrixHistoryBusy(false);
    }
  };

  const chiefState = runs["chief-agent"] ?? {};
  const stateInsightState = runs["state-insight-agent"] ?? {};
  const leftRun = runHistory.find((run) => run.id === leftRunId) ?? null;
  const rightRun = runHistory.find((run) => run.id === rightRunId) ?? null;
  const leftMatrixRun = matrixRunHistory.find((run) => run.id === leftMatrixRunId) ?? null;
  const rightMatrixRun = matrixRunHistory.find((run) => run.id === rightMatrixRunId) ?? null;
  const matrixDiff = useMemo(() => buildMatrixRunDiff(leftMatrixRun, rightMatrixRun), [leftMatrixRun, rightMatrixRun]);
  const localVerificationChecks = useMemo(
    () => [
      {
        label: "Gateway 健康状态",
        passed: Boolean(health?.ok),
        detail: health?.ok ? "API 当前健康。" : "请先刷新诊断，并确认 `apps/api` 正在运行。",
      },
      {
        label: "Cluster 已配置",
        passed: Boolean(adapterStatus?.clusterEnabled),
        detail: adapterStatus?.clusterEnabled
          ? `Cluster URL 为 ${adapterStatus.openClawBaseUrl ?? "已配置"}.`
          : "当前 API 实例仍停留在 provider-direct。",
      },
      {
        label: "Cluster 策略",
        passed: adapterStatus?.executionStrategy === "cluster-preferred",
        detail:
          adapterStatus?.executionStrategy === "cluster-preferred"
            ? "Gateway 当前会优先尝试 OpenClaw。"
            : "请带上 `MINDANCHOR_OPENCLAW_BASE_URL` 重启 API，以切换到 cluster-preferred。",
      },
      {
        label: "Chief 探测",
        passed: chiefState.probe?.adapter?.route === "cluster",
        detail:
          chiefState.probe?.adapter?.route === "cluster"
            ? "Chief probe 已经走到了 cluster。"
            : "运行 `Probe chief-agent`，确认 route 徽章变成 `cluster`。",
      },
      {
        label: "State 调试",
        passed: stateInsightState.debug?.adapter?.route === "cluster",
        detail:
          stateInsightState.debug?.adapter?.route === "cluster"
            ? "state-insight-agent 的 debug 已经走到了 cluster。"
            : "运行 `state-insight-agent` debug，确认 route 徽章持续保持在 `cluster`。",
      },
      {
        label: "Adapter 时间线",
        passed: Boolean(adapterStatus?.recentTimeline.length),
        detail:
          adapterStatus?.recentTimeline.length && adapterStatus.recentTimeline.length > 0
            ? "最近时间线已经有路由事件了。"
            : "暂时还没有路由历史，先跑一次 probe/debug 来填充。",
      },
    ],
    [adapterStatus, chiefState.probe?.adapter?.route, health?.ok, stateInsightState.debug?.adapter?.route],
  );
  const nextVerificationStep = localVerificationChecks.find((item) => !item.passed)?.detail ?? "本地 cluster 核心检查都通过了，可以继续逐页做人工验收。";

  useEffect(() => {
    const preferredTraceId = rightRun?.traceId ?? rightMatrixRun?.traceId ?? "";
    if (!preferredTraceId) {
      return;
    }
    setTraceLookupId(preferredTraceId);
    void loadTraceDetails(preferredTraceId);
  }, [rightMatrixRun?.traceId, rightRun?.traceId]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Agent Lab</p>
          <h2>OpenClaw agent 调试控制台</h2>
        </div>
        <button className="button-secondary" onClick={() => void refreshGatewayDiagnostics()}>
          刷新 Gateway 诊断
        </button>
      </div>

      {healthError ? <p className="error-banner">{healthError}</p> : null}
      {adapterError ? <p className="error-banner">{adapterError}</p> : null}
      {agentConfigError ? <p className="error-banner">{agentConfigError}</p> : null}
      {matrixError ? <p className="error-banner">{matrixError}</p> : null}
      {matrixHistoryError ? <p className="error-banner">{matrixHistoryError}</p> : null}

      <div className="grid grid-3">
        <article className="card">
          <h3>Gateway 健康状态</h3>
          {health ? (
            <>
              <div className="detail-row">
                <span className="pill">{health.ok ? "健康" : "降级"}</span>
                <span className="pill">{health.mode}</span>
                <span className="pill">{health.topology}</span>
              </div>
              <p className="muted">OpenClaw base URL：{health.openClawBaseUrl ?? "当前 dev stub 模式下未配置"}</p>
            </>
          ) : (
            <p className="muted">暂时还没有加载到 Gateway 健康状态。</p>
          )}
        </article>

        <article className="card">
          <h3>OpenClaw adapter</h3>
          {adapterStatus ? (
            <div className="stack">
              <div className="detail-row">
                <span className={`status-pill ${adapterStatus.clusterEnabled ? "status-done" : "status-in_progress"}`}>
                  策略 · {formatAdapterStrategyLabel(adapterStatus.executionStrategy)}
                </span>
                {adapterStatus.lastDecision ? (
                  <span className={`status-pill ${getAdapterRouteClassName(adapterStatus.lastDecision.route)}`}>
                    路径 · {formatAdapterRouteLabel(adapterStatus.lastDecision.route)}
                  </span>
                ) : null}
              </div>
              {adapterStatus.clusterEnabled ? (
                <p className="muted">
                  当前 API 实例已经配置为 OpenClaw cluster 路由。请在下面跑一次探测 / 调试，确认真实路由是否生效。
                </p>
              ) : (
                <p className="warning-banner">
                  当前 API 实例还没有配置 `MINDANCHOR_OPENCLAW_BASE_URL`，所以所有运行都会停留在 provider-direct。
                </p>
              )}
              <p className="muted">Gateway 模式：{adapterStatus.gatewayMode}</p>
              <p className="muted">OpenClaw base URL：{adapterStatus.openClawBaseUrl ?? "未配置"}</p>
              {!adapterStatus.clusterEnabled ? (
                <div className="message-card">
                  <strong>推荐本地启动方式</strong>
                  <pre className="code-block">
{`# terminal 1
export PATH="$PWD/.tools/node/bin:$PATH"
OPENCLAW_HOST=0.0.0.0 OPENCLAW_PORT=8787 corepack pnpm dev:openclaw

# terminal 2
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_AGENT_MODE=openai-compatible \\
MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787 \\
corepack pnpm dev:api

# terminal 3
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm dev:web`}
                  </pre>
                  <div className="stack">
                    <strong>重启后你应该看到</strong>
                    <ul className="list">
                      <li className="task-row">
                        <span className="muted">1. `OpenClaw base URL` 会从 `not configured` 变成你本地或远端 cluster 的 URL。</span>
                      </li>
                      <li className="task-row">
                        <span className="muted">2. 顶部徽章会从 `strategy · provider-direct` 变成 `strategy · cluster-preferred`。</span>
                      </li>
                      <li className="task-row">
                        <span className="muted">3. 跑完 `Probe chief-agent` 后，如果 cluster 健康，route 徽章应该会变成 `route · cluster`。</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="message-card">
                  <strong>快速人工检查</strong>
                  <ul className="list">
                    <li className="task-row">
                      <span className="muted">1. 顶部徽章显示 `strategy · cluster-preferred`，说明这台 API 会先尝试 OpenClaw。</span>
                    </li>
                    <li className="task-row">
                      <span className="muted">2. 跑一次 `Probe chief-agent`；如果 route 徽章变成 `cluster`，说明真实路径已经打通。</span>
                    </li>
                    <li className="task-row">
                      <span className="muted">3. 再跑一次 `state-insight-agent` debug；如果 JSON 看起来合理，且 route 保持 `cluster`，说明本地 OpenClaw 路径可用。</span>
                    </li>
                  </ul>
                </div>
              )}
              <div className="detail-row">
                {adapterStatus.clusterEndpoints.map((endpoint) => (
                  <span className="pill" key={endpoint}>
                    {endpoint}
                  </span>
                ))}
              </div>
              {adapterStatus.lastDecision ? (
                <div className="message-card">
                  <strong>最近一次路由</strong>
                  <p className="muted">
                    {adapterStatus.lastDecision.target} · {formatExecutionModeLabel(adapterStatus.lastDecision.mode)} · endpoint{" "}
                    {adapterStatus.lastDecision.selectedEndpoint ?? "—"}
                  </p>
                  <p className="muted">trace {formatTraceId(adapterStatus.lastDecision.traceId)}</p>
                </div>
              ) : (
                <p className="muted">暂时还没有 adapter 决策记录。</p>
              )}
              {adapterStatus.lastFallback?.fallbackReason ? (
                <div className="message-card">
                  <strong>最近一次回退原因</strong>
                  <p className="muted">{adapterStatus.lastFallback.fallbackReason}</p>
                  <p className="muted">
                    {adapterStatus.lastFallback.target} · {new Date(adapterStatus.lastFallback.createdAt ?? "").toLocaleString()}
                  </p>
                </div>
              ) : null}
              {adapterStatus.recentTimeline.length > 0 ? (
                <ul className="list">
                  {adapterStatus.recentTimeline.slice(0, 6).map((decision) => (
                    <li key={`${decision.traceId ?? "no-trace"}-${decision.createdAt ?? "no-time"}`}>
                      <div className="task-meta">
                        <strong>{decision.target}</strong>
                        <div className="detail-row">
                          <span className={`status-pill ${getAdapterRouteClassName(decision.route)}`}>路径 · {formatAdapterRouteLabel(decision.route)}</span>
                          <span className="pill">{formatExecutionModeLabel(decision.mode)}</span>
                        </div>
                        <span className="muted">
                          {decision.selectedEndpoint ?? "无 endpoint"} · {decision.createdAt ? new Date(decision.createdAt).toLocaleString() : "—"}
                        </span>
                        {decision.fallbackReason ? <span className="muted">{decision.fallbackReason}</span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="muted">暂时还没有加载到 OpenClaw adapter 状态。</p>
          )}
        </article>

        <article className="card">
          <h3>OpenClaw Registry</h3>
          {registryVisibility ? (
            <div className="stack">
              <div className="detail-row">
                <span className={`status-pill ${getRegistryHealthClassName(registryVisibility.externalRuntime.healthStatus)}`}>
                  {formatRegistryHealthLabel(registryVisibility.externalRuntime.healthStatus)}
                </span>
                <span className="pill">问题数：{registryVisibility.externalRuntime.healthIssueCounts.totalIssueCount}</span>
                <span className="pill">缺失 persona：{registryVisibility.externalRuntime.healthIssueCounts.missingPersonaCount}</span>
              </div>
              <p className="muted">
                Runtime：{registryVisibility.externalRuntime.runtime ?? "未上报"} · version{" "}
                {registryVisibility.externalRuntime.runtimeVersion ?? "未上报"}
              </p>
              <p className="muted">
                已匹配 agent：{registryVisibility.externalRuntime.matchedAgentIds.length} / {registryVisibility.nativeRegistry.totalAgents}
              </p>
              {registryVisibility.externalRuntime.healthReasonCodes.length > 0 ? (
                <div className="detail-row">
                  {registryVisibility.externalRuntime.healthReasonCodes.map((reasonCode) => (
                    <span className="pill" key={reasonCode}>
                      {reasonCode}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">当前没有额外的健康告警原因码。</p>
              )}
              {registryVisibility.externalRuntime.baseUrl ? (
                <p className="muted">External base URL：{registryVisibility.externalRuntime.baseUrl}</p>
              ) : null}
              <div className="message-card">
                <div className="inline-header">
                  <strong>管理接入</strong>
                  <span
                    className={`status-pill ${getManagementIntegrationClassName(
                      registryVisibility.managementIntegration?.configured ?? false,
                      registryVisibility.managementIntegration?.aligned ?? false,
                    )}`}
                  >
                    {formatManagementIntegrationLabel(
                      registryVisibility.managementIntegration?.configured ?? false,
                      registryVisibility.managementIntegration?.aligned ?? false,
                    )}
                  </span>
                </div>
                {registryVisibility.managementIntegration ? (
                  <div className="stack">
                    <div className="detail-row">
                      <span className="pill">profile：{registryVisibility.managementIntegration.targetProfileKey ?? "未配置"}</span>
                      <span className="pill">期望 agent：{registryVisibility.managementIntegration.expectedAgentCount}</span>
                      <span className="pill">实际 agent：{registryVisibility.managementIntegration.actualAgentCount}</span>
                      <span className="pill">缺失 agent：{registryVisibility.managementIntegration.missingAgents.length}</span>
                      <span className="pill">字段漂移：{registryVisibility.managementIntegration.fieldMismatches.length}</span>
                    </div>
                    {registryVisibility.managementIntegration.missingAgents.length > 0 ? (
                      <div className="detail-row">
                        {registryVisibility.managementIntegration.missingAgents.map((agentId) => (
                          <span className="pill" key={agentId}>
                            {agentId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">当前没有缺失的管理 agent。</p>
                    )}
                    {registryVisibility.managementIntegration.fieldMismatches.length > 0 ? (
                      <ul className="list">
                        {registryVisibility.managementIntegration.fieldMismatches.slice(0, 3).map((mismatch) => (
                          <li className="task-row" key={`${mismatch.agentId}-${mismatch.field}`}>
                            <span className="muted">
                              {mismatch.agentId} · {mismatch.field} · 期望 {formatMismatchValue(mismatch.expected)} · 实际 {formatMismatchValue(mismatch.actual)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <p className="muted">当前还没有配置 managementIntegration，暂时只能看到 runtime 健康态。</p>
                )}
              </div>
            </div>
          ) : (
            <p className="muted">暂时还没有加载到 OpenClaw Registry 状态。</p>
          )}
        </article>

        <article className="card">
          <h3>如何使用这个页面</h3>
          <p>
            每次点击探测或调试，都会实际调用当前配置的远程模型。这里优先做单个 agent 的单次验证，避免一次性触发整组高成本请求。
          </p>
          <p className="muted">
            现在所有 agent 暂时共用 GPT-5.4，但模型目标名仍按 agent 名单独保留，方便你后续逐个替换。
          </p>
        </article>
      </div>

      {registryVisibilityError ? <p className="error-banner">{registryVisibilityError}</p> : null}
      <article className="card">
        <div className="inline-header">
          <div>
            <h3>本地 cluster 验收</h3>
            <p className="muted">在你开始逐页人工验收前，先把这里当作一块快速的人类可读状态板。</p>
          </div>
          <div className="card-actions">
            <span className={`status-pill ${localVerificationChecks.every((item) => item.passed) ? "status-done" : "status-blocked"}`}>
              {localVerificationChecks.every((item) => item.passed) ? "可用" : "待检查"}
            </span>
            <button className="button-secondary" onClick={() => void runLocalVerificationChecks()} disabled={localVerificationBusy}>
              {localVerificationBusy ? "检查中..." : "运行本地验收"}
            </button>
          </div>
        </div>
        {localVerificationError ? <p className="error-banner">{localVerificationError}</p> : null}
        <div className="grid grid-3">
          {localVerificationChecks.map((item) => (
            <article className="message-card" key={item.label}>
              <div className="stack">
                <div className="inline-header">
                  <strong>{item.label}</strong>
                  <span className={`status-pill ${item.passed ? "status-done" : "status-blocked"}`}>{item.passed ? "通过" : "待补"}</span>
                </div>
                <p className="muted">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="message-card">
          <strong>下一步最值得做的动作</strong>
          <p className="muted">{nextVerificationStep}</p>
          {localVerificationCompletedAt ? <p className="muted">最近一次本地验收运行：{new Date(localVerificationCompletedAt).toLocaleString()}</p> : null}
        </div>
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>已解析 agent 配置</h3>
            <p className="muted">显示每个 agent 当前生效的安全配置摘要，不展示原始密钥。</p>
          </div>
          <button className="button-secondary" onClick={() => void loadAgentConfigs()}>
            刷新配置
          </button>
        </div>
        {agentConfigs ? (
          <div className="stack">
            <AgentConfigCard
              title="默认模型配置"
              config={agentConfigs.defaultModelConfig}
              description="所有未单独覆写的 agent 都会继承这套默认配置。"
            />
            <div className="grid grid-3">
              {agentConfigs.agents.map((config) => (
                <AgentConfigCard key={config.target} title={config.target} config={config} />
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">暂时还没有加载到配置审计结果。</p>
        )}
      </article>

      {scenarioError ? <p className="error-banner">{scenarioError}</p> : null}
      {historyError ? <p className="error-banner">{historyError}</p> : null}
      {suiteError ? <p className="error-banner">{suiteError}</p> : null}

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>场景造数</h3>
            <p className="muted">一键造数后，下面所有 debug 都会自动切换到当前场景的 `userId / taskId / goalId`。</p>
          </div>
          <div className="card-actions">
            <button className="button-secondary" onClick={() => void loadScenarios()}>
              刷新场景
            </button>
            <button className="button-secondary" onClick={() => setActiveScenario(null)} disabled={!activeScenario}>
              使用 demo-user
            </button>
          </div>
        </div>

        <div className="grid grid-3">
          {scenarios.map((scenario) => (
            <article className="message-card" key={scenario.id}>
              <div className="stack">
                <div>
                  <strong>{scenario.title}</strong>
                  <p className="muted">{scenario.description}</p>
                </div>
                <div className="detail-row">
                  {scenario.recommendedWorkflows.map((workflow) => (
                    <span className="pill" key={workflow}>
                      {workflow}
                    </span>
                  ))}
                </div>
                <button
                  className="button-primary"
                  onClick={() => void seedScenario(scenario.id)}
                  disabled={Boolean(seedingScenarioId)}
                >
                  {seedingScenarioId === scenario.id ? "造数中..." : "执行场景造数"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {activeScenario ? (
          <div className="message-card">
            <div className="inline-header">
              <div>
                <strong>当前调试上下文</strong>
                <p className="muted">
                  {activeScenario.title} · 用户 {activeScenario.userId}
                </p>
              </div>
              <div className="detail-row">
                <span className="pill">目标 {activeScenario.counts.goals}</span>
                <span className="pill">任务 {activeScenario.counts.tasks}</span>
                <span className="pill">会话 {activeScenario.counts.sessions}</span>
                <span className="pill">评估 {activeScenario.counts.assessments}</span>
                <span className="pill">收件箱 {activeScenario.counts.inbox}</span>
              </div>
            </div>
            <div className="detail-row">
              {activeScenario.recommendedWorkflows.map((workflow) => (
                <span className="pill" key={workflow}>
                  {workflow}
                </span>
              ))}
            </div>
            <ul className="list">
              {activeScenario.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="muted">当前调试上下文：默认 `demo-user`。</p>
        )}
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>全量回归套件</h3>
            <p className="muted">一键完成 probes + 3 个场景造数 + chief route + 下游 agent 调试，适合换模型前后做整套回归。</p>
          </div>
          <button className="button-primary" onClick={() => void runFullRegressionSuite()} disabled={suiteBusy}>
            {suiteBusy ? "运行中..." : "运行全量回归"}
          </button>
        </div>

        {suiteResult ? (
          <div className="stack">
            <div className="grid grid-3">
              <MetricCard label="总步骤数" value={suiteResult.totalSteps} />
              <MetricCard label="成功数" value={suiteResult.successfulSteps} />
              <MetricCard label="Fallback 数" value={suiteResult.fallbackSteps} />
            </div>
            <div className="message-card">
              <p className="muted">
                开始于 {new Date(suiteResult.startedAt).toLocaleString()} · 完成于 {new Date(suiteResult.completedAt).toLocaleString()}
              </p>
              <div className="detail-row">
                <span className="pill">trace {formatTraceId(suiteResult.traceId)}</span>
              </div>
              <div className="detail-row">
                {suiteResult.probeSteps.map((step) => (
                  <span className={`status-pill ${step.success ? "status-done" : "status-blocked"}`} key={`${step.agentName}-${step.kind}`}>
                    {step.agentName}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-3">
              {suiteResult.scenarioResults.map((scenario) => (
                <article className="message-card" key={scenario.scenarioId}>
                  <div className="stack">
                    <strong>{scenario.title}</strong>
                    <p className="muted">
                      通过 {scenario.successfulSteps}/{scenario.totalSteps} · 回退 {scenario.fallbackSteps}
                    </p>
                    <div className="detail-row">
                      {scenario.steps.map((step) => (
                        <span className={`status-pill ${step.success ? "status-done" : "status-blocked"}`} key={`${scenario.scenarioId}-${step.label}`}>
                          {step.agentName}
                        </span>
                      ))}
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() =>
                        setActiveScenario({
                          scenarioId: scenario.scenarioId as DebugScenarioDefinition["id"],
                          title: scenario.title,
                          description: scenario.description,
                          userId: scenario.userId,
                          goalId: scenario.goalId,
                          taskId: scenario.taskId,
                          sessionId: scenario.sessionId,
                          periodType: scenario.periodType,
                          recommendedWorkflows: scenario.recommendedWorkflows,
                          notes: scenario.notes,
                          counts: scenario.counts,
                        })
                      }
                    >
                      使用这个上下文
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">暂时还没有全量回归结果。</p>
        )}
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>覆写矩阵</h3>
            <p className="muted">按 agent 定向跑轻量矩阵回归：chief 探测 + 目标 agent 探测 + 场景造数 + chief route + 目标 agent 调试。</p>
          </div>
          <div className="card-actions">
            <button className="button-secondary" onClick={() => void loadMatrixCases()}>
              刷新矩阵 case
            </button>
            <button className="button-primary" onClick={() => void runMatrixRegression()} disabled={matrixBusy || matrixCases.length === 0}>
              {matrixBusy ? "矩阵运行中..." : "运行所选矩阵"}
            </button>
          </div>
        </div>

        <div className="grid grid-3">
          {matrixCases.map((matrixCase) => (
            <label className="message-card" key={matrixCase.id}>
              <div className="stack">
                <div className="inline-header">
                  <strong>{matrixCase.title}</strong>
                  <input type="checkbox" checked={matrixCaseIds.includes(matrixCase.id)} onChange={() => toggleMatrixCase(matrixCase.id)} />
                </div>
                <p className="muted">{matrixCase.description}</p>
                <div className="detail-row">
                  <span className="pill">{matrixCase.workflow}</span>
                  <span className="pill">{matrixCase.focusAgent}</span>
                </div>
                <p className="muted">{matrixCase.overrideSummary}</p>
              </div>
            </label>
          ))}
        </div>

        {matrixResult ? (
          <div className="stack">
            <div className="grid grid-3">
              <MetricCard label="矩阵步骤数" value={matrixResult.totalSteps} />
              <MetricCard label="矩阵成功数" value={matrixResult.successfulSteps} />
              <MetricCard label="矩阵回退数" value={matrixResult.fallbackSteps} />
            </div>
            <div className="detail-row">
              <span className="pill">trace {formatTraceId(matrixResult.traceId)}</span>
            </div>
            <div className="grid grid-2">
              {matrixResult.caseResults.map((result) => (
                <article className="message-card" key={result.caseId}>
                  <div className="stack">
                    <strong>{result.title}</strong>
                    <p className="muted">
                      通过 {result.successfulSteps}/{result.totalSteps} · 回退 {result.fallbackSteps}
                    </p>
                    <div className="detail-row">
                      <span className="pill">trace {formatTraceId(result.traceId)}</span>
                      {result.parentTraceId ? <span className="pill">parent {formatTraceId(result.parentTraceId)}</span> : null}
                    </div>
                    <p className="muted">{result.overrideSummary}</p>
                    <div className="detail-row">
                      {result.resolvedConfigs.map((config) => (
                        <span className="pill" key={`${result.caseId}-${config.target}`}>
                          {config.target}:{formatReasoningEffortLabel(config.reasoningEffort)}
                        </span>
                      ))}
                    </div>
                    <div className="detail-row">
                      {result.steps.map((step) => (
                        <span className={`status-pill ${step.success ? "status-done" : "status-blocked"}`} key={`${result.caseId}-${step.label}`}>
                          {step.agentName}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">暂时还没有矩阵回归结果。</p>
        )}

        <div className="stack">
          <div className="inline-header">
            <div>
              <h3>矩阵历史</h3>
              <p className="muted">保存最近矩阵回归结果，便于切换模型或参数后直接左右对比。</p>
            </div>
            <div className="card-actions">
              <button className="button-secondary" onClick={() => void loadMatrixRunHistory()} disabled={matrixHistoryBusy}>
                {matrixHistoryBusy ? "刷新中..." : "刷新历史"}
              </button>
              <button className="button-secondary" onClick={() => void clearMatrixRunHistory()} disabled={matrixHistoryBusy || matrixRunHistory.length === 0}>
                清空历史
              </button>
            </div>
          </div>

          <article className="message-card">
            <ul className="task-list">
              {matrixRunHistory.map((run) => (
                <li className="task-row" key={run.id}>
                  <div className="task-meta">
                    <strong>{run.matrixName}</strong>
                    <div className="detail-row">
                      <span className="pill">case {run.caseResults.length}</span>
                      <span className="pill">步骤 {run.totalSteps}</span>
                      <span className={`status-pill ${run.fallbackSteps > 0 ? "status-blocked" : "status-done"}`}>
                        回退 {run.fallbackSteps}
                      </span>
                    </div>
                    <span className="muted">
                      {new Date(run.completedAt).toLocaleString()} · 请求{" "}
                      {run.requestedCaseIds.length > 0 ? run.requestedCaseIds.join(", ") : "全部 case"}
                    </span>
                    <span className="muted">trace {formatTraceId(run.traceId)}</span>
                  </div>
                  <div className="task-actions">
                    <button className="button-secondary" onClick={() => setLeftMatrixRunId(run.id)}>
                      设为左侧对比
                    </button>
                    <button className="button-secondary" onClick={() => setRightMatrixRunId(run.id)}>
                      设为右侧对比
                    </button>
                  </div>
                </li>
              ))}
              {matrixRunHistory.length === 0 ? <li className="muted">暂时还没有保存的矩阵历史。</li> : null}
            </ul>
          </article>

          <div className="grid grid-2">
            <MatrixRunCompareCard title="左侧矩阵" run={leftMatrixRun} />
            <MatrixRunCompareCard title="右侧矩阵" run={rightMatrixRun} />
          </div>
          <MatrixRunDiffCard leftRun={leftMatrixRun} rightRun={rightMatrixRun} diff={matrixDiff} />
        </div>
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>Chief 路由</h3>
            <p className="muted">先验证 chief-agent 是否能把不同 workflow 路由到正确下游 agent。当前上下文用户：{debugContext.userId}</p>
          </div>
          <div className="card-actions">
            <select value={chiefWorkflow} onChange={(event) => setChiefWorkflow(event.target.value as ChiefWorkflow)}>
              {CHIEF_WORKFLOWS.map((workflow) => (
                <option key={workflow} value={workflow}>
                  {workflow}
                </option>
              ))}
            </select>
            <button className="button-secondary" onClick={() => void runProbe("chief-agent")} disabled={Boolean(chiefState.probing)}>
              {chiefState.probing ? "探测中..." : "探测 chief-agent"}
            </button>
            <button
              className="button-primary"
              onClick={() =>
                void runDebug("chief-agent", () =>
                  api.debugChiefRoute({
                    workflow: chiefWorkflow,
                    userId: debugContext.userId,
                    taskId: debugContext.taskId,
                    periodType: debugContext.periodType,
                    scenarioId: debugContext.scenarioId,
                  }),
                )
              }
              disabled={Boolean(chiefState.debugging)}
            >
              {chiefState.debugging ? "运行中..." : "运行路由调试"}
            </button>
          </div>
        </div>
        {chiefState.probeError ? <p className="error-banner">{chiefState.probeError}</p> : null}
        {chiefState.debugError ? <p className="error-banner">{chiefState.debugError}</p> : null}
        <DebugPanel title="探测结果" result={chiefState.probe} />
        <DebugPanel title="路由结果" result={chiefState.debug} />
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>运行历史</h3>
            <p className="muted">保存当前用户上下文下最近的探测 / 调试 / 造数结果，方便切模型后对比输出差异。</p>
          </div>
          <div className="card-actions">
            <button className="button-secondary" onClick={() => void loadRunHistory(debugContext.userId)} disabled={historyBusy}>
              {historyBusy ? "刷新中..." : "刷新历史"}
            </button>
            <button className="button-secondary" onClick={() => void clearRunHistory()} disabled={historyBusy || runHistory.length === 0}>
              清空历史
            </button>
          </div>
        </div>

        <div className="grid grid-2">
          <article className="card">
            <h3>最近运行</h3>
            <ul className="list">
              {runHistory.map((run) => (
                <li key={run.id} className="task-row">
                  <div className="task-meta">
                    <strong>{run.agentName}</strong>
                    <div className="detail-row">
                      <span className={`status-pill ${run.success ? "status-done" : "status-blocked"}`}>{formatRunKind(run.kind)}</span>
                      <span className={`status-pill ${getRouteBadgeClassName(run.adapter?.route, run.fallbackLikely)}`}>
                        {getRouteBadgeLabel(run.adapter?.route, run.fallbackLikely)}
                      </span>
                      {run.workflow ? <span className="pill">{run.workflow}</span> : null}
                      {run.scenarioId ? <span className="pill">{run.scenarioId}</span> : null}
                    </div>
                    <span className="muted">
                      {formatModelLabel(run.model)} · {new Date(run.createdAt).toLocaleString()}
                    </span>
                    <span className="muted">trace {formatTraceId(run.traceId)}</span>
                    {run.adapter?.selectedEndpoint ? <span className="muted">endpoint {run.adapter.selectedEndpoint}</span> : null}
                    {run.adapter?.fallbackReason ? <span className="muted">{run.adapter.fallbackReason}</span> : null}
                    <span>{run.summary}</span>
                  </div>
                  <div className="task-actions">
                    <button className="button-secondary" onClick={() => setLeftRunId(run.id)}>
                      设为左侧对比
                    </button>
                    <button className="button-secondary" onClick={() => setRightRunId(run.id)}>
                      设为右侧对比
                    </button>
                  </div>
                </li>
              ))}
              {runHistory.length === 0 ? <li className="muted">当前用户暂时还没有运行历史。</li> : null}
            </ul>
          </article>

          <article className="card">
            <h3>运行对比</h3>
            <div className="grid grid-2">
              <RunCompareCard title="左侧" run={leftRun} />
              <RunCompareCard title="右侧" run={rightRun} />
            </div>
          </article>
        </div>
      </article>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>Trace 检视器</h3>
            <p className="muted">查看某条 trace 下的 agent 运行、矩阵运行和结构化事件时间线。</p>
          </div>
          <div className="card-actions">
            <input value={traceLookupId} onChange={(event) => setTraceLookupId(event.target.value)} placeholder="粘贴 traceId" />
            <button className="button-primary" onClick={() => void loadTraceDetails(traceLookupId)} disabled={!traceLookupId || traceBusy}>
              {traceBusy ? "加载中..." : "加载 trace"}
            </button>
          </div>
        </div>
        {traceError ? <p className="error-banner">{traceError}</p> : null}
        {traceDetails ? (
          <div className="stack">
            <div className="detail-row">
              <span className="pill">trace {formatTraceId(traceDetails.traceId)}</span>
              <span className="pill">agent runs {traceDetails.agentRuns.length}</span>
              <span className="pill">矩阵运行 {traceDetails.matrixRuns.length}</span>
              <span className="pill">events {traceDetails.events.length}</span>
            </div>
            <div className="stack">
              {traceDetails.events.map((event) => (
                <div className="message-card" key={event.id}>
                  <div className="inline-header">
                    <div>
                      <strong>{event.event}</strong>
                      <p className="muted">
                        {event.component} · {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="detail-row">
                      <span className={`status-pill ${event.level === "error" ? "status-blocked" : event.level === "warn" ? "status-removed" : "status-done"}`}>
                        {event.level}
                      </span>
                    </div>
                  </div>
                  <p>{event.message}</p>
                  <pre className="code-block">{JSON.stringify(event.metadata, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">从最近运行里选一条，或者直接粘贴 traceId 来查看。</p>
        )}
      </article>

      <div className="grid grid-2">
        {agentDefinitions.map((agent) => {
          const state = runs[agent.name] ?? {};
          return (
            <article className="card" key={agent.name}>
              <div className="inline-header">
                <div>
                  <h3>{agent.title}</h3>
                  <p className="muted">{agent.description}</p>
                </div>
                <div className="card-actions">
                  <button className="button-secondary" onClick={() => void runProbe(agent.name)} disabled={Boolean(state.probing)}>
                    {state.probing ? "探测中..." : "探测"}
                  </button>
                  <button className="button-primary" onClick={() => void runDebug(agent.name, agent.runDebug)} disabled={Boolean(state.debugging)}>
                    {state.debugging ? "运行中..." : "运行调试"}
                  </button>
                </div>
              </div>
              {state.probeError ? <p className="error-banner">{state.probeError}</p> : null}
              {state.debugError ? <p className="error-banner">{state.debugError}</p> : null}
              <DebugPanel title="探测结果" result={state.probe} />
              <DebugPanel title="调试结果" result={state.debug} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="card metric-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RunCompareCard({
  title,
  run,
}: {
  title: string;
  run: AgentDebugRun | null;
}) {
  if (!run) {
    return (
      <div className="message-card">
        <strong>{title}</strong>
        <p className="muted">请先从历史里选一条运行记录。</p>
      </div>
    );
  }

  const payloadText =
    run.payload === undefined ? "当前没有存储 payload。" : typeof run.payload === "string" ? run.payload : JSON.stringify(run.payload, null, 2);

  return (
    <div className="message-card">
      <div className="stack">
        <strong>{title}</strong>
        <div className="detail-row">
          <span className="pill">{run.agentName}</span>
          <span className="pill">{run.kind}</span>
          {run.workflow ? <span className="pill">{run.workflow}</span> : null}
        </div>
        <p className="muted">
          {formatModelLabel(run.model)} · {new Date(run.createdAt).toLocaleString()}
        </p>
        <div className="detail-row">
          <span className="pill">trace {formatTraceId(run.traceId)}</span>
          {run.parentTraceId ? <span className="pill">parent {formatTraceId(run.parentTraceId)}</span> : null}
        </div>
        <p>{run.summary}</p>
        <pre className="code-block">{payloadText}</pre>
      </div>
    </div>
  );
}

function MatrixRunCompareCard({
  title,
  run,
}: {
  title: string;
  run: DebugRegressionMatrixRun | null;
}) {
  if (!run) {
    return (
      <div className="message-card">
        <strong>{title}</strong>
        <p className="muted">请先从历史里选一条矩阵运行记录。</p>
      </div>
    );
  }

  return (
    <div className="message-card">
      <div className="stack">
        <div className="inline-header">
          <strong>{title}</strong>
          <div className="detail-row">
            <span className="pill">{run.caseResults.length} 个 case</span>
            <span className="pill">{run.totalSteps} 个步骤</span>
            <span className={`status-pill ${run.fallbackSteps > 0 ? "status-blocked" : "status-done"}`}>
              回退 {run.fallbackSteps}
            </span>
          </div>
        </div>
        <p className="muted">
          {run.matrixName} · {new Date(run.completedAt).toLocaleString()}
        </p>
        <div className="detail-row">
          <span className="pill">trace {formatTraceId(run.traceId)}</span>
        </div>
        <p className="muted">请求范围：{run.requestedCaseIds.length > 0 ? run.requestedCaseIds.join(", ") : "全部 case"}</p>
        <div className="stack">
          {run.caseResults.map((result) => (
            <div className="card" key={`${run.id}-${result.caseId}`}>
              <div className="stack">
                <div className="inline-header">
                  <strong>{result.title}</strong>
                  <div className="detail-row">
                    <span className="pill">{result.focusAgent}</span>
                    <span className="pill">{result.workflow}</span>
                  </div>
                </div>
                <p className="muted">
                  通过 {result.successfulSteps}/{result.totalSteps} · 回退 {result.fallbackSteps}
                </p>
                <div className="detail-row">
                  <span className="pill">trace {formatTraceId(result.traceId)}</span>
                  {result.parentTraceId ? <span className="pill">parent {formatTraceId(result.parentTraceId)}</span> : null}
                </div>
                <div className="detail-row">
                  {result.resolvedConfigs.map((config) => (
                    <span className="pill" key={`${run.id}-${result.caseId}-${config.target}`}>
                      {config.target}:{formatReasoningEffortLabel(config.reasoningEffort)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type MatrixRunDiff = {
  leftRunId: string;
  rightRunId: string;
  summary: {
    caseDelta: number;
    successDelta: number;
    fallbackDelta: number;
    improvedCount: number;
    regressedCount: number;
    changedCount: number;
    unchangedCount: number;
    addedCount: number;
    removedCount: number;
  };
  caseDiffs: Array<{
    caseId: string;
    title: string;
    focusAgent: string;
    workflow: string;
    status: "improved" | "regressed" | "changed" | "unchanged" | "added" | "removed";
    successDelta: number;
    fallbackDelta: number;
    leftSummary: string | null;
    rightSummary: string | null;
    configChanges: Array<{
      target: string;
      leftValue: string | null;
      rightValue: string | null;
    }>;
  }>;
};

function MatrixRunDiffCard({
  leftRun,
  rightRun,
  diff,
}: {
  leftRun: DebugRegressionMatrixRun | null;
  rightRun: DebugRegressionMatrixRun | null;
  diff: MatrixRunDiff | null;
}) {
  if (!leftRun || !rightRun) {
    return (
      <article className="card">
        <h3>矩阵差异</h3>
        <p className="muted">先从历史里各选一条左侧和右侧矩阵结果。</p>
      </article>
    );
  }

  if (!diff) {
    return (
      <article className="card">
        <h3>矩阵差异</h3>
        <p className="muted">这两条记录暂时没有可比较的 case。</p>
      </article>
    );
  }

  return (
    <article className="card">
      <div className="inline-header">
        <div>
          <h3>矩阵差异</h3>
          <p className="muted">
            左侧 {new Date(leftRun.completedAt).toLocaleString()} → 右侧 {new Date(rightRun.completedAt).toLocaleString()}
          </p>
        </div>
        <div className="detail-row">
          <span className={`status-pill ${getDeltaClassName(diff.summary.successDelta, true)}`}>
            成功 {formatDelta(diff.summary.successDelta)}
          </span>
          <span className={`status-pill ${getDeltaClassName(diff.summary.fallbackDelta, false)}`}>
            回退 {formatDelta(diff.summary.fallbackDelta)}
          </span>
          <span className={`status-pill ${getDeltaClassName(diff.summary.caseDelta, true)}`}>
            case 数 {formatDelta(diff.summary.caseDelta)}
          </span>
        </div>
      </div>

      <div className="detail-row">
        <span className="pill">改进 {diff.summary.improvedCount}</span>
        <span className="pill">回退 {diff.summary.regressedCount}</span>
        <span className="pill">变化 {diff.summary.changedCount}</span>
        <span className="pill">新增 {diff.summary.addedCount}</span>
        <span className="pill">移除 {diff.summary.removedCount}</span>
        <span className="pill">不变 {diff.summary.unchangedCount}</span>
      </div>

      <div className="stack">
        {diff.caseDiffs.map((caseDiff) => (
          <div className="message-card" key={`${diff.leftRunId}-${diff.rightRunId}-${caseDiff.caseId}`}>
            <div className="inline-header">
              <div>
                <strong>{caseDiff.title}</strong>
                <p className="muted">
                  {caseDiff.focusAgent} · {caseDiff.workflow}
                </p>
              </div>
              <div className="detail-row">
                <span className={`status-pill ${getCaseDiffStatusClassName(caseDiff.status)}`}>{formatCaseDiffStatus(caseDiff.status)}</span>
                <span className={`status-pill ${getDeltaClassName(caseDiff.successDelta, true)}`}>
                  成功 {formatDelta(caseDiff.successDelta)}
                </span>
                <span className={`status-pill ${getDeltaClassName(caseDiff.fallbackDelta, false)}`}>
                  回退 {formatDelta(caseDiff.fallbackDelta)}
                </span>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="compare-pane">
                <strong>左侧</strong>
                <p className="muted">{caseDiff.leftSummary ?? "左侧运行中不存在。"}</p>
              </div>
              <div className="compare-pane">
                <strong>右侧</strong>
                <p className="muted">{caseDiff.rightSummary ?? "右侧运行中不存在。"}</p>
              </div>
            </div>
            {caseDiff.configChanges.length > 0 ? (
              <div className="stack">
                <strong>配置变化</strong>
                <div className="stack">
                  {caseDiff.configChanges.map((change) => (
                    <div className="detail-row" key={`${caseDiff.caseId}-${change.target}`}>
                      <span className="pill">{change.target}</span>
                      <span className="muted">{change.leftValue ?? "缺失"}</span>
                      <span className="muted">→</span>
                      <span className="muted">{change.rightValue ?? "缺失"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function buildMatrixRunDiff(leftRun: DebugRegressionMatrixRun | null, rightRun: DebugRegressionMatrixRun | null): MatrixRunDiff | null {
  if (!leftRun || !rightRun) {
    return null;
  }

  const leftCases = new Map(leftRun.caseResults.map((item) => [item.caseId, item]));
  const rightCases = new Map(rightRun.caseResults.map((item) => [item.caseId, item]));
  const caseIds = Array.from(new Set([...leftCases.keys(), ...rightCases.keys()]));

  const caseDiffs = caseIds
    .map((caseId) => {
      const leftCase = leftCases.get(caseId) ?? null;
      const rightCase = rightCases.get(caseId) ?? null;
      const successDelta = (rightCase?.successfulSteps ?? 0) - (leftCase?.successfulSteps ?? 0);
      const fallbackDelta = (rightCase?.fallbackSteps ?? 0) - (leftCase?.fallbackSteps ?? 0);
      const configChanges = diffCaseConfigs(leftCase, rightCase);
      const status = resolveCaseDiffStatus({ leftCase, rightCase, successDelta, fallbackDelta, configChanges });

      return {
        caseId,
        title: rightCase?.title ?? leftCase?.title ?? caseId,
        focusAgent: rightCase?.focusAgent ?? leftCase?.focusAgent ?? "unknown-agent",
        workflow: rightCase?.workflow ?? leftCase?.workflow ?? "unknown-workflow",
        status,
        successDelta,
        fallbackDelta,
        leftSummary: leftCase ? `通过 ${leftCase.successfulSteps}/${leftCase.totalSteps} · 回退 ${leftCase.fallbackSteps}` : null,
        rightSummary: rightCase ? `通过 ${rightCase.successfulSteps}/${rightCase.totalSteps} · 回退 ${rightCase.fallbackSteps}` : null,
        configChanges,
      };
    })
    .sort((left, right) => compareCaseDiffStatus(left.status, right.status) || left.caseId.localeCompare(right.caseId));

  return {
    leftRunId: leftRun.id,
    rightRunId: rightRun.id,
    summary: {
      caseDelta: rightRun.caseResults.length - leftRun.caseResults.length,
      successDelta: rightRun.successfulSteps - leftRun.successfulSteps,
      fallbackDelta: rightRun.fallbackSteps - leftRun.fallbackSteps,
      improvedCount: caseDiffs.filter((item) => item.status === "improved").length,
      regressedCount: caseDiffs.filter((item) => item.status === "regressed").length,
      changedCount: caseDiffs.filter((item) => item.status === "changed").length,
      unchangedCount: caseDiffs.filter((item) => item.status === "unchanged").length,
      addedCount: caseDiffs.filter((item) => item.status === "added").length,
      removedCount: caseDiffs.filter((item) => item.status === "removed").length,
    },
    caseDiffs,
  };
}

function diffCaseConfigs(
  leftCase: DebugRegressionMatrixRun["caseResults"][number] | null,
  rightCase: DebugRegressionMatrixRun["caseResults"][number] | null,
) {
  const toMap = (configs: DebugRegressionMatrixRun["caseResults"][number]["resolvedConfigs"] | undefined) =>
    new Map(
      (configs ?? []).map((config) => [
        config.target,
        `${formatModelLabel(config.model)} · ${formatReasoningEffortLabel(config.reasoningEffort)} · ${config.wireApi}`,
      ]),
    );

  const leftMap = toMap(leftCase?.resolvedConfigs);
  const rightMap = toMap(rightCase?.resolvedConfigs);
  const targets = Array.from(new Set([...leftMap.keys(), ...rightMap.keys()]));

  return targets
    .map((target) => ({
      target,
      leftValue: leftMap.get(target) ?? null,
      rightValue: rightMap.get(target) ?? null,
    }))
    .filter((change) => change.leftValue !== change.rightValue);
}

function resolveCaseDiffStatus({
  leftCase,
  rightCase,
  successDelta,
  fallbackDelta,
  configChanges,
}: {
  leftCase: DebugRegressionMatrixRun["caseResults"][number] | null;
  rightCase: DebugRegressionMatrixRun["caseResults"][number] | null;
  successDelta: number;
  fallbackDelta: number;
  configChanges: Array<{ target: string; leftValue: string | null; rightValue: string | null }>;
}) {
  if (!leftCase && rightCase) {
    return "added" as const;
  }
  if (leftCase && !rightCase) {
    return "removed" as const;
  }
  if (successDelta > 0 || fallbackDelta < 0) {
    return "improved" as const;
  }
  if (successDelta < 0 || fallbackDelta > 0) {
    return "regressed" as const;
  }
  if (configChanges.length > 0) {
    return "changed" as const;
  }
  return "unchanged" as const;
}

function compareCaseDiffStatus(left: MatrixRunDiff["caseDiffs"][number]["status"], right: MatrixRunDiff["caseDiffs"][number]["status"]) {
  const order = {
    regressed: 0,
    improved: 1,
    changed: 2,
    added: 3,
    removed: 4,
    unchanged: 5,
  } as const;

  return order[left] - order[right];
}

function formatCaseDiffStatus(status: MatrixRunDiff["caseDiffs"][number]["status"]) {
  return (
    {
      improved: "改进",
      regressed: "回退",
      changed: "变化",
      added: "新增",
      removed: "移除",
      unchanged: "不变",
    } as const
  )[status];
}

function formatRunKind(kind: AgentDebugRun["kind"]) {
  return (
    {
      probe: "探测",
      debug: "调试",
      seed: "造数",
    } as const
  )[kind] ?? kind;
}

function formatAdapterStrategyLabel(strategy: OpenClawAdapterDecision["strategy"] | OpenClawAdapterStatusResponse["executionStrategy"]) {
  return strategy;
}

function formatAdapterRouteLabel(route: OpenClawAdapterDecision["route"]) {
  return route;
}

function formatExecutionModeLabel(mode: string) {
  return (
    {
      probe: "探测",
      debug: "调试",
      generate: "生成",
    } as Record<string, string>
  )[mode] ?? mode;
}

function formatReasoningEffortLabel(value?: string | null) {
  return value ?? "默认";
}

function formatModelLabel(value?: string | null) {
  return value ?? "未配置模型";
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

function getDeltaClassName(delta: number, positiveIsBetter: boolean) {
  if (delta === 0) {
    return "status-neutral";
  }
  const isPositive = delta > 0;
  const better = positiveIsBetter ? isPositive : !isPositive;
  return better ? "status-done" : "status-blocked";
}

function getCaseDiffStatusClassName(status: MatrixRunDiff["caseDiffs"][number]["status"]) {
  switch (status) {
    case "improved":
      return "status-done";
    case "regressed":
      return "status-blocked";
    case "changed":
      return "status-changed";
    case "added":
      return "status-added";
    case "removed":
      return "status-removed";
    case "unchanged":
      return "status-neutral";
  }
}

function formatTraceId(traceId?: string | null) {
  if (!traceId) {
    return "—";
  }
  if (traceId.length <= 12) {
    return traceId;
  }
  return `${traceId.slice(0, 8)}…${traceId.slice(-4)}`;
}

function getAdapterRouteClassName(route: OpenClawAdapterDecision["route"]) {
  switch (route) {
    case "cluster":
      return "status-done";
    case "provider-direct":
      return "status-in_progress";
    case "provider-fallback":
    case "failed":
      return "status-blocked";
    default:
      return "status-in_progress";
  }
}

function getRouteBadgeClassName(route?: OpenClawAdapterDecision["route"], fallbackLikely?: boolean) {
  if (route) {
    return getAdapterRouteClassName(route);
  }
  return fallbackLikely ? "status-blocked" : "status-in_progress";
}

function getRouteBadgeLabel(route?: OpenClawAdapterDecision["route"], fallbackLikely?: boolean) {
  if (route) {
    return formatAdapterRouteLabel(route);
  }
  return fallbackLikely ? "旧数据：回退" : "旧数据：直连";
}

function formatRegistryHealthLabel(status: OpenClawRegistryVisibilityResponse["externalRuntime"]["healthStatus"]) {
  return (
    {
      aligned: "已对齐",
      attention: "需要检查",
      unreachable: "不可达",
      not_configured: "未配置",
    } as const
  )[status];
}

function getRegistryHealthClassName(status: OpenClawRegistryVisibilityResponse["externalRuntime"]["healthStatus"]) {
  switch (status) {
    case "aligned":
      return "status-done";
    case "attention":
    case "unreachable":
      return "status-blocked";
    case "not_configured":
      return "status-in_progress";
    default:
      return "status-in_progress";
  }
}

function formatManagementIntegrationLabel(configured: boolean, aligned: boolean) {
  if (!configured) {
    return "未配置";
  }
  return aligned ? "已对齐" : "未对齐";
}

function getManagementIntegrationClassName(configured: boolean, aligned: boolean) {
  if (!configured) {
    return "status-in_progress";
  }
  return aligned ? "status-done" : "status-blocked";
}

function formatMismatchValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function DebugPanel({
  title,
  result,
}: {
  title: string;
  result?: ModelProbeResult | AgentDebugResult;
}) {
  if (!result) {
    return <p className="muted">{title}：暂未运行。</p>;
  }

  const payload =
    "normalizedJson" in result
      ? result.normalizedJson ?? result.extractedJson ?? result.parsed ?? result.content ?? null
      : result.parsed ?? null;

  const payloadText =
    payload === null
      ? null
      : typeof payload === "string"
        ? payload
        : JSON.stringify(payload, null, 2);

  return (
    <div className="stack">
      <div className="inline-header">
        <strong>{title}</strong>
        <div className="detail-row">
          <span className={`status-pill ${result.success ? "status-done" : "status-blocked"}`}>{result.success ? "成功" : "失败"}</span>
          <span className={`status-pill ${getRouteBadgeClassName(result.adapter?.route, result.fallbackLikely)}`}>
            {getRouteBadgeLabel(result.adapter?.route, result.fallbackLikely)}
          </span>
        </div>
      </div>
      {result.config ? (
        <p className="muted">
          {result.config.target} · {formatModelLabel(result.config.model)} · {result.config.wireApi} · 推理强度{" "}
          {formatReasoningEffortLabel(result.config.reasoningEffort)} · API key {result.config.hasApiKey ? "已存在" : "缺失"}
        </p>
      ) : null}
      {result.adapter ? (
        <div className="detail-row">
          <span className="pill">{formatAdapterStrategyLabel(result.adapter.strategy)}</span>
          <span className="pill">{formatExecutionModeLabel(result.adapter.mode)}</span>
          {result.adapter.selectedEndpoint ? <span className="pill">{result.adapter.selectedEndpoint}</span> : null}
        </div>
      ) : null}
      {result.adapter?.fallbackReason ? <p className="muted">回退原因：{result.adapter.fallbackReason}</p> : null}
      {result.traceId ? (
        <div className="detail-row">
          <span className="pill">trace {formatTraceId(result.traceId)}</span>
          {result.parentTraceId ? <span className="pill">parent {formatTraceId(result.parentTraceId)}</span> : null}
        </div>
      ) : null}
      {result.attempts?.length ? (
        <div className="detail-row">
          {result.attempts.map((attempt) => (
            <span className="pill" key={`${attempt.endpoint}-${attempt.status ?? "na"}`}>
              {attempt.endpoint} {attempt.status ?? "—"}
            </span>
          ))}
        </div>
      ) : null}
      {result.adapter?.clusterAttempts?.length ? (
        <div className="detail-row">
          {result.adapter.clusterAttempts.map((attempt) => (
            <span className="pill" key={`adapter-${attempt.endpoint}-${attempt.status ?? "na"}`}>
              cluster {attempt.endpoint} {attempt.status ?? "—"}
            </span>
          ))}
        </div>
      ) : null}
      {payloadText ? <pre className="code-block">{payloadText}</pre> : <p className="muted">当前没有返回结构化 payload。</p>}
    </div>
  );
}

function AgentConfigCard({
  title,
  config,
  description,
}: {
  title: string;
  config: DebugAgentConfigsResponse["defaultModelConfig"];
  description?: string;
}) {
  const changedFields = Object.entries(config.differsFromDefault)
    .filter(([, changed]) => changed)
    .map(([field]) => field);

  return (
    <article className="message-card">
      <div className="stack">
        <div>
          <strong>{title}</strong>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        <div className="detail-row">
          <span className="pill">{formatModelLabel(config.model)}</span>
          <span className="pill">{config.wireApi}</span>
          <span className="pill">{formatReasoningEffortLabel(config.reasoningEffort)}</span>
          <span className="pill">{config.hasApiKey ? "API key 已配置" : "API key 缺失"}</span>
        </div>
        <p className="muted">
          Prefix：<code className="inline-code">{config.envPrefix}</code>
        </p>
        <p className="muted">
          Base URL：<span className="long-text">{config.baseUrl ?? "未配置"}</span>
        </p>
        <p className="muted">
          {changedFields.length > 0 ? `相对默认配置有差异：${changedFields.join(", ")}` : "当前与默认生效配置一致。"}
        </p>
      </div>
    </article>
  );
}
