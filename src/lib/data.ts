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
  AssetLink,
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

  const [{ data: files, error: filesError }, { data: links, error: linksError }] = await Promise.all([
    assetIds.length
      ? admin
          .from("asset_files")
          .select("*")
          .in("asset_id", assetIds)
          .order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    assetIds.length
      ? admin
          .from("asset_links")
          .select("*")
          .in("asset_id", assetIds)
          .order("sort_order")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (filesError) throw filesError;
  if (linksError) throw linksError;

  const filesByAsset = new Map<string, AssetFile[]>();
  (files ?? []).forEach((file) => {
    const current = filesByAsset.get(file.asset_id) ?? [];
    current.push(file as AssetFile);
    filesByAsset.set(file.asset_id, current);
  });

  const linksByAsset = new Map<string, AssetLink[]>();
  (links ?? []).forEach((link) => {
    const current = linksByAsset.get(link.asset_id) ?? [];
    current.push(link as AssetLink);
    linksByAsset.set(link.asset_id, current);
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
    links: linksByAsset.get(asset.id) ?? buildLegacyLinks(asset as Asset),
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

  const [
    { data: files, error: filesError },
    { data: links, error: linksError },
    { data: requests, error: requestsError },
  ] =
    await Promise.all([
      admin.from("asset_files").select("*").eq("asset_id", assetId).order("sort_order"),
      admin.from("asset_links").select("*").eq("asset_id", assetId).order("sort_order"),
      admin
        .from("access_requests")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false }),
    ]);

  if (filesError) throw filesError;
  if (linksError) throw linksError;
  if (requestsError) throw requestsError;

  return {
    asset: asset as Asset,
    links: (links?.length ? links : buildLegacyLinks(asset as Asset)) as AssetLink[],
    files: (files ?? []) as AssetFile[],
    requests: requests ?? [],
  };
}

export async function getPublicAssetBySlug(slug: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select("id,owner_id,name,slug,description,link_url,auto_approve_enabled,auto_approve_delay_seconds")
    .eq("slug", slug)
    .single();

  if (error) return null;

  const asset = data as Pick<
    Asset,
    "id" | "owner_id" | "name" | "slug" | "description" | "link_url" | "auto_approve_enabled" | "auto_approve_delay_seconds"
  >;

  const [{ data: links }, { count: fileCount }] = await Promise.all([
    admin
      .from("asset_links")
      .select("*")
      .eq("asset_id", asset.id)
      .order("sort_order"),
    admin
      .from("asset_files")
      .select("*", { count: "exact", head: true })
      .eq("asset_id", asset.id),
  ]);

  const resolvedLinks = (links?.length ? links : buildLegacyLinks(asset as Asset)) as AssetLink[];

  return {
    id: asset.id,
    name: asset.name,
    slug: asset.slug,
    description: asset.description,
    auto_approve_enabled: asset.auto_approve_enabled,
    auto_approve_delay_seconds: asset.auto_approve_delay_seconds,
    linkCount: resolvedLinks.length,
    fileCount: fileCount ?? 0,
  } satisfies PublicAssetView;
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

function buildLegacyLinks(
  asset: Pick<Asset, "id" | "owner_id" | "link_url">,
): AssetLink[] {
  if (!asset.link_url) {
    return [];
  }

  return [
    {
      id: `legacy-${asset.id}`,
      asset_id: asset.id,
      owner_id: asset.owner_id,
      url: asset.link_url,
      sort_order: 0,
      created_at: "",
    },
  ];
}

async function resolveAssetGroupId(
  ownerId: string,
  input: {
    groupId: string | null;
    newGroupName: string;
  },
) {
  const admin = createAdminSupabaseClient();
  const newGroupName = input.newGroupName.trim();

  if (newGroupName) {
    const { data: groups, error: groupsError } = await admin
      .from("asset_groups")
      .select("id, name")
      .eq("owner_id", ownerId)
      .order("name");

    if (groupsError) throw groupsError;

    const existingGroup = (groups ?? []).find(
      (group) => group.name.trim().toLowerCase() === newGroupName.toLowerCase(),
    );

    if (existingGroup) {
      return existingGroup.id;
    }

    const { data: createdGroup, error: createGroupError } = await admin
      .from("asset_groups")
      .insert({
        owner_id: ownerId,
        name: newGroupName,
      })
      .select("id")
      .single();

    if (createGroupError) throw createGroupError;

    return createdGroup.id;
  }

  if (!input.groupId) {
    return null;
  }

  const { data: existingGroup, error: groupError } = await admin
    .from("asset_groups")
    .select("id")
    .eq("id", input.groupId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!existingGroup) throw new Error("Selected collection was not found.");

  return existingGroup.id;
}

export async function saveAsset(ownerId: string, formData: FormData, assetId?: string) {
  const admin = createAdminSupabaseClient();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const submittedGroupId = String(formData.get("group_id") ?? "").trim() || null;
  const newGroupName = String(formData.get("new_group_name") ?? "").trim();
  const linkUrls = formData
    .getAll("link_url")
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  const slugInput = String(formData.get("slug") ?? "").trim();
  const replaceFiles = coerceBoolean(formData.get("replace_files"));
  const autoApprove = parseAutoApprove(formData);
  const autoApproveNote = String(formData.get("release_note") ?? "").trim();

  if (!name) throw new Error("Asset name is required.");

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const slug = await ensureUniqueSlug(slugInput || name, ownerId, assetId);
  const groupId = await resolveAssetGroupId(ownerId, {
    groupId: submittedGroupId,
    newGroupName,
  });

  let existingFiles: AssetFile[] = [];

  if (assetId) {
    const { data: currentFiles } = await admin
      .from("asset_files")
      .select("*")
      .eq("asset_id", assetId);

    existingFiles = (currentFiles ?? []) as AssetFile[];
  }

  if (!assetId) {
    assetId = randomUUID();
  }

  if (replaceFiles && existingFiles.length) {
    await deleteStoredFiles(existingFiles.map((file) => file.storage_path));
    await admin.from("asset_files").delete().eq("asset_id", assetId);
    existingFiles = [];
  }

  const resultingFileCount = existingFiles.length + files.length;
  const resultingLinkCount = linkUrls.length;

  if (!resultingFileCount && !resultingLinkCount) {
    throw new Error("Add at least one protected link or upload at least one file.");
  }

  const payload = {
    id: assetId,
    owner_id: ownerId,
    group_id: groupId,
    name,
    slug,
    description: description || null,
    kind: resultingFileCount > 0 ? ("files" satisfies Asset["kind"]) : ("link" satisfies Asset["kind"]),
    link_url: linkUrls[0] ?? null,
    auto_approve_enabled: autoApprove.enabled,
    auto_approve_delay_seconds: autoApprove.totalSeconds,
    auto_approve_note: autoApprove.enabled ? autoApproveNote || null : null,
  };

  const { error: assetError } = await admin.from("assets").upsert(payload);
  if (assetError) throw assetError;

  const { error: deleteLinksError } = await admin
    .from("asset_links")
    .delete()
    .eq("asset_id", assetId);

  if (deleteLinksError) throw deleteLinksError;

  if (linkUrls.length) {
    const { error: linksError } = await admin.from("asset_links").insert(
      linkUrls.map((url, index) => ({
        asset_id: assetId,
        owner_id: ownerId,
        url,
        sort_order: index,
      })),
    );

    if (linksError) throw linksError;
  }

  if (files.length) {
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
  const requesterName = String(formData.get("requester_name") ?? "").trim();
  const requesterEmail = String(formData.get("requester_email") ?? "")
    .trim()
    .toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!slug || !requesterName || !requesterEmail || !reason) {
    throw new Error("Name, email, and reason are required.");
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
      requester_name: requesterName,
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
    requesterName,
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

function shouldAttachFile(file: AssetFile) {
  const allowedContentTypes = new Set([
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
  const allowedExtensions = new Set([
    "pdf",
    "txt",
    "csv",
    "md",
    "json",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ]);

  const extension = file.file_name.includes(".")
    ? file.file_name.split(".").pop()?.toLowerCase()
    : null;

  if (file.content_type && allowedContentTypes.has(file.content_type)) {
    return true;
  }

  return extension ? allowedExtensions.has(extension) : false;
}

async function buildReleaseFileDelivery(assetId: string) {
  const admin = createAdminSupabaseClient();
  const { data: files, error } = await admin
    .from("asset_files")
    .select("*")
    .eq("asset_id", assetId)
    .order("sort_order");

  if (error) throw error;

  const maxAttachmentBytes = 28 * 1024 * 1024;
  let attachedBytes = 0;
  const attachments: {
    filename: string;
    content: Buffer;
    content_type?: string;
  }[] = [];
  const fileLinks: { name: string; url: string }[] = [];

  for (const file of (files ?? []) as AssetFile[]) {
    const signedName = `${file.file_name} (${compactFileSize(file.file_size)})`;
    const canAttachByType = shouldAttachFile(file);
    const fileSize = file.file_size ?? 0;
    const fitsAttachmentBudget =
      fileSize > 0 && attachedBytes + fileSize <= maxAttachmentBytes;

    if (canAttachByType && fitsAttachmentBudget) {
      const { data: downloadData, error: downloadError } = await admin.storage
        .from(ASSET_BUCKET)
        .download(file.storage_path);

      if (!downloadError && downloadData) {
        const buffer = Buffer.from(await downloadData.arrayBuffer());
        attachments.push({
          filename: file.file_name,
          content: buffer,
          content_type: file.content_type || undefined,
        });
        attachedBytes += buffer.byteLength;
        continue;
      }
    }

    const { data: signedData, error: signedUrlError } = await admin.storage
      .from(ASSET_BUCKET)
      .createSignedUrl(file.storage_path, REQUEST_LINK_TTL_SECONDS);

    if (signedUrlError) throw signedUrlError;

    fileLinks.push({
      name: signedName,
      url: signedData.signedUrl,
    });
  }

  return { attachments, fileLinks };
}

async function buildReleaseUrlLinks(asset: Asset) {
  const admin = createAdminSupabaseClient();
  const { data: links, error } = await admin
    .from("asset_links")
    .select("*")
    .eq("asset_id", asset.id)
    .order("sort_order");

  if (error) throw error;

  const resolvedLinks = (links?.length ? links : buildLegacyLinks(asset)).map((link, index) => ({
    name: `Protected link ${index + 1}`,
    url: link.url,
  }));

  return resolvedLinks;
}

function buildStoredReleaseNote(
  releaseNote: string | null,
  approvalNote: string | null,
) {
  if (releaseNote && approvalNote) {
    return `Release note:\n${releaseNote}\n\nApproval note:\n${approvalNote}`;
  }

  return approvalNote ?? releaseNote;
}

export async function releaseRequest(
  requestId: string,
  releaseMode: "approved" | "auto_approved",
  ownerId?: string,
  decisionNote?: string | null,
) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .select("*, assets(*)")
    .eq("id", requestId);

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data: request, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Request not found.");
  }

  if (!request) {
    if (releaseMode === "auto_approved") {
      return { skipped: true };
    }

    throw new Error("Request not found.");
  }

  if (request.status !== "pending") {
    return { skipped: true };
  }

  const asset = request.assets as Asset | null;

  if (!asset) {
    if (releaseMode === "auto_approved") {
      return { skipped: true };
    }

    throw new Error("Asset not found.");
  }

  const releaseNote = asset.auto_approve_note?.trim() || null;
  const approvalNote =
    releaseMode === "approved" ? decisionNote?.trim() || null : null;
  const storedDecisionNote = buildStoredReleaseNote(releaseNote, approvalNote);

  const { data: updatedRequest, error: updateError } = await admin
    .from("access_requests")
    .update({
      status: releaseMode,
      approved_at: new Date().toISOString(),
      released_at: new Date().toISOString(),
      decision_note: storedDecisionNote,
      qstash_message_id: null,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;

  if (!updatedRequest) {
    return { skipped: true };
  }

  if (releaseMode === "approved") {
    await cancelAutoRelease(request.qstash_message_id);
  }

  const shareUrl = `${getBaseUrl()}/a/${asset.slug}`;
  const fileDelivery = await buildReleaseFileDelivery(asset.id);

  await sendRequesterReleaseEmail({
    requestId,
    requesterEmail: request.requester_email,
    assetName: asset.name,
    assetDescription: asset.description,
    releaseMode,
    links: await buildReleaseUrlLinks(asset),
    attachments: fileDelivery.attachments,
    fileLinks: fileDelivery.fileLinks,
    shareUrl,
    releaseNote,
    decisionNote: approvalNote,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/assets/${asset.id}`);
  revalidatePath(`/a/${asset.slug}`);

  return { skipped: false };
}

export async function denyRequest(
  ownerId: string,
  requestId: string,
  decisionNote?: string | null,
) {
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

  const normalizedDecisionNote = decisionNote?.trim() || null;
  const { error: updateError } = await admin
    .from("access_requests")
    .update({
      status: "denied" satisfies AccessRequestStatus,
      denied_at: new Date().toISOString(),
      decision_note: normalizedDecisionNote,
      qstash_message_id: null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (updateError) throw updateError;

  await cancelAutoRelease(request.qstash_message_id);

  await sendRequesterDeniedEmail({
    requestId,
    requesterEmail: request.requester_email,
    assetName: request.assets.name,
    decisionNote: normalizedDecisionNote,
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
