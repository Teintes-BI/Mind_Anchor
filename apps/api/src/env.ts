import { agentModeSchema } from "@mindanchor/domain";

export const OPENCLAW_AGENT_NAMES = [
  "chief-agent",
  "state-insight-agent",
  "task-management-agent",
  "progress-feedback-agent",
  "interruption-recovery-agent",
  "reflection-coach-agent",
  "automation-agent",
] as const;

export const OPENCLAW_CONVERSATION_COACH_AGENT_NAMES = [
  "conversation-coach-fast-agent",
  "conversation-coach-agent",
] as const;

export const OPENCLAW_PERSONA_AGENT_NAMES = [
  "director-agent",
  "companion-agent",
  "analyst-agent",
  "balance-agent",
  "life-secretary-agent",
  "memory-governor-agent",
] as const;

const OPENCLAW_MODEL_TARGET_NAMES = [
  ...OPENCLAW_AGENT_NAMES,
  ...OPENCLAW_PERSONA_AGENT_NAMES,
  ...OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
] as const;

export type OpenClawAgentName = (typeof OPENCLAW_AGENT_NAMES)[number];
export type ModelWireApi = "responses" | "chat-completions";
export type ModelReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export type AgentModelConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  wireApi: ModelWireApi;
  reasoningEffort?: ModelReasoningEffort;
  disableResponseStorage: boolean;
};

export type AppEnv = {
  apiHost: string;
  apiPort: number;
  dataFile: string;
  agentMode: "stub" | "openai-compatible";
  openClawBaseUrl?: string;
  openClawOriginalRuntimeMode?: "disabled" | "cli-local";
  openClawOriginalRuntimePath?: string;
  openClawOriginalRuntimeProfile?: string;
  openClawManagementActualPath?: string;
  openClawManagementProfileHome?: string;
  supabaseUrl?: string;
  supabaseJwksUrl?: string;
  supabaseJwtIssuer?: string;
  authDevBypassEnabled: boolean;
  authJwtSecret?: string;
  feishuBotWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  wayfinderAsrRemoteEnabled?: boolean;
  asrBaseUrl?: string;
  asrApiKey?: string;
  asrModel?: string;
  defaultModelConfig: AgentModelConfig;
  agentModelConfigs: Record<string, AgentModelConfig>;
};

export type AgentModelConfigOverride = Partial<AgentModelConfig>;
export type AgentModelConfigOverrideMap = Partial<Record<OpenClawAgentName, AgentModelConfigOverride>>;

type SafeAgentModelConfigAudit = {
  target: string;
  envPrefix: string;
  baseUrl: string | null;
  model: string | null;
  wireApi: ModelWireApi;
  reasoningEffort: ModelReasoningEffort | null;
  disableResponseStorage: boolean;
  hasApiKey: boolean;
  differsFromDefault: {
    baseUrl: boolean;
    apiKey: boolean;
    model: boolean;
    wireApi: boolean;
    reasoningEffort: boolean;
    disableResponseStorage: boolean;
  };
};

export const toEnvSegment = (agentName: string) => agentName.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

const parseWireApi = (value?: string): ModelWireApi => (value === "chat-completions" ? "chat-completions" : "responses");

const parseReasoningEffort = (value?: string): ModelReasoningEffort | undefined => {
  if (!value) {
    return undefined;
  }

  if (["minimal", "low", "medium", "high", "xhigh"].includes(value)) {
    return value as ModelReasoningEffort;
  }

  return undefined;
};

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const getLegacyDefaultModelConfig = (): AgentModelConfig => {
  const baseUrl = process.env.MINDANCHOR_OPENAI_BASE_URL ?? process.env.MINDANCHOR_QWEN_BASE_URL;
  const apiKey = process.env.MINDANCHOR_OPENAI_API_KEY ?? process.env.MINDANCHOR_QWEN_API_KEY;
  const model = process.env.MINDANCHOR_OPENAI_MODEL ?? process.env.MINDANCHOR_QWEN_MODEL ?? "gpt-5.4";

  return {
    baseUrl,
    apiKey,
    model,
    wireApi: "chat-completions",
    disableResponseStorage: true,
  };
};

const getDefaultModelConfig = (): AgentModelConfig => {
  const legacy = getLegacyDefaultModelConfig();

  return {
    baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL ?? legacy.baseUrl,
    apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY ?? legacy.apiKey,
    model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? legacy.model ?? "gpt-5.4",
    wireApi: parseWireApi(process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API ?? (legacy.baseUrl ? "chat-completions" : "responses")),
    reasoningEffort: parseReasoningEffort(process.env.MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT ?? "xhigh"),
    disableResponseStorage: parseBoolean(process.env.MINDANCHOR_DEFAULT_MODEL_DISABLE_RESPONSE_STORAGE, true),
  };
};

const getAgentModelConfig = (agentName: string, defaultModelConfig: AgentModelConfig): AgentModelConfig => {
  const envSegment = toEnvSegment(agentName);

  return {
    baseUrl: process.env[`MINDANCHOR_AGENT_${envSegment}_BASE_URL`] ?? defaultModelConfig.baseUrl,
    apiKey: process.env[`MINDANCHOR_AGENT_${envSegment}_API_KEY`] ?? defaultModelConfig.apiKey,
    model: process.env[`MINDANCHOR_AGENT_${envSegment}_MODEL`] ?? defaultModelConfig.model,
    wireApi: parseWireApi(process.env[`MINDANCHOR_AGENT_${envSegment}_WIRE_API`] ?? defaultModelConfig.wireApi),
    reasoningEffort: parseReasoningEffort(
      process.env[`MINDANCHOR_AGENT_${envSegment}_REASONING_EFFORT`] ?? defaultModelConfig.reasoningEffort,
    ),
    disableResponseStorage: parseBoolean(
      process.env[`MINDANCHOR_AGENT_${envSegment}_DISABLE_RESPONSE_STORAGE`],
      defaultModelConfig.disableResponseStorage,
    ),
  };
};

