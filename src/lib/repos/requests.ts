import "server-only";

import { NotFoundError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { AccessRequest, AccessRequestStatus, Asset } from "@/lib/types";

export type RequestWithAsset = AccessRequest & { assets: Asset | null };

/**
 * Minimal projection used to compute per-asset badge counts. Selecting two
 * columns instead of `*` keeps the dashboard payload flat as history grows.
 */
export async function listRequestCounters(ownerId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .select("asset_id,status")
    .eq("owner_id", ownerId);

  if (error) throw error;
  return (data ?? []) as { asset_id: string; status: AccessRequestStatus }[];
}

export async function listPendingRequests(
  ownerId: string,
): Promise<AccessRequest[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AccessRequest[];
}

const PROCESSED_STATUSES: AccessRequestStatus[] = [
  "approved",
  "auto_approved",
  "denied",
];

export async function listRequestHistory(
  ownerId: string,
  options: { limit: number; assetId?: string },
): Promise<{ rows: AccessRequest[]; total: number }> {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .select("*", { count: "exact" })
    .eq("owner_id", ownerId)
    .in("status", PROCESSED_STATUSES)
    .order("created_at", { ascending: false })
    .range(0, Math.max(options.limit - 1, 0));

  if (options.assetId) {
    query = query.eq("asset_id", options.assetId);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { rows: (data ?? []) as AccessRequest[], total: count ?? 0 };
}

export async function countRequestsForAsset(ownerId: string, assetId: string) {
  const admin = createAdminSupabaseClient();
  const { count, error } = await admin
    .from("access_requests")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("asset_id", assetId);

  if (error) throw error;
  return count ?? 0;
}

export async function insertAccessRequest(input: {
  assetId: string;
  ownerId: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
}): Promise<AccessRequest> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .insert({
      asset_id: input.assetId,
      owner_id: input.ownerId,
      requester_name: input.requesterName,
      requester_email: input.requesterEmail,
      reason: input.reason,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as AccessRequest;
}

export async function deleteRequest(requestId: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("access_requests").delete().eq("id", requestId);
}

export async function setQstashMessageId(
  requestId: string,
  messageId: string | null,
) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .update({ qstash_message_id: messageId })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getRequestWithAsset(
  requestId: string,
  ownerId?: string,
): Promise<RequestWithAsset | null> {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .select("*, assets(*)")
    .eq("id", requestId);

  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return (data ?? null) as RequestWithAsset | null;
}

/**
 * Atomically move a pending request into a terminal state. Returns null when
 * somebody else (the owner, or a QStash retry) already claimed it, which is
 * what makes double-approval and duplicate release emails impossible.
 */
export async function claimPendingRequest(
  requestId: string,
  status: Exclude<AccessRequestStatus, "pending">,
  decisionNote: string | null,
): Promise<AccessRequest | null> {
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const isDenial = status === "denied";

  const { data, error } = await admin
    .from("access_requests")
    .update({
      status,
      decision_note: decisionNote,
      qstash_message_id: null,
      ...(isDenial
        ? { denied_at: now }
        : { approved_at: now, released_at: now }),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AccessRequest | null;
}

/**
 * Undo a claim when delivery failed, so the owner still sees the request in
 * their queue and a QStash retry can pick it up again.
 */
export async function revertClaim(
  requestId: string,
  previous: Pick<AccessRequest, "decision_note" | "qstash_message_id">,
) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("access_requests")
    .update({
      status: "pending",
      approved_at: null,
      released_at: null,
      denied_at: null,
      decision_note: previous.decision_note,
      qstash_message_id: previous.qstash_message_id,
    })
    .eq("id", requestId)
    .neq("status", "pending");

  if (error) throw error;
}

export async function listPendingQstashMessageIds(
  ownerId: string,
  assetId: string,
) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .select("qstash_message_id")
    .eq("owner_id", ownerId)
    .eq("asset_id", assetId)
    .eq("status", "pending");

  if (error) throw error;
  return (data ?? []).map((row) => row.qstash_message_id as string | null);
}

export async function clearRequestHistory(ownerId: string, assetId?: string) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .delete()
    .eq("owner_id", ownerId)
    .in("status", PROCESSED_STATUSES);

  if (assetId) query = query.eq("asset_id", assetId);

  const { error } = await query;
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Abuse controls                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Durable request counts backing the rate limiter. Derived from rows we already
 * write, so no extra table is needed.
 */
export async function countRecentRequests(filter: {
  sinceIso: string;
  assetId?: string;
  requesterEmail?: string;
}) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("access_requests")
    .select("*", { count: "exact", head: true })
    .gte("created_at", filter.sinceIso);

  if (filter.assetId) query = query.eq("asset_id", filter.assetId);
  if (filter.requesterEmail) {
    query = query.eq("requester_email", filter.requesterEmail);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count ?? 0;
}

/** Used to collapse repeat submissions instead of creating duplicate rows. */
export async function findPendingRequestByEmail(
  assetId: string,
  requesterEmail: string,
): Promise<AccessRequest | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("access_requests")
    .select("*")
    .eq("asset_id", assetId)
    .eq("requester_email", requesterEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AccessRequest | null;
}

/* -------------------------------------------------------------------------- */
/* Requester-facing download flow                                             */
/* -------------------------------------------------------------------------- */

export async function getReleasedRequest(
  requestId: string,
): Promise<RequestWithAsset> {
  const request = await getRequestWithAsset(requestId);

  if (
    !request ||
    (request.status !== "approved" && request.status !== "auto_approved")
  ) {
    throw new NotFoundError("This download link is no longer valid.");
  }

  return request;
}
