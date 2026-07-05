import path from "node:path";

export const M6_MOBILE_CAPTURE_ENDPOINT_PLAN = [
  { label: "mobile-device-register", method: "POST", endpoint: "/mobile/devices/register" },
  { label: "edge-device-register", method: "POST", endpoint: "/devices/register" },
  { label: "device-heartbeat", method: "POST", endpoint: "/devices/heartbeat" },
  { label: "audio-session-start", method: "POST", endpoint: "/mobile/capture/sessions/start" },
  { label: "call-event", method: "POST", endpoint: "/mobile/call-events" },
  { label: "emotion-assessment", method: "POST", endpoint: "/emotion/assessments" },
  { label: "media-upload-session", method: "POST", endpoint: "/media/upload-sessions" },
  { label: "media-upload-part", method: "POST", endpoint: "/media/upload-sessions/:sessionId/parts" },
  { label: "media-upload-complete", method: "POST", endpoint: "/media/upload-sessions/:sessionId/complete" },
  { label: "video-assessment", method: "POST", endpoint: "/video/assessments" },
  { label: "health-snapshot", method: "POST", endpoint: "/health/snapshots" },
  { label: "audio-session-end", method: "POST", endpoint: "/mobile/capture/sessions/end" },
  { label: "recovery-plan", method: "POST", endpoint: "/recovery/plan" },
  { label: "recovery-history", method: "GET", endpoint: "/recovery/history" },
  { label: "health-latest", method: "GET", endpoint: "/health/latest" },
  { label: "client-inbox", method: "GET", endpoint: "/client/inbox" },
  { label: "inbox-ack", method: "POST", endpoint: "/client/inbox/:messageId/ack" },
  { label: "dashboard-summary", method: "GET", endpoint: "/dashboard/summary" },
  { label: "inbox-overview", method: "GET", endpoint: "/client/inbox/overview" },
];

export function defaultM6MobileCaptureAdbE2eJsonPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `m6-mobile-capture-adb-e2e-${stamp}.json`);
}

export function defaultM6MobileCaptureAdbE2eMarkdownPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `m6-mobile-capture-adb-e2e-${stamp}.md`);
}

const compactIds = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "—";
  }
  const entries = Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== "");
  if (entries.length === 0) {
    return "—";
  }
  return entries.map(([key, entry]) => `${key}=${entry}`).join(", ");
};

const normalizePhaseResults = (phaseResults = []) =>
  (Array.isArray(phaseResults) ? phaseResults : []).map((phase) => ({
    name: phase?.name ?? "unknown",
    latestHealthId: phase?.latestHealthId ?? null,
    latestHealthDeviceId: phase?.latestHealthDeviceId ?? null,
    latestRecoveryPlanId: phase?.latestRecoveryPlanId ?? null,
    inboxMessageCount: phase?.inboxMessageCount ?? 0,
    inboxLatestRiskLevel: phase?.inboxLatestRiskLevel ?? null,
    postRecoveryWriteAccepted: phase?.postRecoveryWriteAccepted === true,
  }));

const normalizeClientSession = (clientSession = {}) => ({
  enabled: clientSession?.enabled === true,
  authMode: clientSession?.authMode ?? null,
  authEmail: clientSession?.authEmail ?? null,
  authRegistered: clientSession?.enabled === true ? clientSession?.authRegistered === true : true,
  authLoggedIn: clientSession?.enabled === true ? clientSession?.authLoggedIn === true : true,
  clientMeOk: clientSession?.enabled === true ? clientSession?.clientMeOk === true : true,
  clientBootstrapOk: clientSession?.enabled === true ? clientSession?.clientBootstrapOk === true : true,
  clientInboxOk: clientSession?.enabled === true ? clientSession?.clientInboxOk === true : true,
  clientAckReflected:
    clientSession?.enabled === true ? (clientSession?.clientAckAttempted === true ? clientSession?.clientAckReflected === true : true) : true,
  clientAckAttempted: clientSession?.clientAckAttempted === true,
});

