export type AssetKind = "link" | "files";
export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "denied"
  | "auto_approved";

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetGroup {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Asset {
  id: string;
  owner_id: string;
  group_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  kind: AssetKind;
  link_url: string | null;
  auto_approve_enabled: boolean;
  auto_approve_delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface AssetFile {
  id: string;
  asset_id: string;
  owner_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  sort_order: number;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  asset_id: string;
  owner_id: string;
  requester_email: string;
  reason: string;
  status: AccessRequestStatus;
  qstash_message_id: string | null;
  decision_note: string | null;
  approved_at: string | null;
  denied_at: string | null;
  released_at: string | null;
  created_at: string;
}

export interface DashboardAsset extends Asset {
  files: AssetFile[];
  group: AssetGroup | null;
  requestCount: number;
  pendingCount: number;
}

export interface AssetRequestSummary extends AccessRequest {
  asset: Asset;
}

export interface PublicAssetView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: AssetKind;
  auto_approve_enabled: boolean;
  auto_approve_delay_seconds: number;
}
