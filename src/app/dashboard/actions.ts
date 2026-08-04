"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  errorState,
  successState,
  type ActionState,
} from "@/lib/action-state";
import { requireOwner } from "@/lib/auth";
import {
  isNextControlFlowError,
  toFieldErrors,
  toUserMessage,
} from "@/lib/errors";
import { createAssetGroup, deleteAssetGroup } from "@/lib/repos/assets";
import { updateOwnerProfile } from "@/lib/repos/profiles";
import {
  clearRequestHistory,
  createUploadTickets,
  deleteAsset,
  deleteAssetFile,
  saveAsset,
  type UploadedFileInput,
} from "@/lib/services/assets";
import { denyRequest, releaseRequest } from "@/lib/services/release";
import {
  assetFormSchema,
  collectionNameSchema,
  parseOrThrow,
  profileSettingsSchema,
  readBoolean,
  readOptionalUuid,
  readString,
  readStringList,
  uuidSchema,
} from "@/lib/validation";

/**
 * Wrap an action body so unexpected failures become a safe message instead of
 * a raw error page, while `redirect()`/`notFound()` keep working.
 */
async function run<T>(
  scope: string,
  fallback: string,
  body: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; state: ActionState }> {
  try {
    return { ok: true, value: await body() };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;

    return {
      ok: false,
      state: errorState(
        toUserMessage(error, fallback, scope),
        toFieldErrors(error),
      ),
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Assets                                                                     */
/* -------------------------------------------------------------------------- */

function parseUploads(raw: string): UploadedFileInput[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { storagePath?: unknown }).storagePath === "string" &&
          typeof (entry as { fileName?: unknown }).fileName === "string",
      )
      .map((entry) => ({
        storagePath: String(entry.storagePath),
        fileName: String(entry.fileName),
        fileSize: Number(entry.fileSize) || 0,
        contentType:
          typeof entry.contentType === "string" ? entry.contentType : null,
      }));
  } catch {
    return [];
  }
}

export async function upsertAssetAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await run("asset.save", "Unable to save asset.", async () => {
    const owner = await requireOwner();

    const input = parseOrThrow(assetFormSchema, {
      assetId: readOptionalUuid(formData, "asset_id"),
      name: readString(formData, "name"),
      slug: readString(formData, "slug"),
      description: readString(formData, "description"),
      groupId: readOptionalUuid(formData, "group_id") ?? null,
      newGroupName: readString(formData, "new_group_name"),
      links: readStringList(formData, "link_url"),
      replaceFiles: readBoolean(formData, "replace_files"),
      autoApproveEnabled: readBoolean(formData, "auto_approve_enabled"),
      autoApproveDays: readString(formData, "auto_approve_days"),
      autoApproveHours: readString(formData, "auto_approve_hours"),
      autoApproveMinutes: readString(formData, "auto_approve_minutes"),
      autoApproveSeconds: readString(formData, "auto_approve_seconds"),
      releaseNote: readString(formData, "release_note"),
    });

    return saveAsset(owner.id, {
      ...input,
      draftAssetId: readOptionalUuid(formData, "draft_asset_id"),
      uploads: parseUploads(readString(formData, "uploads")),
    });
  });

  if (!result.ok) return result.state;

  redirect(`/dashboard/assets/${result.value.assetId}?saved=1`);
}

/** Called directly from the browser to mint direct-to-storage upload URLs. */
export async function createUploadTicketsAction(input: {
  assetId: string;
  isExistingAsset: boolean;
  files: { name: string; size: number; type: string | null }[];
}) {
  const result = await run(
    "asset.upload-tickets",
    "Unable to start the upload.",
    async () => {
      const owner = await requireOwner();
      parseOrThrow(uuidSchema, input.assetId);

      return createUploadTickets(owner.id, {
        assetId: input.assetId,
        isExistingAsset: Boolean(input.isExistingAsset),
        files: (input.files ?? []).slice(0, 100).map((file) => ({
          name: String(file.name ?? "file"),
          size: Number(file.size) || 0,
          type: file.type ? String(file.type) : null,
        })),
      });
    },
  );

  if (!result.ok) {
    return {
      ok: false as const,
      message: result.state.message ?? "Upload failed.",
    };
  }

  return { ok: true as const, tickets: result.value };
}

