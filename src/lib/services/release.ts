import "server-only";

import { revalidatePath } from "next/cache";

import {
  DOWNLOAD_LINK_TTL_SECONDS,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/constants";
import { AppError, NotFoundError, logError } from "@/lib/errors";
import {
  sendRequesterDeniedEmail,
  sendRequesterReleaseEmail,
} from "@/lib/notifications";
import { cancelAutoRelease } from "@/lib/qstash";
import { buildLegacyLinks, listAssetFiles, listAssetLinks } from "@/lib/repos/assets";
import {
  claimPendingRequest,
  getRequestWithAsset,
  revertClaim,
} from "@/lib/repos/requests";
import { downloadStoredFile } from "@/lib/repos/storage";
import type { AccessRequest, Asset, AssetFile } from "@/lib/types";
import { compactFileSize, getBaseUrl } from "@/lib/utils";

export type ReleaseOutcome = { released: boolean; reason?: string };

/**
 * File types worth inlining as real attachments. Anything else (or anything
 * that blows the size budget) is delivered as a revocable download link.
 */
const ATTACHABLE_CONTENT_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const ATTACHABLE_EXTENSIONS = new Set([
  "pdf", "txt", "csv", "md", "json", "png", "jpg", "jpeg", "gif", "webp",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
]);

export function isAttachableFile(file: Pick<AssetFile, "file_name" | "content_type">) {
  if (file.content_type && ATTACHABLE_CONTENT_TYPES.has(file.content_type)) {
    return true;
  }

  const extension = file.file_name.includes(".")
    ? file.file_name.split(".").pop()?.toLowerCase()
    : null;

  return extension ? ATTACHABLE_EXTENSIONS.has(extension) : false;
}

/**
 * Decide up-front which files are attached and which are linked, using sizes we
 * already have. Keeping this pure means the downloads can then run in parallel
 * instead of serially accumulating a byte budget.
 */
export function planFileDelivery(
  files: AssetFile[],
  maxAttachmentBytes = MAX_ATTACHMENT_BYTES,
) {
  const attach: AssetFile[] = [];
  const link: AssetFile[] = [];
  let budget = 0;

  for (const file of files) {
    const size = file.file_size ?? 0;
    const fits = size > 0 && budget + size <= maxAttachmentBytes;

    if (isAttachableFile(file) && fits) {
      attach.push(file);
      budget += size;
      continue;
    }

    link.push(file);
  }

  return { attach, link };
}

async function buildFileDelivery(assetId: string, requestId: string) {
  const files = await listAssetFiles([assetId]);
  const plan = planFileDelivery(files);
  const baseUrl = getBaseUrl();

  const downloaded = await Promise.all(
    plan.attach.map(async (file) => ({
      file,
      content: await downloadStoredFile(file.storage_path),
    })),
  );

  const attachments = downloaded.flatMap((entry) =>
    entry.content
      ? [
          {
            filename: entry.file.file_name,
            content: entry.content,
            content_type: entry.file.content_type || undefined,
          },
        ]
      : [],
  );

  // Anything that failed to download still reaches the requester as a link.
  const failedAttachments = downloaded
    .filter((entry) => entry.content === null)
    .map((entry) => entry.file);

  const fileLinks = [...plan.link, ...failedAttachments].map((file) => ({
    name: `${file.file_name} (${compactFileSize(file.file_size)})`,
    url: `${baseUrl}/d/${requestId}/${file.id}`,
  }));

  return { attachments, fileLinks };
}

async function buildUrlLinks(asset: Asset) {
  const links = await listAssetLinks([asset.id]);
  const resolved = links.length ? links : buildLegacyLinks(asset);

  return resolved.map((link, index) => ({
    name: `Protected link ${index + 1}`,
    url: link.url,
  }));
}

export function buildStoredReleaseNote(
  releaseNote: string | null,
  approvalNote: string | null,
) {
  if (releaseNote && approvalNote) {
    return `Release note:\n${releaseNote}\n\nApproval note:\n${approvalNote}`;
  }

  return approvalNote ?? releaseNote;
}

/**
 * Approve (or auto-release) a request and deliver it.
 *
 * Ordering matters:
 *  1. claim the row atomically, so concurrent owner clicks and QStash retries
 *     cannot both send;
 *  2. deliver;
 *  3. only then cancel the pending auto-release timer.
 *
 * If delivery throws, the claim is reverted and the error propagates. The
 * request goes back to `pending`, the timer is restored, and the QStash retry
 * (or the owner) can try again. Resend's idempotency key means a retry after a
 * partial failure still cannot double-send.
 */
export async function releaseRequest(input: {
  requestId: string;
  mode: "approved" | "auto_approved";
  ownerId?: string;
  decisionNote?: string | null;
}): Promise<ReleaseOutcome> {
  const request = await getRequestWithAsset(input.requestId, input.ownerId);

  if (!request || !request.assets) {
    if (input.mode === "auto_approved") {
      return { released: false, reason: "Request or asset no longer exists." };
    }

    throw new NotFoundError("Request not found.");
  }

  if (request.status !== "pending") {
    return { released: false, reason: "Request was already handled." };
  }

  const asset = request.assets;
  const releaseNote = asset.auto_approve_note?.trim() || null;
  const approvalNote =
    input.mode === "approved" ? input.decisionNote?.trim() || null : null;

  const claimed = await claimPendingRequest(
    input.requestId,
    input.mode,
    buildStoredReleaseNote(releaseNote, approvalNote),
  );

  if (!claimed) {
    return { released: false, reason: "Request was already handled." };
  }

  try {
    const [delivery, links] = await Promise.all([
      buildFileDelivery(asset.id, input.requestId),
      buildUrlLinks(asset),
    ]);

    await sendRequesterReleaseEmail({
      requestId: input.requestId,
      requesterEmail: request.requester_email,
      assetName: asset.name,
      assetDescription: asset.description,
      releaseMode: input.mode,
      links,
      attachments: delivery.attachments,
      fileLinks: delivery.fileLinks,
      shareUrl: `${getBaseUrl()}/a/${asset.slug}`,
      releaseNote,
      decisionNote: approvalNote,
      expiresInSeconds: DOWNLOAD_LINK_TTL_SECONDS,
    });
  } catch (error) {
    await revertClaim(input.requestId, {
      decision_note: request.decision_note,
      qstash_message_id: request.qstash_message_id,
    }).catch((revertError) => {
      // The row is stuck in a terminal state without delivery. Loudly, please.
      logError("release.revert-failed", revertError);
    });

    logError("release.delivery-failed", error);
    throw error;
  }

  // Delivered. Now it is safe to drop the pending auto-release timer.
  if (input.mode === "approved" && request.qstash_message_id) {
    const cancelled = await cancelAutoRelease(request.qstash_message_id);
    if (cancelled.reason) logError("release.cancel-timer", cancelled.reason);
  }

  revalidateAfterDecision(asset);
  return { released: true };
}

export async function denyRequest(input: {
  ownerId: string;
  requestId: string;
  decisionNote?: string | null;
}): Promise<ReleaseOutcome> {
  const request = await getRequestWithAsset(input.requestId, input.ownerId);

  if (!request) throw new NotFoundError("Request not found.");
  if (request.status !== "pending") {
    return { released: false, reason: "Request was already handled." };
  }

  const decisionNote = input.decisionNote?.trim() || null;
  const claimed = await claimPendingRequest(
    input.requestId,
    "denied",
    decisionNote,
  );

  if (!claimed) {
    return { released: false, reason: "Request was already handled." };
  }

  try {
    await sendRequesterDeniedEmail({
      requestId: input.requestId,
      requesterEmail: request.requester_email,
      assetName: request.assets?.name ?? "a protected asset",
      decisionNote,
    });
  } catch (error) {
    await revertClaim(input.requestId, {
      decision_note: request.decision_note,
      qstash_message_id: request.qstash_message_id,
    }).catch((revertError) => logError("deny.revert-failed", revertError));

    logError("deny.delivery-failed", error);
    throw error;
  }

  if (request.qstash_message_id) {
    const cancelled = await cancelAutoRelease(request.qstash_message_id);
    if (cancelled.reason) logError("deny.cancel-timer", cancelled.reason);
  }

  if (request.assets) revalidateAfterDecision(request.assets);
  return { released: true };
}

function revalidateAfterDecision(asset: Pick<Asset, "id" | "slug">) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${asset.id}`);
  revalidatePath(`/a/${asset.slug}`);
}

/** Guard used by the webhook so a missing request is not retried forever. */
export function isRetryableReleaseError(error: unknown) {
  return !(error instanceof AppError) || error.status >= 500;
}

export type { AccessRequest };
