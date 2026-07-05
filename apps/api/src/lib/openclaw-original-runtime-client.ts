import { execFile } from "node:child_process";

import type { AppEnv } from "../env.js";

type OriginalRuntimeResult = {
  ok: boolean;
  parsed?: unknown;
  content?: string;
  durationMs?: number | null;
  error?: string;
};

const personaTargets = new Set([
  "director-agent",
  "companion-agent",
  "analyst-agent",
  "balance-agent",
  "life-secretary-agent",
  "memory-governor-agent",
]);

const execFileAsync = (file: string, args: string[]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(file, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });

const extractJsonCandidate = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

export class OpenClawOriginalRuntimeClient {
  constructor(private readonly env: AppEnv) {}

  isEnabledForTarget(target: string) {
    return this.env.openClawOriginalRuntimeMode === "cli-local" && personaTargets.has(target);
  }

  async generateJson({
    target,
    systemPrompt,
    userPrompt,
  }: {
    target: string;
    systemPrompt: string;
    userPrompt: string;
  }): Promise<OriginalRuntimeResult | null> {
    if (!this.isEnabledForTarget(target)) {
      return null;
    }

    const binary = this.env.openClawOriginalRuntimePath ?? `${process.env.HOME ?? ""}/.openclaw/bin/openclaw`;
    const profile = this.env.openClawOriginalRuntimeProfile ?? "dev";
    const profileArgs = profile === "dev" ? ["--dev"] : ["--profile", profile];
    const prompt = [
      "MindAnchor structured runtime contract.",
      "You must return exactly one JSON object and nothing else.",
      systemPrompt,
      "",
      userPrompt,
    ].join("\n");

    try {
      const { stdout } = await execFileAsync(binary, [
        ...profileArgs,
        "agent",
        "--agent",
        target,
        "--message",
        prompt,
        "--json",
        "--local",
        "--timeout",
        "30",
      ]);

      const payload = JSON.parse(stdout) as {
        payloads?: Array<{ text?: string | null }>;
        meta?: { durationMs?: number | null };
      };
      const content = payload.payloads?.find((item) => typeof item.text === "string" && item.text.trim().length > 0)?.text ?? null;

      if (!content) {
        return {
          ok: false,
          error: "Original runtime did not return text payload.",
          durationMs: payload.meta?.durationMs ?? null,
        };
      }

      return {
        ok: true,
        parsed: JSON.parse(extractJsonCandidate(content)),
        content,
        durationMs: payload.meta?.durationMs ?? null,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown original runtime error",
      };
    }
  }
}
