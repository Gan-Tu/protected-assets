import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import {
  LIMITS,
  accessRequestSchema,
  assetFormSchema,
  parseOrThrow,
  profileSettingsSchema,
  protectedUrlSchema,
} from "@/lib/validation";

describe("protectedUrlSchema", () => {
  it("accepts http and https", () => {
    expect(protectedUrlSchema.safeParse("https://example.com/a").success).toBe(
      true,
    );
    expect(protectedUrlSchema.safeParse("http://example.com").success).toBe(true);
  });

  it("rejects script-bearing and non-web schemes", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "file:///etc/passwd",
      "not a url",
    ]) {
      expect(protectedUrlSchema.safeParse(url).success).toBe(false);
    }
  });

  it("rejects absurdly long URLs", () => {
    const long = `https://example.com/${"a".repeat(LIMITS.url)}`;
    expect(protectedUrlSchema.safeParse(long).success).toBe(false);
  });
});

describe("accessRequestSchema", () => {
  it("normalizes the email and trims text", () => {
    const parsed = accessRequestSchema.parse({
      slug: " deck ",
      requesterName: "  Ada Lovelace ",
      requesterEmail: "  Ada@Example.COM ",
      reason: " I need it ",
    });

    expect(parsed).toEqual({
      slug: "deck",
      requesterName: "Ada Lovelace",
      requesterEmail: "ada@example.com",
      reason: "I need it",
    });
  });

  it("rejects an oversized reason", () => {
    const result = accessRequestSchema.safeParse({
      slug: "deck",
      requesterName: "Ada",
      requesterEmail: "ada@example.com",
      reason: "x".repeat(LIMITS.reason + 1),
    });

    expect(result.success).toBe(false);
  });

  it("requires a real email", () => {
    const result = accessRequestSchema.safeParse({
      slug: "deck",
      requesterName: "Ada",
      requesterEmail: "not-an-email",
      reason: "please",
    });

    expect(result.success).toBe(false);
  });
});

describe("assetFormSchema", () => {
  const base = {
    name: "Investor deck",
    slug: "",
    description: "",
    groupId: null,
    newGroupName: "",
    links: ["https://example.com"],
    replaceFiles: false,
    autoApproveEnabled: true,
    autoApproveDays: "1",
    autoApproveHours: "2",
    autoApproveMinutes: "3",
    autoApproveSeconds: "4",
    releaseNote: "",
  };

  it("sums the delay fields into seconds", () => {
    const parsed = assetFormSchema.parse(base);
    expect(parsed.autoApproveDelaySeconds).toBe(
      1 * 86400 + 2 * 3600 + 3 * 60 + 4,
    );
  });

  it("zeroes the delay when auto-release is off", () => {
    const parsed = assetFormSchema.parse({
      ...base,
      autoApproveEnabled: false,
    });
    expect(parsed.autoApproveDelaySeconds).toBe(0);
  });

  it("never lets an enabled timer round down to zero", () => {
    const parsed = assetFormSchema.parse({
      ...base,
      autoApproveDays: "0",
      autoApproveHours: "0",
      autoApproveMinutes: "0",
      autoApproveSeconds: "0",
    });
    expect(parsed.autoApproveDelaySeconds).toBe(1);
  });

  it("rejects a delay beyond the scheduler's ceiling", () => {
    const result = assetFormSchema.safeParse({ ...base, autoApproveDays: "30" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-web link", () => {
    const result = assetFormSchema.safeParse({
      ...base,
      links: ["javascript:alert(1)"],
    });
    expect(result.success).toBe(false);
  });

  it("treats a garbage group id as no group rather than failing", () => {
    const parsed = assetFormSchema.parse({ ...base, groupId: "nope" });
    expect(parsed.groupId).toBeNull();
  });
});

describe("profileSettingsSchema", () => {
  it("stores an empty phone as null", () => {
    expect(profileSettingsSchema.parse({ phone: "   " }).phone).toBeNull();
  });

  it("accepts common phone formats", () => {
    expect(profileSettingsSchema.parse({ phone: "+1 (415) 555-0123" }).phone).toBe(
      "+1 (415) 555-0123",
    );
  });

  it("rejects obvious junk", () => {
    expect(profileSettingsSchema.safeParse({ phone: "call me" }).success).toBe(
      false,
    );
  });
});

describe("parseOrThrow", () => {
  it("raises an AppError carrying per-field messages", () => {
    try {
      parseOrThrow(accessRequestSchema, {
        slug: "deck",
        requesterName: "",
        requesterEmail: "bad",
        reason: "",
      });
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      const fieldErrors = (error as AppError).fieldErrors ?? {};
      expect(Object.keys(fieldErrors).sort()).toEqual([
        "reason",
        "requesterEmail",
        "requesterName",
      ]);
    }
  });
});
