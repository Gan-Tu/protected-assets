import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ASSET_BUCKET, REQUEST_LINK_TTL_SECONDS } from "@/lib/constants";
import {
  sendOwnerRequestNotification,
  sendRequesterDeniedEmail,
  sendRequesterReleaseEmail,
} from "@/lib/notifications";
import {
  cancelAutoRelease,
  cancelAutoReleaseMessages,
  scheduleAutoRelease,
} from "@/lib/qstash";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import type {
  AccessRequestStatus,
  Asset,
  AssetFile,
  AssetGroup,
  DashboardAsset,
  Profile,
  PublicAssetView,
} from "@/lib/types";
import {
  coerceBoolean,
  compactFileSize,
  formatRelativeWindow,
  getErrorMessage,
  getBaseUrl,
  slugify,
} from "@/lib/utils";

export async function requireOwner() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to initialize owner profile."));
  }

  return user;
}

export async function getLandingUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getOwnerProfile(ownerId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", ownerId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getDashboardData(ownerId: string) {
  const admin = createAdminSupabaseClient();

  const [{ data: groups, error: groupsError }, { data: assets, error: assetsError }, { data: requests, error: requestsError }] =
    await Promise.all([
      admin.from("asset_groups").select("*").eq("owner_id", ownerId).order("name"),
      admin.from("assets").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false }),
      admin
        .from("access_requests")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false }),
    ]);

  if (groupsError) throw groupsError;
  if (assetsError) throw assetsError;
  if (requestsError) throw requestsError;

  const assetIds = (assets ?? []).map((asset) => asset.id);

  const [{ data: files, error: filesError }] = await Promise.all([
    assetIds.length
      ? admin
          .from("asset_files")
          .select("*")
          .in("asset_id", assetIds)
          .order("sort_order")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (filesError) throw filesError;

  const filesByAsset = new Map<string, AssetFile[]>();
  (files ?? []).forEach((file) => {
    const current = filesByAsset.get(file.asset_id) ?? [];
    current.push(file as AssetFile);
    filesByAsset.set(file.asset_id, current);
  });

  const groupMap = new Map<string, AssetGroup>((groups ?? []).map((group) => [group.id, group as AssetGroup]));

  const requestCounts = new Map<string, { total: number; pending: number }>();
  (requests ?? []).forEach((request) => {
    const current = requestCounts.get(request.asset_id) ?? { total: 0, pending: 0 };
    current.total += 1;
    if (request.status === "pending") current.pending += 1;
    requestCounts.set(request.asset_id, current);
  });

  const enrichedAssets: DashboardAsset[] = (assets ?? []).map((asset) => ({
    ...(asset as Asset),
    files: filesByAsset.get(asset.id) ?? [],
    group: asset.group_id ? groupMap.get(asset.group_id) ?? null : null,
    requestCount: requestCounts.get(asset.id)?.total ?? 0,
    pendingCount: requestCounts.get(asset.id)?.pending ?? 0,
  }));

  const pendingRequests = (requests ?? [])
    .filter((request) => request.status === "pending")
    .map((request) => ({
      ...request,
      asset: enrichedAssets.find((asset) => asset.id === request.asset_id) ?? null,
    }))
    .filter((request) => request.asset !== null);

  return {
    groups: (groups ?? []) as AssetGroup[],
    assets: enrichedAssets,
    pendingRequests,
    requests: requests ?? [],
  };
}

export async function getAssetForEditor(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const { data: asset, error: assetError } = await admin
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("owner_id", ownerId)
    .single();

  if (assetError) throw assetError;

  const [{ data: files, error: filesError }, { data: requests, error: requestsError }] =
    await Promise.all([
      admin.from("asset_files").select("*").eq("asset_id", assetId).order("sort_order"),
      admin
        .from("access_requests")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false }),
    ]);

  if (filesError) throw filesError;
  if (requestsError) throw requestsError;

  return {
    asset: asset as Asset,
    files: (files ?? []) as AssetFile[],
    requests: requests ?? [],
  };
}

export async function getPublicAssetBySlug(slug: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select("id,name,slug,description,kind,auto_approve_enabled,auto_approve_delay_seconds")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as PublicAssetView;
}