const normalizeClientPolling = (clientPolling = {}, clientSession = {}) => {
  const enabled = clientPolling?.enabled === true;
  const rounds = (Array.isArray(clientPolling?.rounds) ? clientPolling.rounds : []).map((round, index) => ({
    round: Number(round?.round ?? index + 1),
    elapsedMs: Number(round?.elapsedMs ?? 0),
    bootstrapOk: round?.bootstrapOk === true,
    inboxOk: round?.inboxOk === true,
    overviewOk: round?.overviewOk === true,
    bootstrapUserId: round?.bootstrapUserId ?? null,
    inboxMessageCount: Number(round?.inboxMessageCount ?? 0),
    overviewMessageCount: Number(round?.overviewMessageCount ?? 0),
    acknowledgedMessageVisible: round?.acknowledgedMessageVisible === true,
  }));
  const minPollCount = Number(clientPolling?.minPollCount ?? 2);
  const allRoundResponsesOk = rounds.every((round) => round.bootstrapOk && round.inboxOk && round.overviewOk);
  const bootstrapUserIds = rounds.map((round) => round.bootstrapUserId).filter(Boolean);
  const bootstrapStable = rounds.length > 0 && bootstrapUserIds.length === rounds.length && new Set(bootstrapUserIds).size === 1;
  const inboxReadable = rounds.every((round) => round.inboxMessageCount >= 0 && round.overviewMessageCount >= 0);
  const ackStatusStable = clientSession?.clientAckAttempted === true ? rounds.every((round) => round.acknowledgedMessageVisible === true) : true;

  return {
    enabled,
    durationMs: Number(clientPolling?.durationMs ?? 0),
    intervalMs: Number(clientPolling?.intervalMs ?? 0),
    minPollCount,
    completed: enabled ? clientPolling?.completed === true : true,
    pollCount: rounds.length,
    allOk: enabled ? clientPolling?.completed === true && rounds.length >= minPollCount && allRoundResponsesOk : true,
    bootstrapStable: enabled ? bootstrapStable : true,
    inboxReadable: enabled ? inboxReadable : true,
    ackStatusStable: enabled ? ackStatusStable : true,
    rounds,
  };
};

const normalizeSessionRecovery = (sessionRecovery = {}) => {
  const enabled = sessionRecovery?.enabled === true;
  return {
    enabled,
    tokenPersisted: enabled ? sessionRecovery?.tokenPersisted === true : true,
    tokenReloaded: enabled ? sessionRecovery?.tokenReloaded === true : true,
    meOk: enabled ? sessionRecovery?.meOk === true : true,
    bootstrapOk: enabled ? sessionRecovery?.bootstrapOk === true : true,
    inboxOk: enabled ? sessionRecovery?.inboxOk === true : true,
    overviewOk: enabled ? sessionRecovery?.overviewOk === true : true,
    userStable: enabled ? sessionRecovery?.userStable === true : true,
    recoveredUserId: sessionRecovery?.recoveredUserId ?? null,
    tokenFilePath: sessionRecovery?.tokenFilePath ?? null,
  };
};

const normalizeRefreshTokenRecovery = (refreshTokenRecovery = {}) => {
  const enabled = refreshTokenRecovery?.enabled === true;
  return {
    enabled,
    tokenIssued: enabled ? refreshTokenRecovery?.tokenIssued === true : true,
    tokenPersisted: enabled ? refreshTokenRecovery?.tokenPersisted === true : true,
    tokenReloaded: enabled ? refreshTokenRecovery?.tokenReloaded === true : true,
    tokenRotated: enabled ? refreshTokenRecovery?.tokenRotated === true : true,
    oldRefreshTokenRejected: enabled ? refreshTokenRecovery?.oldRefreshTokenRejected === true : true,
    meOk: enabled ? refreshTokenRecovery?.meOk === true : true,
    bootstrapOk: enabled ? refreshTokenRecovery?.bootstrapOk === true : true,
    logoutRevoked: enabled ? refreshTokenRecovery?.logoutRevoked === true : true,
    postLogoutRefreshRejected: enabled ? refreshTokenRecovery?.postLogoutRefreshRejected === true : true,
    userStable: enabled ? refreshTokenRecovery?.userStable === true : true,
    recoveredUserId: refreshTokenRecovery?.recoveredUserId ?? null,
    tokenFilePath: refreshTokenRecovery?.tokenFilePath ?? null,
  };
};

const readModelResult = (readModels = {}) => ({
  healthLatestReflectsDevice: readModels.healthLatestReflectsDevice === true,
  dashboardReflectsDevice: readModels.dashboardReflectsDevice === true,
  inboxOverviewOk: readModels.inboxOverviewOk === true,
  inboxAckReflected: readModels.inboxAckReflected === true,
  recoveryPlanCreated: readModels.recoveryPlanCreated === true,
  recoveryHistoryReflectsPlan: readModels.recoveryHistoryReflectsPlan === true,
  recoveryInboxConsistent: readModels.recoveryInboxConsistent === true,
  recoveryDashboardConsistent: readModels.recoveryDashboardConsistent === true,
});