const buildSafeAgentModelConfigAudit = ({
  target,
  envPrefix,
  config,
  defaultModelConfig,
}: {
  target: string;
  envPrefix: string;
  config: AgentModelConfig;
  defaultModelConfig?: AgentModelConfig;
}): SafeAgentModelConfigAudit => ({
  target,
  envPrefix,
  baseUrl: config.baseUrl ?? null,
  model: config.model ?? null,
  wireApi: config.wireApi,
  reasoningEffort: config.reasoningEffort ?? null,
  disableResponseStorage: config.disableResponseStorage,
  hasApiKey: Boolean(config.apiKey),
  differsFromDefault: {
    baseUrl: defaultModelConfig ? config.baseUrl !== defaultModelConfig.baseUrl : false,
    apiKey: defaultModelConfig ? config.apiKey !== defaultModelConfig.apiKey : false,
    model: defaultModelConfig ? config.model !== defaultModelConfig.model : false,
    wireApi: defaultModelConfig ? config.wireApi !== defaultModelConfig.wireApi : false,
    reasoningEffort: defaultModelConfig ? config.reasoningEffort !== defaultModelConfig.reasoningEffort : false,
    disableResponseStorage: defaultModelConfig
      ? config.disableResponseStorage !== defaultModelConfig.disableResponseStorage
      : false,
  },
});

export const getEnv = (): AppEnv => {
  const defaultModelConfig = getDefaultModelConfig();
  const agentModelConfigs = Object.fromEntries(
    OPENCLAW_MODEL_TARGET_NAMES.map((agentName) => [agentName, getAgentModelConfig(agentName, defaultModelConfig)]),
  );

  return {
    apiHost: process.env.MINDANCHOR_API_HOST ?? "127.0.0.1",
    apiPort: Number(process.env.MINDANCHOR_API_PORT ?? "3001"),
    dataFile: process.env.MINDANCHOR_DATA_FILE ?? `${process.cwd()}/data/mindanchor.json`,
    agentMode: agentModeSchema.parse(process.env.MINDANCHOR_AGENT_MODE ?? "stub"),
    openClawBaseUrl: process.env.MINDANCHOR_OPENCLAW_BASE_URL,
    openClawOriginalRuntimeMode:
      process.env.MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_MODE === "cli-local" ? "cli-local" : "disabled",
    openClawOriginalRuntimePath: process.env.MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PATH,
    openClawOriginalRuntimeProfile: process.env.MINDANCHOR_OPENCLAW_ORIGINAL_RUNTIME_PROFILE,
    openClawManagementActualPath: process.env.MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH,
    openClawManagementProfileHome: process.env.MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME,
    supabaseUrl: process.env.MINDANCHOR_SUPABASE_URL,
    supabaseJwksUrl:
      process.env.MINDANCHOR_SUPABASE_JWKS_URL ??
      (process.env.MINDANCHOR_SUPABASE_URL ? `${process.env.MINDANCHOR_SUPABASE_URL}/auth/v1/.well-known/jwks.json` : undefined),
    supabaseJwtIssuer:
      process.env.MINDANCHOR_SUPABASE_JWT_ISSUER ??
      (process.env.MINDANCHOR_SUPABASE_URL ? `${process.env.MINDANCHOR_SUPABASE_URL}/auth/v1` : undefined),
    authDevBypassEnabled: parseBoolean(process.env.MINDANCHOR_AUTH_DEV_BYPASS, process.env.NODE_ENV !== "production"),
    authJwtSecret: process.env.MINDANCHOR_AUTH_JWT_SECRET,
    feishuBotWebhookUrl: process.env.MINDANCHOR_FEISHU_BOT_WEBHOOK_URL,
    telegramBotToken: process.env.MINDANCHOR_TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.MINDANCHOR_TELEGRAM_CHAT_ID,
    wayfinderAsrRemoteEnabled: parseBoolean(process.env.MINDANCHOR_WAYFINDER_ASR_REMOTE, false),
    asrBaseUrl: process.env.MINDANCHOR_ASR_BASE_URL,
    asrApiKey: process.env.MINDANCHOR_ASR_API_KEY,
    asrModel: process.env.MINDANCHOR_ASR_MODEL,
    defaultModelConfig,
    agentModelConfigs,
  };
};

export const getAgentConfigAuditResponse = (env: AppEnv) => ({
  mode: env.agentMode,
  defaultModelConfig: buildSafeAgentModelConfigAudit({
    target: "default",
    envPrefix: "MINDANCHOR_DEFAULT_MODEL",
    config: env.defaultModelConfig,
  }),
  agents: OPENCLAW_MODEL_TARGET_NAMES.map((agentName) =>
    buildSafeAgentModelConfigAudit({
      target: agentName,
      envPrefix: `MINDANCHOR_AGENT_${toEnvSegment(agentName)}`,
      config: env.agentModelConfigs[agentName] ?? env.defaultModelConfig,
      defaultModelConfig: env.defaultModelConfig,
    }),
  ),
});

export const applyAgentModelOverrides = (env: AppEnv, overrides: AgentModelConfigOverrideMap): AppEnv => ({
  ...env,
  defaultModelConfig: { ...env.defaultModelConfig },
  agentModelConfigs: Object.fromEntries(
    OPENCLAW_AGENT_NAMES.map((agentName) => [
      agentName,
      {
        ...(env.agentModelConfigs[agentName] ?? env.defaultModelConfig),
        ...(overrides[agentName] ?? {}),
      },
    ]),
  ),
});
