export const formatCorePhaseStepStarted = ({ phaseTitle, label, method, path, timeoutMs }) =>
  `[${phaseTitle}] START ${label} ${method} ${path} timeout=${timeoutMs}ms`;

export const formatCorePhaseStepCompleted = ({ phaseTitle, label, statusCode, elapsedMs, conclusion }) =>
  `[${phaseTitle}] DONE ${label} status=${statusCode ?? "ERR"} elapsed=${elapsedMs}ms conclusion=${conclusion}`;

export const formatCorePhaseStepFailed = ({ phaseTitle, label, elapsedMs, message }) =>
  `[${phaseTitle}] FAIL ${label} elapsed=${elapsedMs}ms message=${message}`;