export function buildM6MobileCaptureAdbE2eSummary(report) {
  const steps = Array.isArray(report?.steps) ? report.steps : [];
  const preflight = report?.preflight ?? {};
  const readModels = readModelResult(report?.readModels);
  const phaseResults = normalizePhaseResults(report?.phaseResults);
  const clientSession = normalizeClientSession(report?.clientSession);
  const clientPolling = normalizeClientPolling(report?.clientPolling, clientSession);
  const sessionRecovery = normalizeSessionRecovery(report?.sessionRecovery);
  const refreshTokenRecovery = normalizeRefreshTokenRecovery(report?.refreshTokenRecovery);
  const failedSteps = steps.filter((step) => step?.ok === false && step?.countAsFailure !== false).length;
  const latestHealthIds = phaseResults.map((phase) => phase.latestHealthId).filter(Boolean);
  const latestHealthProgressed = phaseResults.length === 0 ? true : new Set(latestHealthIds).size > 1;
  const firstRecoveryPhaseIndex = phaseResults.findIndex((phase) => typeof phase.latestRecoveryPlanId === "string" && phase.latestRecoveryPlanId.length > 0);
  const recoveryPlanPersistedAcrossPhases =
    phaseResults.length === 0 || firstRecoveryPhaseIndex < 0
      ? true
      : phaseResults
          .slice(firstRecoveryPhaseIndex)
          .every((phase) => phase.latestRecoveryPlanId === phaseResults[firstRecoveryPhaseIndex].latestRecoveryPlanId);
  const postRecoveryPhase = phaseResults.find((phase) => phase.name === "post-recovery") ?? null;
  const postRecoverySamplingAccepted = phaseResults.length === 0 ? true : postRecoveryPhase?.postRecoveryWriteAccepted === true;
  const errorSamples = [
    ...steps
      .filter((step) => step?.ok === false && step?.countAsFailure !== false)
      .map((step) => `${step.label} failed with HTTP ${step.status ?? "ERR"}`),
    ...(readModels.healthLatestReflectsDevice ? [] : ["read model check failed: healthLatestReflectsDevice"]),
    ...(readModels.dashboardReflectsDevice ? [] : ["read model check failed: dashboardReflectsDevice"]),
    ...(readModels.inboxOverviewOk ? [] : ["read model check failed: inboxOverviewOk"]),
    ...(readModels.inboxAckReflected ? [] : ["read model check failed: inboxAckReflected"]),
    ...(readModels.recoveryPlanCreated ? [] : ["read model check failed: recoveryPlanCreated"]),
    ...(readModels.recoveryHistoryReflectsPlan ? [] : ["read model check failed: recoveryHistoryReflectsPlan"]),
    ...(readModels.recoveryInboxConsistent ? [] : ["read model check failed: recoveryInboxConsistent"]),
    ...(readModels.recoveryDashboardConsistent ? [] : ["read model check failed: recoveryDashboardConsistent"]),
    ...(latestHealthProgressed ? [] : ["cadence check failed: latestHealthProgressed"]),
    ...(recoveryPlanPersistedAcrossPhases ? [] : ["cadence check failed: recoveryPlanPersistedAcrossPhases"]),
    ...(postRecoverySamplingAccepted ? [] : ["cadence check failed: postRecoverySamplingAccepted"]),
    ...(clientSession.authLoggedIn ? [] : ["client session check failed: authLoggedIn"]),
    ...(clientSession.clientMeOk ? [] : ["client session check failed: clientMeOk"]),
    ...(clientSession.clientBootstrapOk ? [] : ["client session check failed: clientBootstrapOk"]),
    ...(clientSession.clientInboxOk ? [] : ["client session check failed: clientInboxOk"]),
    ...(clientSession.clientAckReflected ? [] : ["client session check failed: clientAckReflected"]),
    ...(clientPolling.completed ? [] : ["client polling check failed: clientPollingCompleted"]),
    ...(clientPolling.allOk ? [] : ["client polling check failed: clientPollingAllOk"]),
    ...(clientPolling.bootstrapStable ? [] : ["client polling check failed: clientPollingBootstrapStable"]),
    ...(clientPolling.inboxReadable ? [] : ["client polling check failed: clientPollingInboxReadable"]),
    ...(clientPolling.ackStatusStable ? [] : ["client polling check failed: clientPollingAckStatusStable"]),
    ...(sessionRecovery.tokenPersisted ? [] : ["session recovery check failed: sessionRecoveryTokenPersisted"]),
    ...(sessionRecovery.tokenReloaded ? [] : ["session recovery check failed: sessionRecoveryTokenReloaded"]),
    ...(sessionRecovery.meOk ? [] : ["session recovery check failed: sessionRecoveryMeOk"]),
    ...(sessionRecovery.bootstrapOk ? [] : ["session recovery check failed: sessionRecoveryBootstrapOk"]),
    ...(sessionRecovery.inboxOk ? [] : ["session recovery check failed: sessionRecoveryInboxOk"]),
    ...(sessionRecovery.overviewOk ? [] : ["session recovery check failed: sessionRecoveryOverviewOk"]),
    ...(sessionRecovery.userStable ? [] : ["session recovery check failed: sessionRecoveryUserStable"]),
    ...(refreshTokenRecovery.tokenIssued ? [] : ["refresh token recovery check failed: refreshTokenIssued"]),
    ...(refreshTokenRecovery.tokenPersisted ? [] : ["refresh token recovery check failed: refreshTokenPersisted"]),
    ...(refreshTokenRecovery.tokenReloaded ? [] : ["refresh token recovery check failed: refreshTokenReloaded"]),
    ...(refreshTokenRecovery.tokenRotated ? [] : ["refresh token recovery check failed: refreshTokenRotated"]),
    ...(refreshTokenRecovery.oldRefreshTokenRejected ? [] : ["refresh token recovery check failed: oldRefreshTokenRejected"]),
    ...(refreshTokenRecovery.meOk ? [] : ["refresh token recovery check failed: refreshTokenMeOk"]),
    ...(refreshTokenRecovery.bootstrapOk ? [] : ["refresh token recovery check failed: refreshTokenBootstrapOk"]),
    ...(refreshTokenRecovery.logoutRevoked ? [] : ["refresh token recovery check failed: refreshTokenLogoutRevoked"]),
    ...(refreshTokenRecovery.postLogoutRefreshRejected ? [] : ["refresh token recovery check failed: postLogoutRefreshRejected"]),
    ...(refreshTokenRecovery.userStable ? [] : ["refresh token recovery check failed: refreshTokenUserStable"]),
    ...((report?.errors ?? []).map((error) => String(error))),
  ].slice(0, 10);

  return {
    passed:
      Object.values(preflight).every((value) => value === true) &&
      steps.length > 0 &&
      failedSteps === 0 &&
      readModels.healthLatestReflectsDevice &&
      readModels.dashboardReflectsDevice &&
      readModels.inboxOverviewOk &&
      readModels.inboxAckReflected &&
      readModels.recoveryPlanCreated &&
      readModels.recoveryHistoryReflectsPlan &&
      readModels.recoveryInboxConsistent &&
      readModels.recoveryDashboardConsistent &&
      latestHealthProgressed &&
      recoveryPlanPersistedAcrossPhases &&
      postRecoverySamplingAccepted &&
      clientSession.authLoggedIn &&
      clientSession.clientMeOk &&
      clientSession.clientBootstrapOk &&
      clientSession.clientInboxOk &&
      clientSession.clientAckReflected &&
      clientPolling.completed &&
      clientPolling.allOk &&
      clientPolling.bootstrapStable &&
      clientPolling.inboxReadable &&
      clientPolling.ackStatusStable &&
      sessionRecovery.tokenPersisted &&
      sessionRecovery.tokenReloaded &&
      sessionRecovery.meOk &&
      sessionRecovery.bootstrapOk &&
      sessionRecovery.inboxOk &&
      sessionRecovery.overviewOk &&
      sessionRecovery.userStable &&
      refreshTokenRecovery.tokenIssued &&
      refreshTokenRecovery.tokenPersisted &&
      refreshTokenRecovery.tokenReloaded &&
      refreshTokenRecovery.tokenRotated &&
      refreshTokenRecovery.oldRefreshTokenRejected &&
      refreshTokenRecovery.meOk &&
      refreshTokenRecovery.bootstrapOk &&
      refreshTokenRecovery.logoutRevoked &&
      refreshTokenRecovery.postLogoutRefreshRejected &&
      refreshTokenRecovery.userStable &&
      errorSamples.length === 0,
    totalSteps: steps.length,
    failedSteps,
    phaseCount: phaseResults.length,
    phaseResults,
    latestHealthProgressed,
    recoveryPlanPersistedAcrossPhases,
    postRecoverySamplingAccepted,
    authMode: clientSession.authMode,
    authRegistered: clientSession.authRegistered,
    authLoggedIn: clientSession.authLoggedIn,
    clientMeOk: clientSession.clientMeOk,
    clientBootstrapOk: clientSession.clientBootstrapOk,
    clientInboxOk: clientSession.clientInboxOk,
    clientAckReflected: clientSession.clientAckReflected,
    clientPollingEnabled: clientPolling.enabled,
    clientPollingDurationMs: clientPolling.durationMs,
    clientPollingIntervalMs: clientPolling.intervalMs,
    clientPollingPollCount: clientPolling.pollCount,
    clientPollingCompleted: clientPolling.completed,
    clientPollingAllOk: clientPolling.allOk,
    clientPollingBootstrapStable: clientPolling.bootstrapStable,
    clientPollingInboxReadable: clientPolling.inboxReadable,
    clientPollingAckStatusStable: clientPolling.ackStatusStable,
    sessionRecoveryEnabled: sessionRecovery.enabled,
    sessionRecoveryTokenPersisted: sessionRecovery.tokenPersisted,
    sessionRecoveryTokenReloaded: sessionRecovery.tokenReloaded,
    sessionRecoveryMeOk: sessionRecovery.meOk,
    sessionRecoveryBootstrapOk: sessionRecovery.bootstrapOk,
    sessionRecoveryInboxOk: sessionRecovery.inboxOk,
    sessionRecoveryOverviewOk: sessionRecovery.overviewOk,
    sessionRecoveryUserStable: sessionRecovery.userStable,
    refreshTokenRecoveryEnabled: refreshTokenRecovery.enabled,
    refreshTokenIssued: refreshTokenRecovery.tokenIssued,
    refreshTokenPersisted: refreshTokenRecovery.tokenPersisted,
    refreshTokenReloaded: refreshTokenRecovery.tokenReloaded,
    refreshTokenRotated: refreshTokenRecovery.tokenRotated,
    oldRefreshTokenRejected: refreshTokenRecovery.oldRefreshTokenRejected,
    refreshTokenMeOk: refreshTokenRecovery.meOk,
    refreshTokenBootstrapOk: refreshTokenRecovery.bootstrapOk,
    refreshTokenLogoutRevoked: refreshTokenRecovery.logoutRevoked,
    postLogoutRefreshRejected: refreshTokenRecovery.postLogoutRefreshRejected,
    refreshTokenUserStable: refreshTokenRecovery.userStable,
    clientSession,
    clientPolling,
    sessionRecovery,
    refreshTokenRecovery,
    readModels,
    responseIds: report?.responseIds ?? {},
    errorSamples,
  };
}

