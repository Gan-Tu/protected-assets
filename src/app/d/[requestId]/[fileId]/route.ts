import { NextResponse } from "next/server";

import {
  DOWNLOAD_LINK_TTL_SECONDS,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/constants";
import { logError } from "@/lib/errors";
import { getAssetFileById } from "@/lib/repos/assets";
import { getRequestWithAsset } from "@/lib/repos/requests";
import { createSignedDownloadUrl } from "@/lib/repos/storage";
import { uuidSchema } from "@/lib/validation";

/**
 * Requester-facing download.
 *
 * Replaces week-long Supabase signed URLs in release emails. The URL itself is
 * the credential (a v4 request id, same entropy as a signed token), but unlike
 * a signed URL this indirection lets us re-check authorization on every hit:
 * the request must still exist, must still be in a released state, and must not
 * have aged out. Clearing request history therefore revokes access.
 */

function deny() {
  // One shape for every failure so this cannot be used to probe which request
  // ids or file ids exist.
  return NextResponse.json(
    { error: "This download link is no longer valid." },
    { status: 404 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string; fileId: string }> },
) {
  const { requestId, fileId } = await params;

  if (!uuidSchema.safeParse(requestId).success) return deny();
  if (!uuidSchema.safeParse(fileId).success) return deny();

  try {
    const accessRequest = await getRequestWithAsset(requestId);

    if (
      !accessRequest ||
      (accessRequest.status !== "approved" &&
        accessRequest.status !== "auto_approved")
    ) {
      return deny();
    }

    const releasedAt = accessRequest.released_at
      ? Date.parse(accessRequest.released_at)
      : null;

    if (
      !releasedAt ||
      Number.isNaN(releasedAt) ||
      Date.now() - releasedAt > DOWNLOAD_LINK_TTL_SECONDS * 1000
    ) {
      return deny();
    }

    const file = await getAssetFileById(fileId);

    // The file must belong to the very asset this request was granted for.
    if (!file || file.asset_id !== accessRequest.asset_id) {
      return deny();
    }

    const signedUrl = await createSignedDownloadUrl(
      file.storage_path,
      SIGNED_URL_TTL_SECONDS,
    );

    console.info(
      `[protected-assets] download request=${requestId} file=${fileId} email=${accessRequest.requester_email}`,
    );

    return NextResponse.redirect(signedUrl, {
      status: 307,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    logError("download.route", error);
    return deny();
  }
}
