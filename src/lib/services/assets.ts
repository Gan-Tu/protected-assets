import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  ASSET_HISTORY_LIMIT,
  MAX_FILES_PER_ASSET,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { AppError, NotFoundError } from "@/lib/errors";
import { cancelAutoReleaseMessages } from "@/lib/qstash";
import {
  assertAssetOwnership,
  buildLegacyLinks,
  countAssetFiles,
  deleteAsset as deleteAssetRow,
  deleteAssetFileById,
  deleteAssetFiles,
  ensureUniqueSlug,
  insertAssetFiles,
  isUnclaimedAssetId,
  listAssetFiles,
  listAssetGroups,
  listAssetLinks,
  listAssets,
  getPublicAssetBySlug,
  replaceAssetLinks,
  resolveAssetGroupId,
  upsertAsset,
} from "@/lib/repos/assets";
import {
  clearRequestHistory as clearRequestHistoryRows,
  countRequestsForAsset,
  listPendingQstashMessageIds,
  listPendingRequests,
  listRequestCounters,
  listRequestHistory,
} from "@/lib/repos/requests";
import {
  buildStoragePath,
  createSignedUploadUrl,
  isOwnedStoragePath,
  listStoredPaths,
  removeStoredFiles,
} from "@/lib/repos/storage";
import type {
  Asset,
  AssetFile,
  AssetLink,
  DashboardAsset,
  PublicAssetView,
} from "@/lib/types";
import type { AssetFormInput } from "@/lib/validation";

export type UploadedFileInput = {
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string | null;
};

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getDashboardOverview(
  ownerId: string,
  options: { historyLimit: number },
) {
  const [groups, assets, counters, pendingRequests, history] = await Promise.all([
    listAssetGroups(ownerId),
    listAssets(ownerId),
    listRequestCounters(ownerId),
    listPendingRequests(ownerId),
    listRequestHistory(ownerId, { limit: options.historyLimit }),
  ]);

  const assetIds = assets.map((asset) => asset.id);
  const [files, links] = await Promise.all([
    listAssetFiles(assetIds),
    listAssetLinks(assetIds),
  ]);

  const filesByAsset = groupBy(files, (file) => file.asset_id);
  const linksByAsset = groupBy(links, (link) => link.asset_id);
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  const countsByAsset = new Map<string, { total: number; pending: number }>();
  for (const counter of counters) {
    const current = countsByAsset.get(counter.asset_id) ?? {
      total: 0,
      pending: 0,
    };
    current.total += 1;
    if (counter.status === "pending") current.pending += 1;
    countsByAsset.set(counter.asset_id, current);
  }

  const enrichedAssets: DashboardAsset[] = assets.map((asset) => ({
    ...asset,
    links: linksByAsset.get(asset.id) ?? buildLegacyLinks(asset),
    files: filesByAsset.get(asset.id) ?? [],
    group: asset.group_id ? groupsById.get(asset.group_id) ?? null : null,
    requestCount: countsByAsset.get(asset.id)?.total ?? 0,
    pendingCount: countsByAsset.get(asset.id)?.pending ?? 0,
  }));

  const assetsById = new Map(enrichedAssets.map((asset) => [asset.id, asset]));

  return {
    groups,
    assets: enrichedAssets,
    pendingRequests: pendingRequests.map((request) => ({
      ...request,
      asset: assetsById.get(request.asset_id) ?? null,
    })),
    history: history.rows.map((request) => ({
      ...request,
      asset: assetsById.get(request.asset_id) ?? null,
    })),
    historyTotal: history.total,
    approvedCount: counters.filter(
      (counter) =>
        counter.status === "approved" || counter.status === "auto_approved",
    ).length,
  };
}

