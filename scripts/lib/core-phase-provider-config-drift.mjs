import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const buildIssue = (code, message, guidance) => ({
  code,
  message,
  guidance,
});

const summarizeConfig = (config) => ({
  baseUrl: config?.baseUrl ?? null,
  model: config?.model ?? null,
  wireApi: config?.wireApi ?? null,
  apiKeyPresent: Boolean(config?.apiKey),
  apiKeyLength: config?.apiKey ? String(config.apiKey).length : 0,
});

export const compareProviderConfigDrift = ({ gateway, openClaw }) => {
  const issues = [];

  if (!openClaw) {
    issues.push(
      buildIssue(
        "missing_openclaw_profile_provider_config",
        "未找到 OpenClaw real profile 的 provider 配置，暂时无法判断和 Gateway 默认模型配置是否漂移。",
        "请先确认 `~/.openclaw-dev/openclaw.json` 或目标 profile 已由 `setup-openclaw-real-profile.sh` 正常生成。",
      ),
    );
    return {
      aligned: false,
      issues,
      summary: {
        gateway: summarizeConfig(gateway),
        openClaw: summarizeConfig(null),
      },
    };
  }

  if ((gateway?.baseUrl ?? null) !== (openClaw?.baseUrl ?? null)) {
    issues.push(
      buildIssue(
        "provider_base_url_drift",
        "Gateway 默认模型 base URL 与 OpenClaw real profile 的 provider base URL 不一致。",
        "建议先把两边对齐，再判断 provider-direct 和 cluster-preferred 的差异是否真来自主链逻辑。",
      ),
    );
  }

  if ((gateway?.model ?? null) !== (openClaw?.model ?? null)) {
    issues.push(
      buildIssue(
        "provider_model_drift",
        "Gateway 默认模型名称与 OpenClaw real profile 的模型名称不一致。",
        "建议优先统一 model id，避免把模型差异误判成 agent 或 orchestration 问题。",
      ),
    );
  }

  if ((gateway?.wireApi ?? null) !== (openClaw?.wireApi ?? null)) {
    issues.push(
      buildIssue(
        "provider_wire_api_drift",
        "Gateway 默认模型 wire API 与 OpenClaw real profile 不一致。",
        "建议统一成同一个 wire API，再比较 provider-direct 与 cluster-preferred 的结果。",
      ),
    );
  }

  if (Boolean(gateway?.apiKey) !== Boolean(openClaw?.apiKey) || (gateway?.apiKey && openClaw?.apiKey && gateway.apiKey !== openClaw.apiKey)) {
    issues.push(
      buildIssue(
        "provider_api_key_drift",
        "Gateway 默认模型 API key 与 OpenClaw real profile 的 token/credentials 看起来不一致。",
        "建议先同步 Gateway 与 OpenClaw 使用的同一套真实 provider 凭据，再跑 full real 门槛回归。",
      ),
    );
  }

  return {
    aligned: issues.length === 0,
    issues,
    summary: {
      gateway: summarizeConfig(gateway),
      openClaw: summarizeConfig(openClaw),
    },
  };
};

export const buildGatewayProviderEnvOverrides = (openClaw) => {
  if (!openClaw?.baseUrl || !openClaw?.model) {
    return null;
  }

  return {
    MINDANCHOR_DEFAULT_MODEL_BASE_URL: openClaw.baseUrl,
    MINDANCHOR_DEFAULT_MODEL_NAME: openClaw.model,
    MINDANCHOR_DEFAULT_MODEL_WIRE_API: openClaw.wireApi ?? "responses",
    ...(openClaw.apiKey ? { MINDANCHOR_DEFAULT_MODEL_API_KEY: openClaw.apiKey } : {}),
  };
};

export const buildAlignedRunnerProviderDriftWarning = ({ gateway, openClaw }) => {
  const drift = compareProviderConfigDrift({ gateway, openClaw });
  const alignedEnvOverrides = buildGatewayProviderEnvOverrides(openClaw);

  if (drift.aligned || !alignedEnvOverrides) {
    return null;
  }

  return {
    profileName: openClaw?.profileName ?? "unknown",
    driftCodes: drift.issues.map((issue) => issue.code),
    shellSummary: drift.summary.gateway,
    profileSummary: drift.summary.openClaw,
    alignedEnvOverrides,
  };
};

export const readOpenClawProfileProviderConfig = async ({
  profileName = "dev",
  homeDir = process.env.HOME ?? "",
}) => {
  const profileHome = profileName === "dev" ? `${homeDir}/.openclaw-dev` : `${homeDir}/.openclaw-${profileName}`;
  const configPath = `${profileHome}/openclaw.json`;
  if (!existsSync(configPath)) {
    return null;
  }

  const raw = JSON.parse(await readFile(configPath, "utf8"));
  const providers = raw?.models?.providers ?? {};
  const firstProvider = Object.values(providers)[0];
  if (!firstProvider || typeof firstProvider !== "object") {
    return null;
  }
  const firstModel = Array.isArray(firstProvider.models) ? firstProvider.models[0] : null;
  let apiKey = typeof firstProvider.apiKey === "string" ? firstProvider.apiKey : null;

  if (!apiKey) {
    const authPaths = [
      `${profileHome}/agents/main/agent/auth-profiles.json`,
      `${profileHome}/agents/chief-agent/agent/auth-profiles.json`,
    ];
    for (const authPath of authPaths) {
      if (!existsSync(authPath)) {
        continue;
      }
      const authRaw = JSON.parse(await readFile(authPath, "utf8"));
      const profiles = authRaw?.profiles ?? {};
      const firstProfile = Object.values(profiles)[0];
      if (firstProfile && typeof firstProfile === "object" && typeof firstProfile.token === "string" && firstProfile.token.length > 0) {
        apiKey = firstProfile.token;
        break;
      }
    }
  }

  if (!apiKey) {
    const agentsDir = `${profileHome}/agents`;
    if (existsSync(agentsDir)) {
      const entries = await readdir(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        const authPath = `${agentsDir}/${entry.name}/agent/auth-profiles.json`;
        if (!existsSync(authPath)) {
          continue;
        }
        const authRaw = JSON.parse(await readFile(authPath, "utf8"));
        const profiles = authRaw?.profiles ?? {};
        const firstProfile = Object.values(profiles)[0];
        if (firstProfile && typeof firstProfile === "object" && typeof firstProfile.token === "string" && firstProfile.token.length > 0) {
          apiKey = firstProfile.token;
          break;
        }
      }
    }
  }

  return {
    profileName,
    configPath,
    baseUrl: firstProvider.baseUrl ?? null,
    model: firstModel?.id ?? firstModel?.name ?? null,
    wireApi: firstProvider.api === "openai-chat-completions" ? "chat-completions" : "responses",
    apiKey,
  };
};
