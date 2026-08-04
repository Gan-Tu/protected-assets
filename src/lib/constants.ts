export const ASSET_BUCKET = "asset-documents";

/**
 * How long a released asset stays downloadable, measured from `released_at`.
 * Downloads are mediated by `/d/[requestId]/[fileId]` rather than a long-lived
 * Supabase signed URL, so access can be revoked by clearing the request.
 */
export const DOWNLOAD_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Lifetime of the signed storage URL we redirect to. Only needs to survive the
 * redirect itself, so it is deliberately tiny.
 */
export const SIGNED_URL_TTL_SECONDS = 60;

export const DEFAULT_AUTO_APPROVE_DELAY_SECONDS = 60 * 60 * 24;

/** Total bytes of files Resend will carry as real attachments. */
export const MAX_ATTACHMENT_BYTES = 28 * 1024 * 1024;

/** Per-file cap for direct-to-storage uploads. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const MAX_FILES_PER_ASSET = 50;

export const DEFAULT_HISTORY_LIMIT = 5;
export const ASSET_HISTORY_LIMIT = 10;
export const MAX_HISTORY_LIMIT = 200;