export async function getAssetEditorData(
  ownerId: string,
  assetId: string,
  options: { historyLimit?: number } = {},
) {
  const asset = await assertAssetOwnership(ownerId, assetId);
  const historyLimit = options.historyLimit ?? ASSET_HISTORY_LIMIT;

  const [groups, files, links, history, requestCount] = await Promise.all([
    listAssetGroups(ownerId),
    listAssetFiles([assetId]),
    listAssetLinks([assetId]),
    listRequestHistory(ownerId, { limit: historyLimit, assetId }),
    countRequestsForAsset(ownerId, assetId),
  ]);

  return {
    asset,
    groups,
    files,
    links: (links.length ? links : buildLegacyLinks(asset)) as AssetLink[],
    history: history.rows,
    historyTotal: history.total,
    requestCount,
  };
}

export async function getPublicAssetView(
  slug: string,
): Promise<PublicAssetView | null> {
  const asset = await getPublicAssetBySlug(slug);
  if (!asset) return null;

  const [links, fileCount] = await Promise.all([
    listAssetLinks([asset.id]),
    countAssetFiles(asset.id),
  ]);

  const resolvedLinks = links.length ? links : buildLegacyLinks(asset);

  return {
    id: asset.id,
    name: asset.name,
    slug: asset.slug,
    description: asset.description,
    auto_approve_enabled: asset.auto_approve_enabled,
    auto_approve_delay_seconds: asset.auto_approve_delay_seconds,
    linkCount: resolvedLinks.length,
    fileCount,
  };
}

export { listAssetGroups as getAssetGroups };

/* -------------------------------------------------------------------------- */
/* Uploads                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mint signed upload URLs so the browser writes straight to Supabase Storage.
 * The server picks every object key, which is what keeps a client from writing
 * outside its own `<ownerId>/<assetId>/` prefix.
 */
export async function createUploadTickets(
  ownerId: string,
  input: {
    assetId: string;
    isExistingAsset: boolean;
    files: { name: string; size: number; type: string | null }[];
  },
) {
  if (!input.files.length) return [];

  if (input.files.length > MAX_FILES_PER_ASSET) {
    throw new AppError(`Upload at most ${MAX_FILES_PER_ASSET} files at a time.`);
  }

  const oversized = input.files.find((file) => file.size > MAX_UPLOAD_BYTES);
  if (oversized) {
    throw new AppError(
      `"${oversized.name}" is larger than the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB per-file limit.`,
    );
  }

  if (input.isExistingAsset) {
    await assertAssetOwnership(ownerId, input.assetId);
  } else if (!(await isUnclaimedAssetId(input.assetId))) {
    throw new AppError("Could not start this upload. Reload and try again.");
  }

  const now = Date.now();

  return Promise.all(
    input.files.map(async (file, index) => {
      const path = buildStoragePath({
        ownerId,
        assetId: input.assetId,
        fileName: file.name,
        index,
        now,
      });

      const ticket = await createSignedUploadUrl(path);

      return {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        storagePath: ticket.path,
        signedUrl: ticket.signedUrl,
        token: ticket.token,
      };
    }),
  );
}

/**
 * Uploads are recorded from client-supplied metadata, so both facts have to be
 * proven server-side: the key is inside this owner's prefix, and the object
 * actually exists.
 */
