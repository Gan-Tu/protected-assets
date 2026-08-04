import { z } from "zod";

import { AppError } from "@/lib/errors";

/**
 * Every value that crosses a trust boundary (public form, owner form, webhook)
 * is parsed here. Caps exist so a single request cannot store megabytes of text
 * or thousands of links.
 */

export const LIMITS = {
  name: 120,
  slug: 40,
  description: 2000,
  reason: 2000,
  note: 2000,
  email: 254,
  phone: 32,
  url: 2048,
  linksPerAsset: 50,
  /** QStash caps scheduled delivery; keep the product below it with headroom. */
  maxAutoReleaseSeconds: 7 * 24 * 60 * 60,
} as const;

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((value) => (value ? value : null));

/** http/https only -- blocks `javascript:` and `data:` payloads in emails. */
export const protectedUrlSchema = z
  .url({ protocol: /^https?$/ })
  .max(LIMITS.url, `Links must be under ${LIMITS.url} characters.`);

/**
 * Normalize before validating, not after: people paste addresses with trailing
 * spaces and mixed case, and `z.email()` runs before any `.transform()` would.
 */
export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Enter a valid email address.").max(LIMITS.email),
);

export const accessRequestSchema = z.object({
  slug: trimmed(LIMITS.slug).min(1, "Missing asset."),
  requesterName: trimmed(LIMITS.name).min(1, "Your name is required."),
  requesterEmail: emailSchema,
  reason: trimmed(LIMITS.reason).min(
    1,
    "Tell the owner why you need access.",
  ),
});

export type AccessRequestInput = z.infer<typeof accessRequestSchema>;

const countField = (max: number) =>
  z.coerce.number().int().min(0).max(max).catch(0);

export const assetFormSchema = z
  .object({
    assetId: z.uuid().optional(),
    name: trimmed(LIMITS.name).min(1, "Asset name is required."),
    slug: trimmed(LIMITS.slug).optional().default(""),
    description: optionalText(LIMITS.description),
    groupId: z.uuid().nullable().catch(null),
    newGroupName: trimmed(LIMITS.name).optional().default(""),
    links: z
      .array(protectedUrlSchema)
      .max(
        LIMITS.linksPerAsset,
        `Add at most ${LIMITS.linksPerAsset} links per asset.`,
      )
      .default([]),
    replaceFiles: z.boolean().default(false),
    autoApproveEnabled: z.boolean().default(false),
    autoApproveDays: countField(365),
    autoApproveHours: countField(23),
    autoApproveMinutes: countField(59),
    autoApproveSeconds: countField(59),
    releaseNote: optionalText(LIMITS.note),
  })
  .transform((value) => {
    const totalSeconds =
      value.autoApproveDays * 86400 +
      value.autoApproveHours * 3600 +
      value.autoApproveMinutes * 60 +
      value.autoApproveSeconds;

    return {
      ...value,
      autoApproveDelaySeconds: value.autoApproveEnabled
        ? Math.max(totalSeconds, 1)
        : 0,
    };
  })
  .refine(
    (value) =>
      !value.autoApproveEnabled ||
      value.autoApproveDelaySeconds <= LIMITS.maxAutoReleaseSeconds,
    {
      message: "Auto-release must be 7 days or less.",
      path: ["autoApproveDays"],
    },
  );

export type AssetFormInput = z.infer<typeof assetFormSchema>;

export const profileSettingsSchema = z.object({
  /** Loose E.164: Twilio rejects the rest, we only stop obvious junk. */
  phone: trimmed(LIMITS.phone)
    .regex(/^$|^\+?[0-9 ()\-.]{7,}$/, "Enter a valid phone number.")
    .optional()
    .default("")
    .transform((value) => (value ? value : null)),
  notificationEmail: z.boolean().default(false),
  notificationSms: z.boolean().default(false),
});

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Passwords must be at least 8 characters.")
    .max(72, "Passwords must be at most 72 characters."),
});

export const collectionNameSchema = trimmed(LIMITS.name).min(
  1,
  "Collection name is required.",
);

export const uuidSchema = z.uuid("That record could not be found.");

/** Map a ZodError onto `{ field: message }` for inline form errors. */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }

  return fieldErrors;
}

/**
 * Parse or throw an `AppError` carrying the first message plus per-field
 * errors, so actions can render them inline without leaking internals.
 */
export function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
  fallbackMessage = "Please check the form and try again.",
): z.infer<Schema> {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const fieldErrors = fieldErrorsFromZod(result.error);
  const firstMessage = result.error.issues[0]?.message ?? fallbackMessage;

  throw new AppError(firstMessage, { fieldErrors });
}

/** FormData helpers -- keep the `String(formData.get(...))` noise in one place. */
export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readOptionalUuid(
  formData: FormData,
  key: string,
): string | undefined {
  const value = readString(formData, key).trim();
  return value ? value : undefined;
}

export function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function readStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}