const renderSteps = (steps = []) => {
  if (steps.length === 0) {
    return "| Step | Method | Endpoint | HTTP | OK | Response IDs |\n| --- | --- | --- | --- | --- | --- |\n";
  }

  return `| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
${steps
  .map(
    (step) =>
      `| ${step.label} | \`${step.method}\` | \`${step.endpoint}\` | \`${step.status ?? "ERR"}\` | \`${Boolean(step.ok)}\` | ${compactIds(step.responseIds)} |`,
  )
  .join("\n")}`;
};

export function renderM6MobileCaptureAdbE2EReadModels(readModels = {}) {
  return [
    `- healthLatestReflectsDevice: \`${readModels.healthLatestReflectsDevice === true}\``,
    `- dashboardReflectsDevice: \`${readModels.dashboardReflectsDevice === true}\``,
    `- inboxOverviewOk: \`${readModels.inboxOverviewOk === true}\``,
    `- inboxAckReflected: \`${readModels.inboxAckReflected === true}\``,
    `- recoveryPlanCreated: \`${readModels.recoveryPlanCreated === true}\``,
    `- recoveryHistoryReflectsPlan: \`${readModels.recoveryHistoryReflectsPlan === true}\``,
    `- recoveryInboxConsistent: \`${readModels.recoveryInboxConsistent === true}\``,
    `- recoveryDashboardConsistent: \`${readModels.recoveryDashboardConsistent === true}\``,
  ].join("\n");
}

