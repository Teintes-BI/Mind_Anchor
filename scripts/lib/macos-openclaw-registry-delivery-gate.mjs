export function deriveOpenClawRegistryDeliveryGateStatus({
  recoveryResult,
  settingsAutomationBoundary,
}) {
  if (recoveryResult === "passed") {
    return "ready";
  }

  if (
    recoveryResult === "waiting_for_manual_step" &&
    settingsAutomationBoundary === "manual_recommended"
  ) {
    return "manual_step_pending";
  }

  if (recoveryResult === "waiting_for_profile_install") {
    return "setup_incomplete";
  }

  return "blocked";
}

export function buildOpenClawRegistryDeliveryGateGuidance(status) {
  if (status === "manual_step_pending") {
    return [
      "当前机器已经进入可支持状态，但还在等待用户完成系统权限最后一步。",
      "这类结果在 clean-machine / 首次运行验收里应当记为“手动步骤待完成”，而不是脚本失败。",
    ];
  }

  if (status === "ready") {
    return [
      "当前机器已经满足 OpenClaw Registry 交付 gate。",
    ];
  }

  if (status === "setup_incomplete") {
    return [
      "当前机器的通知准备链还没有完成，仍需先完成 profile 安装。",
    ];
  }

  return [
    "当前机器还没有达到交付 gate，仍需继续排障或补前置条件。",
  ];
}
