import type { NotificationEndpoint } from "@mindanchor/domain";
import type { AppEnv } from "../env.js";

export type NotificationDispatchInput = {
  title: string;
  message: string;
  channel: NotificationEndpoint;
};

export type NotificationDispatchResult = {
  delivered: boolean;
  effectiveChannel: NotificationEndpoint;
  externalAttempted: boolean;
  externalDelivered: boolean;
  fallbackReason?: string;
};

const postJson = async (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

const dispatchFeishu = async (webhookUrl: string, input: NotificationDispatchInput) => {
  const response = await postJson(webhookUrl, {
    msg_type: "text",
    content: {
      text: `${input.title}\n${input.message}`.trim(),
    },
  });
  return response.ok;
};

const dispatchTelegram = async (botToken: string, chatId: string, input: NotificationDispatchInput) => {
  const response = await postJson(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: `${input.title}\n${input.message}`.trim(),
  });
  return response.ok;
};

export const dispatchNotification = async (
  env: AppEnv,
  input: NotificationDispatchInput,
): Promise<NotificationDispatchResult> => {
  if (input.channel === "desktop_local" || input.channel === "mobile_push") {
    return {
      delivered: true,
      effectiveChannel: input.channel,
      externalAttempted: false,
      externalDelivered: false,
    };
  }

  if (input.channel === "feishu_bot") {
    if (!env.feishuBotWebhookUrl) {
      return {
        delivered: true,
        effectiveChannel: "desktop_local",
        externalAttempted: false,
        externalDelivered: false,
        fallbackReason: "Feishu webhook is not configured.",
      };
    }

    try {
      const delivered = await dispatchFeishu(env.feishuBotWebhookUrl, input);
      return delivered
        ? {
            delivered: true,
            effectiveChannel: "feishu_bot",
            externalAttempted: true,
            externalDelivered: true,
          }
        : {
            delivered: true,
            effectiveChannel: "desktop_local",
            externalAttempted: true,
            externalDelivered: false,
            fallbackReason: "Feishu webhook returned a non-OK response.",
          };
    } catch (error) {
      return {
        delivered: true,
        effectiveChannel: "desktop_local",
        externalAttempted: true,
        externalDelivered: false,
        fallbackReason: error instanceof Error ? error.message : "Feishu dispatch failed.",
      };
    }
  }

  if (!env.telegramBotToken || !env.telegramChatId) {
    return {
      delivered: true,
      effectiveChannel: "desktop_local",
      externalAttempted: false,
      externalDelivered: false,
      fallbackReason: "Telegram bot token or chat id is not configured.",
    };
  }

  try {
    const delivered = await dispatchTelegram(env.telegramBotToken, env.telegramChatId, input);
    return delivered
      ? {
          delivered: true,
          effectiveChannel: "telegram_bot",
          externalAttempted: true,
          externalDelivered: true,
        }
      : {
          delivered: true,
          effectiveChannel: "desktop_local",
          externalAttempted: true,
          externalDelivered: false,
          fallbackReason: "Telegram API returned a non-OK response.",
        };
  } catch (error) {
    return {
      delivered: true,
      effectiveChannel: "desktop_local",
      externalAttempted: true,
      externalDelivered: false,
      fallbackReason: error instanceof Error ? error.message : "Telegram dispatch failed.",
    };
  }
};