function parseAutoApprove(formData: FormData) {
  if (!coerceBoolean(formData.get("auto_approve_enabled"))) {
    return { enabled: false, totalSeconds: 0 };
  }

  const days = Number(formData.get("auto_approve_days") ?? 0);
  const hours = Number(formData.get("auto_approve_hours") ?? 0);
  const minutes = Number(formData.get("auto_approve_minutes") ?? 0);
  const seconds = Number(formData.get("auto_approve_seconds") ?? 0);
  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  return { enabled: true, totalSeconds: Math.max(totalSeconds, 1) };
}

async function ensureUniqueSlug(input: string, ownerId: string, currentAssetId?: string) {
  const admin = createAdminSupabaseClient();
  const desired = slugify(input) || `${slugify(ownerId.slice(0, 8))}-${randomUUID().slice(0, 6)}`;

  const { data } = await admin
    .from("assets")
    .select("id")
    .eq("slug", desired)
    .maybeSingle();

  if (!data || data.id === currentAssetId) return desired;

  if (input.trim()) {
    throw new Error("That short URL is already taken.");
  }

  return `${desired}-${randomUUID().slice(0, 4)}`;
}

async function deleteStoredFiles(paths: string[]) {
  if (!paths.length) return;

  const admin = createAdminSupabaseClient();
  await admin.storage.from(ASSET_BUCKET).remove(paths);
}

async function uploadFiles(ownerId: string, assetId: string, files: File[]) {
  if (!files.length) return [];

  const admin = createAdminSupabaseClient();
  const uploaded: Omit<AssetFile, "id" | "created_at">[] = [];

  for (const [index, file] of files.entries()) {
    const fileSlug = slugify(file.name.replace(/\.[^.]+$/, "")) || "document";
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const storagePath = `${ownerId}/${assetId}/${Date.now()}-${index}-${fileSlug}.${extension}`;
    const { error } = await admin.storage.from(ASSET_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) throw error;

    uploaded.push({
      asset_id: assetId,
      owner_id: ownerId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || null,
      sort_order: index,
    });
  }

  return uploaded;
}