const renderErrors = (errors = []) => (errors.length > 0 ? errors.map((error) => `- ${error}`).join("\n") : "- none");

const renderClientSession = (clientSession = {}) => {
  if (clientSession?.enabled !== true) {
    return "- enabled: `false`";
  }

  return [
    `- enabled: \`true\``,
    `- authMode: \`${clientSession.authMode ?? "—"}\``,
    `- authEmail: \`${clientSession.authEmail ?? "—"}\``,
    `- authRegistered: \`${clientSession.authRegistered === true}\``,
    `- authLoggedIn: \`${clientSession.authLoggedIn === true}\``,
    `- clientMeOk: \`${clientSession.clientMeOk === true}\``,
    `- clientBootstrapOk: \`${clientSession.clientBootstrapOk === true}\``,
    `- clientInboxOk: \`${clientSession.clientInboxOk === true}\``,
    `- clientAckAttempted: \`${clientSession.clientAckAttempted === true}\``,
    `- clientAckReflected: \`${clientSession.clientAckReflected === true}\``,
  ].join("\n");
};

const renderPhases = (phaseResults = []) => {
  if (phaseResults.length === 0) {
    return "- none";
  }

  return phaseResults
    .map(
      (phase) =>
        `- ${phase.name}: latestHealthId=\`${phase.latestHealthId ?? "—"}\`, latestRecoveryPlanId=\`${phase.latestRecoveryPlanId ?? "—"}\`, inboxMessageCount=\`${phase.inboxMessageCount}\`, inboxLatestRiskLevel=\`${phase.inboxLatestRiskLevel ?? "—"}\`, postRecoveryWriteAccepted=\`${phase.postRecoveryWriteAccepted}\``,
    )
    .join("\n");
};

