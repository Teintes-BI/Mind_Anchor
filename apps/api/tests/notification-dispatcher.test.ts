import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchNotification } from "../src/services/notification-dispatcher.js";
import type { AppEnv } from "../src/env.js";

const buildEnv = (): AppEnv => ({
  apiPort: 3001,
  dataFile: "/tmp/mindanchor.json",
  agentMode: "stub",
  openClawBaseUrl: undefined,
  feishuBotWebhookUrl: undefined,
  telegramBotToken: undefined,
  telegramChatId: undefined,
  defaultModelConfig: {
    baseUrl: undefined,
    apiKey: undefined,
    model: "gpt-5.4",
    wireApi: "responses",
    reasoningEffort: "xhigh",
    disableResponseStorage: true,
  },
  agentModelConfigs: {},
});

describe("notification-dispatcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to desktop_local when Feishu is not configured", async () => {
    const result = await dispatchNotification(buildEnv(), {
      title: "Reset focus",
      message: "Take a brief reset.",
      channel: "feishu_bot",
    });

    expect(result.delivered).toBe(true);
    expect(result.effectiveChannel).toBe("desktop_local");
    expect(result.fallbackReason).toContain("Feishu");
  });

  it("delivers to Telegram when credentials are configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    const env = buildEnv();
    env.telegramBotToken = "telegram-token";
    env.telegramChatId = "chat-id";

    const result = await dispatchNotification(env, {
      title: "Reset focus",
      message: "Take a brief reset.",
      channel: "telegram_bot",
    });

    expect(result.delivered).toBe(true);
    expect(result.effectiveChannel).toBe("telegram_bot");
    expect(result.externalAttempted).toBe(true);
    expect(result.externalDelivered).toBe(true);
  });
});
