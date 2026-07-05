const RESPONSES_BODY = ({ model }) => ({
  model,
  input: "MindAnchor core-phase auth probe. Reply briefly.",
  max_output_tokens: 1,
  store: false,
});

const CHAT_COMPLETIONS_BODY = ({ model }) => ({
  model,
  messages: [{ role: "user", content: "MindAnchor core-phase auth probe. Reply briefly." }],
  max_tokens: 1,
  temperature: 0,
});

export const shouldTreatStatusAsAcceptedAuth = (status) => [400, 405, 409, 415, 422, 429].includes(status);

const buildIssue = (code, message, guidance) => ({
  code,
  message,
  guidance,
});

const previewText = async (response) => {
  try {
    return String(await response.text()).slice(0, 240);
  } catch {
    return "";
  }
};

const buildVariants = ({ wireApi, model }) =>
  wireApi === "chat-completions"
    ? [
        { endpoint: "/chat/completions", body: CHAT_COMPLETIONS_BODY({ model }) },
        { endpoint: "/v1/chat/completions", body: CHAT_COMPLETIONS_BODY({ model }) },
      ]
    : [
        { endpoint: "/responses", body: RESPONSES_BODY({ model }) },
        { endpoint: "/v1/responses", body: RESPONSES_BODY({ model }) },
      ];

export const probeProviderAuth = async ({
  baseUrl,
  apiKey,
  model,
  wireApi,
  fetchImpl = fetch,
  timeoutMs = 15000,
}) => {
  const attempts = [];
  const variants = buildVariants({ wireApi, model });

  for (const variant of variants) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(new URL(variant.endpoint, baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(variant.body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const attempt = {
        endpoint: variant.endpoint,
        status: response.status,
        ok: response.ok,
        preview: await previewText(response),
      };
      attempts.push(attempt);

      if (response.ok) {
        return {
          ok: true,
          acceptedVia: "ok",
          selectedEndpoint: variant.endpoint,
          attempts,
          issue: null,
        };
      }

      if (shouldTreatStatusAsAcceptedAuth(response.status)) {
        return {
          ok: true,
          acceptedVia: "non_auth_http_status",
          selectedEndpoint: variant.endpoint,
          attempts,
          issue: null,
        };
      }
    } catch (error) {
      clearTimeout(timeout);
      attempts.push({
        endpoint: variant.endpoint,
        status: null,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const statuses = attempts.map((attempt) => attempt.status).filter((status) => typeof status === "number");
  const allAuthFailures = statuses.length > 0 && statuses.every((status) => status === 401 || status === 403);
  if (allAuthFailures) {
    const lastStatus = statuses[statuses.length - 1];
    return {
      ok: false,
      acceptedVia: null,
      selectedEndpoint: null,
      attempts,
      issue: buildIssue(
        "invalid_provider_api_key",
        `真实 provider 认证探针失败：所有候选 endpoint 都返回 HTTP ${lastStatus}。`,
        "请检查 `MINDANCHOR_DEFAULT_MODEL_API_KEY` 是否有效，并确认它和 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 属于同一服务。",
      ),
    };
  }

  const allNotFound = statuses.length > 0 && statuses.every((status) => status === 404);
  if (allNotFound) {
    return {
      ok: false,
      acceptedVia: null,
      selectedEndpoint: null,
      attempts,
      issue: buildIssue(
        "provider_probe_endpoint_not_found",
        "真实 provider 认证探针失败：所有候选 endpoint 都返回 HTTP 404。",
        "请检查 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 是否写对，尤其注意是否需要包含或去掉 `/v1` 前缀。",
      ),
    };
  }

  const timeoutAttempt = attempts.find((attempt) => String(attempt.error ?? "").includes("aborted"));
  if (timeoutAttempt) {
    return {
      ok: false,
      acceptedVia: null,
      selectedEndpoint: null,
      attempts,
      issue: buildIssue(
        "provider_probe_timeout",
        `真实 provider 认证探针超时：${timeoutMs}ms 内未拿到可用响应。`,
        "请检查当前 provider 服务是否可达，或稍后重试；如果是临时网络问题，不建议直接启动完整 real 回归。",
      ),
    };
  }

  const lastAttempt = attempts[attempts.length - 1];
  return {
    ok: false,
    acceptedVia: null,
    selectedEndpoint: null,
    attempts,
    issue: buildIssue(
      "provider_probe_request_failed",
      `真实 provider 认证探针失败：${lastAttempt?.error ?? `最后一次返回 HTTP ${lastAttempt?.status ?? "unknown"}`}`,
      "请检查 `MINDANCHOR_DEFAULT_MODEL_BASE_URL`、网络连通性、代理设置，以及 provider 服务当前是否可用。",
    ),
  };
};