const renderClientPolling = (clientPolling = {}) => {
  if (clientPolling?.enabled !== true) {
    return "- enabled: `false`";
  }

  const rounds =
    Array.isArray(clientPolling.rounds) && clientPolling.rounds.length > 0
      ? clientPolling.rounds
          .map(
            (round) =>
              `- round ${round.round}: elapsedMs=\`${round.elapsedMs}\`, bootstrapOk=\`${round.bootstrapOk}\`, inboxOk=\`${round.inboxOk}\`, overviewOk=\`${round.overviewOk}\`, bootstrapUserId=\`${round.bootstrapUserId ?? "—"}\`, inboxMessageCount=\`${round.inboxMessageCount}\`, overviewMessageCount=\`${round.overviewMessageCount}\`, acknowledgedMessageVisible=\`${round.acknowledgedMessageVisible}\``,
          )
          .join("\n")
      : "- no polling rounds";

  return [
    `- enabled: \`true\``,
    `- durationMs: \`${clientPolling.durationMs ?? 0}\``,
    `- intervalMs: \`${clientPolling.intervalMs ?? 0}\``,
    `- completed: \`${clientPolling.completed === true}\``,
    `- pollCount: \`${clientPolling.pollCount ?? 0}\``,
    `- allOk: \`${clientPolling.allOk === true}\``,
    `- bootstrapStable: \`${clientPolling.bootstrapStable === true}\``,
    `- inboxReadable: \`${clientPolling.inboxReadable === true}\``,
    `- ackStatusStable: \`${clientPolling.ackStatusStable === true}\``,
    "",
    rounds,
  ].join("\n");
};

const renderSessionRecovery = (sessionRecovery = {}) => {
  if (sessionRecovery?.enabled !== true) {
    return "- enabled: `false`";
  }

  return [
    `- enabled: \`true\``,
    `- tokenStorage: \`android-temp-file\``,
    `- tokenFilePath: \`${sessionRecovery.tokenFilePath ?? "—"}\``,
    `- tokenPersisted: \`${sessionRecovery.tokenPersisted === true}\``,
    `- tokenReloaded: \`${sessionRecovery.tokenReloaded === true}\``,
    `- meOk: \`${sessionRecovery.meOk === true}\``,
    `- bootstrapOk: \`${sessionRecovery.bootstrapOk === true}\``,
    `- inboxOk: \`${sessionRecovery.inboxOk === true}\``,
    `- overviewOk: \`${sessionRecovery.overviewOk === true}\``,
    `- userStable: \`${sessionRecovery.userStable === true}\``,
    `- recoveredUserId: \`${sessionRecovery.recoveredUserId ?? "—"}\``,
  ].join("\n");
};

