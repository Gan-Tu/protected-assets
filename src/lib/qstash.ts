import "server-only";

import { Client } from "@upstash/qstash";

import { getBaseUrl, getErrorMessage, isLocalUrl } from "@/lib/utils";

function getQStashClient() {
  if (!process.env.QSTASH_TOKEN) {
    return null;
  }

  return new Client({
    token: process.env.QSTASH_TOKEN,
  });
}

export function getQStashCallbackUrl() {
  const explicit = process.env.QSTASH_CALLBACK_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  return getBaseUrl();
}

export async function scheduleAutoRelease(requestId: string, delaySeconds: number) {
  const client = getQStashClient();
  const callbackBaseUrl = getQStashCallbackUrl();

  if (!client) {
    return {
      scheduled: false,
      reason: "Missing QSTASH_TOKEN. Auto-release scheduling is disabled.",
    };
  }

  if (isLocalUrl(callbackBaseUrl)) {
    return {
      scheduled: false,
      reason:
        "Auto-release needs a public callback URL. Set QSTASH_CALLBACK_URL to your deployed app URL or a tunnel URL.",
    };
  }

  const result = await client.publishJSON({
    url: `${callbackBaseUrl}/api/qstash/auto-release`,
    body: { requestId },
    delay: `${BigInt(delaySeconds)}s`,
  });

  return {
    scheduled: true,
    messageId: result.messageId,
  };
}

export async function cancelAutoRelease(messageId?: string | null) {
  if (!messageId) {
    return { cancelled: false, skipped: true };
  }

  const client = getQStashClient();
  if (!client) {
    return {
      cancelled: false,
      skipped: true,
      reason: "Missing QSTASH_TOKEN. Auto-release cancellation is disabled.",
    };
  }

  try {
    await client.messages.delete(messageId);
    return { cancelled: true, skipped: false };
  } catch (error) {
    return {
      cancelled: false,
      skipped: false,
      reason: getErrorMessage(error, "Unable to cancel auto-release."),
    };
  }
}

export async function cancelAutoReleaseMessages(messageIds: Array<string | null | undefined>) {
  const ids = messageIds.filter((messageId): messageId is string => Boolean(messageId));

  if (!ids.length) {
    return { cancelled: 0, skipped: true };
  }

  const client = getQStashClient();
  if (!client) {
    return {
      cancelled: 0,
      skipped: true,
      reason: "Missing QSTASH_TOKEN. Auto-release cancellation is disabled.",
    };
  }

  const results = await Promise.allSettled(
    ids.map(async (messageId) => client.messages.delete(messageId)),
  );

  return {
    cancelled: results.filter((result) => result.status === "fulfilled").length,
    skipped: false,
    reason:
      results.some((result) => result.status === "rejected")
        ? "Some auto-release messages could not be cancelled."
        : undefined,
  };
}
