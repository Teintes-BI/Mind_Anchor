import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryDeliveryGateGuidance,
  deriveOpenClawRegistryDeliveryGateStatus,
} from "../lib/macos-openclaw-registry-delivery-gate.mjs";

test("deriveOpenClawRegistryDeliveryGateStatus marks passed recovery as ready", () => {
  assert.equal(
    deriveOpenClawRegistryDeliveryGateStatus({
      recoveryResult: "passed",
      settingsAutomationBoundary: "automation_candidate",
    }),
    "ready",
  );
});

test("deriveOpenClawRegistryDeliveryGateStatus marks manual recommended host as manual_step_pending", () => {
  assert.equal(
    deriveOpenClawRegistryDeliveryGateStatus({
      recoveryResult: "waiting_for_manual_step",
      settingsAutomationBoundary: "manual_recommended",
    }),
    "manual_step_pending",
  );
});

test("deriveOpenClawRegistryDeliveryGateStatus marks profile install wait as setup_incomplete", () => {
  assert.equal(
    deriveOpenClawRegistryDeliveryGateStatus({
      recoveryResult: "waiting_for_profile_install",
      settingsAutomationBoundary: "unknown",
    }),
    "setup_incomplete",
  );
});

test("buildOpenClawRegistryDeliveryGateGuidance explains manual pending state", () => {
  assert.deepEqual(
    buildOpenClawRegistryDeliveryGateGuidance("manual_step_pending"),
    [
      "当前机器已经进入可支持状态，但还在等待用户完成系统权限最后一步。",
      "这类结果在 clean-machine / 首次运行验收里应当记为“手动步骤待完成”，而不是脚本失败。",
    ],
  );
});
