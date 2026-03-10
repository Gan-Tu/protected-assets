import "server-only";

import { Client } from "@upstash/qstash";

import { getBaseUrl, isLocalUrl } from "@/lib/utils";

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

  await client.publishJSON({
    url: `${callbackBaseUrl}/api/qstash/auto-release`,
    body: { requestId },
    delay: `${BigInt(delaySeconds)}s`,
  });

  return { scheduled: true };
}
