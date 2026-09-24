import "server-only";

import { revalidatePath } from "next/cache";

import { NotFoundError, RateLimitError, logError } from "@/lib/errors";
import { sendOwnerRequestNotification } from "@/lib/notifications";
import { scheduleAutoRelease } from "@/lib/qstash";
import {
  RATE_LIMITS,
  consumeMemoryQuota,
  describeRetryAfter,
  evaluateDurableQuota,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { getPublicAssetBySlug } from "@/lib/repos/assets";
import { getOwnerProfile } from "@/lib/repos/profiles";
import {
  countRecentRequests,
  deleteRequest,
  findPendingRequestByEmail,
  insertAccessRequest,
  setQstashMessageId,
} from "@/lib/repos/requests";
import { releaseRequest } from "@/lib/services/release";
import type { AccessRequestInput } from "@/lib/validation";
import { formatRelativeWindow } from "@/lib/utils";

export type SubmitAccessRequestResult = {
  assetName: string;
  autoApproveLabel: string | null;
  autoReleaseScheduled: boolean;
  duplicate: boolean;
};

function sinceIso(windowSeconds: number) {
  return new Date(Date.now() - windowSeconds * 1000).toISOString();
}

function rejectIfLimited(result: RateLimitResult, message: string) {
  if (result.ok) return;

  throw new RateLimitError(
    `${message} Please try again ${describeRetryAfter(result.retryAfterSeconds)}.`,
    result.retryAfterSeconds,
  );
}

/**
 * Durable limits, evaluated in parallel. These are the ones that actually
 * protect the owner's inbox, phone bill and QStash quota, because they survive
 * across serverless instances.
 */
async function enforceDurableLimits(assetId: string, requesterEmail: string) {
  const [perEmailPerAsset, perAsset, perEmail] = await Promise.all([
    countRecentRequests({
      assetId,
      requesterEmail,
      sinceIso: sinceIso(RATE_LIMITS.perEmailPerAsset.windowSeconds),
    }),
    countRecentRequests({
      assetId,
      sinceIso: sinceIso(RATE_LIMITS.perAsset.windowSeconds),
    }),
    countRecentRequests({
      requesterEmail,
      sinceIso: sinceIso(RATE_LIMITS.perEmail.windowSeconds),
    }),
  ]);

  rejectIfLimited(
    evaluateDurableQuota(perEmailPerAsset, RATE_LIMITS.perEmailPerAsset),
    "You have already requested this asset a few times.",
  );
  rejectIfLimited(
    evaluateDurableQuota(perAsset, RATE_LIMITS.perAsset),
    "This asset is receiving too many requests right now.",
  );
  rejectIfLimited(
    evaluateDurableQuota(perEmail, RATE_LIMITS.perEmail),
    "Too many requests from this email address.",
  );
}

export async function submitAccessRequest(
  input: AccessRequestInput,
  context: { clientIp: string },
): Promise<SubmitAccessRequestResult> {
  rejectIfLimited(
    consumeMemoryQuota(`request:${context.clientIp}`, RATE_LIMITS.perIp),
    "Too many requests from this device.",
  );

  const asset = await getPublicAssetBySlug(input.slug);

  if (!asset) {
    throw new NotFoundError("That protected asset could not be found.");
  }

  // Shown to the requester, so spelled out ("2 days", not "2d").
  const autoApproveLabel = asset.auto_approve_enabled
    ? formatRelativeWindow(asset.auto_approve_delay_seconds, { verbose: true })
    : null;

  // Re-submitting the same form must not create a second row, a second owner
  // notification, or a second auto-release timer.
  const existing = await findPendingRequestByEmail(
    asset.id,
    input.requesterEmail,
  );

  if (existing) {
    return {
      assetName: asset.name,
      autoApproveLabel,
      autoReleaseScheduled: Boolean(existing.qstash_message_id),
      duplicate: true,
    };
  }

  await enforceDurableLimits(asset.id, input.requesterEmail);

  const request = await insertAccessRequest({
    assetId: asset.id,
    ownerId: asset.owner_id,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    reason: input.reason,
  });

  let autoReleaseScheduled = false;

  if (asset.auto_approve_enabled) {
    autoReleaseScheduled = await armAutoRelease({
      requestId: request.id,
      delaySeconds: asset.auto_approve_delay_seconds,
    });
  }

  // Notification failures must never fail the request: the row already exists,
  // and telling the requester to retry would duplicate work and spam the owner.
  try {
    const profile = await getOwnerProfile(asset.owner_id);

    await sendOwnerRequestNotification({
      ownerEmail: profile.email,
      ownerPhone: profile.phone,
      sendEmailNotification: profile.notification_email,
      sendSmsNotification: profile.notification_sms,
      assetName: asset.name,
      assetSlug: asset.slug,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      reason: input.reason,
      autoApproveDelaySeconds: asset.auto_approve_enabled
        ? asset.auto_approve_delay_seconds
        : 0,
      requestId: request.id,
    });
  } catch (error) {
    logError("access-request.notify-owner", error);
  }

  revalidatePath("/dashboard");

  return {
    assetName: asset.name,
    autoApproveLabel,
    autoReleaseScheduled,
    duplicate: false,
  };
}

/**
 * Arm the auto-release timer. A zero delay is still handed to QStash so the
 * public form returns immediately instead of waiting on file downloads and an
 * email send; if QStash is unavailable we fall back to releasing inline.
 *
 * A scheduling failure degrades the asset to manual review rather than
 * rejecting the request outright -- the owner is still notified either way.
 */
async function armAutoRelease(input: {
  requestId: string;
  delaySeconds: number;
}): Promise<boolean> {
  const result = await scheduleAutoRelease(input.requestId, input.delaySeconds);

  if (result.scheduled && result.messageId) {
    const stored = await setQstashMessageId(input.requestId, result.messageId);

    if (!stored) {
      // The request stopped being pending underneath us; drop the timer.
      logError(
        "access-request.schedule",
        new Error(`Request ${input.requestId} was not pending after scheduling`),
      );
    }

    return true;
  }

  logError(
    "access-request.schedule-unavailable",
    new Error(result.reason ?? "Auto-release could not be scheduled."),
  );

  if (input.delaySeconds > 0) {
    return false;
  }

  // Immediate auto-release with no scheduler available: do it inline so the
  // promise on the share page is still kept.
  try {
    await releaseRequest({
      requestId: input.requestId,
      mode: "auto_approved",
    });
    return true;
  } catch (error) {
    logError("access-request.inline-release", error);
    return false;
  }
}

export { deleteRequest };
