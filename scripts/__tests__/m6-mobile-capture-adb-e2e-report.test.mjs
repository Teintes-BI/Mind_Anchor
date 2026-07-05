import test from "node:test";
import assert from "node:assert/strict";

import {
  buildM6MobileCaptureAdbE2eSummary,
  renderM6MobileCaptureAdbE2eMarkdown,
} from "../lib/m6-mobile-capture-adb-e2e-report.mjs";

const okStep = (label, endpoint, response = {}) => ({
  label,
  endpoint,
  method: endpoint.startsWith("GET ") ? "GET" : "POST",
  status: 200,
  ok: true,
  response,
});

const toleratedFailureStep = (label, endpoint, status, response = {}) => ({
  label,
  endpoint,
  method: endpoint.startsWith("GET ") ? "GET" : "POST",
  status,
  ok: false,
  countAsFailure: false,
  response,
});

const cadencePhase = ({
  name,
  latestHealthId,
  latestHealthDeviceId = "android-m6-capture",
  latestRecoveryPlanId = null,
  inboxMessageCount = 0,
  inboxLatestRiskLevel = null,
  postRecoveryWriteAccepted = false,
}) => ({
  name,
  latestHealthId,
  latestHealthDeviceId,
  latestRecoveryPlanId,
  inboxMessageCount,
  inboxLatestRiskLevel,
  postRecoveryWriteAccepted,
});

const authenticatedClientSession = (overrides = {}) => ({
  enabled: true,
  authMode: "local-account",
  authRegistered: false,
  authLoggedIn: true,
  clientMeOk: true,
  clientBootstrapOk: true,
  clientInboxOk: true,
  clientAckReflected: true,
  ...overrides,
});

const clientPolling = (overrides = {}) => ({
  enabled: true,
  durationMs: 30000,
  intervalMs: 5000,
  completed: true,
  rounds: [
    {
      round: 1,
      elapsedMs: 0,
      bootstrapOk: true,
      inboxOk: true,
      overviewOk: true,
      bootstrapUserId: "user-1",
      inboxMessageCount: 2,
      overviewMessageCount: 2,
      acknowledgedMessageVisible: true,
    },
    {
      round: 2,
      elapsedMs: 5000,
      bootstrapOk: true,
      inboxOk: true,
      overviewOk: true,
      bootstrapUserId: "user-1",
      inboxMessageCount: 2,
      overviewMessageCount: 2,
      acknowledgedMessageVisible: true,
    },
  ],
  ...overrides,
});

const sessionRecovery = (overrides = {}) => ({
  enabled: true,
  tokenPersisted: true,
  tokenReloaded: true,
  meOk: true,
  bootstrapOk: true,
  inboxOk: true,
  overviewOk: true,
  userStable: true,
  recoveredUserId: "user-1",
  ...overrides,
});

const refreshTokenRecovery = (overrides = {}) => ({
  enabled: true,
  tokenIssued: true,
  tokenPersisted: true,
  tokenReloaded: true,
  tokenRotated: true,
  oldRefreshTokenRejected: true,
  meOk: true,
  bootstrapOk: true,
  logoutRevoked: true,
  postLogoutRefreshRejected: true,
  userStable: true,
  recoveredUserId: "user-1",
  ...overrides,
});

test("M6 mobile capture summary passes for all successful endpoints and read models", () => {
  const report = {
    steps: [
      okStep("mobile-device-register", "/mobile/devices/register", { deviceId: "android-m6-device" }),
      okStep("media-upload-complete", "/media/upload-sessions/session-1/complete", { id: "session-1", status: "completed" }),
    ],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
  };

  const summary = buildM6MobileCaptureAdbE2eSummary(report);

  assert.equal(summary.passed, true);
  assert.equal(summary.totalSteps, 2);
  assert.equal(summary.failedSteps, 0);
  assert.deepEqual(summary.readModels, {
    healthLatestReflectsDevice: true,
    dashboardReflectsDevice: true,
    inboxOverviewOk: true,
    inboxAckReflected: true,
    recoveryPlanCreated: true,
    recoveryHistoryReflectsPlan: true,
    recoveryInboxConsistent: true,
    recoveryDashboardConsistent: true,
  });
});