export async function saveAsset(ownerId: string, formData: FormData, assetId?: string) {
  const admin = createAdminSupabaseClient();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "link") as Asset["kind"];
  const description = String(formData.get("description") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim() || null;
  const linkUrl = String(formData.get("link_url") ?? "").trim() || null;
  const slugInput = String(formData.get("slug") ?? "").trim();
  const replaceFiles = coerceBoolean(formData.get("replace_files"));
  const autoApprove = parseAutoApprove(formData);

  if (!name) throw new Error("Asset name is required.");
  if (kind === "link" && !linkUrl) throw new Error("A link URL is required for link assets.");

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const slug = await ensureUniqueSlug(slugInput || name, ownerId, assetId);

  let existingFiles: AssetFile[] = [];
  let previousKind: Asset["kind"] | null = null;

  if (assetId) {
    const { data: existingAsset } = await admin
      .from("assets")
      .select("kind")
      .eq("id", assetId)
      .eq("owner_id", ownerId)
      .single();

    previousKind = existingAsset?.kind as Asset["kind"];

    const { data: currentFiles } = await admin
      .from("asset_files")
      .select("*")
      .eq("asset_id", assetId);

    existingFiles = (currentFiles ?? []) as AssetFile[];
  }

  if (!assetId) {
    assetId = randomUUID();
  }

  if (previousKind === "files" && kind === "link") {
    await deleteStoredFiles(existingFiles.map((file) => file.storage_path));
    await admin.from("asset_files").delete().eq("asset_id", assetId);
    existingFiles = [];
  }

  if (kind === "files" && replaceFiles && existingFiles.length) {
    await deleteStoredFiles(existingFiles.map((file) => file.storage_path));
    await admin.from("asset_files").delete().eq("asset_id", assetId);
    existingFiles = [];
  }

  if (kind === "files" && !existingFiles.length && !files.length) {
    throw new Error("Upload at least one document for a file asset.");
  }

  const payload = {
    id: assetId,
    owner_id: ownerId,
    group_id: groupId,
    name,
    slug,
    description: description || null,
    kind,
    link_url: kind === "link" ? linkUrl : null,
    auto_approve_enabled: autoApprove.enabled,
    auto_approve_delay_seconds: autoApprove.totalSeconds,
  };

  const { error: assetError } = await admin.from("assets").upsert(payload);
  if (assetError) throw assetError;

  if (kind === "files" && files.length) {
    const uploaded = await uploadFiles(ownerId, assetId, files);
    const startingOrder =
      existingFiles.length > 0
        ? Math.max(...existingFiles.map((file) => file.sort_order)) + 1
        : 0;

    const { error: filesError } = await admin.from("asset_files").insert(
      uploaded.map((file, index) => ({
        ...file,
        sort_order: startingOrder + index,
      })),
    );

    if (filesError) throw filesError;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${assetId}`);
  revalidatePath(`/a/${slug}`);

  return { assetId, slug };
}

export async function deleteAsset(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const [{ data: files }, { data: pendingRequests }] = await Promise.all([
    admin
      .from("asset_files")
      .select("storage_path")
      .eq("asset_id", assetId)
      .eq("owner_id", ownerId),
    admin
      .from("access_requests")
      .select("qstash_message_id")
      .eq("asset_id", assetId)
      .eq("owner_id", ownerId)
      .eq("status", "pending"),
  ]);

  await deleteStoredFiles((files ?? []).map((file) => file.storage_path));
  await cancelAutoReleaseMessages(
    (pendingRequests ?? []).map((request) => request.qstash_message_id),
  );
  await admin.from("assets").delete().eq("id", assetId).eq("owner_id", ownerId);

  revalidatePath("/dashboard");
}

export async function createAssetGroup(ownerId: string, name: string) {
  const admin = createAdminSupabaseClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Collection name is required.");

  await admin.from("asset_groups").insert({
    owner_id: ownerId,
    name: trimmed,
  });

  revalidatePath("/dashboard");
}

export async function deleteAssetGroup(ownerId: string, groupId: string) {
  const admin = createAdminSupabaseClient();

  await admin
    .from("asset_groups")
    .delete()
    .eq("id", groupId)
    .eq("owner_id", ownerId);

  revalidatePath("/dashboard");
}

export async function updateProfile(
  ownerId: string,
  input: {
    phone: string;
    notificationEmail: boolean;
    notificationSms: boolean;
  },
) {
  const admin = createAdminSupabaseClient();

  await admin
    .from("profiles")
    .update({
      phone: input.phone.trim() || null,
      notification_email: input.notificationEmail,
      notification_sms: input.notificationSms,
    })
    .eq("id", ownerId);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function submitAccessRequest(formData: FormData) {
  const admin = createAdminSupabaseClient();
  const slug = String(formData.get("slug") ?? "").trim();
  const requesterEmail = String(formData.get("requester_email") ?? "")
    .trim()
    .toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!slug || !requesterEmail || !reason) {
    throw new Error("Email and reason are required.");
  }

  const { data: asset, error: assetError } = await admin
    .from("assets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (assetError || !asset) {
    throw new Error("That protected asset could not be found.");
  }

  const profile = await getOwnerProfile(asset.owner_id);

  const { data: request, error: requestError } = await admin
    .from("access_requests")
    .insert({
      asset_id: asset.id,
      owner_id: asset.owner_id,
      requester_email: requesterEmail,
      reason,
      status: "pending",
    })
    .select("*")
    .single();

  if (requestError) throw requestError;

  if (asset.auto_approve_enabled) {
    if (asset.auto_approve_delay_seconds > 0) {
      const scheduleResult = await scheduleAutoRelease(
        request.id,
        asset.auto_approve_delay_seconds,
      );

      if (!scheduleResult.scheduled) {
        await admin.from("access_requests").delete().eq("id", request.id);
        throw new Error(
          scheduleResult.reason ?? "Unable to schedule auto-release.",
        );
      }

      const { error: requestUpdateError } = await admin
        .from("access_requests")
        .update({ qstash_message_id: scheduleResult.messageId })
        .eq("id", request.id)
        .eq("status", "pending");

      if (requestUpdateError) {
        await cancelAutoRelease(scheduleResult.messageId);
        await admin.from("access_requests").delete().eq("id", request.id);
        throw requestUpdateError;
      }
    } else {
      await releaseRequest(request.id, "auto_approved");
    }
  }

  await sendOwnerRequestNotification({
    ownerEmail: profile.email,
    ownerPhone: profile.phone,
    sendEmailNotification: profile.notification_email,
    sendSmsNotification: profile.notification_sms,
    assetName: asset.name,
    assetSlug: asset.slug,
    requesterEmail,
    reason,
    autoApproveDelaySeconds: asset.auto_approve_enabled
      ? asset.auto_approve_delay_seconds
      : 0,
    requestId: request.id,
  });

  revalidatePath(`/a/${slug}`);

  return {
    assetName: asset.name,
    autoApproveLabel: asset.auto_approve_enabled
      ? formatRelativeWindow(asset.auto_approve_delay_seconds)
      : null,
  };
}

async function buildReleaseLinks(assetId: string) {
  const admin = createAdminSupabaseClient();
  const { data: files, error } = await admin
    .from("asset_files")
    .select("*")
    .eq("asset_id", assetId)
    .order("sort_order");

  if (error) throw error;

  const resolvedLinks = [];

  for (const file of files ?? []) {
    const { data, error: signedUrlError } = await admin.storage
      .from(ASSET_BUCKET)
      .createSignedUrl(file.storage_path, REQUEST_LINK_TTL_SECONDS);

    if (signedUrlError) throw signedUrlError;

    resolvedLinks.push({
      name: `${file.file_name} (${compactFileSize(file.file_size)})`,
      url: data.signedUrl,
    });
  }

  return resolvedLinks;
}

export async function releaseRequest(
  requestId: string,
  releaseMode: "approved" | "auto_approved",
  ownerId?: string,
) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .select("*, assets(*)")
    .eq("id", requestId);

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data: request, error } = await query.single();

  if (error || !request) {
    throw new Error("Request not found.");
  }

  if (request.status !== "pending") {
    return { skipped: true };
  }

  const asset = request.assets as Asset;

  const { error: updateError } = await admin
    .from("access_requests")
    .update({
      status: releaseMode,
      approved_at: new Date().toISOString(),
      released_at: new Date().toISOString(),
      qstash_message_id: null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (updateError) throw updateError;

  if (releaseMode === "approved") {
    await cancelAutoRelease(request.qstash_message_id);
  }

  const shareUrl = `${getBaseUrl()}/a/${asset.slug}`;

  await sendRequesterReleaseEmail({
    requestId,
    requesterEmail: request.requester_email,
    assetName: asset.name,
    assetDescription: asset.description,
    releaseMode,
    linkUrl: asset.kind === "link" ? asset.link_url : null,
    fileLinks: asset.kind === "files" ? await buildReleaseLinks(asset.id) : [],
    shareUrl,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${asset.id}`);
  revalidatePath(`/a/${asset.slug}`);

  return { skipped: false };
}

export async function denyRequest(ownerId: string, requestId: string) {
  const admin = createAdminSupabaseClient();
  const { data: request, error } = await admin
    .from("access_requests")
    .select("*, assets(*)")
    .eq("id", requestId)
    .eq("owner_id", ownerId)
    .single();

  if (error || !request) {
    throw new Error("Request not found.");
  }

  if (request.status !== "pending") return;

  await admin
    .from("access_requests")
    .update({
      status: "denied" satisfies AccessRequestStatus,
      denied_at: new Date().toISOString(),
      qstash_message_id: null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  await cancelAutoRelease(request.qstash_message_id);

  await sendRequesterDeniedEmail({
    requestId,
    requesterEmail: request.requester_email,
    assetName: request.assets.name,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${request.assets.id}`);
}

export async function clearRequestHistory(ownerId: string, assetId?: string) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .delete()
    .eq("owner_id", ownerId)
    .in("status", ["approved", "auto_approved", "denied"]);

  if (assetId) {
    query = query.eq("asset_id", assetId);
  }

  const { error } = await query;
  if (error) throw error;

  revalidatePath("/dashboard");

  if (assetId) {
    revalidatePath(`/dashboard/assets/${assetId}`);
  }
}
