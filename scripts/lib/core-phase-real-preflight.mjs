const REAL_PROVIDER_ENV_KEYS = [
  "MINDANCHOR_DEFAULT_MODEL_BASE_URL",
  "MINDANCHOR_DEFAULT_MODEL_API_KEY",
  "MINDANCHOR_DEFAULT_MODEL_NAME",
  "MINDANCHOR_DEFAULT_MODEL_WIRE_API",
];

const REAL_PROVIDER_ENV_CODES = {
  MINDANCHOR_DEFAULT_MODEL_BASE_URL: "missing_default_model_base_url",
  MINDANCHOR_DEFAULT_MODEL_API_KEY: "missing_default_model_api_key",
  MINDANCHOR_DEFAULT_MODEL_NAME: "missing_default_model_name",
  MINDANCHOR_DEFAULT_MODEL_WIRE_API: "missing_default_model_wire_api",
};

const buildIssue = (code, message, guidance) => ({
  code,
  message,
  guidance,
});

export const evaluateCorePhasePreflight = ({
  clusterMode,
  providerMode,
  env,
  openClawBinPath,
  openClawBinExists,
  selectedNodePath,
  selectedNodeVersion,
  minimumNodeVersion,
}) => {
  const issues = [];

  if (providerMode === "real") {
    for (const key of REAL_PROVIDER_ENV_KEYS) {
      if (!env?.[key]) {
        issues.push(
          buildIssue(
            REAL_PROVIDER_ENV_CODES[key],
            `缺少 ${key}。`,
            "请先导出真实 provider 所需环境变量，再运行 core phase real 回归。",
          ),
        );
      }
    }
  }

  if (clusterMode === "real" && !openClawBinExists) {
    issues.push(
      buildIssue(
        "missing_openclaw_bin",
        `OpenClaw CLI 不存在：${openClawBinPath}`,
        "请检查 OPENCLAW_BIN，或确认 ~/.openclaw/bin/openclaw 已安装可执行。",
      ),
    );
  }

  if (
    clusterMode === "real" &&
    openClawBinExists &&
    selectedNodePath &&
    selectedNodeVersion &&
    minimumNodeVersion &&
    (
      Number(selectedNodeVersion.replace(/^v/, "").split(".")[0] ?? 0) < minimumNodeVersion.major ||
      (
        Number(selectedNodeVersion.replace(/^v/, "").split(".")[0] ?? 0) === minimumNodeVersion.major &&
        Number(selectedNodeVersion.replace(/^v/, "").split(".")[1] ?? 0) < minimumNodeVersion.minor
      )
    )
  ) {
    issues.push(
      buildIssue(
        "incompatible_openclaw_node",
        `OpenClaw real mode 当前会使用不兼容的 Node：${selectedNodeVersion} (${selectedNodePath})`,
        `请改用 Node >= ${minimumNodeVersion.major}.${minimumNodeVersion.minor}.${minimumNodeVersion.patch}，再运行 core phase real 回归。`,
      ),
    );
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

export const formatCorePhasePreflightIssues = (issues) =>
  issues.map((issue) => `- [${issue.code}] ${issue.message} ${issue.guidance}`).join("\n");
