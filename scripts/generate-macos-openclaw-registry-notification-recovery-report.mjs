#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  defaultOpenClawRegistryNotificationRecoveryHtmlReportPath,
  renderOpenClawRegistryNotificationRecoveryHtml,
} from "./lib/macos-notification-recovery-report-render.mjs";
import { defaultOpenClawRegistryNotificationRecoveryReportPath } from "./lib/macos-openclaw-registry-notification-recovery-check.mjs";

const inputPath =
  process.argv[2] ||
  process.env.MINDANCHOR_NOTIFICATION_RECOVERY_REPORT_FILE ||
  defaultOpenClawRegistryNotificationRecoveryReportPath(process.cwd());

const outputPath =
  process.argv[3] ||
  process.env.MINDANCHOR_NOTIFICATION_RECOVERY_HTML_REPORT_FILE ||
  defaultOpenClawRegistryNotificationRecoveryHtmlReportPath(process.cwd());

const raw = await fs.readFile(inputPath, "utf8");
const report = JSON.parse(raw);
const html = renderOpenClawRegistryNotificationRecoveryHtml(report);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, html, "utf8");

process.stdout.write(`notificationRecoveryHtmlReport=${outputPath}\n`);