test("M6 mobile capture summary fails on endpoint failure", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [
      {
        label: "health-snapshot",
        endpoint: "/health/snapshots",
        method: "POST",
        status: 500,
        ok: false,
        error: "server error",
      },
    ],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.failedSteps, 1);
  assert.deepEqual(summary.errorSamples, ["health-snapshot failed with HTTP 500"]);
});

test("M6 mobile capture markdown highlights missing read model reflection", () => {
  const markdown = renderM6MobileCaptureAdbE2eMarkdown({
    generatedAt: "2026-04-24T15:00:00.000Z",
    apiBaseUrl: "http://192.168.0.104:3011",
    device: {
      serial: "device-1",
      model: "NX733J",
      androidVersion: "15",
      wifiIp: "192.168.0.100",
    },
    steps: [okStep("health-snapshot", "/health/snapshots", { id: "health-1" })],
    readModels: {
      healthLatestReflectsDevice: false,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
  });

  assert.match(markdown, /M6 Mobile Capture ADB E2E/);
  assert.match(markdown, /passed: `false`/);
  assert.match(markdown, /healthLatestReflectsDevice: `false`/);
  assert.match(markdown, /NX733J/);
});

test("M6 mobile capture summary fails when inbox ack is not reflected", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("client-inbox", "/client/inbox", { messages: [{ id: "inbox-1", status: "pending" }] })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: false,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /inboxAckReflected/);
});

test("M6 mobile capture summary fails when recovery history does not reflect the created plan", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [
      okStep("recovery-plan", "/recovery/plan", { id: "recovery-1" }),
      okStep("recovery-history", "/recovery/history", { recoveryPlans: [] }),
    ],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: false,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /recoveryHistoryReflectsPlan/);
});

test("M6 mobile capture summary fails when recovery plan is not created", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("recovery-plan", "/recovery/plan", { id: null })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: false,
      recoveryHistoryReflectsPlan: false,
      recoveryInboxConsistent: false,
      recoveryDashboardConsistent: false,
    },
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /recoveryPlanCreated/);
});

test("M6 mobile capture summary reports cadenced phase progression when all phases are consistent", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("health-snapshot", "/health/snapshots", { id: "health-4" })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    phaseResults: [
      cadencePhase({ name: "baseline", latestHealthId: "health-1" }),
      cadencePhase({ name: "stress-build-up-1", latestHealthId: "health-2", inboxLatestRiskLevel: "medium" }),
      cadencePhase({
        name: "recovery-trigger",
        latestHealthId: "health-3",
        latestRecoveryPlanId: "recovery-1",
        inboxLatestRiskLevel: "high",
      }),
      cadencePhase({
        name: "post-recovery",
        latestHealthId: "health-4",
        latestRecoveryPlanId: "recovery-1",
        postRecoveryWriteAccepted: true,
      }),
    ],
  });

  assert.equal(summary.phaseCount, 4);
  assert.equal(summary.latestHealthProgressed, true);
  assert.equal(summary.recoveryPlanPersistedAcrossPhases, true);
  assert.equal(summary.postRecoverySamplingAccepted, true);
});

test("M6 mobile capture summary fails when cadenced phases do not advance latest health", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("health-snapshot", "/health/snapshots", { id: "health-1" })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    phaseResults: [
      cadencePhase({ name: "baseline", latestHealthId: "health-1" }),
      cadencePhase({ name: "stress-build-up-1", latestHealthId: "health-1" }),
      cadencePhase({ name: "recovery-trigger", latestHealthId: "health-1", latestRecoveryPlanId: "recovery-1" }),
      cadencePhase({
        name: "post-recovery",
        latestHealthId: "health-1",
        latestRecoveryPlanId: "recovery-1",
        postRecoveryWriteAccepted: true,
      }),
    ],
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /latestHealthProgressed/);
});