async function verifyUploads(
  ownerId: string,
  assetId: string,
  uploads: UploadedFileInput[],
) {
  if (!uploads.length) return [];

  for (const upload of uploads) {
    if (!isOwnedStoragePath(upload.storagePath, ownerId, assetId)) {
      throw new AppError("Those uploads could not be verified.");
    }
  }

  const stored = await listStoredPaths(ownerId, assetId);
  const verified = uploads.filter((upload) => stored.has(upload.storagePath));

  if (verified.length !== uploads.length) {
    throw new AppError(
      "Some files did not finish uploading. Please re-add them and save again.",
    );
  }

  return verified;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveAsset(
  ownerId: string,
  input: AssetFormInput & { uploads: UploadedFileInput[]; draftAssetId?: string },
) {
  // The IDOR guard: an asset id from the form is only usable after proving it
  // belongs to the caller. Anything else is treated as a brand new asset.
  let assetId: string;
  let isUpdate = false;

  if (input.assetId) {
    await assertAssetOwnership(ownerId, input.assetId);
    assetId = input.assetId;
    isUpdate = true;
  } else if (input.draftAssetId) {
    if (!(await isUnclaimedAssetId(input.draftAssetId))) {
      throw new AppError("Could not save this asset. Reload and try again.");
    }
    assetId = input.draftAssetId;
  } else {
    assetId = randomUUID();
  }

  const slug = await ensureUniqueSlug(
    input.slug || input.name,
    ownerId,
    isUpdate ? assetId : undefined,
  );
  const groupId = await resolveAssetGroupId(ownerId, {
    groupId: input.groupId,
    newGroupName: input.newGroupName,
  });

  let existingFiles: AssetFile[] = isUpdate ? await listAssetFiles([assetId]) : [];

  if (input.replaceFiles && existingFiles.length) {
    await deleteAssetFiles(ownerId, assetId);
    await removeStoredFiles(existingFiles.map((file) => file.storage_path));
    existingFiles = [];
  }

  const uploads = await verifyUploads(ownerId, assetId, input.uploads);

  if (existingFiles.length + uploads.length > MAX_FILES_PER_ASSET) {
    throw new AppError(`An asset can hold at most ${MAX_FILES_PER_ASSET} files.`);
  }

  if (!existingFiles.length && !uploads.length && !input.links.length) {
    throw new AppError(
      "Add at least one protected link or upload at least one file.",
    );
  }

  const fileCount = existingFiles.length + uploads.length;

  await upsertAsset({
    id: assetId,
    owner_id: ownerId,
    group_id: groupId,
    name: input.name,
    slug,
    description: input.description,
    kind: fileCount > 0 ? "files" : "link",
    link_url: input.links[0] ?? null,
    auto_approve_enabled: input.autoApproveEnabled,
    auto_approve_delay_seconds: input.autoApproveDelaySeconds,
    auto_approve_note: input.autoApproveEnabled ? input.releaseNote : null,
  });

  await replaceAssetLinks(ownerId, assetId, input.links);

  if (uploads.length) {
    const startingOrder = existingFiles.length
      ? Math.max(...existingFiles.map((file) => file.sort_order)) + 1
      : 0;

    await insertAssetFiles(
      uploads.map((upload, index) => ({
        asset_id: assetId,
        owner_id: ownerId,
        storage_path: upload.storagePath,
        file_name: upload.fileName,
        file_size: upload.fileSize,
        content_type: upload.contentType,
        sort_order: startingOrder + index,
      })),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${assetId}`);
  revalidatePath(`/a/${slug}`);

  return { assetId, slug };
}

export async function deleteAsset(ownerId: string, assetId: string) {
  const asset = await assertAssetOwnership(ownerId, assetId);

  const [files, messageIds] = await Promise.all([
    listAssetFiles([assetId]),
    listPendingQstashMessageIds(ownerId, assetId),
  ]);

  await deleteAssetRow(ownerId, assetId);

  // Best-effort cleanup after the row is gone -- neither should resurrect it.
  await Promise.all([
    removeStoredFiles(files.map((file) => file.storage_path)),
    cancelAutoReleaseMessages(messageIds),
  ]);

  revalidatePath("/dashboard");
  revalidatePath(`/a/${asset.slug}`);
}

export async function deleteAssetFile(
  ownerId: string,
  assetId: string,
  fileId: string,
) {
  const asset = await assertAssetOwnership(ownerId, assetId);
  const storagePath = await deleteAssetFileById(ownerId, fileId);

  await removeStoredFiles([storagePath]);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${assetId}`);
  revalidatePath(`/a/${asset.slug}`);
}

export async function clearRequestHistory(ownerId: string, assetId?: string) {
  if (assetId) await assertAssetOwnership(ownerId, assetId);

  await clearRequestHistoryRows(ownerId, assetId);

  revalidatePath("/dashboard");
  if (assetId) revalidatePath(`/dashboard/assets/${assetId}`);
}

export async function requireAssetForDownload(ownerId: string, assetId: string) {
  const asset = await assertAssetOwnership(ownerId, assetId);
  if (!asset) throw new NotFoundError("That asset could not be found.");
  return asset;
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const bucket = map.get(key(item));
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key(item), [item]);
    }
  }

  return map;
}

export type { Asset, DashboardAsset };
