"use server";

import { redirect } from "next/navigation";

import {
  createAssetGroup,
  deleteAsset,
  deleteAssetGroup,
  denyRequest,
  releaseRequest,
  requireOwner,
  saveAsset,
  updateProfile,
} from "@/lib/data";
import { getErrorMessage } from "@/lib/utils";

export type AssetFormState = {
  error?: string;
};

export type SettingsFormState = {
  error?: string;
  success?: string;
};

export async function upsertAssetAction(
  _: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  let destination: string | null = null;

  try {
    const owner = await requireOwner();
    const assetId = String(formData.get("asset_id") ?? "").trim() || undefined;
    const result = await saveAsset(owner.id, formData, assetId);
    destination = `/dashboard/assets/${result.assetId}?saved=1`;
  } catch (error) {
    return {
      error: getErrorMessage(error, "Unable to save asset."),
    };
  }

  redirect(destination);
}

export async function createCollectionAction(formData: FormData) {
  const owner = await requireOwner();
  const name = String(formData.get("name") ?? "");
  await createAssetGroup(owner.id, name);
  redirect("/dashboard");
}

export async function deleteCollectionAction(formData: FormData) {
  const owner = await requireOwner();
  const groupId = String(formData.get("group_id") ?? "").trim();
  await deleteAssetGroup(owner.id, groupId);
  redirect("/dashboard");
}

export async function deleteAssetAction(formData: FormData) {
  const owner = await requireOwner();
  const assetId = String(formData.get("asset_id") ?? "").trim();
  await deleteAsset(owner.id, assetId);
  redirect("/dashboard");
}

export async function approveRequestAction(formData: FormData) {
  const owner = await requireOwner();
  const requestId = String(formData.get("request_id") ?? "");
  await releaseRequest(requestId, "approved", owner.id);
  redirect("/dashboard");
}

export async function denyRequestAction(formData: FormData) {
  const owner = await requireOwner();
  const requestId = String(formData.get("request_id") ?? "");
  await denyRequest(owner.id, requestId);
  redirect("/dashboard");
}

export async function updateSettingsAction(
  _: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  try {
    const owner = await requireOwner();
    await updateProfile(owner.id, {
      phone: String(formData.get("phone") ?? ""),
      notificationEmail: formData.get("notification_email") === "on",
      notificationSms: formData.get("notification_sms") === "on",
    });

    return { success: "Settings updated." };
  } catch (error) {
    return {
      error: getErrorMessage(error, "Unable to save settings."),
    };
  }
}
