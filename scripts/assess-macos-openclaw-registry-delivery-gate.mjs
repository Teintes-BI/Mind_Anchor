#!/usr/bin/env node

import { promises as fs } from "node:fs";

import { defaultOpenClawRegistryNotificationRecoveryReportPath } from "./lib/macos-openclaw-registry-notification-recovery-check.mjs";
import {
  buildOpenClawRegistryDeliveryGateGuidance,
  deriveOpenClawRegistryDeliveryGateStatus,
} from "./lib/macos-openclaw-registry-delivery-gate.mjs";

const reportPath = process.argv[2] || defaultOpenClawRegistryNotificationRecoveryReportPath(process.cwd());
const raw = await fs.readFile(reportPath, "utf8");
const report = JSON.parse(raw);
const settingsAutomationBoundary = report.settingsProbe?.stdout?.match(/notificationSettingsAutomationBoundary=([^\n]+)/)?.[1] ?? "unknown";
const status = deriveOpenClawRegistryDeliveryGateStatus({
  recoveryResult: report.result,
  settingsAutomationBoundary,
});

process.stdout.write(`deliveryGateStatus=${status}\n`);
process.stdout.write(`recoveryResult=${report.result}\n`);
process.stdout.write(`notificationSettingsAutomationBoundary=${settingsAutomationBoundary}\n`);
for (const line of buildOpenClawRegistryDeliveryGateGuidance(status)) {
  process.stdout.write(`${line}\n`);
}

if (status !== "ready") {
  process.exitCode = 1;
}
