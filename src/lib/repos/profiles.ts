import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { Profile } from "@/lib/types";

/**
 * Profiles are created by the `on_auth_user_created` trigger. This is the lazy
 * repair path for accounts that predate the trigger -- it replaces the blanket
 * upsert that used to run on every single authenticated request.
 */
export async function getOwnerProfile(
  ownerId: string,
  fallbackEmail?: string | null,
): Promise<Profile> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Profile;

  const { data: created, error: createError } = await admin
    .from("profiles")
    .upsert(
      { id: ownerId, email: fallbackEmail ?? "" },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (createError) throw createError;
  if (!created) throw new AppError("Unable to initialize owner profile.");

  return created as Profile;
}

export async function updateOwnerProfile(
  ownerId: string,
  input: {
    phone: string | null;
    notificationEmail: boolean;
    notificationSms: boolean;
  },
) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("profiles")
    .update({
      phone: input.phone,
      notification_email: input.notificationEmail,
      notification_sms: input.notificationSms,
    })
    .eq("id", ownerId);

  if (error) throw error;
}
