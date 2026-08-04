import { Receiver } from "@upstash/qstash";

import { logError } from "@/lib/errors";
import { getQStashCallbackUrl } from "@/lib/qstash";
import { isRetryableReleaseError, releaseRequest } from "@/lib/services/release";
import { uuidSchema } from "@/lib/validation";

/**
 * QStash auto-release callback.
 *
 * Signature verification is mandatory. Beyond that the contract with QStash is:
 *  - 2xx  => done, stop retrying (covers "already handled" and "request gone")
 *  - 5xx  => transient, please retry (delivery failed; the request has already
 *            been rolled back to `pending` by the release service)
 */
export async function POST(request: Request) {
  const signature = request.headers.get("upstash-signature");
  const rawBody = await request.text();
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return Response.json(
      { ok: false, error: "QStash signing keys are not configured" },
      { status: 500 },
    );
  }

  if (!signature) {
    return Response.json(
      { ok: false, error: "Missing signature" },
      { status: 401 },
    );
  }

  const receiver = new Receiver({ currentSigningKey, nextSigningKey });

  let isValid = false;
  try {
    isValid = await receiver.verify({
      body: rawBody,
      signature,
      url: `${getQStashCallbackUrl()}/api/qstash/auto-release`,
    });
  } catch (error) {
    logError("qstash.verify", error);
  }

  if (!isValid) {
    return Response.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 },
    );
  }

  let requestId: string | undefined;
  try {
    requestId = (JSON.parse(rawBody) as { requestId?: string }).requestId;
  } catch {
    return Response.json(
      { ok: false, error: "Malformed body" },
      { status: 400 },
    );
  }

  if (!requestId || !uuidSchema.safeParse(requestId).success) {
    return Response.json(
      { ok: false, error: "Missing or invalid requestId" },
      { status: 400 },
    );
  }

  try {
    const result = await releaseRequest({ requestId, mode: "auto_approved" });

    return Response.json({
      ok: true,
      released: result.released,
      reason: result.reason,
    });
  } catch (error) {
    logError("qstash.auto-release", error);

    // Retryable failures (email provider down, storage blip) get a 5xx so
    // QStash redelivers; permanent ones are acknowledged to stop the loop.
    const status = isRetryableReleaseError(error) ? 500 : 200;

    return Response.json(
      { ok: false, error: "Auto-release failed", retry: status === 500 },
      { status },
    );
  }
}