test("M6 mobile capture summary fails when recovery plan does not persist across cadenced phases", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("recovery-plan", "/recovery/plan", { id: "recovery-1" })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    phaseResults: [
      cadencePhase({ name: "baseline", latestHealthId: "health-1" }),
      cadencePhase({ name: "stress-build-up-1", latestHealthId: "health-2" }),
      cadencePhase({ name: "recovery-trigger", latestHealthId: "health-3", latestRecoveryPlanId: "recovery-1" }),
      cadencePhase({
        name: "post-recovery",
        latestHealthId: "health-4",
        latestRecoveryPlanId: null,
        postRecoveryWriteAccepted: true,
      }),
    ],
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /recoveryPlanPersistedAcrossPhases/);
});

test("M6 mobile capture summary reports authenticated client-session success", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [
      toleratedFailureStep("auth-login", "/auth/login", 401, { message: "Invalid email or password." }),
      okStep("auth-register", "/auth/register", { user: { id: "user-1", email: "m6-client@example.com" } }),
      okStep("auth-login:retry", "/auth/login", { accessToken: "token", user: { id: "user-1", email: "m6-client@example.com" } }),
      okStep("client-bootstrap", "/client/bootstrap", { me: { authenticated: true } }),
    ],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
  });

  assert.equal(summary.passed, true);
  assert.equal(summary.authMode, "local-account");
  assert.equal(summary.authLoggedIn, true);
  assert.equal(summary.clientMeOk, true);
  assert.equal(summary.clientBootstrapOk, true);
  assert.equal(summary.clientInboxOk, true);
  assert.equal(summary.clientAckReflected, true);
});

test("M6 mobile capture summary fails when authenticated bootstrap does not succeed", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("client-bootstrap", "/client/bootstrap", { me: { authenticated: false } })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession({ clientBootstrapOk: false }),
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /clientBootstrapOk/);
});

test("M6 mobile capture summary fails when authenticated client ack is not reflected", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("inbox-ack", "/client/inbox/msg-1/ack", { id: "msg-1", status: "acknowledged" })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession({ clientAckAttempted: true, clientAckReflected: false }),
  });

  assert.equal(summary.passed, false);
  assert.match(summary.errorSamples.join("\n"), /clientAckReflected/);
});

test("M6 mobile capture summary reports fixed-duration client polling success", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("client-bootstrap:client-session-poll-1", "/client/bootstrap", { me: { authenticated: true } })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession({ clientAckAttempted: true }),
    clientPolling: clientPolling(),
  });

  assert.equal(summary.passed, true);
  assert.equal(summary.clientPollingCompleted, true);
  assert.equal(summary.clientPollingPollCount, 2);
  assert.equal(summary.clientPollingAllOk, true);
  assert.equal(summary.clientPollingBootstrapStable, true);
  assert.equal(summary.clientPollingInboxReadable, true);
  assert.equal(summary.clientPollingAckStatusStable, true);
});

test("M6 mobile capture summary fails when a client polling round fails", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("client-bootstrap:client-session-poll-1", "/client/bootstrap", { me: { authenticated: true } })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession({ clientAckAttempted: true }),
    clientPolling: clientPolling({
      rounds: [
        {
          round: 1,
          elapsedMs: 0,
          bootstrapOk: true,
          inboxOk: false,
          overviewOk: true,
          bootstrapUserId: "user-1",
          inboxMessageCount: 0,
          overviewMessageCount: 2,
          acknowledgedMessageVisible: true,
        },
      ],
    }),
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.clientPollingAllOk, false);
  assert.match(summary.errorSamples.join("\n"), /clientPollingAllOk/);
});

test("M6 mobile capture summary fails when client polling loses acknowledged status", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("client-bootstrap:client-session-poll-1", "/client/bootstrap", { me: { authenticated: true } })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession({ clientAckAttempted: true }),
    clientPolling: clientPolling({
      rounds: [
        {
          round: 1,
          elapsedMs: 0,
          bootstrapOk: true,
          inboxOk: true,
          overviewOk: true,
          bootstrapUserId: "user-1",
          inboxMessageCount: 2,
          overviewMessageCount: 2,
          acknowledgedMessageVisible: false,
        },
        {
          round: 2,
          elapsedMs: 5000,
          bootstrapOk: true,
          inboxOk: true,
          overviewOk: true,
          bootstrapUserId: "user-1",
          inboxMessageCount: 2,
          overviewMessageCount: 2,
          acknowledgedMessageVisible: false,
        },
      ],
    }),
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.clientPollingAckStatusStable, false);
  assert.match(summary.errorSamples.join("\n"), /clientPollingAckStatusStable/);
});