export async function deleteAssetFileAction(input: {
  assetId: string;
  fileId: string;
}): Promise<ActionState> {
  const result = await run(
    "asset.delete-file",
    "Unable to remove that file.",
    async () => {
      const owner = await requireOwner();

      await deleteAssetFile(
        owner.id,
        parseOrThrow(uuidSchema, input.assetId),
        parseOrThrow(uuidSchema, input.fileId),
      );
    },
  );

  return result.ok ? successState("File removed.") : result.state;
}

export async function deleteAssetAction(formData: FormData) {
  const result = await run(
    "asset.delete",
    "Unable to delete asset.",
    async () => {
      const owner = await requireOwner();
      const assetId = parseOrThrow(uuidSchema, readString(formData, "asset_id"));

      await deleteAsset(owner.id, assetId);
    },
  );

  if (!result.ok) {
    redirect(
      `/dashboard?error=${encodeURIComponent(result.state.message ?? "Unable to delete asset.")}`,
    );
  }

  redirect("/dashboard");
}

/* -------------------------------------------------------------------------- */
/* Collections                                                                */
/* -------------------------------------------------------------------------- */

export async function createCollectionAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await run(
    "collection.create",
    "Unable to create collection.",
    async () => {
      const owner = await requireOwner();
      const name = parseOrThrow(
        collectionNameSchema,
        readString(formData, "name"),
      );

      await createAssetGroup(owner.id, name);
      revalidatePath("/dashboard");
    },
  );

  return result.ok ? successState("Collection created.") : result.state;
}

export async function deleteCollectionAction(formData: FormData) {
  await run("collection.delete", "Unable to delete collection.", async () => {
    const owner = await requireOwner();
    const groupId = parseOrThrow(uuidSchema, readString(formData, "group_id"));

    await deleteAssetGroup(owner.id, groupId);
    revalidatePath("/dashboard");
  });

  redirect("/dashboard");
}

/* -------------------------------------------------------------------------- */
/* Request decisions                                                          */
/* -------------------------------------------------------------------------- */

export async function approveRequestAction(input: {
  requestId: string;
  decisionNote?: string;
}): Promise<ActionState> {
  const result = await run(
    "request.approve",
    "Unable to approve that request.",
    async () => {
      const owner = await requireOwner();
      const requestId = parseOrThrow(uuidSchema, input.requestId);

      return releaseRequest({
        requestId,
        mode: "approved",
        ownerId: owner.id,
        decisionNote: input.decisionNote ?? null,
      });
    },
  );

  if (!result.ok) return result.state;

  return successState(
    result.value.released
      ? "Approved. The requester has been emailed."
      : (result.value.reason ?? "That request was already handled."),
  );
}

export async function denyRequestAction(input: {
  requestId: string;
  decisionNote?: string;
}): Promise<ActionState> {
  const result = await run(
    "request.deny",
    "Unable to decline that request.",
    async () => {
      const owner = await requireOwner();
      const requestId = parseOrThrow(uuidSchema, input.requestId);

      return denyRequest({
        ownerId: owner.id,
        requestId,
        decisionNote: input.decisionNote ?? null,
      });
    },
  );

  if (!result.ok) return result.state;

  return successState(
    result.value.released
      ? "Declined. The requester has been notified."
      : (result.value.reason ?? "That request was already handled."),
  );
}

export async function clearRequestHistoryAction(formData: FormData) {
  const redirectTo = readString(formData, "redirect_to").trim() || "/dashboard";

  await run("request.clear-history", "Unable to clear history.", async () => {
    const owner = await requireOwner();
    const assetId = readOptionalUuid(formData, "asset_id");

    await clearRequestHistory(
      owner.id,
      assetId ? parseOrThrow(uuidSchema, assetId) : undefined,
    );
  });

  // Only same-origin paths, so this cannot be turned into an open redirect.
  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateSettingsAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await run(
    "profile.update",
    "Unable to save settings.",
    async () => {
      const owner = await requireOwner();
      const input = parseOrThrow(profileSettingsSchema, {
        phone: readString(formData, "phone"),
        notificationEmail: readBoolean(formData, "notification_email"),
        notificationSms: readBoolean(formData, "notification_sms"),
      });

      await updateOwnerProfile(owner.id, input);

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
    },
  );

  return result.ok ? successState("Settings updated.") : result.state;
}
