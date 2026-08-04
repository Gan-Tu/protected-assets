import "server-only";

import { ASSET_BUCKET } from "@/lib/constants";
import { AppError, logError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

/**
 * The bucket is private and has no storage RLS policies, so every object
 * operation runs through the service-role client. Object keys are always
 * `<ownerId>/<assetId>/<file>`, which is what makes `isOwnedStoragePath` a
 * sufficient authorization check for client-supplied paths.
 */

export function buildStoragePath(input: {
  ownerId: string;
  assetId: string;
  fileName: string;
  index: number;
  now: number;
}) {
  const base = input.fileName.replace(/\.[^.]+$/, "");
  const fileSlug = slugify(base) || "document";
  const rawExtension = input.fileName.includes(".")
    ? input.fileName.split(".").pop()
    : "";
  const extension = (rawExtension ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);

  const suffix = extension ? `.${extension}` : "";

  return `${input.ownerId}/${input.assetId}/${input.now}-${input.index}-${fileSlug}${suffix}`;
}

/**
 * Guards paths that came from the browser. Without this a client could claim
 * another owner's object key when recording uploaded files.
 */
export function isOwnedStoragePath(
  path: string,
  ownerId: string,
  assetId: string,
) {
  if (path.includes("..") || path.startsWith("/")) return false;
  return path.startsWith(`${ownerId}/${assetId}/`);
}

export async function createSignedUploadUrl(path: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(ASSET_BUCKET)
    .createSignedUploadUrl(path);

  if (error) throw error;
  if (!data) throw new AppError("Unable to prepare the upload.");

  return { signedUrl: data.signedUrl, token: data.token, path: data.path };
}

/** Object keys that actually exist under `<ownerId>/<assetId>/`. */
export async function listStoredPaths(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const prefix = `${ownerId}/${assetId}`;
  const { data, error } = await admin.storage
    .from(ASSET_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error) throw error;

  return new Set((data ?? []).map((entry) => `${prefix}/${entry.name}`));
}

export async function removeStoredFiles(paths: string[]) {
  if (!paths.length) return;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.storage.from(ASSET_BUCKET).remove(paths);

  // Storage cleanup is best-effort: a failure here must not block the database
  // change that the caller already committed to.
  if (error) logError("storage.remove", error);
}

export async function createSignedDownloadUrl(
  path: string,
  expiresInSeconds: number,
) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(ASSET_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  if (!data?.signedUrl) throw new AppError("Unable to prepare the download.");

  return data.signedUrl;
}

export async function downloadStoredFile(path: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(ASSET_BUCKET)
    .download(path);

  if (error || !data) {
    logError("storage.download", error ?? new Error(`Missing object ${path}`));
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}
