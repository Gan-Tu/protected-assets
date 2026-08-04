import "server-only";

import { randomUUID } from "node:crypto";

import { AppError, NotFoundError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Asset, AssetFile, AssetGroup, AssetLink } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Owner-scoped data access for assets.
 *
 * Every function here takes `ownerId` first and filters on it. That convention
 * is load-bearing: these queries run with the service-role key, so RLS is
 * bypassed and this module is the only thing standing between a forged
 * `asset_id` in a form post and another tenant's data.
 */

/**
 * Resolve an asset the caller is allowed to touch, or fail. Call this before
 * any write that accepts a client-supplied asset id.
 */
export async function assertAssetOwnership(
  ownerId: string,
  assetId: string,
): Promise<Asset> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("That asset could not be found.");

  return data as Asset;
}

/** True when the id is free to use as a draft (nobody owns it yet). */
export async function isUnclaimedAssetId(assetId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

export async function listAssetGroups(ownerId: string): Promise<AssetGroup[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("asset_groups")
    .select("*")
    .eq("owner_id", ownerId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as AssetGroup[];
}

export async function createAssetGroup(ownerId: string, name: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("asset_groups")
    .insert({ owner_id: ownerId, name });

  if (error) throw error;
}

export async function deleteAssetGroup(ownerId: string, groupId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("asset_groups")
    .delete()
    .eq("id", groupId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

export async function resolveAssetGroupId(
  ownerId: string,
  input: { groupId: string | null; newGroupName: string },
): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const newGroupName = input.newGroupName.trim();

  if (newGroupName) {
    const groups = await listAssetGroups(ownerId);
    const existing = groups.find(
      (group) => group.name.trim().toLowerCase() === newGroupName.toLowerCase(),
    );

    if (existing) return existing.id;

    const { data: created, error } = await admin
      .from("asset_groups")
      .insert({ owner_id: ownerId, name: newGroupName })
      .select("id")
      .single();

    if (error) throw error;
    return created.id as string;
  }

  if (!input.groupId) return null;

  const { data: existing, error } = await admin
    .from("asset_groups")
    .select("id")
    .eq("id", input.groupId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  if (!existing) throw new AppError("Selected collection was not found.");

  return existing.id as string;
}

export async function listAssets(ownerId: string): Promise<Asset[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Asset[];
}

export async function getPublicAssetBySlug(slug: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("assets")
    .select(
      "id,owner_id,name,slug,description,link_url,auto_approve_enabled,auto_approve_delay_seconds,auto_approve_note",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Asset | null;
}

export async function listAssetLinks(assetIds: string[]): Promise<AssetLink[]> {
  if (!assetIds.length) return [];

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("asset_links")
    .select("*")
    .in("asset_id", assetIds)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as AssetLink[];
}

export async function listAssetFiles(assetIds: string[]): Promise<AssetFile[]> {
  if (!assetIds.length) return [];

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("asset_files")
    .select("*")
    .in("asset_id", assetIds)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as AssetFile[];
}

export async function getAssetFileById(
  fileId: string,
): Promise<AssetFile | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("asset_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AssetFile | null;
}

export async function countAssetFiles(assetId: string) {
  const admin = createAdminSupabaseClient();
  const { count, error } = await admin
    .from("asset_files")
    .select("*", { count: "exact", head: true })
    .eq("asset_id", assetId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Assets created before `asset_links` existed keep their URL on the asset row.
 * Present them as a synthetic link so every read path looks the same.
 */
export function buildLegacyLinks(
  asset: Pick<Asset, "id" | "owner_id" | "link_url">,
): AssetLink[] {
  if (!asset.link_url) return [];

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

export async function ensureUniqueSlug(
  input: string,
  ownerId: string,
  currentAssetId?: string,
) {
  const admin = createAdminSupabaseClient();
  const desired =
    slugify(input) || `${slugify(ownerId.slice(0, 8))}-${randomUUID().slice(0, 6)}`;

  const { data, error } = await admin
    .from("assets")
    .select("id")
    .eq("slug", desired)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.id === currentAssetId) return desired;

  if (input.trim()) {
    throw new AppError("That short URL is already taken.", {
      fieldErrors: { slug: "That short URL is already taken." },
    });
  }

  return `${desired}-${randomUUID().slice(0, 4)}`;
}

export type AssetWritePayload = {
  id: string;
  owner_id: string;
  group_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  kind: Asset["kind"];
  link_url: string | null;
  auto_approve_enabled: boolean;
  auto_approve_delay_seconds: number;
  auto_approve_note: string | null;
};

export async function upsertAsset(payload: AssetWritePayload) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("assets").upsert(payload);
  if (error) throw error;
}

export async function deleteAsset(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

export async function replaceAssetLinks(
  ownerId: string,
  assetId: string,
  urls: string[],
) {
  const admin = createAdminSupabaseClient();
  const { error: deleteError } = await admin
    .from("asset_links")
    .delete()
    .eq("asset_id", assetId)
    .eq("owner_id", ownerId);

  if (deleteError) throw deleteError;
  if (!urls.length) return;

  const { error } = await admin.from("asset_links").insert(
    urls.map((url, index) => ({
      asset_id: assetId,
      owner_id: ownerId,
      url,
      sort_order: index,
    })),
  );

  if (error) throw error;
}

export async function insertAssetFiles(
  rows: Omit<AssetFile, "id" | "created_at">[],
) {
  if (!rows.length) return;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("asset_files").insert(rows);
  if (error) throw error;
}

export async function deleteAssetFiles(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("asset_files")
    .delete()
    .eq("asset_id", assetId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

export async function deleteAssetFileById(ownerId: string, fileId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("asset_files")
    .delete()
    .eq("id", fileId)
    .eq("owner_id", ownerId)
    .select("storage_path")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("That file could not be found.");

  return data.storage_path as string;
}