const renderRefreshTokenRecovery = (refreshTokenRecovery = {}) => {
  if (refreshTokenRecovery?.enabled !== true) {
    return "- enabled: `false`";
  }

  return [
    `- enabled: \`true\``,
    `- tokenStorage: \`android-temp-file\``,
    `- tokenFilePath: \`${refreshTokenRecovery.tokenFilePath ?? "—"}\``,
    `- tokenIssued: \`${refreshTokenRecovery.tokenIssued === true}\``,
    `- tokenPersisted: \`${refreshTokenRecovery.tokenPersisted === true}\``,
    `- tokenReloaded: \`${refreshTokenRecovery.tokenReloaded === true}\``,
    `- tokenRotated: \`${refreshTokenRecovery.tokenRotated === true}\``,
    `- oldRefreshTokenRejected: \`${refreshTokenRecovery.oldRefreshTokenRejected === true}\``,
    `- meOk: \`${refreshTokenRecovery.meOk === true}\``,
    `- bootstrapOk: \`${refreshTokenRecovery.bootstrapOk === true}\``,
    `- logoutRevoked: \`${refreshTokenRecovery.logoutRevoked === true}\``,
    `- postLogoutRefreshRejected: \`${refreshTokenRecovery.postLogoutRefreshRejected === true}\``,
    `- userStable: \`${refreshTokenRecovery.userStable === true}\``,
    `- recoveredUserId: \`${refreshTokenRecovery.recoveredUserId ?? "—"}\``,
  ].join("\n");
};

export function renderM6MobileCaptureAdbE2eMarkdown(report) {
  const summary = report.summary ?? buildM6MobileCaptureAdbE2eSummary(report);

  return `# M6 Mobile Capture ADB E2E

- generatedAt: \`${report.generatedAt ?? "—"}\`
- completedAt: \`${report.completedAt ?? "—"}\`
- apiBaseUrl: \`${report.apiBaseUrl ?? "—"}\`
- apiLanBaseUrl: \`${report.apiLanBaseUrl ?? "—"}\`
- openClawBaseUrl: \`${report.openClawBaseUrl ?? "—"}\`
- passed: \`${summary.passed}\`

## Device

- serial: \`${report.device?.serial ?? "—"}\`
- model: \`${report.device?.model ?? "—"}\`
- androidVersion: \`${report.device?.androidVersion ?? "—"}\`
- wifiIp: \`${report.device?.wifiIp ?? "—"}\`
- curlPath: \`${report.device?.curlPath ?? "—"}\`

## Preflight

- adbDeviceConnected: \`${report.preflight?.adbDeviceConnected ?? false}\`
- wifiIpDetected: \`${report.preflight?.wifiIpDetected ?? false}\`
- curlAvailable: \`${report.preflight?.curlAvailable ?? false}\`
- gatewayLanHealthOk: \`${report.preflight?.gatewayLanHealthOk ?? false}\`

## Summary

- totalSteps: \`${summary.totalSteps}\`
- failedSteps: \`${summary.failedSteps}\`
- phaseCount: \`${summary.phaseCount ?? 0}\`
- latestHealthProgressed: \`${summary.latestHealthProgressed ?? true}\`
- recoveryPlanPersistedAcrossPhases: \`${summary.recoveryPlanPersistedAcrossPhases ?? true}\`
- postRecoverySamplingAccepted: \`${summary.postRecoverySamplingAccepted ?? true}\`

## Read Models

${renderM6MobileCaptureAdbE2EReadModels(summary.readModels)}

## Client Session

${renderClientSession(summary.clientSession)}

## Client Polling

${renderClientPolling(summary.clientPolling)}

## Session Recovery

${renderSessionRecovery(summary.sessionRecovery)}

## Refresh Token Recovery

${renderRefreshTokenRecovery(summary.refreshTokenRecovery)}

## Phases

${renderPhases(summary.phaseResults)}

## Steps

${renderSteps(report.steps)}

## Response IDs

\`\`\`json
${JSON.stringify(summary.responseIds, null, 2)}
\`\`\`

## Error Samples

${renderErrors(summary.errorSamples)}
`;
}