test("M6 mobile capture summary reports session recovery success", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("me:session-recovery", "/me", { authenticated: true })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
    sessionRecovery: sessionRecovery(),
  });

  assert.equal(summary.passed, true);
  assert.equal(summary.sessionRecoveryEnabled, true);
  assert.equal(summary.sessionRecoveryTokenPersisted, true);
  assert.equal(summary.sessionRecoveryTokenReloaded, true);
  assert.equal(summary.sessionRecoveryMeOk, true);
  assert.equal(summary.sessionRecoveryBootstrapOk, true);
  assert.equal(summary.sessionRecoveryInboxOk, true);
  assert.equal(summary.sessionRecoveryOverviewOk, true);
  assert.equal(summary.sessionRecoveryUserStable, true);
});

test("M6 mobile capture summary fails when session recovery cannot reload the token", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("me:session-recovery", "/me", { authenticated: true })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
    sessionRecovery: sessionRecovery({ tokenReloaded: false }),
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.sessionRecoveryTokenReloaded, false);
  assert.match(summary.errorSamples.join("\n"), /sessionRecoveryTokenReloaded/);
});

test("M6 mobile capture summary fails when session recovery returns a different user", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("me:session-recovery", "/me", { authenticated: true })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
    sessionRecovery: sessionRecovery({ userStable: false, recoveredUserId: "other-user" }),
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.sessionRecoveryUserStable, false);
  assert.match(summary.errorSamples.join("\n"), /sessionRecoveryUserStable/);
});

test("M6 mobile capture summary reports refresh-token recovery success", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [
      okStep("auth-refresh:refresh-token-recovery", "/auth/refresh", {
        accessToken: "token",
        refreshToken: "next-token",
        user: { id: "user-1", email: "m6-client@example.com" },
      }),
      toleratedFailureStep("auth-refresh-old-reuse:refresh-token-recovery", "/auth/refresh", 401, {
        message: "Invalid or expired refresh token.",
      }),
      okStep("auth-logout:refresh-token-recovery", "/auth/logout", { revoked: true }),
      toleratedFailureStep("auth-refresh-post-logout:refresh-token-recovery", "/auth/refresh", 401, {
        message: "Invalid or expired refresh token.",
      }),
    ],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
    refreshTokenRecovery: refreshTokenRecovery(),
  });

  assert.equal(summary.passed, true);
  assert.equal(summary.refreshTokenRecoveryEnabled, true);
  assert.equal(summary.refreshTokenIssued, true);
  assert.equal(summary.refreshTokenRotated, true);
  assert.equal(summary.oldRefreshTokenRejected, true);
  assert.equal(summary.refreshTokenLogoutRevoked, true);
  assert.equal(summary.postLogoutRefreshRejected, true);
});

test("M6 mobile capture summary fails when refresh-token rotation does not reject the old token", () => {
  const summary = buildM6MobileCaptureAdbE2eSummary({
    steps: [okStep("auth-refresh-old-reuse:refresh-token-recovery", "/auth/refresh", { accessToken: "token" })],
    readModels: {
      healthLatestReflectsDevice: true,
      dashboardReflectsDevice: true,
      inboxOverviewOk: true,
      inboxAckReflected: true,
      recoveryPlanCreated: true,
      recoveryHistoryReflectsPlan: true,
      recoveryInboxConsistent: true,
      recoveryDashboardConsistent: true,
    },
    clientSession: authenticatedClientSession(),
    refreshTokenRecovery: refreshTokenRecovery({ oldRefreshTokenRejected: false }),
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.oldRefreshTokenRejected, false);
  assert.match(summary.errorSamples.join("\n"), /oldRefreshTokenRejected/);
});
